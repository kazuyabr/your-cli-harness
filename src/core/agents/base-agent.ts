// src/core/agents/base-agent.ts

import type { Session, Agent } from "../../shared/types.js";
import type { LLMProvider } from "../llm/provider.js";
import { AgentLoop, type AgentLoopConfig, type AgentToolDefinition, type AgentLoopResult } from "../orchestrator/agent-loop.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export abstract class BaseAgent implements Agent {
  abstract name: string;
  abstract description: string;
  abstract systemPrompt: string;
  tools: string[] = [];
  model?: string;

  protected llm: LLMProvider;

  constructor(llm: LLMProvider) {
    this.llm = llm;
  }

  async execute(session: Session, prompt: string, tools: AgentToolDefinition[] = []): Promise<string> {
    const result = await this.executeWithResult(session, prompt, tools);
    return result.content;
  }

  async executeWithResult(session: Session, prompt: string, tools: AgentToolDefinition[] = []): Promise<AgentLoopResult> {
    logger.info(`Agent "${this.name}" executing (session: ${session.id})`);

    const config: AgentLoopConfig = {
      maxTurns: 20,
      session,
      systemPrompt: this.systemPrompt,
      skills: [],
      tools,
    };

    const loop = new AgentLoop(config, this.llm);
    return loop.run(prompt);
  }
}
