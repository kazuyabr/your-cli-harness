// src/core/cli/commands/create-client.ts

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import { createLogger } from "../../../shared/logger.js";
import figlet from "figlet";

const logger = createLogger();

export interface CreateClientOptions {
  template?: string;
  publish?: boolean;
  access?: "public" | "private";
}

const DEFAULT_CONFIG_TEMPLATE = (name: string) => `name: ${name}
command: ${name}
version: 0.1.0
description: "${name} AI CLI — Your intelligent development companion"

llm:
  provider: openrouter
  model: openrouter/owl-alpha
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

const DEFAULT_PACKAGE_JSON = (name: string, access: string = "public") => ({
  name: `@${name}/cli`,
  version: "0.1.0",
  description: `${name} AI CLI — Your intelligent development companion`,
  type: "module",
  bin: {
    [name]: "./cli.js",
  },
  files: [
    "cli.js",
    "cli.d.ts",
  ],
  engines: {
    node: ">=20.0.0",
  },
  scripts: {
    prepublishOnly: "echo 'Ready to publish!'",
  },
  publishConfig: {
    access,
  },
});

const DEFAULT_VIBECODING_VISION = (name: string) => `# Vision

## Product

**${name}** is an AI-powered CLI built on Your CLI Harness framework.

## Goals

- Provide intelligent development assistance
- Reduce token costs through compression
- Support multiple languages
- Integrate with existing workflows

## Target Users

- Developers
- Teams
- Enterprises
`;

const DEFAULT_VIBECODING_INVARIANTS = `# Invariants

## INV-001: Core Isolation
Core logic (\`src/core/\`) must NEVER contain client-specific code.

## INV-002: Test Coverage
All core modules must have 100% test coverage.

## INV-003: Type Safety
All code must be TypeScript with strict mode.

## INV-004: Backward Compatibility
Changes must not break existing clients.
`;

export async function createClient(name: string, options: CreateClientOptions = {}): Promise<void> {
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

  // Create .vibecoding directory with .gitkeep
  const vibecodingDir = resolve(clientDir, ".vibecoding");
  mkdirSync(vibecodingDir, { recursive: true });
  mkdirSync(resolve(vibecodingDir, "intent"), { recursive: true });
  mkdirSync(resolve(vibecodingDir, "decisions"), { recursive: true });
  mkdirSync(resolve(vibecodingDir, "context"), { recursive: true });
  mkdirSync(resolve(vibecodingDir, "plan"), { recursive: true });
  mkdirSync(resolve(vibecodingDir, "memory"), { recursive: true });
  
  // Create .gitkeep files
  writeFileSync(resolve(vibecodingDir, ".gitkeep"), "");
  writeFileSync(resolve(vibecodingDir, "intent", ".gitkeep"), "");
  writeFileSync(resolve(vibecodingDir, "decisions", ".gitkeep"), "");
  writeFileSync(resolve(vibecodingDir, "context", ".gitkeep"), "");
  writeFileSync(resolve(vibecodingDir, "plan", ".gitkeep"), "");
  writeFileSync(resolve(vibecodingDir, "memory", ".gitkeep"), "");

  // Create config.yaml
  writeFileSync(resolve(clientDir, "config.yaml"), DEFAULT_CONFIG_TEMPLATE(name));

  // Create CLAUDE.md
  writeFileSync(resolve(clientDir, "CLAUDE.md"), DEFAULT_CLAUDE_MD(name));

  // Generate FIGlet logo
  const logo = figlet.textSync(name, { font: "ANSI Shadow" });
  writeFileSync(resolve(clientDir, "branding", "logo.txt"), logo);

  // Create memory/MEMORY.md
  writeFileSync(resolve(clientDir, "memory", "MEMORY.md"), DEFAULT_MEMORY_MD(name));

  // Create skills README
  writeFileSync(resolve(clientDir, "skills", "README.md"), DEFAULT_SKILL_README);

  // Create agents README
  writeFileSync(resolve(clientDir, "agents", "README.md"), `# Agents Directory\n\nPlace custom agent definitions here.\n`);

  // Create package.json for npm publish
  const packageJson = DEFAULT_PACKAGE_JSON(name, options.access || "public");
  writeFileSync(resolve(clientDir, "package.json"), JSON.stringify(packageJson, null, 2));

  // Create .vibecoding/vision.md
  writeFileSync(resolve(vibecodingDir, "vision.md"), DEFAULT_VIBECODING_VISION(name));

  // Create .vibecoding/invariants.md
  writeFileSync(resolve(vibecodingDir, "decisions", "invariants.md"), DEFAULT_VIBECODING_INVARIANTS);

  // Create user config directory structure (for reference)
  const userConfigDir = join(homedir(), ".config", name);
  const userDataDir = join(homedir(), ".local", "share", name);
  
  logger.info(`Client "${name}" created successfully`);
  logger.info(`User config directory: ${userConfigDir}`);
  logger.info(`User data directory: ${userDataDir}`);
  logger.info(`Project .vibecoding directory: ${vibecodingDir}`);
}

export function getClientStructure(name: string): string[] {
  const base = `src/clients/${name}`;
  return [
    `${base}/`,
    `${base}/config.yaml`,
    `${base}/CLAUDE.md`,
    `${base}/package.json`,
    `${base}/.vibecoding/`,
    `${base}/.vibecoding/vision.md`,
    `${base}/.vibecoding/decisions/invariants.md`,
    `${base}/branding/`,
    `${base}/branding/logo.txt`,
    `${base}/skills/`,
    `${base}/agents/`,
    `${base}/memory/`,
    `${base}/memory/MEMORY.md`,
  ];
}
