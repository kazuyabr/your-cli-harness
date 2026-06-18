// tests/unit/core/memory/vector/chunker.test.ts

import { describe, it, expect } from "vitest";
import { DocumentChunker } from "../../../../../src/core/memory/vector/chunker.js";

describe("DocumentChunker", () => {
  it("should return single chunk for small document", () => {
    const chunker = new DocumentChunker({ chunkSize: 1000, overlap: 200 });
    const chunks = chunker.chunk("doc1", "Hello world", "test.md");

    expect(chunks).toHaveLength(1);
    expect(chunks[0].id).toBe("doc1_0");
    expect(chunks[0].content).toBe("Hello world");
    expect(chunks[0].metadata.totalChunks).toBe(1);
  });

  it("should split large document into chunks", () => {
    const chunker = new DocumentChunker({ chunkSize: 10, overlap: 3 });
    const content = "a".repeat(25);
    const chunks = chunker.chunk("doc1", content, "test.md");

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].metadata.totalChunks).toBe(chunks.length);
  });

  it("should apply overlap between chunks", () => {
    const chunker = new DocumentChunker({ chunkSize: 10, overlap: 3 });
    const content = "ABCDEFGHIJ12345";
    const chunks = chunker.chunk("doc1", content, "test.md");

    // First chunk ends at 10, second starts at 7 (10-3)
    expect(chunks[0].content).toBe("ABCDEFGHIJ");
    expect(chunks[1].content).toContain("HIJ");
  });

  it("should handle overlap >= chunkSize", () => {
    const chunker = new DocumentChunker({ chunkSize: 10, overlap: 10 });
    const content = "a".repeat(25);
    const chunks = chunker.chunk("doc1", content, "test.md");

    // Should not infinite loop
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("should chunk multiple documents", () => {
    const chunker = new DocumentChunker({ chunkSize: 1000, overlap: 200 });
    const chunks = chunker.chunkMultiple([
      { id: "doc1", content: "Hello", source: "a.md" },
      { id: "doc2", content: "World", source: "b.md" },
    ]);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].metadata.source).toBe("a.md");
    expect(chunks[1].metadata.source).toBe("b.md");
  });

  it("should set correct chunk metadata", () => {
    const chunker = new DocumentChunker({ chunkSize: 10, overlap: 3 });
    const content = "a".repeat(25);
    const chunks = chunker.chunk("doc1", content, "test.md");

    expect(chunks[0].metadata.chunkIndex).toBe(0);
    expect(chunks[0].metadata.source).toBe("test.md");
    expect(chunks[0].metadata.startOffset).toBe(0);
    expect(chunks[0].metadata.endOffset).toBe(10);
  });
});
