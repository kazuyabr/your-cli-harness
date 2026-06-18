// src/core/tools/subagent.ts

import type { AgentToolDefinition } from "../orchestrator/agent-loop.js";
import type { SubagentRegistry } from "../subagents/registry.js";
import type { SubagentRunner } from "../subagents/runner.js";
import type { Session } from "../../shared/types.js";

export function createSubagentTool(
  registry: SubagentRegistry,
  runner: SubagentRunner,
  parentSession: Session
): AgentToolDefinition {
  return {
    name: "subagent",
    description: "Spawn a subagent to handle a specific task. Available subagents: explore, plan, code, review, debug. Use for parallel research, code review, or complex multi-step tasks.",
    parameters: {
      type: "object",
      properties: {
        agent: {
          type: "string",
          description: "Name of the subagent to spawn (explore, plan, code, review, debug)",
        },
        task: {
          type: "string",
          description: "The task/prompt for the subagent",
        },
        parallel: {
          type: "boolean",
          description: "Whether to run in parallel with other subagents (default: false)",
        },
      },
      required: ["agent", "task"],
    },
    execute: async (args: Record<string, unknown>) => {
      const agentName = args.agent as string;
      const task = args.task as string;

      const definition = registry.get(agentName);
      if (!definition) {
        return `Error: Unknown subagent "${agentName}". Available: ${registry.getAll().map((d) => d.name).join(", ")}`;
      }

      try {
        const result = await runner.run(definition, task, parentSession);

        if (result.success) {
          return `[Subagent "${agentName}" completed]\n\n${result.task.result}`;
        } else {
          return `[Subagent "${agentName}" ${result.task.status}]\n\nError: ${result.task.error}`;
        }
      } catch (err) {
        return `Error running subagent "${agentName}": ${err}`;
      }
    },
  };
}
