// tests/integration/full-pipeline.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ConfigLoader } from "../../src/core/config/loader.js";
import { SessionManager } from "../../src/core/context/session.js";

import { MemoryManager } from "../../src/core/memory/manager.js";
import { SkillLoader } from "../../src/core/skills/loader.js";
import { SkillRegistry } from "../../src/core/skills/registry.js";
import { SkillInvoker } from "../../src/core/skills/invoker.js";
import { ModeManager } from "../../src/core/modes/mode-manager.js";
import { BrandManager } from "../../src/core/branding/brand-manager.js";
import { SubagentRegistry } from "../../src/core/subagents/registry.js";
import { BUILTIN_SUBAGENTS } from "../../src/core/subagents/builtin.js";

const TMP = resolve(process.cwd(), "tests", "tmp", "integration-pipeline");

function setupTestClient() {
  const clientDir = resolve(TMP, "test-client");
  mkdirSync(resolve(clientDir, "skills", "deploy"), { recursive: true });
  mkdirSync(resolve(clientDir, "memory"), { recursive: true });
  mkdirSync(resolve(clientDir, "branding"), { recursive: true });

  writeFileSync(resolve(clientDir, "config.yaml"), `name: test-client
command: test-client
version: "1.0.0"
llm:
  provider: anthropic
  model: claude-sonnet-4-20250514
  maxTokens: 8096
  temperature: 0.7
modes:
  default:
    enabled: true
  plan:
    enabled: true
  build:
    enabled: true
memory:
  auto:
    enabled: true
    maxLines: 200
branding:
  theme: professional
  colors:
    primary: "#D97757"
    secondary: "#6B7280"
    accent: "#2563EB"
    error: "#EF4444"
    success: "#10B981"
`);

  writeFileSync(resolve(clientDir, "CLAUDE.md"), "# Test Client Instructions\n\n## Rules\n- Rule 1\n- Rule 2\n");

  writeFileSync(resolve(clientDir, "memory", "MEMORY.md"), "# Auto Memory\n\n## Session Log\n\n- Learned X\n");

  writeFileSync(
    resolve(clientDir, "skills", "deploy", "SKILL.md"),
    `---
name: deploy
description: Deploy to production
allowed-tools: Bash(git *)
---

Deploy $ARGUMENTS to production:

1. Run tests
2. Build
3. Push to registry
4. Deploy: kubectl set image deployment/$ARGUMENTS
`,
  );

  return clientDir;
}

