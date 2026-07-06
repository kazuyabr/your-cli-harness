// src/core/cli/tui/types.ts
// Shared types for the Ink TUI

export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: Date;
  toolName?: string;
  toolOutput?: string;
  isStreaming?: boolean;
}

export interface StatusBarInfo {
  model: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  mode: string;
  language: string;
}

export interface TUIOptions {
  clientName: string;
  version: string;
  language?: string;
  theme?: string;
  logo?: string;
}

export interface SlashCommandResult {
  output: string;
  action?: "exit" | "clear" | "none";
}

export type TUIState = "idle" | "thinking" | "streaming" | "error";
