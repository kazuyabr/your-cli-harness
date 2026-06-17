// src/core/tools/edit.ts

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { AgentToolDefinition } from "../orchestrator/agent-loop.js";
import type { ToolExecutionContext } from "./types.js";

export function createEditTool(ctx: ToolExecutionContext): AgentToolDefinition {
  return {
    name: "edit",
    description: "Edit a file by replacing exact text. The oldText must match exactly (including whitespace).",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute path to the file to edit",
        },
        oldText: {
          type: "string",
          description: "Exact text to find and replace (must match exactly)",
        },
        newText: {
          type: "string",
          description: "New text to replace the old text with",
        },
      },
      required: ["path", "oldText", "newText"],
    },
    execute: async (args: Record<string, unknown>) => {
      const filePath = resolve(ctx.workingDirectory, args.path as string);
      const oldText = args.oldText as string;
      const newText = args.newText as string;

      try {
        if (!existsSync(filePath)) {
          return `Error: File not found: ${filePath}`;
        }

        const content = readFileSync(filePath, "utf-8");
        if (!content.includes(oldText)) {
          return `Error: Text not found in ${filePath}. Make sure the oldText matches exactly.`;
        }

        const newContent = content.replace(oldText, newText);
        writeFileSync(filePath, newContent, "utf-8");

        return `Successfully edited ${filePath}`;
      } catch (err) {
        return `Error editing ${filePath}: ${err}`;
      }
    },
  };
}
