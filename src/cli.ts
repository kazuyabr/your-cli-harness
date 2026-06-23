// src/cli.ts

import { Command } from "commander";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { ConfigLoader } from "./core/config/loader.js";
import { initProject } from "./core/cli/commands/init.js";
import { createClient } from "./core/cli/commands/create-client.js";
import { buildClient } from "./core/cli/commands/build-client.js";

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
    try {
      createClient(name, { template: options.template });
      console.log(`Client "${name}" created successfully.`);
      console.log("");
      console.log("Next steps:");
      console.log(`  1. Edit src/clients/${name}/config.yaml`);
      console.log(`  2. Add skills to src/clients/${name}/skills/`);
      console.log(`  3. Run: harness build-client ${name}`);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  });

program
  .command("build-client <name>")
  .description("Build a client CLI")
  .option("--output <dir>", "Output directory")
  .option("--standalone", "Create standalone binary")
  .option("--publish", "Publish to npm")
  .option("--access <access>", "Package access (public/private)", "public")
  .action(async (name, options) => {
    const result = await buildClient(name, {
      output: options.output,
      standalone: options.standalone,
      publish: options.publish,
      access: options.access as "public" | "private",
    });

    if (!result.success) {
      console.error(`Build failed: ${result.error}`);
      process.exit(1);
    }

    console.log(`Build complete: ${result.outputPath}`);
    console.log("");
    console.log("Commands:");
    console.log(`  npm run build    # Build the client`);
    console.log(`  node cli.js      # Run the client`);
    
    if (result.published) {
      console.log("");
      console.log(`Published to npm: ${result.npmUrl}`);
      console.log(`Run with: npx @${name}/cli`);
    }
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

    const { readdirSync, statSync } = require("node:fs") as typeof import("node:fs");

    try {
      const entries = readdirSync(clientsDir);
      const clients = entries.filter((name: string) =>
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
    } catch {
      console.log("No clients found.");
    }
  });

program
  .command("init [path]")
  .description("Initialize a new project with CLAUDE.md and memory")
  .action((path = ".") => {
    initProject(path);
  });

program.parse();
