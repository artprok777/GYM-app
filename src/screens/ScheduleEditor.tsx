import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { getSchedule, setScheduleEntry } from "@/db/schedule"
import { listPrograms, listWorkoutTypes } from "@/db/programs"
import type { ScheduleEntry, WorkoutType, DayOfWeek } from "@/db/schema"
import { ukDayName } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ScheduleEditor() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [types, setTypes] = useState<WorkoutType[]>([])

  async function refresh() {
    const programs = await listPrograms()
    if (programs[0]) setTypes(await listWorkoutTypes(programs[0].id))
    setSchedule(await getSchedule())
  }

  useEffect(() => {
    refresh()
  }, [])

  async function assign(day: DayOfWeek, wtId: string | null) {
    await setScheduleEntry(day, wtId)
    await refresh()
  }

  function typeName(id: string | null): string {
    if (!id) return "Відпочинок"
    return types.find((t) => t.id === id)?.name ?? "—"
  }

  // Monday first
  const orderedDays: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]
  const ordered = orderedDays
    .map((d) => schedule.find((s) => s.dayOfWeek === d))
    .filter((s): s is ScheduleEntry => s !== undefined)

  const todayDay = new Date().getDay()

  return (
    <section className="space-y-4">
      <div>
        <p className="font-display text-[11px] uppercase tracking-[0.2em] text-text-secondary mb-1.5">
          Розклад
        </p>
        <h2 className="font-display text-xl text-text-primary">
          Тижневий графік
        </h2>
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
        {ordered.map((entry) => {
          const isToday = entry.dayOfWeek === todayDay
          const isRest = entry.workoutTypeId === null
          return (
            <li
              key={entry.dayOfWeek}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5",
                isToday && "bg-accent/[0.04]",
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isRest ? "bg-border" : "bg-accent",
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="font-sans font-medium text-text-primary text-[15px] leading-tight">
                  {ukDayName(entry.dayOfWeek)}
                </div>
                {isToday && (
                  <div className="font-display text-[10px] uppercase tracking-wider text-accent mt-0.5">
                    Сьогодні
                  </div>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-bg text-text-primary text-[13px] border border-border data-[state=open]:border-accent focus:outline-none">
                  <span
                    className={isRest ? "text-text-secondary" : "text-text-primary"}
                  >
                    {typeName(entry.workoutTypeId)}
                  </span>
                  <ChevronDown size={14} className="text-text-secondary" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-surface border-border min-w-[160px]"
                >
                  <DropdownMenuItem
                    onClick={() => assign(entry.dayOfWeek, null)}
                    className="text-text-primary focus:bg-bg focus:text-text-primary"
                  >
                    Відпочинок
                  </DropdownMenuItem>
                  {types.map((t) => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() => assign(entry.dayOfWeek, t.id)}
                      className="text-text-primary focus:bg-bg focus:text-text-primary"
                    >
                      {t.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
