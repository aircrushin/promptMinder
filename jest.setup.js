import '@testing-library/jest-dom'

// Mock Next.js Request and Response
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Map(Object.entries(options.headers || {}))
    this.body = options.body
  }

  async json() {
    return JSON.parse(this.body || '{}')
  }
}

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.headers = new Map(Object.entries(options.headers || {}))
  }

  static json(data, init = {}) {
    const body = JSON.stringify(data)
    return new global.Response(body, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
  }

  async json() {
    return JSON.parse(this.body || '{}')
  }
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
    isLoaded: true,
    isSignedIn: true,
  }),
  useAuth: () => ({
    userId: 'test-user-id',
    isLoaded: true,
    isSignedIn: true,
    getToken: jest.fn().mockResolvedValue('mock-token'),
  }),
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  UserButton: () => <div data-testid="user-button">User Button</div>,
}))

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}))

// Mock OpenAI
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Import: (props) => <div data-testid="import-icon" {...props}>Import</div>,
  Copy: (props) => <div data-testid="copy-icon" {...props}>Copy</div>,
  Share2: (props) => <div data-testid="share-icon" {...props}>Share</div>,
  Trash2: (props) => <div data-testid="trash-icon" {...props}>Trash</div>,
  ChevronDown: (props) => <div data-testid="chevron-down-icon" {...props}>ChevronDown</div>,
}))

// Fix for postgres.js in Node.js environment
global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));

// Mock Drizzle ORM queries
jest.mock('@/lib/db/queries', () => ({
  queries: {
    prompts: {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByUser: jest.fn(),
    },
    teams: {
      getAll: jest.fn(),
      getById: jest.fn(),
      getPersonalTeam: jest.fn(),
      hasPersonalTeam: jest.fn(),
      countNonPersonalTeams: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    teamMembers: {
      getByTeamId: jest.fn(),
      getMembership: jest.fn(),
      getByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateByUserAndTeam: jest.fn(),
      getPendingByEmail: jest.fn(),
    },
    tags: {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    favorites: {
      getByUser: jest.fn(),
      isFavorited: jest.fn(),
      checkFavorites: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    likes: {
      isLiked: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    publicPrompts: {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contributions: {
      getAll: jest.fn(),
      getByUser: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    providerKeys: {
      getByUser: jest.fn(),
      getByProvider: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    feedback: {
      getAll: jest.fn(),
      create: jest.fn(),
      resolve: jest.fn(),
    },
    promptVersions: {
      getByPromptId: jest.fn(),
      create: jest.fn(),
    },
  }
}))

// 全局测试环境变量
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-clerk-key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'