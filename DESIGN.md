# Design

## Theme

Dark only. No light mode. Context: gym floor, artificial lighting, high ambient brightness from surroundings.
Dark surface makes numbers pop. Light mode would feel wrong — like a fitness blog, not a training tool.

## Color

Strategy: **Restrained** — near-black base, one warm amber accent, hairline borders.
Amber reads as data-positive (PR, active state, progress) without aggression.
No second accent. No gradients on text.

### Palette

| Token | Value | Use |
|---|---|---|
| `bg` | `#0C0C0E` | Page background (near-black, not pure) |
| `surface` | `#161618` | Cards, sheets, elevated surfaces |
| `border` | `#2A2A30` | Hairline separators, structural only |
| `accent` | `#F5A623` | Active state, PRs, progress, highlights |
| `accent-muted` | `rgba(245,166,35,0.12)` | Subtle accent fills |
| `text-primary` | `#F8F8F8` | Primary text |
| `text-secondary` | `#8A8A9A` | Labels, metadata, eyebrows |
| `success` | `#4ADE80` | Completed sets |
| `destructive` | system red | Delete actions only |

Gradients: restrained, used only as background atmosphere (radial glow at corners, opacity ≤ 6%).
Never gradient text. Never gradient borders.

## Typography

| Role | Font | Notes |
|---|---|---|
| Display / numbers | DM Mono | Monospaced — weights, reps, set counts render like a scoreboard |
| Body / labels | Geist Sans | Clean, not overused in gym apps |

- `tabular-nums` everywhere numeric values appear
- Body line length: not applicable (app UI, not long-form)
- Eyebrow labels: 10–11px, uppercase, tracking `0.2em`, always `text-secondary`
- Numbers (weight, reps): 24–42px, `font-display`, always `text-primary`
- Section titles: 20–34px, `font-display`, `font-medium`

## Spacing & Layout

- Touch targets: min 52px height on all tappable elements
- Screen padding: `px-5` (20px) horizontal, `py-6` top
- Card inner padding: `p-3` to `p-4`
- Stack gap: `space-y-5` between major sections, `space-y-2` within sections
- Dividers: `divide-y divide-border` hairlines inside lists — no heavy separators

## Components

### Bottom Sheets
- `fixed bottom-0`, `rounded-t-2xl`, `border-t border-border`
- Spring animation: `damping: 32, stiffness: 380`
- `maxHeight: calc(100dvh - env(safe-area-inset-top) - 8px)` — keyboard-aware
- `flex flex-col` with `overflow-y-auto flex-1` for scrollable content
- Drag handle: 10×4px pill, `bg-border`, `touch-none`, triggers framer-motion drag
- Swipe down to dismiss: `offset.y > 80 || velocity.y > 500`

### Tab Bar
- Fixed bottom, `height: 4rem`, backdrop blur
- `env(safe-area-inset-bottom)` padding
- Active indicator: amber line top (`layoutId` animated with spring)
- Labels: 10px, uppercase, tracking `0.2em`

### Exercise Cards
- Left status stripe: `border` = untouched, `accent` = in progress, `success` = complete
- Eyebrow: "ОСТАННІЙ РАЗ" in secondary
- Chevron right indicates drill-down

### Wheel Picker (Weight)
- Custom iOS-style drum, CSS scroll snap
- 0–200 kg, 0.5 kg step
- 5 visible items, ITEM_H = 44px
- Center highlight band: `bg-surface/50 border-y border-border`
- Top/bottom fades: `from-bg to-transparent`

### NumberField (Reps)
- Large centered number, `text-[42px] font-display`
- ± stepper buttons below

### Eyebrow Pattern
```
<p class="font-display text-[10px] uppercase tracking-[0.2em] text-text-secondary">
  LABEL
</p>
```

## Motion

- Bottom sheets: spring in/out (`y: "100%"` → `y: 0`)
- Tab indicator: spring layoutId transition
- Set logged: amber flash animation on the logged row (backgroundColor keyframe)
- Drag dismiss: `dragElastic: { top: 0, bottom: 0.4 }` — resistance on drag up
- Transitions should use `easeOut` curves — no bounce, no elastic, no spring on simple fades
- Respect `prefers-reduced-motion`: keep structural motion (sheet open), skip decorative flashes

## iOS / PWA

- `viewport-fit=cover`, `apple-mobile-web-app-capable`
- `env(safe-area-inset-top)` on main content
- `env(safe-area-inset-bottom)` on tab bar and sheets
- `user-scalable=no` — prevents accidental zoom during workout
- `overscroll-behavior: none` on body
- Service worker: `skipWaiting: true`, `clientsClaim: true`, auto-reload on `controllerchange`
