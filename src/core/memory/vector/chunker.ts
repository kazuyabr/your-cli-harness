// src/core/memory/vector/chunker.ts
// Document chunker for semantic indexing

export interface Chunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    chunkIndex: number;
    totalChunks: number;
    startOffset: number;
    endOffset: number;
  };
}

export interface ChunkerConfig {
  chunkSize: number;
  overlap: number;
}

export class DocumentChunker {
  private config: ChunkerConfig;

  constructor(config: ChunkerConfig) {
    this.config = config;
  }

  chunk(documentId: string, content: string, source: string): Chunk[] {
    if (content.length <= this.config.chunkSize) {
      return [
        {
          id: `${documentId}_0`,
          content,
          metadata: {
            source,
            chunkIndex: 0,
            totalChunks: 1,
            startOffset: 0,
            endOffset: content.length,
          },
        },
      ];
    }

    const chunks: Chunk[] = [];
    let offset = 0;
    let chunkIndex = 0;

    while (offset < content.length) {
      const end = Math.min(offset + this.config.chunkSize, content.length);
      const chunkContent = content.slice(offset, end);

      chunks.push({
        id: `${documentId}_${chunkIndex}`,
        content: chunkContent,
        metadata: {
          source,
          chunkIndex,
          totalChunks: 0, // updated below
          startOffset: offset,
          endOffset: end,
        },
      });

      offset += this.config.chunkSize - this.config.overlap;
      chunkIndex++;

      // Prevent infinite loop if overlap >= chunkSize
      if (this.config.overlap >= this.config.chunkSize) {
        offset = end;
      }
    }

    // Update totalChunks
    for (const chunk of chunks) {
      chunk.metadata.totalChunks = chunks.length;
    }

    return chunks;
  }

  chunkMultiple(documents: Array<{ id: string; content: string; source: string }>): Chunk[] {
    const allChunks: Chunk[] = [];
    for (const doc of documents) {
      allChunks.push(...this.chunk(doc.id, doc.content, doc.source));
    }
    return allChunks;
  }
}
