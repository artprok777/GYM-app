import { useState, useEffect, useCallback, useRef } from "react"
import { motion, useMotionValue, animate, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { mondayOf, getWeekCompletions } from "@/db/progress"
import type { DayCompletion, DayState } from "@/db/progress"
import { useSyncRefresh } from "@/hooks/useSyncRefresh"

const DAY_MS = 86_400_000
const DAY_LABELS = ["M", "Tu", "W", "Th", "F", "Sa", "Su"]
const UK_MONTHS_SHORT = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"]

function formatWeekRange(weekStart: number): string {
  const start = new Date(weekStart)
  const end = new Date(weekStart + 6 * DAY_MS)
  const sm = UK_MONTHS_SHORT[start.getMonth()]
  const em = UK_MONTHS_SHORT[end.getMonth()]
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${sm}`
  }
  return `${start.getDate()} ${sm} – ${end.getDate()} ${em}`
}

const circleStyles: Record<DayState, string> = {
  done:    "bg-success/15 border border-success/50",
  partial: "bg-accent/15 border border-accent/40",
  missed:  "bg-transparent border border-border",
  rest:    "bg-transparent border border-dashed border-border",
  today:   "bg-transparent border-2 border-accent",
  future:  "bg-transparent border border-border",
}

const textStyles: Record<DayState, string> = {
  done:    "text-success",
  partial: "text-accent",
  missed:  "text-text-secondary",
  rest:    "text-text-secondary",
  today:   "text-accent",
  future:  "text-text-secondary opacity-40",
}

function DayCell({ day, onTap, index }: { day: DayCompletion; onTap: () => void; index: number }) {
  const d = new Date(day.date)
  const dateNum = d.getDate()
  const label = DAY_LABELS[index]
  const tappable = day.state !== "future" && day.state !== "rest"

  return (
    <motion.button
      className="flex flex-col items-center justify-center gap-[3px] h-[54px]"
      onClick={tappable ? onTap : undefined}
      disabled={!tappable}
      whileTap={tappable ? { scale: 0.88 } : undefined}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      aria-label={tappable ? `${label} ${dateNum}` : undefined}
    >
      <span className="font-display text-[9px] uppercase tracking-wider text-text-secondary leading-none">
        {label}
      </span>
      <div className={`w-[28px] h-[28px] rounded-full flex items-center justify-center ${circleStyles[day.state]}`}>
        {day.state === "done" ? (
          <Check size={12} className="text-success" strokeWidth={2.5} />
        ) : day.state === "rest" ? (
          <span className="text-text-secondary text-[10px] leading-none">·</span>
        ) : (
          <span className={`font-display text-[11px] tabular-nums leading-none ${textStyles[day.state]}`}>
            {dateNum}
          </span>
        )}
      </div>
    </motion.button>
  )
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
}

export function WeekStrip({ onDayTap }: { onDayTap: (date: number) => void }) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(Date.now()))
  const [days, setDays] = useState<DayCompletion[]>([])
  const [direction, setDirection] = useState(0)
  const dragX = useMotionValue(0)
  const isDragging = useRef(false)

  const currentWeekStart = mondayOf(Date.now())
  const canGoForward = weekStart < currentWeekStart

  const refresh = useCallback(async () => {
    setDays(await getWeekCompletions(weekStart))
  }, [weekStart])

  useEffect(() => { void refresh() }, [refresh])
  useSyncRefresh(refresh)

  function goBack() {
    setDirection(1)
    setWeekStart(w => w - 7 * DAY_MS)
  }

  function goForward() {
    if (!canGoForward) return
    setDirection(-1)
    setWeekStart(w => w + 7 * DAY_MS)
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-0.5">
        <span className="font-display text-[10px] uppercase tracking-[0.15em] text-text-secondary">
          {formatWeekRange(weekStart)}
        </span>
      </div>

      <motion.div
        style={{ x: dragX }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        onDragStart={() => { isDragging.current = true }}
        onDragEnd={(_, info) => {
          isDragging.current = false
          const threshold = 55
          if (info.offset.x > threshold) {
            goBack()
          } else if (info.offset.x < -threshold && canGoForward) {
            goForward()
          }
          void animate(dragX, 0, { type: "spring", stiffness: 500, damping: 40 })
        }}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={weekStart}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="grid grid-cols-7"
          >
            {days.map((day, i) => (
              <DayCell
                key={day.date}
                day={day}
                index={i}
                onTap={() => {
                  if (!isDragging.current) onDayTap(day.date)
                }}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
