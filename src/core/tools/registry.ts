// src/core/tools/registry.ts

import type { AgentToolDefinition } from "../orchestrator/agent-loop.js";
import type { ToolExecutionContext } from "./types.js";
import { createReadTool } from "./read.js";
import { createWriteTool } from "./write.js";
import { createEditTool } from "./edit.js";
import { createBashTool } from "./bash.js";
import { createGrepTool } from "./grep.js";
import { createGlobTool } from "./glob.js";

export function createAllTools(ctx: ToolExecutionContext): AgentToolDefinition[] {
  return [
    createReadTool(ctx),
    createWriteTool(ctx),
    createEditTool(ctx),
    createBashTool(ctx),
    createGrepTool(ctx),
    createGlobTool(ctx),
  ];
}

export function createReadOnlyTools(ctx: ToolExecutionContext): AgentToolDefinition[] {
  return [
    createReadTool(ctx),
    createGrepTool(ctx),
    createGlobTool(ctx),
    createBashTool(ctx),
  ];
}

export { createReadTool, createWriteTool, createEditTool, createBashTool, createGrepTool, createGlobTool };
