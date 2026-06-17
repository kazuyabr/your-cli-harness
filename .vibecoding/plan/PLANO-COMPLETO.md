# 📋 PLANO COMPLETO: Your CLI Harness ("Jogatinando")

## 1. VISÃO ESTRATÉGICA

### 1.1 O Problema
Empresas precisam de CLIs de IA personalizadas (como CodeWhale, OpenCode) mas:
- **Confluence/wiki é ineficiente** para agentes (não indexável, sem semântica)
- **Tokens são caros** — contexto mal gerenciado = desperdício
- **Cada empresa tem identidade própria** — marca, tom, processos
- **Reinventar a roda** para cada cliente é inviável

### 1.2 A Solução
**Your CLI Harness** = framework white-label que gera CLIs de IA completas com:
- Branding configurável (nome, logo ASCII, cores, tom de voz)
- Agentes, subagentes e modos customizáveis
- Memória indexável (Qdrant/Pinecone) para docs corporativos
- MCP para integrações externas
- Compressão inteligente de contexto (headroom)
- Skills como unidades de conhecimento reutilizáveis

### 1.3 Cliente Inicial: **Jogatinando**
Primeiro caso de uso — prova de conceito da harness.

---

## 2. ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENTE FINAL                               │
│                    $ jogatinando "tarefa"                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   YOUR CLI HARNESS CORE                          │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ CLI Engine   │  │ Config       │  │ Session & Context      │ │
│  │ (Parser,     │  │ Manager      │  │ Manager                │ │
│  │  Dispatcher) │  │ (YAML/Zod)   │  │ (Janela, Compaction)   │ │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬────────────┘ │
│         │                │                       │              │
│  ┌──────▼────────────────▼───────────────────────▼────────────┐ │
│  │                  ORCHESTRATOR                               │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │ │
│  │  │ Plan     │  │ Build    │  │ YOLO     │  │ Default    │ │ │
│  │  │ Mode     │  │ Mode     │  │ Mode     │  │ Agent      │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘ │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐ │
│  │              SUBAGENT ENGINE                                │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │ │
│  │  │ Explore  │  │ Research │  │ Builder  │  │ Reviewer   │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Headroom    │  │ MCP Client   │  │ Memory Manager         │ │
│  │ Compressor  │  │ (Multi-Server│  │ (Qdrant/Pinecone/      │ │
│  │             │  │  Support)    │  │  Obsidian/SQLite)      │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   SKILLS ENGINE                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │ │
│  │  │ Plan     │  │ Build    │  │ Review   │  │ Custom     │ │ │
│  │  │ Skill    │  │ Skill    │  │ Skill    │  │ Skills...  │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     PLATAFORMA DE IA                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │Anthropic │  │ OpenAI   │  │ Azure    │  │ Custom LLM     │  │
│  │ Claude   │  │ GPT      │  │ OpenAI   │  │ (via adapter)  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. ESTRUTURA DE DIRETÓRIOS

