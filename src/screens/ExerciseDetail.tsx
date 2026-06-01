import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, Trash2 } from "lucide-react"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { db } from "@/db/client"
import { updateExercise, deleteExercise } from "@/db/exercises"
import {
  getExerciseSessionHistory,
  getPersonalRecord,
  type ExerciseSessionEntry,
} from "@/db/progress"
import type { ExerciseTemplate } from "@/db/schema"
import {
  formatSessionDate,
  formatWeight,
  groupSets,
  pluralPidh,
} from "@/lib/format"
import { useSyncRefresh } from "@/hooks/useSyncRefresh"

export function ExerciseDetail({
  exerciseId,
  onBack,
}: {
  exerciseId: string
  onBack: () => void
}) {
  const [exercise, setExercise] = useState<ExerciseTemplate | null>(null)

  const refresh = useCallback(async () => {
    const ex = await db.exercises.get(exerciseId)
    setExercise(ex && !ex.deletedAt ? ex : null)
  }, [exerciseId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useSyncRefresh(refresh)

  if (!exercise) {
    return (
      <div className="px-5 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-text-secondary hover:text-accent -ml-1 text-[14px]"
        >
          <ChevronLeft size={18} /> Назад
        </button>
        <p className="text-text-secondary text-sm py-8 text-center">
          Вправа недоступна
        </p>
      </div>
    )
  }

  return (
    <div className="px-5 py-6 pb-12 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-text-secondary hover:text-accent -ml-1 text-[14px]"
      >
        <ChevronLeft size={18} /> Тренування
      </button>

      <div>
        <p className="font-display text-[11px] uppercase tracking-[0.2em] text-text-secondary mb-1.5">
          Вправа
        </p>
        <h1 className="font-display text-[28px] leading-tight font-medium tracking-tight text-text-primary">
          {exercise.name}
        </h1>
      </div>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid grid-cols-2 w-full bg-surface border border-border h-11 p-1 rounded-lg">
          <TabsTrigger
            value="edit"
            className="data-[state=active]:bg-bg data-[state=active]:text-text-primary data-[state=active]:shadow-none text-text-secondary font-display text-[13px] uppercase tracking-[0.12em]"
          >
            Редагувати
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-bg data-[state=active]:text-text-primary data-[state=active]:shadow-none text-text-secondary font-display text-[13px] uppercase tracking-[0.12em]"
          >
            Історія
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-5">
          <EditPane
            exercise={exercise}
            onChanged={refresh}
            onDelete={async () => {
              if (!confirm("Видалити цю вправу разом з історією?")) return
              await deleteExercise(exercise.id)
              onBack()
            }}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-5">
          <HistoryPane exerciseName={exercise.name} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EditPane({
  exercise,
  onChanged,
  onDelete,
}: {
  exercise: ExerciseTemplate
  onChanged: () => void | Promise<void>
  onDelete: () => void | Promise<void>
}) {
  const [name, setName] = useState(exercise.name)
  const [sets, setSets] = useState(String(exercise.targetSets))
  const [reps, setReps] = useState(
    exercise.targetReps != null ? String(exercise.targetReps) : "",
  )
  const [weight, setWeight] = useState(
    exercise.targetWeight != null ? String(exercise.targetWeight) : "",
  )

  async function saveName() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== exercise.name) {
      await updateExercise(exercise.id, { name: trimmed })
      await onChanged()
    } else if (!trimmed) {
      setName(exercise.name)
    }
  }

  async function saveSets() {
    const n = parseInt(sets, 10)
    if (n > 0 && n !== exercise.targetSets) {
      await updateExercise(exercise.id, { targetSets: n })
      await onChanged()
    } else {
      setSets(String(exercise.targetSets))
    }
  }

  async function saveReps() {
    const raw = reps.trim()
    if (raw === "") {
      if (exercise.targetReps != null) {
        await updateExercise(exercise.id, { targetReps: undefined })
        await onChanged()
      }
      return
    }
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n > 0 && n !== exercise.targetReps) {
      await updateExercise(exercise.id, { targetReps: n })
      await onChanged()
    }
  }

  async function saveWeight() {
    const raw = weight.trim().replace(",", ".")
    if (raw === "") {
      if (exercise.targetWeight != null) {
        await updateExercise(exercise.id, { targetWeight: undefined })
        await onChanged()
      }
      return
    }
    const n = parseFloat(raw)
    if (!isNaN(n) && n >= 0 && n !== exercise.targetWeight) {
      await updateExercise(exercise.id, { targetWeight: n })
      await onChanged()
    }
  }

  return (
    <div className="space-y-5">
      <Field label="Назва">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
          className="bg-bg border-border text-text-primary h-11"
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Підходи">
          <Input
            type="number"
            inputMode="numeric"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            onBlur={saveSets}
            className="bg-bg border-border text-text-primary text-center font-display h-11"
            min="1"
          />
        </Field>
        <Field label="Повтори">
          <Input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={saveReps}
            className="bg-bg border-border text-text-primary text-center font-display h-11"
            min="1"
            placeholder="—"
          />
        </Field>
        <Field label="Вага, кг">
          <Input
            type="number"
            inputMode="decimal"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={saveWeight}
            className="bg-bg border-border text-text-primary text-center font-display h-11"
            min="0"
            placeholder="—"
          />
        </Field>
      </div>

      <Button
        onClick={onDelete}
        variant="ghost"
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-12 mt-4"
      >
        <Trash2 size={16} className="mr-1.5" /> Видалити вправу
      </Button>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="font-display text-[11px] uppercase tracking-[0.15em] text-text-secondary">
        {label}
      </span>
      {children}
    </label>
  )
}

function HistoryPane({ exerciseName }: { exerciseName: string }) {
  const [history, setHistory] = useState<ExerciseSessionEntry[]>([])
  const [pr, setPr] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setHistory(await getExerciseSessionHistory(exerciseName))
    setPr(await getPersonalRecord(exerciseName))
  }, [exerciseName])

  useEffect(() => {
    refresh()
  }, [refresh])

  useSyncRefresh(refresh)

  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-1">
        <p className="font-display text-text-primary text-base">Ще немає історії</p>
        <p className="text-text-secondary text-sm">
          Залогуй перший підхід на вкладці «Сьогодні».
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pr != null && (
        <div className="rounded-xl border border-accent/40 bg-accent/[0.08] px-4 py-3 flex items-center justify-between">
          <span className="font-display text-[11px] uppercase tracking-[0.2em] text-accent">
            Особистий рекорд
          </span>
          <span className="font-display text-[22px] text-text-primary tabular-nums">
            {formatWeight(pr)}{" "}
            <span className="text-text-secondary text-[13px]">кг</span>
          </span>
        </div>
      )}

      <div className="space-y-3">
        {history.map((entry, i) => (
          <SessionCard key={entry.sessionId} entry={entry} isLatest={i === 0} />
        ))}
      </div>
    </div>
  )
}

