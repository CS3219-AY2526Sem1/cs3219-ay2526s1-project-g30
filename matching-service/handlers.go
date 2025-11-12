// handlers.go
// AI Assistance Disclosure:
// Tool: Gemini (model: Gemini 2.5 Pro), date: 2025‑10-05
// Scope: Implemented `createMatchHandler` and `createCancelHandler` prototype
// and polished message strings.
// Author review: Validated correctness and done test.
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
					"status":  "timeout_or_cancelled",
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

func createCancelHandler(service *MatchingService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CancelRequest
		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		if req.UserID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
			return
		}

		if service.CancelMatchRequest(req.UserID) {
			// Successfully found and canceled the request
			c.JSON(http.StatusOK, gin.H{
				"status":  "cancelled",
				"message": "Your match request has been cancelled.",
			})
		} else {
			// User was not in the pool (already matched, timed out, or never existed)
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "not_found",
				"message": "No active match request was found for this user.",
			})
		}
	}
}

