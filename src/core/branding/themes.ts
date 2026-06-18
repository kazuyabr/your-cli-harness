// src/core/branding/themes.ts

import type { BrandingColors } from "../../shared/types.js";

export interface ThemePreset {
  colors: BrandingColors;
  voiceTone: "formal" | "friendly" | "concise";
  greeting: string;
  farewell: string;
  errorPrefix: string;
  successPrefix: string;
}

export interface ThemePresets {
  professional: ThemePreset;
  casual: ThemePreset;
  technical: ThemePreset;
}

export const THEME_PRESETS: ThemePresets = {
  professional: {
    colors: {
      primary: "#3B82F6",
      secondary: "#6B7280",
      accent: "#8B5CF6",
      error: "#EF4444",
      warning: "#F59E0B",
      success: "#10B981",
    },
    voiceTone: "formal",
    greeting: "How can I help you today?",
    farewell: "Task completed. Let me know if you need anything else.",
    errorPrefix: "Error:",
    successPrefix: "Done:",
  },
  casual: {
    colors: {
      primary: "#F97316",
      secondary: "#06B6D4",
      accent: "#EC4899",
      error: "#EF4444",
      warning: "#FBBF24",
      success: "#22C55E",
    },
    voiceTone: "friendly",
    greeting: "Hey! What are we working on?",
    farewell: "All done! Need anything else?",
    errorPrefix: "Oops:",
    successPrefix: "Nice:",
  },
  technical: {
    colors: {
      primary: "#22C55E",
      secondary: "#A3A3A3",
      accent: "#06B6D4",
      error: "#EF4444",
      warning: "#EAB308",
      success: "#10B981",
    },
    voiceTone: "concise",
    greeting: "Ready.",
    farewell: "Complete.",
    errorPrefix: "ERR:",
    successPrefix: "OK:",
  },
};

export function getThemePreset(theme: string): ThemePreset {
  if (theme in THEME_PRESETS) {
    return THEME_PRESETS[theme as keyof ThemePresets];
  }
  return THEME_PRESETS.professional;
}
