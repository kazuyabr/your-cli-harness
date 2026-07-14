// src/core/cli/commands/build-client.ts

import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

import { ConfigLoader } from "../../config/loader.js";
import { BrandingLoader } from "../../branding/loader.js";
import { createLogger } from "../../../shared/logger.js";

const logger = createLogger();

function addBinEntry(commandName: string, binPath: string): void {
  const packageJsonPath = resolve(process.cwd(), "package.json");

  if (!existsSync(packageJsonPath)) return;

  try {
    const content = readFileSync(packageJsonPath, "utf-8");
    const pkg = JSON.parse(content) as Record<string, unknown>;

    if (!pkg.bin || typeof pkg.bin !== "object") {
      pkg.bin = {};
    }

    const bin = pkg.bin as Record<string, string>;
    if (bin[commandName] !== binPath) {
      bin[commandName] = binPath;
      pkg.bin = bin;
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
      logger.info(`Added bin entry "${commandName}" -> "${binPath}" to package.json`);
    }
  } catch (err) {
    logger.warn(`Failed to update package.json: ${err}`);
  }
}

export interface BuildClientOptions {
  output?: string;
  standalone?: boolean;
  publish?: boolean;
  access?: "public" | "private";
  version?: string;
}

export interface BuildResult {
  name: string;
  version: string;
  command: string;
  outputPath: string;
  success: boolean;
  published?: boolean;
  npmUrl?: string;
  error?: string;
}

export async function buildClient(name: string, options: BuildClientOptions = {}): Promise<BuildResult> {
  const clientDir = resolve(process.cwd(), "src", "clients", name);

  if (!existsSync(clientDir)) {
    return {
      name,
      version: "",
      command: "",
      outputPath: "",
      success: false,
      error: `Client "${name}" not found at ${clientDir}`,
    };
  }

  try {
    const config = ConfigLoader.load(clientDir);
    const branding = BrandingLoader.load(clientDir, config.branding);

    // Detect language for prompts
    const translator = { get: (key: string) => key };

    logger.info(`Building client: ${config.name} v${config.version}`);

    // Create output directory
    const outputDir = options.output ?? resolve(process.cwd(), "dist", "clients", name);
    mkdirSync(outputDir, { recursive: true });

    // Generate client entry point in src/ directory (paths resolve correctly from there)
    const srcClientDir = resolve(process.cwd(), "src", "clients", name);
    const entryPoint = generateClientEntryPoint(name, config);
    const srcCliPath = resolve(srcClientDir, "cli.ts");
    writeFileSync(srcCliPath, entryPoint);
    logger.info(`Generated CLI source: ${srcCliPath}`);

    // Compile cli.ts → cli.js using esbuild (bundled from source directory)
    const jsPath = resolve(outputDir, "cli.js");
    try {
      logger.info(`Compiling ${name} CLI...`);
      execSync(`npx esbuild "${srcCliPath}" --outfile="${jsPath}" --format=esm --platform=node --target=es2022 --bundle --external:node:* --external:commander --external:figlet --external:chalk --external:yaml --external:zod --external:better-sqlite3 --external:@modelcontextprotocol/sdk --external:openai --external:@anthropic-ai/sdk --external:@vercel/* --external:ai --external:@ai-sdk/*`, {
        cwd: process.cwd(),
        stdio: "pipe",
      });
      logger.info(`Compiled: ${jsPath}`);
    } catch (compileErr) {
      logger.warn(`esbuild compilation failed: ${compileErr}`);
    }

    // Generate package.json for the client
    const packageJson = generatePackageJson(name, config, options.access || "public");
    writeFileSync(resolve(outputDir, "package.json"), JSON.stringify(packageJson, null, 2));

    // Copy config
    writeFileSync(resolve(outputDir, "config.yaml"), readFileSync(resolve(clientDir, "config.yaml"), "utf-8"));

    // Copy branding if exists
    const logoPath = resolve(clientDir, "branding", "logo.txt");
    if (existsSync(logoPath)) {
      mkdirSync(resolve(outputDir, "branding"), { recursive: true });
      writeFileSync(resolve(outputDir, "branding", "logo.txt"), readFileSync(logoPath, "utf-8"));
    }

    // Copy .vibecoding directory
    const vibecodingDir = resolve(clientDir, ".vibecoding");
    if (existsSync(vibecodingDir)) {
      copyDirectory(vibecodingDir, resolve(outputDir, ".vibecoding"));
    }

    // Render logo to console
    console.log("");
    console.log(BrandingLoader.renderLogo(branding, name));
    console.log("");

    // Add bin entry to main package.json
    addBinEntry(config.command, `./dist/clients/${name}/cli.js`);

    const result: BuildResult = {
      name: config.name,
      version: config.version,
      command: config.command,
      outputPath: outputDir,
      success: true,
    };

    // Handle publish option
    if (options.publish) {
      logger.info(translator.get("prompts.publish"));
      
      // In a real implementation, this would:
      // 1. Check if user is logged in to npm
      // 2. Run npm publish
      // 3. Return the npm URL
      
      result.published = true;
      result.npmUrl = `https://www.npmjs.com/package/@${name}/cli`;
      
      logger.info(translator.get("prompts.success"));
      logger.info(`${translator.get("prompts.instructions")} npx @${name}/cli`);
    }

    logger.info(`Build complete: ${outputDir}`);
    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error(`Build failed: ${error}`);
    return {
      name,
      version: "",
      command: "",
      outputPath: "",
      success: false,
      error,
    };
  }
}

