// tests/unit/core/language/rules.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { LanguageRules } from "../../../../src/core/language/rules.js";

describe("LanguageRules", () => {
  let rules: LanguageRules;

  beforeEach(() => {
    rules = new LanguageRules();
  });

  describe("isTechnicalTerm", () => {
    it("returns true for technical terms", () => {
      expect(rules.isTechnicalTerm("API")).toBe(true);
      expect(rules.isTechnicalTerm("SDK")).toBe(true);
      expect(rules.isTechnicalTerm("CLI")).toBe(true);
      expect(rules.isTechnicalTerm("URL")).toBe(true);
      expect(rules.isTechnicalTerm("HTTP")).toBe(true);
      expect(rules.isTechnicalTerm("JSON")).toBe(true);
      expect(rules.isTechnicalTerm("Git")).toBe(true);
      expect(rules.isTechnicalTerm("Docker")).toBe(true);
      expect(rules.isTechnicalTerm("Kubernetes")).toBe(true);
    });

    it("returns true for AI/ML terms", () => {
      expect(rules.isTechnicalTerm("LLM")).toBe(true);
      expect(rules.isTechnicalTerm("GPT")).toBe(true);
      expect(rules.isTechnicalTerm("Claude")).toBe(true);
      expect(rules.isTechnicalTerm("token")).toBe(true);
      expect(rules.isTechnicalTerm("prompt")).toBe(true);
    });

    it("returns true for tool names", () => {
      expect(rules.isTechnicalTerm("Jira")).toBe(true);
      expect(rules.isTechnicalTerm("Slack")).toBe(true);
      expect(rules.isTechnicalTerm("Figma")).toBe(true);
      expect(rules.isTechnicalTerm("VS Code")).toBe(true);
    });

    it("returns false for non-technical terms", () => {
      expect(rules.isTechnicalTerm("hello")).toBe(false);
      expect(rules.isTechnicalTerm("world")).toBe(false);
      expect(rules.isTechnicalTerm("test")).toBe(false);
    });

    it("handles case-insensitive matching", () => {
      expect(rules.isTechnicalTerm("api")).toBe(true);
      expect(rules.isTechnicalTerm("Api")).toBe(true);
      expect(rules.isTechnicalTerm("API")).toBe(true);
    });
  });

  describe("isAbbreviation", () => {
    it("returns true for abbreviations", () => {
      expect(rules.isAbbreviation("FYI")).toBe(true);
      expect(rules.isAbbreviation("BTW")).toBe(true);
      expect(rules.isAbbreviation("PR")).toBe(true);
      expect(rules.isAbbreviation("MVP")).toBe(true);
      expect(rules.isAbbreviation("WIP")).toBe(true);
      expect(rules.isAbbreviation("TODO")).toBe(true);
    });

    it("handles case-insensitive matching", () => {
      expect(rules.isAbbreviation("fyi")).toBe(true);
      expect(rules.isAbbreviation("Fyi")).toBe(true);
      expect(rules.isAbbreviation("FYI")).toBe(true);
    });

    it("returns false for non-abbreviations", () => {
      expect(rules.isAbbreviation("hello")).toBe(false);
      expect(rules.isAbbreviation("world")).toBe(false);
    });
  });

  describe("shouldPreserve", () => {
    it("preserves technical terms", () => {
      expect(rules.shouldPreserve("API")).toBe(true);
      expect(rules.shouldPreserve("Docker")).toBe(true);
    });

    it("preserves abbreviations", () => {
      expect(rules.shouldPreserve("FYI")).toBe(true);
      expect(rules.shouldPreserve("PR")).toBe(true);
    });

    it("preserves URLs", () => {
      expect(rules.shouldPreserve("https://example.com")).toBe(true);
      expect(rules.shouldPreserve("http://localhost:3000")).toBe(true);
    });

    it("preserves file paths", () => {
      expect(rules.shouldPreserve("/usr/local/bin")).toBe(true);
      expect(rules.shouldPreserve("C:\\Users\\test")).toBe(true);
      expect(rules.shouldPreserve("~/projects")).toBe(true);
    });

    it("preserves code blocks", () => {
      expect(rules.shouldPreserve("`code`")).toBe(true);
      expect(rules.shouldPreserve("```block```")).toBe(true);
    });

    it("preserves version numbers", () => {
      expect(rules.shouldPreserve("v1.0.0")).toBe(true);
      expect(rules.shouldPreserve("1.0.0")).toBe(true);
      expect(rules.shouldPreserve("v2.1.3-beta")).toBe(true);
    });

    it("preserves package names", () => {
      expect(rules.shouldPreserve("@scope/package")).toBe(true);
      expect(rules.shouldPreserve("@ai-sdk/openai")).toBe(true);
    });

    it("preserves environment variables", () => {
      expect(rules.shouldPreserve("API_KEY")).toBe(true);
      expect(rules.shouldPreserve("NODE_ENV")).toBe(true);
    });

    it("does not preserve regular words", () => {
      expect(rules.shouldPreserve("hello")).toBe(false);
      expect(rules.shouldPreserve("world")).toBe(false);
      expect(rules.shouldPreserve("test")).toBe(false);
    });
  });

  describe("getTechnicalTerms", () => {
    it("returns array of technical terms", () => {
      const terms = rules.getTechnicalTerms();
      expect(Array.isArray(terms)).toBe(true);
      expect(terms.length).toBeGreaterThan(0);
      expect(terms).toContain("API");
      expect(terms).toContain("Docker");
    });
  });

  describe("getAbbreviations", () => {
    it("returns array of abbreviations", () => {
      const abbrs = rules.getAbbreviations();
      expect(Array.isArray(abbrs)).toBe(true);
      expect(abbrs.length).toBeGreaterThan(0);
      expect(abbrs).toContain("FYI");
      expect(abbrs).toContain("PR");
    });
  });

  describe("addTechnicalTerm", () => {
    it("adds a new technical term", () => {
      rules.addTechnicalTerm("MyCustomTool");
      expect(rules.isTechnicalTerm("MyCustomTool")).toBe(true);
    });
  });

  describe("addAbbreviation", () => {
    it("adds a new abbreviation", () => {
      rules.addAbbreviation("custom");
      expect(rules.isAbbreviation("CUSTOM")).toBe(true);
      expect(rules.isAbbreviation("custom")).toBe(true);
    });
  });

  describe("getPreservedTerms", () => {
    it("returns preserved terms from text", () => {
      const text = "Use the API to connect to Docker";
      const preserved = rules.getPreservedTerms(text);
      expect(preserved).toContain("API");
      expect(preserved).toContain("Docker");
    });
  });

  describe("hasTechnicalTerms", () => {
    it("returns true if text has technical terms", () => {
      expect(rules.hasTechnicalTerms("Use the API")).toBe(true);
      expect(rules.hasTechnicalTerms("Connect to Docker")).toBe(true);
    });

    it("returns false if text has no technical terms", () => {
      expect(rules.hasTechnicalTerms("Hello world")).toBe(false);
      expect(rules.hasTechnicalTerms("This is a test")).toBe(false);
    });
  });

  describe("getLanguageRules", () => {
    it("returns rules for supported languages", () => {
      const ptBRRules = rules.getLanguageRules("pt-BR");
      expect(Array.isArray(ptBRRules)).toBe(true);
      expect(ptBRRules.length).toBeGreaterThan(0);
    });

    it("returns empty array for English", () => {
      const enRules = rules.getLanguageRules("en");
      expect(Array.isArray(enRules)).toBe(true);
      expect(enRules.length).toBe(0);
    });
  });

  describe("applyRules", () => {
    it("applies rules to text", () => {
      const text = "Use the API to connect to Docker";
      const result = rules.applyRules(text, "pt-BR");
      expect(result).toContain("API");
      expect(result).toContain("Docker");
    });
  });
});
