// tests/unit/core/security/token-leakage.test.ts

import { describe, it, expect } from "vitest";

// Simple token leakage detector
function detectTokenLeakage(text: string): { leaked: boolean; type?: string } {
  const patterns = [
    { pattern: /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/, type: "JWT" },
    { pattern: /Bearer\s+[a-zA-Z0-9._-]{20,}/, type: "Bearer token" },
    { pattern: /Basic\s+[A-Za-z0-9+/=]{20,}/, type: "Basic auth" },
    { pattern: /xoxb-[a-zA-Z0-9-]+/, type: "Slack token" },
    { pattern: /xoxp-[a-zA-Z0-9-]+/, type: "Slack token" },
    { pattern: /AKIA[0-9A-Z]{16}/, type: "AWS access key" },
    { pattern: /[0-9a-zA-Z/+]{40}/, type: "AWS secret key" },
  ];

  for (const { pattern, type } of patterns) {
    if (pattern.test(text)) {
      return { leaked: true, type };
    }
  }

  return { leaked: false };
}

function maskTokens(text: string): string {
  return text
    // JWT
    .replace(/(eyJ[a-zA-Z0-9_-]{20,})\.([a-zA-Z0-9_-]{20,})\.([a-zA-Z0-9_-]{20,})/g, "eyJ****.****.****")
    // Bearer
    .replace(/Bearer\s+[a-zA-Z0-9._-]{20,}/g, "Bearer ****")
    // Basic
    .replace(/Basic\s+[A-Za-z0-9+/=]{20,}/g, "Basic ****")
    // Slack
    .replace(/xox[bp]-[a-zA-Z0-9-]+/g, "xox?-****")
    // AWS
    .replace(/AKIA[0-9A-Z]{16}/g, "AKIA****");
}

describe("Security: Token Leakage", () => {
  describe("detectTokenLeakage", () => {
    it("detects JWT tokens", () => {
      const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const result = detectTokenLeakage(`Token: ${jwt}`);
      expect(result.leaked).toBe(true);
      expect(result.type).toBe("JWT");
    });

    it("detects Bearer tokens", () => {
      const result = detectTokenLeakage("Authorization: Bearer abc123def456ghi789jkl012mno345");
      expect(result.leaked).toBe(true);
      expect(result.type).toBe("Bearer token");
    });

    it("detects Basic auth", () => {
      const result = detectTokenLeakage("Authorization: Basic dXNlcjpwYXNzd29yZA==");
      expect(result.leaked).toBe(true);
    });

    it("detects Slack tokens", () => {
      const result = detectTokenLeakage("Token: xoxb-1234567890-1234567890123-abc123def456");
      expect(result.leaked).toBe(true);
      expect(result.type).toBe("Slack token");
    });

    it("detects AWS access keys", () => {
      const result = detectTokenLeakage("Key: AKIAIOSFODNN7EXAMPLE");
      expect(result.leaked).toBe(true);
      expect(result.type).toBe("AWS access key");
    });

    it("returns false for normal text", () => {
      const result = detectTokenLeakage("Hello world");
      expect(result.leaked).toBe(false);
    });
  });

  describe("maskTokens", () => {
    it("masks JWT tokens", () => {
      const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const masked = maskTokens(`Token: ${jwt}`);
      expect(masked).toContain("eyJ****");
      expect(masked).not.toContain("SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
    });

    it("masks Bearer tokens", () => {
      const masked = maskTokens("Authorization: Bearer abc123def456ghi789jkl012mno345");
      expect(masked).toContain("Bearer ****");
      expect(masked).not.toContain("abc123def456");
    });

    it("masks Slack tokens", () => {
      const masked = maskTokens("Token: xoxb-1234567890-1234567890123-abc123def456");
      expect(masked).toContain("xox?-****");
    });

    it("masks AWS keys", () => {
      const masked = maskTokens("Key: AKIAIOSFODNN7EXAMPLE");
      expect(masked).toContain("AKIA****");
    });

    it("preserves normal text", () => {
      const masked = maskTokens("Hello world");
      expect(masked).toBe("Hello world");
    });
  });
});
