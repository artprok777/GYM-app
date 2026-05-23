/**
 * Header pattern used at the top of every screen.
 * Eyebrow (small uppercase DM Mono label) + bold display title.
 */
export function ScreenHeader({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow?: string
  title: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <header className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-text-secondary mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[34px] leading-none font-medium tracking-tight">
          {title}
        </h1>
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </header>
  )
}
