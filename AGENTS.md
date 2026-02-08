# AGENTS.md

This file provides guidelines for agentic coding agents working in this repository.

## Project Overview

**PromptMinder** is a professional AI prompt management platform built with Next.js 16 and React 19. It enables users to create, version, organize, and share AI prompts with support for team collaboration.

**Key Features:**
- Prompt version management with diff comparison
- Team-based multi-tenancy with role-based permissions
- Public prompt sharing and community contributions
- AI-powered prompt optimization
- Real-time prompt testing with various AI models
- Bilingual support (Chinese and English)

**Core Stack:**
- Next.js 16 (App Router)
- React 19 (functional components with hooks)
- Clerk for authentication
- Supabase (PostgreSQL) for database
- Radix UI for accessible primitives
- Tailwind CSS for styling
- Lucide React for icons
- Framer Motion for animations
- No TypeScript - uses JavaScript with jsconfig.json for path mapping

## Commands

Use **pnpm** for all package management:

### Development
- `pnpm dev` - Start development server (http://localhost:3000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint (must pass after changes)

### Testing
- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:ci` - Run tests in CI mode
- `pnpm test __tests__/path/to/test.test.js` - Run specific test file
- `pnpm test --testNamePattern="test description"` - Run tests matching pattern

### Analysis & Performance
- `pnpm analyze` - Build with bundle analyzer
- `pnpm css:optimize` - Optimize CSS for production
- `pnpm performance:test` - Run performance tests

## Project Structure

```
prompt-manager/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (REST endpoints)
│   ├── prompts/           # Prompt management pages
│   ├── tags/              # Tag management pages
│   ├── teams/             # Team management pages
│   ├── admin/             # Admin dashboard pages
│   ├── public/            # Public prompt gallery
│   ├── share/             # Shared prompt pages
│   ├── sign-in/           # Authentication pages
│   ├── sign-up/           # Registration pages
│   ├── layout.js          # Root layout with metadata
│   ├── page.js            # Landing page
│   ├── providers.jsx      # Context providers wrapper
│   └── globals.css        # Global styles with Tailwind
├── components/            # React components
│   ├── ui/                # Reusable UI components (Button, Card, Dialog, etc.)
│   ├── prompt/            # Prompt-related components
│   ├── team/              # Team-related components
│   ├── landing/           # Landing page sections
│   ├── layout/            # Layout components (Navbar, Footer)
│   ├── admin/             # Admin dashboard components
│   ├── playground/        # Prompt testing components
│   ├── performance/       # Performance monitoring components
│   └── common/            # Shared utility components
├── hooks/                 # Custom React hooks
│   ├── use-prompts.js     # Prompt data fetching
│   ├── use-prompt-detail.js
│   ├── use-toast.js       # Toast notifications
│   ├── use-api-cache.js   # API caching
│   ├── use-lazy-loading.js
│   └── use-performance.js
├── lib/                   # Utility functions and configurations
│   ├── api-client.js      # Centralized API client
│   ├── api-error.js       # Error handling utilities
│   ├── auth.js            # Authentication helpers
│   ├── constants.js       # Application constants
│   ├── utils.js           # Utility functions (cn, etc.)
│   ├── team-service.js    # Team business logic
│   ├── team-request.js    # Team context resolution
│   ├── team-storage.js    # Team localStorage utilities
│   ├── supabaseServer.js  # Supabase server client
│   └── prompts.js         # Prompt utilities
├── contexts/              # React Context providers
│   ├── LanguageContext.js # Internationalization
│   ├── team-context.js    # Team state management
│   └── PerformanceContext.js
├── messages/              # Internationalization files
│   ├── zh.json            # Chinese translations
│   └── en.json            # English translations
├── sql/                   # Database migration scripts
│   ├── teams.sql          # Team tables
│   ├── prompts.sql        # Prompt tables
│   ├── tags.sql           # Tag tables
│   ├── projects.sql       # Project tables
│   ├── contributions.sql  # Contribution system
│   └── backfill_team_data.sql
├── __tests__/             # Test files (mirrors source structure)
├── __mocks__/             # Jest mocks
│   └── lucide-react.js    # Icon mocks for testing
├── public/                # Static assets
├── jest.config.js         # Jest configuration
├── jest.setup.js          # Jest setup and mocks
├── tailwind.config.js     # Tailwind CSS configuration
├── next.config.js         # Next.js configuration
└── jsconfig.json          # JavaScript path mapping
```

## Code Style Guidelines

### Imports
- Use absolute imports with `@/` alias: `@/components/...`, `@/lib/...`, `@/hooks/...`, `@/contexts/...`
- External libraries first, then internal modules
- Named imports from libraries: `import { useState } from 'react'`
- Example: `import { apiClient, ApiError } from '@/lib/api-client'`

### File Types
- `.jsx` - React components (use 'use client' directive when needed)
- `.js` - Utility functions, hooks, API clients, and tests
- No TypeScript - uses JavaScript with jsconfig.json for path mapping

### Formatting
- 2 space indentation
- Semicolons required
- Mixed quotes: single quotes in JS, double quotes in JSX attributes
- Use `cn()` utility from `@/lib/utils` for className merging (combines clsx and tailwind-merge)

### Naming Conventions
- Components: PascalCase (PromptCard, Button, TestCaseList)
- Functions: camelCase (fetchPrompts, handleCopy, validateInput)
- Constants: UPPER_SNAKE_CASE (PERSONAL_TEAM_ID, DEFAULTS, UI_CONFIG)
- Hooks: use prefix (usePrompts, useToast, useLanguage)
- Files: kebab-case (prompt-card.jsx, button.jsx, api-client.js)
- Test files: *.test.js pattern (Button.test.js, api-client.test.js)

### React Patterns
- Use functional components with hooks over class components
- Add `'use client';` at top of client components
- Memoize expensive operations with useMemo and useCallback
- Use React.memo with custom comparison functions for components
- Destructure props in function signature: `function PromptCard({ prompt, onUpdate }) { ... }`
- Always export components at bottom: `export { Button, buttonVariants }`

### Error Handling
- Use ApiError class from `@/lib/api-client` for API errors
- Wrap async operations in try-catch
- Show user feedback with useToast hook: `toast({ title: '...', variant: 'destructive' })`
- Log errors: `console.error('Error fetching prompts:', error)`

## Testing Instructions

- Jest with React Testing Library
- Test files in `__tests__/` directory, mirroring source structure
- Use descriptive Chinese test descriptions: `it('应该正确渲染基本按钮', () => ...)`
- Setup: `global.fetch = jest.fn()` and `fetch.mockClear()` in beforeEach
- Prefer modern assertions: `expect(element).toBeInTheDocument()` over toBeTruthy()
- Group related tests in describe blocks
- Coverage threshold: 70% for branches, functions, lines, statements

### Mock Setup
Key mocks are configured in `jest.setup.js`:
- Next.js router and navigation
- Clerk authentication
- Supabase client
- OpenAI API
- Framer Motion
- React Hot Toast
- Lucide React icons (also in `__mocks__/lucide-react.js`)

## Multi-Tenant Team Architecture

This is a multi-tenant application where all data belongs to a team. Understanding the team system is critical.

### Team Model

**Personal vs. Team Workspaces:**
- Every user has an auto-generated "personal team" (`is_personal: true`)
- Users can create up to 2 additional non-personal teams
- Personal teams cannot have members (owner only)
- Non-personal teams support invitations and role-based permissions

**Team Roles:**
- `owner` - Full control, can transfer ownership
- `admin` - Can manage members and update team settings
- `member` - Can access team resources but not manage

**Membership Statuses:**
- `active` - Full member access
- `pending` - Invited but not yet accepted
- `left`, `removed`, `blocked` - Inactive states

### Team Context Flow

**Client-side:**
1. `TeamContext` (contexts/team-context.js) manages active team selection
2. Active team ID stored in localStorage via `TEAM_STORAGE_KEY`
3. `null` team ID represents personal workspace
4. `ApiClient` reads from localStorage and sends `X-Team-Id` header

**Server-side (API routes):**
1. Extract team ID from `X-Team-Id` header or `?teamId=` query param via `extractTeamId()`
2. Call `resolveTeamContext()` to get supabase client, teamService, and membership
3. Use `teamService.requireMembership()` to authorize access
4. Pass `teamId` to database queries

**Example API route pattern:**
```javascript
export async function GET(request) {
  const userId = await requireUserId()
  const { teamId, supabase, teamService } = await resolveTeamContext(request, userId, {
    requireMembership: true,  // Verify user is a team member
    allowMissingTeam: false   // Require teamId to be present
  })

  // Query data with team_id filter
  const { data } = await supabase
    .from('prompts')
    .select('*')
    .eq('team_id', teamId)

  return NextResponse.json({ prompts: data })
}
```

### Key Team Files

- `lib/team-service.js` - Business logic for team operations
- `lib/team-request.js` - Server-side team context resolution
- `lib/team-storage.js` - Constants and localStorage utilities
- `contexts/team-context.js` - Client-side team state management
- `components/team/TeamSwitcher.jsx` - UI for switching between teams

## API & Data Layer

### API Routes (app/api/**)

**Standard pattern:**
1. Get userId via `requireUserId()`
2. Resolve team context via `resolveTeamContext()`
3. Validate membership if needed
4. Perform Supabase queries
5. Handle errors with `handleApiError()`

**Team-aware queries:**
- All data tables should have a `team_id` column (nullable for personal items)
- Always filter by `team_id` in WHERE clauses
- For personal workspace items, use `.is('team_id', null)`

### Client Components

**Use centralized API client:**
```javascript
import { apiClient } from '@/lib/api-client'

// Get prompts for active team
const data = await apiClient.getPrompts({ tag: 'chatbot' })

// Create prompt in specific team
const newPrompt = await apiClient.createPrompt(promptData, { teamId: 'xxx' })
```

**ApiClient automatically:**
- Reads team ID from localStorage
- Adds `X-Team-Id` header to requests
- Handles JSON serialization
- Throws ApiError with status and details

### Custom Hooks

**Data fetching hooks** (`hooks/use-*.js`):
- `usePrompts(filters)` - Fetch and manage prompts
- `usePromptDetail(id)` - Fetch single prompt
- Access team context from TeamProvider via components

**Utility hooks:**
- `useToast()` - Show notifications
- `usePerformance()` - Performance monitoring

## Database Schema

**Team-based tables** (prompts, tags, projects):
- `team_id` (uuid, nullable) - Foreign key to teams table
- `created_by` (text) - User who created the record
- `created_at`, `updated_at` (timestamptz)

**Core Tables:**
- `teams` - Team information with `is_personal` flag
- `team_members` - Membership with roles and status
- `prompts` - Prompt content with versioning
- `tags` - Categorization labels
- `projects` - Project organization
- `public_prompts` - Community contribution prompts
- `prompt_contributions` - Pending contributions
- `favorites` - User favorites
- `provider_keys` - User API keys for testing

## Internationalization

- Language files in `/messages/` directory
- `zh.json` - Chinese translations
- `en.json` - English translations
- `LanguageContext` manages language state
- `useLanguage()` hook for accessing translations

## UI & Styling

- Tailwind CSS with custom theme variables in `globals.css`
- Use component variants with class-variance-authority (CVA) for variant props
- UI components in `components/ui/` using Radix UI primitives
- Dark mode support via `dark:` variant classes
- Gradient overlays and animations for polished UI
- Accessible colors with HSL variables

## Performance Optimizations

- Lazy load routes and heavy components with `next/dynamic`
- Virtualize long lists (VirtualPromptList, VirtualList)
- Use useMemo/useCallback to prevent re-renders
- Optimized images with next/image
- CSS-in-JS via Tailwind for minimal bundle
- Webpack chunk splitting configured in `next.config.js`
- PWA support with service worker

## Security Considerations

- Authentication handled by Clerk
- API routes use `requireUserId()` to ensure authenticated access
- Team-based authorization via `teamService.requireMembership()`
- Supabase RLS policies should be configured for production
- Environment variables for sensitive configuration:
  - `CLERK_SECRET_KEY`
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`
  - `AUTH_SECRET`
  - `ZHIPU_API_KEY`

## Before Committing

1. Run `pnpm lint` - fix any ESLint errors
2. Run `pnpm test` - ensure all tests pass
3. Run single test: `pnpm test __tests__/path/to/test.test.js`
4. Check console for errors/warnings

Never commit:
- Secrets (.env files, credentials)
- .next/, node_modules/, coverage/
- Build artifacts
- Minimized CSS files
