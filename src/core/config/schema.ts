// src/core/config/schema.ts

import { z } from "zod";

const LLMConfigSchema = z.object({
  provider: z.enum(["anthropic", "openai", "azure"]).default("anthropic"),
  model: z.string().default("claude-sonnet-4-20250514"),
  apiKey: z.string().optional(),
  baseURL: z.string().url().optional(),
  maxTokens: z.number().int().positive().default(8192),
  temperature: z.number().min(0).max(2).default(0.7),
});

const ModeConfigSchema = z.object({
  enabled: z.boolean().default(true),
  readOnly: z.boolean().default(false),
  autoExecute: z.boolean().default(false),
  requireConfirmation: z.boolean().default(true),
  description: z.string().default(""),
});

const ModesConfigSchema = z.object({
  plan: ModeConfigSchema.default({ readOnly: true, autoExecute: false }),
  build: ModeConfigSchema.default({ readOnly: false, autoExecute: true }),
  yolo: ModeConfigSchema.default({ enabled: false, autoExecute: true, requireConfirmation: false }),
  default: ModeConfigSchema.default({}),
});

const AutoMemoryConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxLines: z.number().int().positive().default(200),
  maxKB: z.number().int().positive().default(25),
});

const QdrantConfigSchema = z.object({
  url: z.string().url(),
  apiKey: z.string().optional(),
  collection: z.string().min(1),
});

const PineconeConfigSchema = z.object({
  apiKey: z.string().min(1),
  environment: z.string().min(1),
  index: z.string().min(1),
});

const IndexerSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("confluence"),
    url: z.string().url(),
    spaces: z.array(z.string()),
    auth: z.string().optional(),
  }),
  z.object({
    type: z.literal("local"),
    path: z.string().min(1),
    patterns: z.array(z.string()),
  }),
  z.object({
    type: z.literal("web"),
    urls: z.array(z.string().url()),
  }),
]);

const IndexerConfigSchema = z.object({
  sources: z.array(IndexerSourceSchema).default([]),
  schedule: z.string().optional(),
  chunkSize: z.number().int().positive().default(1000),
  overlap: z.number().int().nonnegative().default(200),
});

const VectorMemoryConfigSchema = z.object({
  provider: z.enum(["qdrant", "pinecone", "none"]).default("none"),
  qdrant: QdrantConfigSchema.optional(),
  pinecone: PineconeConfigSchema.optional(),
  indexer: IndexerConfigSchema.default({}),
});

const MemoryConfigSchema = z.object({
  auto: AutoMemoryConfigSchema.default({}),
  vector: VectorMemoryConfigSchema.default({}),
});

const MCPServerConfigSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["stdio", "http", "sse", "ws"]),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  url: z.string().url().optional(),
  headers: z.record(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

const MCPConfigSchema = z.object({
  servers: z.array(MCPServerConfigSchema).default([]),
});

const BrandingColorsSchema = z.object({
  primary: z.string().default("#D97757"),
  secondary: z.string().default("#6A9BCC"),
  accent: z.string().default("#558A42"),
  error: z.string().default("#DC2626"),
  warning: z.string().default("#F59E0B"),
  success: z.string().default("#10B981"),
});

const BrandingConfigSchema = z.object({
  logo: z.string().optional(),
  colors: BrandingColorsSchema.default({}),
  theme: z.enum(["professional", "casual", "technical"]).default("professional"),
});

export const ClientConfigSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  version: z.string().default("0.1.0"),
  description: z.string().default(""),
  llm: LLMConfigSchema.default({}),
  modes: ModesConfigSchema.default({}),
  memory: MemoryConfigSchema.default({}),
  mcp: MCPConfigSchema.default({}),
  branding: BrandingConfigSchema.default({}),
});

export type ValidatedClientConfig = z.infer<typeof ClientConfigSchema>;
