import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ExerciseCard } from "@/components/ExerciseCard"
import { SetLoggerSheet } from "@/components/SetLoggerSheet"
import { listExercises } from "@/db/exercises"
import { listPrograms, listWorkoutTypes } from "@/db/programs"
import { getTodaysWorkoutType } from "@/db/schedule"
import {
  getOrStartTodaysSession,
  getSessionSetsForExercise,
  getLastSetsForExercise,
} from "@/db/sessions"
import type {
  ExerciseTemplate,
  WorkoutType,
  WorkoutSession,
  LoggedSet,
} from "@/db/schema"
import { ukDayName } from "@/lib/format"

interface ExerciseState {
  exercise: ExerciseTemplate
  lastSets: LoggedSet[]
  loggedThisSession: number
}

export default function TodayScreen() {
  const [allTypes, setAllTypes] = useState<WorkoutType[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [items, setItems] = useState<ExerciseState[]>([])
  const [openExercise, setOpenExercise] = useState<ExerciseTemplate | null>(null)

  async function loadTypes() {
    const programs = await listPrograms()
    if (!programs[0]) return
    const types = await listWorkoutTypes(programs[0].id)
    setAllTypes(types)
    if (selectedTypeId === null) {
      const scheduledId = await getTodaysWorkoutType()
      setSelectedTypeId(scheduledId ?? types[0]?.id ?? null)
    }
  }

  async function loadSession() {
    if (!selectedTypeId) {
      setSession(null)
      setItems([])
      return
    }
    const s = await getOrStartTodaysSession(selectedTypeId)
    setSession(s)
    const exercises = await listExercises(selectedTypeId)
    const states: ExerciseState[] = []
    for (const ex of exercises) {
      const lastSets = await getLastSetsForExercise(ex.name, s.id)
      const logged = await getSessionSetsForExercise(s.id, ex.name)
      states.push({
        exercise: ex,
        lastSets,
        loggedThisSession: logged.length,
      })
    }
    setItems(states)
  }

  useEffect(() => {
    loadTypes()
  }, [])

  useEffect(() => {
    loadSession()
  }, [selectedTypeId])

  const today = new Date().getDay()
  const selectedType = allTypes.find((t) => t.id === selectedTypeId)

  if (allTypes.length === 0) {
    return (
      <div className="p-6">
        <h1 className="font-display text-3xl">Сьогодні</h1>
        <p className="text-text-secondary mt-4 text-sm">
          Створи програму на вкладці «Програма», щоб почати.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="p-6 pb-24 space-y-4">
        <div>
          <p className="text-text-secondary text-sm uppercase tracking-wider">
            {ukDayName(today)}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 font-display text-3xl text-text-primary focus:outline-none">
              {selectedType?.name ?? "Обери тренування"}
              <ChevronDown size={24} className="text-accent" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-surface border-border">
              {allTypes.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => setSelectedTypeId(t.id)}
                  className="text-text-primary focus:bg-bg focus:text-text-primary"
                >
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 pt-2">
          {items.map((item) => (
            <ExerciseCard
              key={item.exercise.id}
              exercise={item.exercise}
              lastSets={item.lastSets}
              loggedThisSession={item.loggedThisSession}
              onClick={() => setOpenExercise(item.exercise)}
            />
          ))}
          {items.length === 0 && (
            <p className="text-text-secondary text-sm py-8 text-center">
              У цьому тренуванні поки немає вправ. Додай їх у «Програма».
            </p>
          )}
        </div>
      </div>

      {openExercise && session && (
        <SetLoggerSheet
          exercise={openExercise}
          sessionId={session.id}
          onClose={() => {
            setOpenExercise(null)
            loadSession()
          }}
        />
      )}
    </>
  )
}
