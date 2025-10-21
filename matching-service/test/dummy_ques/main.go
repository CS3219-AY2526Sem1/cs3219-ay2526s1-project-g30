// dummy_question_service.go

package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// Use release mode for cleaner logs
	gin.SetMode(gin.ReleaseMode)

	router := gin.Default()

	// This dummy service listens on the exact endpoint our Matching Service calls
	router.GET("/api/v1/questions/random", func(c *gin.Context) {
		// Extract query parameters from the request URL
		difficulty := c.Query("difficulty")
		topic := c.Query("topic")
		user1 := c.Query("user1")
		user2 := c.Query("user2")

		// Print a log to confirm we received the request correctly
		fmt.Printf("[Dummy Question Service] Received request: difficulty=%s, topic=%s, user1=%s, user2=%s\n",
			difficulty, topic, user1, user2)

		// Create a dynamic, fake question ID to send back
		questionID := fmt.Sprintf("q-%s-%s-from-dummy-service", topic, difficulty)

		// Return a 200 OK response with the question ID in JSON format
		c.JSON(http.StatusOK, gin.H{
			"questionId": questionID,
		})
	})

	fmt.Println("[Dummy Question Service] Starting up and listening on http://localhost:8081")
	// Run this service on a different port
	router.Run("localhost:8081")
}
