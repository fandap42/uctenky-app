/**
 * Logic:
 * Winter Semester (ZS): Sept - Jan. Year is the year when it starts.
 * Summer Semester (LS): Feb - Aug. Year is the year when it starts.
 * Example: Sept 2025 -> ZS25. Feb 2026 -> LS26.
 */

export function getSemester(date: Date) {
  const month = date.getMonth() + 1 // 1-12
  const year = date.getFullYear() % 100 // Last two digits

  if (month >= 9) {
    // Sept, Oct, Nov, Dec -> ZS {CurrentYear}
    return `ZS${year}`
  } else if (month === 1) {
    // Jan -> ZS {PrevYear}
    return `ZS${year - 1}`
  } else {
    // Feb - Aug -> LS {CurrentYear}
    return `LS${year}`
  }
}

export function getCurrentSemester() {
  return getSemester(new Date())
}

/**
 * Returns the date range for a given semester key (e.g., ZS24)
 */
export function getSemesterRange(semesterKey: string): { start: Date; end: Date } {
  const isWinter = semesterKey.startsWith("ZS")
  const year = 2000 + parseInt(semesterKey.slice(2))

  if (isWinter) {
    // Sept {Year} to Jan {Year+1}
    return {
      start: new Date(year, 8, 1), // Sept 1st
      end: new Date(year + 1, 0, 31, 23, 59, 59, 999), // Jan 31st
    }
  } else {
    // Feb {Year} to Aug {Year}
    return {
      start: new Date(year, 1, 1), // Feb 1st
      end: new Date(year, 7, 31, 23, 59, 59, 999), // Aug 31st
    }
  }
}

/**
 * Sorts semester keys (e.g., ZS24, LS24, ZS23) newest first
 */
export function sortSemesterKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const yearA = parseInt(a.slice(2))
    const yearB = parseInt(b.slice(2))
    if (yearA !== yearB) return yearB - yearA
    return b.charAt(0).localeCompare(a.charAt(0)) // ZS comes before LS in reverse alpha if years are same
  })
}

export const monthNames: Record<number, string> = {
  1: "Leden",
  2: "Únor",
  3: "Březen",
  4: "Duben",
  5: "Květen",
  6: "Červen",
  7: "Červenec",
  8: "Srpen",
  9: "Září",
  10: "Říjen",
  11: "Listopad",
  12: "Prosinec",
}
