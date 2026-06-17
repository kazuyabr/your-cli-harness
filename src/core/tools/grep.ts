// src/core/tools/grep.ts

import { execSync } from "node:child_process";
import { resolve } from "node:path";
import type { AgentToolDefinition } from "../orchestrator/agent-loop.js";
import type { ToolExecutionContext } from "./types.js";

export function createGrepTool(ctx: ToolExecutionContext): AgentToolDefinition {
  return {
    name: "grep",
    description: "Search for a pattern in files using grep. Returns matching lines with file paths and line numbers.",
    parameters: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "The regex pattern to search for",
        },
        path: {
          type: "string",
          description: "Directory or file to search in (default: current directory)",
        },
        include: {
          type: "string",
          description: "File pattern to include (e.g. '*.ts', '*.{ts,tsx}')",
        },
        maxResults: {
          type: "number",
          description: "Maximum number of results to return (default 50)",
        },
      },
      required: ["pattern"],
    },
    execute: async (args: Record<string, unknown>) => {
      const pattern = args.pattern as string;
      const searchPath = resolve(ctx.workingDirectory, (args.path as string) ?? ".");
      const include = args.include as string | undefined;
      const maxResults = (args.maxResults as number) ?? 50;

      try {
        let cmd = `grep -rn "${pattern}" "${searchPath}"`;
        if (include) {
          cmd += ` --include="${include}"`;
        }
        cmd += ` | head -${maxResults}`;

        const output = execSync(cmd, {
          cwd: ctx.workingDirectory,
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
        });

        if (!output.trim()) {
          return `No matches found for "${pattern}"`;
        }
        return output;
      } catch (err: unknown) {
        const execErr = err as { stdout?: string; stderr?: string };
        if (execErr.stdout) return execErr.stdout;
        return `No matches found for "${pattern}"`;
      }
    },
  };
}
