// src/core/branding/loader.ts

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import figlet from "figlet";

import type { BrandingConfig } from "../../shared/types.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export class BrandingLoader {
  static load(clientDir: string, config: BrandingConfig): BrandingConfig {
    const logoPath = config.logo
      ? resolve(clientDir, config.logo)
      : resolve(clientDir, "branding", "logo.txt");

    let logo: string | undefined;
    if (existsSync(logoPath)) {
      logo = readFileSync(logoPath, "utf-8");
      logger.info(`Loaded branding logo from: ${logoPath}`);
    }

    return { ...config, logo };
  }

  static renderLogo(config: BrandingConfig, clientName?: string): string {
    if (config.logo) return config.logo;

    const name = clientName ?? "CLI";
    try {
      return figlet.textSync(name, { font: "ANSI Shadow" });
    } catch {
      logger.warn(`Failed to generate FIGlet logo for "${name}", using plain text`);
      return `=== ${name} ===`;
    }
  }
}
