// src/core/memory/vector/manager.ts
// Vector memory manager: integrates vector store with session context

import type { VectorStore, Embedder, VectorStoreConfig } from "./types.js";
import type { IndexerConfig } from "./types.js";
import { QdrantAdapter } from "./qdrant.js";
import { PineconeAdapter } from "./pinecone.js";
import { DocumentIndexer, type IndexerResult } from "./indexer.js";
import { MCPError } from "../../../shared/errors.js";
import { createLogger } from "../../../shared/logger.js";

const logger = createLogger();

export interface VectorMemoryConfig {
  vector: VectorStoreConfig;
  indexer: IndexerConfig;
  embedder: {
    provider: "openai" | "null";
    apiKey?: string;
    baseURL?: string;
    model?: string;
    dimensions?: number;
  };
}

export interface SearchResult {
  content: string;
  score: number;
  source: string;
}

export class VectorMemoryManager {
  private store: VectorStore;
  private embedder: Embedder;
  private indexerConfig: IndexerConfig;
  private connected = false;

  constructor(config: VectorMemoryConfig) {
    this.store = this.createStore(config.vector);
    this.embedder = this.createEmbedder(config.embedder);
    this.indexerConfig = config.indexer;
  }

  async connect(): Promise<void> {
    await this.store.connect();
    this.connected = true;
    logger.info("Vector memory connected");
  }

  async disconnect(): Promise<void> {
    await this.store.disconnect();
    this.connected = false;
  }

  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    this.ensureConnected();

    const embedding = await this.embedder.embed(query);
    const results = await this.store.search(embedding, topK);

    return results.map((r) => ({
      content: r.document.content,
      score: r.score,
      source: (r.document.metadata.source as string) ?? "unknown",
    }));
  }

  async indexDocuments(): Promise<IndexerResult> {
    this.ensureConnected();

    const indexer = new DocumentIndexer(this.store, this.embedder, this.indexerConfig);
    return indexer.indexAll();
  }

  async getIndexStats(): Promise<{ count: number }> {
    this.ensureConnected();
    const count = await this.store.count();
    return { count };
  }

  isReady(): boolean {
    return this.connected;
  }

  private createStore(config: VectorStoreConfig): VectorStore {
    switch (config.provider) {
      case "qdrant":
        if (!config.qdrant) throw new MCPError("Qdrant config required");
        return new QdrantAdapter(config.qdrant);
      case "pinecone":
        if (!config.pinecone) throw new MCPError("Pinecone config required");
        return new PineconeAdapter(config.pinecone);
      case "none":
        throw new MCPError("No vector provider configured");
      default:
        throw new MCPError(`Unknown vector provider: ${config.provider}`);
    }
  }

  private createEmbedder(config: VectorMemoryConfig["embedder"]): Embedder {
    if (config.provider === "openai" && config.apiKey) {
      const { OpenAIEmbedder } = require("./embedder.js");
      return new OpenAIEmbedder({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        model: config.model,
        dimensions: config.dimensions,
      });
    }
    const { NullEmbedder } = require("./embedder.js");
    return new NullEmbedder(config.dimensions ?? 1536);
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new MCPError("Vector memory not connected");
    }
  }
}
