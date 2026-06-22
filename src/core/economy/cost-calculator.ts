// src/core/economy/cost-calculator.ts

import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface ModelPricing {
  provider: string;
  model: string;
  inputPer1k: number;   // Cost per 1K input tokens (USD)
  outputPer1k: number;  // Cost per 1K output tokens (USD)
}

export interface CostBreakdown {
  input: number;
  output: number;
  total: number;
}

export class CostCalculator {
  // Real provider pricing (updated regularly)
  private pricing: ModelPricing[] = [
    // Anthropic
    { provider: "anthropic", model: "claude-sonnet-4-20250514", inputPer1k: 0.003, outputPer1k: 0.015 },
    { provider: "anthropic", model: "claude-3-5-haiku-20241022", inputPer1k: 0.001, outputPer1k: 0.005 },
    { provider: "anthropic", model: "claude-3-opus-20240229", inputPer1k: 0.015, outputPer1k: 0.075 },
    
    // OpenAI
    { provider: "openai", model: "gpt-4o", inputPer1k: 0.0025, outputPer1k: 0.01 },
    { provider: "openai", model: "gpt-4o-mini", inputPer1k: 0.00015, outputPer1k: 0.0006 },
    { provider: "openai", model: "o1", inputPer1k: 0.015, outputPer1k: 0.06 },
    
    // Google
    { provider: "google", model: "gemini-2.0-flash", inputPer1k: 0.0001, outputPer1k: 0.0004 },
    { provider: "google", model: "gemini-2.0-pro", inputPer1k: 0.00125, outputPer1k: 0.005 },
    
    // xAI
    { provider: "xai", model: "grok-2", inputPer1k: 0.002, outputPer1k: 0.01 },
    
    // OpenRouter (free tier models)
    { provider: "openrouter", model: "openrouter/owl-alpha", inputPer1k: 0.0001, outputPer1k: 0.0001 },
    { provider: "openrouter", model: "meta-llama/llama-3.1-8b-instruct:free", inputPer1k: 0, outputPer1k: 0 },
    
    // Groq
    { provider: "groq", model: "llama-3.1-8b-instant", inputPer1k: 0.00005, outputPer1k: 0.00008 },
    
    // Together
    { provider: "together", model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", inputPer1k: 0.00018, outputPer1k: 0.00018 },
  ];

  calculateCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): CostBreakdown {
    const pricing = this.pricing.find(
      p => p.provider === provider && p.model === model
    );
    
    if (!pricing) {
      // Fallback: estimated cost
      logger.warn(`Pricing not found for ${provider}/${model}, using fallback`);
      const inputCost = (inputTokens * 0.003) / 1000;
      const outputCost = (outputTokens * 0.015) / 1000;
      return {
        input: inputCost,
        output: outputCost,
        total: inputCost + outputCost,
      };
    }
    
    const inputCost = (inputTokens / 1000) * pricing.inputPer1k;
    const outputCost = (outputTokens / 1000) * pricing.outputPer1k;
    
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
    };
  }

  calculateSavings(
    originalTokens: { input: number; output: number },
    compressedTokens: { input: number; output: number },
    provider: string,
    model: string
  ): {
    costBefore: CostBreakdown;
    costAfter: CostBreakdown;
    saved: number;
    percentSaved: number;
  } {
    const costBefore = this.calculateCost(provider, model, originalTokens.input, originalTokens.output);
    const costAfter = this.calculateCost(provider, model, compressedTokens.input, compressedTokens.output);
    
    const saved = costBefore.total - costAfter.total;
    const percentSaved = costBefore.total > 0 ? (saved / costBefore.total) * 100 : 0;
    
    return {
      costBefore,
      costAfter,
      saved,
      percentSaved,
    };
  }

  getPricing(provider: string, model: string): ModelPricing | undefined {
    return this.pricing.find(p => p.provider === provider && p.model === model);
  }

  addPricing(pricing: ModelPricing): void {
    const existing = this.pricing.findIndex(
      p => p.provider === pricing.provider && p.model === pricing.model
    );
    
    if (existing >= 0) {
      this.pricing[existing] = pricing;
    } else {
      this.pricing.push(pricing);
    }
  }
}
