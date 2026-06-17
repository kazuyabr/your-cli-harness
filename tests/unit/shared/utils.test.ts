// tests/unit/shared/utils.test.ts

import { describe, it, expect } from "vitest";
import { generateId, estimateTokens, truncate, deepMerge } from "../../../src/shared/utils.js";

describe("generateId", () => {
  it("should generate a valid UUID", () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("should generate unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe("estimateTokens", () => {
  it("should estimate tokens correctly", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("hello")).toBe(2);
    expect(estimateTokens("a".repeat(100))).toBe(25);
  });
});

describe("truncate", () => {
  it("should not truncate short text", () => {
    expect(truncate("hello", 100)).toBe("hello");
  });

  it("should truncate long text", () => {
    const long = "a".repeat(1000);
    const result = truncate(long, 100);
    expect(result.length).toBeLessThan(long.length);
    expect(result).toContain("[truncated]");
  });
});

describe("deepMerge", () => {
  it("should merge simple objects", () => {
    const result = deepMerge({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it("should override values", () => {
    const result = deepMerge({ a: 1 }, { a: 2 });
    expect(result).toEqual({ a: 2 });
  });

  it("should merge nested objects", () => {
    const result = deepMerge({ a: { b: 1 } }, { a: { c: 2 } });
    expect(result).toEqual({ a: { b: 1, c: 2 } });
  });
});
