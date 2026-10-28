import '@testing-library/jest-dom'

// jsdom does not expose the Node Fetch text codecs in every Jest runtime.
// Neon's HTTP driver requires them while importing server route modules.
const { TextEncoder: NodeTextEncoder, TextDecoder: NodeTextDecoder } = require('util')
if (typeof globalThis.TextEncoder === 'undefined') globalThis.TextEncoder = NodeTextEncoder
if (typeof globalThis.TextDecoder === 'undefined') globalThis.TextDecoder = NodeTextDecoder
const { ReadableStream, TransformStream, WritableStream } = require('stream/web')
if (typeof globalThis.ReadableStream === 'undefined') globalThis.ReadableStream = ReadableStream
if (typeof globalThis.TransformStream === 'undefined') globalThis.TransformStream = TransformStream
if (typeof globalThis.WritableStream === 'undefined') globalThis.WritableStream = WritableStream
if (typeof globalThis.clearImmediate === 'undefined') globalThis.clearImmediate = clearTimeout
if (typeof globalThis.setImmediate === 'undefined') globalThis.setImmediate = setTimeout
if (typeof globalThis.performance?.markResourceTiming !== 'function') {
  globalThis.performance.markResourceTiming = () => undefined
}

// jsdom does not expose Fetch primitives in every Jest runtime. Use the same
// implementation as Next's edge runtime so NextRequest can safely extend it.
const edgeFetch = require('next/dist/compiled/@edge-runtime/primitives/fetch')
if (typeof globalThis.Request === 'undefined') globalThis.Request = edgeFetch.Request
if (typeof globalThis.Response === 'undefined') globalThis.Response = edgeFetch.Response
if (typeof globalThis.Headers === 'undefined') globalThis.Headers = edgeFetch.Headers
if (typeof globalThis.FormData === 'undefined') globalThis.FormData = edgeFetch.FormData
if (typeof globalThis.fetch === 'undefined') globalThis.fetch = edgeFetch.fetch
if (typeof globalThis.NextRequest === 'undefined') {
  globalThis.NextRequest = require('next/server').NextRequest
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

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
}))

// 全局测试环境变量
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-clerk-key'
