// src/core/memory/vector/qdrant.ts
// Qdrant vector store adapter

import type { VectorStore, VectorDocument, VectorSearchResult } from "./types.js";
import { MCPError } from "../../../shared/errors.js";
import { createLogger } from "../../../shared/logger.js";

const logger = createLogger();

export interface QdrantConfig {
  url: string;
  apiKey?: string;
  collection: string;
}

export class QdrantAdapter implements VectorStore {
  private config: QdrantConfig;
  private connected = false;

  constructor(config: QdrantConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.config.url}/collections/${this.config.collection}`, {
        method: "GET",
        headers: this.headers(),
        signal: AbortSignal.timeout(10_000),
      });

      if (response.status === 404) {
        await this.createCollection();
      } else if (!response.ok) {
        throw new MCPError(`Qdrant connect failed: ${response.status} ${response.statusText}`);
      }

      this.connected = true;
      logger.info(`Connected to Qdrant: ${this.config.collection}`);
    } catch (err) {
      if (err instanceof MCPError) throw err;
      throw new MCPError(`Failed to connect to Qdrant: ${err}`, err as Error);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async upsert(documents: VectorDocument[]): Promise<void> {
    this.ensureConnected();

    const points = documents.map((doc) => ({
      id: doc.id,
      vector: doc.embedding ?? [],
      payload: {
        content: doc.content,
        ...doc.metadata,
      },
    }));

    const response = await fetch(`${this.config.url}/collections/${this.config.collection}/points/upsert`, {
      method: "PUT",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new MCPError(`Qdrant upsert failed: ${response.status} ${response.statusText}`);
    }

    logger.info(`Upserted ${documents.length} documents to Qdrant`);
  }

  async search(
    embedding: number[],
    topK: number,
    filter?: Record<string, unknown>
  ): Promise<VectorSearchResult[]> {
    this.ensureConnected();

    const body: Record<string, unknown> = {
      vector: embedding,
      limit: topK,
      with_payload: true,
    };

    if (filter && Object.keys(filter).length > 0) {
      body.filter = {
        must: Object.entries(filter).map(([key, value]) => ({
          key,
          match: { value },
        })),
      };
    }

    const response = await fetch(`${this.config.url}/collections/${this.config.collection}/points/search`, {
      method: "POST",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new MCPError(`Qdrant search failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { result: Array<{ id: string; score: number; payload?: Record<string, unknown> }> };

    return data.result.map((item) => ({
      document: {
        id: item.id,
        content: (item.payload?.content as string) ?? "",
        metadata: item.payload ?? {},
      },
      score: item.score,
    }));
  }

  async delete(ids: string[]): Promise<void> {
    this.ensureConnected();

    const response = await fetch(`${this.config.url}/collections/${this.config.collection}/points/delete`, {
      method: "POST",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ points: ids }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new MCPError(`Qdrant delete failed: ${response.status} ${response.statusText}`);
    }

    logger.info(`Deleted ${ids.length} points from Qdrant`);
  }

  async count(): Promise<number> {
    this.ensureConnected();

    const response = await fetch(`${this.config.url}/collections/${this.config.collection}/points/count`, {
      method: "POST",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new MCPError(`Qdrant count failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { result: { count: number } };
    return data.result.count;
  }

  private async createCollection(): Promise<void> {
    const response = await fetch(`${this.config.url}/collections/${this.config.collection}`, {
      method: "PUT",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        vectors: {
          size: 1536,
          distance: "Cosine",
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new MCPError(`Qdrant create collection failed: ${response.status} ${response.statusText}`);
    }

    logger.info(`Created Qdrant collection: ${this.config.collection}`);
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {};
    if (this.config.apiKey) {
      h["api-key"] = this.config.apiKey;
    }
    return h;
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new MCPError("Qdrant not connected");
    }
  }
}
