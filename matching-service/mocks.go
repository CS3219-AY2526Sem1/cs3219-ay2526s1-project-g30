package main

import (
	"github.com/rs/zerolog/log"
)

// NOTE: Mock External Services
// HACK: Replace it with real function

func getMockQuestion(difficulty string, topic string) string {
	log.Info().Str("difficulty", difficulty).Str("topic", topic).Msg("Fetching mock question...")
	return "q-" + topic + "-" + difficulty + "-001"
}

// createMockSession now simulates registering a session with a pre-generated ID.
func createMockSession(user1ID string, user2ID string, questionID string, sessionID string) {
	// In a real-world scenario, this would be an HTTP request to tell the Collaboration Service
	// to set up a session with this specific ID.
	log.Info().
		Str("user1Id", user1ID).
		Str("user2Id", user2ID).
		Str("questionId", questionID).
		Str("sessionId", sessionID). // Log the session ID it received.
		Msg("Informing collaboration service to create session...")
}
