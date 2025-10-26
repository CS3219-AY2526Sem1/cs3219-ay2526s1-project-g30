// service.go

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
)

type MatchingService struct {
	mutex       sync.Mutex
	waitingPool map[string][]*WaitingUser // CHANGED: value is now a slice of pointers
	matcher     Matcher
}

// NewMatchingService constructor is updated for the new waitingPool type.
func NewMatchingService(matcher Matcher) *MatchingService {
	return &MatchingService{
		waitingPool: make(map[string][]*WaitingUser),
		matcher:     matcher,
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getQuestionFromService(difficulty string, topic string, user1ID string, user2ID string) (string, error) {
	// HACK: temply change api fmt for ques compatibility
	baseURL := getEnv("QUESTION_SERVICE_URL", "http://localhost:8081")
	// url := fmt.Sprintf("%s/api/v1/questions/random?difficulty=%s&topic=%s&user1=%s&user2=%s", baseURL, difficulty, topic, user1ID, user2ID)
	// Ques service use `category` instead of `topic`. We need to reach a cons
	url := fmt.Sprintf("%s/questions/randomQuestion?difficulty=%s&category=%s&user1=%s&user2=%s", baseURL, difficulty, topic, user1ID, user2ID)

	log.Info().Str("url", url).Msg("Requesting question from Question Service...")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		log.Error().Err(err).Msg("Failed to send request to Question Service")
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		err := fmt.Errorf("question service returned non-200 status: %d", resp.StatusCode)
		return "", err
	}
	var target QuestionResponse
	if err := json.NewDecoder(resp.Body).Decode(&target); err != nil {
		log.Error().Err(err).Msg("Failed to decode response from Question Service")
		return "", err
	}
	log.Info().Str("questionId", target.QuestionID).Msg("Successfully received question")
	return target.QuestionID, nil
}

func informCollaborationService(payload CollaborationRequest) error {
	baseURL := getEnv("COLLAB_SERVICE_URL", "http://localhost:8082")
	// HACK: temply rm `v1` for collab compatibility
	// url := fmt.Sprintf("%s/api/v1/sessions", baseURL)
	url := fmt.Sprintf("%s/api/session", baseURL)
	
	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Error().Err(err).Msg("Failed to marshal request for Collaboration Service")
		return err
	}
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Error().Err(err).Msg("Failed to create request for Collaboration Service")
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Error().Err(err).Msg("Failed to send request to Collaboration Service")
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("collaboration service returned non-2xx status: %d", resp.StatusCode)
	}
	log.Info().Str("sessionId", payload.SessionID).Msg("Successfully informed Collaboration Service")
	return nil
}

func (s *MatchingService) ProcessMatchRequest(req MatchRequest) chan MatchResult {
	resultChan := make(chan MatchResult, 1)

	go func() {
		newUser := &WaitingUser{
			Info:       req,
			NotifyChan: resultChan,
		}

		s.mutex.Lock()
		key := req.Difficulty + "-" + req.Topic

		if opponent, chosenLang := s.matcher.FindMatch(newUser, s.waitingPool); opponent != nil {
			log.Info().Str("user1Id", newUser.Info.UserID).Str("user2Id", opponent.Info.UserID).Str("language", chosenLang).Msg("Match found")

			// Remove the opponent from the waiting slice.
			opponents := s.waitingPool[key]
			for i, user := range opponents {
				if user.Info.UserID == opponent.Info.UserID {
					s.waitingPool[key] = append(opponents[:i], opponents[i+1:]...)
					break
				}
			}
			s.mutex.Unlock()

			questionID, err := getQuestionFromService(req.Difficulty, req.Topic, req.UserID, opponent.Info.UserID)
			if err != nil {
				opponent.NotifyChan <- MatchResult{}
				resultChan <- MatchResult{}
				return
			}

			sessionID := uuid.NewString()

			collabPayload := CollaborationRequest{
				User1ID:         req.UserID,
				User2ID:         opponent.Info.UserID,
				QuestionID:      questionID,
				SessionID:       sessionID,
				ProgrammingLang: chosenLang,
			}
			if err := informCollaborationService(collabPayload); err != nil {
				opponent.NotifyChan <- MatchResult{}
				resultChan <- MatchResult{}
				return
			}

			// Add the chosen language to the final result.
			result := MatchResult{
				SessionID:       sessionID,
				QuestionID:      questionID,
				User1ID:         req.UserID,
				User2ID:         opponent.Info.UserID,
				ProgrammingLang: chosenLang,
			}

			opponent.NotifyChan <- result
			resultChan <- result
			return
		}

		// If no match was found, add the current user to the waiting slice.
		log.Info().Str("userId", newUser.Info.UserID).Str("key", key).Msg("User added to the waiting pool")
		s.waitingPool[key] = append(s.waitingPool[key], newUser)
		s.mutex.Unlock()

		select {
		case <-resultChan:
			log.Info().Str("userId", req.UserID).Msg("User was successfully matched by another user. Exiting wait.")
			return
		case <-time.After(30 * time.Second):
			s.mutex.Lock()
			key_timeout := req.Difficulty + "-" + req.Topic

			if users, found := s.waitingPool[key_timeout]; found {
				for i, user := range users {
					if user.Info.UserID == req.UserID {
						s.waitingPool[key_timeout] = append(users[:i], users[i+1:]...)
						log.Info().Str("userId", req.UserID).Msg("User timed out and was removed from the pool.")
						resultChan <- MatchResult{}
						break
					}
				}
			}
			s.mutex.Unlock()
		}
	}()

	return resultChan
}
