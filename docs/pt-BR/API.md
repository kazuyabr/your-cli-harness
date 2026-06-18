# Your CLI Harness — Referência da API

## Import

```typescript
import {
  // Configuração
  ConfigLoader,
  ClientConfigSchema,

  // Sessão e Contexto
  TokenCounter,
  SessionManager,
  ContextWindowManager,
  CompactionEngine,
  HeadroomMonitor,

  // Provedores LLM
  LLMFactory,
  AnthropicProvider,
  OpenAIProvider,
  AzureOpenAIProvider,

  // Agent Loop e Modos
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

  // Memória
  MemoryManager,
  VectorMemoryManager,
  QdrantAdapter,
  PineconeAdapter,

  // Branding
  BrandingLoader,
  BrandingRenderer,
  BrandManager,

  // Ferramentas
  createAllTools,
  createReadOnlyTools,
  createSkillTool,
  createMCPTools,
} from "your-cli-harness";
```

---

## Configuração

### `ConfigLoader`

Carrega e valida `config.yaml` de um diretório de cliente.

```typescript
class ConfigLoader {
  static load(clientDir: string): ClientConfig;
}
```

**Uso:**

```typescript
const config = ConfigLoader.load("/caminho/para/clients/jogatinando");
// Retorna ClientConfig validado com padrões aplicados
```

**Estrutura da configuração (`ClientConfig`):**

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

## Sessão e Contexto

### `TokenCounter`

Estima contagem de tokens para conteúdo de texto.

```typescript
class TokenCounter {
  static estimate(text: string): number;
  static estimateMessages(messages: Message[]): number;
}
```

### `SessionManager`

Gerencia sessões de conversa com persistência.

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

**Uso:**

```typescript
const sessionManager = new SessionManager();
const session = sessionManager.create("jogatinando", { mode: "plan" });

sessionManager.addMessage(session.id, {
  role: "user",
  content: "Analise o codebase",
  timestamp: new Date(),
});

const usage = sessionManager.getUsagePercent(session.id);
```

### `ContextWindowManager`

Gerencia tamanho da janela de contexto e truncamento.

```typescript
class ContextWindowManager {
  constructor(maxTokens: number);

  calculateUsage(messages: Message[]): ContextWindow;
  truncateToFit(messages: Message[], maxTokens: number): Message[];
}
```

### `CompactionEngine`

Compacta histórico de conversa para reduzir uso de tokens.

```typescript
class CompactionEngine {
  constructor(options?: CompactionOptions);

  compact(messages: Message[]): CompactionResult;
  apply(session: Session): void;
}
```

**Comportamento da compactação:**
- Preserva: system prompts, CLAUDE.md, auto memory, definições de ferramentas MCP
- Resume: histórico de conversa (~12% do tamanho original)
- Descarta: saídas intermediárias de ferramentas, descrições de skills não utilizadas

### `HeadroomMonitor`

Monitora uso da janela de contexto e dispara compactação.

```typescript
class HeadroomMonitor {
  constructor(config: HeadroomConfig);

  check(session: Session): HeadroomStatus;
  autoCompact(session: Session, compactionEngine: CompactionEngine): boolean;
}
```

**Níveis de headroom:**

| Nível | Uso | Ação |
|-------|-----|------|
| Seguro | 0–60% | Operação normal |
| Atenção | 60–80% | Sugere compactação |
| Crítico | 80–95% | Auto-compacta |
| Emergência | 95%+ | Truncamento agressivo |

---

## Provedores LLM

### `LLMFactory`

Cria instâncias de provedores LLM a partir da configuração.

```typescript
class LLMFactory {
  static create(config: LLMConfig): LLMProvider;
}
```

**Provedores suportados:**

| Provedor | Classe | Valor `provider` na config |
|----------|--------|---------------------------|
| Anthropic Claude | `AnthropicProvider` | `"anthropic"` |
| OpenAI GPT | `OpenAIProvider` | `"openai"` |
| Azure OpenAI | `AzureOpenAIProvider` | `"azure"` |

**Uso:**

```typescript
const provider = LLMFactory.create({
  provider: "anthropic",
  model: "claude-sonnet-4-20250514",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await provider.complete({
  messages: [{ role: "user", content: "Olá" }],
  tools: [],
});
```

---

## Agent Loop

### `AgentLoop`

Loop principal de orquestração para execução de agents.

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

Gerencia modos de conversa (plan, build, yolo, default).

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

**Comportamentos dos modos:**

| Modo | Somente leitura | Auto-execução | Confirmação |
|------|-----------------|---------------|-------------|
| `plan` | Sim | Configurável | Sempre |
| `build` | Não | Configurável | Configurável |
| `yolo` | Não | Sim | Nunca |
| `default` | Não | Não | Para ferramentas destrutivas |

---

## Agents

### `BaseAgent`

Classe base para todos os agents.

```typescript
abstract class BaseAgent {
  name: string;
  description: string;
  systemPrompt: string;

  abstract run(input: string, context?: AgentContext): Promise<AgentResult>;
}
```

### Agents Built-in

