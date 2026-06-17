// src/core/cli/commands/init.ts

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import chalk from "chalk";

export function initProject(path: string): void {
  const targetDir = resolve(path);

  console.log(chalk.blue("🎯 Initializing Your CLI Harness project..."));
  console.log("");

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
    console.log(chalk.green(`  ✓ Created directory: ${targetDir}`));
  }

  const claudeMdPath = resolve(targetDir, "CLAUDE.md");
  if (!existsSync(claudeMdPath)) {
    writeFileSync(claudeMdPath, `# Project Instructions

## Build Commands
- \`npm run build\` — Build the project
- \`npm test\` — Run tests
- \`npm run lint\` — Lint code

## Coding Standards
- Follow existing code patterns
- Write tests for new features
- Keep functions small and focused

## Architecture
- Core logic in \`src/core/\`
- Client config in \`src/clients/<name>/\`
- Skills in \`src/clients/<name>/skills/\`
`);
    console.log(chalk.green("  ✓ Created CLAUDE.md"));
  } else {
    console.log(chalk.yellow("  ⚠ CLAUDE.md already exists, skipping"));
  }

  const memoryPath = resolve(targetDir, ".your-harness");
  if (!existsSync(memoryPath)) {
    mkdirSync(memoryPath, { recursive: true });
    writeFileSync(resolve(memoryPath, "MEMORY.md"), `# Auto Memory

This file stores learnings and patterns discovered during sessions.

## Session Log

_(To be populated during sessions)_
`);
    console.log(chalk.green("  ✓ Created .your-harness/MEMORY.md"));
  }

  console.log("");
  console.log(chalk.green("✅ Project initialized!"));
  console.log("");
  console.log("Next steps:");
  console.log("  1. Edit CLAUDE.md with your project instructions");
  console.log("  2. Run 'harness create-client <name>' to create a client");
  console.log("  3. Run 'harness build-client <name>' to build the CLI");
}
