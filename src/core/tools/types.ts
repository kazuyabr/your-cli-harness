// src/core/tools/types.ts

import type { AgentToolDefinition } from "../orchestrator/agent-loop.js";

export interface ToolExecutionContext {
  workingDirectory: string;
  session: {
    id: string;
    clientId: string;
  };
}

export type ToolFactory = (ctx: ToolExecutionContext) => AgentToolDefinition[];
