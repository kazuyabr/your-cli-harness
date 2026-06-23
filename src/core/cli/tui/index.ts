// src/core/cli/tui/index.ts

import { SlashCommandRegistry } from "../commands/slash/index.js";

export interface TUIOptions {
  clientName: string;
  version: string;
  language?: string;
}

export function startTUI(options: TUIOptions): void {
  const { clientName, version, language = "en" } = options;
  const commandRegistry = new SlashCommandRegistry(language);

  console.log("");
  console.log(`${clientName} v${version}`);
  console.log("Type /help for available commands or Ctrl+C to exit.");
  console.log("");

  // Simple REPL-like interface
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  rl.prompt();

  rl.on("line", async (line: string) => {
    const input = line.trim();
    
    if (!input) {
      rl.prompt();
      return;
    }

    // Check if it's a slash command
    if (input.startsWith("/")) {
      const result = await commandRegistry.execute(input);
      if (result) {
        console.log("");
        console.log(result);
        console.log("");
      }
    } else {
      // Regular message
      console.log("");
      console.log(`You: ${input}`);
      console.log("");
      console.log("Assistant: This is a placeholder response. The AgentLoop integration will be added in a future phase.");
      console.log("");
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log("");
    console.log("Goodbye!");
    process.exit(0);
  });
}
