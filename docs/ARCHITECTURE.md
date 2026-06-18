# Your CLI Harness — Architecture

## Overview

Your CLI Harness is a white-label framework for building AI-powered CLI tools. It follows a modular architecture with clear separation between core functionality and client-specific configuration.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI INTERFACE                             │
│                      $ my-tool "task"                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     CLI ENGINE                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Parser      │  │ Dispatcher   │  │ Renderer               │ │
│  │ (commander) │  │ (routing)    │  │ (output formatting)    │ │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬────────────┘ │
│         │                │                       │              │
│  ┌──────▼────────────────▼───────────────────────▼────────────┐ │
│  │                   CONFIG LOADER                             │ │
│  │              (YAML + Zod validation)                        │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      ORCHESTRATOR                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ Plan     │  │ Build    │  │ YOLO     │  │ Default        │ │
│  │ Mode     │  │ Mode     │  │ Mode     │  │ Mode           │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  MODE MANAGER                               ││
│  │         (tool filtering, confirmation logic)                ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      AGENT LOOP                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   LLM PROVIDER                              ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ ││
│  │  │Anthropic │  │ OpenAI   │  │ Azure    │  │ Custom     │ ││
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    TOOLS                                    ││
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ││
│  │  │ read   │ │ write  │ │ bash   │ │ grep   │ │ MCP      │ ││
│  │  │ write  │ │ edit   │ │ glob   │ │ skills │ │ Tools    │ ││
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                   SUBAGENT ENGINE                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ Explore  │  │ Research │  │ Builder  │  │ Reviewer       │ │
│  │ (read)   │  │ (analyze)│  │ (write)  │  │ (validate)     │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 DAG ORCHESTRATOR                            ││
│  │           (parallel execution, dependency resolution)       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    CONTEXT MANAGEMENT                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Session     │  │ Context      │  │ Headroom               │ │
│  │ Manager     │  │ Window       │  │ Monitor                │ │
│  │             │  │ Manager      │  │ (auto-compact)         │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 COMPACTION ENGINE                           ││
│  │        (summarize history, preserve critical context)       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      MEMORY LAYER                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Auto Memory │  │ Vector       │  │ Document               │ │
│  │ (MEMORY.md) │  │ Memory       │  │ Indexer                │ │
│  │             │  │ (Qdrant/     │  │ (local/web/            │ │
│  │             │  │  Pinecone)   │  │  confluence)           │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      SKILLS ENGINE                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Skill       │  │ Skill        │  │ Skill                  │ │
│  │ Loader      │  │ Registry     │  │ Invoker                │ │
│  │ (SKILL.md)  │  │ (precedence) │  │ (substitution)         │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 SKILL SCOPES                                ││
│  │     built-in < client < project (highest priority)         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                       MCP LAYER                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ MCP Client  │  │ Transport    │  │ Tool Search            │ │
│  │             │  │ Factory      │  │ (lazy + TTL cache)     │ │
│  │             │  │ (stdio/http) │  │                        │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                     BRANDING LAYER                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Brand       │  │ Renderer     │  │ Theme                  │ │
│  │ Loader      │  │ (colors,     │  │ Presets                │ │
│  │ (assets)    │  │  formatting) │  │ (professional/casual)  │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
your-cli-harness/
├── src/
│   ├── core/                          # CORE (never client-specific)
│   │   ├── cli/                       # CLI interface
│   │   │   ├── parser.ts
│   │   │   ├── dispatcher.ts
│   │   │   ├── renderer.ts
│   │   │   └── commands/              # Built-in commands
│   │   ├── config/                    # Configuration
│   │   │   ├── loader.ts
│   │   │   ├── schema.ts
│   │   │   └── defaults.ts
│   │   ├── context/                   # Context management
│   │   │   ├── session.ts
│   │   │   ├── window.ts
│   │   │   ├── compaction.ts
│   │   │   └── headroom.ts
│   │   ├── orchestrator/              # Agent orchestration
│   │   │   ├── agent-loop.ts
│   │   │   ├── modes/
│   │   │   └── subagent-spawner.ts
│   │   ├── agents/                    # Agent implementations
│   │   ├── subagents/                 # Subagent system
│   │   ├── skills/                    # Skills engine
│   │   ├── mcp/                       # MCP integration
│   │   ├── memory/                    # Memory systems
│   │   ├── llm/                       # LLM providers
│   │   ├── tools/                     # Tool implementations
│   │   └── branding/                  # Branding system
│   │
│   ├── clients/                       # CLIENT DEFINITIONS
│   │   └── {client-name}/
│   │       ├── config.yaml
│   │       ├── CLAUDE.md
│   │       ├── branding/
│   │       ├── memory/
│   │       ├── skills/
│   │       └── agents/
│   │
│   └── shared/                        # UTILITIES
│       ├── types.ts
│       ├── logger.ts
│       ├── errors.ts
│       └── utils.ts
│
├── tests/
│   ├── unit/                          # Unit tests
│   ├── integration/                   # Integration tests
│   └── e2e/                           # End-to-end tests
│
├── docs/                              # Documentation
│   ├── API.md
│   ├── CLIENT-GUIDE.md
│   ├── EXAMPLES.md
│   └── ARCHITECTURE.md
│
└── .vibecoding/                       # Project context
    ├── intent/
    ├── architecture/
    ├── decisions/
    └── plan/
