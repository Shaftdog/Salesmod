import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Exclude Playwright e2e tests - they require a running server and use different test runner
    // Unit tests are in: src/**/__tests__/*.test.ts (these ARE included)
    // E2E tests are in: e2e/**/*.spec.ts and tests/**/*.spec.ts (these are EXCLUDED)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',        // Playwright specs: e2e/*.spec.ts
      '**/tests/**',      // Playwright specs: tests/*.spec.ts (no unit tests here)
      '**/.{idea,git,cache,output,temp}/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'vitest.config.ts',
        'vitest.setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/e2e/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
