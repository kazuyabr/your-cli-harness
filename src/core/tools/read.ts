// src/core/tools/read.ts

import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import type { AgentToolDefinition } from "../orchestrator/agent-loop.js";
import type { ToolExecutionContext } from "./types.js";

export function createReadTool(ctx: ToolExecutionContext): AgentToolDefinition {
  return {
    name: "read",
    description: "Read the contents of a file. Use when you need to examine the contents of an existing file.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute path to the file to read",
        },
        offset: {
          type: "number",
          description: "Line number to start reading from (1-indexed)",
        },
        limit: {
          type: "number",
          description: "Maximum number of lines to read",
        },
      },
      required: ["path"],
    },
    execute: async (args: Record<string, unknown>) => {
      const filePath = resolve(ctx.workingDirectory, args.path as string);

      try {
        const stat = statSync(filePath);
        if (!stat.isFile()) {
          return `Error: ${filePath} is not a file`;
        }

        const content = readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        const offset = (args.offset as number) ?? 1;
        const limit = (args.limit as number) ?? lines.length;
        const start = Math.max(0, offset - 1);
        const end = Math.min(lines.length, start + limit);

        const selectedLines = lines.slice(start, end);
        const numbered = selectedLines.map((line, i) => `${(start + i + 1).toString().padStart(6)} | ${line}`);

        return numbered.join("\n");
      } catch (err) {
        return `Error reading ${filePath}: ${err}`;
      }
    },
  };
}
