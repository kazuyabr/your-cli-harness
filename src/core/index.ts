// src/core/index.ts

export { ConfigLoader } from "./config/loader.js";
export { ClientConfigSchema } from "./config/schema.js";
export { TokenCounter } from "./context/token-counter.js";
export { SessionManager, FileSessionPersistence } from "./context/session.js";
export { ContextWindowManager } from "./context/window.js";
export { CompactionEngine } from "./context/compaction.js";
export { HeadroomMonitor } from "./context/headroom.js";
export { AgentLoop } from "./orchestrator/agent-loop.js";
export { PLAN_MODE, PLAN_SYSTEM_PROMPT } from "./orchestrator/modes/plan.js";
export { BUILD_MODE, BUILD_SYSTEM_PROMPT } from "./orchestrator/modes/build.js";
export { YOLO_MODE, YOLO_SYSTEM_PROMPT } from "./orchestrator/modes/yolo.js";
export { DEFAULT_MODE, DEFAULT_SYSTEM_PROMPT } from "./orchestrator/modes/default.js";
export { BaseAgent } from "./agents/base-agent.js";
export { DefaultAgent } from "./agents/default-agent.js";
export { ExploreAgent } from "./agents/explore-agent.js";
export { PlanAgent } from "./agents/plan-agent.js";
export { SubagentRegistry } from "./subagents/registry.js";
export { SubagentRunner } from "./subagents/runner.js";
export { SubagentOrchestrator } from "./subagents/orchestrator.js";
export { BUILTIN_SUBAGENTS } from "./subagents/builtin.js";
export { createAllTools, createReadOnlyTools, createSubagentTool } from "./tools/registry.js";
export type { SubagentDefinition, SubagentScope } from "./subagents/registry.js";
export type { SubagentTask, SubagentRunOptions, SubagentRunResult } from "./subagents/runner.js";
export type { SubagentNode, OrchestratorResult } from "./subagents/orchestrator.js";
export type { AgentToolDefinition, AgentLoopConfig, AgentLoopResult } from "./orchestrator/agent-loop.js";
export type { ToolExecutionContext } from "./tools/types.js";
