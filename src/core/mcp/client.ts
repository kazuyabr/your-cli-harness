// src/core/mcp/client.ts

import type { MCPServerConfig } from "../../shared/types.js";
import { MCPError } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPServer {
  name: string;
  config: MCPServerConfig;
  tools: MCPTool[];
  connected: boolean;
}

export class MCPClient {
  private servers = new Map<string, MCPServer>();

  async connect(config: MCPServerConfig): Promise<MCPServer> {
    logger.info(`Connecting to MCP server: ${config.name} (${config.type})`);

    const server: MCPServer = {
      name: config.name,
      config,
      tools: [],
      connected: false,
    };

    try {
      switch (config.type) {
        case "stdio":
          await this.connectStdio(server);
          break;
        case "http":
        case "sse":
          await this.connectHTTP(server);
          break;
        default:
          throw new MCPError(`Unsupported transport: ${config.type}`);
      }

      server.connected = true;
      this.servers.set(config.name, server);
      logger.info(`Connected to MCP server: ${config.name} (${server.tools.length} tools)`);
      return server;
    } catch (err) {
      throw new MCPError(`Failed to connect to ${config.name}: ${err}`, err as Error);
    }
  }

  async disconnect(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (server) {
      server.connected = false;
      this.servers.delete(name);
      logger.info(`Disconnected MCP server: ${name}`);
    }
  }

  getTools(serverName: string): MCPTool[] {
    const server = this.servers.get(serverName);
    return server?.tools ?? [];
  }

  getAllTools(): MCPTool[] {
    const tools: MCPTool[] = [];
    for (const server of this.servers.values()) {
      if (server.connected) {
        tools.push(...server.tools);
      }
    }
    return tools;
  }

  private async connectStdio(_server: MCPServer): Promise<void> {
    throw new MCPError("stdio transport not yet implemented");
  }

  private async connectHTTP(_server: MCPServer): Promise<void> {
    throw new MCPError("HTTP transport not yet implemented");
  }
}
