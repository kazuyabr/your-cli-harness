// tests/unit/core/language/translations.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { Translator } from "../../../../src/core/language/translations.js";

describe("Translator", () => {
  let translator: Translator;

  beforeEach(() => {
    translator = new Translator("en");
  });

  describe("constructor", () => {
    it("creates translator with default language (en)", () => {
      const t = new Translator();
      expect(t.getLanguage()).toBe("en");
    });

    it("creates translator with specified language", () => {
      const t = new Translator("pt-BR");
      expect(t.getLanguage()).toBe("pt-BR");
    });
  });

  describe("setLanguage", () => {
    it("changes the language", () => {
      translator.setLanguage("pt-BR");
      expect(translator.getLanguage()).toBe("pt-BR");
    });
  });

  describe("get", () => {
    it("returns translation for simple key", () => {
      expect(translator.get("common.yes")).toBe("Yes");
      expect(translator.get("common.no")).toBe("No");
    });

    it("returns translation for nested key", () => {
      expect(translator.get("prompts.publish")).toBe("Publish to npm for NPX access?");
      expect(translator.get("prompts.access")).toBe("Package access:");
    });

    it("returns translation for economy keys", () => {
      expect(translator.get("economy.title")).toBe("📊 Token Economy");
      expect(translator.get("economy.input")).toBe("Input:");
      expect(translator.get("economy.output")).toBe("Output:");
    });

    it("returns translation for command keys", () => {
      expect(translator.get("commands.help")).toBe("Help");
      expect(translator.get("commands.connect")).toBe("Connect");
      expect(translator.get("commands.model")).toBe("Model");
    });

    it("returns translation for error keys", () => {
      expect(translator.get("errors.apiKeyNotFound")).toBe("API key not found");
      expect(translator.get("errors.invalidConfig")).toBe("Invalid configuration");
    });

    it("returns key if translation not found", () => {
      expect(translator.get("nonexistent.key")).toBe("nonexistent.key");
    });

    it("returns key if intermediate key not found", () => {
      expect(translator.get("nonexistent.nested.key")).toBe("nonexistent.nested.key");
    });

    it("works with pt-BR translations", () => {
      translator.setLanguage("pt-BR");
      expect(translator.get("common.yes")).toBe("Sim");
      expect(translator.get("common.no")).toBe("Não");
      expect(translator.get("prompts.publish")).toBe("Publicar no npm para acesso via NPX?");
      expect(translator.get("economy.title")).toBe("📊 Economia de Tokens");
    });

    it("works with es translations", () => {
      translator.setLanguage("es");
      expect(translator.get("common.yes")).toBe("Sí");
      expect(translator.get("common.no")).toBe("No");
      expect(translator.get("prompts.publish")).toBe("¿Publicar en npm para acceso via NPX?");
      expect(translator.get("economy.title")).toBe("📊 Economía de Tokens");
    });

    it("works with fr translations", () => {
      translator.setLanguage("fr");
      expect(translator.get("common.yes")).toBe("Oui");
      expect(translator.get("common.no")).toBe("Non");
      expect(translator.get("prompts.publish")).toBe("Publier sur npm pour l'accès NPX?");
      expect(translator.get("economy.title")).toBe("📊 Économie de Tokens");
    });

    it("works with de translations", () => {
      translator.setLanguage("de");
      expect(translator.get("common.yes")).toBe("Ja");
      expect(translator.get("common.no")).toBe("Nein");
      expect(translator.get("prompts.publish")).toBe("Auf npm für NPX-Zugang veröffentlichen?");
      expect(translator.get("economy.title")).toBe("📊 Token-Einsparung");
    });

    it("works with it translations", () => {
      translator.setLanguage("it");
      expect(translator.get("common.yes")).toBe("Sì");
      expect(translator.get("common.no")).toBe("No");
      expect(translator.get("prompts.publish")).toBe("Pubblicare su npm per l'accesso NPX?");
      expect(translator.get("economy.title")).toBe("📊 Risparmio di Token");
    });

    it("works with ja translations", () => {
      translator.setLanguage("ja");
      expect(translator.get("common.yes")).toBe("はい");
      expect(translator.get("common.no")).toBe("いいえ");
      expect(translator.get("prompts.publish")).toBe("NPXアクセスのためにnpmに公開しますか？");
      expect(translator.get("economy.title")).toBe("📊 トークン節約");
    });

    it("works with zh translations", () => {
      translator.setLanguage("zh");
      expect(translator.get("common.yes")).toBe("是");
      expect(translator.get("common.no")).toBe("否");
      expect(translator.get("prompts.publish")).toBe("发布到npm以通过NPX访问？");
      expect(translator.get("economy.title")).toBe("📊 令牌节省");
    });

    it("works with ko translations", () => {
      translator.setLanguage("ko");
      expect(translator.get("common.yes")).toBe("예");
      expect(translator.get("common.no")).toBe("아니오");
      expect(translator.get("prompts.publish")).toBe("NPX 접근을 위해 npm에 게시하시겠습니까?");
      expect(translator.get("economy.title")).toBe("📊 토큰 절약");
    });
  });

  describe("getSupportedLanguages", () => {
    it("returns all supported languages", () => {
      const languages = translator.getSupportedLanguages();
      expect(languages).toContain("pt-BR");
      expect(languages).toContain("pt-PT");
      expect(languages).toContain("en");
      expect(languages).toContain("es");
      expect(languages).toContain("fr");
      expect(languages).toContain("de");
      expect(languages).toContain("it");
      expect(languages).toContain("ja");
      expect(languages).toContain("zh");
      expect(languages).toContain("ko");
      expect(languages.length).toBe(10);
    });
  });

  describe("hasTranslation", () => {
    it("returns true for existing translations", () => {
      expect(translator.hasTranslation("common.yes")).toBe(true);
      expect(translator.hasTranslation("prompts.publish")).toBe(true);
    });

    it("returns false for non-existing translations", () => {
      expect(translator.hasTranslation("nonexistent.key")).toBe(false);
      expect(translator.hasTranslation("common.nonexistent")).toBe(false);
    });
  });
});
