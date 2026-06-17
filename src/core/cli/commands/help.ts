// src/core/cli/commands/help.ts

import chalk from "chalk";
import type { BrandingConfig } from "../../../shared/types.js";
import { BrandingLoader } from "../../branding/loader.js";

export function showHelp(branding: BrandingConfig, commands: Array<{ name: string; description: string }>): void {
  console.log("");
  console.log(BrandingLoader.renderLogo(branding));
  console.log("");
  console.log(chalk.hex(branding.colors.primary)("Usage:"));
  const prompt = chalk.hex(branding.colors.secondary)("$");
  console.log(`  ${prompt} [command] [options]`);
  console.log("");
  console.log(chalk.hex(branding.colors.primary)("Commands:"));

  for (const cmd of commands) {
    const nameFormatted = chalk.hex(branding.colors.accent)(cmd.name.padEnd(16));
    console.log(`  ${nameFormatted} ${cmd.description}`);
  }

  console.log("");
  console.log(chalk.hex(branding.colors.primary)("Modes:"));
  const accent = chalk.hex(branding.colors.accent);
  console.log(`  ${accent("--plan".padEnd(16))} Analyze and propose (read-only)`);
  console.log(`  ${accent("--build".padEnd(16))} Implement with validation`);
  console.log(`  ${accent("--yolo".padEnd(16))} Execute without confirmation`);
  console.log(`  ${accent("(default)".padEnd(16))} Interactive mode with confirmations`);
  console.log("");
}