describe("Integration: Full Pipeline", () => {
  beforeEach(() => {
    mkdirSync(TMP, { recursive: true });
    setupTestClient();
  });

  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it("loads config and creates session with correct defaults", () => {
    const config = ConfigLoader.load(resolve(TMP, "test-client"));
    expect(config.name).toBe("test-client");

    const sessionManager = new SessionManager();
    const session = sessionManager.create(config.name, "default", config.llm.maxTokens);
    expect(session.clientId).toBe("test-client");
    expect(session.mode).toBe("default");
  });

  it("loads memory from client directory", () => {
    const config = ConfigLoader.load(resolve(TMP, "test-client"));
    const memory = new MemoryManager(config.memory.auto, resolve(TMP, "test-client", "memory"));
    const content = memory.load();
    expect(content).toContain("Auto Memory");
    expect(content).toContain("Learned X");
  });

  it("loads skills from client directory", () => {
    const loader = new SkillLoader();
    const result = loader.loadFromDirectory(resolve(TMP, "test-client", "skills"), "client", "test-client");
    expect(result.skills.length).toBe(1);
    expect(result.skills[0].name).toBe("deploy");
  });

  it("registers skills with correct scope", () => {
    const loader = new SkillLoader();
    const registry = new SkillRegistry();
    const result = loader.loadFromDirectory(resolve(TMP, "test-client", "skills"), "client", "test-client");
    registry.registerAll(result.skills);
    expect(registry.has("deploy")).toBe(true);
    expect(registry.get("deploy")!.scope).toBe("client");
  });

  it("invokes skill with argument substitution", () => {
    const loader = new SkillLoader();
    const result = loader.loadFromDirectory(resolve(TMP, "test-client", "skills"), "client", "test-client");
    const skill = result.skills[0];
    const invoker = new SkillInvoker();
    const output = invoker.invoke(skill, {
      arguments: { "0": "my-app" },
      context: {
        workingDirectory: "/workspace",
        session: { id: "s1", clientId: "test-client" },
        mode: "default",
      },
    });
    expect(output.success).toBe(true);
    expect(output.content).toContain("Deploy my-app to production");
    expect(output.content).toContain("kubectl set image deployment/my-app");
  });

  it("tracks headroom through session lifecycle", () => {
    const config = ConfigLoader.load(resolve(TMP, "test-client"));
    const sessionManager = new SessionManager();
    const session = sessionManager.create(config.name, "default", config.llm.maxTokens);

    expect(sessionManager.getUsagePercent(session.id)).toBe(0);

    sessionManager.addMessage(session.id, { role: "user", content: "Hello world" });
    const percent = sessionManager.getUsagePercent(session.id);
    expect(percent).toBeGreaterThan(0);
  });

  it("mode manager respects config", () => {
    const config = ConfigLoader.load(resolve(TMP, "test-client"));
    const modeManager = new ModeManager(config.modes);

    expect(modeManager.getCurrentMode()).toBe("default");
    modeManager.switchMode("plan");
    expect(modeManager.getCurrentMode()).toBe("plan");
    expect(modeManager.isReadOnly()).toBe(true);
  });

  it("branding renders with config colors", () => {
    const config = ConfigLoader.load(resolve(TMP, "test-client"));
    const brandManager = new BrandManager(config.branding);
    const header = brandManager.renderHeader("test-client", "1.0.0");
    expect(header).toContain("test-client");
    expect(header).toContain("1.0.0");
  });

  it("subagent registry has built-in agents", () => {
    expect(BUILTIN_SUBAGENTS.length).toBeGreaterThan(0);
    const names = BUILTIN_SUBAGENTS.map((a) => a.definition.name);
    expect(names).toContain("explore");
    expect(names).toContain("plan");
  });

  it("full workflow: load config → create session → load memory → load skills → invoke", () => {
    // 1. Load config
    const config = ConfigLoader.load(resolve(TMP, "test-client"));
    expect(config.name).toBe("test-client");

    // 2. Create session
    const sessionManager = new SessionManager();
    const session = sessionManager.create(config.name, "default", config.llm.maxTokens);
    expect(session.mode).toBe("default");

    // 3. Load memory
    const memory = new MemoryManager(config.memory.auto, resolve(TMP, "test-client", "memory"));
    const memoryContent = memory.load();
    expect(memoryContent).toContain("Auto Memory");

    // 4. Load skills
    const loader = new SkillLoader();
    const skillResult = loader.loadFromDirectory(resolve(TMP, "test-client", "skills"), "client", config.name);
    const registry = new SkillRegistry();
    registry.registerAll(skillResult.skills);

    // 5. Invoke skill
    const invoker = new SkillInvoker();
    const deploySkill = registry.get("deploy")!;
    const output = invoker.invoke(deploySkill, {
      arguments: { "0": "prod-v2" },
      context: {
        workingDirectory: "/workspace",
        session: { id: session.id, clientId: session.clientId },
        mode: "default",
      },
    });
    expect(output.success).toBe(true);
    expect(output.content).toContain("prod-v2");

    // 6. Branding
    const brand = new BrandManager(config.branding);
    expect(brand.renderHeader("test-client", "1.0.0")).toContain("test-client");

    // 7. Mode switching
    const modes = new ModeManager(config.modes);
    modes.switchMode("plan");
    expect(modes.isReadOnly()).toBe(true);
  });
});