```
your-cli-harness/
├── src/
│   ├── core/                          # NÚCLEO (nunca toca em marca)
│   │   ├── cli/
│   │   │   ├── parser.ts              # Parse de argumentos
│   │   │   ├── dispatcher.ts          # Roteamento de comandos
│   │   │   ├── renderer.ts            # Output formatado (chalk/ink)
│   │   │   └── commands/              # Comandos built-in
│   │   │       ├── help.ts
│   │   │       ├── init.ts
│   │   │       ├── config.ts
│   │   │       └── status.ts
│   │   ├── config/
│   │   │   ├── loader.ts              # Carrega client.config.yaml
│   │   │   ├── schema.ts              # Validação Zod
│   │   │   └── defaults.ts            # Defaults globais
│   │   ├── context/
│   │   │   ├── session.ts             # Gerenciamento de sessão
│   │   │   ├── window.ts              # Janela de contexto (tokens)
│   │   │   ├── compaction.ts          # Lógica de /compact
│   │   │   └── headroom.ts            # Monitoramento de headroom
│   │   ├── orchestrator/
│   │   │   ├── agent-loop.ts          # Loop principal do agente
│   │   │   ├── modes/
│   │   │   │   ├── plan.ts            # Modo Planejamento
│   │   │   │   ├── build.ts           # Modo Construção
│   │   │   │   ├── yolo.ts            # Modo YOLO (sem confirmação)
│   │   │   │   └── default.ts         # Modo padrão
│   │   │   └── subagent-spawner.ts    # Criação de subagentes
│   │   ├── agents/
│   │   │   ├── base-agent.ts          # Classe base
│   │   │   ├── default-agent.ts       # Agente padrão
│   │   │   ├── explore-agent.ts       # Agente de exploração
│   │   │   └── plan-agent.ts          # Agente de planejamento
│   │   ├── subagents/
│   │   │   ├── registry.ts            # Registro de subagentes
│   │   │   ├── runner.ts              # Executor
│   │   │   └── types.ts               # Tipos e interfaces
│   │   ├── skills/
│   │   │   ├── engine.ts              # Motor de skills
│   │   │   ├── loader.ts              # Carrega SKILL.md
│   │   │   ├── registry.ts            # Registro de skills
│   │   │   └── builtin/               # Skills built-in
│   │   │       ├── plan/
│   │   │       ├── build/
│   │   │       ├── review/
│   │   │       └── debug/
│   │   ├── mcp/
│   │   │   ├── client.ts              # Cliente MCP
│   │   │   ├── registry.ts            # Registro de servidores
│   │   │   ├── transports/
│   │   │   │   ├── stdio.ts
│   │   │   │   ├── http.ts
│   │   │   │   └── ws.ts
│   │   │   └── tool-search.ts         # Busca lazy de tools
│   │   ├── memory/
│   │   │   ├── manager.ts             # Gerenciador de memória
│   │   │   ├── auto-memory.ts         # Memória automática (estilo Claude)
│   │   │   ├── vector/                # Memória vetorial
│   │   │   │   ├── qdrant-adapter.ts
│   │   │   │   ├── pinecone-adapter.ts
│   │   │   │   └── base-adapter.ts
│   │   │   └── sqlite-adapter.ts      # Fallback SQLite
│   │   ├── llm/
│   │   │   ├── provider.ts            # Interface de provider
│   │   │   ├── anthropic.ts           # Adapter Anthropic
│   │   │   ├── openai.ts              # Adapter OpenAI
│   │   │   └── factory.ts             # Factory de providers
│   │   └── branding/
│   │       ├── renderer.ts            # Renderiza logo/cores
│   │       ├── loader.ts              # Carrega assets do cliente
│   │       └── types.ts               # Tipos de branding
│   │
│   ├── clients/                       # DEFINIÇÕES DE CLIENTES
│   │   └── jogatinando/
│   │       ├── config.yaml            # Config completa do cliente
│   │       ├── branding/
│   │       │   ├── logo.txt           # Logo ASCII
│   │       │   ├── colors.json        # Paleta de cores
│   │       │   └── theme.json         # Tema (tom de voz, etc)
│   │       ├── agents/
│   │       │   ├── code-reviewer.md
│   │       │   ├── architect.md
│   │       │   └── deployer.md
│   │       ├── skills/
│   │       │   ├── deploy/
│   │       │   ├── review-pr/
│   │       │   └── sprint-planning/
│   │       ├── mcp.json               # Servidores MCP do cliente
│   │       ├── CLAUDE.md              # Instruções persistentes
│   │       └── memory/                # Memória inicial do cliente
│   │
│   └── shared/                        # UTILITÁRIOS
│       ├── types.ts
│       ├── logger.ts
│       ├── errors.ts
│       └── utils.ts
│
├── templates/                         # TEMPLATES PARA NOVOS CLIENTES
│   ├── minimal/                       # Cliente mínimo
│   ├── standard/                      # Cliente padrão
│   └── enterprise/                    # Cliente enterprise
│
├── .vibecoding/                       # CONTEXTO PARA IA (fonte de verdade)
│   ├── intent/
│   │   ├── vision.md
│   │   └── product_scope.md
│   ├── architecture/
│   │   ├── architecture.md
│   │   └── system_map.md
│   ├── decisions/
│   │   ├── decisions.md
│   │   ├── invariants.md
│   │   └── anti_patterns.md
│   ├── context/
│   │   ├── dependencies.md
│   │   └── domain_mode.md
│   ├── plan/
│   │   └── PLANO-COMPLETO.md          # Este arquivo
│   └── learn/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. REGRAS DE NEGÓCIO

| ID | Regra | Descrição |
|---|---|---|
| BR-001 | **Identidade Dinâmica** | Nome, logo, cores e tom são definidos em `client.config.yaml` e injetados no runtime |
| BR-002 | **Isolamento de Core** | `src/core/` NUNCA contém lógica específica de cliente |
| BR-003 | **Fallback Inteligente** | Comandos não reconhecidos vão para o `DefaultAgent` |
| BR-004 | **Headroom Obrigatório** | Todo prompt passa pelo módulo `headroom` antes de ir para a LLM |
| BR-005 | **MCP Extensível** | Cliente define servidores MCP em `mcp.json` — carregados dinamicamente |
| BR-006 | **Memória Indexável** | Docs corporativos (Confluence, etc) são indexados via Qdrant/Pinecone |
| BR-007 | **Skills Sobreponíveis** | Skills do cliente sobrescrevem built-in com mesmo nome |
| BR-008 | **Modos Configuráveis** | Plan, Build, YOLO e custom modes são definidos pelo cliente |
| BR-009 | **Multi-Provider** | Suporte a Anthropic, OpenAI, Azure via adapters |
| BR-010 | **Compaction Automático** | Ao atingir 80% da janela, compactação é sugerida/executada |

---

## 5. SISTEMA DE MODOS

### 5.1 Modo Plan (Planejamento)
- **Uso**: Tarefas complexas que precisam de análise antes de implementação
- **Comportamento**: Read-only, explora, propõe, NÃO implementa sem aprovação
- **Configurável**: Cliente define o que o Plan pode/não pode fazer
- **Output**: Lista de arquivos a criar/modificar, arquitetura proposta, riscos

### 5.2 Modo Build (Construção)
- **Uso**: Implementação direta com validação
- **Comportamento**: Executa plano completo, roda testes, reporta resultado
- **Configurável**: Se inclui testes, lint, deploy automático
- **Output**: Código implementado, testes passando, relatório de build

### 5.3 Modo YOLO
- **Uso**: Hotfixes e tarefas urgentes
- **Comportamento**: Sem prompts de confirmação, execução direta
- **Configurável**: Cliente decide se YOLO está ativo e quais permissões tem
- **Output**: Execução rápida com log pós-ação

### 5.4 Modo Default
- Modo interativo padrão
- Pergunta antes de ações destrutivas
- Usa subagentes para tarefas pesadas

---

## 6. SISTEMA DE MEMÓRIA

### 6.1 Camadas de Memória

| Camada | Conteúdo | Tokens (aprox) | Carregamento |
|---|---|---|---|
| 1. Sistema Prompt | Instruções core do harness | ~4,200 | Sempre |
| 2. CLAUDE.md | Arquitetura, convenções do cliente | ~1,800 | Sempre |
| 3. Auto Memory | Aprendizados anteriores | ~680 | Sempre (200 linhas/25KB) |
| 4. Skills | Descrições disponíveis | ~450 | Sob demanda |
| 5. MCP Tools | Definições de ferramentas | Deferred | ToolSearch |
| 6. Vetorial | Docs corporativos indexados | Variável | Busca semântica |

### 6.2 Fluxo de Indexação de Docs Corporativos

```
Confluence/Wiki/PDFs
        │
        ▼
