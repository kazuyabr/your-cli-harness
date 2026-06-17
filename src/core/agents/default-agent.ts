// src/core/agents/default-agent.ts

import { BaseAgent } from "./base-agent.js";
import type { LLMProvider } from "../llm/provider.js";
import { DEFAULT_SYSTEM_PROMPT } from "../orchestrator/modes/default.js";

export class DefaultAgent extends BaseAgent {
  name = "default";
  description = "Default interactive agent — balanced between safety and speed";
  systemPrompt = DEFAULT_SYSTEM_PROMPT;
  tools = ["read", "write", "edit", "bash", "grep", "glob", "skill", "memory"];

  constructor(llm: LLMProvider) {
    super(llm);
  }
}
