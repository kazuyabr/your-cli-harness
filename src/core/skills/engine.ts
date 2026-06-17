// src/core/skills/engine.ts

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Skill, SkillFrontmatter } from "../../shared/types.js";
import { SkillError } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

export class SkillEngine {
  private skills = new Map<string, Skill>();

  loadFromDirectory(dirPath: string): void {
    if (!existsSync(dirPath)) {
      logger.warn(`Skills directory not found: ${dirPath}`);
      return;
    }

    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillPath = resolve(dirPath, entry.name, "SKILL.md");
      if (!existsSync(skillPath)) continue;

      try {
        const skill = this.parseSkill(skillPath, entry.name);
        this.skills.set(skill.name, skill);
        logger.info(`Loaded skill: ${skill.name}`);
      } catch (err) {
        logger.warn(`Failed to load skill from ${skillPath}: ${err}`);
      }
    }
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  getAll(): Skill[] {
    return Array.from(this.skills.values());
  }

  getDescriptions(): Array<{ name: string; description: string }> {
    return this.getAll()
      .filter((s) => !s.frontmatter.disableModelInvocation)
      .map((s) => ({
        name: s.name,
        description: s.frontmatter.description ?? s.description,
      }));
  }

  private parseSkill(filePath: string, dirName: string): Skill {
    const raw = readFileSync(filePath, "utf-8");
    const match = raw.match(FRONTMATTER_RE);

    if (!match || !match[1] || !match[2]) {
      throw new SkillError(`Invalid SKILL.md format (no frontmatter): ${filePath}`);
    }

    const frontmatterRaw = match[1];
    const content = match[2] ?? "";
    const frontmatter = this.parseFrontmatter(frontmatterRaw);

    const name = frontmatter.name ?? dirName;
    const description = frontmatter.description ?? "";

    return {
      name,
      description,
      path: filePath,
      content: content ?? "",
      frontmatter,
    };
  }

  private parseFrontmatter(raw: string): SkillFrontmatter {
    const fm: Record<string, unknown> = {};

    for (const line of raw.split("\n")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;

      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();

      if (value === "true") {
        fm[key] = true;
      } else if (value === "false") {
        fm[key] = false;
      } else if (value.startsWith("[") && value.endsWith("]")) {
        fm[key] = value
          .slice(1, -1)
          .split(",")
          .map((v) => v.trim().replace(/^["']|["']$/g, ""));
      } else {
        fm[key] = value.replace(/^["']|["']$/g, "");
      }
    }

    return fm as unknown as SkillFrontmatter;
  }
}