```

---

## Core Design Principles

### 1. Client Isolation

**Rule:** `src/core/` NEVER contains client-specific logic.

```
src/core/           → Generic, reusable components
src/clients/        → Client-specific configurations
```

### 2. Configuration-Driven

All client behavior is defined in `config.yaml`:

- LLM provider and model
- Available modes
- Memory configuration
- MCP servers
- Branding (colors, theme)

### 3. Precedence System

Resources are resolved with clear precedence:

| Resource | Precedence (highest wins) |
|----------|---------------------------|
| Skills | project > client > built-in |
| Config | client > defaults |
| Themes | custom > preset |

### 4. Lazy Loading

Expensive resources are loaded on demand:

- MCP tools: fetched when needed, cached with TTL
- Vector memory: queried only when relevant
- Skills: loaded per-session, not at startup

### 5. Headroom Management

Context window is treated as a scarce resource:

| Usage | Action |
|-------|--------|
| 0–60% | Normal operation |
| 60–80% | Suggest compaction |
| 80–95% | Auto-compact |
| 95%+ | Aggressive truncation |

---

## Data Flow

### Request Processing

```
User Input
    │
    ▼
┌─────────────┐
│ Parser      │ → Extract command, args, options
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Dispatcher  │ → Route to command handler
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Config      │ → Load client config
│ Loader      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Mode        │ → Apply mode constraints
│ Manager     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Agent Loop  │ → Execute with LLM
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Tools       │ → Execute tool calls
│ Registry    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Context     │ → Update session, track tokens
│ Manager     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Headroom    │ → Check if compaction needed
│ Monitor     │
└──────┬──────┘
       │
       ▼
    Response
```

### Memory Flow

```
User Query
    │
    ▼
┌─────────────┐
│ Auto Memory │ → Load MEMORY.md
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Vector      │ → Semantic search (if enabled)
│ Search      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Context     │ → Combine with conversation
│ Assembly    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ LLM         │ → Generate response
│ Provider    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Memory      │ → Extract learnings
│ Extraction  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Auto Memory │ → Update MEMORY.md
│ Save        │
└─────────────┘
```

---

## Key Components

### Agent Loop

The core execution cycle:

```typescript
async function agentLoop(input: string): Promise<Response> {
  // 1. Load context
  const context = await loadContext(session);

  // 2. Call LLM
  const response = await llm.complete({
    messages: context.messages,
    tools: context.tools,
  });

  // 3. Execute tool calls
  for (const toolCall of response.toolCalls) {
    const result = await executeTool(toolCall);
    context.messages.push(result);
  }

  // 4. Check headroom
  if (headroomMonitor.shouldCompact(context)) {
    await compactionEngine.compact(context);
  }

  // 5. Return response
  return response;
}
```

### Mode System

Modes control agent behavior:

```typescript
interface ModeConfig {
  enabled: boolean;
  readOnly: boolean;        // Can only read, not write
  autoExecute: boolean;     // Execute without confirmation
  requireConfirmation: boolean;
  description: string;
}
```

**Mode behaviors:**

| Mode | ReadOnly | AutoExecute | Confirmation |
|------|----------|-------------|--------------|
| plan | ✓ | Config | Always |
| build | ✗ | Config | Config |
| yolo | ✗ | ✓ | Never |
| default | ✗ | ✗ | Destructive |

### Skill System

Skills are knowledge units with precedence:

```
Project Skills (highest)
    ↓
