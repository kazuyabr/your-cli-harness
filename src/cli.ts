// src/cli.ts

import { Command } from "commander";
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { ConfigLoader } from "./core/config/loader.js";
import { BrandingLoader } from "./core/branding/loader.js";
import { ClientNotFoundError } from "./shared/errors.js";
import { initProject } from "./core/cli/commands/init.js";

const program = new Command();

program
  .name("harness")
  .description("Your CLI Harness — Generate custom AI-powered CLIs")
  .version("0.1.0");

program
  .command("create-client <name>")
  .description("Create a new client from template")
  .option("--template <name>", "Template to use", "minimal")
  .action((name, options) => {
    const templateDir = resolve(process.cwd(), "templates", options.template);
    const clientDir = resolve(process.cwd(), "src", "clients", name);

    if (!existsSync(templateDir)) {
      console.error(`Template not found: ${options.template}`);
      process.exit(1);
    }

    if (existsSync(clientDir)) {
      console.error(`Client already exists: ${name}`);
      process.exit(1);
    }

    console.log(`Creating client "${name}" from template "${options.template}"...`);

    copyDir(templateDir, clientDir);

    const configPath = resolve(clientDir, "config.yaml");
    if (existsSync(configPath)) {
      let configContent = readFileSync(configPath, "utf-8");
      configContent = configContent.replace(/\{\{client-name\}\}/g, name);
      writeFileSync(configPath, configContent);
    }

    console.log(`  ✓ Created ${clientDir}`);
    console.log("");
    console.log("Next steps:");
    console.log(`  1. Edit src/clients/${name}/config.yaml`);
    console.log(`  2. Add skills to src/clients/${name}/skills/`);
    console.log(`  3. Run: harness build-client ${name}`);
  });

program
  .command("build-client <name>")
  .description("Build a client CLI")
  .action((name) => {
    const clientDir = resolve(process.cwd(), "src", "clients", name);

    if (!existsSync(clientDir)) {
      throw new ClientNotFoundError(name);
    }

    const config = ConfigLoader.load(clientDir);
    const branding = BrandingLoader.load(clientDir, config.branding);

    console.log(`Building client: ${config.name} v${config.version}`);
    console.log(`  Command: ${config.command}`);
    console.log(`  LLM: ${config.llm.provider}/${config.llm.model}`);
    console.log("");
    console.log(BrandingLoader.renderLogo(branding));
    console.log("");
    console.log("Build commands:");
    console.log(`  npm run build`);
    console.log(`  npx tsx src/clients/${name}/cli.ts`);
  });

program
  .command("list-clients")
  .description("List all available clients")
  .action(() => {
    const clientsDir = resolve(process.cwd(), "src", "clients");

    if (!existsSync(clientsDir)) {
      console.log("No clients found.");
      return;
    }

    const clients = readdirSync(clientsDir).filter((name) =>
      statSync(resolve(clientsDir, name)).isDirectory()
    );

    if (clients.length === 0) {
      console.log("No clients found.");
      return;
    }

    console.log("Available clients:");
    for (const name of clients) {
      try {
        const config = ConfigLoader.load(resolve(clientsDir, name));
        console.log(`  ${config.name.padEnd(20)} ${config.command.padEnd(16)} ${config.llm.provider}/${config.llm.model}`);
      } catch {
        console.log(`  ${name} (no config)`);
      }
    }
  });

program
  .command("init [path]")
  .description("Initialize a new project with CLAUDE.md and memory")
  .action((path = ".") => {
    initProject(path);
  });

function copyDir(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = resolve(src, entry.name);
    const destPath = resolve(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

program.parse();
