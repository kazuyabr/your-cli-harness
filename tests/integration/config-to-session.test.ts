// tests/integration/config-to-session.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { ConfigLoader } from "../../src/core/config/loader.js";
import { SessionManager } from "../../src/core/context/session.js";
import { HeadroomMonitor } from "../../src/core/context/headroom.js";
import { MemoryManager } from "../../src/core/memory/manager.js";
import { SkillEngine } from "../../src/core/skills/engine.js";

const TEST_DIR = resolve(process.cwd(), "tests", "tmp", "integration");

describe("Integration: Config → Session → Headroom", () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it("should load config, create session, and track headroom", () => {
    const configContent = `
name: integration-test
command: inttest
llm:
  provider: anthropic
  model: claude-sonnet-4-20250514
  maxTokens: 4096
memory:
  auto:
    enabled: true
    maxLines: 100
`;
    writeFileSync(resolve(TEST_DIR, "config.yaml"), configContent);

    const config = ConfigLoader.load(TEST_DIR);
    expect(config.name).toBe("integration-test");
    expect(config.llm.maxTokens).toBe(4096);

    const sessionManager = new SessionManager();
    const session = sessionManager.create(config.name, "default");
    expect(session.clientId).toBe("integration-test");

    const headroom = new HeadroomMonitor();
    const status = headroom.check(session);
    expect(status.level).toBe("safe");
    expect(status.headroomTokens).toBeGreaterThan(0);
  });

  it("should load memory and skills for a client", () => {
    const configContent = `
name: full-client
command: full
`;
    writeFileSync(resolve(TEST_DIR, "config.yaml"), configContent);
    mkdirSync(resolve(TEST_DIR, "memory"), { recursive: true });
    writeFileSync(
      resolve(TEST_DIR, "memory", "MEMORY.md"),
      "# Test Memory\n\nBuild: npm test\n"
    );

    const config = ConfigLoader.load(TEST_DIR);
    const memory = new MemoryManager(config.memory.auto, resolve(TEST_DIR, "memory"));
    const content = memory.load();

    expect(content).toContain("Build: npm test");
  });

  it("should load skills from client directory", () => {
    const configContent = `
name: skill-client
command: skilltest
`;
    writeFileSync(resolve(TEST_DIR, "config.yaml"), configContent);
    mkdirSync(resolve(TEST_DIR, "skills", "deploy"), { recursive: true });
    writeFileSync(
      resolve(TEST_DIR, "skills", "deploy", "SKILL.md"),
      "---\nname: deploy\ndescription: Deploy the app\n---\n\nDeploy instructions here.\n"
    );

    const engine = new SkillEngine();
    engine.loadFromDirectory(resolve(TEST_DIR, "skills"));

    const skill = engine.get("deploy");
    expect(skill).toBeDefined();
    expect(skill!.name).toBe("deploy");
    expect(skill!.description).toBe("Deploy the app");
  });
});
