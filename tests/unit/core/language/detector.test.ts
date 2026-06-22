// tests/unit/core/language/detector.test.ts

import { describe, it, expect } from "vitest";
import { LanguageDetector } from "../../../../src/core/language/detector.js";

describe("LanguageDetector", () => {
  const detector = new LanguageDetector();

  describe("detect", () => {
    it("detects pt-BR by special characters", () => {
      expect(detector.detect("Não sei o que fazer")).toBe("pt-BR");
      expect(detector.detect("Coração")).toBe("pt-BR");
      expect(detector.detect("informação")).toBe("pt-BR");
    });

    it("detects pt-BR by unique words", () => {
      expect(detector.detect("você não")).toBe("pt-BR");
      expect(detector.detect("obrigado pela ajuda")).toBe("pt-BR");
      expect(detector.detect("preciso de ajuda")).toBe("pt-BR");
    });

    it("detects en by common words", () => {
      expect(detector.detect("Hello, how are you?")).toBe("en");
      expect(detector.detect("Thank you for your help")).toBe("en");
      expect(detector.detect("I need help with this")).toBe("en");
    });

    it("detects es by special characters", () => {
      expect(detector.detect("¿Cómo estás?")).toBe("es");
      expect(detector.detect("¡Hola! ¿Qué tal?")).toBe("es");
      expect(detector.detect("Señor")).toBe("es");
    });

    it("detects es by unique words", () => {
      expect(detector.detect("Hola, gracias por tu ayuda")).toBe("es");
      expect(detector.detect("Buenos días")).toBe("es");
    });

    it("detects fr by special characters", () => {
      expect(detector.detect("C'est très bien")).toBe("fr");
      expect(detector.detect("Je suis très content")).toBe("fr");
    });

    it("detects fr by unique words", () => {
      expect(detector.detect("Bonjour, merci beaucoup")).toBe("fr");
      expect(detector.detect("Je besoin d'aide")).toBe("fr");
    });

    it("detects de by special characters", () => {
      expect(detector.detect("Guten Tag")).toBe("de");
      expect(detector.detect("Ich möchte")).toBe("de");
    });

    it("detects de by unique words", () => {
      expect(detector.detect("Danke für Ihre Hilfe")).toBe("de");
      expect(detector.detect("Ich brauche Hilfe")).toBe("de");
    });

    it("detects it by unique words", () => {
      expect(detector.detect("Buongiorno, grazie")).toBe("it");
      expect(detector.detect("Ho bisogno di aiuto")).toBe("it");
    });

    it("detects ja by characters", () => {
      expect(detector.detect("こんにちは")).toBe("ja");
      expect(detector.detect("ありがとうございます")).toBe("ja");
    });

    it("detects zh by characters", () => {
      expect(detector.detect("你好吗")).toBe("zh");
      expect(detector.detect("谢谢帮助")).toBe("zh");
    });

    it("detects ko by characters", () => {
      expect(detector.detect("안녕하세요")).toBe("ko");
      expect(detector.detect("감사합니다")).toBe("ko");
    });

    it("defaults to en for unknown input", () => {
      expect(detector.detect("12345")).toBe("en");
      expect(detector.detect("")).toBe("en");
    });
  });

  describe("detectWithConfidence", () => {
    it("returns detection result with confidence", () => {
      const result = detector.detectWithConfidence("Hello, how are you?");
      expect(result.language).toBe("en");
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.method).toBe("heuristic");
    });
  });

  describe("getLanguageName", () => {
    it("returns correct language names", () => {
      expect(detector.getLanguageName("pt-BR")).toBe("Português (Brasil)");
      expect(detector.getLanguageName("en")).toBe("English");
      expect(detector.getLanguageName("es")).toBe("Español");
      expect(detector.getLanguageName("fr")).toBe("Français");
      expect(detector.getLanguageName("de")).toBe("Deutsch");
      expect(detector.getLanguageName("it")).toBe("Italiano");
      expect(detector.getLanguageName("ja")).toBe("日本語");
      expect(detector.getLanguageName("zh")).toBe("中文");
      expect(detector.getLanguageName("ko")).toBe("한국어");
    });
  });

  describe("getLanguageFlag", () => {
    it("returns correct language flags", () => {
      expect(detector.getLanguageFlag("pt-BR")).toBe("🇧🇷");
      expect(detector.getLanguageFlag("en")).toBe("🇺🇸");
      expect(detector.getLanguageFlag("es")).toBe("🇪🇸");
      expect(detector.getLanguageFlag("fr")).toBe("🇫🇷");
      expect(detector.getLanguageFlag("de")).toBe("🇩🇪");
      expect(detector.getLanguageFlag("it")).toBe("🇮🇹");
      expect(detector.getLanguageFlag("ja")).toBe("🇯🇵");
      expect(detector.getLanguageFlag("zh")).toBe("🇨🇳");
      expect(detector.getLanguageFlag("ko")).toBe("🇰🇷");
    });
  });

  describe("isSupported", () => {
    it("returns true for supported languages", () => {
      expect(detector.isSupported("pt-BR")).toBe(true);
      expect(detector.isSupported("en")).toBe(true);
      expect(detector.isSupported("es")).toBe(true);
    });

    it("returns false for unsupported languages", () => {
      expect(detector.isSupported("ru")).toBe(false);
      expect(detector.isSupported("ar")).toBe(false);
    });
  });

  describe("getSupportedLanguages", () => {
    it("returns all supported languages", () => {
      const languages = detector.getSupportedLanguages();
      expect(languages).toContain("pt-BR");
      expect(languages).toContain("en");
      expect(languages).toContain("es");
      expect(languages.length).toBe(10);
    });
  });
});
