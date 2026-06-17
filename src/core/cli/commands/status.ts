// src/core/cli/commands/status.ts

import chalk from "chalk";
import type { Session } from "../../../shared/types.js";
import type { HeadroomMonitor } from "../../context/headroom.js";

export function showStatus(
  session: Session,
  headroom: HeadroomMonitor,
  mcpServers: Array<{ name: string; connected: boolean }>
): void {
  const status = headroom.check(session);
  const cw = session.contextWindow;

  console.log("");
  console.log(chalk.bold("📊 Session Status"));
  console.log("");

  console.log(`  Session ID:    ${session.id}`);
  console.log(`  Client:        ${session.clientId}`);
  console.log(`  Mode:          ${session.mode}`);
  console.log(`  Messages:      ${session.messages.length}`);
  console.log("");

  console.log(chalk.bold("  Context Window:"));
  console.log(`    Max:         ${cw.maxTokens.toLocaleString()} tokens`);
  console.log(`    Used:        ${cw.usedTokens.toLocaleString()} tokens`);
  console.log(`    Headroom:    ${cw.headroomTokens.toLocaleString()} tokens`);
  console.log(`    Usage:       ${status.usagePercent.toFixed(1)}%`);
  console.log(`    Level:       ${getLevelDisplay(status.level)}`);
  console.log("");

  if (mcpServers.length > 0) {
    console.log(chalk.bold("  MCP Servers:"));
    for (const server of mcpServers) {
      const icon = server.connected ? chalk.green("●") : chalk.red("●");
      console.log(`    ${icon} ${server.name}`);
    }
    console.log("");
  }
}

function getLevelDisplay(level: string): string {
  switch (level) {
    case "safe":
      return chalk.green("🟢 Safe");
    case "attention":
      return chalk.yellow("🟡 Attention");
    case "critical":
      return chalk.red("🔴 Critical");
    case "emergency":
      return chalk.red.bold("🚨 Emergency");
    default:
      return level;
  }
}
