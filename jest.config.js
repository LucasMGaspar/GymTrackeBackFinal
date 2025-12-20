const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node', // Use node environment for server-side tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^isomorphic-dompurify$': '<rootDir>/lib/security/__tests__/__mocks__/isomorphic-dompurify.ts',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'lib/security/**/*.{js,ts}',
    '!lib/security/**/*.d.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(isomorphic-dompurify|parse5)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

