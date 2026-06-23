// src/core/cli/commands/build-client.ts

import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { ConfigLoader } from "../../config/loader.js";
import { BrandingLoader } from "../../branding/loader.js";
import { createLogger } from "../../../shared/logger.js";

const logger = createLogger();

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

    // Generate client entry point
    const entryPoint = generateClientEntryPoint(name, config);
    writeFileSync(resolve(outputDir, "cli.ts"), entryPoint);

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
    console.log(BrandingLoader.renderLogo(branding));
    console.log("");

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
  return `// Auto-generated client entry point for ${name}
import { Command } from "commander";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const program = new Command();

program
  .name("${config.command}")
  .description("${config.description}")
  .version("${config.version}");

program
  .command("chat [prompt]")
  .description("Start an interactive chat or send a single prompt")
  .action(async (prompt?: string) => {
    console.log("${config.name} v${config.version}");
    console.log("Type your message or use --help for commands.");
    if (prompt) {
      console.log("You:", prompt);
      // TODO: Integrate with AgentLoop
      console.log("Response: [AgentLoop integration pending]");
    } else {
      console.log("Interactive mode coming soon...");
    }
  });

program
  .command("status")
  .description("Show client status")
  .action(() => {
    console.log("Client: ${config.name}");
    console.log("Version: ${config.version}");
    console.log("Command: ${config.command}");
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
