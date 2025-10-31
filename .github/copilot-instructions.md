# PeerPrep G30 UI Service - AI Coding Agent Instructions

## Project Overview
PeerPrep is a microservices-based collaborative interview prep platform. This is the **ui-service** frontend (Next.js 16 App Router with React 19, TypeScript strict mode).

**Microservices**: Each service lives at repository root in separate folders:
- `ui-service/` - Next.js 16 frontend (this service)
- `user-service/` - Node.js/Express user management API
- `matching-service/` - Go-based user matching service
- `question-service/` - Node.js/Express question database
- `collab-service/` - Y.js WebSocket server for real-time collaborative editing

## Development Commands
```bash
cd ui-service
npm run dev    # Start dev server with Turbopack
npm run build  # Production build with Turbopack
npm run lint   # ESLint with Next.js TypeScript config
```

**No test framework configured** - needs setup if required.

## Critical Architecture Patterns

### Authentication System (Complete Implementation)
**Full auth flow is implemented** - see `AGENTS.md` for complete details. Key files:
- `lib/config.ts` - Unified env vars (designed for Google Cloud Secret Manager migration)
- `lib/session.ts` - JWT encryption, HTTP-only cookies with `jose` library
- `lib/dal.ts` - Data Access Layer for all authorization checks
- `lib/schemas.ts` - Zod validation schemas for all forms
- `app/actions/auth.ts` - Server Actions for auth operations
- `proxy.ts` - Route protection middleware (optimistic cookie-based checks)
- `lib/userServiceClient.ts` - Type-safe API client for user-service

**Auth patterns**:
```tsx
// Protected Server Component
import { getCurrentUser } from '@/lib/useCurrentUser';
const user = await getCurrentUser(); // Throws if not authenticated

// Client Component with Server Action
'use client';
import { signUp } from '@/app/actions/auth';
import { useActionState } from 'react';

const [state, action, pending] = useActionState(signUp, undefined);
// Use: <form action={action}>...</form>
```

**Route protection**: `/home`, `/match`, `/profile`, `/settings` are auto-protected by `proxy.ts`. Use `verifyAuth()` or `requireAuth()` from `lib/dal.ts` for server-side checks.

### Server Actions Pattern (React 19)
All mutations use Server Actions with `useActionState` hook:
```tsx
'use client';
import { useActionState } from 'react';
import { myAction } from '@/app/actions/myAction';

const [state, formAction, isPending] = useActionState(myAction, undefined);
// state.errors contains validation errors
// isPending indicates submission state
```

**Server Action structure** (`app/actions/*.ts`):
```typescript
'use server';
export async function myAction(prevState: FormState | undefined, formData: FormData) {
  // 1. Validate with Zod schema
  // 2. Check auth with requireAuth() from lib/dal.ts
  // 3. Call external service via client (e.g., userServiceClient)
  // 4. Update session if needed
  // 5. Return { success: boolean, errors?: Record<string, string[]> }
}
```

### Multi-Step Forms with Framer Motion
See `app/login/page.tsx` for canonical pattern:
- Parent manages shared state and view transitions
- Child view components receive props and callbacks
- Use `useRef` to track previous view for animation direction
- Wrap views in `AnimatePresence` with `mode="wait"`
- Animation pattern: `initial={{ x: offset, opacity: 0 }}` → `animate={{ x: 0, opacity: 1 }}`

### Code Style & TypeScript

**Critical conventions**:
- **Path aliases**: Always use `@/` (e.g., `@/components/ui/button`, `@/lib/utils`)
- **'use client' directive**: Required at top of file for hooks, events, browser APIs, framer-motion
- **'use server' directive**: Required at top of Server Action files
- **Strict TypeScript**: Define interfaces for component props (e.g., `interface MyComponentProps`)
- **File naming**: PascalCase for components, camelCase for utilities
- **Quote style**: Single quotes for imports, double quotes in JSX attributes

**Import order**: React → Next.js → third-party libs → local components/utils

### Styling with Tailwind & shadcn/ui

**Key utilities**:
- `cn()` from `@/lib/utils` - Merges Tailwind classes with conditional logic
- `cva` from `class-variance-authority` - Defines component variants (see `components/ui/button.tsx`)
- Icons: Always use `lucide-react` (e.g., `import { Settings } from 'lucide-react'`)

**shadcn/ui config**: Style is "new-york", RSC enabled, uses Radix UI primitives + Tailwind CSS 4 variables in `app/globals.css`

**Adding components**: `npx shadcn@latest add [component-name]` (installs to `components/ui/`)

**Component composition**: UI components support `asChild` prop with `@radix-ui/react-slot` for flexibility

