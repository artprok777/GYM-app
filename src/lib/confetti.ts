import confetti from "canvas-confetti"

const COLORS = ["#F5A623", "#4ADE80", "#a786ff", "#fd8bbc", "#f8deb1"]
const Z_INDEX = 2147483647
const CLEANUP_DELAY_MS = 5000
let canvas: HTMLCanvasElement | null = null
let cannon: confetti.CreateTypes | null = null
let cleanupTimer: ReturnType<typeof setTimeout> | null = null

if (typeof window !== "undefined") {
  ;(window as unknown as { gymConfetti: () => void }).gymConfetti = () =>
    fireSideCannons()
}

function sizeCanvasToViewport(target: HTMLCanvasElement): void {
  const viewport = window.visualViewport
  const width = Math.ceil(viewport?.width ?? window.innerWidth)
  const height = Math.ceil(viewport?.height ?? window.innerHeight)

  target.style.width = `${width}px`
  target.style.height = `${height}px`
  target.width = width
  target.height = height
}

function getCannon(): confetti.CreateTypes {
  if (!canvas) {
    canvas = document.createElement("canvas")
    canvas.setAttribute("aria-hidden", "true")
    canvas.style.position = "fixed"
    canvas.style.inset = "0"
    canvas.style.pointerEvents = "none"
    canvas.style.zIndex = String(Z_INDEX)
    canvas.style.width = "100vw"
    canvas.style.height = "100dvh"
    canvas.style.contain = "strict"
  }

  sizeCanvasToViewport(canvas)
  if (!document.body.contains(canvas)) {
    document.body.appendChild(canvas)
  }

  if (!cannon) {
    cannon = confetti.create(canvas, {
      resize: false,
      useWorker: false,
    })
  }

  return cannon
}

function scheduleCleanup(): void {
  if (cleanupTimer) clearTimeout(cleanupTimer)
  cleanupTimer = setTimeout(() => {
    cannon?.reset()
    if (canvas && document.body.contains(canvas)) {
      document.body.removeChild(canvas)
    }
  }, CLEANUP_DELAY_MS)
}

export function fireSideCannons(durationMs = 2500): void {
  if (typeof document === "undefined") return

  const fire = getCannon()
  const end = Date.now() + durationMs
  const frame = () => {
    if (Date.now() > end) return
    fire({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: COLORS,
      zIndex: Z_INDEX,
    })
    fire({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: COLORS,
      zIndex: Z_INDEX,
    })
    requestAnimationFrame(frame)
  }
  frame()
  scheduleCleanup()
}
