// tests/unit/core/context/context-manager.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ContextManager } from "../../../../src/core/context/context-manager.js";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const TEST_ROOT = resolve(process.cwd(), "tests", "tmp", "context-manager-test");

describe("ContextManager", () => {
  let manager: ContextManager;

  beforeEach(() => {
    if (existsSync(TEST_ROOT)) {
      rmSync(TEST_ROOT, { recursive: true, force: true });
    }
    mkdirSync(TEST_ROOT, { recursive: true });
    
    manager = new ContextManager({
      projectRoot: TEST_ROOT,
      clientId: "test-client",
    });
  });

  afterEach(() => {
    if (existsSync(TEST_ROOT)) {
      rmSync(TEST_ROOT, { recursive: true, force: true });
    }
  });

  describe("loadContext", () => {
    it("loads empty context when no files exist", async () => {
      const context = await manager.loadContext();
      expect(context).toBe("");
    });

    it("loads CLAUDE.md context", async () => {
      writeFileSync(resolve(TEST_ROOT, "CLAUDE.md"), "# Test CLAUDE.md\n\nTest content");
      
      const context = await manager.loadContext();
      expect(context).toContain("Test CLAUDE.md");
      expect(context).toContain("Test content");
    });

    it("loads AGENTS.md context", async () => {
      writeFileSync(resolve(TEST_ROOT, "AGENTS.md"), "# Test AGENTS.md\n\nAgent content");
      
      const context = await manager.loadContext();
      expect(context).toContain("Test AGENTS.md");
      expect(context).toContain("Agent content");
    });

    it("loads .vibecoding context", async () => {
      mkdirSync(resolve(TEST_ROOT, ".vibecoding"), { recursive: true });
      writeFileSync(resolve(TEST_ROOT, ".vibecoding", "vision.md"), "# Vision\n\nTest vision");
      
      const context = await manager.loadContext();
      expect(context).toContain("Vision");
      expect(context).toContain("Test vision");
    });

    it("loads multiple sources", async () => {
      writeFileSync(resolve(TEST_ROOT, "CLAUDE.md"), "# CLAUDE");
      writeFileSync(resolve(TEST_ROOT, "AGENTS.md"), "# AGENTS");
      
      const context = await manager.loadContext();
      expect(context).toContain("CLAUDE");
      expect(context).toContain("AGENTS");
    });

    it("respects priority order", async () => {
      writeFileSync(resolve(TEST_ROOT, "CLAUDE.md"), "# Low Priority");
      writeFileSync(resolve(TEST_ROOT, "AGENTS.md"), "# High Priority");
      
      const context = await manager.loadContext();
      const agentsIndex = context.indexOf("AGENTS");
      const claudeIndex = context.indexOf("CLAUDE");
      
      // AGENTS has higher priority (90) than CLAUDE (80)
      expect(agentsIndex).toBeLessThan(claudeIndex);
    });

    it("truncates context when too large", async () => {
      const largeContent = "x".repeat(200000);
      writeFileSync(resolve(TEST_ROOT, "CLAUDE.md"), largeContent);
      
      const managerWithLimit = new ContextManager({
        projectRoot: TEST_ROOT,
        clientId: "test-client",
        maxContextSize: 100000,
      });
      
      const context = await managerWithLimit.loadContext();
      expect(context.length).toBeLessThanOrEqual(100000);
    });
  });

  describe("saveSessionContext", () => {
    it("saves session context", async () => {
      await manager.saveSessionContext("# Session\n\nSession content");
      
      const sessionPath = resolve(TEST_ROOT, ".vibecoding", "memory", "session.md");
      expect(existsSync(sessionPath)).toBe(true);
    });

    it("creates directory if needed", async () => {
      await manager.saveSessionContext("# Session");
      
      const dir = resolve(TEST_ROOT, ".vibecoding", "memory");
      expect(existsSync(dir)).toBe(true);
    });
  });

  describe("getSources", () => {
    it("returns loaded sources", async () => {
      writeFileSync(resolve(TEST_ROOT, "CLAUDE.md"), "# Test");
      
      await manager.loadContext();
      const sources = manager.getSources();
      
      expect(sources.length).toBeGreaterThan(0);
      expect(sources[0].type).toBe("claude");
    });
  });

  describe("clearSources", () => {
    it("clears sources", async () => {
      writeFileSync(resolve(TEST_ROOT, "CLAUDE.md"), "# Test");
      
      await manager.loadContext();
      manager.clearSources();
      
      expect(manager.getSources().length).toBe(0);
    });
  });
});
