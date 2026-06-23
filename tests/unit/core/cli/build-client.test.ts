// tests/unit/core/cli/build-client.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildClient, listClients } from "../../../../src/core/cli/commands/build-client.js";
import { existsSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const TEST_CLIENT_NAME = "test-build-client";
const TEST_CLIENT_DIR = resolve(process.cwd(), "src", "clients", TEST_CLIENT_NAME);

const TEST_CONFIG = `name: ${TEST_CLIENT_NAME}
command: ${TEST_CLIENT_NAME}
version: 1.0.0
description: "Test client for build tests"

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
  build:
    enabled: true
    readOnly: false
    autoExecute: true
    requireConfirmation: false
  yolo:
    enabled: false
  default:
    enabled: true

memory:
  auto:
    enabled: true
  vector:
    provider: none
    indexer:
      sources: []

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

describe("buildClient", () => {
  beforeEach(() => {
    if (existsSync(TEST_CLIENT_DIR)) {
      rmSync(TEST_CLIENT_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_CLIENT_DIR, { recursive: true });
    writeFileSync(resolve(TEST_CLIENT_DIR, "config.yaml"), TEST_CONFIG);
  });

  afterEach(() => {
    if (existsSync(TEST_CLIENT_DIR)) {
      rmSync(TEST_CLIENT_DIR, { recursive: true, force: true });
    }
    const outputDir = resolve(process.cwd(), "dist", "clients", TEST_CLIENT_NAME);
    if (existsSync(outputDir)) {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });

  it("builds a client successfully", async () => {
    const result = await buildClient(TEST_CLIENT_NAME);

    expect(result.success).toBe(true);
    expect(result.name).toBe(TEST_CLIENT_NAME);
    expect(result.version).toBe("1.0.0");
    expect(result.command).toBe(TEST_CLIENT_NAME);
    expect(result.outputPath).toContain(TEST_CLIENT_NAME);
  });

  it("creates output directory with files", async () => {
    const result = await buildClient(TEST_CLIENT_NAME);

    expect(existsSync(result.outputPath)).toBe(true);
    expect(existsSync(resolve(result.outputPath, "cli.ts"))).toBe(true);
    expect(existsSync(resolve(result.outputPath, "package.json"))).toBe(true);
    expect(existsSync(resolve(result.outputPath, "config.yaml"))).toBe(true);
  });

  it("generates valid package.json", async () => {
    const result = await buildClient(TEST_CLIENT_NAME);
    const packageJson = JSON.parse(
      require("node:fs").readFileSync(resolve(result.outputPath, "package.json"), "utf-8")
    );

    expect(packageJson.name).toBe(`@${TEST_CLIENT_NAME}/cli`);
    expect(packageJson.version).toBe("1.0.0");
    expect(packageJson.bin[TEST_CLIENT_NAME]).toBe("./cli.js");
  });

  it("returns error for non-existent client", async () => {
    const result = await buildClient("non-existent-client");

    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("returns error for invalid config", async () => {
    writeFileSync(resolve(TEST_CLIENT_DIR, "config.yaml"), "invalid: yaml: [[");

    const result = await buildClient(TEST_CLIENT_NAME);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("listClients", () => {
  beforeEach(() => {
    if (existsSync(TEST_CLIENT_DIR)) {
      rmSync(TEST_CLIENT_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (existsSync(TEST_CLIENT_DIR)) {
      rmSync(TEST_CLIENT_DIR, { recursive: true, force: true });
    }
  });

  it("lists existing clients", () => {
    mkdirSync(TEST_CLIENT_DIR, { recursive: true });
    writeFileSync(resolve(TEST_CLIENT_DIR, "config.yaml"), TEST_CONFIG);

    const clients = listClients();
    const found = clients.find((c) => c.name === TEST_CLIENT_NAME);

    expect(found).toBeDefined();
    expect(found?.command).toBe(TEST_CLIENT_NAME);
    expect(found?.provider).toBe("anthropic");
  });

  it("returns empty array when no clients exist", () => {
    const clients = listClients();
    expect(Array.isArray(clients)).toBe(true);
  });
});