### UI Component Architecture
- **Slots pattern**: Components support `asChild` prop with `@radix-ui/react-slot` for composition
- **Data attributes**: Use `data-slot="button"` pattern for component identification (see `button.tsx`)
- **Conditional navbar**: `LayoutContent.tsx` hides navbar on `/login` route using `usePathname()`
- **Root layout**: Server component in `layout.tsx` wraps client-side `LayoutContent`
- **Fonts**: Geist Sans and Geist Mono loaded via `next/font/google` with CSS variables

### Monaco Editor & Collaboration (Prepared for Integration)
- `CodeEditor.tsx` wraps `@monaco-editor/react` with EOL normalization (LF)
- Prepared for Y.js integration: `sessionId`, `userId`, `onEditorReady` props exist but unused
- `lib/yjs-setup.ts` is empty - placeholder for future WebSocket provider setup
- See `app/match/[matchID]/page.tsx` for integration comments

## File Organization
```
ui-service/
├── app/                    # Next.js App Router
│   ├── actions/            # Server Actions (auth.ts, profile.ts)
│   ├── login/              # Multi-step login flow (SignupView, OtpVerificationView, etc.)
│   ├── match/[matchID]/    # Collaborative editor page
│   ├── profile/[username]/ # User profiles
│   ├── layout.tsx          # Root layout (wraps LayoutContent client component)
│   ├── LayoutContent.tsx   # Client wrapper for conditional navbar
│   └── globals.css         # Tailwind base + theme variables
├── components/
│   ├── ui/                 # shadcn/ui components (button, dialog, etc.)
│   └── *.tsx               # Feature components (Navbar, CodeEditor, QuestionPanel, etc.)
├── lib/
│   ├── config.ts           # Environment variable management
│   ├── session.ts          # JWT encryption & cookie handling
│   ├── dal.ts              # Data Access Layer (auth checks)
│   ├── schemas.ts          # Zod validation schemas
│   ├── userServiceClient.ts # API client for user-service
│   └── utils.ts            # cn() utility for Tailwind
├── types/                  # TypeScript interfaces (auth.ts, programming.ts, social.ts)
├── proxy.ts                # Route protection middleware
└── next.config.ts          # Standalone output for containerization
```

## External Service Integration

**User Service** (`lib/userServiceClient.ts`):
- Base URL: `process.env.NEXT_PUBLIC_USER_SERVICE_URL` (default: `http://localhost:3001/api/users`)
- Methods: `registerUser()`, `loginUser()`, `verifyOtp()`, `resetPassword()`, etc.
- Error handling: Throws `UserServiceError` with status codes

**Future integrations**:
- Question Service: For fetching interview questions (mock data in `match/[matchID]/page.tsx`)
- Matching Service: WebSocket/polling for match found events (TODO in `home/page.tsx`)
- Collab Service: Y.js WebSocket provider for real-time code editing (prepared but not connected)

## Environment Variables
Required vars (see `.env.example`):
- `SESSION_SECRET` - JWT signing key (auto-generated fallback in dev)
- `NEXT_PUBLIC_USER_SERVICE_URL` - User service API endpoint
- `SESSION_EXPIRES_IN_DAYS` - Session duration (default: 7)

Config centralized in `lib/config.ts` for easy Secret Manager migration.

## Common Tasks

### Adding a new shadcn/ui component
```bash
npx shadcn@latest add [component-name]
```
This installs to `components/ui/` with proper Tailwind configuration.

### Creating a new page with animations
1. Create route folder in `app/` with `page.tsx` (mark `'use client'` if interactive)
2. Use `AnimatedView` component for slide transitions between views
3. Follow the multi-step form pattern if tracking multiple sub-views

### Adding icons
Import from `lucide-react`, they automatically size with `[&_svg]:size-4` in button variants.

### Creating Server Actions for forms
1. Define Zod schema in `lib/schemas.ts`
2. Create action in `app/actions/` with `'use server'` directive
3. Use `useActionState` hook in client component
4. Access errors via `state.errors.fieldName`

## Common Pitfalls
- **Don't bypass auth checks**: Always use `verifyAuth()` or `requireAuth()` from `lib/dal.ts` in Server Actions/Components
- **Don't forget 'use client'**: Required for hooks (useState, useActionState, etc.) and framer-motion
- **Don't forget 'use server'**: Required at top of Server Action files
- **Don't mix quote styles**: Single quotes for imports, double for JSX
- **Don't skip `cn()`**: Use it instead of template literals for conditional Tailwind classes
- **Server Actions need FormData**: Use `new FormData()` or `<form action={action}>` pattern
- **Don't hardcode sizes**: Use existing button/component variants before adding custom sizing

## Next Steps for Development
- Set up test framework (Jest + React Testing Library)
- Connect Y.js WebSocket provider to collab-service
- Integrate question-service API
- - Configure matching-service WebSocket listeners