┌──────────────────┐
│  Indexer Skill   │  ← Skill que o cliente ativa
│  (MCP + Embed)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Chunker         │  ← Divide docs em chunks semânticos
│  (overlap=200)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Embedder        │  ← Gera embeddings (OpenAI/Cohere)
│  (text-3-small)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Qdrant/Pinecone │  ← Armazena vetores + metadata
│  (Collection)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Runtime Search  │  ← Busca semântica durante sessão
│  (top-k=5)       │
└──────────────────┘
```

### 6.3 Configuração de Memória (cliente define)

```yaml
memory:
  auto:
    enabled: true
    max_lines: 200
    max_kb: 25
  
  vector:
    provider: qdrant  # qdrant | pinecone | none
    qdrant:
      url: ${QDRANT_URL}
      collection: "jogatinando-docs"
      api_key: ${QDRANT_API_KEY}
    pinecone:
      api_key: ${PINECONE_API_KEY}
      environment: "us-east-1"
      index: "jogatinando-docs"
  
  indexer:
    sources:
      - type: confluence
        url: "https://empresa.atlassian.net"
        spaces: ["ENG", "PROD"]
        auth: ${CONFLUENCE_TOKEN}
      - type: local
        path: "./docs"
        patterns: ["**/*.md", "**/*.pdf"]
      - type: web
        urls: ["https://docs.empresa.com"]
    
    schedule: "0 2 * * *"  # Indexação diária às 2h
    chunk_size: 1000
    overlap: 200
