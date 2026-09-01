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
    // The 5-second default is below what the heaviest tests cost when the
    // whole suite runs in parallel, and it failed correct tests three times on
    // 2026-08-31 and 2026-09-01. Measured on the same test, same code: 936ms
    // to 5.6s depending only on how many other files were compiling at that
    // moment, and 647/647 pass at 20s. The ones that tip over render the whole
    // results screen, which scores 24 parties over the corpus and draws a
    // chart; nothing about them is slow enough to be a defect, and a timeout
    // is a clock, not an assertion, so raising it weakens no test.
    //
    // If a test ever needs more than this, that is a performance finding to
    // measure, not a number to raise again.
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
