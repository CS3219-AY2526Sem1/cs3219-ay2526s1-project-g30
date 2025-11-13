// tyoes.go
package main

type MatchRequest struct {
	UserID                   string   `json:"userId"`
	Difficulty               string   `json:"difficulty"`
	Topic                    string   `json:"topic"`
	PreferredProgrammingLang []string `json:"preferredProgrammingLang"`
}

type MatchResult struct {
	SessionID       string `json:"sessionId"`
	QuestionID      string `json:"questionId"`
	User1ID         string `json:"user1Id"`
	User2ID         string `json:"user2Id"`
	ProgrammingLang string `json:"programmingLang"`
}

type WaitingUser struct {
	Info       MatchRequest
	NotifyChan chan MatchResult
}

// HACK: temply change `questionId` to `id` for ques compatibility
type QuestionResponse struct {
	QuestionID string `json:"id"`
}

// HACK: temply change `userxId` to `userx` for collab compatibility
type CollaborationRequest struct {
	// User1ID    string `json:"user1Id"`
	// User2ID    string `json:"user2Id"`
	User1ID         string `json:"user1"`
	User2ID         string `json:"user2"`
	QuestionID      string `json:"questionId"`
	SessionID       string `json:"sessionId"`
	ProgrammingLang string `json:"programmingLang"`
}

type CancelRequest struct {
	UserID string `json:"userId"`
}
