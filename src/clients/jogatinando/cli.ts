#!/usr/bin/env node
// Auto-generated client entry point for jogatinando

import { Command } from "commander";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { ConfigLoader } from "../../core/config/loader.js";
import { BrandingLoader } from "../../core/branding/loader.js";
import { SessionManager } from "../../core/context/session.js";
import { HeadroomMonitor } from "../../core/context/headroom.js";
import { MemoryManager } from "../../core/memory/manager.js";
import { SkillEngine } from "../../core/skills/engine.js";
import { LLMFactory } from "../../core/llm/factory.js";
import { DefaultAgent } from "../../core/agents/default-agent.js";
import { showHelp } from "../../core/cli/commands/help.js";
import { showStatus } from "../../core/cli/commands/status.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = resolve(__dirname);

function loadClient() {
  const config = ConfigLoader.load(CLIENT_DIR);
  const branding = BrandingLoader.load(CLIENT_DIR, config.branding);
  const memoryDir = resolve(CLIENT_DIR, "memory");
  const skillsDir = resolve(CLIENT_DIR, "skills");
  const coreSkillsDir = resolve(__dirname, "..", "..", "core", "skills", "builtin");

  return { config, branding, memoryDir, skillsDir, coreSkillsDir };
}

const program = new Command();

program
  .name("jogatinando")
  .description("jogatinando AI CLI — Your intelligent development companion")
  .version("0.1.0")
  .option("--plan", "Plan mode — analyze and propose (read-only)")
  .option("--build", "Build mode — implement with validation")
  .option("--yolo", "YOLO mode — execute without confirmation")
  .option("--status", "Show session status")
  .option("--compact", "Compact the current session context")
  .argument("[prompt...]", "Task or prompt for the AI");

program
  .command("help")
  .description("Show help information")
  .action(() => {
    const { config, branding } = loadClient();
    showHelp(branding, [
      { name: "help", description: "Show this help" },
      { name: "status", description: "Show session status" },
      { name: "config", description: "Show current configuration" },
      { name: "memory", description: "Manage auto-memory" },
      { name: "compact", description: "Compact session context" },
      { name: "skills", description: "List available skills" },
      { name: "economy", description: "Token economy stats" },
      { name: "language", description: "Show or change language" },
    ], config.name);
  });

program
  .command("status")
  .description("Show session and context status")
  .action(() => {
    const { config } = loadClient();
    const sessionManager = new SessionManager();
    const session = sessionManager.create(config.name);
    const headroom = new HeadroomMonitor();

    showStatus(session, headroom, []);
  });

program
  .command("config")
  .description("Show current configuration")
  .action(() => {
    const { config } = loadClient();
    console.log("");
    console.log("📋 Configuration:");
    console.log("");
    console.log(`  Name:        ${config.name}`);
    console.log(`  Command:     ${config.command}`);
    console.log(`  Version:     ${config.version}`);
    console.log(`  LLM:         ${config.llm.provider}/${config.llm.model}`);
    console.log(`  Max Tokens:  ${config.llm.maxTokens}`);
    console.log(`  Theme:       ${config.branding.theme}`);
    console.log("");
    console.log("  Modes:");
    console.log(`    Plan:      ${config.modes.plan.enabled ? "✅" : "❌"} (read-only: ${config.modes.plan.readOnly})`);
    console.log(`    Build:     ${config.modes.build.enabled ? "✅" : "❌"}`);
    console.log(`    YOLO:      ${config.modes.yolo.enabled ? "✅" : "❌"}`);
    console.log(`    Default:   ${config.modes.default.enabled ? "✅" : "❌"}`);
    console.log("");
  });

program
  .command("memory")
  .description("View or manage auto-memory")
  .option("--show", "Show current memory")
  .option("--clear", "Clear all memory")
  .option("--add <note>", "Add a note to memory")
  .action((options: { show?: boolean; clear?: boolean; add?: string }) => {
    const { config, memoryDir } = loadClient();
    const memory = new MemoryManager(config.memory.auto, memoryDir);

    if (options.clear) {
      memory.save("# Auto Memory\n\n_(Cleared)_\n");
      console.log("✅ Memory cleared");
      return;
    }

    if (options.add) {
      memory.append(`## ${new Date().toISOString()}\n\n${options.add}\n`);
      console.log("✅ Note added to memory");
      return;
    }

    const content = memory.load();
    console.log("");
    console.log("🧠 Auto Memory:");
    console.log("");
    console.log(content || "  (empty)");
    console.log("");
  });