| Agent | Propósito |
|-------|-----------|
| `DefaultAgent` | Agent de uso geral com acesso total a ferramentas |
| `ExploreAgent` | Exploração de codebase (somente leitura) |
| `PlanAgent` | Planejamento e análise (somente leitura) |

---

## Subagents

### `SubagentRegistry`

Registro de definições de subagents personalizados.

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

Executa tarefas de subagents.

```typescript
class SubagentRunner {
  constructor(registry: SubagentRegistry, provider: LLMProvider);

  run(task: SubagentTask, options?: SubagentRunOptions): Promise<SubagentRunResult>;
}
```

### `SubagentOrchestrator`

Orquestrador baseado em DAG para execução paralela de subagents.

```typescript
class SubagentOrchestrator {
  constructor(registry: SubagentRegistry, provider: LLMProvider);

  execute(nodes: SubagentNode[]): Promise<OrchestratorResult>;
}
```

**Subagents built-in:**

| Nome | Descrição |
|------|-----------|
| `explore` | Exploração de codebase |
| `research` | Pesquisa e análise |
| `builder` | Implementação de código |
| `reviewer` | Code review |
| `planner` | Planejamento de tarefas |

---

## Skills

### `SkillLoader`

Carrega skills de arquivos SKILL.md.

```typescript
class SkillLoader {
  loadFromDirectory(dir: string, scope: SkillScope, source: string): Skill[];
  loadFromSources(sources: Array<{ dir: string; scope: SkillScope; source: string }>): Skill[];
}
```

### `SkillRegistry`

Registro com precedência: built-in < client < project.

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

Invoca skills com substituição de argumentos.

```typescript
class SkillInvoker {
  invoke(skill: Skill, invocation: SkillInvocation): SkillInvocationResult;
  invokeWithTimeout(skill: Skill, invocation: SkillInvocation, timeout: number): SkillInvocationResult;
  validateArguments(skill: Skill, args: Record<string, string>): string[];
}
```

**Variáveis disponíveis:**

| Variável | Descrição |
|----------|-----------|
| `$ARGUMENTS` | Todos os argumentos juntos com espaço |
| `$ARGUMENTS[N]` | N-ésimo argumento (índice 0) |
| `$WORKING_DIR` | Diretório de trabalho atual |
| `$SESSION_ID` | ID da sessão atual |
| `$CLIENT_ID` | Nome do cliente |
| `$MODE` | Modo atual |

**Formato SKILL.md:**

```markdown
---
name: deploy
description: Deploy em produção
disable-model-invocation: true
allowed-tools: Bash(git *) Bash(npm *)
context: fork
---

Deploy $ARGUMENTS em produção:

1. Executar testes: `npm test`
2. Build: `npm run build`
3. Deploy: `./scripts/deploy.sh $ARGUMENTS`
```

---

## MCP (Model Context Protocol)

### `MCPClient`

Cliente para conexão com servidores MCP.

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

Busca lazy de ferramentas com cache TTL.

```typescript
class MCPToolSearch {
  constructor(servers: MCPServerConfig[]);

  search(query: string): Promise<MCPTool[]>;
  getToolsForServer(serverName: string): Promise<MCPTool[]>;
  invalidateCache(serverName?: string): void;
}
```

### `createTransport`

Factory para transportes MCP.

```typescript
function createTransport(config: MCPServerConfig): MCPTransport;
```

**Transportes suportados:**

| Tipo | Classe | Caso de uso |
|------|--------|-------------|
| `stdio` | `StdioTransport` | Processos locais |
| `http` | `HTTPTransport` | Servidores remotos |
| `sse` | `SSETransport` | Server-sent events |

---

## Memória

### `MemoryManager`

Gerenciamento de memória baseado em arquivos (MEMORY.md).

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

Memória semântica baseada em vetores (Qdrant/Pinecone).

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

Indexa documentos de várias fontes.

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

Carrega assets de branding do diretório do cliente.

```typescript
class BrandingLoader {
  static load(clientDir: string, config: BrandingConfig): BrandingAssets;
  static renderLogo(assets: BrandingAssets): string;
}
```

### `BrandingRenderer`

Renderiza saída com branding e cores.

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

Interface de branding de alto nível.

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

**Presets de tema:**

| Tema | Tom de voz | Saudação |
|------|-----------|----------|
| `professional` | Formal | "Bem-vindo" |
| `casual` | Amigável | "E aí" |
| `technical` | Preciso | "Pronto" |

---

## Ferramentas

### `createAllTools`

Cria todas as ferramentas disponíveis para o agent.

```typescript
function createAllTools(config: ToolsConfig): AgentToolDefinition[];
```

### `createReadOnlyTools`

Cria ferramentas somente leitura (para modo plan).

```typescript
function createReadOnlyTools(config: ToolsConfig): AgentToolDefinition[];
```

**Ferramentas somente leitura:** `read`, `glob`, `grep`, `list-files`, `file-info`

### `createSkillTool`

Cria ferramenta para invocar skills.

```typescript
function createSkillTool(registry: SkillRegistry, invoker: SkillInvoker): AgentToolDefinition;
```

### `createMCPTools`

Cria ferramentas a partir de conexões de servidores MCP.

```typescript
function createMCPTools(clients: MCPClient[]): AgentToolDefinition[];
```

---

## Tipos

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
