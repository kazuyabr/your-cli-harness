// src/core/language/index.ts

export { LanguageDetector } from "./detector.js";
export type { SupportedLanguage, DetectionResult } from "./detector.js";

export { LanguagePersistence } from "./persistence.js";
export type { LanguagePreference } from "./persistence.js";

export { Translator } from "./translations.js";
export type { Translations } from "./translations.js";

export { LanguageRules } from "./rules.js";
export type { LanguageRule } from "./rules.js";
