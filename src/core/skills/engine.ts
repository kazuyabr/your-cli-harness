// src/core/skills/engine.ts

import type { Skill, SkillScope, SkillSearchOptions, SkillInvocation, SkillInvocationResult } from "../../shared/types.js";
import { SkillLoader, type LoadResult } from "./loader.js";
import { SkillRegistry } from "./registry.js";
import { SkillInvoker } from "./invoker.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface SkillEngineConfig {
  builtInDir?: string;
  clientDir?: string;
  projectDir?: string;
}

export class SkillEngine {
  private loader: SkillLoader;
  private registry: SkillRegistry;
  private invoker: SkillInvoker;
  private loadedSources: Array<{ path: string; scope: SkillScope }> = [];

  constructor() {
    this.loader = new SkillLoader();
    this.registry = new SkillRegistry();
    this.invoker = new SkillInvoker();
  }

  loadBuiltInSkills(dirPath: string): LoadResult {
    return this.loadFromSource(dirPath, "built-in", "built-in");
  }

  loadClientSkills(dirPath: string): LoadResult {
    return this.loadFromSource(dirPath, "client", "client");
  }

  loadProjectSkills(dirPath: string): LoadResult {
    return this.loadFromSource(dirPath, "project", "project");
  }

  loadFromConfig(config: SkillEngineConfig): void {
    if (config.builtInDir) {
      this.loadBuiltInSkills(config.builtInDir);
    }
    if (config.clientDir) {
      this.loadClientSkills(config.clientDir);
    }
    if (config.projectDir) {
      this.loadProjectSkills(config.projectDir);
    }
  }

  get(name: string): Skill | undefined {
    return this.registry.get(name);
  }

  getAll(): Skill[] {
    return this.registry.getAll();
  }

  getByScope(scope: SkillScope): Skill[] {
    return this.registry.getByScope(scope);
  }

  search(options: SkillSearchOptions): Skill[] {
    return this.registry.search(options);
  }

  getDescriptions(): Array<{ name: string; description: string; scope: SkillScope; autoInvocable: boolean }> {
    return this.registry.getDescriptions();
  }

  invoke(skillName: string, invocation: SkillInvocation): SkillInvocationResult {
    const skill = this.registry.get(skillName);
    if (!skill) {
      return {
        success: false,
        content: "",
        error: `Skill "${skillName}" not found`,
        duration: 0,
      };
    }

    return this.invoker.invoke(skill, invocation);
  }

  has(name: string): boolean {
    return this.registry.has(name);
  }

  get size(): number {
    return this.registry.size;
  }

  private loadFromSource(dirPath: string, scope: SkillScope, source: string): LoadResult {
    const result = this.loader.loadFromDirectory(dirPath, scope, source);
    this.registry.registerAll(result.skills);
    this.loadedSources.push({ path: dirPath, scope });

    if (result.errors.length > 0) {
      logger.warn(`Loaded ${result.totalLoaded} skills from ${dirPath} with ${result.errors.length} errors`);
    } else {
      logger.info(`Loaded ${result.totalLoaded} skills from ${dirPath}`);
    }

    return result;
  }
}
