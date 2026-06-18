// tests/unit/core/branding/branding.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { BrandingRenderer } from "../../../../src/core/branding/renderer.js";
import { BrandManager } from "../../../../src/core/branding/brand-manager.js";
import { THEME_PRESETS, getThemePreset } from "../../../../src/core/branding/themes.js";
import type { BrandingConfig } from "../../../../src/shared/types.js";

const testConfig: BrandingConfig = {
  colors: {
    primary: "#3B82F6",
    secondary: "#6B7280",
    accent: "#8B5CF6",
    error: "#EF4444",
    warning: "#F59E0B",
    success: "#10B981",
  },
  theme: "professional",
};

const testConfigWithLogo: BrandingConfig = {
  ...testConfig,
  logo: "=== CUSTOM LOGO ===",
};

describe("BrandingRenderer", () => {
  let renderer: BrandingRenderer;

  beforeEach(() => {
    renderer = new BrandingRenderer(testConfig);
  });

  it("colorize wraps text with ANSI codes", () => {
    const result = renderer.colorize("hello", "primary");
    expect(result).toContain("hello");
    expect(result).toContain("\x1b[38;2;");
    expect(result).toContain("\x1b[0m");
  });

  it("primary colorizes with primary color", () => {
    const result = renderer.primary("test");
    expect(result).toContain("test");
    expect(result).toContain("\x1b[38;2;59;130;246m");
  });

  it("secondary colorizes with secondary color", () => {
    const result = renderer.secondary("test");
    expect(result).toContain("test");
  });

  it("accent colorizes with accent color", () => {
    const result = renderer.accent("test");
    expect(result).toContain("test");
  });

  it("error colorizes with error color", () => {
    const result = renderer.error("fail");
    expect(result).toContain("fail");
    expect(result).toContain("\x1b[38;2;239;68;68m");
  });

  it("warning colorizes with warning color", () => {
    const result = renderer.warning("warn");
    expect(result).toContain("warn");
  });

  it("success colorizes with success color", () => {
    const result = renderer.success("ok");
    expect(result).toContain("ok");
  });

  it("bold wraps text with bold ANSI", () => {
    const result = renderer.bold("text");
    expect(result).toContain("\x1b[1m");
    expect(result).toContain("text");
  });

  it("dim wraps text with dim ANSI", () => {
    const result = renderer.dim("text");
    expect(result).toContain("\x1b[2m");
  });

  it("renderLogo returns empty when no logo", () => {
    expect(renderer.renderLogo()).toBe("");
  });

  it("renderLogo returns logo when configured", () => {
    const r = new BrandingRenderer(testConfigWithLogo);
    expect(r.renderLogo()).toBe("=== CUSTOM LOGO ===");
  });

  it("renderHeader includes name and version", () => {
    const result = renderer.renderHeader("mycli", "1.0.0");
    expect(result).toContain("mycli");
    expect(result).toContain("1.0.0");
  });

  it("renderHeader includes logo when set", () => {
    const r = new BrandingRenderer(testConfigWithLogo);
    const result = r.renderHeader("mycli", "1.0.0");
    expect(result).toContain("=== CUSTOM LOGO ===");
    expect(result).toContain("mycli");
  });

  it("renderSeparator returns dimmed line", () => {
    const result = renderer.renderSeparator();
    expect(result).toContain("─");
    expect(result).toContain("\x1b[2m");
  });

  it("renderStatus formats label and value", () => {
    const result = renderer.renderStatus("Model", "claude-sonnet-4");
    expect(result).toContain("Model");
    expect(result).toContain("claude-sonnet-4");
  });

  it("renderMode returns formatted mode label", () => {
    expect(renderer.renderMode("plan")).toContain("PLAN");
    expect(renderer.renderMode("build")).toContain("BUILD");
    expect(renderer.renderMode("yolo")).toContain("YOLO");
    expect(renderer.renderMode("default")).toContain("INTERACTIVE");
  });

  it("getColors returns a copy", () => {
    const colors = renderer.getColors();
    colors.primary = "#000000";
    expect(renderer.getColors().primary).toBe("#3B82F6");
  });
});

