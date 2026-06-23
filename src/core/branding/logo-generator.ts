// src/core/branding/logo-generator.ts

import figlet from "figlet";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface LogoOptions {
  font?: string;
  horizontalLayout?: "default" | "fitted" | "full";
  verticalLayout?: "default" | "fitted" | "full";
  width?: number;
  whitespaceBreak?: boolean;
}

export class LogoGenerator {
  private defaultFonts: string[] = [
    "ANSI Shadow",
    "Banner",
    "Big",
    "Slant",
    "Ghost",
    "Standard",
    "Small",
    "Speed",
  ];

  async generate(name: string, options: LogoOptions = {}): Promise<string> {
    const {
      font = "ANSI Shadow",
      horizontalLayout = "default",
      verticalLayout = "default",
      width = 80,
      whitespaceBreak = true,
    } = options;

    try {
      const logo = figlet.textSync(name, {
        font: font as figlet.Fonts,
        horizontalLayout,
        verticalLayout,
        width,
        whitespaceBreak,
      });

      logger.debug(`Generated logo for "${name}" with font "${font}"`);
      return logo;
    } catch (error) {
      logger.warn(`Failed to generate logo with font "${font}", falling back to Standard`);
      
      // Fallback to Standard font
      try {
        const logo = figlet.textSync(name, {
          font: "Standard",
          horizontalLayout,
          verticalLayout,
          width,
          whitespaceBreak,
        });
        return logo;
      } catch (fallbackError) {
        logger.error(`Failed to generate logo: ${fallbackError}`);
        // Return simple text logo as last resort
        return `=== ${name} ===`;
      }
    }
  }

  async generateWithVersion(name: string, version: string, options: LogoOptions = {}): Promise<string> {
    const logo = await this.generate(name, options);
    const versionLine = `v${version}`;
    
    // Center the version line under the logo
    const logoLines = logo.split("\n");
    const maxWidth = Math.max(...logoLines.map(line => line.length));
    const padding = Math.max(0, Math.floor((maxWidth - versionLine.length) / 2));
    const centeredVersion = " ".repeat(padding) + versionLine;
    
    return `${logo}\n${centeredVersion}`;
  }

  getAvailableFonts(): string[] {
    return figlet.fontsSync();
  }

  getDefaultFonts(): string[] {
    return [...this.defaultFonts];
  }

  async isValidFont(font: string): Promise<boolean> {
    try {
      figlet.textSync("test", { font: font as figlet.Fonts });
      return true;
    } catch {
      return false;
    }
  }

  async generateWithColor(
    name: string,
    color: string,
    options: LogoOptions = {}
  ): Promise<string> {
    const logo = await this.generate(name, options);
    
    // Apply color using ANSI escape codes
    const colorCodes: Record<string, string> = {
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
      white: "\x1b[37m",
      gray: "\x1b[90m",
    };

    const reset = "\x1b[0m";
    const colorCode = colorCodes[color.toLowerCase()] || "";
    
    if (colorCode) {
      return `${colorCode}${logo}${reset}`;
    }
    
    return logo;
  }
}
