# Your CLI Harness — API Reference

## Import

```typescript
import {
  // Config
  ConfigLoader,
  ClientConfigSchema,

  // Session & Context
  TokenCounter,
  SessionManager,
  ContextWindowManager,
  CompactionEngine,
  HeadroomMonitor,

  // LLM Providers
  LLMFactory,
  AnthropicProvider,
  OpenAIProvider,
  AzureOpenAIProvider,

  // Agent Loop & Modes
  AgentLoop,
  ModeManager,

  // Agents
  BaseAgent,
  DefaultAgent,
  ExploreAgent,
  PlanAgent,

  // Subagents
  SubagentRegistry,
  SubagentRunner,
  SubagentOrchestrator,

  // Skills
  SkillEngine,
  SkillLoader,
  SkillRegistry,
  SkillInvoker,

  // MCP
  MCPClient,
  MCPToolSearch,
  createTransport,

  // Memory
  MemoryManager,
  VectorMemoryManager,
  QdrantAdapter,
  PineconeAdapter,

  // Branding
  BrandingLoader,
  BrandingRenderer,
  BrandManager,

  // Tools
  createAllTools,
  createReadOnlyTools,
  createSkillTool,
  createMCPTools,
} from "your-cli-harness";
```

---

## Config

### `ConfigLoader`

Loads and validates `config.yaml` from a client directory.

```typescript
class ConfigLoader {
  static load(clientDir: string): ClientConfig;
}
```

**Usage:**

```typescript
const config = ConfigLoader.load("/path/to/clients/jogatinando");
// Returns validated ClientConfig with defaults applied
```

**Config structure (`ClientConfig`):**

```typescript
interface ClientConfig {
  name: string;
  command: string;
  version: string;
  description: string;
  llm: LLMConfig;
  modes: ModesConfig;
  memory: MemoryConfig;
  mcp: MCPConfig;
  branding: BrandingConfig;
}
```

---

## Session & Context

### `TokenCounter`

Estimates token count for text content.

```typescript
class TokenCounter {
  static estimate(text: string): number;
  static estimateMessages(messages: Message[]): number;
}
```

### `SessionManager`

Manages conversation sessions with persistence.

```typescript
class SessionManager {
  constructor(options?: SessionManagerOptions);

  create(clientId: string, options?: CreateSessionOptions): Session;
  get(sessionId: string): Session | undefined;
  addMessage(sessionId: string, message: Message): void;
  getUsagePercent(sessionId: string): number;
  getHeadroom(sessionId: string): number;
  delete(sessionId: string): void;
}
```

**Usage:**

```typescript
const sessionManager = new SessionManager();
const session = sessionManager.create("jogatinando", { mode: "plan" });

sessionManager.addMessage(session.id, {
  role: "user",
  content: "Analyze the codebase",
  timestamp: new Date(),
});

const usage = sessionManager.getUsagePercent(session.id);
```

### `ContextWindowManager`

Manages context window size and truncation.

```typescript
class ContextWindowManager {
  constructor(maxTokens: number);

  calculateUsage(messages: Message[]): ContextWindow;
  truncateToFit(messages: Message[], maxTokens: number): Message[];
}
```

### `CompactionEngine`

Compacts conversation history to reduce token usage.

```typescript
class CompactionEngine {
  constructor(options?: CompactionOptions);

  compact(messages: Message[]): CompactionResult;
  apply(session: Session): void;
}
```

**Compaction behavior:**
- Preserves: system prompts, CLAUDE.md, auto memory, MCP tool definitions
- Summarizes: conversation history (~12% of original size)
- Discards: intermediate tool outputs, unused skill descriptions

### `HeadroomMonitor`

Monitors context window usage and triggers compaction.

```typescript
class HeadroomMonitor {
  constructor(config: HeadroomConfig);

  check(session: Session): HeadroomStatus;
  autoCompact(session: Session, compactionEngine: CompactionEngine): boolean;
}
```

**Headroom levels:**

| Level | Usage | Action |
|-------|-------|--------|
| Safe | 0–60% | Normal operation |
| Warning | 60–80% | Suggests compaction |
| Critical | 80–95% | Auto-compacts |
| Emergency | 95%+ | Aggressive truncation |

---

## LLM Providers

### `LLMFactory`

Creates LLM provider instances from config.

```typescript
class LLMFactory {
  static create(config: LLMConfig): LLMProvider;
}
```

**Supported providers:**

| Provider | Class | Config `provider` value |
|----------|-------|-------------------------|
| Anthropic Claude | `AnthropicProvider` | `"anthropic"` |
| OpenAI GPT | `OpenAIProvider` | `"openai"` |
| Azure OpenAI | `AzureOpenAIProvider` | `"azure"` |

**Usage:**

```typescript
const provider = LLMFactory.create({
  provider: "anthropic",
  model: "claude-sonnet-4-20250514",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await provider.complete({
  messages: [{ role: "user", content: "Hello" }],
  tools: [],
});
```

---

## Agent Loop

### `AgentLoop`

Main orchestration loop for agent execution.

