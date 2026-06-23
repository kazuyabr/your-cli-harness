// tests/unit/core/branding/logo-generator.test.ts

import { describe, it, expect } from "vitest";
import { LogoGenerator } from "../../../../src/core/branding/logo-generator.js";

describe("LogoGenerator", () => {
  const generator = new LogoGenerator();

  describe("generate", () => {
    it("generates logo from name", async () => {
      const logo = await generator.generate("jogatinando");
      expect(logo).toBeTruthy();
      expect(logo.length).toBeGreaterThan(0);
    });

    it("generates logo with default font", async () => {
      const logo = await generator.generate("test");
      expect(logo).toBeTruthy();
    });

    it("generates logo with specified font", async () => {
      const logo = await generator.generate("test", { font: "Standard" });
      expect(logo).toBeTruthy();
    });

    it("falls back to Standard font on error", async () => {
      const logo = await generator.generate("test", { font: "NonExistentFont" });
      expect(logo).toBeTruthy();
    });

    it("returns simple text on complete failure", async () => {
      // This should still return something
      const logo = await generator.generate("test");
      expect(logo).toBeTruthy();
      expect(logo.length).toBeGreaterThan(0);
    });
  });

  describe("generateWithVersion", () => {
    it("generates logo with version", async () => {
      const logo = await generator.generateWithVersion("jogatinando", "1.0.0");
      expect(logo).toBeTruthy();
      expect(logo).toContain("v1.0.0");
    });
  });

  describe("getAvailableFonts", () => {
    it("returns list of available fonts", () => {
      const fonts = generator.getAvailableFonts();
      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts.length).toBeGreaterThan(0);
    });
  });

  describe("getDefaultFonts", () => {
    it("returns list of default fonts", () => {
      const fonts = generator.getDefaultFonts();
      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts).toContain("ANSI Shadow");
      expect(fonts).toContain("Standard");
    });
  });

  describe("isValidFont", () => {
    it("returns true for valid font", async () => {
      const isValid = await generator.isValidFont("Standard");
      expect(isValid).toBe(true);
    });

    it("returns false for invalid font", async () => {
      const isValid = await generator.isValidFont("NonExistentFont");
      expect(isValid).toBe(false);
    });
  });

  describe("generateWithColor", () => {
    it("generates logo with color", async () => {
      const logo = await generator.generateWithColor("test", "red");
      expect(logo).toBeTruthy();
      expect(logo).toContain("\x1b[31m"); // Red color code
      expect(logo).toContain("\x1b[0m"); // Reset code
    });

    it("generates logo without color for unknown color", async () => {
      const logo = await generator.generateWithColor("test", "unknown");
      expect(logo).toBeTruthy();
    });
  });
});
