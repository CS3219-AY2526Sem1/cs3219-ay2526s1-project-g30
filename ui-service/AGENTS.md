# Agent Guidelines for PeerPrep G30 UI Service

## Commands
- **Dev**: `npm run dev` (uses Turbopack)
- **Build**: `npm run build` (uses Turbopack)
- **Lint**: `npm run lint` (ESLint with Next.js TypeScript config)
- **No test commands** defined in package.json

## Code Style
- **Framework**: Next.js 16 App Router, React 19, TypeScript (strict mode)
- **Imports**: Use `@/` path alias (e.g., `@/components/ui/button`), organize as React, Next.js, then local components
- **Client components**: Add `'use client'` directive at top when using hooks/interactivity
- **Styling**: Tailwind CSS 4 with `cn()` utility from `@/lib/utils` for className merging
- **Components**: shadcn/ui + Radix UI primitives, use `cva` for variant-based styling
- **Naming**: PascalCase for components/files, camelCase for variables/functions, kebab-case for CSS
- **Types**: Define interfaces for component props (e.g., `interface ComponentNameProps`), enable TypeScript strict mode
- **Icons**: Use `lucide-react` for icons
- **Formatting**: Semicolons required, single quotes for imports, double quotes in JSX
- **Error handling**: No specific patterns observed; follow standard React error boundaries if needed

## Notes
- No existing test framework detected
- Uses framer-motion for animations, next-themes for theme switching
- Path resolution configured for `@/*` -> `./*`