```typescript
class AgentLoop {
  constructor(config: AgentLoopConfig);

  run(input: string): Promise<AgentLoopResult>;
  runWithTools(input: string, tools: AgentToolDefinition[]): Promise<AgentLoopResult>;
}
```

**`AgentLoopConfig`:**

```typescript
interface AgentLoopConfig {
  provider: LLMProvider;
  model: string;
  systemPrompt: string;
  maxTurns?: number;
  maxTokens?: number;
  tools?: AgentToolDefinition[];
}
```

### `ModeManager`

Manages conversation modes (plan, build, yolo, default).

```typescript
class ModeManager {
  constructor(modesConfig: ModesConfig);

  switchMode(mode: Mode): void;
  getCurrentMode(): Mode;
  getModeConfig(mode?: Mode): ModeConfig;
  filterToolsForPlanMode(tools: AgentToolDefinition[]): AgentToolDefinition[];
  requiresConfirmation(toolName: string): boolean;
  getModeHistory(): Array<{ from: Mode; to: Mode; timestamp: Date }>;
}
```

**Mode behaviors:**

| Mode | Read-only | Auto-execute | Confirmation |
|------|-----------|--------------|--------------|
| `plan` | Yes | Configurable | Always |
| `build` | No | Configurable | Configurable |
| `yolo` | No | Yes | Never |
| `default` | No | No | For destructive tools |

---

## Agents

### `BaseAgent`

Base class for all agents.

```typescript
abstract class BaseAgent {
  name: string;
  description: string;
  systemPrompt: string;

  abstract run(input: string, context?: AgentContext): Promise<AgentResult>;
}
```

### Built-in Agents

| Agent | Purpose |
|-------|---------|
| `DefaultAgent` | General-purpose agent with full tool access |
| `ExploreAgent` | Codebase exploration (read-only) |
| `PlanAgent` | Planning and analysis (read-only) |

---

## Subagents

### `SubagentRegistry`

Registry for custom subagent definitions.

```typescript
class SubagentRegistry {
  register(definition: SubagentDefinition): void;
  get(name: string): SubagentDefinition | undefined;
  getAll(): SubagentDefinition[];
  has(name: string): boolean;
  remove(name: string): boolean;
}
```

### `SubagentRunner`

Executes subagent tasks.

```typescript
class SubagentRunner {
  constructor(registry: SubagentRegistry, provider: LLMProvider);

  run(task: SubagentTask, options?: SubagentRunOptions): Promise<SubagentRunResult>;
}
```

### `SubagentOrchestrator`

DAG-based orchestrator for parallel subagent execution.

```typescript
class SubagentOrchestrator {
  constructor(registry: SubagentRegistry, provider: LLMProvider);

  execute(nodes: SubagentNode[]): Promise<OrchestratorResult>;
}
```

**Built-in subagents:**

| Name | Description |
|------|-------------|
| `explore` | Codebase exploration |
| `research` | Research and analysis |
| `builder` | Code implementation |
| `reviewer` | Code review |
| `planner` | Task planning |

---

## Skills

### `SkillLoader`

Loads skills from SKILL.md files.

```typescript
class SkillLoader {
  loadFromDirectory(dir: string, scope: SkillScope, source: string): Skill[];
  loadFromSources(sources: Array<{ dir: string; scope: SkillScope; source: string }>): Skill[];
}
```

### `SkillRegistry`

Registry with precedence: built-in < client < project.

```typescript
class SkillRegistry {
  register(skill: Skill): void;
  get(name: string): Skill | undefined;
  getAll(): Skill[];
  has(name: string): boolean;
  remove(name: string): boolean;
  search(options: SkillSearchOptions): Skill[];
  getByScope(scope: SkillScope): Skill[];
  getDescriptions(): string;
}
```

### `SkillInvoker`

Invokes skills with argument substitution.

```typescript
class SkillInvoker {
  invoke(skill: Skill, invocation: SkillInvocation): SkillInvocationResult;
  invokeWithTimeout(skill: Skill, invocation: SkillInvocation, timeout: number): SkillInvocationResult;
  validateArguments(skill: Skill, args: Record<string, string>): string[];
}
```

**Available variables:**

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments joined by space |
| `$ARGUMENTS[N]` | Nth argument (0-indexed) |
| `$WORKING_DIR` | Current working directory |
| `$SESSION_ID` | Current session ID |
| `$CLIENT_ID` | Client name |
| `$MODE` | Current mode |

**SKILL.md format:**

```markdown
---
name: deploy
description: Deploy to production
disable-model-invocation: true
allowed-tools: Bash(git *) Bash(npm *)
context: fork
---

Deploy $ARGUMENTS to production:

1. Run tests: `npm test`
2. Build: `npm run build`
3. Deploy: `./scripts/deploy.sh $ARGUMENTS`
```

---

## MCP (Model Context Protocol)

### `MCPClient`

Client for connecting to MCP servers.

```typescript
class MCPClient {
  constructor(config: MCPServerConfig);

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  listTools(): Promise<MCPTool[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
}
```

### `MCPToolSearch`

