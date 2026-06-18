// src/core/memory/vector/indexer.ts
// Document indexer: reads sources, chunks, embeds, and stores

import { readFileSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

import type { VectorStore, Embedder, IndexerSource, IndexerConfig } from "./types.js";
import type { VectorDocument } from "./types.js";
import { DocumentChunker, type Chunk } from "./chunker.js";
import { createLogger } from "../../../shared/logger.js";

const logger = createLogger();

export interface IndexerResult {
  documentsProcessed: number;
  chunksCreated: number;
  documentsStored: number;
  errors: string[];
}

export class DocumentIndexer {
  private store: VectorStore;
  private embedder: Embedder;
  private chunker: DocumentChunker;
  private config: IndexerConfig;

  constructor(store: VectorStore, embedder: Embedder, config: IndexerConfig) {
    this.store = store;
    this.embedder = embedder;
    this.chunker = new DocumentChunker({
      chunkSize: config.chunkSize,
      overlap: config.overlap,
    });
    this.config = config;
  }

  async indexAll(): Promise<IndexerResult> {
    const result: IndexerResult = {
      documentsProcessed: 0,
      chunksCreated: 0,
      documentsStored: 0,
      errors: [],
    };

    for (const source of this.config.sources) {
      try {
        const sourceResult = await this.indexSource(source);
        result.documentsProcessed += sourceResult.documentsProcessed;
        result.chunksCreated += sourceResult.chunksCreated;
        result.documentsStored += sourceResult.documentsStored;
      } catch (err) {
        const msg = `Failed to index source ${source.type}: ${err}`;
        logger.error(msg);
        result.errors.push(msg);
      }
    }

    logger.info(
      `Indexing complete: ${result.documentsProcessed} docs, ${result.chunksCreated} chunks, ${result.documentsStored} stored`
    );
    return result;
  }

  async indexSource(source: IndexerSource): Promise<IndexerResult> {
    const result: IndexerResult = {
      documentsProcessed: 0,
      chunksCreated: 0,
      documentsStored: 0,
      errors: [],
    };

    let documents: Array<{ id: string; content: string; source: string }> = [];

    switch (source.type) {
      case "local":
        documents = this.readLocalFiles(source);
        break;
      case "web":
        documents = await this.fetchWebPages(source);
        break;
      case "confluence":
        // Confluence requires MCP - skip for now
        result.errors.push("Confluence indexing requires MCP server");
        return result;
    }

    result.documentsProcessed = documents.length;

    // Chunk documents
    const chunks = this.chunker.chunkMultiple(documents);
    result.chunksCreated = chunks.length;

    if (chunks.length === 0) return result;

    // Embed and store
    const vectorDocs = await this.embedChunks(chunks);
    await this.store.upsert(vectorDocs);
    result.documentsStored = vectorDocs.length;

    return result;
  }

  private readLocalFiles(source: IndexerSource): Array<{ id: string; content: string; source: string }> {
    if (source.type !== "local") return [];

    const docs: Array<{ id: string; content: string; source: string }> = [];
    const files = this.walkDir(source.path, source.patterns);

    for (const file of files) {
      try {
        const content = readFileSync(file, "utf-8");
        docs.push({
          id: this.fileToId(file),
          content,
          source: file,
        });
      } catch (err) {
        logger.debug(`Failed to read ${file}: ${err}`);
      }
    }

    return docs;
  }

  private async fetchWebPages(
    source: IndexerSource
  ): Promise<Array<{ id: string; content: string; source: string }>> {
    if (source.type !== "web") return [];

    const docs: Array<{ id: string; content: string; source: string }> = [];

    for (const url of source.urls) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(15_000),
          headers: { "User-Agent": "your-cli-harness indexer/0.1.0" },
        });

        if (!response.ok) {
          logger.debug(`Failed to fetch ${url}: ${response.status}`);
          continue;
        }

        const text = await response.text();
        // Basic HTML to text conversion
        const content = text
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        docs.push({
          id: this.urlToId(url),
          content,
          source: url,
        });
      } catch (err) {
        logger.debug(`Failed to fetch ${url}: ${err}`);
      }
    }

    return docs;
  }

  private async embedChunks(chunks: Chunk[]): Promise<VectorDocument[]> {
    const texts = chunks.map((c) => c.content);
    const embeddings = await this.embedder.embedBatch(texts);

    return chunks.map((chunk, i) => ({
      id: chunk.id,
      content: chunk.content,
      metadata: {
        ...chunk.metadata,
        embedded: true,
        dimensions: this.embedder.dimensions(),
      },
      embedding: embeddings[i],
    }));
  }

  private walkDir(dir: string, patterns: string[]): string[] {
    const files: string[] = [];

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          files.push(...this.walkDir(fullPath, patterns));
        } else if (entry.isFile()) {
          const ext = extname(entry.name);
          if (patterns.some((p) => p === ext || p === `*${ext}`)) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Directory doesn't exist or permission denied
    }

    return files;
  }

  private fileToId(filePath: string): string {
    return filePath
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 100);
  }

  private urlToId(url: string): string {
    return url
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 100);
  }
}
