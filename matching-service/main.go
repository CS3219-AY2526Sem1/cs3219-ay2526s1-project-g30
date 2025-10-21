// main.go

package main

import (
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339})
	zerolog.SetGlobalLevel(zerolog.InfoLevel)

	gin.SetMode(gin.ReleaseMode)

	matcher := &AbsoluteMatcher{}
	service := NewMatchingService(matcher)

	router := gin.Default()
	router.POST("/api/v1/match", createMatchHandler(service))

	log.Info().Msg("Matching service started successfully. Listening on localhost:8080...")
	router.Run("localhost:8080")
}
