// src/core/orchestrator/agent-loop.ts

import type { Session, Message } from "../../shared/types.js";
import type { LLMProvider, ToolDefinition, ToolCall } from "../llm/provider.js";
import type { Skill } from "../../shared/types.js";
import type { HeadroomMonitor } from "../context/headroom.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface AgentLoopConfig {
  maxTurns: number;
  session: Session;
  systemPrompt: string;
  skills: Skill[];
  tools: AgentToolDefinition[];
  headroomMonitor?: HeadroomMonitor;
  workingDirectory?: string;
}

export interface AgentToolDefinition extends ToolDefinition {
  execute: (args: Record<string, unknown>) => Promise<string>;
}

export interface AgentLoopResult {
  content: string;
  turnsUsed: number;
  totalTokens: number;
  toolCallsExecuted: number;
  compacted: boolean;
}

export class AgentLoop {
  private config: AgentLoopConfig;
  private llm: LLMProvider;
  private turnCount = 0;
  private toolCallsExecuted = 0;

  constructor(config: AgentLoopConfig, llm: LLMProvider) {
    this.config = config;
    this.llm = llm;
  }

  async run(initialPrompt: string): Promise<AgentLoopResult> {
    logger.info(`Agent loop started (max turns: ${this.config.maxTurns})`);

    this.addMessage("user", initialPrompt);
    let compacted = false;

    while (this.turnCount < this.config.maxTurns) {
      this.turnCount++;
      logger.info(`Turn ${this.turnCount}/${this.config.maxTurns}`);

      if (this.config.headroomMonitor) {
        const suggestion = this.config.headroomMonitor.suggestAction(this.config.session);
        if (suggestion) {
          logger.info(suggestion);
        }
        const didCompact = await this.config.headroomMonitor.autoCompact(this.config.session);
        if (didCompact) {
          compacted = true;
          this.addMessage("user", `[System] Context was compacted to free space. Continue with the task.`);
        }
      }

      const response = await this.llm.chat(
        this.config.session.messages,
        this.config.systemPrompt,
        this.config.tools
      );

      if (response.stopReason === "max_tokens") {
        logger.warn("Response truncated due to max_tokens");
        this.addMessage("assistant", response.content);
        break;
      }

      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolResults: Message[] = [];

        for (const toolCall of response.toolCalls) {
          const result = await this.executeTool(toolCall);
          this.toolCallsExecuted++;

          toolResults.push({
            role: "tool",
            content: result,
            toolCallId: toolCall.id,
            timestamp: new Date(),
          });
        }

        this.addMessage("assistant", response.content, undefined, response.toolCalls);
        for (const tr of toolResults) {
          this.addMessage(tr.role, tr.content, tr.toolCallId);
        }
        continue;
      }

      this.addMessage("assistant", response.content);
      logger.info("Agent loop completed");

      return {
        content: response.content,
        turnsUsed: this.turnCount,
        totalTokens: response.usage.inputTokens + response.usage.outputTokens,
        toolCallsExecuted: this.toolCallsExecuted,
        compacted,
      };
    }

    logger.warn(`Agent loop reached max turns (${this.config.maxTurns})`);
    return {
      content: "Max turns reached. Please try again with a more specific request.",
      turnsUsed: this.turnCount,
      totalTokens: 0,
      toolCallsExecuted: this.toolCallsExecuted,
      compacted,
    };
  }

  private async executeTool(toolCall: ToolCall): Promise<string> {
    const tool = this.config.tools.find((t) => t.name === toolCall.name);
    if (!tool) {
      return `Error: Unknown tool "${toolCall.name}"`;
    }

    try {
      logger.info(`Executing tool: ${toolCall.name}`);
      return await tool.execute(toolCall.arguments);
    } catch (err) {
      return `Error executing ${toolCall.name}: ${err}`;
    }
  }

  private addMessage(role: Message["role"], content: string, toolCallId?: string, toolCalls?: ToolCall[]): void {
    const message: Message = {
      role,
      content,
      timestamp: new Date(),
      ...(toolCallId ? { toolCallId } : {}),
      ...(toolCalls ? { toolCalls } : {}),
    };
    this.config.session.messages.push(message);
  }
}
