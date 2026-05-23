/**
 * UUID v4 generator that works in non-secure contexts.
 * `crypto.randomUUID()` requires HTTPS (or localhost) on Safari, but the
 * app runs over plain HTTP on LAN IPs during development on iPhone.
 * `crypto.getRandomValues` is available everywhere.
 */
export function uid(): string {
  const c: Crypto | undefined = globalThis.crypto

  if (c?.randomUUID) {
    try {
      return c.randomUUID()
    } catch {
      // Fall through — some browsers throw in non-secure contexts.
    }
  }

  if (c?.getRandomValues) {
    const bytes = c.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  )
}
