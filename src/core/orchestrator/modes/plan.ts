// src/core/orchestrator/modes/plan.ts

import type { ModeConfig } from "../../../shared/types.js";

export const PLAN_MODE: ModeConfig = {
  enabled: true,
  readOnly: true,
  autoExecute: false,
  requireConfirmation: true,
  description: "Plan mode — analyze codebase, propose implementation plan, do NOT execute changes",
};

export const PLAN_SYSTEM_PROMPT = `You are in PLAN MODE. Your job is to:

1. Analyze the user's request thoroughly
2. Explore the codebase to understand existing patterns
3. Propose a detailed implementation plan
4. List all files that need to be created or modified
5. Identify potential risks and edge cases

IMPORTANT RULES:
- DO NOT write, edit, or create any files
- DO NOT run any commands that modify state
- Only read files and analyze code
- Present your plan clearly with numbered steps
- Wait for user approval before any implementation

When done, present the plan and ask: "Do you approve this plan? [Approve] [Modify] [Reject]"
`;
