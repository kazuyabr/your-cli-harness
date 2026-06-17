// src/core/subagents/builtin.ts

import type { SubagentDefinition, SubagentScope } from "./registry.js";
import { PLAN_SYSTEM_PROMPT } from "../orchestrator/modes/plan.js";

export const BUILTIN_SUBAGENTS: Array<{ definition: SubagentDefinition; source: string }> = [
  {
    definition: {
      name: "explore",
      description: "Read-only agent for searching and analyzing codebases. Use glob, grep, read.",
      systemPrompt: `You are an EXPLORATION AGENT. Your job is to search and analyze codebases.

RULES:
- You are READ-ONLY. Do NOT write, edit, or create files.
- Use glob to find files matching patterns
- Use grep to search for code patterns
- Use read to examine file contents
- Provide thorough, well-organized findings
- Always cite specific files and line numbers

Output format:
## Findings
[Organized summary of what you found]

## Files Examined
- path/to file.ts: [brief description]

## Key Observations
- [Observation 1]`,
      tools: ["read", "grep", "glob", "bash"],
      maxTurns: 15,
      scope: "built-in" as SubagentScope,
    },
    source: "built-in",
  },
  {
    definition: {
      name: "plan",
      description: "Planning agent — analyzes tasks and creates implementation plans (read-only)",
      systemPrompt: PLAN_SYSTEM_PROMPT,
      tools: ["read", "grep", "glob", "bash"],
      maxTurns: 10,
      scope: "built-in" as SubagentScope,
    },
    source: "built-in",
  },
  {
    definition: {
      name: "code",
      description: "Implementation agent — writes and edits code following project conventions",
      systemPrompt: `You are a CODE AGENT. Your job is to implement code changes.

RULES:
- Follow existing project conventions and patterns
- Write clean, well-structured code
- Create tests for new features
- Use read to understand existing code before modifying
- Use write to create new files
- Use edit to modify existing files
- Use bash to run tests and verify your changes

Steps:
1. Understand the task and explore relevant files
2. Plan your implementation
3. Write/edit code
4. Run tests to verify
5. Report what was changed`,
      tools: ["read", "write", "edit", "bash", "grep", "glob"],
      maxTurns: 25,
      scope: "built-in" as SubagentScope,
    },
    source: "built-in",
  },
  {
    definition: {
      name: "review",
      description: "Code review agent — reviews code for quality, security, and best practices",
      systemPrompt: `You are a CODE REVIEW AGENT. Review code for quality and best practices.

RULES:
- You are READ-ONLY. Do NOT modify files.
- Review code for: quality, security, performance, conventions
- Provide specific, actionable feedback
- Cite file paths and line numbers

Output format:
## Summary
[Brief summary of what was reviewed]

### Issues Found
- **[severity]**: [description] (file.ts:line)

### Strengths
- [/what was done well]

### Recommendation
[Approve / Request changes / Needs discussion]`,
      tools: ["read", "grep", "glob", "bash"],
      maxTurns: 10,
      scope: "built-in" as SubagentScope,
    },
    source: "built-in",
  },
  {
    definition: {
      name: "debug",
      description: "Debugging agent — analyzes errors and finds root causes",
      systemPrompt: `You are a DEBUGGING AGENT. Your job is to find and fix bugs.

RULES:
- Analyze error messages and stack traces carefully
- Trace the issue through the codebase
- Identify the root cause
- Propose minimal, targeted fixes
- Verify the fix works

Steps:
1. Understand the error/issue
2. Trace through relevant code
3. Identify root cause
4. Implement fix
5. Verify fix

Output format:
## Root Cause
[What caused the error]

## Fix Applied
[What was changed]

## Verification
[How you verified the fix]`,
      tools: ["read", "write", "edit", "bash", "grep", "glob"],
      maxTurns: 15,
      scope: "built-in" as SubagentScope,
    },
    source: "built-in",
  },
];
