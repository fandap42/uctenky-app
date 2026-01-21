import { AppRole } from "@prisma/client"

/**
 * Mapping of HEAD roles to their corresponding section names
 */
export const roleToSection: Record<string, string> = {
  HEAD_VEDENI: "Vedení",
  HEAD_FINANCE: "Finance",
  HEAD_HR: "HR",
  HEAD_PR: "PR",
  HEAD_NEVZDELAVACI: "Nevzdělávací akce",
  HEAD_VZDELAVACI: "Vzdělávací akce",
  HEAD_SPORTOVNI: "Sportovní akce",
  HEAD_GAMING: "Gaming",
  HEAD_KRUHOVE: "Kruhové akce",
}

/**
 * Human-readable labels for roles (Czech)
 */
export const roleLabels: Record<string, string> = {
  MEMBER: "Člen",
  HEAD_VEDENI: "Vedoucí - Vedení",
  HEAD_FINANCE: "Vedoucí - Finance",
  HEAD_HR: "Vedoucí - HR",
  HEAD_PR: "Vedoucí - PR",
  HEAD_NEVZDELAVACI: "Vedoucí - Nevzdělávací akce",
  HEAD_VZDELAVACI: "Vedoucí - Vzdělávací akce",
  HEAD_SPORTOVNI: "Vedoucí - Sportovní akce",
  HEAD_GAMING: "Vedoucí - Gaming",
  HEAD_KRUHOVE: "Vedoucí - Kruhové akce",
  ADMIN: "Administrátor",
}

/**
 * Check if a role is a HEAD role
 */
export function isHeadRole(role: string): boolean {
  return role.startsWith("HEAD_")
}

/**
 * Check if a role is ADMIN
 */
export function isAdmin(role: string): boolean {
  return role === "ADMIN"
}

/**
 * Get the section name for a HEAD role
 * Returns null if role is not a HEAD role
 */
export function getSectionForRole(role: string): string | null {
  return roleToSection[role] || null
}

/**
 * Check if user with given role can view transactions for a section
 */
export function canViewSection(role: string, sectionName: string): boolean {
  if (role === "ADMIN") return true
  if (isHeadRole(role)) {
    return roleToSection[role] === sectionName
  }
  return false
}

/**
 * Get all HEAD roles
 */
export function getHeadRoles(): AppRole[] {
  return [
    "HEAD_VEDENI",
    "HEAD_FINANCE",
    "HEAD_HR",
    "HEAD_PR",
    "HEAD_NEVZDELAVACI",
    "HEAD_VZDELAVACI",
    "HEAD_SPORTOVNI",
    "HEAD_GAMING",
    "HEAD_KRUHOVE",
  ] as AppRole[]
}
