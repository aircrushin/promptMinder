# AGENTS.md

This file provides guidelines for agentic coding agents working in this repository.

## Commands

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

### Running Single Tests
- `pnpm test path/to/test.test.js` - Run specific test file
- `pnpm test --testNamePattern="test description"` - Run tests matching pattern
- `pnpm test --testPathPattern=Button` - Run tests in files matching pattern

### Analysis & Performance
- `pnpm analyze` - Build with bundle analyzer
- `pnpm css:optimize` - Optimize CSS for production

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

### Testing
- Jest with React Testing Library
- Test files in `__tests__/` directory, mirroring source structure
- Use descriptive Chinese test descriptions: `it('应该正确渲染基本按钮', () => ...)`
- Setup: `global.fetch = jest.fn()` and `fetch.mockClear()` in beforeEach
- Prefer modern assertions: `expect(element).toBeInTheDocument()` over toBeTruthy()
- Group related tests in describe blocks
- Coverage threshold: 70% for branches, functions, lines, statements

### API & Data
- Centralized API calls in `lib/api-client.js` using ApiClient class
- Pass teamId via options object for multi-tenant support
- Use hooks for data fetching: `usePrompts`, `usePromptDetail`
- Use contexts for global state: LanguageContext, PerformanceContext
- Default values in `lib/constants.js`

### UI & Styling
- Tailwind CSS with custom theme variables
- Use component variants with class-variance-authority (CVA) for variant props
- UI components in `components/ui/` using Radix UI primitives
- Dark mode support: add `dark:` variant classes
- Gradient overlays and animations for polished UI
- Accessible colors with HSL variables

### Performance
- Lazy load routes and heavy components
- Virtualize long lists (VirtualPromptList, VirtualList)
- Use useMemo/useCallback to prevent re-renders
- Optimized images with next/image
- CSS-in-JS via Tailwind for minimal bundle

### Dependencies
- Next.js 16 with App Router
- React 19
- Clerk for authentication
- Supabase for database
- Radix UI for accessible primitives
- Lucide React for icons (mocked in __mocks__/lucide-react.js)

### File Structure
```
app/               - Next.js app router pages
components/        - React components
  ui/             - Reusable UI components
  prompt/         - Feature-specific components
  landing/        - Landing page components
hooks/            - Custom React hooks
lib/              - Utility functions and API clients
contexts/         - React contexts
__tests__/        - Test files (mirrors source structure)
```

### Before Committing
1. Run `npm run lint` - fix any ESLint errors
2. Run `npm test` - ensure all tests pass
3. Run single test: `npm test -- path/to/test.test.js`
4. Check console for errors/warnings

Never commit:
- Secrets (.env files, credentials)
- .next/, node_modules/, coverage/
- Build artifacts
- Minimized CSS files
