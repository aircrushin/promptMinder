const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // 提供Next.js应用的路径，用于加载next.config.js和.env文件
  dir: './',
})

// 添加任何自定义配置到Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx}',
    'lib/**/*.{js,jsx}',
    'hooks/**/*.{js,jsx}',
    'app/**/*.{js,jsx}',
    'contexts/**/*.{js,jsx}',
    '!app/**/layout.js',
    '!app/**/loading.js',
    '!app/**/error.js',
    '!app/**/not-found.js',
    '!app/**/page.js',
    '!app/**/metadata.js',
    '!app/**/robots.js',
    '!app/**/sitemap.js',
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
    'node_modules/(?!(lucide-react)/)'
  ],
}

// createJestConfig是异步的，因为它需要等待Next.js加载配置
module.exports = createJestConfig(customJestConfig)