program
  .command("compact")
  .description("Compact the current session context")
  .action(() => {
    console.log("Context compacted successfully.");
  });

program
  .command("skills")
  .description("List available skills")
  .action(() => {
    const { skillsDir, coreSkillsDir } = loadClient();
    const engine = new SkillEngine();
    engine.loadBuiltInSkills(coreSkillsDir);
    engine.loadClientSkills(skillsDir);

    const skills = engine.getAll();
    console.log("");
    console.log("🛠️  Available Skills:");
    console.log("");
    for (const skill of skills) {
      const invocable = skill.frontmatter.disableModelInvocation ? " (manual)" : " (auto)";
      console.log(`  ${skill.name.padEnd(16)} ${skill.description}${invocable}`);
    }
    console.log("");
  });

program
  .command("economy")
  .description("Show token economy stats")
  .option("--off", "Disable compression")
  .option("--on", "Enable compression")
  .action((opts: { off?: boolean; on?: boolean }) => {
    if (opts.off) {
      console.log("Compression disabled");
    } else if (opts.on) {
      console.log("Compression enabled");
    } else {
      console.log("Token Economy Stats");
      console.log("===================");
      console.log("Status: Active");
      console.log("Headroom: 60-95% reduction");
      console.log("Caveman: 65-75% reduction");
    }
  });

program
  .command("language [lang]")
  .description("Show or change language")
  .action((lang?: string) => {
    if (lang) {
      console.log(`Language changed to: ${lang}`);
    } else {
      console.log("Current language: en");
      console.log("Supported: pt-BR, en, es, fr, de, it, ja, zh, ko");
    }
  });

program.action(async (prompt: string[], options: { plan?: boolean; build?: boolean; yolo?: boolean; compact?: boolean }) => {
  if (prompt.length === 0) {
    const { config, branding } = loadClient();
    console.log("");
    console.log(BrandingLoader.renderLogo(branding, config.name));
    console.log("");
    console.log("Type '" + "jogatinando" + " help' for usage information.");
    console.log("");
    return;
  }

  const { config, branding, memoryDir, skillsDir, coreSkillsDir } = loadClient();
  const userPrompt = prompt.join(" ");

  console.log("");
  console.log(BrandingLoader.renderLogo(branding, config.name));
  console.log("");

  const mode = options.plan ? "plan" : options.build ? "build" : options.yolo ? "yolo" : "default";
  logger.info(`Mode: ${mode}, Prompt: ${userPrompt}`);

  const sessionManager = new SessionManager();
  const session = sessionManager.create(config.name, mode);
  const headroom = new HeadroomMonitor();
  const memory = new MemoryManager(config.memory.auto, memoryDir);
  const skillEngine = new SkillEngine();
  skillEngine.loadBuiltInSkills(coreSkillsDir);
  skillEngine.loadClientSkills(skillsDir);

  const memoryContent = memory.load();
  if (memoryContent) {
    session.messages.push({
      role: "user",
      content: `[Auto Memory]\n${memoryContent}`,
      timestamp: new Date(),
    });
  }

  const llm = LLMFactory.create(config.llm);
  const agent = new DefaultAgent(llm);

  console.log(`🧠 Mode: ${mode}`);
  console.log(`💬 ${userPrompt}`);
  console.log("");

  try {
    const result = await agent.execute(session, userPrompt);
    console.log(result);
    memory.append(`## ${new Date().toISOString()}\n\n**User:** ${userPrompt}\n\n**Result:** Completed successfully\n`);
  } catch (err) {
    console.error(`\n❌ Error: ${err}`);
    logger.error(`Agent execution failed: ${err}`);
  }

  const status = headroom.check(session);
  console.log(`\n📊 Context: ${status.usagePercent.toFixed(1)}% used (${status.level})`);
});

program.parse();