```

---

## 7. SISTEMA DE SKILLS

### 7.1 Skills Built-in (Core)

| Skill | Descrição | Invocação |
|---|---|---|
| `/plan` | Analisa e propõe plano de implementação | Auto + manual |
| `/build` | Implementa com validação | Auto + manual |
| `/review` | Review de código/PR | Auto + manual |
| `/debug` | Debug de erros e testes | Auto + manual |
| `/compact` | Compacta contexto | Manual apenas |
| `/index-docs` | Indexa docs corporativos | Manual apenas |
| `/memory` | Gerencia memória do agente | Manual apenas |
| `/status` | Status da sessão e conexões | Manual apenas |

### 7.2 Formato de Skill (SKILL.md)

```yaml
---
name: deploy
description: Deploy para produção com validação completa
disable-model-invocation: true  # Só o usuário invoca
allowed-tools: Bash(git *) Bash(npm *) Bash(docker *)
context: fork  # Roda em subagente isolado
---

Deploy $ARGUMENTS para produção:

1. Run test suite: `npm test`
2. Build: `npm run build`
3. Docker build: `docker build -t jogatinando:$ARGUMENTS .`
4. Push: `docker push registry/jogatinando:$ARGUMENTS`
5. Deploy: `kubectl set image deployment/jogatinando jogatinando=registry/jogatinando:$ARGUMENTS`
6. Verify: `kubectl rollout status deployment/jogatinando`
7. Report resultado
```

---

## 8. SISTEMA MCP

### 8.1 Servidores MCP Built-in

| Server | Tipo | Propósito |
|---|---|---|
| `filesystem` | stdio | Leitura/escrita de arquivos locais |
| `git` | stdio | Operações git |
| `sqlite` | stdio | Queries em bancos SQLite |
| `web-fetch` | stdio | Fetch de páginas web |
| `memory-vector` | stdio | Busca vetorial (Qdrant/Pinecone) |

### 8.2 Servidores MCP do Cliente (exemplo Jogatinando)

```json
{
  "mcpServers": {
    "jira": {
      "type": "http",
      "url": "https://mcp.atlassian.com/mcp",
      "oauth": {
        "scopes": "read:jira-work write:jira-work"
      }
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${GITHUB_TOKEN}"
      }
    },
    "confluence-indexer": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@your-harness/confluence-mcp"],
      "env": {
        "CONFLUENCE_URL": "${CONFLUENCE_URL}",
        "QDRANT_URL": "${QDRANT_URL}"
      }
    },
    "monitoring": {
      "type": "http",
      "url": "https://mcp.datadoghq.com/mcp",
      "headers": {
        "DD-API-KEY": "${DATADOG_API_KEY}"
      }
    }
  }
}
```

---

## 9. MÓDULO HEADROOM (Compressão Inteligente)

### 9.1 Estratégia de Context Window

| Nível | Tokens | Ação |
|---|---|---|
| 🟢 Seguro | 0-60% | Operação normal |
| 🟡 Atenção | 60-80% | Alerta, sugere compactação |
| 🔴 Crítico | 80-95% | Compactação automática |
| 🚨 Emergência | 95%+ | Truncamento agressivo + resumo |

### 9.2 Algoritmo de Compaction

```
PRESERVAR SEMPRE:
  ✅ System prompt
  ✅ CLAUDE.md do cliente
  ✅ Auto memory (MEMORY.md)
  ✅ MCP tool definitions
  ✅ Skills invocadas (conteúdo)

