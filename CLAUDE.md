# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PromptMinder is a Next.js 16 application for managing and sharing AI prompts. It features team-based multi-tenancy, public prompt sharing, and a contribution system for community prompts.

**Core Stack:**
- Next.js 16 (App Router)
- React 19 (functional components with hooks)
- Clerk for authentication
- Supabase for database
- Radix UI for accessible primitives
- Tailwind CSS for styling
- No TypeScript - uses JavaScript with jsconfig.json

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
- `pnpm test __tests__/path/to/test.test.js` - Run specific test file
- `pnpm test --testNamePattern="test description"` - Run tests matching pattern

### Analysis
- `pnpm analyze` - Build with bundle analyzer
- `pnpm css:optimize` - Optimize CSS for production

## Multi-Tenant Team Architecture

This is a multi-tenant application where all data (prompts, tags, etc.) belongs to a team. Understanding the team system is critical.

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

**For operations that work across personal and team contexts:**
```javascript
const { teamId, supabase, teamService } = await resolveTeamContext(request, userId, {
  requireMembership: false,
  allowMissingTeam: true
})

const query = teamId
  ? supabase.from('prompts').select('*').eq('team_id', teamId)
  : supabase.from('prompts').select('*').is('team_id', null)
```

### Key Team Files

- `lib/team-service.js` - Business logic for team operations (invite, accept, leave, transfer ownership)
- `lib/team-request.js` - Server-side team context resolution from headers/params
- `lib/team-storage.js` - Constants and utilities for localStorage team persistence
- `contexts/team-context.js` - Client-side team state management
- `components/team/TeamSwitcher.jsx` - UI for switching between teams

## Authentication & Authorization

**Clerk handles authentication**, `requireUserId()` from `@/lib/auth.js` gets the current user ID.

**Authorization is team-based:**
- Use `teamService.requireMembership()` to check if user can access a resource
- Use `teamService.assertManager()` for admin/owner-only operations
- Use `teamService.assertOwner()` for owner-only operations

## Data Layer Patterns

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
- `useTeam()` - Access team context from TeamProvider

**Utility hooks:**
- `useToast()` - Show notifications
- `usePerformance()` - Performance monitoring

## Code Style

### Imports
- Use absolute imports with `@/` alias: `@/components/...`, `@/lib/...`
- External libraries first, then internal modules
- Example: `import { apiClient } from '@/lib/api-client'`

### File Types
- `.jsx` - React components (add `'use client'` directive for client components)
- `.js` - Utilities, hooks, API routes, tests
- No TypeScript

### Naming Conventions
- Components: PascalCase (PromptCard, Button)
- Functions: camelCase (fetchPrompts, handleCopy)
- Constants: UPPER_SNAKE_CASE (PERSONAL_TEAM_ID, DEFAULTS)
- Hooks: use prefix (usePrompts, useToast)
- Files: kebab-case (prompt-card.jsx, api-client.js)

### React Patterns
- Functional components with hooks
- Destructure props in signature: `function PromptCard({ prompt, onUpdate }) { ... }`
- Memoize with `useMemo` and `useCallback` for performance
- Use `cn()` utility (from `@/lib/utils`) for className merging

### Error Handling
- Use ApiError class for API errors
- Wrap async operations in try-catch
- Show user feedback with useToast hook
- Log errors: `console.error('Error fetching prompts:', error)`

## Database Schema Patterns

**Team-based tables** (prompts, tags, etc.):
- `team_id` (uuid, nullable) - Foreign key to teams table
- `created_by` (uuid) - User who created the record
- `created_at`, `updated_at` (timestamptz)

**Team membership table** (team_members):
- Composite uniqueness on (team_id, user_id)
- Only one `owner` per team
- Stores invitation status and role

## Public vs. Private Prompts

**is_public flag:**
- `true` - Prompt appears in public gallery and contribution system
- `false` - Prompt only visible to team members

**Public prompts API:**
- `GET /api/prompts/public` - List public prompts (no auth required)
- Admin can moderate via `/api/admin/public-prompts`

## Testing

- Tests in `__tests__/` directory mirror source structure
- Jest with React Testing Library
- Use Chinese descriptions: `it('应该正确渲染基本按钮', () => ...)`
- Mock fetch: `global.fetch = jest.fn()` and `fetch.mockClear()` in beforeEach
- Coverage threshold: 70%
- Run `pnpm test:watch` during development
