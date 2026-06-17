// src/shared/types.ts

import type { LLMConfig, ToolCall } from "../core/llm/provider.js";

export type { LLMConfig, ToolCall };

export interface ClientConfig {
  name: string;
  command: string;
  version: string;
  description: string;
  llm: LLMConfig;
  modes: ModesConfig;
  memory: MemoryConfig;
  mcp: MCPConfig;
  branding: BrandingConfig;
}
export interface ModesConfig {
  plan: ModeConfig;
  build: ModeConfig;
  yolo: ModeConfig;
  default: ModeConfig;
}

export interface ModeConfig {
  enabled: boolean;
  readOnly: boolean;
  autoExecute: boolean;
  requireConfirmation: boolean;
  description: string;
}

export interface MemoryConfig {
  auto: AutoMemoryConfig;
  vector: VectorMemoryConfig;
}

export interface AutoMemoryConfig {
  enabled: boolean;
  maxLines: number;
  maxKB: number;
}

export interface VectorMemoryConfig {
  provider: "qdrant" | "pinecone" | "none";
  qdrant?: QdrantConfig;
  pinecone?: PineconeConfig;
  indexer: IndexerConfig;
}

export interface QdrantConfig {
  url: string;
  apiKey?: string;
  collection: string;
}

export interface PineconeConfig {
  apiKey: string;
  environment: string;
  index: string;
}

export interface IndexerConfig {
  sources: IndexerSource[];
  schedule?: string;
  chunkSize: number;
  overlap: number;
}

export type IndexerSource =
  | { type: "confluence"; url: string; spaces: string[]; auth?: string }
  | { type: "local"; path: string; patterns: string[] }
  | { type: "web"; urls: string[] };

export interface MCPConfig {
  servers: MCPServerConfig[];
}

export interface MCPServerConfig {
  name: string;
  type: "stdio" | "http" | "sse" | "ws";
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
}

export interface BrandingConfig {
  logo?: string;
  colors: BrandingColors;
  theme: "professional" | "casual" | "technical";
}

export interface BrandingColors {
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
}

export interface Session {
  id: string;
  clientId: string;
  mode: string;
  messages: Message[];
  contextWindow: ContextWindow;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  timestamp: Date;
}

export interface ContextWindow {
  maxTokens: number;
  usedTokens: number;
  systemTokens: number;
  messageTokens: number;
  toolTokens: number;
  headroomTokens: number;
}

export interface Skill {
  name: string;
  description: string;
  path: string;
  content: string;
  frontmatter: SkillFrontmatter;
}

export interface SkillFrontmatter {
  name?: string;
  description?: string;
  disableModelInvocation?: boolean;
  userInvocable?: boolean;
  allowedTools?: string[];
  disallowedTools?: string[];
  model?: string;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  context?: "inline" | "fork";
  agent?: string;
  paths?: string[];
}

export interface Agent {
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  model?: string;
  maxTurns?: number;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  level: LogLevel;
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
