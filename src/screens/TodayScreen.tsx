import { useCallback, useEffect, useState } from "react"
import { ChevronDown, Dumbbell } from "lucide-react"
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
  markSessionCelebrated,
} from "@/db/sessions"
import { db } from "@/db/client"
import type {
  ExerciseTemplate,
  WorkoutType,
  WorkoutSession,
} from "@/db/schema"
import { ukDayName } from "@/lib/format"
import { fireSideCannons } from "@/lib/confetti"
import { useSyncRefresh } from "@/hooks/useSyncRefresh"

interface ExerciseState {
  exercise: ExerciseTemplate
  loggedThisSession: number
}

export default function TodayScreen() {
  const [allTypes, setAllTypes] = useState<WorkoutType[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [items, setItems] = useState<ExerciseState[]>([])
  const [openExercise, setOpenExercise] = useState<ExerciseTemplate | null>(null)

  const loadTypes = useCallback(async () => {
    const programs = await listPrograms()
    if (!programs[0]) return
    const types = await listWorkoutTypes(programs[0].id)
    setAllTypes(types)
    if (selectedTypeId === null) {
      const scheduledId = await getTodaysWorkoutType()
      setSelectedTypeId(scheduledId ?? types[0]?.id ?? null)
    }
  }, [selectedTypeId])

  const loadSession = useCallback(async () => {
    if (!selectedTypeId) {
      setSession(null)
      setItems([])
      return
    }
    const s = await getOrStartTodaysSession(selectedTypeId)
    setSession(s)
    const exercises = await listExercises(selectedTypeId)
    const states: ExerciseState[] = await Promise.all(exercises.map(async (ex) => {
      const logged = await getSessionSetsForExercise(s.id, ex.name)
      return {
        exercise: ex,
        loggedThisSession: logged.length,
      }
    }))
    setItems(states)
  }, [selectedTypeId])

  useEffect(() => {
    void loadTypes()
  }, [loadTypes])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  useSyncRefresh(useCallback(async () => {
    await loadTypes()
    await loadSession()
  }, [loadTypes, loadSession]))

  const handleSetLogged = useCallback(async () => {
    const sessionId = session?.id
    await loadSession()
    if (!selectedTypeId || !sessionId) return

    const freshSession = await db.sessions.get(sessionId)
    if (!freshSession || freshSession.celebratedAt != null) return

    const exercises = await listExercises(selectedTypeId)
    if (exercises.length === 0) return

    for (const ex of exercises) {
      const sets = await getSessionSetsForExercise(freshSession.id, ex.name)
      if (sets.length < ex.targetSets) return
    }

    fireSideCannons()
    await markSessionCelebrated(freshSession.id)
    setSession((s) =>
      s?.id === freshSession.id ? { ...s, celebratedAt: Date.now() } : s,
    )
  }, [loadSession, selectedTypeId, session?.id])

  const today = new Date().getDay()
  const selectedType = allTypes.find((t) => t.id === selectedTypeId)

  if (allTypes.length === 0) {
    return (
      <div className="px-5 py-6 space-y-6">
        <h1 className="font-display text-[34px] leading-none font-medium">
          Сьогодні
        </h1>
        <EmptyState
          title="Програма ще не створена"
          body="Перейди у «Програма», створи свої тренування (наприклад A, B, C) і додай у них вправи."
        />
      </div>
    )
  }

  return (
    <>
      <div className="px-5 py-6 pb-12 space-y-6">
        <div className="space-y-3">
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-text-secondary">
            {ukDayName(today)}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger className="group flex items-center gap-2 focus:outline-none">
              <h1 className="font-display text-[34px] leading-none font-medium tracking-tight text-text-primary">
                {selectedType?.name ?? "Обери тренування"}
              </h1>
              <ChevronDown
                size={22}
                className="text-accent group-data-[state=open]:rotate-180 transition-transform"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-surface border-border min-w-[180px]"
            >
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

          {items.length > 0 && (
            <div className="flex items-center gap-1.5">
              {items.map((item) => {
                const done = item.loggedThisSession >= item.exercise.targetSets
                const inProgress = item.loggedThisSession > 0 && !done
                return (
                  <div
                    key={item.exercise.id}
                    className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                      done
                        ? "bg-success"
                        : inProgress
                          ? "bg-accent"
                          : "bg-border"
                    }`}
                  />
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <ExerciseCard
              key={item.exercise.id}
              exercise={item.exercise}
              loggedThisSession={item.loggedThisSession}
              onClick={() => setOpenExercise(item.exercise)}
            />
          ))}
          {items.length === 0 && (
            <EmptyState
              title="У цьому тренуванні немає вправ"
              body="Додай вправи у вкладці «Програма»."
            />
          )}
        </div>
      </div>

      {openExercise && session && (
        <SetLoggerSheet
          exercise={openExercise}
          sessionId={session.id}
          onSetLogged={handleSetLogged}
          onClose={() => {
            setOpenExercise(null)
            void loadSession()
          }}
        />
      )}
    </>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent-muted text-accent mb-1">
        <Dumbbell size={18} />
      </div>
      <p className="font-display text-text-primary text-base">{title}</p>
      <p className="text-text-secondary text-sm leading-relaxed">{body}</p>
    </div>
  )
}
