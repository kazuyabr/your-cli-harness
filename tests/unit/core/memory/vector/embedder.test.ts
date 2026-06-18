// tests/unit/core/memory/vector/embedder.test.ts

import { describe, it, expect } from "vitest";
import { NullEmbedder, createEmbedder } from "../../../../../src/core/memory/vector/embedder.js";

describe("NullEmbedder", () => {
  it("should generate deterministic embeddings", async () => {
    const embedder = new NullEmbedder(128);

    const vec1 = await embedder.embed("hello");
    const vec2 = await embedder.embed("hello");

    expect(vec1).toEqual(vec2);
    expect(vec1).toHaveLength(128);
  });

  it("should generate different embeddings for different text", async () => {
    const embedder = new NullEmbedder(128);

    const vec1 = await embedder.embed("hello");
    const vec2 = await embedder.embed("world");

    expect(vec1).not.toEqual(vec2);
  });

  it("should embed batch", async () => {
    const embedder = new NullEmbedder(64);

    const vecs = await embedder.embedBatch(["a", "b", "c"]);

    expect(vecs).toHaveLength(3);
    expect(vecs[0]).toHaveLength(64);
  });

  it("should report dimensions", () => {
    const embedder = new NullEmbedder(256);
    expect(embedder.dimensions()).toBe(256);
  });

  it("should generate values between 0 and 1", async () => {
    const embedder = new NullEmbedder(100);
    const vec = await embedder.embed("test");

    for (const v of vec) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe("createEmbedder", () => {
  it("should create NullEmbedder for null provider", () => {
    const embedder = createEmbedder("null");
    expect(embedder).toBeInstanceOf(NullEmbedder);
  });

  it("should create NullEmbedder when openai has no config", () => {
    const embedder = createEmbedder("openai");
    expect(embedder).toBeInstanceOf(NullEmbedder);
  });
});
