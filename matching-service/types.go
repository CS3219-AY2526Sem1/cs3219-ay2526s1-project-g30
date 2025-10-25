package main

type MatchRequest struct {
	UserID     string `json:"userId"`
	Difficulty string `json:"difficulty"`
	Topic      string `json:"topic"`
	PreferredProgrammingLang []string `json:"preferredProgrammingLang"`
}

type MatchResult struct {
	SessionID  string `json:"sessionId"`
	QuestionID string `json:"questionId"`
	User1ID    string `json:"user1Id"`
	User2ID    string `json:"user2Id"`
	ProgrammingLang string `json:"programmingLang"`
}

type WaitingUser struct {
	Info       MatchRequest
	NotifyChan chan MatchResult
}

type QuestionResponse struct {
	QuestionID string `json:"questionId"`
}

type CollaborationRequest struct {
	User1ID    string `json:"user1Id"`
	User2ID    string `json:"user2Id"`
	QuestionID string `json:"questionId"`
	SessionID  string `json:"sessionId"`
	ProgrammingLang string `json:"programmingLang"`
}
