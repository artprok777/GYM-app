import confetti from "canvas-confetti"

const COLORS = ["#F5A623", "#4ADE80", "#a786ff", "#fd8bbc", "#f8deb1"]

export function fireSideCannons(durationMs = 2500): void {
  const end = Date.now() + durationMs
  const frame = () => {
    if (Date.now() > end) return
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: COLORS,
    })
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: COLORS,
    })
    requestAnimationFrame(frame)
  }
  frame()
}
