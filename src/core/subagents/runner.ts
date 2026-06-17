// src/core/subagents/runner.ts

import type { Session, SubagentTask } from "../../shared/types.js";
import type { LLMProvider } from "../llm/provider.js";
import type { SubagentDefinition } from "./registry.js";
import { AgentLoop, type AgentToolDefinition } from "../orchestrator/agent-loop.js";
import { generateId } from "../../shared/utils.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export class SubagentRunner {
  private llm: LLMProvider;
  private tools: AgentToolDefinition[];

  constructor(llm: LLMProvider, tools: AgentToolDefinition[] = []) {
    this.llm = llm;
    this.tools = tools;
  }

  async run(definition: SubagentDefinition, task: string, parentSession: Session): Promise<SubagentTask> {
    const subagentTask: SubagentTask = {
      id: generateId(),
      agentName: definition.name,
      prompt: task,
      status: "running",
    };

    logger.info(`Subagent "${definition.name}" started (task: ${subagentTask.id})`);

    try {
      const subSession: Session = {
        id: generateId(),
        clientId: parentSession.clientId,
        mode: "default",
        messages: [],
        contextWindow: { ...parentSession.contextWindow },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const allowedTools = this.tools.filter(
        (t) => !definition.tools || definition.tools.length === 0 || definition.tools.includes(t.name)
      );

      const loop = new AgentLoop(
        {
          maxTurns: definition.maxTurns,
          session: subSession,
          systemPrompt: definition.systemPrompt,
          skills: [],
          tools: allowedTools,
        },
        this.llm
      );

      const result = await loop.run(task);

      subagentTask.status = "completed";
      subagentTask.result = result.content;
      subagentTask.tokenUsage = {
        input: subSession.contextWindow.usedTokens,
        output: result.content.length,
      };

      logger.info(`Subagent "${definition.name}" completed`);
    } catch (err) {
      subagentTask.status = "failed";
      subagentTask.error = String(err);
      logger.error(`Subagent "${definition.name}" failed: ${err}`);
    }

    return subagentTask;
  }

  async runParallel(
    tasks: Array<{ definition: SubagentDefinition; task: string }>,
    parentSession: Session
  ): Promise<SubagentTask[]> {
    logger.info(`Running ${tasks.length} subagents in parallel`);

    const promises = tasks.map(({ definition, task }) =>
      this.run(definition, task, parentSession)
    );

    return Promise.all(promises);
  }
}
