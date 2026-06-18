// src/core/skills/types.ts

import type { Skill, SkillScope, SkillFrontmatter, SkillInvocation, SkillInvocationContext, SkillInvocationResult, SkillSearchOptions } from "../../shared/types.js";

export type { Skill, SkillScope, SkillFrontmatter, SkillInvocation, SkillInvocationContext, SkillInvocationResult, SkillSearchOptions };

export interface SkillSource {
  path: string;
  scope: SkillScope;
  priority: number;
}
