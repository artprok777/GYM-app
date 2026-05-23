import { describe, it, expect } from "vitest"

describe("test runner smoke check", () => {
  it("has fake-indexeddb available", () => {
    expect(typeof indexedDB).toBe("object")
    expect(indexedDB.open).toBeTypeOf("function")
  })
})
