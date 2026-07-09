/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: __dirname,
  testMatch: ['<rootDir>/__tests__/**/*.test.(ts|tsx)'],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/__mocks__/async-storage.js',
    '^react-native-reanimated$':
      '<rootDir>/__mocks__/reanimated.js',
    '^react-native-gesture-handler$':
      '<rootDir>/__mocks__/gesture-handler.js',
    '^react-native-screens$':
      '<rootDir>/__mocks__/screens.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^@react-navigation/native$': '<rootDir>/__mocks__/nav-native.js',
    '^@react-navigation/(bottom-tabs|stack)$':
      '<rootDir>/__mocks__/nav-stack.js',
    '^react-native-safe-area-context$':
      '<rootDir>/__mocks__/safe-area.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'esnext',
          module: 'commonjs',
          moduleResolution: 'node',
          jsx: 'react-native',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          isolatedModules: false,
          skipLibCheck: true,
          types: ['jest', 'node'],
          ignoreDeprecations: '6.0',
          rootDir: '<rootDir>',
        },
        isolatedModules: true,
        diagnostics: { ignoreCodes: [151001] },
      },
    ],
  },
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/helpers/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/navigation/**',
    '!src/screens/**',
  ],
};
