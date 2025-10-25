// dummy_collab_service.go

package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// This struct must match the one our Matching Service sends
type CollaborationRequest struct {
	User1ID         string `json:"user1Id"`
	User2ID         string `json:"user2Id"`
	QuestionID      string `json:"questionId"`
	SessionID       string `json:"sessionId"`
	ProgrammingLang string `json:"programmingLang"`
}

func main() {
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	// This dummy service listens for POST requests to create a session
	router.POST("/api/v1/sessions", func(c *gin.Context) {
		var req CollaborationRequest

		// Bind the incoming JSON to our struct
		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}

		// Print a detailed log to confirm we received all data correctly
		fmt.Printf("[Dummy Collab Service] Received request to create session:\n")
		fmt.Printf("  - SessionID: %s\n", req.SessionID)
		fmt.Printf("  - Users: %s, %s\n", req.User1ID, req.User2ID)
		fmt.Printf("  - QuestionID: %s\n", req.QuestionID)
		fmt.Printf("  - Language: %s\n", req.ProgrammingLang)
		fmt.Println("-------------------------------------------------")

		// Return a simple success response
		c.JSON(http.StatusOK, gin.H{
			"status":    "session created",
			"sessionId": req.SessionID,
		})
	})

	fmt.Println("[Dummy Collab Service] Starting up and listening on http://localhost:8082")
	router.Run("localhost:8082")
}
