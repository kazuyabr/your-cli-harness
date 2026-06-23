// tests/unit/core/cli/slash-commands.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { SlashCommandRegistry } from "../../../../src/core/cli/commands/slash/index.js";

describe("SlashCommandRegistry", () => {
  let registry: SlashCommandRegistry;

  beforeEach(() => {
    registry = new SlashCommandRegistry("en");
  });

  describe("execute", () => {
    it("returns null for non-slash input", async () => {
      const result = await registry.execute("hello");
      expect(result).toBeNull();
    });

    it("executes /help command", async () => {
      const result = await registry.execute("/help");
      expect(result).toContain("Available Commands");
      expect(result).toContain("/help");
      expect(result).toContain("/connect");
      expect(result).toContain("/model");
    });

    it("executes /connect command", async () => {
      const result = await registry.execute("/connect");
      expect(result).toContain("Connect to a provider");
      expect(result).toContain("openrouter");
    });

    it("executes /connect with provider", async () => {
      const result = await registry.execute("/connect openrouter");
      expect(result).toContain("Connected to openrouter");
    });

    it("executes /model command", async () => {
      const result = await registry.execute("/model");
      expect(result).toContain("Current Model");
    });

    it("executes /model with model", async () => {
      const result = await registry.execute("/model openrouter/owl-alpha");
      expect(result).toContain("Model changed to");
    });

    it("executes /sessions command", async () => {
      const result = await registry.execute("/sessions");
      expect(result).toContain("Sessions");
    });

    it("executes /compact command", async () => {
      const result = await registry.execute("/compact");
      expect(result).toContain("compacted");
    });

    it("executes /new command", async () => {
      const result = await registry.execute("/new");
      expect(result).toContain("New session");
    });

    it("executes /undo command", async () => {
      const result = await registry.execute("/undo");
      expect(result).toContain("undone");
    });

    it("executes /agents command", async () => {
      const result = await registry.execute("/agents");
      expect(result).toContain("Available Agents");
    });

    it("executes /skills command", async () => {
      const result = await registry.execute("/skills");
      expect(result).toContain("Available Skills");
    });

    it("executes /mcp command", async () => {
      const result = await registry.execute("/mcp");
      expect(result).toContain("MCP Servers");
    });

    it("executes /economy command", async () => {
      const result = await registry.execute("/economy");
      expect(result).toBeTruthy();
    });

    it("executes /economy --off command", async () => {
      const result = await registry.execute("/economy --off");
      expect(result).toContain("disabled");
    });

    it("executes /economy --on command", async () => {
      const result = await registry.execute("/economy --on");
      expect(result).toContain("enabled");
    });

    it("executes /language command", async () => {
      const result = await registry.execute("/language");
      expect(result).toContain("Language Settings");
      expect(result).toContain("pt-BR");
    });

    it("executes /language with code", async () => {
      const result = await registry.execute("/language pt-BR");
      expect(result).toContain("Language changed to");
    });

    it("executes /tokensummary command", async () => {
      const result = await registry.execute("/tokensummary");
      expect(result).toContain("Token Summary");
    });

    it("returns error for unknown command", async () => {
      const result = await registry.execute("/unknown");
      expect(result).toContain("Unknown command");
    });

    it("supports command aliases", async () => {
      const result = await registry.execute("/h");
      expect(result).toContain("Available Commands");
    });
  });

  describe("getCommands", () => {
    it("returns all registered commands", () => {
      const commands = registry.getCommands();
      expect(commands.length).toBeGreaterThan(0);
      expect(commands.some(c => c.name === "help")).toBe(true);
      expect(commands.some(c => c.name === "connect")).toBe(true);
      expect(commands.some(c => c.name === "model")).toBe(true);
    });
  });

  describe("register", () => {
    it("registers custom command", async () => {
      registry.register({
        name: "custom",
        description: "Custom command",
        handler: async () => "Custom response",
      });

      const result = await registry.execute("/custom");
      expect(result).toBe("Custom response");
    });
  });
});
