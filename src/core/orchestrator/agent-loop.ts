// src/core/orchestrator/agent-loop.ts

import type { Session, Message, ToolCall } from "../../shared/types.js";
import type { LLMProvider, ToolDefinition } from "../llm/provider.js";
import type { Skill } from "../../shared/types.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface AgentLoopConfig {
  maxTurns: number;
  session: Session;
  systemPrompt: string;
  skills: Skill[];
  tools: AgentToolDefinition[];
}

export interface AgentToolDefinition extends ToolDefinition {
  execute: (args: Record<string, unknown>) => Promise<string>;
}

export class AgentLoop {
  private config: AgentLoopConfig;
  private llm: LLMProvider;
  private turnCount = 0;

  constructor(config: AgentLoopConfig, llm: LLMProvider) {
    this.config = config;
    this.llm = llm;
  }

  async run(initialPrompt: string): Promise<string> {
    logger.info(`Agent loop started (max turns: ${this.config.maxTurns})`);

    this.addMessage("user", initialPrompt);

    while (this.turnCount < this.config.maxTurns) {
      this.turnCount++;
      logger.info(`Turn ${this.turnCount}/${this.config.maxTurns}`);

      const response = await this.llm.chat(
        this.config.session.messages,
        this.config.systemPrompt,
        this.config.tools
      );

      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          const result = await this.executeTool(toolCall);
          this.addMessage("tool", result, toolCall.id);
        }
        continue;
      }

      this.addMessage("assistant", response.content);
      logger.info("Agent loop completed");
      return response.content;
    }

    logger.warn(`Agent loop reached max turns (${this.config.maxTurns})`);
    return "Max turns reached. Please try again with a more specific request.";
  }

  private async executeTool(toolCall: ToolCall): Promise<string> {
    const tool = this.config.tools.find((t) => t.name === toolCall.name);
    if (!tool) {
      return `Error: Unknown tool "${toolCall.name}"`;
    }

    try {
      return await tool.execute(toolCall.arguments);
    } catch (err) {
      return `Error executing ${toolCall.name}: ${err}`;
    }
  }

  private addMessage(role: Message["role"], content: string, toolCallId?: string): void {
    const message: Message = {
      role,
      content,
      timestamp: new Date(),
      ...(toolCallId ? { toolCallId } : {}),
    };
    this.config.session.messages.push(message);
  }
}
