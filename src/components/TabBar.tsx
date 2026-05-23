import { Calendar, Dumbbell, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export type Tab = "today" | "program" | "progress"

const TABS: { id: Tab; label: string; Icon: typeof Calendar }[] = [
  { id: "today", label: "Сьогодні", Icon: Calendar },
  { id: "program", label: "Програма", Icon: Dumbbell },
  { id: "progress", label: "Прогрес", Icon: BarChart3 },
]

export function TabBar({
  active,
  onChange,
}: {
  active: Tab
  onChange: (t: Tab) => void
}) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative flex items-stretch h-16">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-text-primary" : "text-text-secondary",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 bg-accent"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={isActive ? 2 : 1.5}
                className={isActive ? "text-accent" : ""}
              />
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
