// src/core/mcp/tool-search.ts
// Lazy tool search and registration for MCP tools

import type { MCPToolDefinition } from "./types.js";
import type { ToolDefinition } from "../llm/provider.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface MCPToolSearchResult {
  tools: MCPToolDefinition[];
  serverName: string;
  cachedAt: Date;
}

export class MCPToolSearch {
  private cache = new Map<string, MCPToolSearchResult>();
  private ttlMs: number;

  constructor(ttlSeconds: number = 300) {
    this.ttlMs = ttlSeconds * 1000;
  }

  async search(
    serverName: string,
    fetchTools: () => Promise<MCPToolDefinition[]>
  ): Promise<MCPToolDefinition[]> {
    const cached = this.cache.get(serverName);
    if (cached && Date.now() - cached.cachedAt.getTime() < this.ttlMs) {
      logger.debug(`MCP tools cache hit for ${serverName}`);
      return cached.tools;
    }

    logger.info(`Fetching MCP tools from ${serverName}`);
    const tools = await fetchTools();

    this.cache.set(serverName, {
      tools,
      serverName,
      cachedAt: new Date(),
    });

    return tools;
  }

  invalidate(serverName?: string): void {
    if (serverName) {
      this.cache.delete(serverName);
    } else {
      this.cache.clear();
    }
  }

  isStale(serverName: string): boolean {
    const cached = this.cache.get(serverName);
    if (!cached) return true;
    return Date.now() - cached.cachedAt.getTime() >= this.ttlMs;
  }
}

// ─── Conversion: MCP Tool → LLM ToolDefinition ─────────────────────

export function mcpToolToLLM(tool: MCPToolDefinition): ToolDefinition {
  return {
    name: `mcp_${tool.name}`,
    description: tool.description ?? `MCP tool: ${tool.name}`,
    parameters: tool.inputSchema as ToolDefinition["parameters"],
  };
}

export function mcpToolName(mcpName: string): string {
  return `mcp_${mcpName}`;
}

export function stripMCPrefix(llmName: string): string {
  return llmName.startsWith("mcp_") ? llmName.slice(4) : llmName;
}
