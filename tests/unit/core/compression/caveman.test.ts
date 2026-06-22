// tests/unit/core/compression/caveman.test.ts

import { describe, it, expect } from "vitest";
import { CavemanCompressor } from "../../../../src/core/compression/caveman/compressor.js";

describe("CavemanCompressor", () => {
  const compressor = new CavemanCompressor();

  describe("compress", () => {
    it("removes articles", () => {
      const text = "The quick brown fox jumps over a lazy dog";
      const result = compressor.compress(text);
      expect(result.compressed).not.toContain("The ");
      expect(result.compressed).not.toContain(" a ");
    });

    it("removes filler words", () => {
      const text = "I just really basically want to help";
      const result = compressor.compress(text);
      expect(result.compressed).not.toContain("just");
      expect(result.compressed).not.toContain("really");
      expect(result.compressed).not.toContain("basically");
    });

    it("removes pleasantries", () => {
      const text = "Sure, I'd be happy to help you with that";
      const result = compressor.compress(text);
      expect(result.compressed).not.toContain("Sure");
      expect(result.compressed).not.toContain("happy to");
    });

    it("replaces verbose phrases", () => {
      const text = "In order to complete the task, you need to do this";
      const result = compressor.compress(text);
      expect(result.compressed).toContain("to");
    });

    it("preserves inline code", () => {
      const text = "Use the `console.log` function";
      const result = compressor.compress(text);
      expect(result.compressed).toContain("`console.log`");
    });

    it("preserves URLs", () => {
      const text = "Visit https://example.com for more info";
      const result = compressor.compress(text);
      expect(result.compressed).toContain("https://example.com");
    });

    it("preserves file paths", () => {
      const text = "The file is at /usr/local/bin/node";
      const result = compressor.compress(text);
      expect(result.compressed).toContain("/usr/local/bin/node");
    });

    it("achieves compression ratio", () => {
      const text = "I would just really like to basically make sure that you understand the concept in order to help you with your task";
      const result = compressor.compress(text);
      expect(result.compressionRatio).toBeGreaterThan(0.1);
    });
  });
});
