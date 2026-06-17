// src/core/subagents/registry.ts

import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface SubagentDefinition {
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  model?: string;
  maxTurns: number;
}

export class SubagentRegistry {
  private agents = new Map<string, SubagentDefinition>();

  register(definition: SubagentDefinition): void {
    if (this.agents.has(definition.name)) {
      logger.warn(`Overwriting existing subagent: ${definition.name}`);
    }
    this.agents.set(definition.name, definition);
    logger.info(`Registered subagent: ${definition.name}`);
  }

  get(name: string): SubagentDefinition | undefined {
    return this.agents.get(name);
  }

  getAll(): SubagentDefinition[] {
    return Array.from(this.agents.values());
  }

  getDescriptions(): Array<{ name: string; description: string }> {
    return this.getAll().map((a) => ({
      name: a.name,
      description: a.description,
    }));
  }

  has(name: string): boolean {
    return this.agents.has(name);
  }
}
