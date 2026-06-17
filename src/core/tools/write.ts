// src/core/tools/write.ts

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type { AgentToolDefinition } from "../orchestrator/agent-loop.js";
import type { ToolExecutionContext } from "./types.js";

export function createWriteTool(ctx: ToolExecutionContext): AgentToolDefinition {
  return {
    name: "write",
    description: "Write content to a file. Creates the file if it doesn't exist, overwrites if it does. Creates parent directories as needed.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute path to the file to write",
        },
        content: {
          type: "string",
          description: "Content to write to the file",
        },
      },
      required: ["path", "content"],
    },
    execute: async (args: Record<string, unknown>) => {
      const filePath = resolve(ctx.workingDirectory, args.path as string);
      const content = args.content as string;

      try {
        const dir = dirname(filePath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }

        const existed = existsSync(filePath);
        writeFileSync(filePath, content, "utf-8");

        const lines = content.split("\n").length;
        return `Successfully ${existed ? "updated" : "created"} ${filePath} (${lines} lines)`;
      } catch (err) {
        return `Error writing ${filePath}: ${err}`;
      }
    },
  };
}
