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