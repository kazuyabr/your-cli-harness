// tests/unit/core/memory/manager.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryManager } from "../../../../src/core/memory/manager.js";
import { existsSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const TEST_DIR = resolve(process.cwd(), "tests/tmp/memory");
const MEMORY_DIR = resolve(TEST_DIR, ".memory");

describe("MemoryManager", () => {
  beforeEach(() => {
    mkdirSync(MEMORY_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe("load", () => {
    it("should return empty string when disabled", () => {
      const manager = new MemoryManager(
        { enabled: false, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      expect(manager.load()).toBe("");
    });

    it("should return empty string when no MEMORY.md exists", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      expect(manager.load()).toBe("");
    });

    it("should load MEMORY.md content", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.save("# Auto Memory\n\nSome content");

      expect(manager.load()).toBe("# Auto Memory\n\nSome content");
    });
  });

  describe("save", () => {
    it("should save content to MEMORY.md", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.save("test content");

      expect(existsSync(resolve(MEMORY_DIR, "MEMORY.md"))).toBe(true);
      expect(readFileSync(resolve(MEMORY_DIR, "MEMORY.md"), "utf-8")).toBe("test content");
    });

    it("should not save when disabled", () => {
      const manager = new MemoryManager(
        { enabled: false, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.save("test content");

      expect(existsSync(resolve(MEMORY_DIR, "MEMORY.md"))).toBe(false);
    });
  });

  describe("append", () => {
    it("should create file with header if not exists", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.append("first note");

      expect(manager.load()).toBe("# Auto Memory\n\nfirst note");
    });

    it("should append to existing content", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.save("existing content");
      manager.append("new note");

      expect(manager.load()).toBe("existing content\n\nnew note");
    });
  });

  describe("clear", () => {
    it("should reset MEMORY.md to empty header", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.save("some content");
      manager.clear();

      expect(manager.load()).toBe("# Auto Memory\n");
    });
  });

  describe("getStats", () => {
    it("should return zero stats for empty memory", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      const stats = manager.getStats();

      expect(stats.totalLines).toBe(0);
      expect(stats.totalBytes).toBe(0);
      expect(stats.entries).toBe(0);
      expect(stats.lastModified).toBeNull();
    });

    it("should return correct stats", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.save("line1\nline2\nline3");

      const stats = manager.getStats();
      expect(stats.totalLines).toBe(3);
      expect(stats.totalBytes).toBeGreaterThan(0);
      expect(stats.lastModified).toBeInstanceOf(Date);
    });
  });

  describe("addEntry", () => {
    it("should add a structured entry", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.addEntry({ content: "Learned about X", source: "assistant" });

      const entries = manager.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].content).toBe("Learned about X");
      expect(entries[0].id).toMatch(/^mem_\d+_[a-z0-9]+$/);
    });
  });

  describe("removeEntry", () => {
    it("should remove an entry by id", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.addEntry({ content: "To remove", source: "assistant" });

      const entries = manager.getEntries();
      expect(entries).toHaveLength(1);

      const removed = manager.removeEntry(entries[0].id);
      expect(removed).toBe(true);
      expect(manager.getEntries()).toHaveLength(0);
    });

    it("should return false for non-existent entry", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      expect(manager.removeEntry("mem_000_nonexistent")).toBe(false);
    });
  });

  describe("compact", () => {
    it("should remove duplicate lines", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.save("line1\nline2\nline1\nline3\nline2");

      const result = manager.compact();
      expect(result.before).toBe(5);
      expect(result.after).toBe(3);
    });

    it("should truncate to maxLines", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 3, maxKB: 25 },
        MEMORY_DIR
      );
      manager.save("line1\nline2\nline3\nline4\nline5");

      const result = manager.compact();
      expect(result.after).toBe(3);
    });
  });

  describe("learnFromSession", () => {
    it("should save session learnings", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.learnFromSession("session-1", ["Learned A", "Learned B"]);

      const content = manager.load();
      expect(content).toContain("Session session-1");
      expect(content).toContain("- Learned A");
      expect(content).toContain("- Learned B");
    });

    it("should not save empty learnings", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.learnFromSession("session-1", []);

      expect(manager.load()).toBe("");
    });
  });

  describe("updateSection", () => {
    it("should create section if not exists", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.updateSection("## Conventions", "- Use TypeScript");

      expect(manager.load()).toContain("## Conventions");
      expect(manager.load()).toContain("- Use TypeScript");
    });

    it("should update existing section", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.save("## Conventions\n- Old convention\n\n## Other\n- Other content");

      manager.updateSection("## Conventions", "- New convention\n");

      const content = manager.load();
      expect(content).toContain("- New convention");
      expect(content).not.toContain("- Old convention");
      expect(content).toContain("## Other");
    });
  });

  describe("getSection", () => {
    it("should return null if section not found", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.save("Some content");

      expect(manager.getSection("## Missing")).toBeNull();
    });

    it("should return section content", () => {
      const manager = new MemoryManager(
        { enabled: true, maxLines: 200, maxKB: 25 },
        MEMORY_DIR
      );
      manager.save("## Section\n- Item 1\n- Item 2\n\n## Other\n- Other");

      const section = manager.getSection("## Section");
      expect(section).toContain("- Item 1");
      expect(section).toContain("- Item 2");
    });
  });
});
