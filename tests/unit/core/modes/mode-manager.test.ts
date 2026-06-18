// tests/unit/core/modes/mode-manager.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { ModeManager } from "../../../../src/core/modes/mode-manager.js";
import type { AgentToolDefinition } from "../../../../src/core/orchestrator/agent-loop.js";
import type { ModesConfig } from "../../../../src/shared/types.js";

const createTool = (name: string, readOnly = false): AgentToolDefinition => ({
  name,
  description: `Tool ${name}`,
  parameters: { type: "object" as const, properties: {} },
  execute: async () => `executed ${name}`,
});

describe("ModeManager", () => {
  let manager: ModeManager;

  beforeEach(() => {
    manager = new ModeManager();
  });

  it("starts in default mode", () => {
    expect(manager.getCurrentMode()).toBe("default");
  });

  it("switches modes", () => {
    manager.switchMode("plan");
    expect(manager.getCurrentMode()).toBe("plan");

    manager.switchMode("build");
    expect(manager.getCurrentMode()).toBe("build");
  });

  it("throws when switching to disabled mode", () => {
    const config: Partial<ModesConfig> = {
      yolo: { enabled: false, readOnly: false, autoExecute: true, requireConfirmation: false, description: "" },
    };
    manager = new ModeManager(config);

    expect(() => manager.switchMode("yolo")).toThrow("Mode \"yolo\" is disabled");
  });

  it("returns correct system prompts", () => {
    expect(manager.getSystemPrompt("plan")).toContain("PLAN MODE");
    expect(manager.getSystemPrompt("build")).toContain("BUILD MODE");
    expect(manager.getSystemPrompt("yolo")).toContain("YOLO MODE");
    expect(manager.getSystemPrompt("default")).toContain("AI assistant");
  });

  it("returns current mode system prompt when no arg", () => {
    manager.switchMode("plan");
    expect(manager.getSystemPrompt()).toContain("PLAN MODE");
  });

  it("plan mode is read-only", () => {
    manager.switchMode("plan");
    expect(manager.isReadOnly()).toBe(true);
  });

  it("build mode is not read-only", () => {
    manager.switchMode("build");
    expect(manager.isReadOnly()).toBe(false);
  });

  it("plan mode can auto-execute", () => {
    manager.switchMode("plan");
    expect(manager.canAutoExecute()).toBe(false);
  });

  it("build mode can auto-execute", () => {
    manager.switchMode("build");
    expect(manager.canAutoExecute()).toBe(true);
  });

  describe("filterToolsForPlanMode", () => {
    it("only allows read-only tools in plan mode", () => {
      manager.switchMode("plan");

      const tools = [
        createTool("read"),
        createTool("glob"),
        createTool("grep"),
        createTool("write"),
        createTool("edit"),
        createTool("bash"),
      ];

      const filtered = manager.filterToolsForPlanMode(tools);
      expect(filtered.map((t) => t.name)).toEqual(["read", "glob", "grep"]);
    });

    it("getAvailableTools filters in plan mode", () => {
      manager.switchMode("plan");

      const tools = [createTool("read"), createTool("write"), createTool("bash")];
      const available = manager.getAvailableTools(tools);
      expect(available.map((t) => t.name)).toEqual(["read"]);
    });

    it("getAvailableTools returns all tools in non-plan modes", () => {
      const tools = [createTool("read"), createTool("write"), createTool("bash")];

      manager.switchMode("default");
      expect(manager.getAvailableTools(tools).length).toBe(3);

      manager.switchMode("build");
      expect(manager.getAvailableTools(tools).length).toBe(3);

      const yoloManager = new ModeManager({
        yolo: { enabled: true, readOnly: false, autoExecute: true, requireConfirmation: false, description: "" },
      });
      yoloManager.switchMode("yolo");
      expect(yoloManager.getAvailableTools(tools).length).toBe(3);
    });
  });

  describe("requiresConfirmation", () => {
    it("yolo mode never requires confirmation", () => {
      const yoloManager = new ModeManager({
        yolo: { enabled: true, readOnly: false, autoExecute: true, requireConfirmation: false, description: "" },
      });
      yoloManager.switchMode("yolo");
      expect(yoloManager.requiresConfirmation("bash")).toBe(false);
      expect(yoloManager.requiresConfirmation("write")).toBe(false);
      expect(yoloManager.requiresConfirmation("edit")).toBe(false);
      expect(yoloManager.requiresConfirmation("delete")).toBe(false);
    });

    it("plan mode always requires confirmation (read-only)", () => {
      manager.switchMode("plan");
      expect(manager.requiresConfirmation("read")).toBe(true);
      expect(manager.requiresConfirmation("bash")).toBe(true);
    });

    it("default mode requires confirmation for destructive tools", () => {
      manager.switchMode("default");
      expect(manager.requiresConfirmation("bash")).toBe(true);
      expect(manager.requiresConfirmation("write")).toBe(true);
      expect(manager.requiresConfirmation("edit")).toBe(true);
      expect(manager.requiresConfirmation("delete")).toBe(true);
      expect(manager.requiresConfirmation("read")).toBe(false);
      expect(manager.requiresConfirmation("grep")).toBe(false);
    });

    it("build mode does not require confirmation by default", () => {
      manager.switchMode("build");
      expect(manager.requiresConfirmation("bash")).toBe(false);
      expect(manager.requiresConfirmation("read")).toBe(false);
    });

    it("build mode with requireConfirmation=false does not require", () => {
      const config: Partial<ModesConfig> = {
        build: { enabled: true, readOnly: false, autoExecute: true, requireConfirmation: false, description: "" },
      };
      manager = new ModeManager(config);
      manager.switchMode("build");
      expect(manager.requiresConfirmation("bash")).toBe(false);
    });
  });

  describe("modeHistory", () => {
    it("tracks mode switches", () => {
      manager.switchMode("plan");
      manager.switchMode("build");

      const yoloManager = new ModeManager({
        yolo: { enabled: true, readOnly: false, autoExecute: true, requireConfirmation: false, description: "" },
      });
      yoloManager.switchMode("yolo");

      const history = yoloManager.getHistory();
      expect(history.length).toBe(2); // initial default + 1 switch
      expect(history[0].mode).toBe("default");
      expect(history[1].mode).toBe("yolo");

      // Test manager's history separately
      const managerHistory = manager.getHistory();
      expect(managerHistory.length).toBe(3); // default -> plan -> build
      expect(managerHistory[0].mode).toBe("default");
      expect(managerHistory[1].mode).toBe("plan");
      expect(managerHistory[2].mode).toBe("build");
    });

    it("returns a copy of history", () => {
      const history = manager.getHistory();
      history.push({ mode: "plan", timestamp: new Date() });
      expect(manager.getHistory().length).toBe(1);
    });
  });

  describe("updateConfig", () => {
    it("updates specific mode config", () => {
      manager.updateConfig({
        plan: { enabled: false, readOnly: true, autoExecute: false, requireConfirmation: true, description: "disabled" },
      });

      expect(manager.getModeConfig("plan").enabled).toBe(false);
      expect(manager.getModeConfig("plan").description).toBe("disabled");
    });

    it("does not affect other modes when updating one", () => {
      manager.updateConfig({
        build: { enabled: false, readOnly: false, autoExecute: false, requireConfirmation: false, description: "nope" },
      });

      expect(manager.getModeConfig("plan").enabled).toBe(true);
      expect(manager.getModeConfig("yolo").enabled).toBe(false); // default config
    });
  });

  it("getModeConfig returns specific mode when arg provided", () => {
    const planConfig = manager.getModeConfig("plan");
    expect(planConfig.readOnly).toBe(true);
    expect(planConfig.autoExecute).toBe(false);
  });

  it("getModeConfig returns current mode when no arg", () => {
    manager.switchMode("plan");
    expect(manager.getModeConfig().readOnly).toBe(true);

    manager.switchMode("build");
    expect(manager.getModeConfig().readOnly).toBe(false);
  });
});
