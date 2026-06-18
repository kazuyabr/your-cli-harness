// tests/unit/core/mcp/tool-search.test.ts

import { describe, it, expect, vi } from "vitest";
import { MCPToolSearch, mcpToolToLLM, stripMCPrefix } from "../../../../src/core/mcp/tool-search.js";
import type { MCPToolDefinition } from "../../../../src/core/mcp/types.js";

const mockTool: MCPToolDefinition = {
  name: "read_file",
  description: "Read a file from the filesystem",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path" },
    },
    required: ["path"],
  },
};

describe("MCPToolSearch", () => {
  it("should fetch and cache tools", async () => {
    const search = new MCPToolSearch();
    const fetcher = vi.fn().mockResolvedValue([mockTool]);

    const tools = await search.search("test-server", fetcher);
    expect(tools).toEqual([mockTool]);
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const tools2 = await search.search("test-server", fetcher);
    expect(tools2).toEqual([mockTool]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("should invalidate cache for specific server", async () => {
    const search = new MCPToolSearch();
    const fetcher = vi.fn().mockResolvedValue([mockTool]);

    await search.search("server-1", fetcher);
    await search.search("server-2", fetcher);

    search.invalidate("server-1");

    await search.search("server-1", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(3);

    // server-2 should still be cached
    await search.search("server-2", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("should invalidate all cache", async () => {
    const search = new MCPToolSearch();
    const fetcher = vi.fn().mockResolvedValue([mockTool]);

    await search.search("server-1", fetcher);
    await search.search("server-2", fetcher);

    search.invalidate();

    await search.search("server-1", fetcher);
    await search.search("server-2", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("should detect stale cache", async () => {
    const search = new MCPToolSearch(0); // 0 TTL = always stale
    const fetcher = vi.fn().mockResolvedValue([mockTool]);

    await search.search("server-1", fetcher);
    expect(search.isStale("server-1")).toBe(true);
  });

  it("should not be stale within TTL", async () => {
    const search = new MCPToolSearch(300);
    const fetcher = vi.fn().mockResolvedValue([mockTool]);

    await search.search("server-1", fetcher);
    expect(search.isStale("server-1")).toBe(false);
  });

  it("should report stale for unknown server", () => {
    const search = new MCPToolSearch();
    expect(search.isStale("unknown")).toBe(true);
  });
});

describe("mcpToolToLLM", () => {
  it("should convert MCP tool to LLM ToolDefinition", () => {
    const llmTool = mcpToolToLLM(mockTool);

    expect(llmTool.name).toBe("mcp_read_file");
    expect(llmTool.description).toBe("Read a file from the filesystem");
    expect(llmTool.parameters).toEqual(mockTool.inputSchema);
  });

  it("should use fallback description", () => {
    const toolNoDesc: MCPToolDefinition = {
      name: "no_desc",
      inputSchema: { type: "object" },
    };
    const llmTool = mcpToolToLLM(toolNoDesc);
    expect(llmTool.description).toBe("MCP tool: no_desc");
  });
});

describe("stripMCPrefix", () => {
  it("should strip mcp_ prefix", () => {
    expect(stripMCPrefix("mcp_read_file")).toBe("read_file");
  });

  it("should return unchanged if no prefix", () => {
    expect(stripMCPrefix("read_file")).toBe("read_file");
  });
});
