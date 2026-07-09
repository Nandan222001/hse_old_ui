// Jest global setup — mocks for native modules.
// Note: __reanimatedWorkletInit is expected by react-native-reanimated mock.
(global as any).__reanimatedWorkletInit = jest.fn();

// React Native global that is normally injected by the RN runtime. The app's
// src/constants/config.ts uses it to switch between emulator and production
// base URLs, so the test environment must define it.
(global as any).__DEV__ = true;

// Silence noisy act() warnings from RN internals; restore explicitly per-test if needed.
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0] ?? '');
    if (msg.includes('not wrapped in act')) return;
    originalError(...(args as []));
  };
});
afterAll(() => {
  console.error = originalError;
});
