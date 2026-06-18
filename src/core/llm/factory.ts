// src/core/llm/factory.ts

import type { LLMConfig, AzureConfig } from "./provider.js";
import type { LLMProvider } from "./provider.js";
import { AnthropicProvider } from "./anthropic.js";
import { OpenAIProvider } from "./openai.js";
import { AzureOpenAIProvider } from "./azure.js";
import { LLMError } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export class LLMFactory {
  static create(config: LLMConfig): LLMProvider {
    const provider = config.provider;

    logger.info(`Creating LLM provider: ${provider}/${config.model}`);

    switch (provider) {
      case "anthropic":
        return new AnthropicProvider(config);

      case "openai":
        return new OpenAIProvider(config);

      case "azure": {
        const azureConfig: AzureConfig = {
          ...config,
          provider: "azure",
          resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME ?? "",
          deploymentName: config.model,
          apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21",
        };
        return new AzureOpenAIProvider(azureConfig);
      }

      default:
        throw new LLMError(`Unsupported LLM provider: ${provider}`);
    }
  }

  static validateConfig(config: LLMConfig): string[] {
    const errors: string[] = [];

    if (!config.model) {
      errors.push("Model is required");
    }

    if (!config.apiKey && !process.env[`${config.provider.toUpperCase()}_API_KEY`]) {
      errors.push(`API key for ${config.provider} not found (set ${config.provider.toUpperCase()}_API_KEY env var)`);
    }

    if (config.provider === "azure") {
      if (!process.env.AZURE_OPENAI_RESOURCE_NAME) {
        errors.push("AZURE_OPENAI_RESOURCE_NAME env var is required for Azure provider");
      }
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
