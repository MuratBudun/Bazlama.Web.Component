import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Test file patterns
    include: ['**/core/**/*.test.ts', '**/core/**/*.spec.ts'],
    
    // Global setup
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/core/src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/index.ts', '**/vite-env.d.ts']
    },
    
    // Timeout
    testTimeout: 10000,
    
    // Root directory for tests
    root: resolve(__dirname, '..'),
  },
  
  resolve: {
    alias: {
      '@bazlama/core': resolve(__dirname, '../packages/core/src/index.ts')
    }
  },
  
  esbuild: {
    target: 'es2020'
  }
})
