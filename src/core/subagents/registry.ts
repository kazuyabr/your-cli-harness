// src/core/subagents/registry.ts

import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export type SubagentScope = "built-in" | "client" | "project";

export interface SubagentDefinition {
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  model?: string;
  maxTurns: number;
  scope: SubagentScope;
}

export interface SubagentRegistration {
  definition: SubagentDefinition;
  registeredAt: Date;
  source: string;
}

export class SubagentRegistry {
  private agents = new Map<string, SubagentRegistration>();

  register(definition: SubagentDefinition, source: string = "runtime"): void {
    const existing = this.agents.get(definition.name);

    if (existing) {
      if (existing.definition.scope === "built-in" && definition.scope !== "built-in") {
        logger.info(`Overriding built-in subagent "${definition.name}" from ${source}`);
      } else if (existing.definition.scope !== "built-in" && definition.scope === "built-in") {
        logger.warn(`Ignoring built-in registration for "${definition.name}" — already registered from ${existing.source}`);
        return;
      }
    }

    this.agents.set(definition.name, {
      definition,
      registeredAt: new Date(),
      source,
    });

    logger.info(`Registered subagent: ${definition.name} (${definition.scope}) from ${source}`);
  }

  get(name: string): SubagentDefinition | undefined {
    return this.agents.get(name)?.definition;
  }

  getRegistration(name: string): SubagentRegistration | undefined {
    return this.agents.get(name);
  }

  getAll(): SubagentDefinition[] {
    return Array.from(this.agents.values()).map((r) => r.definition);
  }

  getByScope(scope: SubagentScope): SubagentDefinition[] {
    return Array.from(this.agents.values())
      .filter((r) => r.definition.scope === scope)
      .map((r) => r.definition);
  }

  getDescriptions(): Array<{ name: string; description: string; scope: SubagentScope }> {
    return Array.from(this.agents.values()).map((r) => ({
      name: r.definition.name,
      description: r.definition.description,
      scope: r.definition.scope,
    }));
  }

  has(name: string): boolean {
    return this.agents.has(name);
  }

  remove(name: string): boolean {
    const reg = this.agents.get(name);
    if (reg?.definition.scope === "built-in") {
      logger.warn(`Cannot remove built-in subagent: ${name}`);
      return false;
    }
    return this.agents.delete(name);
  }

  clear(): void {
    for (const [name] of this.agents) {
      this.remove(name);
    }
  }
}
