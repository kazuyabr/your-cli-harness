// src/core/config/loader.ts

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import yaml from "yaml";

import { ClientConfigSchema, type ValidatedClientConfig } from "./schema.js";
import { ConfigError } from "../../shared/errors.js";
import { deepMerge } from "../../shared/utils.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

const DEFAULT_CONFIG: ValidatedClientConfig = {
  name: "unnamed",
  command: "unnamed",
  version: "0.1.0",
  description: "",
  llm: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    maxTokens: 8192,
    temperature: 0.7,
  },
  modes: {
    plan: { enabled: true, readOnly: true, autoExecute: false, requireConfirmation: true, description: "Plan mode — analyze and propose" },
    build: { enabled: true, readOnly: false, autoExecute: true, requireConfirmation: false, description: "Build mode — implement with validation" },
    yolo: { enabled: false, readOnly: false, autoExecute: true, requireConfirmation: false, description: "YOLO mode — execute without confirmation" },
    default: { enabled: true, readOnly: false, autoExecute: false, requireConfirmation: true, description: "Default interactive mode" },
  },
  memory: {
    auto: { enabled: true, maxLines: 200, maxKB: 25 },
    vector: { provider: "none", indexer: { sources: [], chunkSize: 1000, overlap: 200 } },
  },
  mcp: { servers: [] },
  branding: {
    colors: { primary: "#D97757", secondary: "#6A9BCC", accent: "#558A42", error: "#DC2626", warning: "#F59E0B", success: "#10B981" },
    theme: "professional",
  },
};

export class ConfigLoader {
  static load(clientDir: string): ValidatedClientConfig {
    const configPath = resolve(clientDir, "config.yaml");

    if (!existsSync(configPath)) {
      throw new ConfigError(`Config file not found: ${configPath}`);
    }

    try {
      const raw = readFileSync(configPath, "utf-8");
      const parsed = yaml.parse(raw);
      const merged = deepMerge(DEFAULT_CONFIG, parsed);
      const validated = ClientConfigSchema.parse(merged);

      logger.info(`Loaded config for client: ${validated.name}`);
      return validated;
    } catch (err) {
      if (err instanceof ConfigError) throw err;
      throw new ConfigError(`Failed to load config from ${configPath}: ${err}`);
    }
  }

  static loadFromFile(path: string): ValidatedClientConfig {
    if (!existsSync(path)) {
      throw new ConfigError(`Config file not found: ${path}`);
    }

    try {
      const raw = readFileSync(path, "utf-8");
      const parsed = yaml.parse(raw);
      const merged = deepMerge(DEFAULT_CONFIG, parsed);
      return ClientConfigSchema.parse(merged);
    } catch (err) {
      if (err instanceof ConfigError) throw err;
      throw new ConfigError(`Failed to load config: ${err}`);
    }
  }
}
