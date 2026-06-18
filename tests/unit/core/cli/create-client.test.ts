// tests/unit/core/cli/create-client.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient, getClientStructure } from "../../../../src/core/cli/commands/create-client.js";
import { existsSync, rmSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const TEST_CLIENT_NAME = "test-client-gen";
const TEST_CLIENT_DIR = resolve(process.cwd(), "src", "clients", TEST_CLIENT_NAME);

describe("createClient", () => {
  beforeEach(() => {
    // Clean up if exists
    if (existsSync(TEST_CLIENT_DIR)) {
      rmSync(TEST_CLIENT_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up
    if (existsSync(TEST_CLIENT_DIR)) {
      rmSync(TEST_CLIENT_DIR, { recursive: true, force: true });
    }
  });

  it("creates client directory structure", () => {
    createClient(TEST_CLIENT_NAME);

    expect(existsSync(TEST_CLIENT_DIR)).toBe(true);
    expect(existsSync(resolve(TEST_CLIENT_DIR, "config.yaml"))).toBe(true);
    expect(existsSync(resolve(TEST_CLIENT_DIR, "CLAUDE.md"))).toBe(true);
    expect(existsSync(resolve(TEST_CLIENT_DIR, "branding", "logo.txt"))).toBe(true);
    expect(existsSync(resolve(TEST_CLIENT_DIR, "skills"))).toBe(true);
    expect(existsSync(resolve(TEST_CLIENT_DIR, "agents"))).toBe(true);
    expect(existsSync(resolve(TEST_CLIENT_DIR, "memory", "MEMORY.md"))).toBe(true);
  });

  it("generates config.yaml with client name", () => {
    createClient(TEST_CLIENT_NAME);

    const config = readFileSync(resolve(TEST_CLIENT_DIR, "config.yaml"), "utf-8");
    expect(config).toContain(`name: ${TEST_CLIENT_NAME}`);
    expect(config).toContain(`command: ${TEST_CLIENT_NAME}`);
  });

  it("generates CLAUDE.md with client name", () => {
    createClient(TEST_CLIENT_NAME);

    const claudeMd = readFileSync(resolve(TEST_CLIENT_DIR, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toContain(TEST_CLIENT_NAME);
    expect(claudeMd).toContain("CLAUDE.md");
  });

  it("generates memory/MEMORY.md with client name", () => {
    createClient(TEST_CLIENT_NAME);

    const memoryMd = readFileSync(resolve(TEST_CLIENT_DIR, "memory", "MEMORY.md"), "utf-8");
    expect(memoryMd).toContain(TEST_CLIENT_NAME);
  });

  it("generates branding/logo.txt with default logo", () => {
    createClient(TEST_CLIENT_NAME);

    const logo = readFileSync(resolve(TEST_CLIENT_DIR, "branding", "logo.txt"), "utf-8");
    expect(logo).toContain("═══");
    expect(logo).toContain("██╗");
  });

  it("throws when client already exists", () => {
    mkdirSync(TEST_CLIENT_DIR, { recursive: true });

    expect(() => createClient(TEST_CLIENT_NAME)).toThrow(`already exists`);
  });
});

describe("getClientStructure", () => {
  it("returns expected file structure", () => {
    const structure = getClientStructure("myapp");

    expect(structure).toContain("src/clients/myapp/");
    expect(structure).toContain("src/clients/myapp/config.yaml");
    expect(structure).toContain("src/clients/myapp/CLAUDE.md");
    expect(structure).toContain("src/clients/myapp/branding/");
    expect(structure).toContain("src/clients/myapp/branding/logo.txt");
    expect(structure).toContain("src/clients/myapp/skills/");
    expect(structure).toContain("src/clients/myapp/agents/");
    expect(structure).toContain("src/clients/myapp/memory/");
    expect(structure).toContain("src/clients/myapp/memory/MEMORY.md");
  });
});
