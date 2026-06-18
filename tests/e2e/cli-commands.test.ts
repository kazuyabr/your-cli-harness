// tests/e2e/cli-commands.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const TMP = resolve(process.cwd(), "tests", "tmp", "e2e");
const CLI_PATH = resolve(process.cwd(), "dist", "cli.js");

function run(command: string, opts: { cwd?: string; env?: Record<string, string>; expectFail?: boolean } = {}): string {
  const cwd = opts.cwd ?? TMP;
  const env = { ...process.env, NODE_ENV: "test", ...opts.env };
  try {
    return execSync(`node ${CLI_PATH} ${command}`, { cwd, env, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
  } catch (err: unknown) {
    if (opts.expectFail) {
      const e = err as { stdout?: string; stderr?: string; status?: number };
      return (e.stdout ?? "") + (e.stderr ?? "");
    }
    throw err;
  }
}

describe("E2E: CLI Commands", () => {
  beforeEach(() => {
    mkdirSync(TMP, { recursive: true });
  });

  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  describe("help command", () => {
    it("shows usage information", () => {
      const out = run("--help");
      expect(out).toContain("Usage:");
      expect(out).toContain("Commands:");
      expect(out).toContain("Modes:");
    });

    it("shows available commands", () => {
      const out = run("--help");
      expect(out).toContain("init");
      expect(out).toContain("config");
      expect(out).toContain("status");
      expect(out).toContain("create-client");
      expect(out).toContain("build-client");
    });
  });

  describe("init command", () => {
    it("initializes a project", () => {
      const projectDir = resolve(TMP, "test-init");
      mkdirSync(projectDir, { recursive: true });
      const out = run(`init ${projectDir}`);
      expect(out).toContain("Initializing");
      expect(existsSync(resolve(projectDir, "CLAUDE.md"))).toBe(true);
      expect(existsSync(resolve(projectDir, ".your-harness"))).toBe(true);
    });

    it("skips existing CLAUDE.md", () => {
      const projectDir = resolve(TMP, "test-init-existing");
      mkdirSync(projectDir, { recursive: true });
      writeFileSync(resolve(projectDir, "CLAUDE.md"), "# existing");
      const out = run(`init ${projectDir}`);
      expect(out).toContain("already exists");
    });
  });

  describe("create-client command", () => {
    it("creates a client directory structure", () => {
      const out = run("create-client my-e2e-client");
      expect(out).toContain("Creating client");
      const clientDir = resolve(process.cwd(), "src", "clients", "my-e2e-client");
      expect(existsSync(clientDir)).toBe(true);
      expect(existsSync(resolve(clientDir, "config.yaml"))).toBe(true);
      expect(existsSync(resolve(clientDir, "CLAUDE.md"))).toBe(true);
      expect(existsSync(resolve(clientDir, "branding", "logo.txt"))).toBe(true);
      expect(existsSync(resolve(clientDir, "memory", "MEMORY.md"))).toBe(true);
      expect(existsSync(resolve(clientDir, "skills"))).toBe(true);
      expect(existsSync(resolve(clientDir, "agents"))).toBe(true);
    });

    it("fails if client already exists", () => {
      const out = run("create-client my-e2e-client", { expectFail: true });
      expect(out).toContain("already exists");
    });

    it("generates config.yaml with client name", () => {
      const configPath = resolve(process.cwd(), "src", "clients", "my-e2e-client", "config.yaml");
      const config = readFileSync(configPath, "utf-8");
      expect(config).toContain("name: my-e2e-client");
      expect(config).toContain("command: my-e2e-client");
    });

    it("generates CLAUDE.md with client name", () => {
      const claudePath = resolve(process.cwd(), "src", "clients", "my-e2e-client", "CLAUDE.md");
      const content = readFileSync(claudePath, "utf-8");
      expect(content).toContain("my-e2e-client");
    });

    it("generates MEMORY.md", () => {
      const memPath = resolve(process.cwd(), "src", "clients", "my-e2e-client", "memory", "MEMORY.md");
      const content = readFileSync(memPath, "utf-8");
      expect(content).toContain("Auto Memory");
    });

    it("generates default logo", () => {
      const logoPath = resolve(process.cwd(), "src", "clients", "my-e2e-client", "branding", "logo.txt");
      const content = readFileSync(logoPath, "utf-8");
      expect(content).toContain("HARNESS");
    });
  });

  describe("build-client command", () => {
    it("builds a client", () => {
      const out = run("build-client my-e2e-client");
      expect(out).toContain("Building client");
      expect(out).toContain("Build complete");
    });

    it("creates output files", () => {
      const outDir = resolve(process.cwd(), "dist", "clients", "my-e2e-client");
      expect(existsSync(resolve(outDir, "cli.js"))).toBe(true);
      expect(existsSync(resolve(outDir, "package.json"))).toBe(true);
      expect(existsSync(resolve(outDir, "config.yaml"))).toBe(true);
    });

    it("generates valid package.json", () => {
      const pkgPath = resolve(process.cwd(), "dist", "clients", "my-e2e-client", "package.json");
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      expect(pkg.name).toBe("my-e2e-client");
      expect(pkg.bin).toBeDefined();
      expect(pkg.bin["my-e2e-client"]).toBe("./cli.js");
    });

    it("fails for non-existent client", () => {
      const out = run("build-client nonexistent-client-xyz", { expectFail: true });
      expect(out).toContain("not found");
    });
  });

  describe("list-clients command", () => {
    it("lists existing clients", () => {
      const out = run("list-clients");
      expect(out).toContain("my-e2e-client");
      expect(out).toContain("jogatinando");
    });
  });

  describe("status command", () => {
    it("shows status info", () => {
      const out = run("status");
      expect(out).toContain("Harness");
      expect(out).toContain("Client");
    });
  });

  describe("full workflow", () => {
    it("create → build → list → run", () => {
      // Create
      run("create-client workflow-test");
      // Build
      const buildOut = run("build-client workflow-test");
      expect(buildOut).toContain("Build complete");
      // List
      const listOut = run("list-clients");
      expect(listOut).toContain("workflow-test");
      // Verify the built CLI exists
      const cliPath = resolve(process.cwd(), "dist", "clients", "workflow-test", "cli.js");
      expect(existsSync(cliPath)).toBe(true);
    });
  });
});
