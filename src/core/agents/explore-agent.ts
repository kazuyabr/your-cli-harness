// src/core/agents/explore-agent.ts

import { BaseAgent } from "./base-agent.js";
import type { LLMProvider } from "../llm/provider.js";

export const EXPLORE_SYSTEM_PROMPT = `You are an EXPLORE AGENT. Your job is to search and analyze codebases.

RULES:
- You are READ-ONLY. Do NOT write, edit, or create files.
- Use glob to find files matching patterns
- Use grep to search for code patterns
- Use read to examine file contents
- Use bash for read-only commands (git status, git log, etc.)
- Provide thorough, well-organized findings
- Always cite specific files and line numbers

When done, provide a structured summary of your findings.`;

export class ExploreAgent extends BaseAgent {
  name = "explore";
  description = "Read-only agent for searching and analyzing codebases";
  systemPrompt = EXPLORE_SYSTEM_PROMPT;
  tools = ["read", "grep", "glob", "bash"];

  constructor(llm: LLMProvider) {
    super(llm);
  }
}
