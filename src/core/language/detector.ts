// src/core/language/detector.ts

export type SupportedLanguage = "pt-BR" | "pt-PT" | "en" | "es" | "fr" | "de" | "it" | "ja" | "zh" | "ko";

export interface DetectionResult {
  language: SupportedLanguage;
  confidence: number;
  method: "os" | "terminal" | "config" | "heuristic" | "fallback";
}

export class LanguageDetector {
  private supportedLanguages: SupportedLanguage[] = [
    "pt-BR", "pt-PT", "en", "es", "fr", "de", "it", "ja", "zh", "ko"
  ];

  detect(input: string): SupportedLanguage {
    // Check for Japanese-specific characters first (Hiragana, Katakana)
    if (/[\u3040-\u309F\u30A0-\u30FF]/i.test(input)) {
      return "ja";
    }

    // Check for Korean characters
    if (/[\uAC00-\uD7AF]/i.test(input)) {
      return "ko";
    }

    // Check for Chinese characters (without Japanese-specific ones)
    if (/[\u4E00-\u9FFF]/i.test(input) && !/[\u3040-\u309F\u30A0-\u30FF]/i.test(input)) {
      return "zh";
    }

    // Use scoring system for Latin-based languages
    const scores: Record<SupportedLanguage, number> = {
      "pt-BR": 0,
      "pt-PT": 0,
      "en": 0,
      "es": 0,
      "fr": 0,
      "de": 0,
      "it": 0,
      "ja": 0,
      "zh": 0,
      "ko": 0,
    };

    // Portuguese-specific characters (highest priority)
    if (/[ãõç]/i.test(input)) {
      scores["pt-BR"] += 10;
      scores["pt-PT"] += 10;
    }

    // Spanish-specific characters
    if (/[ñ¿¡]/i.test(input)) {
      scores["es"] += 10;
    }

    // French-specific characters
    if (/[àâæéèêëîïôœùûüÿ]/i.test(input)) {
      scores["fr"] += 10;
    }

    // German-specific characters
    if (/[äöüß]/i.test(input)) {
      scores["de"] += 10;
    }

    // Portuguese words (high priority)
    const ptBRWords = /\b(você|não|obrigado|bom dia|preciso|fazer|onde|quando|porque|também)\b/gi;
    const ptBRMatches = input.match(ptBRWords);
    if (ptBRMatches) {
      scores["pt-BR"] += ptBRMatches.length * 5;
      scores["pt-PT"] += ptBRMatches.length * 3;
    }

    // Spanish words
    const esWords = /\b(hola|gracias|buenos|días|necesito|cómo|usted|también|por favor)\b/gi;
    const esMatches = input.match(esWords);
    if (esMatches) {
      scores["es"] += esMatches.length * 5;
    }

    // French words (more specific to avoid conflicts)
    const frWords = /\b(bonjour|merci|besoin|êtes|aussi|s'il vous plaît)\b/gi;
    const frMatches = input.match(frWords);
    if (frMatches) {
      scores["fr"] += frMatches.length * 5;
    }

    // German words
    const deWords = /\b(guten|tag|wie|geht|brauche|hilfe|danke|bitte|nicht|auch)\b/gi;
    const deMatches = input.match(deWords);
    if (deMatches) {
      scores["de"] += deMatches.length * 5;
    }

    // Italian words
    const itWords = /\b(buongiorno|grazie|come|stai|bisogno|anche|per favore|aiuto)\b/gi;
    const itMatches = input.match(itWords);
    if (itMatches) {
      scores["it"] += itMatches.length * 5;
    }

    // English words (lowest priority - many words overlap with other languages)
    const enWords = /\b(hello|thank|please|help|need|want|the|is|and|or|but)\b/gi;
    const enMatches = input.match(enWords);
    if (enMatches) {
      scores["en"] += enMatches.length * 2;
    }

    // Find language with highest score
    let maxScore = 0;
    let detectedLang: SupportedLanguage = "en";

    for (const lang of this.supportedLanguages) {
      if (scores[lang] > maxScore) {
        maxScore = scores[lang];
        detectedLang = lang;
      }
    }

    return detectedLang;
  }

  detectWithConfidence(input: string): DetectionResult {
    const detected = this.detect(input);

    // Calculate confidence based on how many patterns matched
    const scores: Record<SupportedLanguage, number> = {
      "pt-BR": 0,
      "pt-PT": 0,
      "en": 0,
      "es": 0,
      "fr": 0,
      "de": 0,
      "it": 0,
      "ja": 0,
      "zh": 0,
      "ko": 0,
    };

    // Portuguese-specific characters
    if (/[ãõç]/i.test(input)) {
      scores["pt-BR"] += 10;
      scores["pt-PT"] += 10;
    }

    // Spanish-specific characters
    if (/[ñ¿¡]/i.test(input)) {
      scores["es"] += 10;
    }

    // French-specific characters
    if (/[àâæéèêëîïôœùûüÿ]/i.test(input)) {
      scores["fr"] += 10;
    }

    // German-specific characters
    if (/[äöüß]/i.test(input)) {
      scores["de"] += 10;
    }

    // Count word matches
    const ptBRWords = /\b(você|está|não|obrigado|bom dia|preciso|ajuda|fazer|como|onde|quando|por que|porque|também)\b/gi;
    const esWords = /\b(hola|gracias|buenos|días|necesito|estás|cómo|usted|también|por favor|ayuda)\b/gi;
    const frWords = /\b(bonjour|merci|besoin|comment|êtes|aussi|s'il vous plaît|aide)\b/gi;
    const deWords = /\b(guten|tag|wie|geht|brauche|hilfe|danke|bitte|nicht|auch)\b/gi;
    const itWords = /\b(buongiorno|grazie|come|stai|bisogno|anche|per favore|aiuto)\b/gi;
    const enWords = /\b(hello|thank|please|help|how|are|you|need|want|the|is|and|or|but)\b/gi;

    const ptBRMatches = input.match(ptBRWords);
    const esMatches = input.match(esWords);
    const frMatches = input.match(frWords);
    const deMatches = input.match(deWords);
    const itMatches = input.match(itWords);
    const enMatches = input.match(enWords);

    if (ptBRMatches) scores["pt-BR"] += ptBRMatches.length * 3;
    if (ptBRMatches) scores["pt-PT"] += ptBRMatches.length * 2;
    if (esMatches) scores["es"] += esMatches.length * 3;
    if (frMatches) scores["fr"] += frMatches.length * 3;
    if (deMatches) scores["de"] += deMatches.length * 3;
    if (itMatches) scores["it"] += itMatches.length * 3;
    if (enMatches) scores["en"] += enMatches.length * 1;

    const maxScore = Math.max(...Object.values(scores));
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 ? maxScore / totalScore : 0;

    return {
      language: detected,
      confidence,
      method: "heuristic",
    };
  }

  getLanguageName(lang: SupportedLanguage): string {
    const names: Record<SupportedLanguage, string> = {
      "pt-BR": "Português (Brasil)",
      "pt-PT": "Português (Portugal)",
      "en": "English",
      "es": "Español",
      "fr": "Français",
      "de": "Deutsch",
      "it": "Italiano",
      "ja": "日本語",
      "zh": "中文",
      "ko": "한국어",
    };
    return names[lang] || lang;
  }

  getLanguageFlag(lang: SupportedLanguage): string {
    const flags: Record<SupportedLanguage, string> = {
      "pt-BR": "🇧🇷",
      "pt-PT": "🇵🇹",
      "en": "🇺🇸",
      "es": "🇪🇸",
      "fr": "🇫🇷",
      "de": "🇩🇪",
      "it": "🇮🇹",
      "ja": "🇯🇵",
      "zh": "🇨🇳",
      "ko": "🇰🇷",
    };
    return flags[lang] || "🌐";
  }

  isSupported(lang: string): lang is SupportedLanguage {
    return this.supportedLanguages.includes(lang as SupportedLanguage);
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return [...this.supportedLanguages];
  }
}
