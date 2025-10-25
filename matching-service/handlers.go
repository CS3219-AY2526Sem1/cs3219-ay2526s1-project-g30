package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func createMatchHandler(service *MatchingService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req MatchRequest
		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		resultChan := service.ProcessMatchRequest(req)

		select {
		case result := <-resultChan:
			if result.SessionID == "" {
				c.JSON(http.StatusRequestTimeout, gin.H{
					"status":  "timeout",
					"message": "No match found within the time limit.",
				})
			} else {
				c.JSON(http.StatusOK, gin.H{
					"status":  "success",
					"message": "Match found!",
					"data":    result,
				})
			}
		case <-c.Done():
			log.Warn().Str("userId", req.UserID).Msg("Client disconnected before a result was sent.")
			return
		}
	}
}
