import { describe, it, expect, vi, beforeEach } from 'vitest'
import { auth } from '@/auth'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        deposit: {
            create: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
        },
        debtError: {
            create: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
        },
        cashOnHand: {
            create: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
        },
        transaction: {
            findMany: vi.fn(),
        },
    },
}))

import { prisma } from '@/lib/prisma'

describe('Cash Register Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Authorization', () => {
        it('should reject non-admin users for creating deposits', async () => {
            vi.mocked(auth).mockResolvedValue({
                user: { id: 'user-1', role: 'MEMBER' },
                expires: '',
            })

            const { createDeposit } = await import('@/lib/actions/cash-register')
            const result = await createDeposit(100, 'Test', new Date())

            expect(result).toEqual({ error: 'Oprávnění pouze pro administrátora' })
        })
    })

    describe('Calculation Logic', () => {
        it('should correctly calculate real cash and balance', async () => {
            vi.mocked(auth).mockResolvedValue({
                user: { id: 'admin-1', role: 'ADMIN' },
                expires: '',
            })

            // Mock data
            vi.mocked(prisma.deposit.findMany).mockResolvedValue([
                { id: '1', amount: 1000, date: new Date(), createdAt: new Date(), description: 'Init' }
            ] as any)

            vi.mocked(prisma.debtError.findMany).mockResolvedValue([
                { id: '1', amount: 50, reason: 'Lost', createdAt: new Date() }
            ] as any)

            vi.mocked(prisma.cashOnHand.findMany).mockResolvedValue([
                { id: '1', amount: 100, reason: 'Pocket', createdAt: new Date() }
            ] as any)

            vi.mocked(prisma.transaction.findMany).mockResolvedValue([
                {
                    id: '1',
                    finalAmount: 200,
                    isPaid: true,
                    status: 'VERIFIED',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    dueDate: new Date(),
                    section: { name: 'Finance' },
                    requester: { fullName: 'Test User' }
                }
            ] as any)

            const { getAllCashRegisterData } = await import('@/lib/actions/cash-register')
            const data = await getAllCashRegisterData()

            if ('error' in data) throw new Error('Action failed')

            // totalDeposits = 1000
            // totalPaidExpenses = 200
            // currentBalance = 1000 - 200 = 800
            // totalDebtErrors = 50
            // totalCashOnHand = 100
            // realCash = 800 - 50 - 100 = 650

            expect(data.totalDeposits).toBe(1000)
            expect(data.currentBalance).toBe(800)
            expect(data.totalDebtErrors).toBe(50)
            expect(data.totalCashOnHand).toBe(100)
            expect(data.realCash).toBe(650)
        })
    })
})