describe("THEME_PRESETS", () => {
  it("has professional, casual, and technical presets", () => {
    expect(THEME_PRESETS.professional).toBeDefined();
    expect(THEME_PRESETS.casual).toBeDefined();
    expect(THEME_PRESETS.technical).toBeDefined();
  });

  it("each preset has required fields", () => {
    for (const preset of Object.values(THEME_PRESETS)) {
      expect(preset.colors).toBeDefined();
      expect(preset.voiceTone).toBeDefined();
      expect(preset.greeting).toBeDefined();
      expect(preset.farewell).toBeDefined();
      expect(preset.errorPrefix).toBeDefined();
      expect(preset.successPrefix).toBeDefined();
    }
  });
});

describe("getThemePreset", () => {
  it("returns professional for known theme", () => {
    expect(getThemePreset("professional")).toBe(THEME_PRESETS.professional);
  });

  it("returns professional for unknown theme", () => {
    expect(getThemePreset("unknown")).toBe(THEME_PRESETS.professional);
  });
});

describe("BrandManager", () => {
  it("creates with config", () => {
    const manager = new BrandManager(testConfig);
    expect(manager.getConfig()).toEqual(testConfig);
  });

  it("getRenderer returns renderer instance", () => {
    const manager = new BrandManager(testConfig);
    expect(manager.getRenderer()).toBeInstanceOf(BrandingRenderer);
  });

  it("getTheme returns theme preset", () => {
    const manager = new BrandManager(testConfig);
    expect(manager.getTheme()).toBe(THEME_PRESETS.professional);
  });

  it("renderLogo returns empty without logo", () => {
    const manager = new BrandManager(testConfig);
    expect(manager.renderLogo()).toBe("");
  });

  it("renderLogo returns logo when set", () => {
    const manager = new BrandManager(testConfigWithLogo);
    expect(manager.renderLogo()).toBe("=== CUSTOM LOGO ===");
  });

  it("renderHeader includes name and version", () => {
    const manager = new BrandManager(testConfig);
    const result = manager.renderHeader("testcli", "2.0.0");
    expect(result).toContain("testcli");
    expect(result).toContain("2.0.0");
  });

  it("renderWelcome includes header and greeting", () => {
    const manager = new BrandManager(testConfig);
    const result = manager.renderWelcome("mycli", "1.0.0");
    expect(result).toContain("mycli");
    expect(result).toContain(THEME_PRESETS.professional.greeting);
  });

  it("renderGoodbye returns farewell", () => {
    const manager = new BrandManager(testConfig);
    const result = manager.renderGoodbye();
    expect(result).toContain(THEME_PRESETS.professional.farewell);
  });

  it("renderError includes error prefix", () => {
    const manager = new BrandManager(testConfig);
    const result = manager.renderError("something broke");
    expect(result).toContain("something broke");
    expect(result).toContain(THEME_PRESETS.professional.errorPrefix);
  });

  it("renderSuccess includes success prefix", () => {
    const manager = new BrandManager(testConfig);
    const result = manager.renderSuccess("it worked");
    expect(result).toContain("it worked");
    expect(result).toContain(THEME_PRESETS.professional.successPrefix);
  });

  it("colorize delegates to renderer", () => {
    const manager = new BrandManager(testConfig);
    const result = manager.colorize("test", "primary");
    expect(result).toContain("test");
    expect(result).toContain("\x1b[38;2;");
  });

  it("uses casual theme when configured", () => {
    const casualConfig: BrandingConfig = {
      ...testConfig,
      theme: "casual",
    };
    const manager = new BrandManager(casualConfig);
    expect(manager.getTheme().voiceTone).toBe("friendly");
    expect(manager.renderGoodbye()).toContain("All done");
  });

  it("uses technical theme when configured", () => {
    const techConfig: BrandingConfig = {
      ...testConfig,
      theme: "technical",
    };
    const manager = new BrandManager(techConfig);
    expect(manager.getTheme().voiceTone).toBe("concise");
    expect(manager.getTheme().greeting).toBe("Ready.");
  });
});
