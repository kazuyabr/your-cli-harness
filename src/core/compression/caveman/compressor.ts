// src/core/compression/caveman/compressor.ts

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

export class CavemanCompressor {
  private removePatterns: RegExp[];
  private replacePatterns: [RegExp, string][];
  private preservePatterns: RegExp[];

  constructor() {
    // Words to remove
    this.removePatterns = [
      // Articles
      /\b(a|an|the)\b/gi,
      // Filler words
      /\b(just|really|basically|actually|simply|essentially|literally|honestly)\b/gi,
      // Pleasantries
      /\b(sure|certainly|of course|happy to|I'd recommend|I suggest|please note)\b/gi,
      // Conectivos
      /\b(however|furthermore|additionally|in addition|moreover|nevertheless)\b/gi,
      // Hedging
      /\b(perhaps|maybe|possibly|might|could potentially)\b/gi,
      // Redundant phrases
      /\b(in order to|for the purpose of|with the goal of)\b/gi,
    ];

    // Words to replace with shorter versions
    this.replacePatterns = [
      [/\bin order to\b/gi, "to"],
      [/\bmake sure to\b/gi, "ensure"],
      [/\bthe reason is because\b/gi, "because"],
      [/\bit might be worth\b/gi, "consider"],
      [/\bas a result of\b/gi, "from"],
      [/\bat this point in time\b/gi, "now"],
      [/\bdue to the fact that\b/gi, "because"],
      [/\bin the event that\b/gi, "if"],
      [/\bprior to\b/gi, "before"],
      [/\bsubsequent to\b/gi, "after"],
      [/\bin spite of\b/gi, "despite"],
      [/\bwith respect to\b/gi, "regarding"],
      [/\bin accordance with\b/gi, "per"],
      [/\bfor the purpose of\b/gi, "for"],
    ];

    // Patterns to preserve (code, URLs, paths, etc.)
    this.preservePatterns = [
      /`[^`]+`/g,                    // Inline code
      /```[\s\S]*?```/g,             // Code blocks
      /https?:\/\/[^\s]+/g,          // URLs
      /\/[\w\/]+/g,                  // File paths
      /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g, // CamelCase
      /\b\w+\.\w+\.\w+\b/g,         // Version numbers
      /@\w+\/[\w-]+/g,               // Package names
    ];
  }

  compress(text: string): CompressionResult {
    const originalTokens = this.estimateTokens(text);
    
    // Extract preserved parts
    const preserved: string[] = [];
    let compressed = text;
    
    for (const pattern of this.preservePatterns) {
      compressed = compressed.replace(pattern, (match) => {
        preserved.push(match);
        return `__PRESERVED_${preserved.length - 1}__`;
      });
    }

    // Apply removals
    for (const pattern of this.removePatterns) {
      compressed = compressed.replace(pattern, "");
    }

    // Apply replacements
    for (const [pattern, replacement] of this.replacePatterns) {
      compressed = compressed.replace(pattern, replacement);
    }

    // Restore preserved parts
    compressed = compressed.replace(/__PRESERVED_(\d+)__/g, (_, index) => {
      return preserved[parseInt(index)] || "";
    });

    // Clean up extra spaces
    compressed = compressed
      .replace(/\s{2,}/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();

    const compressedTokens = this.estimateTokens(compressed);
    const compressionRatio = originalTokens > 0
      ? (originalTokens - compressedTokens) / originalTokens
      : 0;

    logger.debug(`Caveman compression: ${originalTokens} → ${compressedTokens} tokens (${(compressionRatio * 100).toFixed(1)}%)`);

    return {
      original: text,
      compressed,
      originalTokens,
      compressedTokens,
      compressionRatio,
      techniques: ["caveman"],
    };
  }

  private estimateTokens(text: string): number {
    // Simple approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}
