// src/core/cli/tui/hooks/useCommands.ts
// Hook for managing slash commands

import { useState, useCallback } from "react";

import type { SlashCommandResult } from "../types.js";

export interface CommandDefinition {
  name: string;
  description: string;
  handler: (args: string) => SlashCommandResult | Promise<SlashCommandResult>;
}

export function useCommands(initialCommands: CommandDefinition[] = []) {
  const [commands] = useState<Map<string, CommandDefinition>>(() => {
    const map = new Map<string, CommandDefinition>();
    for (const cmd of initialCommands) {
      map.set(cmd.name, cmd);
    }
    return map;
  });

  const [lastResult, setLastResult] = useState<SlashCommandResult | null>(null);

  const registerCommand = useCallback(
    (command: CommandDefinition) => {
      commands.set(command.name, command);
    },
    [commands]
  );

  const execute = useCallback(
    async (input: string): Promise<SlashCommandResult | null> => {
      if (!input.startsWith("/")) return null;

      const parts = input.slice(1).split(/\s+/);
      const commandName = parts[0] ?? "";
      const args = parts.slice(1).join(" ");

      const command = commands.get(commandName);
      if (!command) {
        const result: SlashCommandResult = {
          output: `Unknown command: /${commandName}. Type /help for available commands.`,
        };
        setLastResult(result);
        return result;
      }

      const result = await command.handler(args);
      setLastResult(result);
      return result;
    },
    [commands]
  );

  const getCommandList = useCallback(() => {
    return Array.from(commands.values());
  }, [commands]);

  const isCommand = useCallback((input: string) => {
    return input.startsWith("/");
  }, []);

  return {
    execute,
    registerCommand,
    getCommandList,
    isCommand,
    lastResult,
  };
}
