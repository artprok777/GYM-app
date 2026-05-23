import { Calendar, Dumbbell, BarChart3 } from "lucide-react"
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
      className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch h-16">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1",
              "transition-colors",
              active === id ? "text-accent" : "text-text-secondary",
            )}
          >
            <Icon size={22} strokeWidth={1.75} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
