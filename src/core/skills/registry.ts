// src/core/skills/registry.ts

import type { Skill, SkillScope, SkillSearchOptions } from "../../shared/types.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface SkillRegistration {
  skill: Skill;
  registeredAt: Date;
}

export class SkillRegistry {
  private skills = new Map<string, SkillRegistration>();

  register(skill: Skill): void {
    const existing = this.skills.get(skill.name);

    if (existing) {
      const existingPriority = this.getScopePriority(existing.skill.scope);
      const newPriority = this.getScopePriority(skill.scope);

      if (newPriority <= existingPriority) {
        logger.info(`Overriding skill "${skill.name}" (${existing.skill.scope}) with ${skill.scope} version`);
      } else {
        logger.debug(`Skipping skill "${skill.name}" — higher priority version exists (${existing.skill.scope})`);
        return;
      }
    }

    this.skills.set(skill.name, {
      skill,
      registeredAt: new Date(),
    });

    logger.debug(`Registered skill: ${skill.name} (${skill.scope})`);
  }

  registerAll(skills: Skill[]): void {
    for (const skill of skills) {
      this.register(skill);
    }
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name)?.skill;
  }

  getAll(): Skill[] {
    return Array.from(this.skills.values()).map((r) => r.skill);
  }

  getByScope(scope: SkillScope): Skill[] {
    return this.getAll().filter((s) => s.scope === scope);
  }

  search(options: SkillSearchOptions): Skill[] {
    let results = this.getAll();

    if (options.scope) {
      results = results.filter((s) => s.scope === options.scope);
    }

    if (options.tag) {
      const tag = options.tag;
      results = results.filter((s) => s.frontmatter.tags?.includes(tag));
    }

    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.frontmatter.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    if (options.autoInvocable !== undefined) {
      results = results.filter(
        (s) => !s.frontmatter.disableModelInvocation === options.autoInvocable
      );
    }

    return results;
  }

  getDescriptions(): Array<{ name: string; description: string; scope: SkillScope; autoInvocable: boolean }> {
    return this.getAll().map((s) => ({
      name: s.name,
      description: s.frontmatter.description ?? s.description,
      scope: s.scope,
      autoInvocable: !s.frontmatter.disableModelInvocation,
    }));
  }

  has(name: string): boolean {
    return this.skills.has(name);
  }

  remove(name: string): boolean {
    const reg = this.skills.get(name);
    if (reg?.skill.scope === "built-in") {
      logger.warn(`Cannot remove built-in skill: ${name}`);
      return false;
    }
    return this.skills.delete(name);
  }

  clear(): void {
    for (const [name] of this.skills) {
      this.remove(name);
    }
  }

  get size(): number {
    return this.skills.size;
  }

  private getScopePriority(scope: SkillScope): number {
    switch (scope) {
      case "built-in": return 0;
      case "client": return 1;
      case "project": return 2;
      default: return 3;
    }
  }
}
