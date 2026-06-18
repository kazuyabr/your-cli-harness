// src/core/memory/vector/embedder.ts
// Text embedder using OpenAI-compatible API

import type { Embedder } from "./types.js";
import { MCPError } from "../../../shared/errors.js";
import { createLogger } from "../../../shared/logger.js";

const logger = createLogger();

export interface OpenAIEmbedderConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  dimensions?: number;
}

export class OpenAIEmbedder implements Embedder {
  private config: OpenAIEmbedderConfig;
  private dims: number;

  constructor(config: OpenAIEmbedderConfig) {
    this.config = {
      model: "text-embedding-3-small",
      dimensions: 1536,
      ...config,
    };
    this.dims = this.config.dimensions!;
  }

  async embed(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    const first = results[0];
    if (!first) throw new Error("No embedding returned");
    return first;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const baseURL = this.config.baseURL ?? "https://api.openai.com/v1";

    const response = await fetch(`${baseURL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: this.config.model,
        dimensions: this.dims,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new MCPError(`Embedding failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };

    logger.info(`Embedded ${texts.length} texts (${this.dims} dims)`);
    return data.data.map((item) => item.embedding);
  }

  dimensions(): number {
    return this.dims;
  }
}

// ─── Null Embedder (for testing/offline) ───────────────────────────

export class NullEmbedder implements Embedder {
  private dims: number;

  constructor(dimensions: number = 1536) {
    this.dims = dimensions;
  }

  async embed(text: string): Promise<number[]> {
    return this.generateDeterministic(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.generateDeterministic(t));
  }

  dimensions(): number {
    return this.dims;
  }

  private generateDeterministic(text: string): number[] {
    // Deterministic pseudo-embedding based on text hash
    const hash = this.simpleHash(text);
    const vec = new Array(this.dims);
    for (let i = 0; i < this.dims; i++) {
      vec[i] = Math.sin(hash + i) * 0.5 + 0.5;
    }
    return vec;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return hash;
  }
}

// ─── Factory ───────────────────────────────────────────────────────

export function createEmbedder(
  provider: "openai" | "null",
  config?: OpenAIEmbedderConfig
): Embedder {
  if (provider === "openai" && config) {
    return new OpenAIEmbedder(config);
  }
  return new NullEmbedder();
}
