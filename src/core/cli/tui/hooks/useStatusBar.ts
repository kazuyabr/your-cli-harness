// src/core/cli/tui/hooks/useStatusBar.ts
// Hook for managing status bar information

import { useState, useCallback } from "react";

import type { StatusBarInfo } from "../types.js";

export function useStatusBar(initialModel = "openrouter/owl-alpha", initialProvider = "openrouter", initialLanguage = "en") {
  const [status, setStatus] = useState<StatusBarInfo>({
    model: initialModel,
    provider: initialProvider,
    tokensIn: 0,
    tokensOut: 0,
    cost: 0,
    mode: "default",
    language: initialLanguage,
  });

  const updateTokens = useCallback((tokensIn: number, tokensOut: number) => {
    setStatus((prev) => ({
      ...prev,
      tokensIn: prev.tokensIn + tokensIn,
      tokensOut: prev.tokensOut + tokensOut,
    }));
  }, []);

  const updateCost = useCallback((cost: number) => {
    setStatus((prev) => ({
      ...prev,
      cost: prev.cost + cost,
    }));
  }, []);

  const setModel = useCallback((model: string, provider: string) => {
    setStatus((prev) => ({
      ...prev,
      model,
      provider,
    }));
  }, []);

  const setMode = useCallback((mode: string) => {
    setStatus((prev) => ({
      ...prev,
      mode,
    }));
  }, []);

  const setLanguage = useCallback((language: string) => {
    setStatus((prev) => ({
      ...prev,
      language,
    }));
  }, []);

  const reset = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      tokensIn: 0,
      tokensOut: 0,
      cost: 0,
    }));
  }, []);

  return {
    status,
    updateTokens,
    updateCost,
    setModel,
    setMode,
    setLanguage,
    reset,
  };
}
