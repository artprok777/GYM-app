import { useRef, useEffect, useCallback } from "react"

interface WheelPickerProps {
  values: number[]
  value: number
  onChange: (v: number) => void
  formatValue?: (v: number) => string
  unit?: string
}

const ITEM_H = 44
const VISIBLE = 5
const PADDING_H = Math.floor(VISIBLE / 2) * ITEM_H // 88px

export function WheelPicker({ values, value, onChange, formatValue, unit }: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const idx = values.indexOf(value)
    if (idx >= 0 && containerRef.current) {
      containerRef.current.scrollTop = idx * ITEM_H
    }
  }, [])

  const commit = useCallback(() => {
    if (!containerRef.current) return
    const raw = containerRef.current.scrollTop
    const idx = Math.max(0, Math.min(values.length - 1, Math.round(raw / ITEM_H)))
    containerRef.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" })
    onChange(values[idx])
  }, [values, onChange])

  function handleScroll() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(commit, 80)
  }

  return (
    <div className="relative overflow-hidden" style={{ height: VISIBLE * ITEM_H }}>
      {/* Center highlight band */}
      <div
        className="absolute inset-x-0 border-y border-border bg-surface/50 pointer-events-none z-10"
        style={{ top: PADDING_H, height: ITEM_H }}
      />
      {/* Top fade */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none z-20 bg-gradient-to-b from-bg to-transparent"
        style={{ height: PADDING_H }}
      />
      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-20 bg-gradient-to-t from-bg to-transparent"
        style={{ height: PADDING_H }}
      />

      <div
        ref={containerRef}
        className="h-full overflow-y-scroll no-scrollbar"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
        onScroll={handleScroll}
      >
        <div style={{ paddingTop: PADDING_H, paddingBottom: PADDING_H }}>
          {values.map((v) => (
            <div
              key={v}
              style={{ height: ITEM_H, scrollSnapAlign: "center" }}
              className="flex items-center justify-center gap-1.5 select-none"
            >
              <span className="font-display text-[26px] leading-none text-text-primary">
                {formatValue ? formatValue(v) : String(v)}
              </span>
              {unit && (
                <span className="font-display text-[13px] text-text-secondary mt-1">{unit}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