function SessionCard({
  entry,
  isLatest,
}: {
  entry: ExerciseSessionEntry
  isLatest: boolean
}) {
  const groups = groupSets(entry.sets)
  const totalSets = entry.sets.length
  const totalVolume = entry.sets.reduce((sum, s) => sum + s.weight * s.reps, 0)

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3.5 space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p
          className={
            isLatest
              ? "font-display text-[11px] uppercase tracking-[0.18em] text-accent"
              : "font-display text-[11px] uppercase tracking-[0.18em] text-text-secondary"
          }
        >
          {formatSessionDate(entry.date, isLatest)}
        </p>
        <p className="font-display text-[11px] uppercase tracking-[0.15em] text-text-secondary">
          {totalSets} {pluralPidh(totalSets)}
        </p>
      </div>

      <ul className="space-y-1">
        {groups.map((g, idx) => (
          <li
            key={idx}
            className="flex items-baseline gap-2 font-display text-[15px] tabular-nums"
          >
            <span className="text-text-secondary w-9 shrink-0">
              {g.count}×
            </span>
            <span className="text-text-primary">
              {formatWeight(g.weight)}{" "}
              <span className="text-text-secondary text-[12px]">кг</span>
            </span>
            <span className="text-text-secondary text-[12px]">×</span>
            <span className="text-text-primary">
              {g.reps}{" "}
              <span className="text-text-secondary text-[12px]">повт</span>
            </span>
          </li>
        ))}
      </ul>

      {totalVolume > 0 && (
        <p className="font-display text-[11px] uppercase tracking-[0.15em] text-text-secondary pt-1 border-t border-border">
          Об'єм · {formatWeight(totalVolume)} кг
        </p>
      )}
    </div>
  )
}
