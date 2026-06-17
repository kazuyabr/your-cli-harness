// tests/unit/core/config/loader.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { ConfigLoader } from "../../../../src/core/config/loader.js";
import { ConfigError } from "../../../../src/shared/errors.js";

const TEST_DIR = resolve(process.cwd(), "tests", "tmp", "config-loader");

describe("ConfigLoader", () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe("load", () => {
    it("should throw ConfigError when config file not found", () => {
      expect(() => ConfigLoader.load(TEST_DIR)).toThrow(ConfigError);
    });

    it("should load a valid config file", () => {
      const configContent = `
name: test-client
command: test-cmd
version: 1.0.0
`;
      writeFileSync(resolve(TEST_DIR, "config.yaml"), configContent);

      const config = ConfigLoader.load(TEST_DIR);
      expect(config.name).toBe("test-client");
      expect(config.command).toBe("test-cmd");
      expect(config.version).toBe("1.0.0");
    });

    it("should apply defaults for missing fields", () => {
      const configContent = `
name: minimal-client
command: minimal
`;
      writeFileSync(resolve(TEST_DIR, "config.yaml"), configContent);

      const config = ConfigLoader.load(TEST_DIR);
      expect(config.name).toBe("minimal-client");
      expect(config.llm.provider).toBe("anthropic");
      expect(config.llm.model).toBe("claude-sonnet-4-20250514");
      expect(config.modes.plan.enabled).toBe(true);
    });
  });

  describe("loadFromFile", () => {
    it("should throw ConfigError when file not found", () => {
      expect(() => ConfigLoader.loadFromFile("/nonexistent/config.yaml")).toThrow(ConfigError);
    });

    it("should load config from explicit path", () => {
      const configContent = `
name: file-client
command: file-cmd
`;
      const filePath = resolve(TEST_DIR, "custom-config.yaml");
      writeFileSync(filePath, configContent);

      const config = ConfigLoader.loadFromFile(filePath);
      expect(config.name).toBe("file-client");
    });
  });
});
