import { describe, it, expect } from 'vitest'
import {
    isHeadRole,
    isAdmin,
    getSectionForRole,
    canViewSection,
    getHeadRoles,
    roleLabels,
    roleToSection,
} from '@/lib/utils/roles'

describe('isHeadRole', () => {
    it('should return true for HEAD_FINANCE', () => {
        expect(isHeadRole('HEAD_FINANCE')).toBe(true)
    })

    it('should return true for HEAD_HR', () => {
        expect(isHeadRole('HEAD_HR')).toBe(true)
    })

    it('should return true for HEAD_VEDENI', () => {
        expect(isHeadRole('HEAD_VEDENI')).toBe(true)
    })

    it('should return false for MEMBER', () => {
        expect(isHeadRole('MEMBER')).toBe(false)
    })

    it('should return false for ADMIN', () => {
        expect(isHeadRole('ADMIN')).toBe(false)
    })

    it('should return false for empty string', () => {
        expect(isHeadRole('')).toBe(false)
    })
})

describe('isAdmin', () => {
    it('should return true for ADMIN', () => {
        expect(isAdmin('ADMIN')).toBe(true)
    })

    it('should return false for MEMBER', () => {
        expect(isAdmin('MEMBER')).toBe(false)
    })

    it('should return false for HEAD roles', () => {
        expect(isAdmin('HEAD_FINANCE')).toBe(false)
    })

    it('should be case-sensitive', () => {
        expect(isAdmin('admin')).toBe(false)
        expect(isAdmin('Admin')).toBe(false)
    })
})

describe('getSectionForRole', () => {
    it('should return correct section for HEAD_FINANCE', () => {
        expect(getSectionForRole('HEAD_FINANCE')).toBe('Finance')
    })

    it('should return correct section for HEAD_HR', () => {
        expect(getSectionForRole('HEAD_HR')).toBe('HR')
    })

    it('should return correct section for HEAD_VZDELAVACI', () => {
        expect(getSectionForRole('HEAD_VZDELAVACI')).toBe('Vzdělávací akce')
    })

    it('should return null for MEMBER', () => {
        expect(getSectionForRole('MEMBER')).toBeNull()
    })

    it('should return null for ADMIN', () => {
        expect(getSectionForRole('ADMIN')).toBeNull()
    })

    it('should return null for unknown role', () => {
        expect(getSectionForRole('UNKNOWN_ROLE')).toBeNull()
    })
})

describe('canViewSection', () => {
    it('should allow ADMIN to view any section', () => {
        expect(canViewSection('ADMIN', 'Finance')).toBe(true)
        expect(canViewSection('ADMIN', 'HR')).toBe(true)
        expect(canViewSection('ADMIN', 'Vzdělávací akce')).toBe(true)
    })

    it('should allow HEAD role to view their own section', () => {
        expect(canViewSection('HEAD_FINANCE', 'Finance')).toBe(true)
        expect(canViewSection('HEAD_HR', 'HR')).toBe(true)
    })

    it('should NOT allow HEAD role to view other sections', () => {
        expect(canViewSection('HEAD_FINANCE', 'HR')).toBe(false)
        expect(canViewSection('HEAD_HR', 'Finance')).toBe(false)
    })

    it('should NOT allow MEMBER to view any section', () => {
        expect(canViewSection('MEMBER', 'Finance')).toBe(false)
        expect(canViewSection('MEMBER', 'HR')).toBe(false)
    })
})

describe('getHeadRoles', () => {
    it('should return all HEAD roles', () => {
        const headRoles = getHeadRoles()
        expect(headRoles).toContain('HEAD_VEDENI')
        expect(headRoles).toContain('HEAD_FINANCE')
        expect(headRoles).toContain('HEAD_HR')
        expect(headRoles).toContain('HEAD_PR')
        expect(headRoles).toContain('HEAD_NEVZDELAVACI')
        expect(headRoles).toContain('HEAD_VZDELAVACI')
        expect(headRoles).toContain('HEAD_SPORTOVNI')
        expect(headRoles).toContain('HEAD_GAMING')
        expect(headRoles).toContain('HEAD_KRUHOVE')
    })

    it('should return exactly 9 HEAD roles', () => {
        expect(getHeadRoles()).toHaveLength(9)
    })

    it('should NOT contain ADMIN or MEMBER', () => {
        const headRoles = getHeadRoles()
        expect(headRoles).not.toContain('ADMIN')
        expect(headRoles).not.toContain('MEMBER')
    })
})

describe('roleLabels', () => {
    it('should have labels for all roles', () => {
        expect(roleLabels['MEMBER']).toBe('Člen')
        expect(roleLabels['ADMIN']).toBe('Administrátor')
    })

    it('should have Czech labels for HEAD roles', () => {
        expect(roleLabels['HEAD_FINANCE']).toBe('Vedoucí - Finance')
        expect(roleLabels['HEAD_HR']).toBe('Vedoucí - HR')
    })
})

describe('roleToSection', () => {
    it('should map all HEAD roles to sections', () => {
        expect(Object.keys(roleToSection)).toHaveLength(9)
    })

    it('should have correct mappings', () => {
        expect(roleToSection['HEAD_VEDENI']).toBe('Vedení')
        expect(roleToSection['HEAD_GAMING']).toBe('Gaming')
    })
})
