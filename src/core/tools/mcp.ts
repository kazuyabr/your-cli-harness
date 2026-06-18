// src/core/tools/mcp.ts
// MCP tools integration with AgentLoop tool system

import type { MCPClient } from "../mcp/client.js";
import type { MCPToolDefinition } from "../mcp/types.js";
import type { AgentToolDefinition } from "../orchestrator/agent-loop.js";

export interface CreateMCPToolsOptions {
  client: MCPClient;
  serverFilter?: string[];
}

export function createMCPTools(options: CreateMCPToolsOptions): AgentToolDefinition[] {
  const { client, serverFilter } = options;
  const tools: AgentToolDefinition[] = [];

  const servers = serverFilter
    ? serverFilter.filter((name) => client.isConnected(name))
    : client.getConnectedServers();

  for (const serverName of servers) {
    const mcpTools = client.getTools(serverName);

    for (const mcpTool of mcpTools) {
      tools.push({
        name: `mcp_${mcpTool.name}`,
        description: mcpTool.description ?? `MCP tool from ${serverName}: ${mcpTool.name}`,
        parameters: mcpTool.inputSchema as AgentToolDefinition["parameters"],
        async execute(args) {
          const result = await client.callTool(serverName, mcpTool.name, args as Record<string, unknown>);

          if (result.isError) {
            const errorText = result.content
              .filter((c) => c.type === "text")
              .map((c) => c.text)
              .join("\n");
            throw new Error(errorText || `MCP tool ${mcpTool.name} failed`);
          }

          return result.content
            .filter((c) => c.type === "text")
            .map((c) => c.text)
            .join("\n");
        },
      });
    }
  }

  return tools;
}

export function mcpToolToAgentTool(
  mcpTool: MCPToolDefinition,
  serverName: string
): AgentToolDefinition {
  return {
    name: `mcp_${mcpTool.name}`,
    description: mcpTool.description ?? `MCP tool from ${serverName}: ${mcpTool.name}`,
    parameters: mcpTool.inputSchema as AgentToolDefinition["parameters"],
    async execute(_args) {
      throw new Error(`MCP tool ${mcpTool.name} requires MCPClient for execution`);
    },
  };
}
