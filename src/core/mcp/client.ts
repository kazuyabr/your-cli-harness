// src/core/mcp/client.ts
// Full MCP Client with stdio/HTTP transport, tool search, and OAuth

import type { MCPServerConfig, MCPToolDefinition, MCPToolCallResult } from "./types.js";
import type { ToolDefinition } from "../llm/provider.js";
import { createTransport } from "./transport.js";
import type { MCPTransport } from "./types.js";
import { MCPToolSearch, mcpToolToLLM, stripMCPrefix } from "./tool-search.js";
import { MCPError } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface MCPServer {
  name: string;
  config: MCPServerConfig;
  transport: MCPTransport;
  tools: MCPToolDefinition[];
  connected: boolean;
  serverInfo?: { name: string; version?: string };
}

export interface MCPClientOptions {
  toolCacheTTL?: number;
  timeout?: number;
}

export class MCPClient {
  private servers = new Map<string, MCPServer>();
  private toolSearch: MCPToolSearch;

  constructor(options?: MCPClientOptions) {
    this.toolSearch = new MCPToolSearch(options?.toolCacheTTL ?? 300);
  }

  async connect(config: MCPServerConfig): Promise<MCPServer> {
    if (this.servers.has(config.name)) {
      logger.warn(`MCP server ${config.name} already connected`);
      return this.servers.get(config.name)!;
    }

    logger.info(`Connecting to MCP server: ${config.name} (${config.type})`);

    const transport = createTransport(config.type, {
      ...(config.type === "stdio"
        ? { command: config.command!, args: config.args, env: config.env }
        : { url: config.url!, headers: config.headers }),
    });

    const server: MCPServer = {
      name: config.name,
      config,
      transport,
      tools: [],
      connected: false,
    };

    try {
      await transport.connect();

      // Initialize handshake
      const initResponse = await transport.send({
        jsonrpc: "2.0",
        id: this.nextId(),
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "your-cli-harness", version: "0.1.0" },
        },
      });

      if (initResponse.error) {
        throw new MCPError(`Initialize failed: ${initResponse.error.message}`);
      }

      const result = initResponse.result as {
        protocolVersion?: string;
        serverInfo?: { name: string; version?: string };
        capabilities?: Record<string, unknown>;
      };

      server.serverInfo = result?.serverInfo;
      server.connected = true;

      // Send initialized notification
      transport.sendNotification({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      });

      // Fetch tools
      server.tools = await this.fetchTools(server);

      this.servers.set(config.name, server);
      logger.info(`Connected to MCP server: ${config.name} (${server.tools.length} tools)`);
      return server;
    } catch (err) {
      await transport.disconnect();
      if (err instanceof MCPError) throw err;
      throw new MCPError(`Failed to connect to ${config.name}: ${err}`, err as Error);
    }
  }

  async disconnect(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (server) {
      await server.transport.disconnect();
      server.connected = false;
      this.servers.delete(name);
      this.toolSearch.invalidate(name);
      logger.info(`Disconnected MCP server: ${name}`);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const name of this.servers.keys()) {
      await this.disconnect(name);
    }
  }

  async callTool(serverName: string, toolName: string, args: Record<string, unknown>): Promise<MCPToolCallResult> {
    const server = this.servers.get(serverName);
    if (!server || !server.connected) {
      throw new MCPError(`MCP server not connected: ${serverName}`);
    }

    const mcpToolName = stripMCPrefix(toolName);

    const response = await server.transport.send({
      jsonrpc: "2.0",
      id: this.nextId(),
      method: "tools/call",
      params: { name: mcpToolName, arguments: args },
    });

    if (response.error) {
      throw new MCPError(`Tool call failed: ${response.error.message}`);
    }

    return response.result as MCPToolCallResult;
  }

  getTools(serverName: string): MCPToolDefinition[] {
    const server = this.servers.get(serverName);
    return server?.tools ?? [];
  }

  getAllTools(): MCPToolDefinition[] {
    const tools: MCPToolDefinition[] = [];
    for (const server of this.servers.values()) {
      if (server.connected) {
        tools.push(...server.tools);
      }
    }
    return tools;
  }

  getToolDefinitions(): ToolDefinition[] {
    return this.getAllTools().map(mcpToolToLLM);
  }

  isConnected(serverName: string): boolean {
    return this.servers.get(serverName)?.connected ?? false;
  }

  getConnectedServers(): string[] {
    return Array.from(this.servers.values())
      .filter((s) => s.connected)
      .map((s) => s.name);
  }

  async refreshTools(serverName: string): Promise<MCPToolDefinition[]> {
    this.toolSearch.invalidate(serverName);
    const server = this.servers.get(serverName);
    if (!server) {
      throw new MCPError(`MCP server not found: ${serverName}`);
    }
    server.tools = await this.fetchTools(server);
    return server.tools;
  }

  private async fetchTools(server: MCPServer): Promise<MCPToolDefinition[]> {
    return this.toolSearch.search(server.name, async () => {
      const response = await server.transport.send({
        jsonrpc: "2.0",
        id: this.nextId(),
        method: "tools/list",
      });

      if (response.error) {
        logger.warn(`Failed to list tools from ${server.name}: ${response.error.message}`);
        return [];
      }

      const result = response.result as { tools?: MCPToolDefinition[] };
      return result?.tools ?? [];
    });
  }

  private nextId(): number {
    return Date.now() % 100000;
  }
}
