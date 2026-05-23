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