Client Skills
    ↓
Built-in Skills (lowest)
```

**Skill resolution:**

```typescript
function resolveSkill(name: string): Skill {
  // Check project skills first
  const projectSkill = projectRegistry.get(name);
  if (projectSkill) return projectSkill;

  // Then client skills
  const clientSkill = clientRegistry.get(name);
  if (clientSkill) return clientSkill;

  // Finally built-in
  return builtinRegistry.get(name);
}
```

### MCP Integration

MCP tools are discovered lazily:

```typescript
class MCPToolSearch {
  async search(query: string): Promise<MCPTool[]> {
    // Check cache
    if (this.cache.isValid(query)) {
      return this.cache.get(query);
    }

    // Fetch from servers
    const tools = await Promise.all(
      this.servers.map(server => server.listTools())
    );

    // Cache results
    this.cache.set(query, tools);

    return tools;
  }
}
```

---

## Testing Strategy

### Test Levels

| Level | Scope | Speed | Coverage |
|-------|-------|-------|----------|
| Unit | Single function/class | Fast | 100% core |
| Integration | Multiple components | Medium | Critical paths |
| E2E | Full CLI workflow | Slow | User scenarios |

### Test Structure

```
tests/
├── unit/
│   └── core/
│       ├── config/
│       ├── context/
│       ├── skills/
│       ├── mcp/
│       └── ...
├── integration/
│   ├── config-to-session.test.ts
│   └── full-pipeline.test.ts
└── e2e/
    └── cli-commands.test.ts
```

### Running Tests

```bash
# All tests
npm test

# Unit only
npm run test:unit

# Integration only
npm run test:integration

# E2E only
npm run test:e2e

# With coverage
npm run test:coverage
```

---

## Build System

### Development

```bash
# Watch mode
npm run dev

# Build once
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

### Client Build

```bash
# Build a specific client
your-harness build-client my-client

# Output: dist/clients/my-client/
#   ├── cli.ts
#   ├── package.json
#   ├── config.yaml
#   └── branding/
```

---

## Security Considerations

### Environment Variables

Never commit secrets. Use `${VAR}` syntax:

```yaml
# ✓ Correct
apiKey: ${ANTHROPIC_API_KEY}

# ✗ Wrong
apiKey: sk-ant-...
```

### Core Isolation

Client code cannot access core internals:

```
src/core/     → No client imports
src/clients/  → Only imports from core
```

### Tool Restrictions

Skills can restrict available tools:

```yaml
allowed-tools:
  - read
  - grep
  - glob
disallowed-tools:
  - bash
  - write
```

---

## Performance

### Token Optimization

- **Auto-compact** at 95% context usage
- **Lazy MCP** tool loading with TTL cache
- **Semantic search** only when relevant
- **Skill precedence** avoids loading unused skills

### Caching

| Component | Cache Strategy |
|-----------|----------------|
| MCP Tools | TTL-based (5 min default) |
| Config | Per-session |
| Skills | Per-session |
| Vector Search | Query-based |

### Parallel Execution

Subagents run in parallel via DAG orchestrator:

```
    ┌─────────┐
    │ Explore │
    └────┬────┘
         │
    ┌────▼────┐
    │Research │
    └────┬────┘
         │
    ┌────▼────┐
    │Builder  │
    └─────────┘
```

---

## Future Considerations

### Planned Features

- WebSocket MCP transport
- Custom mode definitions
- Plugin system for tools
- Multi-language support
- Cloud deployment

### Extension Points

- Custom LLM providers
- Custom transports
- Custom memory adapters
- Custom branding renderers
