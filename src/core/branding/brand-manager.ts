// src/core/branding/brand-manager.ts

import type { BrandingConfig } from "../../shared/types.js";
import { BrandingLoader } from "./loader.js";
import { BrandingRenderer } from "./renderer.js";
import { getThemePreset, type ThemePreset } from "./themes.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export class BrandManager {
  private config: BrandingConfig;
  private renderer: BrandingRenderer;
  private theme: ThemePreset;

  constructor(config: BrandingConfig, clientDir?: string) {
    if (clientDir) {
      this.config = BrandingLoader.load(clientDir, config);
    } else {
      this.config = config;
    }
    this.renderer = new BrandingRenderer(this.config);
    this.theme = getThemePreset(this.config.theme);
    logger.info(`BrandManager initialized (theme: ${this.config.theme})`);
  }

  getConfig(): BrandingConfig {
    return { ...this.config };
  }

  getRenderer(): BrandingRenderer {
    return this.renderer;
  }

  getTheme(): ThemePreset {
    return this.theme;
  }

  renderLogo(): string {
    return this.renderer.renderLogo();
  }

  renderHeader(name: string, version: string): string {
    return this.renderer.renderHeader(name, version);
  }

  renderWelcome(name: string, version: string): string {
    const header = this.renderHeader(name, version);
    const greeting = this.theme.greeting;
    return `${header}\n${this.renderer.dim(greeting)}`;
  }

  renderGoodbye(): string {
    return this.renderer.dim(this.theme.farewell);
  }

  renderError(message: string): string {
    return `${this.renderer.error(this.theme.errorPrefix)} ${message}`;
  }

  renderSuccess(message: string): string {
    return `${this.renderer.success(this.theme.successPrefix)} ${message}`;
  }

  renderWarning(message: string): string {
    return `${this.renderer.warning(this.theme.errorPrefix)} ${message}`;
  }

  colorize(text: string, color: "primary" | "secondary" | "accent" | "error" | "warning" | "success"): string {
    return this.renderer.colorize(text, color);
  }
}
