// src/core/language/persistence.ts

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import type { SupportedLanguage } from "./detector.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface LanguagePreference {
  language: SupportedLanguage;
  updatedAt: string;
  autoDetected: boolean;
  override: boolean;
}

export class LanguagePersistence {
  private configPath: string;

  constructor(projectRoot: string) {
    this.configPath = join(projectRoot, ".vibecoding", "language.json");
  }

  async loadPreference(): Promise<LanguagePreference | null> {
    try {
      if (!existsSync(this.configPath)) {
        return null;
      }

      const content = await readFile(this.configPath, "utf-8");
      const preference = JSON.parse(content) as LanguagePreference;

      // Validate the preference
      if (!preference.language || !preference.updatedAt) {
        return null;
      }

      return preference;
    } catch (error) {
      logger.warn(`Failed to load language preference: ${error}`);
      return null;
    }
  }

  async savePreference(
    language: SupportedLanguage,
    autoDetected: boolean = false
  ): Promise<void> {
    try {
      // Ensure directory exists
      const dir = dirname(this.configPath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      const preference: LanguagePreference = {
        language,
        updatedAt: new Date().toISOString(),
        autoDetected,
        override: !autoDetected,
      };

      await writeFile(
        this.configPath,
        JSON.stringify(preference, null, 2),
        "utf-8"
      );

      logger.info(`Language preference saved: ${language}`);
    } catch (error) {
      logger.error(`Failed to save language preference: ${error}`);
      throw error;
    }
  }

  async clearPreference(): Promise<void> {
    try {
      if (existsSync(this.configPath)) {
        const preference: LanguagePreference = {
          language: "en",
          updatedAt: new Date().toISOString(),
          autoDetected: true,
          override: false,
        };

        await writeFile(
          this.configPath,
          JSON.stringify(preference, null, 2),
          "utf-8"
        );

        logger.info("Language preference cleared");
      }
    } catch (error) {
      logger.error(`Failed to clear language preference: ${error}`);
      throw error;
    }
  }

  async hasPreference(): Promise<boolean> {
    return existsSync(this.configPath);
  }

  getConfigPath(): string {
    return this.configPath;
  }
}
