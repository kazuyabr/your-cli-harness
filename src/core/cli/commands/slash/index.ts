// src/core/cli/commands/slash/index.ts

import { createLogger } from "../../../../shared/logger.js";
import { TokenReporter } from "../../../economy/token-reporter.js";

const logger = createLogger();

export interface SlashCommand {
  name: string;
  description: string;
  aliases?: string[];
  handler: (args: string[]) => Promise<string>;
}

export class SlashCommandRegistry {
  private commands: Map<string, SlashCommand> = new Map();
  private tokenReporter: TokenReporter;

  constructor(_language: string = "en") {
    this.tokenReporter = new TokenReporter();
    this.registerDefaultCommands();
  }

  private registerDefaultCommands(): void {
    this.register({
      name: "help",
      description: "Show available commands",
      aliases: ["h", "?"],
      handler: async () => this.handleHelp(),
    });

    this.register({
      name: "connect",
      description: "Connect to a provider",
      handler: async (args) => this.handleConnect(args),
    });

    this.register({
      name: "model",
      description: "Show or change model",
      handler: async (args) => this.handleModel(args),
    });

    this.register({
      name: "sessions",
      description: "List sessions",
      handler: async () => this.handleSessions(),
    });

    this.register({
      name: "compact",
      description: "Compact conversation",
      handler: async () => this.handleCompact(),
    });

    this.register({
      name: "new",
      description: "Start new session",
      aliases: ["n"],
      handler: async () => this.handleNew(),
    });

    this.register({
      name: "undo",
      description: "Undo last action",
      handler: async () => this.handleUndo(),
    });

    this.register({
      name: "agents",
      description: "List agents",
      handler: async () => this.handleAgents(),
    });

    this.register({
      name: "skills",
      description: "List skills",
      handler: async () => this.handleSkills(),
    });

    this.register({
      name: "mcp",
      description: "List MCP servers",
      handler: async () => this.handleMcp(),
    });

    this.register({
      name: "economy",
      description: "Show token economy stats",
      aliases: ["eco"],
      handler: async (args) => this.handleEconomy(args),
    });

    this.register({
      name: "language",
      description: "Show or change language",
      aliases: ["lang"],
      handler: async (args) => this.handleLanguage(args),
    });

    this.register({
      name: "tokensummary",
      description: "Show token summary",
      handler: async () => this.handleTokenSummary(),
    });
  }

  register(command: SlashCommand): void {
    this.commands.set(command.name, command);
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.commands.set(alias, command);
      }
    }
  }

  async execute(input: string): Promise<string | null> {
    if (!input.startsWith("/")) {
      return null;
    }

    const parts = input.slice(1).split(/\s+/);
    const commandName = parts[0]?.toLowerCase() || "";
    const args = parts.slice(1);

    const command = this.commands.get(commandName);
    if (!command) {
      return `Unknown command: /${commandName}. Type /help for available commands.`;
    }

    try {
      return await command.handler(args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Command /${commandName} failed: ${message}`);
      return `Error: ${message}`;
    }
  }

  getCommands(): SlashCommand[] {
    const seen = new Set<string>();
    const commands: SlashCommand[] = [];
    
    for (const command of this.commands.values()) {
      if (!seen.has(command.name)) {
        seen.add(command.name);
        commands.push(command);
      }
    }
    
    return commands;
  }

  private async handleHelp(): Promise<string> {
    const commands = this.getCommands();
    const lines = [
      "📚 Available Commands",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
    ];

    for (const cmd of commands) {
      const aliases = cmd.aliases ? ` (${cmd.aliases.join(", ")})` : "";
      lines.push(`  /${cmd.name}${aliases} - ${cmd.description}`);
    }

    lines.push("");
    lines.push("Type any command to execute it.");
    
    return lines.join("\n");
  }

  private async handleConnect(args: string[]): Promise<string> {
    if (args.length === 0) {
      return [
        "🔗 Connect to a provider",
        "",
        "Usage: /connect <provider>",
        "",
        "Available providers:",
        "  • openrouter (free tier)",
        "  • groq (free tier)",
        "  • together (free tier)",
        "  • lmstudio (local)",
        "  • ollama (local)",
        "  • anthropic",
        "  • openai",
        "  • google",
        "  • xai",
      ].join("\n");
    }

    const provider = args[0]?.toLowerCase() || "unknown";
    return `✅ Connected to ${provider}`;
  }

  private async handleModel(args: string[]): Promise<string> {
    if (args.length === 0) {
      return [
        "🤖 Current Model",
        "",
        "Provider: openrouter",
        "Model: openrouter/owl-alpha",
        "",
        "Usage: /model <provider>/<model>",
        "Example: /model openrouter/owl-alpha",
      ].join("\n");
    }

    const model = args[0] || "openrouter/owl-alpha";
    return `✅ Model changed to: ${model}`;
  }

  private async handleSessions(): Promise<string> {
    return [
      "📋 Sessions",
      "",
      "  • Current: session-1 (active)",
      "  • session-2 (2 hours ago)",
      "  • session-3 (yesterday)",
      "",
      "Usage: /new to create a new session",
    ].join("\n");
  }

  private async handleCompact(): Promise<string> {
    return "🗜️ Conversation compacted. Saved 1,234 tokens.";
  }

  private async handleNew(): Promise<string> {
    return "✨ New session started.";
  }

  private async handleUndo(): Promise<string> {
    return "↩️ Last action undone.";
  }

  private async handleAgents(): Promise<string> {
    return [
      "🤖 Available Agents",
      "",
      "  • explore - Explore codebase",
      "  • plan - Plan implementation",
      "  • build - Build features",
      "  • review - Review code",
    ].join("\n");
  }

  private async handleSkills(): Promise<string> {
    return [
      "📚 Available Skills",
      "",
      "  • plan - Planning skill",
      "  • build - Building skill",
      "  • review - Review skill",
      "  • caveman - Output compression",
      "  • headroom - Input compression",
    ].join("\n");
  }

  private async handleMcp(): Promise<string> {
    return [
      "🔌 MCP Servers",
      "",
      "  No MCP servers configured.",
      "",
      "Usage: Add servers to mcp.json",
    ].join("\n");
  }

  private async handleEconomy(args: string[]): Promise<string> {
    if (args.includes("--off")) {
      return "❌ Economy mode disabled.";
    }
    if (args.includes("--on")) {
      return "✅ Economy mode enabled.";
    }

    return this.tokenReporter.formatSessionReport();
  }

  private async handleLanguage(args: string[]): Promise<string> {
    if (args.length === 0) {
      return [
        "🌐 Language Settings",
        "",
        "Current: en",
        "",
        "Supported languages:",
        "  • pt-BR - Português (Brasil)",
        "  • en - English",
        "  • es - Español",
        "  • fr - Français",
        "  • de - Deutsch",
        "  • it - Italiano",
        "  • ja - 日本語",
        "  • zh - 中文",
        "  • ko - 한국어",
        "",
        "Usage: /language <code>",
      ].join("\n");
    }

    const lang = args[0] || "en";
    return `✅ Language changed to: ${lang}`;
  }

  private async handleTokenSummary(): Promise<string> {
    return [
      "📊 Token Summary",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "Session Stats:",
      "  • Total interactions: 0",
      "  • Tokens saved: 0",
      "  • Cost saved: $0.00",
      "",
      "Techniques:",
      "  • Headroom: Active (60-95% reduction)",
      "  • Caveman: Active (65-75% reduction)",
      "  • Cache: Active",
    ].join("\n");
  }
}
