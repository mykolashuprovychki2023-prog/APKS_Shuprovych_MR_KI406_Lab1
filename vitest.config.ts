import { defineConfig } from 'vitest/config';

// Unit tests live in tests/; a JUnit report is written to build/ for CI.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    reporters: ['default', 'junit'],
    outputFile: { junit: 'build/test-results/junit.xml' },
  },
});
