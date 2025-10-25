# PeerPrep G30 - AI Coding Agent Instructions

## Project Overview
PeerPrep is a microservices-based collaborative interview preparation platform. Each microservice lives in its own folder at the repository root (currently: `ui-service/`). This is a CS3219 academic project following a distributed architecture pattern.

## Current Architecture
- **ui-service**: Next.js 16 App Router frontend with React 19, TypeScript strict mode
- **Future services**: Additional microservices will be added as separate root-level folders

## Development Workflow

### UI Service Commands
```bash
cd ui-service
npm run dev      # Start dev server with Turbopack
npm run build    # Production build with Turbopack  
npm run lint     # ESLint with Next.js TypeScript rules
```

**No test framework currently configured** - tests need to be set up if required.

## Code Style & Conventions

### TypeScript & React Patterns
- **Strict TypeScript**: All code uses strict mode, prefer explicit interfaces over inline types
- **Component props pattern**: Define `interface ComponentNameProps` for all components
- **Client components**: Add `'use client'` directive at the top when using hooks, state, or browser APIs
- **File naming**: PascalCase for components/files (e.g., `EmailEntryView.tsx`), camelCase for utilities
- **Import order**: React imports → Next.js imports → third-party libraries → local components/utilities
- **Path aliases**: Always use `@/` for imports (e.g., `@/components/ui/button`, `@/lib/utils`)

### Styling with Tailwind & shadcn/ui
- **Tailwind CSS 4**: Use utility classes directly in JSX
- **Class merging**: Import `cn()` from `@/lib/utils` for conditional className logic
  ```tsx
  import { cn } from "@/lib/utils"
  <div className={cn("base-class", isActive && "active-class")} />
  ```
- **Component variants**: Use `cva` (class-variance-authority) for variant-based styling
  ```tsx
  import { cva, type VariantProps } from "class-variance-authority"
  
  const buttonVariants = cva("base-classes", {
    variants: { variant: {...}, size: {...} },
    defaultVariants: { variant: "default", size: "default" }
  })
  ```
- **Icons**: Use `lucide-react` for all icons (e.g., `import { Settings, LogOut } from 'lucide-react'`)

### UI Component Architecture
- **shadcn/ui configuration**: Style is "new-york", RSC enabled, Tailwind variables in `app/globals.css`
- **Component composition**: UI components use Radix UI primitives + Tailwind styling
- **Slots pattern**: Components support `asChild` prop with `@radix-ui/react-slot` for composition
- **Data attributes**: Use `data-slot="button"` pattern for component identification (see `button.tsx`)

### Animation Patterns
- **Framer Motion**: Used for page transitions and view animations
- **View transitions**: See `AnimatedView.tsx` for the standard pattern:
  - Track view state and previous view to determine animation direction
  - Use `AnimatePresence` with `mode="wait"` for sequential transitions
  - Standard pattern: `initial={{ x: offset, opacity: 0 }}` → `animate={{ x: 0, opacity: 1 }}`
- **Layout animations**: Use `motion.div` with `layout` prop for smooth resizing (see login page card)

### Layout & Navigation
- **Conditional navbar**: `LayoutContent.tsx` hides navbar on `/login` route using `usePathname()`
- **Root layout**: Server component in `layout.tsx` wraps client-side `LayoutContent`
- **Fonts**: Geist Sans and Geist Mono loaded via `next/font/google` with CSS variables

### Form & State Management
- **Multi-step forms**: See `login/page.tsx` for pattern:
  - Parent component manages shared state and view transitions
  - Child view components receive props for inputs and callbacks
  - Use `useRef` to track previous view for animation direction logic
- **Component state**: Each view component manages its own local UI state, parent lifts shared state

## File Organization
```
ui-service/
├── app/              # Next.js App Router pages
│   ├── globals.css   # Tailwind base + theme variables
│   ├── layout.tsx    # Root layout (server component)
│   ├── LayoutContent.tsx  # Client wrapper for conditional navbar
│   └── [route]/      # Route segments with page.tsx and view components
├── components/
│   ├── ui/           # shadcn/ui components (button, dialog, etc.)
│   └── [Feature].tsx # Shared feature components (Navbar, etc.)
└── lib/
    └── utils.ts      # Utility functions (cn() for className merging)
```

## Key Integration Points
- **No backend integration yet**: UI is currently standalone with mock data
- **Future**: API routes or separate backend services will be added as microservices
- **Authentication**: Login flow UI exists but not connected to auth service

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

## Pitfalls to Avoid
- **Don't mix quote styles**: Use single quotes for imports, double quotes in JSX attributes
- **Don't forget `'use client'`**: Required for hooks, event handlers, browser APIs, and framer-motion
- **Don't bypass `cn()`**: Always use it instead of template literals for conditional classes
- **Don't hardcode sizes**: Use existing button/component variants before adding custom sizing

## Next Steps for Development
- Add test framework (Jest + React Testing Library recommended)
- Set up backend microservices (user service, matching service, etc.)
- Configure API integration layer
- Add environment variable management (.env.local)
