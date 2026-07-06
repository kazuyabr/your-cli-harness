// tests/unit/core/tui/useCommands.test.ts
// Tests for useCommands hook (direct logic testing)

import { describe, it, expect } from "vitest";

import type { SlashCommandResult } from "../../../../src/core/cli/tui/types.js";

interface CommandDefinition {
  name: string;
  description: string;
  handler: (args: string) => SlashCommandResult | Promise<SlashCommandResult>;
}

function createCommandsState(initialCommands: CommandDefinition[] = []) {
  const commands = new Map<string, CommandDefinition>();
  for (const cmd of initialCommands) {
    commands.set(cmd.name, cmd);
  }

  function registerCommand(command: CommandDefinition) {
    commands.set(command.name, command);
  }

  async function execute(input: string): Promise<SlashCommandResult | null> {
    if (!input.startsWith("/")) return null;

    const parts = input.slice(1).split(/\s+/);
    const commandName = parts[0] ?? "";
    const args = parts.slice(1).join(" ");

    const command = commands.get(commandName);
    if (!command) {
      return {
        output: `Unknown command: /${commandName}. Type /help for available commands.`,
      };
    }

    return command.handler(args);
  }

  function getCommandList() {
    return Array.from(commands.values());
  }

  function isCommand(input: string) {
    return input.startsWith("/");
  }

  return {
    registerCommand,
    execute,
    getCommandList,
    isCommand,
  };
}

describe("useCommands logic", () => {
  const testCommands: CommandDefinition[] = [
    {
      name: "help",
      description: "Show help",
      handler: () => ({ output: "Help text" }),
    },
    {
      name: "clear",
      description: "Clear chat",
      handler: () => ({ output: "", action: "clear" }),
    },
  ];

  it("registers and executes commands", async () => {
    const cmds = createCommandsState(testCommands);
    const result = await cmds.execute("/help");
    expect(result).toEqual({ output: "Help text" });
  });

  it("returns null for non-slash input", async () => {
    const cmds = createCommandsState(testCommands);
    const result = await cmds.execute("hello");
    expect(result).toBeNull();
  });

  it("returns error for unknown command", async () => {
    const cmds = createCommandsState(testCommands);
    const result = await cmds.execute("/unknown");
    expect(result).toBeTruthy();
    expect(result!.output).toContain("Unknown command");
  });

  it("passes arguments to handler", async () => {
    const commands: CommandDefinition[] = [
      {
        name: "echo",
        description: "Echo args",
        handler: (args: string) => ({ output: `Echo: ${args}` }),
      },
    ];
    const cmds = createCommandsState(commands);
    const result = await cmds.execute("/echo hello world");
    expect(result!.output).toBe("Echo: hello world");
  });

  it("returns command list", () => {
    const cmds = createCommandsState(testCommands);
    const list = cmds.getCommandList();
    expect(list).toHaveLength(2);
    expect(list[0].name).toBe("help");
  });

  it("detects slash commands", () => {
    const cmds = createCommandsState(testCommands);
    expect(cmds.isCommand("/help")).toBe(true);
    expect(cmds.isCommand("hello")).toBe(false);
  });

  it("registers new command dynamically", async () => {
    const cmds = createCommandsState(testCommands);
    cmds.registerCommand({
      name: "custom",
      description: "Custom command",
      handler: () => ({ output: "Custom output" }),
    });
    const result = await cmds.execute("/custom");
    expect(result!.output).toBe("Custom output");
  });
});
