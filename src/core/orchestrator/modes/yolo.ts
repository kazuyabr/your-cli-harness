// src/core/orchestrator/modes/yolo.ts

import type { ModeConfig } from "../../../shared/types.js";

export const YOLO_MODE: ModeConfig = {
  enabled: false,
  readOnly: false,
  autoExecute: true,
  requireConfirmation: false,
  description: "YOLO mode — execute without confirmation, fast and direct",
};

export const YOLO_SYSTEM_PROMPT = `You are in YOLO MODE. Execute tasks directly without asking for confirmation.

RULES:
- Do exactly what the user asks, immediately
- Do not ask clarifying questions unless the request is truly ambiguous
- Be direct and efficient
- Report results after completion
- For destructive operations, add a brief warning but proceed

Act fast. Deliver results.
`;
