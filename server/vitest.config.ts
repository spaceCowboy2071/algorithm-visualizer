import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['tests/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgresql://postgres:dev@localhost:5432/algorithmviz_test',
      JWT_SECRET: 'test-jwt-secret',
      REFRESH_TOKEN_SECRET: 'test-refresh-secret',
      NODE_ENV: 'test',
      GOOGLE_CLIENT_ID: 'fake-google-client-id',
    },
    globalSetup: ['./tests/global-setup.ts'],
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    testTimeout: 10000,
    hookTimeout: 30000,
  },
});
