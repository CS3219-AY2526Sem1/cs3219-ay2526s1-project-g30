// matcher.go

package main

type Matcher interface {
	FindMatch(newUser *WaitingUser, pool map[string][]*WaitingUser) (*WaitingUser, string) // CHANGED: Return type
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
			// Found a match!
			return opponent, commonLang
		}
	}

	return nil, ""
}
