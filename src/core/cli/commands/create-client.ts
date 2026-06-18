// src/core/cli/commands/create-client.ts

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createLogger } from "../../../shared/logger.js";

const logger = createLogger();

export interface CreateClientOptions {
  template?: string;
}

const DEFAULT_LOGO = `
╔══════════════════════════════════════════════╗
║                                              ║
║   ██╗ ██████╗  ██████╗  █████╗ ████████╗    ║
║   ██║██╔═══██╗██╔════╝ ██╔══██╗╚══██╔══╝    ║
║   ██║██║   ██║██║  ███╗███████║   ██║       ║
║   ██║██║   ██║██║   ██║██╔══██║   ██║       ║
║   ██║╚██████╔╝╚██████╔╝██║  ██║   ██║       ║
║   ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝       ║
║                                              ║
╚══════════════════════════════════════════════╝
`;

const DEFAULT_CONFIG_TEMPLATE = (name: string) => `name: ${name}
command: ${name}
version: 0.1.0
description: "${name} AI CLI — Your intelligent development companion"

llm:
  provider: anthropic
  model: claude-sonnet-4-20250514
  maxTokens: 8192
  temperature: 0.7

modes:
  plan:
    enabled: true
    readOnly: true
    autoExecute: false
    requireConfirmation: true
    description: "Plan mode — analyze and propose implementation"
  build:
    enabled: true
    readOnly: false
    autoExecute: true
    requireConfirmation: false
    description: "Build mode — implement with validation"
  yolo:
    enabled: false
    readOnly: false
    autoExecute: true
    requireConfirmation: false
    description: "YOLO mode — execute without confirmation"
  default:
    enabled: true
    readOnly: false
    autoExecute: false
    requireConfirmation: true
    description: "Default interactive mode"

memory:
  auto:
    enabled: true
    maxLines: 200
    maxKB: 25
  vector:
    provider: none
    indexer:
      sources: []
      chunkSize: 1000
      overlap: 200

mcp:
  servers: []

branding:
  colors:
    primary: "#3B82F6"
    secondary: "#6B7280"
    accent: "#8B5CF6"
    error: "#EF4444"
    warning: "#F59E0B"
    success: "#10B981"
  theme: professional
`;

const DEFAULT_CLAUDE_MD = (name: string) => `# ${name} — CLAUDE.md

## Project Context

This is the **${name}** AI CLI, built on the Your CLI Harness framework.

## Identity

- **Name**: ${name}
- **Command**: \`${name}\`
- **Theme**: Professional

## Coding Standards

- Use TypeScript for all new code
- Follow the existing code style in each file
- Write tests for new features
- Keep functions small and focused

## Architecture

- Core logic lives in \`src/core/\` — never modify for client-specific needs
- Client configuration in \`src/clients/${name}/\`
- Skills in \`src/clients/${name}/skills/\`

## Rules

1. Respect the invariants in \`.vibecoding/decisions/invariants.md\`
2. Never put client logic in \`src/core/\`
3. 100% test coverage on core modules
`;

const DEFAULT_MEMORY_MD = (name: string) => `# ${name} Memory

## Project Notes

- Initial setup created

## User Preferences

(none yet)
`;

const DEFAULT_SKILL_README = `# Skills Directory

Place custom SKILL.md files in this directory.

Each skill should follow the Agent Skills format:
- Frontmatter with name, description, triggers
- Instructions in markdown
`;

export function createClient(name: string, _options: CreateClientOptions = {}): void {
  const clientsDir = resolve(process.cwd(), "src", "clients");
  const clientDir = resolve(clientsDir, name);

  if (existsSync(clientDir)) {
    throw new Error(`Client "${name}" already exists at ${clientDir}`);
  }

  logger.info(`Creating client "${name}"...`);

  // Create directory structure
  mkdirSync(clientDir, { recursive: true });
  mkdirSync(resolve(clientDir, "branding"), { recursive: true });
  mkdirSync(resolve(clientDir, "skills"), { recursive: true });
  mkdirSync(resolve(clientDir, "agents"), { recursive: true });
  mkdirSync(resolve(clientDir, "memory"), { recursive: true });

  // Create config.yaml
  writeFileSync(resolve(clientDir, "config.yaml"), DEFAULT_CONFIG_TEMPLATE(name));

  // Create CLAUDE.md
  writeFileSync(resolve(clientDir, "CLAUDE.md"), DEFAULT_CLAUDE_MD(name));

  // Create branding/logo.txt
  writeFileSync(resolve(clientDir, "branding", "logo.txt"), DEFAULT_LOGO);

  // Create memory/MEMORY.md
  writeFileSync(resolve(clientDir, "memory", "MEMORY.md"), DEFAULT_MEMORY_MD(name));

  // Create skills README
  writeFileSync(resolve(clientDir, "skills", "README.md"), DEFAULT_SKILL_README);

  // Create agents README
  writeFileSync(resolve(clientDir, "agents", "README.md"), `# Agents Directory\n\nPlace custom agent definitions here.\n`);

  logger.info(`Client "${name}" created successfully`);
}

export function getClientStructure(name: string): string[] {
  const base = `src/clients/${name}`;
  return [
    `${base}/`,
    `${base}/config.yaml`,
    `${base}/CLAUDE.md`,
    `${base}/branding/`,
    `${base}/branding/logo.txt`,
    `${base}/skills/`,
    `${base}/agents/`,
    `${base}/memory/`,
    `${base}/memory/MEMORY.md`,
  ];
}
