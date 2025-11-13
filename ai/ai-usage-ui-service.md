# AI Usage for Question Service

file /ai/usage-log-ui-service.md.

## Dates

2025‑10-26, 2025‑10-31, 2025‑11-11 (among others)

## Tools

GitHub Copilot
sst/opencode
Zed

## Models

Claude Haiku 4.5
Claude Sonnet 4.5
Polaris Alpha (stealth model name, actual model not known as of time of writing)

## Prompt/Command

Prompts containing written component/interface specifications were given, alongside a high-level overview of the purpose of the component or modification to be made. This was in addition to a code style instruction prompt, which was injected by the tools into the model's system prompt. This code style prompt can be found at the bottom of this file.

Actual implementation was partially generated for nearly every non-imported component of the UI service, with additional manual tweaks and fine-tuning made.

Debugging was often done alongside assistance from models (usually Claude Haiku 4.5), occasionally in agentic mode with supervision.

### Example

```
Create a ChatMessage component for the chat panel, according to these requirements:
- Client compnent
- Responsibility: render a single chat message with user information, timestamp, and formatted content
- Props interface:

interface ChatMessageProps {
  id: string              // Unique message identifier
  userId: string          // User who sent the message
  username: string        // Display name of the user
  content: string         // Message text (supports Markdown)
  timestamp: Date         // Message creation time
  isCurrentUser?: boolean // Whether message is from current user (default: false)
  avatar?: string         // URL to user's avatar image (optional)
  isSending?: boolean     // Whether message is currently being sent (default: false)
}

Here are the functional requirements:
- Layout + positioning
  - Messages from current user align right
  - Messages from other user align left
  - Maintain consistent gap spacing between elements
- User information display
  - Positioned above chat message bubble
  - Displays avatar, username, message timestamp
  - Element order, left-to-right:
    - Current user: timestamp -> "You" -> avatar
    - Other users: avatar -> username -> timestamp
- Timestamp formatting
  - Display format: HH:MM (24-hour time)
  - Show "Sending..." in place of timestamp when isSending is true
  - Handle date object conversion
- Message content
  - Render using the MarkdownRenderer component
  - Dark background for current user, light background for other users
  - Standard colors and padding as specified in styles directory
  - Rounded corners
- Sending state variant (when isSending is true)
  - Show spinner next to timestamp for current user
  - Reduce message opacity to 60%

Use the component library provided in /components/ui to construct this component.
```

## Output Summary

Generated code snippets for the specified components and backend functions, mostly following the specifications laid out in the prompt.

## Actions Taken

Input was usually accepted, and modified afterwards. Some generations were outright rejected due to failure to follow specified prompting, or failures in tool call execution leading to broken states (e.g. misplaced closing tags, large duplications of blocks of code).

## Author Notes

AI code generation was heavily used in the implementation of this service, which resulted in a signficant amount of conversations. As such, this is a general summary of the method of LLM usage within the UI service.

## Code Style Prompt

```
---
applyTo: '**'
---
Unless told otherwise, if responding in English, use British English spelling conventions.

When writing code, try to follow the following conventions:
- Use descriptive variable naming. This means:
    - Don't abbreviate names
    - Don't put types in variable names
    - Add units to variables unless the type tells you
    - Don't put types in types (e.g. AbstractX, BaseX)
    - Refactor if code is being named "Utils"
- Code should be as self-documenting as possible, and comments should be used to explain *why* code is written in some way (i.e. act as documentation), instead of explaining how it works. This means:
    - Use descriptive variable naming, as mentioned earlier
    - Avoid magic numbers; if unavoidable, try creating named constants instead
    - If code is complex enough that it warrants a comment, see if simplification or refactoring is possible
    - Use more specific types, where applicable or appropriate
    - Exceptions include: non-obvious performance optimisations, and references to math or algorithms
- Use the One True Brace Style of indentation, and avoid nesting code too deeply - try not to go over 4 levels of indentation deep from the point of function declaration.
    - Use extraction or early returns to reduce the level of indentation needed.
- For indentation, use 2 spaces per indentation level. Do not use tabs.
- Prefer composition over inheritance, and use dependency injection where appropriate.

Avoid deviating from these conventions unless explicitly told to, or if the existing codebase has an existing established code style convention.
```
