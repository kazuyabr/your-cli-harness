// src/cli.ts

import { Command } from "commander";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { ConfigLoader } from "./core/config/loader.js";
import { BrandingLoader } from "./core/branding/loader.js";
import { ClientNotFoundError } from "./shared/errors.js";

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
    console.log(`  Template: ${templateDir}`);
    console.log(`  Target: ${clientDir}`);
    console.log("");
    console.log("Client created! Edit src/clients/" + name + "/config.yaml to customize.");
  });

program
  .command("build-client <name>")
  .description("Build a client CLI binary")
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
    console.log("Build complete! (placeholder — full build in Fase 1)");
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

    console.log("Available clients:");
    console.log("  (placeholder — will scan clients directory)");
  });

program.parse();