Lazy tool search with TTL cache.

```typescript
class MCPToolSearch {
  constructor(servers: MCPServerConfig[]);

  search(query: string): Promise<MCPTool[]>;
  getToolsForServer(serverName: string): Promise<MCPTool[]>;
  invalidateCache(serverName?: string): void;
}
```

### `createTransport`

Factory for MCP transports.

```typescript
function createTransport(config: MCPServerConfig): MCPTransport;
```

**Supported transports:**

| Type | Class | Use case |
|------|-------|----------|
| `stdio` | `StdioTransport` | Local processes |
| `http` | `HTTPTransport` | Remote servers |
| `sse` | `SSETransport` | Server-sent events |

---

## Memory

### `MemoryManager`

File-based memory management (MEMORY.md).

```typescript
class MemoryManager {
  constructor(config: AutoMemoryConfig, memoryDir: string);

  load(): string;
  save(content: string): void;
  append(content: string): void;
  clear(): void;
  getStats(): MemoryStats;
  addEntry(id: string, content: string, type: string): void;
  removeEntry(id: string): void;
  compact(): void;
  learnFromSession(sessionId: string, learnings: string[]): void;
  updateSection(sectionName: string, content: string): void;
  getSection(sectionName: string): string | null;
}
```

### `VectorMemoryManager`

Vector-based semantic memory (Qdrant/Pinecone).

```typescript
class VectorMemoryManager {
  constructor(config: VectorStoreConfig);

  search(query: string, options?: VectorSearchOptions): Promise<VectorSearchResult[]>;
  addDocument(doc: VectorDocument): Promise<void>;
  addDocuments(docs: VectorDocument[]): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  getStats(): Promise<VectorStats>;
}
```

### `DocumentIndexer`

Indexes documents from various sources.

```typescript
class DocumentIndexer {
  constructor(config: IndexerConfig, embedder: Embedder, store: VectorStore);

  indexLocal(path: string, patterns: string[]): Promise<void>;
  indexWeb(urls: string[]): Promise<void>;
  indexConfluence(url: string, spaces: string[], auth?: string): Promise<void>;
}
```

---

## Branding

### `BrandingLoader`

Loads branding assets from client directory.

```typescript
class BrandingLoader {
  static load(clientDir: string, config: BrandingConfig): BrandingAssets;
  static renderLogo(assets: BrandingAssets): string;
}
```

### `BrandingRenderer`

Renders branded output with colors.

```typescript
class BrandingRenderer {
  constructor(colors: BrandingColors);

  colorize(text: string, color: string): string;
  bold(text: string): string;
  dim(text: string): string;
  italic(text: string): string;
}
```

### `BrandManager`

High-level branding interface.

```typescript
class BrandManager {
  constructor(config: BrandingConfig, clientDir: string);

  renderHeader(name: string, version: string): string;
  renderWelcome(name: string, version: string): string;
  renderError(message: string): string;
  renderSuccess(message: string): string;
  renderGoodbye(): string;
  getTheme(): ThemePreset;
  getRenderer(): BrandingRenderer;
}
```

**Theme presets:**

| Theme | Voice tone | Greeting |
|-------|-----------|----------|
| `professional` | Formal | "Welcome" |
| `casual` | Friendly | "Hey there" |
| `technical` | Precise | "Ready" |

---

## Tools

### `createAllTools`

Creates all available tools for the agent.

```typescript
function createAllTools(config: ToolsConfig): AgentToolDefinition[];
```

### `createReadOnlyTools`

Creates read-only tools (for plan mode).

```typescript
function createReadOnlyTools(config: ToolsConfig): AgentToolDefinition[];
```

**Read-only tools:** `read`, `glob`, `grep`, `list-files`, `file-info`

### `createSkillTool`

Creates a tool for invoking skills.

```typescript
function createSkillTool(registry: SkillRegistry, invoker: SkillInvoker): AgentToolDefinition;
```

### `createMCPTools`

Creates tools from MCP server connections.

```typescript
function createMCPTools(clients: MCPClient[]): AgentToolDefinition[];
```

---

## Types

### `ClientConfig`

```typescript
interface ClientConfig {
  name: string;
  command: string;
  version: string;
  description: string;
  llm: LLMConfig;
  modes: ModesConfig;
  memory: MemoryConfig;
  mcp: MCPConfig;
  branding: BrandingConfig;
}
```

### `Mode`

```typescript
type Mode = "plan" | "build" | "yolo" | "default";
```

### `Session`

```typescript
interface Session {
  id: string;
  clientId: string;
  mode: string;
  messages: Message[];
  contextWindow: ContextWindow;
  createdAt: Date;
  updatedAt: Date;
}
```

### `Message`

```typescript
interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  timestamp: Date;
}
```

### `Skill`

```typescript
interface Skill {
  name: string;
  description: string;
  path: string;
  content: string;
  frontmatter: SkillFrontmatter;
  scope: SkillScope;
  source: string;
  loadedAt: Date;
}
```

### `SkillScope`

```typescript
type SkillScope = "built-in" | "client" | "project";
```
