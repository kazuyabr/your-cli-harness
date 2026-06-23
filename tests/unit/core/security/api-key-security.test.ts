// tests/unit/core/security/api-key-security.test.ts

import { describe, it, expect } from "vitest";

// Simple API key sanitizer
function sanitizeApiKey(text: string): string {
  // Mask API keys
  return text
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "sk-****")
    .replace(/gsk_[a-zA-Z0-9]{20,}/g, "gsk_****")
    .replace(/npm_[a-zA-Z0-9]{20,}/g, "npm_****")
    .replace(/ghp_[a-zA-Z0-9]{20,}/g, "ghp_****")
    .replace(/AIza[a-zA-Z0-9_-]{30,}/g, "AIza****");
}

function containsApiKey(text: string): boolean {
  const patterns = [
    /sk-[a-zA-Z0-9]{20,}/,
    /gsk_[a-zA-Z0-9]{20,}/,
    /npm_[a-zA-Z0-9]{20,}/,
    /ghp_[a-zA-Z0-9]{20,}/,
    /AIza[a-zA-Z0-9_-]{30,}/,
  ];

  return patterns.some(p => p.test(text));
}

describe("Security: API Key", () => {
  describe("sanitizeApiKey", () => {
    it("masks OpenAI-style keys", () => {
      const text = "Using key sk-abc123def456ghi789jkl012mno345";
      const sanitized = sanitizeApiKey(text);
      expect(sanitized).toContain("sk-****");
      expect(sanitized).not.toContain("abc123");
    });

    it("masks Groq-style keys", () => {
      const text = "Using key gsk_abc123def456ghi789jkl012mno345";
      const sanitized = sanitizeApiKey(text);
      expect(sanitized).toContain("gsk_****");
      expect(sanitized).not.toContain("abc123");
    });

    it("masks npm tokens", () => {
      const text = "Token: npm_abc123def456ghi789jkl012mno345";
      const sanitized = sanitizeApiKey(text);
      expect(sanitized).toContain("npm_****");
    });

    it("masks GitHub tokens", () => {
      const text = "Token: ghp_abc123def456ghi789jkl012mno345";
      const sanitized = sanitizeApiKey(text);
      expect(sanitized).toContain("ghp_****");
    });

    it("masks Google API keys", () => {
      const text = "Key: AIzaSyAabcdefghijklmnopqrstuvwxYZ12";
      const sanitized = sanitizeApiKey(text);
      expect(sanitized).toContain("AIza****");
    });

    it("preserves non-key text", () => {
      const text = "Hello world, no keys here";
      const sanitized = sanitizeApiKey(text);
      expect(sanitized).toBe(text);
    });
  });

  describe("containsApiKey", () => {
    it("detects OpenAI-style keys", () => {
      expect(containsApiKey("sk-abc123def456ghi789jkl012mno345")).toBe(true);
    });

    it("detects Groq-style keys", () => {
      expect(containsApiKey("gsk_abc123def456ghi789jkl012mno345")).toBe(true);
    });

    it("detects npm tokens", () => {
      expect(containsApiKey("npm_abc123def456ghi789jkl012mno345")).toBe(true);
    });

    it("detects GitHub tokens", () => {
      expect(containsApiKey("ghp_abc123def456ghi789jkl012mno345")).toBe(true);
    });

    it("detects Google API keys", () => {
      expect(containsApiKey("AIzaSyAabcdefghijklmnopqrstuvwxYZ12")).toBe(true);
    });

    it("returns false for normal text", () => {
      expect(containsApiKey("Hello world")).toBe(false);
    });

    it("returns false for short strings", () => {
      expect(containsApiKey("sk-short")).toBe(false);
    });
  });
});
