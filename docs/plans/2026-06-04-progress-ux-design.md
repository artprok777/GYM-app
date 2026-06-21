# Progress UX Design

## Goal

Improve the Progress tab without changing the app's core data model. The screen remains a fast personal training analytics view for iPhone.

## Decisions

- Keep all three top-level tabs: `Вправа`, `Тренування`, `Загалом`.
- In `Тренування`, remove the square session calendar entirely. It is not clear enough to keep.
- Treat `Тренування` as statistics for a selected workout type, for example `Середа`.
- Increase primary touch targets to at least 52px.
- In `Вправа`, add a compact summary before charts: PR, latest weight, and change for the selected range.
- Rename `Об'єм` to `Навантаження`.
- Explain `Навантаження` as `вага × повтори`.
- Make workout progress rows clearer by showing absolute kg change, percent change, and first/latest dates.

## Non-Goals

- Do not change IndexedDB schema.
- Do not add a replacement for the removed square calendar yet.
- Do not redesign `Загалом` beyond touch target consistency if needed.
- Do not add new program management features.

## UX Shape

`Вправа` starts with filters, then a metric summary. The primary graph can still show max weight, while the second metric is labeled `Навантаження` with a small explanation.

`Тренування` starts with a workout selector and summary stats: session count, exercises with logged progress, and biggest gain. The exercise list prioritizes meaningful change: exercise name, kg delta, percent delta, first/latest weights, and date span.

`Загалом` stays as the broad overview.
