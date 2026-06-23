// tests/unit/core/security/data-exposure.test.ts

import { describe, it, expect } from "vitest";

// Simple data exposure detector
function detectSensitiveData(text: string): { exposed: boolean; type?: string } {
  const patterns = [
    { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, type: "email" },
    { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, type: "phone" },
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/, type: "SSN" },
    { pattern: /\b\d{16}\b/, type: "credit card" },
    { pattern: /password\s*[:=]\s*\S+/i, type: "password" },
    { pattern: /secret\s*[:=]\s*\S+/i, type: "secret" },
    { pattern: /token\s*[:=]\s*\S+/i, type: "token" },
  ];

  for (const { pattern, type } of patterns) {
    if (pattern.test(text)) {
      return { exposed: true, type };
    }
  }

  return { exposed: false };
}

function maskSensitiveData(text: string): string {
  return text
    // Email
    .replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, "****@$2")
    // Phone
    .replace(/\b(\d{3})[-.]?(\d{3})[-.]?(\d{4})\b/g, "$1-***-****")
    // SSN
    .replace(/\b(\d{3})-(\d{2})-(\d{4})\b/g, "***-**-$3")
    // Credit card
    .replace(/\b(\d{4})\d{8}(\d{4})\b/g, "$1********$2")
    // Password
    .replace(/(password\s*[:=]\s*)\S+/gi, "$1****")
    // Secret
    .replace(/(secret\s*[:=]\s*)\S+/gi, "$1****")
    // Token
    .replace(/(token\s*[:=]\s*)\S+/gi, "$1****");
}

describe("Security: Data Exposure", () => {
  describe("detectSensitiveData", () => {
    it("detects email addresses", () => {
      const result = detectSensitiveData("Contact: user@example.com");
      expect(result.exposed).toBe(true);
      expect(result.type).toBe("email");
    });

    it("detects phone numbers", () => {
      const result = detectSensitiveData("Call: 555-123-4567");
      expect(result.exposed).toBe(true);
      expect(result.type).toBe("phone");
    });

    it("detects SSN", () => {
      const result = detectSensitiveData("SSN: 123-45-6789");
      expect(result.exposed).toBe(true);
      expect(result.type).toBe("SSN");
    });

    it("detects credit card numbers", () => {
      const result = detectSensitiveData("Card: 1234567890123456");
      expect(result.exposed).toBe(true);
      expect(result.type).toBe("credit card");
    });

    it("detects passwords", () => {
      const result = detectSensitiveData("password: mysecret123");
      expect(result.exposed).toBe(true);
      expect(result.type).toBe("password");
    });

    it("detects secrets", () => {
      const result = detectSensitiveData("secret: mysecretvalue");
      expect(result.exposed).toBe(true);
      expect(result.type).toBe("secret");
    });

    it("detects tokens", () => {
      const result = detectSensitiveData("token: mytokenvalue");
      expect(result.exposed).toBe(true);
      expect(result.type).toBe("token");
    });

    it("returns false for normal text", () => {
      const result = detectSensitiveData("Hello world");
      expect(result.exposed).toBe(false);
    });
  });

  describe("maskSensitiveData", () => {
    it("masks email addresses", () => {
      const masked = maskSensitiveData("Contact: user@example.com");
      expect(masked).toContain("****@example.com");
      expect(masked).not.toContain("user@");
    });

    it("masks phone numbers", () => {
      const masked = maskSensitiveData("Call: 555-123-4567");
      expect(masked).toContain("555-***-****");
    });

    it("masks SSN", () => {
      const masked = maskSensitiveData("SSN: 123-45-6789");
      expect(masked).toContain("***-**-6789");
    });

    it("masks credit card numbers", () => {
      const masked = maskSensitiveData("Card: 1234567890123456");
      expect(masked).toContain("1234********3456");
    });

    it("masks passwords", () => {
      const masked = maskSensitiveData("password: mysecret123");
      expect(masked).toContain("password: ****");
      expect(masked).not.toContain("mysecret123");
    });

    it("masks secrets", () => {
      const masked = maskSensitiveData("secret: mysecretvalue");
      expect(masked).toContain("secret: ****");
    });

    it("masks tokens", () => {
      const masked = maskSensitiveData("token: mytokenvalue");
      expect(masked).toContain("token: ****");
    });

    it("preserves normal text", () => {
      const masked = maskSensitiveData("Hello world");
      expect(masked).toBe("Hello world");
    });
  });
});
