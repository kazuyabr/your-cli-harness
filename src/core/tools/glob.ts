// src/core/tools/glob.ts

import { glob } from "glob";
import { resolve } from "node:path";
import type { AgentToolDefinition } from "../orchestrator/agent-loop.js";
import type { ToolExecutionContext } from "./types.js";

export function createGlobTool(ctx: ToolExecutionContext): AgentToolDefinition {
  return {
    name: "glob",
    description: "Find files matching a glob pattern. Use for file discovery.",
    parameters: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Glob pattern (e.g. '**/*.ts', 'src/**/*.test.ts')",
        },
        path: {
          type: "string",
          description: "Directory to search in (default: current directory)",
        },
      },
      required: ["pattern"],
    },
    execute: async (args: Record<string, unknown>) => {
      const pattern = args.pattern as string;
      const searchPath = resolve(ctx.workingDirectory, (args.path as string) ?? ".");

      try {
        const files = await glob(pattern, {
          cwd: searchPath,
          nodir: true,
        });

        if (files.length === 0) {
          return `No files matching "${pattern}"`;
        }

        return files.join("\n");
      } catch (err) {
        return `Error searching for "${pattern}": ${err}`;
      }
    },
  };
}
