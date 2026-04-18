/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['../testing/setup/backend.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/index.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
      ],
    },
    testTimeout: 15000,
    // Needed for ESM + dynamic imports in auth routes etc.
    server: {
      deps: {
        inline: true,
      },
    },
  },
})
