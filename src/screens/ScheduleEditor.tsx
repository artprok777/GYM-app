import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
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
    if (!id) return "День відпочинку"
    return types.find((t) => t.id === id)?.name ?? "—"
  }

  // Monday first
  const orderedDays: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]
  const ordered = orderedDays
    .map((d) => schedule.find((s) => s.dayOfWeek === d))
    .filter((s): s is ScheduleEntry => s !== undefined)

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-xl pt-2">Розклад</h2>
        <p className="text-text-secondary text-sm mt-1">
          Прив'яжи тренування до днів тижня.
        </p>
      </div>
      <div className="space-y-2">
        {ordered.map((entry) => (
          <Card
            key={entry.dayOfWeek}
            className="bg-surface border-border p-3 flex items-center justify-between gap-3"
          >
            <span className="font-display text-text-primary">{ukDayName(entry.dayOfWeek)}</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 h-10 px-3 rounded-md bg-bg text-text-primary text-sm border border-border data-[state=open]:border-accent focus:outline-none"
              >
                {typeName(entry.workoutTypeId)}
                <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-surface border-border">
                <DropdownMenuItem
                  onClick={() => assign(entry.dayOfWeek, null)}
                  className="text-text-primary focus:bg-bg focus:text-text-primary"
                >
                  День відпочинку
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
          </Card>
        ))}
      </div>
    </div>
  )
}