RESUMIR:
  📝 Histórico de conversa → ~12% do tamanho original
  📝 Manter: intente do usuário, conceitos-chave, arquivos modificados, erros resolvidos, tarefas pendentes

DESCARTAR:
  ❌ Outputs intermediários de ferramentas
  ❌ Skills não invocadas (descrições)
  ❌ Conteúdo detalhado de subagentes (manter apenas resumo)
```

---

## 10. ONBOARDING DO CLIENTE (Questionário)

A harness pergunta ao cliente durante `harness init`:

```
🎯 YOUR CLI HARNESS - Setup Inicial

? Nome da sua CLI: jogatinando
? Comando de execução: jogatinando
? Provedor LLM principal: (Anthropic / OpenAI / Azure)
? Modelo padrão: (claude-sonnet-4 / gpt-4o / ...)

📋 MODOS
? Ativar modo Plan? (Y/n) → Y
  ? O modo Plan pode propor mudanças? (Y/n) → Y
  ? O modo Plan pode executar mudanças? (y/N) → N
? Ativar modo Build? (Y/n) → Y
  ? Build inclui testes automáticos? (Y/n) → Y
  ? Build inclui deploy? (y/N) → N
? Ativar modo YOLO? (y/N) → N
  ? YOLO requer confirmação para ações destrutivas? (Y/n) → Y

🧠 MEMÓRIA
? Usar memória automática? (Y/n) → Y
? Indexar documentos corporativos? (Y/n) → Y
  ? Fonte: (Confluence / Local / Web / Todas)
  ? Provedor vetorial: (Qdrant / Pinecone / Nenhum)
  ? URL do Qdrant: https://qdrant.empresa.com

🔧 MCP
? Conectar GitHub? (Y/n) → Y
? Conectar Jira? (Y/n) → Y
? Conectar banco de dados? (y/N) → N
? Outros servidores MCP? (y/N) → N

🎨 BRANDING
? Logo ASCII customizada? (y/N) → N (usa padrão)
? Cores customizadas? (y/N) → N (usa padrão)
? Tom de voz: (profissional / casual / técnico) → profissional

✅ Configuração completa!
   → clients/jogatinando/config.yaml criado
   → Execute: harness build-client jogatinando
