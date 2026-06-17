// src/core/llm/factory.ts

import type { LLMConfig } from "../../shared/types.js";
import type { LLMProvider } from "./provider.js";
import { AnthropicProvider } from "./anthropic.js";
import { OpenAIProvider } from "./openai.js";
import { LLMError } from "../../shared/errors.js";

export class LLMFactory {
  static create(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case "anthropic":
        return new AnthropicProvider(config.model, config.apiKey);
      case "openai":
      case "azure":
        return new OpenAIProvider(config.model, config.apiKey, config.baseURL);
      default:
        throw new LLMError(`Unsupported LLM provider: ${config.provider}`);
    }
  }
}
