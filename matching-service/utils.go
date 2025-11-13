// utils.go
// AI Assistance Disclosure:
// Tool: Gemini (model: Gemini 2.5 Pro), date: 2025‑10-23
// Scope: Generated comments
// Author review: Checked.

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

	// Split the topic by any amount of whitespace
	topicFields := strings.Fields(t)

	// Join the fields back together with a single hyphen
	t = strings.Join(topicFields, "-")

	// Return the final canonical key
	return d + "-" + t
}
