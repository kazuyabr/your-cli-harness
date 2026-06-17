# Architecture

## Visão Geral

O **Your CLI Harness** segue uma arquitetura modular em camadas, com separação clara entre o **core** (lógica reutilizável) e os **clientes** (configuração e identidade).

## Princípios Arquiteturais

1. **Core Isolado** — `src/core/` não conhece nenhum cliente específico
2. **Configuração sobre Código** — Clientes são definidos por config, não por fork
3. **Padrões Abertos** — Skills (SKILL.md), MCP, CLAUDE.md são padrões da indústria
4. **Simplicidade Primeiro** — Começar com o mais simples, adicionar complexidade quando necessário
5. **Contexto é Recurso Escasso** — Cada módulo deve otimizar uso de tokens

## Camadas

### 1. CLI Layer
```
parser.ts → dispatcher.ts → renderer.ts
```
- Parseia argumentos e comandos
- Despacha para o modo/agente correto
- Renderiza output com branding do cliente

### 2. Config Layer
```
loader.ts → schema.ts (Zod) → defaults.ts
```
- Carrega `client.config.yaml`
- Valida com schemas Zod
- Aplica defaults quando necessário

### 3. Context Layer
```
session.ts → window.ts → compaction.ts → headroom.ts
```
- Gerencia sessão e histórico
- Monitora janela de contexto (tokens)
- Compactação automática e sob demanda
- Alertas de headroom

### 4. Orchestrator Layer
```
agent-loop.ts → modes/ → subagent-spawner.ts
```
- Loop principal do agente (tool use, multi-turn)
- Modos: Plan, Build, YOLO, Default
- Criação e gestão de subagentes

### 5. Intelligence Layer
```
agents/ + subagents/ + skills/ + mcp/ + memory/
```
- Agentes especializados (Explore, Plan, Default)
- Subagentes paralelos
- Skills (conhecimento reutilizável)
- MCP (integrações externas)
- Memória (auto + vetorial)

### 6. Platform Layer
```
llm/ → provider.ts + anthropic.ts + openai.ts + factory.ts
```
- Abstração de provedor LLM
- Suporte multi-provider
- Streaming de respostas

## Fluxo de Execução

```
$ jogatinando "tarefa"
    │
    ▼
[CLI Parser] → identifica modo (default/plan/build/yolo)
    │
    ▼
[Config Loader] → carrega client.config.yaml
    │
    ▼
[Session Manager] → cria/recupera sessão, carrega CLAUDE.md + memory
    │
    ▼
[Headroom Check] → verifica espaço disponível
    │
    ▼
[Agent Loop] → seleciona agente/modo, inicia loop
    │
    ▼
[Tool Use] → Skills, MCP, Bash, Read, Write, Subagents...
    │
    ▼
[LLM Call] → envia contexto + tools para o modelo
    │
    ▼
[Response] → streaming output para o terminal
    │
    ▼
[Headroom Check] → monitora uso, sugere compaction se necessário
    │
    ▼
[Session End] → salva auto-memory, fecha conexões MCP
```

## Decisões Técnicas

| Decisão | Escolha | Razão |
|---|---|---|
| Linguagem | TypeScript | Type-safe, ecossistema LLM |
| CLI Framework | commander.js | Leve, flexível, menos abstração |
| Validação | Zod | Type-safe, mensagens claras |
| Vector DB Default | Qdrant | Open source, self-hostable |
| Skills Format | SKILL.md | Padrão aberto (Agent Skills) |
| Memory Format | MEMORY.md | Compatível com Claude Code |
| Build Tool | esbuild + pkg | Rápido, binário standalone |
| Test Framework | vitest + playwright | Rápido + E2E real |

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                     CLI LAYER                                │
│  Parser → Dispatcher → Renderer                             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   CONFIG LAYER                               │
│  Loader → Schema (Zod) → Defaults                           │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   CONTEXT LAYER                              │
│  Session → Window → Compaction → Headroom                   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  ORCHESTRATOR LAYER                          │
│  Agent Loop → Modes (Plan/Build/YOLO) → Subagent Spawner   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  INTELLIGENCE LAYER                          │
│  Agents + Subagents + Skills + MCP + Memory                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   PLATFORM LAYER                             │
│  LLM Provider (Anthropic/OpenAI/Azure) + Streaming          │
└─────────────────────────────────────────────────────────────┘
```

## Documentação Relacionada

- [System Map](./system_map.md) — Mapa detalhado do sistema
- [Vision](../intent/vision.md) — Visão estratégica
- [Product Scope](../intent/product_scope.md) — Escopo do produto
- [PLANO-COMPLETO](./PLANO-COMPLETO.md) — Plano completo
- [Decisions](../decisions/decisions.md) — Decisões arquiteturais
