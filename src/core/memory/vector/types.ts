// src/core/memory/vector/types.ts
// Vector memory types

import type { IndexerConfig, IndexerSource } from "../../../shared/types.js";

export type { IndexerConfig, IndexerSource };

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export interface VectorSearchResult {
  document: VectorDocument;
  score: number;
}

export interface VectorStoreConfig {
  provider: "qdrant" | "pinecone" | "none";
  qdrant?: {
    url: string;
    apiKey?: string;
    collection: string;
  };
  pinecone?: {
    apiKey: string;
    environment: string;
    index: string;
  };
}

export interface VectorStore {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  upsert(documents: VectorDocument[]): Promise<void>;
  search(embedding: number[], topK: number, filter?: Record<string, unknown>): Promise<VectorSearchResult[]>;
  delete(ids: string[]): Promise<void>;
  count(): Promise<number>;
}

export interface Embedder {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  dimensions(): number;
}
