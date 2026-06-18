// tests/unit/core/mcp/transport.test.ts

import { describe, it, expect } from "vitest";
import { createTransport, StdioTransport, HTTPTransport } from "../../../../src/core/mcp/transport.js";

describe("createTransport", () => {
  it("should create StdioTransport for stdio type", () => {
    const transport = createTransport("stdio", { command: "echo", args: [] });
    expect(transport).toBeInstanceOf(StdioTransport);
    expect(transport.type).toBe("stdio");
  });

  it("should create HTTPTransport for http type", () => {
    const transport = createTransport("http", { url: "http://localhost:3000" });
    expect(transport).toBeInstanceOf(HTTPTransport);
    expect(transport.type).toBe("http");
  });

  it("should create HTTPTransport for sse type", () => {
    const transport = createTransport("sse", { url: "http://localhost:3000" });
    expect(transport).toBeInstanceOf(HTTPTransport);
    expect(transport.type).toBe("http");
  });

  it("should throw for unsupported type", () => {
    expect(() => createTransport("ws" as never, {})).toThrow("WebSocket transport not yet implemented");
  });
});
