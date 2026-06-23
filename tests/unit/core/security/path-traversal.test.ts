// tests/unit/core/security/path-traversal.test.ts

import { describe, it, expect } from "vitest";

// Simple path traversal detector
function detectPathTraversal(path: string): { blocked: boolean; reason?: string } {
  const blockedPatterns = [
    { pattern: /\.\.\//, reason: "Parent directory traversal" },
    { pattern: /\.\.\\/, reason: "Parent directory traversal (Windows)" },
    { pattern: /\.\.%2f/i, reason: "Encoded parent directory traversal" },
    { pattern: /\.\.%5c/i, reason: "Encoded parent directory traversal (Windows)" },
    { pattern: /%00/, reason: "Null byte injection" },
    { pattern: /^\/etc\//i, reason: "System directory access" },
    { pattern: /^\/proc\//i, reason: "Process directory access" },
    { pattern: /^C:\\Windows/i, reason: "Windows system directory" },
  ];

  for (const { pattern, reason } of blockedPatterns) {
    if (pattern.test(path)) {
      return { blocked: true, reason };
    }
  }

  return { blocked: false };
}

function isPathSafe(path: string, allowedBase: string): boolean {
  // Normalize paths
  const normalizedPath = path.replace(/\\/g, "/");
  const normalizedBase = allowedBase.replace(/\\/g, "/");

  // Check if path starts with allowed base
  if (!normalizedPath.startsWith(normalizedBase)) {
    return false;
  }

  // Check for traversal
  const traversal = detectPathTraversal(path);
  return !traversal.blocked;
}

describe("Security: Path Traversal", () => {
  describe("detectPathTraversal", () => {
    it("blocks '../' traversal", () => {
      const result = detectPathTraversal("../../../etc/passwd");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("Parent directory");
    });

    it("blocks '..\\' traversal (Windows)", () => {
      const result = detectPathTraversal("..\\..\\..\\Windows\\System32");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("Windows");
    });

    it("blocks encoded traversal", () => {
      const result = detectPathTraversal("..%2f..%2fetc%2fpasswd");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("Encoded");
    });

    it("blocks null byte injection", () => {
      const result = detectPathTraversal("file.txt%00.exe");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("Null byte");
    });

    it("blocks /etc/ access", () => {
      const result = detectPathTraversal("/etc/passwd");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("System directory");
    });

    it("blocks /proc/ access", () => {
      const result = detectPathTraversal("/proc/self/environ");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("Process directory");
    });

    it("blocks Windows system directory", () => {
      const result = detectPathTraversal("C:\\Windows\\System32\\config");
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain("Windows system");
    });

    it("allows normal paths", () => {
      const result = detectPathTraversal("src/components/Button.tsx");
      expect(result.blocked).toBe(false);
    });

    it("allows absolute paths within project", () => {
      const result = detectPathTraversal("/home/user/project/src/index.ts");
      expect(result.blocked).toBe(false);
    });
  });

  describe("isPathSafe", () => {
    it("allows paths within base", () => {
      expect(isPathSafe("/project/src/file.ts", "/project")).toBe(true);
    });

    it("blocks paths outside base", () => {
      expect(isPathSafe("/etc/passwd", "/project")).toBe(false);
    });

    it("blocks traversal outside base", () => {
      expect(isPathSafe("/project/../../../etc/passwd", "/project")).toBe(false);
    });

    it("allows nested paths", () => {
      expect(isPathSafe("/project/src/components/Button.tsx", "/project")).toBe(true);
    });
  });
});
