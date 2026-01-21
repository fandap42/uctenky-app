import { describe, it, expect } from 'vitest'
import { getSemester, getCurrentSemester, monthNames } from '@/lib/utils/semesters'

describe('getSemester', () => {
    describe('Winter Semester (ZS)', () => {
        it('should return ZS for September', () => {
            const date = new Date(2025, 8, 15) // September 15, 2025
            expect(getSemester(date)).toBe('ZS25')
        })

        it('should return ZS for October', () => {
            const date = new Date(2025, 9, 1) // October 1, 2025
            expect(getSemester(date)).toBe('ZS25')
        })

        it('should return ZS for November', () => {
            const date = new Date(2025, 10, 30) // November 30, 2025
            expect(getSemester(date)).toBe('ZS25')
        })

        it('should return ZS for December', () => {
            const date = new Date(2025, 11, 31) // December 31, 2025
            expect(getSemester(date)).toBe('ZS25')
        })

        it('should return ZS of previous year for January', () => {
            const date = new Date(2026, 0, 15) // January 15, 2026
            expect(getSemester(date)).toBe('ZS25') // Still winter semester 2025
        })
    })

    describe('Summer Semester (LS)', () => {
        it('should return LS for February', () => {
            const date = new Date(2026, 1, 1) // February 1, 2026
            expect(getSemester(date)).toBe('LS26')
        })

        it('should return LS for March', () => {
            const date = new Date(2026, 2, 15) // March 15, 2026
            expect(getSemester(date)).toBe('LS26')
        })

        it('should return LS for August', () => {
            const date = new Date(2026, 7, 31) // August 31, 2026
            expect(getSemester(date)).toBe('LS26')
        })
    })

    describe('Year boundary edge cases', () => {
        it('should handle Dec 31 correctly', () => {
            const date = new Date(2099, 11, 31) // December 31, 2099
            expect(getSemester(date)).toBe('ZS99')
        })

        it('should handle Jan 1 correctly', () => {
            const date = new Date(2030, 0, 1) // January 1, 2030
            expect(getSemester(date)).toBe('ZS29') // Previous year's winter semester
        })

        it('should handle year 2000 correctly', () => {
            const date = new Date(2000, 8, 1) // September 1, 2000
            expect(getSemester(date)).toBe('ZS0')
        })
    })
})

describe('getCurrentSemester', () => {
    it('should return a valid semester format', () => {
        const semester = getCurrentSemester()
        expect(semester).toMatch(/^(ZS|LS)\d{1,2}$/)
    })
})

describe('monthNames', () => {
    it('should have all 12 months in Czech', () => {
        expect(Object.keys(monthNames)).toHaveLength(12)
        expect(monthNames[1]).toBe('Leden')
        expect(monthNames[12]).toBe('Prosinec')
    })

    it('should have correct month names', () => {
        expect(monthNames[5]).toBe('Květen')
        expect(monthNames[9]).toBe('Září')
    })
})
