// service.go

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
)

type MatchingService struct {
	mutex       sync.Mutex
	waitingPool map[string][]*WaitingUser // CHANGED: value is now a slice of pointers
	userIndex   map[string]*WaitingUser
	matcher     Matcher
}

// NewMatchingService constructor is updated for the new waitingPool type.
func NewMatchingService(matcher Matcher) *MatchingService {
	return &MatchingService{
		waitingPool: make(map[string][]*WaitingUser),
		userIndex:   make(map[string]*WaitingUser),
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
	baseURL := getEnv("QUESTION_SERVICE_URL", "http://localhost:8081")

	parsedURL, err := url.Parse(baseURL)
	if err != nil {
		log.Error().Err(err).Str("base_url", baseURL).Msg("Failed to parse base URL for Question Service")
		return "", err
	}

	// 3. Set the path for the specific endpoint
	parsedURL.Path = "/questions/randomQuestion" // Or whatever the correct path is

	// 4. Create a new set of query parameters
	params := url.Values{}
	params.Add("difficulty", difficulty)
	params.Add("category", topic) // url.Values.Add() will automatically encode this!
	params.Add("user1", user1ID)
	params.Add("user2", user2ID)

	// 5. Encode the parameters and add them to the URL
	parsedURL.RawQuery = params.Encode()

	// 'finalURL' is now guaranteed to be correctly encoded
	// (e.g., "...&topic=data+structures&...")
	finalURL := parsedURL.String()

	log.Info().Str("url", finalURL).Msg("Requesting question from Question Service...")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(finalURL)
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

func (s *MatchingService) CancelMatchRequest(userID string) bool {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	user, found := s.userIndex[userID]
	if !found {
		log.Warn().Str("userId", userID).Msg("User tried to cancel, but was not in the pool.")
		return false
	}

	delete(s.userIndex, userID)

	key := createMatchKey(user.Info.Difficulty, user.Info.Topic)
	if users, found := s.waitingPool[key]; found {
		for i, u := range users {
			if u.Info.UserID == userID {
				s.waitingPool[key][i] = s.waitingPool[key][len(users)-1]
				s.waitingPool[key] = s.waitingPool[key][:len(users)-1]

				log.Info().Str("userId", userID).Str("key", key).Msg("User successfully canceled and removed from pool.")

				user.NotifyChan <- MatchResult{} // NOTE: will cause 408
				return true
			}
		}
	}

	log.Error().Str("userId", userID).Msg("CRITICAL: User was in userIndex but not in waitingPool. State was inconsistent.")
	return false
}

func (s *MatchingService) ProcessMatchRequest(req MatchRequest) chan MatchResult {
	resultChan := make(chan MatchResult, 1)

	go func() {
		newUser := &WaitingUser{
			Info:       req,
			NotifyChan: resultChan,
		}

		s.mutex.Lock()

		key := createMatchKey(newUser.Info.Difficulty, newUser.Info.Topic)

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
			delete(s.userIndex, opponent.Info.UserID)
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
		s.userIndex[newUser.Info.UserID] = newUser
		s.mutex.Unlock()

		select {
		case <-resultChan:
			log.Info().Str("userId", req.UserID).Msg("User was successfully matched by another user. Exiting wait.")
			return
		case <-time.After(30 * time.Second):
			s.mutex.Lock()
			key_timeout := createMatchKey(req.Difficulty, req.Topic)

			if users, found := s.waitingPool[key_timeout]; found {
				for i, user := range users {
					if user.Info.UserID == req.UserID {
						s.waitingPool[key_timeout] = append(users[:i], users[i+1:]...)
						delete(s.userIndex, req.UserID)
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
