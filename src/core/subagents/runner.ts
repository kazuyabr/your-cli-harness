// src/core/subagents/runner.ts

import type { Session } from "../../shared/types.js";
import type { LLMProvider } from "../llm/provider.js";
import type { SubagentDefinition } from "./registry.js";
import { AgentLoop, type AgentToolDefinition } from "../orchestrator/agent-loop.js";
import { generateId } from "../../shared/utils.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface SubagentTask {
  id: string;
  agentName: string;
  prompt: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled" | "timeout";
  result?: string;
  error?: string;
  tokenUsage?: { input: number; output: number };
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
}

export interface SubagentRunOptions {
  timeout?: number;
  onProgress?: (task: SubagentTask) => void;
  signal?: AbortSignal;
}

export interface SubagentRunResult {
  task: SubagentTask;
  success: boolean;
}

export class SubagentRunner {
  private llm: LLMProvider;
  private tools: AgentToolDefinition[];

  constructor(llm: LLMProvider, tools: AgentToolDefinition[] = []) {
    this.llm = llm;
    this.tools = tools;
  }

  async run(
    definition: SubagentDefinition,
    task: string,
    parentSession: Session,
    options: SubagentRunOptions = {}
  ): Promise<SubagentRunResult> {
    const subagentTask: SubagentTask = {
      id: generateId(),
      agentName: definition.name,
      prompt: task,
      status: "running",
      startedAt: new Date(),
    };

    logger.info(`Subagent "${definition.name}" started (task: ${subagentTask.id})`);
    options.onProgress?.(subagentTask);

    try {
      if (options.signal?.aborted) {
        subagentTask.status = "cancelled";
        subagentTask.error = "Cancelled before start";
        return { task: subagentTask, success: false };
      }

      const result = await this.runWithTimeout(definition, task, parentSession, options, subagentTask);

      subagentTask.status = "completed";
      subagentTask.result = result.content;
      subagentTask.tokenUsage = {
        input: result.totalTokens,
        output: result.content.length,
      };
      subagentTask.completedAt = new Date();
      subagentTask.duration = subagentTask.completedAt.getTime() - (subagentTask.startedAt?.getTime() ?? 0);

      logger.info(`Subagent "${definition.name}" completed in ${subagentTask.duration}ms`);
      options.onProgress?.(subagentTask);

      return { task: subagentTask, success: true };
    } catch (err) {
      const isTimeout = err instanceof Error && err.message.includes("timeout");
      subagentTask.status = isTimeout ? "timeout" : "failed";
      subagentTask.error = String(err);
      subagentTask.completedAt = new Date();
      subagentTask.duration = subagentTask.completedAt.getTime() - (subagentTask.startedAt?.getTime() ?? 0);

      logger.error(`Subagent "${definition.name}" ${subagentTask.status}: ${err}`);
      options.onProgress?.(subagentTask);

      return { task: subagentTask, success: false };
    }
  }

  async runParallel(
    tasks: Array<{ definition: SubagentDefinition; task: string; options?: SubagentRunOptions }>,
    parentSession: Session,
    onTaskComplete?: (result: SubagentRunResult) => void
  ): Promise<SubagentRunResult[]> {
    logger.info(`Running ${tasks.length} subagents in parallel`);

    const promises = tasks.map(({ definition, task, options }) =>
      this.run(definition, task, parentSession, {
        ...options,
        onProgress: (t) => {
          options?.onProgress?.(t);
          if (t.status === "completed" || t.status === "failed" || t.status === "timeout" || t.status === "cancelled") {
            // Will be called via onTaskComplete when the promise resolves
          }
        },
      }).then((result) => {
        onTaskComplete?.(result);
        return result;
      })
    );

    return Promise.all(promises);
  }

  private async runWithTimeout(
    definition: SubagentDefinition,
    task: string,
    parentSession: Session,
    options: SubagentRunOptions,
    subagentTask: SubagentTask
  ) {
    const timeout = options.timeout ?? 120000;

    return new Promise<import("../orchestrator/agent-loop.js").AgentLoopResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Subagent "${definition.name}" timed out after ${timeout}ms`));
      }, timeout);

      this.executeSubagent(definition, task, parentSession)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          reject(err);
        });

      if (options.signal) {
        options.signal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
          subagentTask.status = "cancelled";
          reject(new Error("Subagent cancelled"));
        });
      }
    });
  }

  private async executeSubagent(
    definition: SubagentDefinition,
    task: string,
    parentSession: Session
  ) {
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

    return loop.run(task);
  }
}
