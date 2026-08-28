import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Node by default: almost everything under test is a pure function over
    // data files. The few files that need a DOM opt in with a
    // "@vitest-environment jsdom" docblock.
    environment: 'node',
    globals: true,
    pool: 'threads',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
