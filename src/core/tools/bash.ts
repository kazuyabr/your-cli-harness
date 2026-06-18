// src/core/tools/bash.ts

import { execSync } from "node:child_process";
import type { AgentToolDefinition } from "../orchestrator/agent-loop.js";
import type { ToolExecutionContext } from "./types.js";

export function createBashTool(ctx: ToolExecutionContext): AgentToolDefinition {
  return {
    name: "bash",
    description: "Execute a bash command in the working directory. Use for running builds, tests, git operations, and other shell commands.",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The bash command to execute",
        },
        timeout: {
          type: "number",
          description: "Timeout in milliseconds (default 30000)",
        },
      },
      required: ["command"],
    },
    execute: async (args: Record<string, unknown>) => {
      const command = args.command as string;
      const timeout = (args.timeout as number) ?? 30000;

      try {
        const output = execSync(command, {
          cwd: ctx.workingDirectory,
          timeout,
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
        });
        return output || "(no output)";
      } catch (err: unknown) {
        const execErr = err as { stdout?: string; stderr?: string; message?: string };
        const parts: string[] = [];
        if (execErr.stdout) parts.push(execErr.stdout);
        if (execErr.stderr) parts.push(execErr.stderr);
        if (execErr.message && !execErr.stdout && !execErr.stderr) parts.push(execErr.message);
        return parts.join("\n") || `Error: ${err}`;
      }
    },
  };
}
