// src/core/branding/renderer.ts

import type { BrandingConfig, BrandingColors } from "../../shared/types.js";

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  // Foreground
  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
  },
} as const;

function hexToAnsi(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

export class BrandingRenderer {
  private colors: BrandingColors;
  private logo: string | undefined;

  constructor(config: BrandingConfig) {
    this.colors = config.colors;
    this.logo = config.logo;
  }

  colorize(text: string, color: keyof BrandingColors): string {
    return `${hexToAnsi(this.colors[color])}${text}${ANSI.reset}`;
  }

  primary(text: string): string {
    return this.colorize(text, "primary");
  }

  secondary(text: string): string {
    return this.colorize(text, "secondary");
  }

  accent(text: string): string {
    return this.colorize(text, "accent");
  }

  error(text: string): string {
    return this.colorize(text, "error");
  }

  warning(text: string): string {
    return this.colorize(text, "warning");
  }

  success(text: string): string {
    return this.colorize(text, "success");
  }

  bold(text: string): string {
    return `${ANSI.bold}${text}${ANSI.reset}`;
  }

  dim(text: string): string {
    return `${ANSI.dim}${text}${ANSI.reset}`;
  }

  italic(text: string): string {
    return `${ANSI.italic}${text}${ANSI.reset}`;
  }

  renderLogo(): string {
    if (this.logo) return this.logo;
    return "";
  }

  renderHeader(name: string, version: string): string {
    const logo = this.renderLogo();
    const header = `${this.primary(name)} ${this.dim(`v${version}`)}`;
    return logo ? `${logo}\n${header}` : header;
  }

  renderSeparator(): string {
    return this.dim("─".repeat(50));
  }

  renderStatus(label: string, value: string, type: "info" | "success" | "warning" | "error" = "info"): string {
    const colorFn = {
      info: this.secondary.bind(this),
      success: this.success.bind(this),
      warning: this.warning.bind(this),
      error: this.error.bind(this),
    }[type];
    return `${this.dim(`${label}:`)} ${colorFn(value)}`;
  }

  renderMode(mode: string): string {
    const modeLabels: Record<string, string> = {
      plan: "PLAN",
      build: "BUILD",
      yolo: "YOLO",
      default: "INTERACTIVE",
    };
    return this.primary(`[${modeLabels[mode] ?? mode.toUpperCase()}]`);
  }

  getColors(): BrandingColors {
    return { ...this.colors };
  }
}
