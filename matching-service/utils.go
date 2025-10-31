// utils.go

package main

import (
	"strings"
)

func createMatchKey(difficulty, topic string) string {
	d := strings.ToLower(difficulty)
	t := strings.ToLower(topic)

	// Trim leading/trailing whitespace
	d = strings.TrimSpace(d)
	t = strings.TrimSpace(t)

	// This is the key part for your insight:
	// Split the topic by any amount of whitespace
	topicFields := strings.Fields(t)

	// Join the fields back together with a single hyphen
	t = strings.Join(topicFields, "-")

	// Return the final canonical key
	return d + "-" + t
}
