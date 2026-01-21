import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./__tests__/setup.ts'],
        include: ['__tests__/**/*.test.{ts,tsx}'],
        exclude: ['__tests__/e2e/**/*', 'node_modules/**/*'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['lib/**/*.ts', 'components/**/*.tsx'],
            exclude: ['**/*.d.ts', '**/prisma.ts'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
})
