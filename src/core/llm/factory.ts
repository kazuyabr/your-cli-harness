// src/core/llm/factory.ts

import type { LLMConfig } from "./provider.js";
import type { LLMProvider } from "./provider.js";
import { AISDKProvider } from "./ai-sdk.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export class LLMFactory {
  static create(config: LLMConfig): LLMProvider {
    const provider = config.provider;

    logger.info(`Creating LLM provider: ${provider}/${config.model}`);

    // Use AI SDK for all providers
    return new AISDKProvider(config);
  }

  static validateConfig(config: LLMConfig): string[] {
    const errors: string[] = [];

    if (!config.model) {
      errors.push("Model is required");
    }

    // Check API key based on provider
    const providerEnvKeys: Record<string, string> = {
      anthropic: "ANTHROPIC_API_KEY",
      openai: "OPENAI_API_KEY",
      openrouter: "OPENROUTER_API_KEY",
      groq: "GROQ_API_KEY",
      together: "TOGETHER_API_KEY",
      google: "GOOGLE_API_KEY",
      xai: "XAI_API_KEY",
      lmstudio: "", // No key needed
      ollama: "", // No key needed
    };

    const envKey = providerEnvKeys[config.provider];
    if (envKey && !config.apiKey && !process.env[envKey]) {
      errors.push(`API key for ${config.provider} not found (set ${envKey} env var)`);
    }

    if (config.maxTokens < 1 || config.maxTokens > 200_000) {
      errors.push("maxTokens must be between 1 and 200000");
    }

    if (config.temperature < 0 || config.temperature > 2) {
      errors.push("temperature must be between 0 and 2");
    }

    return errors;
  }
}
