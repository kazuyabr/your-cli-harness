// src/core/tools/skill.ts

import type { AgentToolDefinition } from "../orchestrator/agent-loop.js";
import type { ToolExecutionContext } from "./types.js";
import type { SkillRegistry } from "../skills/registry.js";
import type { SkillInvoker } from "../skills/invoker.js";

export function createSkillTool(
  registry: SkillRegistry,
  invoker: SkillInvoker,
  ctx: ToolExecutionContext
): AgentToolDefinition {
  return {
    name: "skill",
    description: `Invoke a skill by name. Available skills: ${registry.getAll().map((s) => s.name).join(", ")}. Use this to execute specialized workflows.`,
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the skill to invoke",
        },
        arguments: {
          type: "object",
          description: "Arguments to pass to the skill (key-value pairs)",
          additionalProperties: { type: "string" },
        },
      },
      required: ["name"],
    },
    execute: async (args: Record<string, unknown>) => {
      const skillName = args.name as string;
      const skillArgs = (args.arguments as Record<string, string>) ?? {};

      const skill = registry.get(skillName);
      if (!skill) {
        const available = registry.getAll().map((s) => s.name).join(", ");
        return `Error: Unknown skill "${skillName}". Available: ${available}`;
      }

      const validationErrors = invoker.validateArguments(skill, skillArgs);
      if (validationErrors.length > 0) {
        return `Error: ${validationErrors.join(", ")}`;
      }

      const result = invoker.invoke(skill, {
        skillName,
        arguments: skillArgs,
        context: {
          workingDirectory: ctx.workingDirectory,
          session: ctx.session,
          mode: "default",
        },
      });

      if (result.success) {
        return result.content;
      } else {
        return `Error invoking skill "${skillName}": ${result.error}`;
      }
    },
  };
}
