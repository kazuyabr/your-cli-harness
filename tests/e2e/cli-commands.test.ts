// tests/e2e/cli-commands.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ROOT = resolve(process.cwd());
const CLI_PATH = resolve(PROJECT_ROOT, "dist", "cli.js");

function run(command: string, opts: { expectFail?: boolean } = {}): string {
  const env = { ...process.env, NODE_ENV: "test" };
  try {
    return execSync(`node ${CLI_PATH} ${command}`, {
      cwd: PROJECT_ROOT,
      env,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err: unknown) {
    if (opts.expectFail) {
      const e = err as { stdout?: string; stderr?: string };
      return (e.stdout ?? "") + (e.stderr ?? "");
    }
    throw err;
  }
}

function cleanup(name: string) {
  const clientDir = resolve(PROJECT_ROOT, "src", "clients", name);
  if (existsSync(clientDir)) {
    rmSync(clientDir, { recursive: true, force: true });
  }
  const distDir = resolve(PROJECT_ROOT, "dist", "clients", name);
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
  }
}

describe("E2E: CLI Commands", () => {
  beforeEach(() => {
    cleanup("my-e2e-client");
    cleanup("workflow-test");
  });

  afterEach(() => {
    cleanup("my-e2e-client");
    cleanup("workflow-test");
  });

  describe("help command", () => {
    it("shows usage information", () => {
      const out = run("--help");
      expect(out).toContain("Usage:");
      expect(out).toContain("Commands:");
    });

    it("shows available commands", () => {
      const out = run("--help");
      expect(out).toContain("init");
      expect(out).toContain("create-client");
      expect(out).toContain("build-client");
      expect(out).toContain("list-clients");
    });
  });

  describe("create-client command", () => {
    it("creates a client directory structure", () => {
      const out = run("create-client my-e2e-client");
      expect(out).toContain("Creating client");
      const clientDir = resolve(PROJECT_ROOT, "src", "clients", "my-e2e-client");
      expect(existsSync(clientDir)).toBe(true);
      expect(existsSync(resolve(clientDir, "config.yaml"))).toBe(true);
      expect(existsSync(resolve(clientDir, "CLAUDE.md"))).toBe(true);
      expect(existsSync(resolve(clientDir, "branding", "logo.txt"))).toBe(true);
      expect(existsSync(resolve(clientDir, "memory", "MEMORY.md"))).toBe(true);
      expect(existsSync(resolve(clientDir, "skills"))).toBe(true);
      expect(existsSync(resolve(clientDir, "agents"))).toBe(true);
    });

    it("generates config.yaml with client name", () => {
      run("create-client my-e2e-client");
      const configPath = resolve(PROJECT_ROOT, "src", "clients", "my-e2e-client", "config.yaml");
      const config = readFileSync(configPath, "utf-8");
      expect(config).toContain("name: my-e2e-client");
      expect(config).toContain("command: my-e2e-client");
    });

    it("generates CLAUDE.md with client name", () => {
      run("create-client my-e2e-client");
      const claudePath = resolve(PROJECT_ROOT, "src", "clients", "my-e2e-client", "CLAUDE.md");
      const content = readFileSync(claudePath, "utf-8");
      expect(content).toContain("my-e2e-client");
    });

    it("generates MEMORY.md", () => {
      run("create-client my-e2e-client");
      const memPath = resolve(PROJECT_ROOT, "src", "clients", "my-e2e-client", "memory", "MEMORY.md");
      const content = readFileSync(memPath, "utf-8");
      expect(content).toContain("Memory");
    });

    it("generates default logo", () => {
      run("create-client my-e2e-client");
      const logoPath = resolve(PROJECT_ROOT, "src", "clients", "my-e2e-client", "branding", "logo.txt");
      const content = readFileSync(logoPath, "utf-8");
      expect(content).toContain("██╗");
    });
  });

  describe("build-client command", () => {
    it("builds a client", () => {
      run("create-client my-e2e-client");
      const out = run("build-client my-e2e-client");
      expect(out).toContain("Building client");
      expect(out).toContain("Build complete");
    });

    it("creates output files", () => {
      run("create-client my-e2e-client");
      run("build-client my-e2e-client");
      const outDir = resolve(PROJECT_ROOT, "dist", "clients", "my-e2e-client");
      expect(existsSync(resolve(outDir, "cli.ts"))).toBe(true);
      expect(existsSync(resolve(outDir, "package.json"))).toBe(true);
      expect(existsSync(resolve(outDir, "config.yaml"))).toBe(true);
    });

    it("generates valid package.json", () => {
      run("create-client my-e2e-client");
      run("build-client my-e2e-client");
      const pkgPath = resolve(PROJECT_ROOT, "dist", "clients", "my-e2e-client", "package.json");
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

  describe("init command", () => {
    it("initializes a project", () => {
      const projectDir = resolve(PROJECT_ROOT, "tests", "tmp", "e2e-init-test");
      mkdirSync(projectDir, { recursive: true });
      const out = run(`init ${projectDir}`);
      expect(out).toContain("Initializing");
      expect(existsSync(resolve(projectDir, "CLAUDE.md"))).toBe(true);
      expect(existsSync(resolve(projectDir, ".your-harness"))).toBe(true);
      rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe("full workflow", () => {
    it("create → build → list", () => {
      // Create
      const createOut = run("create-client workflow-test");
      expect(createOut).toContain("Creating client");
      // Build
      const buildOut = run("build-client workflow-test");
      expect(buildOut).toContain("Build complete");
      // Verify the built CLI exists
      const cliPath = resolve(PROJECT_ROOT, "dist", "clients", "workflow-test", "cli.ts");
      expect(existsSync(cliPath)).toBe(true);
    });
  });
});