```

---

## 11. CRITÉRIOS DE ACEITE

| ID | Critério | Verificação |
|---|---|---|
| AC-001 | `$ jogatinando --help` mostra logo e nome customizados | E2E test |
| AC-002 | `$ jogatinando "tarefa"` processa via DefaultAgent com headroom | Integration test |
| AC-003 | Modo Plan analisa sem executar (read-only) | Unit + E2E |
| AC-004 | Modo Build implementa e valida com testes | Integration test |
| AC-005 | Modo YOLO executa sem confirmações intermediárias | E2E test |
| AC-006 | MCP server conecta e tools ficam disponíveis | Integration test |
| AC-007 | Skill customizada do cliente sobrescreve built-in | Unit test |
| AC-008 | Memória automática persiste entre sessões | Integration test |
| AC-009 | Busca vetorial retorna docs relevantes | Integration test |
| AC-010 | Compaction preserva instruções e resume conversa | Unit test |
| AC-011 | Subagentes executam em paralelo e retornam resumo | Integration test |
| AC-012 | `harness create-client novo` gera estrutura completa | E2E test |
| AC-013 | `harness build-client jogatinando` gera binário standalone | E2E test |
| AC-014 | Indexação de Confluence cria embeddings no Qdrant | Integration test |
| AC-015 | Headroom alerta a 80% e compacta a 95% | Unit test |
| AC-016 | Troca de modelo LLM via config funciona | Integration test |
| AC-017 | Core não contém referência a nenhum cliente específico | Static analysis |

---

## 12. ROADMAP DE IMPLEMENTAÇÃO

| Fase | Escopo | Dependências |
|---|---|---|
| **Fase 0** | Setup: package.json, tsconfig, ESLint, estrutura de pastas | — |
| **Fase 1** | Core CLI Engine: parser, dispatcher, renderer | Fase 0 |
| **Fase 2** | Config Manager: loader YAML, validação Zod, defaults | Fase 0 |
| **Fase 3** | Session & Context Manager: janela, tokens, compaction | Fase 1 |
| **Fase 4** | LLM Provider: adapter Anthropic + streaming | Fase 1 |
| **Fase 5** | Agent Loop: orquestração, tool use, multi-turn | Fase 3, 4 |
| **Fase 6** | Subagent Engine: spawn, parallel, resultados | Fase 5 |
| **Fase 7** | Skills Engine: loader, registry, invocation | Fase 5 |
| **Fase 8** | MCP Client: stdio, http, tool search, OAuth | Fase 5 |
| **Fase 9** | Memory Manager: auto-memory, MEMORY.md | Fase 3 |
| **Fase 10** | Vector Memory: Qdrant adapter, indexer skill | Fase 8, 9 |
| **Fase 11** | Modes: Plan, Build, YOLO, Default | Fase 5, 6 |
| **Fase 12** | Branding: logo, cores, tema | Fase 2 |
| **Fase 13** | Client Generator: `harness create-client`, `harness build-client` | Todas anteriores |
| **Fase 14** | Onboarding: questionário interativo | Fase 13 |
| **Fase 15** | Testes: unit, integration, E2E | Todas |
| **Fase 16** | Documentação: API, guia de cliente, exemplos | Todas |

---

## 13. STACK TECNOLÓGICO

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Runtime | Node.js 20+ / TypeScript | Ecossistema maduro, tipos seguros |
| CLI Framework | `commander.js` + `ink` (React para TUI) | Simples + UI rica no terminal |
| Validação | `zod` | Type-safe, mensagens claras |
| LLM SDK | `@anthropic-ai/sdk` + `openai` | Suporte multi-provider |
| MCP SDK | `@modelcontextprotocol/sdk` | SDK oficial do protocolo |
| Vector DB | `qdrant-client` / `pinecone-client` | Performance, filtros avançados |
| Embeddings | `openai/text-embedding-3-small` | Custo-benefício |
| SQLite | `better-sqlite3` | Memória local, zero config |
| Build | `esbuild` + `pkg` | Binário standalone |
| Testes | `vitest` + `playwright` | Rápido + E2E real |
| Linting | `eslint` + `prettier` | Consistência |

---

## 14. DECISÕES ARQUITETURAIS

| Decisão | Escolha | Razão |
|---|---|---|
| Linguagem | TypeScript | Type-safe, ecossistema LLM em JS/TS |
| CLI Framework | commander.js (não oclif) | Mais leve, menos abstração |
| MCP Transport | stdio优先, HTTP secundário | Local tools via stdio, cloud via HTTP |
| Vector DB | Qdrant como default | Open source, self-hostable, filtros |
| Compaction | Automática a 95%, sugestão a 80% | Baseado no comportamento do Claude Code |
| Skills | Formato SKILL.md (compatível Claude) | Padrão aberto, portabilidade |
| Memory | Auto-memory + vetorial (camadas) | Complementar: local + semântico |
| Build target | Binário standalone via pkg | Distribuição simples, sem Node necessário |

---

## 15. REFERÊNCIAS

- [Anthropic: Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Padrões de agentes (workflow, routing, parallelization, orchestrator-workers, evaluator-optimizer)
- [Claude Code Docs: Overview](https://code.claude.com/docs/en/overview) — Arquitetura de CLI agentica
- [Claude Code Docs: Memory](https://code.claude.com/docs/en/memory) — Sistema CLAUDE.md + auto memory
- [Claude Code Docs: Skills](https://code.claude.com/docs/en/skills) — Formato SKILL.md, frontmatter, dynamic context
- [Claude Code Docs: Subagents](https://code.claude.com/docs/en/sub-agents) — Built-in agents, custom agents, fork, memory
- [Claude Code Docs: MCP](https://code.claude.com/docs/en/mcp) — Model Context Protocol, transports, OAuth, tool search
- [Claude Code Docs: Context Window](https://code.claude.com/docs/en/context-window) — Visualização de contexto, compaction
- [Model Context Protocol Spec](https://modelcontextprotocol.io) — Especificação do protocolo MCP
- [Qdrant](https://qdrant.tech) — Vector database para memória semântica
- [Pinecone](https://pinecone.io) — Vector database alternativo

---

*Plano criado em: 2026-06-17*
*Versão: 1.0*
*Status: Aprovado para implementação*
