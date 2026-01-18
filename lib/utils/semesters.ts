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
