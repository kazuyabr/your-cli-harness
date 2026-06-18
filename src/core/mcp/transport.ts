// src/core/mcp/transport.ts
// MCP transport implementations: stdio and HTTP/SSE

import { spawn, type ChildProcess } from "node:child_process";
import type {
  MCPTransport,
  MCPTransportType,
  MCPJSONRPCRequest,
  MCPJSONRPCResponse,
  MCPJSONRPCNotification,
} from "./types.js";
import { MCPError } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

// ─── Stdio Transport ────────────────────────────────────────────────

export interface StdioTransportOptions {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export class StdioTransport implements MCPTransport {
  type: MCPTransportType = "stdio";
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pending = new Map<
    number | string,
    {
      resolve: (res: MCPJSONRPCResponse) => void;
      reject: (err: Error) => void;
    }
  >();
  private notificationHandler: ((notification: MCPJSONRPCNotification) => void) | null = null;
  private buffer = "";

  constructor(private options: StdioTransportOptions) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.process = spawn(this.options.command, this.options.args ?? [], {
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env, ...this.options.env },
        });

        this.process.on("error", (err) => {
          logger.error(`MCP stdio process error: ${err.message}`);
          reject(new MCPError(`Failed to start MCP process: ${err.message}`, err as Error));
        });

        this.process.on("exit", (code) => {
          logger.info(`MCP stdio process exited with code ${code}`);
          for (const pending of this.pending.values()) {
            pending.reject(new MCPError("MCP process exited"));
          }
          this.pending.clear();
        });

        this.process.stdout?.on("data", (data: Buffer) => {
          this.handleData(data.toString());
        });

        this.process.stderr?.on("data", (data: Buffer) => {
          logger.debug(`MCP stderr: ${data.toString().trim()}`);
        });

        resolve();
      } catch (err) {
        reject(new MCPError(`Failed to spawn MCP process: ${err}`, err as Error));
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    for (const pending of this.pending.values()) {
      pending.reject(new MCPError("Transport disconnected"));
    }
    this.pending.clear();
  }

  async send(request: MCPJSONRPCRequest): Promise<MCPJSONRPCResponse> {
    if (!this.process?.stdin) {
      throw new MCPError("MCP stdio transport not connected");
    }

    const id = request.id ?? ++this.requestId;
    const msg = { ...request, id };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      const json = JSON.stringify(msg);
      this.process!.stdin!.write(`${json}\n`);

      // Timeout after 30s
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new MCPError(`MCP request timed out: ${request.method}`));
        }
      }, 30_000);
    });
  }

  sendNotification(notification: MCPJSONRPCNotification): void {
    if (!this.process?.stdin) {
      throw new MCPError("MCP stdio transport not connected");
    }
    const json = JSON.stringify(notification);
    this.process.stdin.write(`${json}\n`);
  }

  onNotification(handler: (notification: MCPJSONRPCNotification) => void): void {
    this.notificationHandler = handler;
  }

  private handleData(data: string): void {
    this.buffer += data;
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line) as MCPJSONRPCResponse | MCPJSONRPCNotification;

        if ("id" in msg && (msg as MCPJSONRPCResponse).result !== undefined) {
          const response = msg as MCPJSONRPCResponse;
          const pending = this.pending.get(response.id);
          if (pending) {
            this.pending.delete(response.id);
            pending.resolve(response);
          }
        } else if ("method" in msg) {
          this.notificationHandler?.(msg as MCPJSONRPCNotification);
        }
      } catch {
        logger.debug(`Failed to parse MCP message: ${line.substring(0, 100)}`);
      }
    }
  }
}

// ─── HTTP Transport ─────────────────────────────────────────────────

export interface HTTPTransportOptions {
  url: string;
  headers?: Record<string, string>;
}

export class HTTPTransport implements MCPTransport {
  type: MCPTransportType = "http";
  private requestId = 0;
  private connected = false;

  constructor(private options: HTTPTransportOptions) {}

  async connect(): Promise<void> {
    // HTTP transport is stateless; verify server is reachable
    try {
      const response = await fetch(this.options.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.options.headers,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 0,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "your-cli-harness", version: "0.1.0" },
          },
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok && response.status !== 404) {
        throw new MCPError(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.connected = true;
    } catch (err) {
      if (err instanceof MCPError) throw err;
      throw new MCPError(`Failed to connect to MCP HTTP server: ${err}`, err as Error);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async send(request: MCPJSONRPCRequest): Promise<MCPJSONRPCResponse> {
    if (!this.connected) {
      throw new MCPError("MCP HTTP transport not connected");
    }

    const id = request.id ?? ++this.requestId;
    const msg = { ...request, id };

    const response = await fetch(this.options.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.options.headers,
      },
      body: JSON.stringify(msg),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      throw new MCPError(`MCP HTTP error: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as MCPJSONRPCResponse;
    return result;
  }

  sendNotification(notification: MCPJSONRPCNotification): void {
    // Fire-and-forget for HTTP
    fetch(this.options.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.options.headers,
      },
      body: JSON.stringify(notification),
    }).catch((err) => {
      logger.debug(`MCP HTTP notification failed: ${err}`);
    });
  }

  onNotification(handler: (notification: MCPJSONRPCNotification) => void): void {
    // HTTP transport is request-response; notifications are fire-and-forget
    // Store handler for interface compliance but HTTP won't receive push notifications
    void handler;
  }
}

// ─── Transport Factory ──────────────────────────────────────────────

export function createTransport(
  type: MCPTransportType,
  options: StdioTransportOptions | HTTPTransportOptions
): MCPTransport {
  switch (type) {
    case "stdio":
      return new StdioTransport(options as StdioTransportOptions);
    case "http":
    case "sse":
      return new HTTPTransport(options as HTTPTransportOptions);
    case "ws":
      throw new MCPError("WebSocket transport not yet implemented");
    default:
      throw new MCPError(`Unsupported transport type: ${type}`);
  }
}
