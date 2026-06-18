// tests/unit/core/skills/skills.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SkillLoader } from "../../../../src/core/skills/loader.js";
import { SkillRegistry } from "../../../../src/core/skills/registry.js";
import { SkillInvoker } from "../../../../src/core/skills/invoker.js";
import type { Skill, SkillInvocation, SkillInvocationContext } from "../../../../src/shared/types.js";

const TMP = resolve(process.cwd(), "tests", "tmp", "skills-test");

function makeSkill(name: string, opts: { description?: string; disableModelInvocation?: boolean; tags?: string[] } = {}) {
  const dir = resolve(TMP, name);
  mkdirSync(dir, { recursive: true });
  const tagsLine = opts.tags ? `tags: [${opts.tags.join(", ")}]` : "";
  const frontmatter = [
    "---",
    `name: ${name}`,
    `description: ${opts.description ?? name + " skill"}`,
    opts.disableModelInvocation ? "disable-model-invocation: true" : "",
    tagsLine,
    "---",
    "",
    `# ${name}`,
    "",
    `This is the ${name} skill content.`,
  ]
    .filter(Boolean)
    .join("\n");
  writeFileSync(resolve(dir, "SKILL.md"), frontmatter);
  return dir;
}

function makeSkillFile(name: string, content: string) {
  mkdirSync(TMP, { recursive: true });
  writeFileSync(resolve(TMP, `${name}.md`), content);
}

function makeSkillMdInRoot(name: string) {
  mkdirSync(TMP, { recursive: true });
  const content = [
    "---",
    `name: ${name}`,
    `description: root skill`,
    "---",
    "",
    "Root skill content",
  ].join("\n");
  writeFileSync(resolve(TMP, "SKILL.md"), content);
}

describe("SkillLoader", () => {
  let loader: SkillLoader;

  beforeEach(() => {
    loader = new SkillLoader();
    mkdirSync(TMP, { recursive: true });
  });

  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it("loads skills from directory", () => {
    makeSkill("test-skill");
    const result = loader.loadFromDirectory(TMP, "project", "test");
    expect(result.skills.length).toBe(1);
    expect(result.skills[0].name).toBe("test-skill");
    expect(result.skills[0].description).toBe("test-skill skill");
  });

  it("returns empty for non-existent directory", () => {
    const result = loader.loadFromDirectory(resolve(TMP, "nonexistent"), "project", "test");
    expect(result.skills).toEqual([]);
  });

  it("skips directories without SKILL.md", () => {
    makeSkill("valid-skill");
    mkdirSync(resolve(TMP, "invalid-dir"), { recursive: true });
    const result = loader.loadFromDirectory(TMP, "project", "test");
    expect(result.skills.length).toBe(1);
  });

  it("loads from multiple subdirectories", () => {
    makeSkill("skill-a");
    makeSkill("skill-b");
    const result = loader.loadFromDirectory(TMP, "project", "test");
    expect(result.skills.length).toBe(2);
    const names = result.skills.map((s) => s.name).sort();
    expect(names).toEqual(["skill-a", "skill-b"]);
  });

  it("sets scope and source on loaded skills", () => {
    makeSkill("scoped-skill");
    const result = loader.loadFromDirectory(TMP, "client", "jogatinando");
    expect(result.skills[0].scope).toBe("client");
    expect(result.skills[0].source).toBe("jogatinando");
  });

  it("handles disable-model-invocation", () => {
    makeSkill("disabled", { disableModelInvocation: true });
    const result = loader.loadFromDirectory(TMP, "project", "test");
    expect(result.skills[0].frontmatter["disable-model-invocation"]).toBe(true);
  });

  it("loads SKILL.md from root of directory", () => {
    makeSkillMdInRoot("root-skill");
    const result = loader.loadFromDirectory(TMP, "project", "test");
    expect(result.skills.length).toBe(1);
    expect(result.skills[0].name).toBe("root-skill");
  });

  it("loads from multiple sources", () => {
    makeSkill("from-source-1");
    const result = loader.loadFromSources([
      { path: TMP, scope: "project", source: "test" },
    ]);
    expect(result.skills.length).toBe(1);
  });

  it("counts errors", () => {
    const badDir = resolve(TMP, "bad");
    mkdirSync(badDir, { recursive: true });
    writeFileSync(resolve(badDir, "SKILL.md"), "no frontmatter here");
    const result = loader.loadFromDirectory(TMP, "project", "test");
    expect(result.errors.length).toBe(1);
  });
});

