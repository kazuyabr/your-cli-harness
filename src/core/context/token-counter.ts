// src/core/context/token-counter.ts

export interface TokenCount {
  tokens: number;
  characters: number;
  words: number;
}

export interface ModelTokenLimits {
  contextWindow: number;
  maxOutput: number;
}

const MODEL_LIMITS: Record<string, ModelTokenLimits> = {
  "claude-sonnet-4-20250514": { contextWindow: 200_000, maxOutput: 8192 },
  "claude-sonnet-4-20250620": { contextWindow: 200_000, maxOutput: 8192 },
  "claude-opus-4-20250514": { contextWindow: 200_000, maxOutput: 8192 },
  "claude-haiku-4-20250514": { contextWindow: 200_000, maxOutput: 8192 },
  "gpt-4o": { contextWindow: 128_000, maxOutput: 16_384 },
  "gpt-4o-mini": { contextWindow: 128_000, maxOutput: 16_384 },
  "gpt-4-turbo": { contextWindow: 128_000, maxOutput: 4096 },
  "gpt-4": { contextWindow: 8_192, maxOutput: 4096 },
  "gpt-3.5-turbo": { contextWindow: 16_384, maxOutput: 4096 },
};

export class TokenCounter {
  private charsPerToken: number;

  constructor(charsPerToken: number = 4) {
    this.charsPerToken = charsPerToken;
  }

  count(text: string): TokenCount {
    return {
      tokens: Math.ceil(text.length / this.charsPerToken),
      characters: text.length,
      words: text.split(/\s+/).filter(Boolean).length,
    };
  }

  countMessages(messages: Array<{ content: string; role: string }>): number {
    let total = 0;
    for (const msg of messages) {
      total += this.count(msg.content).tokens;
      total += this.count(msg.role).tokens;
    }
    return total;
  }

  static getModelLimits(model: string): ModelTokenLimits {
    return MODEL_LIMITS[model] ?? { contextWindow: 128_000, maxOutput: 4096 };
  }

  static getHeadroomThresholds(model: string): {
    attention: number;
    critical: number;
    emergency: number;
  } {
    const limits = this.getModelLimits(model);
    return {
      attention: Math.floor(limits.contextWindow * 0.6),
      critical: Math.floor(limits.contextWindow * 0.8),
      emergency: Math.floor(limits.contextWindow * 0.95),
    };
  }
}
