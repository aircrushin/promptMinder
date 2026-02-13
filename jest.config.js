const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // 提供Next.js应用的路径，用于加载next.config.js和.env文件
  dir: './',
})

// 添加任何自定义配置到Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.tsx'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.tsx',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'contexts/**/*.{js,jsx,ts,tsx}',
    '!app/**/layout.{js,tsx}',
    '!app/**/loading.{js,tsx}',
    '!app/**/error.{js,tsx}',
    '!app/**/not-found.{js,tsx}',
    '!app/**/page.{js,tsx}',
    '!app/**/metadata.{js,ts}',
    '!app/**/robots.{js,ts}',
    '!app/**/sitemap.{js,ts}',
    '!app/globals.css',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!coverage/**',
    '!jest.config.js',
    '!jest.setup.js',
    '!next.config.js',
    '!tailwind.config.js',
    '!postcss.config.mjs',
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-react|@clerk)/)'
  ],
}

// createJestConfig是异步的，因为它需要等待Next.js加载配置
module.exports = createJestConfig(customJestConfig)