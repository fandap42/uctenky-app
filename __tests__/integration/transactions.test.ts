import { describe, it, expect, vi, beforeEach } from 'vitest'
import { auth } from '@/auth'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        transaction: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
    },
}))

import { prisma } from '@/lib/prisma'

describe('Transaction Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Authorization Checks', () => {
        it('should reject unauthenticated users', async () => {
            vi.mocked(auth).mockResolvedValue(null)

            const { createTransaction } = await import('@/lib/actions/transactions')

            const formData = new FormData()
            formData.set('purpose', 'Test')
            formData.set('estimatedAmount', '100')
            formData.set('sectionId', 'section-1')

            const result = await createTransaction(formData)

            expect(result).toEqual({ error: 'Nepřihlášený uživatel' })
        })

        it('should reject non-admin users for status updates', async () => {
            vi.mocked(auth).mockResolvedValue({
                user: { id: 'user-1', role: 'MEMBER' },
                expires: '',
            })
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 'user-1',
                role: 'MEMBER',
                email: 'test@test.com',
                passwordHash: 'hash',
                fullName: 'Test User',
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const { updateTransactionStatus } = await import('@/lib/actions/transactions')

            const result = await updateTransactionStatus('tx-1', 'APPROVED')

            expect(result).toEqual({
                error: 'Nemáte oprávnění k této akci. Pouze administrátor může schvalovat žádosti.'
            })
        })

        it('should allow admin to update transaction status', async () => {
            vi.mocked(auth).mockResolvedValue({
                user: { id: 'admin-1', role: 'ADMIN' },
                expires: '',
            })
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 'admin-1',
                role: 'ADMIN',
                email: 'admin@test.com',
                passwordHash: 'hash',
                fullName: 'Admin User',
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            vi.mocked(prisma.transaction.update).mockResolvedValue({} as unknown as Awaited<ReturnType<typeof prisma.transaction.update>>)

            const { updateTransactionStatus } = await import('@/lib/actions/transactions')

            const result = await updateTransactionStatus('tx-1', 'APPROVED')

            expect(result).toEqual({ success: true })
            expect(prisma.transaction.update).toHaveBeenCalledWith({
                where: { id: 'tx-1' },
                data: { status: 'APPROVED' },
            })
        })
    })

    describe('Input Validation', () => {
        it('should reject missing required fields', async () => {
            vi.mocked(auth).mockResolvedValue({
                user: { id: 'user-1', role: 'MEMBER' },
                expires: '',
            })

            const { createTransaction } = await import('@/lib/actions/transactions')

            const formData = new FormData()
            // Missing purpose and estimatedAmount

            const result = await createTransaction(formData)

            expect(result).toEqual({ error: 'Vyplňte všechna povinná pole' })
        })

        it('should reject missing section', async () => {
            vi.mocked(auth).mockResolvedValue({
                user: { id: 'user-1', role: 'MEMBER' },
                expires: '',
            })

            const { createTransaction } = await import('@/lib/actions/transactions')

            const formData = new FormData()
            formData.set('purpose', 'Test')
            formData.set('estimatedAmount', '100')
            // Missing sectionId

            const result = await createTransaction(formData)

            expect(result).toEqual({ error: 'Vyberte sekci' })
        })
    })
})