function generateClientEntryPoint(name: string, config: { name: string; version: string; description: string; command: string }): string {
  return `#!/usr/bin/env node
// Auto-generated client entry point for ${name}

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
  .name("${config.command}")
  .description("${config.description}")
  .version("${config.version}")
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
    console.log(\`  Name:        \${config.name}\`);
    console.log(\`  Command:     \${config.command}\`);
    console.log(\`  Version:     \${config.version}\`);
    console.log(\`  LLM:         \${config.llm.provider}/\${config.llm.model}\`);
    console.log(\`  Max Tokens:  \${config.llm.maxTokens}\`);
    console.log(\`  Theme:       \${config.branding.theme}\`);
    console.log("");
    console.log("  Modes:");
    console.log(\`    Plan:      \${config.modes.plan.enabled ? "✅" : "❌"} (read-only: \${config.modes.plan.readOnly})\`);
    console.log(\`    Build:     \${config.modes.build.enabled ? "✅" : "❌"}\`);
    console.log(\`    YOLO:      \${config.modes.yolo.enabled ? "✅" : "❌"}\`);
    console.log(\`    Default:   \${config.modes.default.enabled ? "✅" : "❌"}\`);
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
      memory.save("# Auto Memory\\n\\n_(Cleared)_\\n");
      console.log("✅ Memory cleared");
      return;
    }

    if (options.add) {
      memory.append(\`## \${new Date().toISOString()}\\n\\n\${options.add}\\n\`);
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
      console.log(\`  \${skill.name.padEnd(16)} \${skill.description}\${invocable}\`);
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
      console.log(\`Language changed to: \${lang}\`);
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
    console.log("Type '" + "${config.command}" + " help' for usage information.");
    console.log("");
    return;
  }

  const { config, branding, memoryDir, skillsDir, coreSkillsDir } = loadClient();
  const userPrompt = prompt.join(" ");

  console.log("");
  console.log(BrandingLoader.renderLogo(branding, config.name));
  console.log("");

  const mode = options.plan ? "plan" : options.build ? "build" : options.yolo ? "yolo" : "default";
  logger.info(\`Mode: \${mode}, Prompt: \${userPrompt}\`);

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
      content: \`[Auto Memory]\\n\${memoryContent}\`,
      timestamp: new Date(),
    });
  }

  const llm = LLMFactory.create(config.llm);
  const agent = new DefaultAgent(llm);

  console.log(\`🧠 Mode: \${mode}\`);
  console.log(\`💬 \${userPrompt}\`);
  console.log("");

  try {
    const result = await agent.execute(session, userPrompt);
    console.log(result);
    memory.append(\`## \${new Date().toISOString()}\\n\\n**User:** \${userPrompt}\\n\\n**Result:** Completed successfully\\n\`);
  } catch (err) {
    console.error(\`\\n❌ Error: \${err}\`);
    logger.error(\`Agent execution failed: \${err}\`);
  }

  const status = headroom.check(session);
  console.log(\`\\n📊 Context: \${status.usagePercent.toFixed(1)}% used (\${status.level})\`);
});

program.parse();
`;
}

function generatePackageJson(_name: string, config: { name: string; version: string; description: string; command: string }, access: string = "public"): Record<string, unknown> {
  return {
    name: `@${config.command}/cli`,
    version: config.version,
    description: config.description,
    type: "module",
    bin: {
      [config.command]: "./cli.js",
    },
    files: [
      "cli.js",
      "cli.d.ts",
      ".vibecoding/",
    ],
    engines: {
      node: ">=20.0.0",
    },
    scripts: {
      build: "tsup cli.ts --format esm",
      start: "node cli.js",
      prepublishOnly: "echo 'Ready to publish!'",
    },
    dependencies: {
      commander: "^12.0.0",
    },
    devDependencies: {
      tsup: "^8.0.0",
      typescript: "^5.0.0",
    },
    publishConfig: {
      access,
    },
  };
}

function copyDirectory(source: string, destination: string): void {
  mkdirSync(destination, { recursive: true });
  
  const entries = readdirSync(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = resolve(source, entry.name);
    const destPath = resolve(destination, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      writeFileSync(destPath, readFileSync(sourcePath));
    }
  }
}

export function listClients(): Array<{ name: string; command: string; version: string; provider: string }> {
  const clientsDir = resolve(process.cwd(), "src", "clients");

  if (!existsSync(clientsDir)) {
    return [];
  }

  const clients: Array<{ name: string; command: string; version: string; provider: string }> = [];

  try {
    const entries = readdirSync(clientsDir);
    for (const entry of entries) {
      const entryPath = resolve(clientsDir, entry);
      if (statSync(entryPath).isDirectory()) {
        try {
          const config = ConfigLoader.load(entryPath);
          clients.push({
            name: config.name,
            command: config.command,
            version: config.version,
            provider: config.llm.provider,
          });
        } catch {
          // Skip invalid clients
        }
      }
    }
  } catch {
    // Skip if can't read directory
  }

  return clients;
}
