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
}

export interface BuildResult {
  name: string;
  version: string;
  command: string;
  outputPath: string;
  success: boolean;
  error?: string;
}

export function buildClient(name: string, options: BuildClientOptions = {}): BuildResult {
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

    logger.info(`Building client: ${config.name} v${config.version}`);

    // Create output directory
    const outputDir = options.output ?? resolve(process.cwd(), "dist", "clients", name);
    mkdirSync(outputDir, { recursive: true });

    // Generate client entry point
    const entryPoint = generateClientEntryPoint(name, config);
    writeFileSync(resolve(outputDir, "cli.ts"), entryPoint);

    // Generate package.json for the client
    const packageJson = generatePackageJson(name, config);
    writeFileSync(resolve(outputDir, "package.json"), JSON.stringify(packageJson, null, 2));

    // Copy config
    writeFileSync(resolve(outputDir, "config.yaml"), readFileSync(resolve(clientDir, "config.yaml"), "utf-8"));

    // Copy branding if exists
    const logoPath = resolve(clientDir, "branding", "logo.txt");
    if (existsSync(logoPath)) {
      mkdirSync(resolve(outputDir, "branding"), { recursive: true });
      writeFileSync(resolve(outputDir, "branding", "logo.txt"), readFileSync(logoPath, "utf-8"));
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

program.parse();
`;
}

function generatePackageJson(_name: string, config: { name: string; version: string; description: string; command: string }): Record<string, unknown> {
  return {
    name: config.name,
    version: config.version,
    description: config.description,
    type: "module",
    bin: {
      [config.command]: "./cli.js",
    },
    scripts: {
      build: "tsup cli.ts --format esm",
      start: "node cli.js",
    },
    dependencies: {
      commander: "^12.0.0",
    },
    devDependencies: {
      tsup: "^8.0.0",
      typescript: "^5.0.0",
    },
  };
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
