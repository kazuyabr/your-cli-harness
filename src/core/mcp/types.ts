// src/core/mcp/types.ts
// MCP protocol types based on https://modelcontextprotocol.io

import type { MCPServerConfig } from "../../shared/types.js";

export type { MCPServerConfig };

export interface MCPJSONRPCRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPJSONRPCResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface MCPJSONRPCNotification {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPToolDefinition {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPToolsListResult {
  tools: MCPToolDefinition[];
}

export interface MCPToolCallParams {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface MCPToolCallResult {
  content: MCPContent[];
  isError?: boolean;
}

export interface MCPContent {
  type: "text" | "image" | "resource";
  text?: string;
  mimeType?: string;
  data?: string;
  resource?: {
    uri: string;
    mimeType?: string;
    text?: string;
  };
}

export interface MCPServerCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  prompts?: { listChanged?: boolean };
  logging?: Record<string, unknown>;
}

export interface MCPInitializeResult {
  protocolVersion: string;
  capabilities: MCPServerCapabilities;
  serverInfo?: {
    name: string;
    version?: string;
  };
}

export type MCPTransportType = "stdio" | "http" | "sse" | "ws";

export interface MCPTransport {
  type: MCPTransportType;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(request: MCPJSONRPCRequest): Promise<MCPJSONRPCResponse>;
  sendNotification(notification: MCPJSONRPCNotification): void;
  onNotification(handler: (notification: MCPJSONRPCNotification) => void): void;
}
