// src/core/compression/headroom/compressor.ts

import { createLogger } from "../../../shared/logger.js";

const logger = createLogger();

export interface CompressionResult {
  original: string;
  compressed: string;
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  techniques: string[];
}

export class HeadroomCompressor {
  private strategies: Map<string, (text: string) => string>;

  constructor() {
    this.strategies = new Map([
      ["json", this.compressJSON.bind(this)],
      ["code", this.compressCode.bind(this)],
      ["logs", this.compressLogs.bind(this)],
      ["text", this.compressText.bind(this)],
    ]);
  }

  compress(text: string): CompressionResult {
    const originalTokens = this.estimateTokens(text);
    const contentType = this.detectContentType(text);
    const strategy = this.strategies.get(contentType) || this.strategies.get("text")!;
    
    const compressed = strategy(text);
    const compressedTokens = this.estimateTokens(compressed);
    const compressionRatio = originalTokens > 0 
      ? (originalTokens - compressedTokens) / originalTokens 
      : 0;

    logger.debug(`Headroom compression: ${contentType} ${originalTokens} → ${compressedTokens} tokens (${(compressionRatio * 100).toFixed(1)}%)`);

    return {
      original: text,
      compressed,
      originalTokens,
      compressedTokens,
      compressionRatio,
      techniques: [contentType],
    };
  }

  private detectContentType(text: string): string {
    const trimmed = text.trim();
    
    // JSON detection
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        JSON.parse(trimmed);
        return "json";
      } catch {
        // Not valid JSON
      }
    }

    // Code detection
    if (this.isCode(text)) {
      return "code";
    }

    // Logs detection
    if (this.isLogs(text)) {
      return "logs";
    }

    return "text";
  }

  private isCode(text: string): boolean {
    const codePatterns = [
      /^(import|export|const|let|var|function|class|interface|type)\s/m,
      /^(if|else|for|while|switch|case|return)\s/m,
      /[{}\[\]();]=>/,
      /\/\/.*$/m,
      /\/\*[\s\S]*?\*\//,
      /```[\s\S]*?```/,
    ];

    return codePatterns.some(pattern => pattern.test(text));
  }

  private isLogs(text: string): boolean {
    const logPatterns = [
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/m,
      /^\[?(DEBUG|INFO|WARN|ERROR|FATAL)\]?/mi,
      /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/m,
      /^(GET|POST|PUT|DELETE|PATCH)\s/m,
    ];

    return logPatterns.some(pattern => pattern.test(text));
  }

  private compressJSON(json: string): string {
    try {
      const parsed = JSON.parse(json);
      const stripped = this.stripRedundancy(parsed);
      return JSON.stringify(stripped);
    } catch {
      return json;
    }
  }

  private stripRedundancy(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map(item => this.stripRedundancy(item));
    }
    
    if (obj !== null && typeof obj === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        // Skip null, undefined, empty strings, empty arrays
        if (value === null || value === undefined || value === "") {
          continue;
        }
        if (Array.isArray(value) && value.length === 0) {
          continue;
        }
        result[key] = this.stripRedundancy(value);
      }
      return result;
    }
    
    return obj;
  }

  private compressCode(code: string): string {
    return code
      // Remove single-line comments
      .replace(/\/\/.*$/gm, "")
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // Remove empty lines
      .replace(/\n\s*\n/g, "\n")
      // Remove leading/trailing whitespace per line
      .replace(/^\s+|\s+$/gm, "")
      // Collapse multiple spaces
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  private compressLogs(logs: string): string {
    return logs
      // Remove timestamps
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z?/g, "")
      // Remove debug lines
      .replace(/\[DEBUG\].*$/gm, "")
      // Remove info lines
      .replace(/\[INFO\].*$/gm, "")
      // Remove empty lines
      .replace(/\n\s*\n/g, "\n")
      .trim();
  }

  private compressText(text: string): string {
    return text
      // Remove multiple spaces
      .replace(/\s{2,}/g, " ")
      // Remove multiple newlines
      .replace(/\n{3,}/g, "\n\n")
      // Trim each line
      .replace(/^\s+|\s+$/gm, "")
      .trim();
  }

  private estimateTokens(text: string): number {
    // Simple approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}
