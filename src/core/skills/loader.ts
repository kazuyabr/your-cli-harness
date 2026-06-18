// src/core/skills/loader.ts

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, basename } from "node:path";
import type { Skill, SkillFrontmatter, SkillScope } from "../../shared/types.js";
import { SkillError } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

export interface LoadResult {
  skills: Skill[];
  errors: Array<{ path: string; error: string }>;
  totalLoaded: number;
}

export class SkillLoader {
  loadFromDirectory(dirPath: string, scope: SkillScope, source: string): LoadResult {
    const result: LoadResult = { skills: [], errors: [], totalLoaded: 0 };

    if (!existsSync(dirPath)) {
      return result;
    }

    const stat = statSync(dirPath);
    if (!stat.isDirectory()) {
      return result;
    }

    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        const singleSkillPath = resolve(dirPath, entry.name);
        if (entry.name === "SKILL.md" && statSync(singleSkillPath).isFile()) {
          try {
            const skill = this.parseSkill(singleSkillPath, basename(dirPath), scope, source);
            result.skills.push(skill);
          } catch (err) {
            result.errors.push({ path: singleSkillPath, error: String(err) });
          }
        }
        continue;
      }

      const skillPath = resolve(dirPath, entry.name, "SKILL.md");
      if (!existsSync(skillPath)) continue;

      try {
        const skill = this.parseSkill(skillPath, entry.name, scope, source);
        result.skills.push(skill);
        result.totalLoaded++;
        logger.debug(`Loaded skill: ${skill.name} (${scope})`);
      } catch (err) {
        result.errors.push({ path: skillPath, error: String(err) });
        logger.warn(`Failed to load skill from ${skillPath}: ${err}`);
      }
    }

    return result;
  }

  loadFromSources(sources: Array<{ path: string; scope: SkillScope; source: string }>): LoadResult {
    const combined: LoadResult = { skills: [], errors: [], totalLoaded: 0 };

    for (const src of sources) {
      const result = this.loadFromDirectory(src.path, src.scope, src.source);
      combined.skills.push(...result.skills);
      combined.errors.push(...result.errors);
      combined.totalLoaded += result.totalLoaded;
    }

    logger.info(`Loaded ${combined.totalLoaded} skills from ${sources.length} sources`);
    return combined;
  }

  private parseSkill(filePath: string, dirName: string, scope: SkillScope, source: string): Skill {
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
      content,
      frontmatter,
      scope,
      source,
      loadedAt: new Date(),
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
