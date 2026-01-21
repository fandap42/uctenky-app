import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

// Mock auth for testing
vi.mock('@/auth', () => ({
    auth: vi.fn(),
}))
