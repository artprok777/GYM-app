import { describe, it, expect, vi, afterEach } from "vitest"
import { uid } from "@/lib/id"

const originalCrypto = globalThis.crypto

afterEach(() => {
  Object.defineProperty(globalThis, "crypto", {
    value: originalCrypto,
    configurable: true,
  })
})

describe("uid", () => {
  it("returns a UUID v4 string", () => {
    const id = uid()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it("returns unique values", () => {
    const set = new Set(Array.from({ length: 100 }, () => uid()))
    expect(set.size).toBe(100)
  })

  it("falls back when crypto.randomUUID throws (non-secure context)", () => {
    const fakeCrypto = {
      randomUUID: vi.fn(() => {
        throw new Error("Operation is not supported")
      }),
      getRandomValues: originalCrypto.getRandomValues.bind(originalCrypto),
    } as unknown as Crypto

    Object.defineProperty(globalThis, "crypto", {
      value: fakeCrypto,
      configurable: true,
    })

    const id = uid()
    expect(fakeCrypto.randomUUID).toHaveBeenCalled()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it("falls back when randomUUID is missing entirely", () => {
    const fakeCrypto = {
      getRandomValues: originalCrypto.getRandomValues.bind(originalCrypto),
    } as unknown as Crypto

    Object.defineProperty(globalThis, "crypto", {
      value: fakeCrypto,
      configurable: true,
    })

    const id = uid()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })
})