describe("SkillRegistry", () => {
  let registry: SkillRegistry;

  function skill(name: string, scope: "built-in" | "client" | "project" = "project"): Skill {
    return {
      name,
      description: `${name} desc`,
      path: `/fake/${name}`,
      content: `Content of ${name}`,
      frontmatter: { name, description: `${name} desc` },
      scope,
      source: "test",
      loadedAt: new Date(),
    };
  }

  beforeEach(() => {
    registry = new SkillRegistry();
  });

  it("registers and retrieves a skill", () => {
    registry.register(skill("test"));
    expect(registry.has("test")).toBe(true);
    expect(registry.get("test")!.name).toBe("test");
  });

  it("returns undefined for unknown skill", () => {
    expect(registry.get("unknown")).toBeUndefined();
  });

  it("lists all skills", () => {
    registry.register(skill("a"));
    registry.register(skill("b"));
    expect(registry.getAll().length).toBe(2);
  });

  it("registers multiple at once", () => {
    registry.registerAll([skill("x"), skill("y")]);
    expect(registry.size).toBe(2);
  });

  it("removes non-built-in skill", () => {
    registry.register(skill(" removable", "project"));
    expect(registry.remove(" removable")).toBe(true);
    expect(registry.has(" removable")).toBe(false);
  });

  it("cannot remove built-in skill", () => {
    registry.register(skill("builtin", "built-in"));
    expect(registry.remove("builtin")).toBe(false);
    expect(registry.has("builtin")).toBe(true);
  });

  it("clears non-built-in skills", () => {
    registry.register(skill("p1", "project"));
    registry.register(skill("p2", "client"));
    registry.register(skill("bi", "built-in"));
    registry.clear();
    expect(registry.size).toBe(1);
    expect(registry.has("bi")).toBe(true);
  });

  it("filters by scope", () => {
    registry.register(skill("built", "built-in"));
    registry.register(skill("cl", "client"));
    registry.register(skill("pr", "project"));
    expect(registry.getByScope("client").length).toBe(1);
    expect(registry.getByScope("built-in").length).toBe(1);
  });

  it("searches by query", () => {
    registry.register(skill("deploy-skill"));
    registry.register(skill("review-skill"));
    registry.register(skill("other"));
    const results = registry.search({ query: "deploy" });
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("deploy-skill");
  });

  it("searches by tag", () => {
    const s: Skill = {
      ...skill("tagged"),
      frontmatter: { name: "tagged", description: "tagged", tags: ["urgent", "hotfix"] },
    };
    registry.register(s);
    const results = registry.search({ tag: "urgent" });
    expect(results.length).toBe(1);
  });

  it("searches by scope", () => {
    registry.register(skill("a", "built-in"));
    registry.register(skill("b", "client"));
    const results = registry.search({ scope: "client" });
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("b");
  });

  it("gets descriptions", () => {
    registry.register(skill("test"));
    const descs = registry.getDescriptions();
    expect(descs.length).toBe(1);
    expect(descs[0].name).toBe("test");
  });

  it("returns size", () => {
    expect(registry.size).toBe(0);
    registry.register(skill("a"));
    expect(registry.size).toBe(1);
  });
});

describe("SkillInvoker", () => {
  let invoker: SkillInvoker;

  function makeSkillForTest(name: string, content: string): Skill {
    return {
      name,
      description: name,
      path: `/fake/${name}`,
      content,
      frontmatter: { name, description: name },
      scope: "project",
      source: "test",
      loadedAt: new Date(),
    };
  }

  function makeContext(overrides: Partial<SkillInvocationContext> = {}): SkillInvocationContext {
    return {
      workingDirectory: "/workspace",
      session: { id: "sess-123", clientId: "test-client" },
      mode: "default",
      ...overrides,
    };
  }

  beforeEach(() => {
    invoker = new SkillInvoker();
  });

  it("invokes a skill and returns content", () => {
    const skill = makeSkillForTest("test", "Hello world");
    const result = invoker.invoke(skill, { arguments: {}, context: makeContext() });
    expect(result.success).toBe(true);
    expect(result.content).toBe("Hello world");
  });

  it("substitutes $ARGUMENTS with all values", () => {
    const skill = makeSkillForTest("test", "Args: $ARGUMENTS");
    const result = invoker.invoke(skill, {
      arguments: { "0": "hello", "1": "world" },
      context: makeContext(),
    });
    expect(result.content).toBe("Args: hello world");
  });

  it("substitutes $ARGUMENTS with all values joined", () => {
    const skill = makeSkillForTest("test", "Deploy: $ARGUMENTS");
    const result = invoker.invoke(skill, {
      arguments: { "0": "my-app", "1": "prod" },
      context: makeContext(),
    });
    expect(result.content).toBe("Deploy: my-app prod");
  });

  it("substitutes $WORKING_DIR", () => {
    const skill = makeSkillForTest("test", "Dir: $WORKING_DIR");
    const result = invoker.invoke(skill, { arguments: {}, context: makeContext({ workingDirectory: "/my/project" }) });
    expect(result.content).toBe("Dir: /my/project");
  });

  it("substitutes $SESSION_ID", () => {
    const skill = makeSkillForTest("test", "Session: $SESSION_ID");
    const result = invoker.invoke(skill, {
      arguments: {},
      context: makeContext({ session: { id: "abc-123", clientId: "c" } }),
    });
    expect(result.content).toBe("Session: abc-123");
  });

  it("substitutes $CLIENT_ID", () => {
    const skill = makeSkillForTest("test", "Client: $CLIENT_ID");
    const result = invoker.invoke(skill, {
      arguments: {},
      context: makeContext({ session: { id: "s", clientId: "my-client" } }),
    });
    expect(result.content).toBe("Client: my-client");
  });

  it("substitutes $MODE", () => {
    const skill = makeSkillForTest("test", "Mode: $MODE");
    const result = invoker.invoke(skill, { arguments: {}, context: makeContext({ mode: "plan" }) });
    expect(result.content).toBe("Mode: plan");
  });

  it("returns duration", () => {
    const skill = makeSkillForTest("test", "content");
    const result = invoker.invoke(skill, { arguments: {}, context: makeContext() });
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("validates arguments for indexed placeholders", () => {
    const skill = makeSkillForTest("test", "$ARGUMENTS[0] $ARGUMENTS[2]");
    const errors = invoker.validateArguments(skill, { "0": "a" });
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("at least 3");
  });

  it("returns no errors for valid arguments", () => {
    const skill = makeSkillForTest("test", "$ARGUMENTS[0] $ARGUMENTS[1]");
    const errors = invoker.validateArguments(skill, { "0": "a", "1": "b" });
    expect(errors.length).toBe(0);
  });

  it("invokeWithTimeout resolves within timeout", async () => {
    const skill = makeSkillForTest("test", "fast");
    const result = await invoker.invokeWithTimeout(skill, { arguments: {}, context: makeContext() }, 1000);
    expect(result.success).toBe(true);
  });
});
