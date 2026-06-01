import type { LoggedSet } from "@/db/schema"

export function formatWeight(w: number): string {
  return Number(w).toString()
}

export function formatLastSession(sets: LoggedSet[]): string {
  if (sets.length === 0) return "—"

  const allSame = sets.every(
    (s) => s.weight === sets[0].weight && s.reps === sets[0].reps,
  )

  if (allSame) {
    return `${formatWeight(sets[0].weight)} кг × ${sets[0].reps} × ${sets.length}`
  }

  return (
    sets.map((s) => `${formatWeight(s.weight)}×${s.reps}`).join(", ") + " кг"
  )
}

const DAYS = [
  "Неділя",
  "Понеділок",
  "Вівторок",
  "Середа",
  "Четвер",
  "П'ятниця",
  "Субота",
]

export function ukDayName(day: number): string {
  return DAYS[day]
}

export interface SetGroup {
  count: number
  weight: number
  reps: number
}

export function groupSets(sets: LoggedSet[]): SetGroup[] {
  const groups: SetGroup[] = []
  for (const s of sets) {
    const last = groups[groups.length - 1]
    if (last && last.weight === s.weight && last.reps === s.reps) {
      last.count++
    } else {
      groups.push({ count: 1, weight: s.weight, reps: s.reps })
    }
  }
  return groups
}

export function pluralPidh(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return "підхід"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "підходи"
  return "підходів"
}

export function formatSessionDate(ts: number, isLatest: boolean): string {
  if (isLatest) return "Попереднє тренування"
  return new Date(ts).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
