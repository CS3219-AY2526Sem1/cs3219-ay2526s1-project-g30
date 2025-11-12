// main.go

package main

import (
	"fmt"
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

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Info().Msgf("Matching service started successfully. Listening on 0.0.0.0:%s...", port)
	router.Run(fmt.Sprintf("0.0.0.0:%s", port))
}