# README

Matching service part of PeerPrep, implemented in Golang.

## Run

```bash
go run .
```

## AI usage

- Tools: Gemini 2.5 Pro (Web App & Roo Code Plugin)
- Prohibited phases avoided
  - requirements elicitation
  - architecture/designation
  - generate prototype without complete architecture design *and* pseudo code
- Allowed uses
  - refactor correct functions to be more readable
  - implement simple prototype based on my architecture/designation
  - generate proper English comments
- Verification: Reviewed, edited/modified, validated and tested by the author (me).

See `/ai/usage-log.md` for key exchanges.
