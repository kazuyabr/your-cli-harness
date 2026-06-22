// tests/unit/core/compression/headroom.test.ts

import { describe, it, expect } from "vitest";
import { HeadroomCompressor } from "../../../../src/core/compression/headroom/compressor.js";

describe("HeadroomCompressor", () => {
  const compressor = new HeadroomCompressor();

  describe("compress", () => {
    it("compresses JSON", () => {
      const json = JSON.stringify({
        name: "test",
        value: null,
        empty: "",
        nested: {
          a: 1,
          b: null,
          c: "hello",
        },
      });

      const result = compressor.compress(json);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.techniques).toContain("json");
    });

    it("compresses code", () => {
      const code = `
// This is a comment
const x = 1; // inline comment
/* Multi-line
   comment */
function hello() {
  return "world";
}
`;

      const result = compressor.compress(code);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.techniques).toContain("code");
    });

    it("compresses logs", () => {
      const logs = `
2024-01-15T10:30:00.000Z [INFO] Starting application
2024-01-15T10:30:01.000Z [DEBUG] Loading config
2024-01-15T10:30:02.000Z [INFO] Config loaded
2024-01-15T10:30:03.000Z [ERROR] Connection failed
`;

      const result = compressor.compress(logs);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.techniques).toContain("logs");
    });

    it("compresses text", () => {
      const text = `
This   is   a   text   with   multiple   spaces.


And multiple newlines.
`;

      const result = compressor.compress(text);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.techniques).toContain("text");
    });

    it("preserves semantic meaning", () => {
      const text = "Hello World";
      const result = compressor.compress(text);
      expect(result.compressed).toContain("Hello");
      expect(result.compressed).toContain("World");
    });
  });
});
