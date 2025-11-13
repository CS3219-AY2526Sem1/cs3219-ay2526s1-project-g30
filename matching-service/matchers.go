// matcher.go
// AI Assistance Disclosure:
// Tool: Gemini (model: Gemini 2.5 Pro), date: 2025‑10-09, etc.
// Scope: Implemented `findFirstCommonLang()` based on my architecture and pseudo-code
// and explained `map` operations in Golang to me.
// Author review: Validated correctness.

package main

type Matcher interface {
	FindMatch(newUser *WaitingUser, pool map[string][]*WaitingUser) (*WaitingUser, string)
}

type AbsoluteMatcher struct{}

func findFirstCommonLang(list1 []string, list2 []string) (string, bool) {
	set := make(map[string]struct{}, len(list1))
	for _, lang := range list1 {
		set[lang] = struct{}{}
	}

	for _, lang := range list2 {
		if _, found := set[lang]; found {
			return lang, true // Found a common language
		}
	}
	return "", false // No common language found
}

func (m *AbsoluteMatcher) FindMatch(newUser *WaitingUser, pool map[string][]*WaitingUser) (*WaitingUser, string) {
	key := createMatchKey(newUser.Info.Difficulty, newUser.Info.Topic)

	opponents := pool[key]
	if len(opponents) == 0 {
		return nil, "" // No one is waiting
	}

	for _, opponent := range opponents {
		if commonLang, found := findFirstCommonLang(newUser.Info.PreferredProgrammingLang, opponent.Info.PreferredProgrammingLang); found {
			// Found a match
			return opponent, commonLang
		}
	}

	return nil, ""
}
