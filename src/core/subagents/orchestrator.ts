// src/core/subagents/orchestrator.ts

import type { Session } from "../../shared/types.js";
import type { LLMProvider } from "../llm/provider.js";
import type { SubagentDefinition } from "./registry.js";
import { SubagentRunner, type SubagentRunOptions, type SubagentRunResult } from "./runner.js";
import { createAllTools } from "../tools/registry.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface SubagentNode {
  id: string;
  definition: SubagentDefinition;
  task: string;
  dependsOn?: string[];
  options?: SubagentRunOptions;
}

export interface OrchestratorResult {
  results: Map<string, SubagentRunResult>;
  totalDuration: number;
  successCount: number;
  failureCount: number;
}

export class SubagentOrchestrator {
  private runner: SubagentRunner;

  constructor(llm: LLMProvider, workingDirectory: string, tools?: import("../orchestrator/agent-loop.js").AgentToolDefinition[]) {
    const ctx = { workingDirectory, session: { id: "", clientId: "" } };
    const allTools = tools ?? createAllTools(ctx);
    this.runner = new SubagentRunner(llm, allTools);
  }

  async executeDAG(
    nodes: SubagentNode[],
    parentSession: Session,
    onProgress?: (nodeId: string, result: SubagentRunResult) => void
  ): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const results = new Map<string, SubagentRunResult>();
    const completed = new Set<string>();
    const pending = new Map(nodes.map((n) => [n.id, n]));

    logger.info(`Starting DAG execution: ${nodes.length} nodes`);

    while (pending.size > 0) {
      const ready = Array.from(pending.values()).filter(
        (n) => !n.dependsOn || n.dependsOn.every((dep) => completed.has(dep))
      );

      if (ready.length === 0) {
        throw new Error("Circular dependency detected in subagent DAG");
      }

      const batchResults = await this.runner.runParallel(
        ready.map((n) => ({
          definition: n.definition,
          task: this.injectDependencyResults(n, results),
          options: {
            ...n.options,
            onProgress: (task) => {
              n.options?.onProgress?.(task);
            },
          },
        })),
        parentSession,
        (result) => {
          const node = ready.find((n) => n.id === result.task.id);
          if (node) {
            results.set(node.id, result);
            completed.add(node.id);
            pending.delete(node.id);
            onProgress?.(node.id, result);
          }
        }
      );

      for (const result of batchResults) {
        const nodeId = result.task.id;
        if (!results.has(nodeId)) {
          results.set(nodeId, result);
          completed.add(nodeId);
          pending.delete(nodeId);
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    const successCount = Array.from(results.values()).filter((r) => r.success).length;
    const failureCount = Array.from(results.values()).filter((r) => !r.success).length;

    logger.info(`DAG complete: ${successCount} success, ${failureCount} failure, ${totalDuration}ms`);

    return { results, totalDuration, successCount, failureCount };
  }

  async executeSequential(
    nodes: SubagentNode[],
    parentSession: Session,
    onProgress?: (nodeId: string, result: SubagentRunResult) => void
  ): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const results = new Map<string, SubagentRunResult>();

    logger.info(`Starting sequential execution: ${nodes.length} nodes`);

    for (const node of nodes) {
      const result = await this.runner.run(
        node.definition,
        this.injectDependencyResults(node, results),
        parentSession,
        node.options
      );

      results.set(node.id, result);
      onProgress?.(node.id, result);

      if (!result.success) {
        logger.warn(`Node "${node.id}" failed, stopping sequential execution`);
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    const successCount = Array.from(results.values()).filter((r) => r.success).length;
    const failureCount = Array.from(results.values()).filter((r) => !r.success).length;

    return { results, totalDuration, successCount, failureCount };
  }

  private injectDependencyResults(
    node: SubagentNode,
    results: Map<string, SubagentRunResult>
  ): string {
    if (!node.dependsOn || node.dependsOn.length === 0) {
      return node.task;
    }

    const depResults = node.dependsOn
      .map((depId) => results.get(depId))
      .filter((r) => r?.success)
      .map((r) => r!.task.result)
      .join("\n\n---\n\n");

    if (!depResults) {
      return node.task;
    }

    return `${node.task}\n\n[Results from dependent tasks:]\n${depResults}`;
  }
}
