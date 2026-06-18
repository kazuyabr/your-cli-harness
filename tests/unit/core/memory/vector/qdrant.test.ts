// tests/unit/core/memory/vector/qdrant.test.ts

import { describe, it, expect } from "vitest";
import { QdrantAdapter } from "../../../../../src/core/memory/vector/qdrant.js";

describe("QdrantAdapter", () => {
  it("should create adapter with config", () => {
    const adapter = new QdrantAdapter({
      url: "http://localhost:6333",
      collection: "test",
    });

    expect(adapter).toBeDefined();
  });

  it("should throw when not connected", async () => {
    const adapter = new QdrantAdapter({
      url: "http://localhost:6333",
      collection: "test",
    });

    await expect(adapter.upsert([])).rejects.toThrow("not connected");
    await expect(adapter.search([], 5)).rejects.toThrow("not connected");
    await expect(adapter.delete([])).rejects.toThrow("not connected");
    await expect(adapter.count()).rejects.toThrow("not connected");
  });
});
