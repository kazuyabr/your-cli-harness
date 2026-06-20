# Your CLI Harness — Arquitetura

## Visão Geral

Your CLI Harness é um framework white-label para construir ferramentas CLI com IA. Ele segue uma arquitetura modular com separação clara entre funcionalidades core e configurações específicas de cada cliente.

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     INTERFACE CLI                                │
│                   $ minha-ferramenta "tarefa"                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   MOTOR CLI                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Parser      │  │ Dispatcher   │  │ Renderer               │ │
│  │ (commander) │  │ (roteamento) │  │ (formatação de saída)  │ │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬────────────┘ │
│         │                │                       │              │
│  ┌──────▼────────────────▼───────────────────────▼────────────┐ │
│  │              CARREGADOR DE CONFIGURAÇÃO                     │ │
│  │              (YAML + validação Zod)                         │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      ORQUESTRADOR                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ Modo     │  │ Modo     │  │ Modo     │  │ Modo           │ │
│  │ Plan     │  │ Build    │  │ YOLO     │  │ Default        │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              GERENCIADOR DE MODOS                           ││
│  │      (filtragem de ferramentas, lógica de confirmação)      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      AGENT LOOP                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   PROVEDOR LLM                              ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ ││
│  │  │Anthropic │  │ OpenAI   │  │ Azure    │  │ Custom     │ ││
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    FERRAMENTAS                              ││
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ││
│  │  │ read   │ │ write  │ │ bash   │ │ grep   │ │ MCP      │ ││
│  │  │ write  │ │ edit   │ │ glob   │ │ skills │ │ Tools    │ ││
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                   MOTOR DE SUBAGENTS                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ Explore  │  │ Research │  │ Builder  │  │ Reviewer       │ │
│  │ (ler)    │  │ (analisar)│  │ (escrever)│  │ (validar)     │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              ORQUESTRADOR DAG                               ││
│  │      (execução paralela, resolução de dependências)         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                   GERENCIAMENTO DE CONTEXTO                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Gerenciador │  │ Gerenciador  │  │ Monitor de             │ │
│  │ de Sessão   │  │ de Janela    │  │ Headroom               │ │
│  │             │  │ de Contexto  │  │ (auto-compactação)     │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              MOTOR DE COMPACTAÇÃO                           ││
│  │      (resumir histórico, preservar contexto crítico)        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      CAMADA DE MEMÓRIA                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Auto Memory │  │ Memória      │  │ Indexador de           │ │
│  │ (MEMORY.md) │  │ Vetorial     │  │ Documentos             │ │
│  │             │  │ (Qdrant/     │  │ (local/web/            │ │
│  │             │  │  Pinecone)   │  │  confluence)           │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      MOTOR DE SKILLS                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Carregador  │  │ Registro de  │  │ Invocador de           │ │
│  │ de Skills   │  │ Skills       │  │ Skills                 │ │
│  │ (SKILL.md)  │  │ (precedência)│  │ (substituição)         │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              ESCOPOS DE SKILLS                              ││
│  │     built-in < client < project (maior prioridade)         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                       CAMADA MCP                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Cliente MCP │  │ Factory de   │  │ Busca de               │ │
│  │             │  │ Transporte   │  │ Ferramentas            │ │
│  │             │  │ (stdio/http) │  │ (lazy + cache TTL)     │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                     CAMADA DE BRANDING                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Carregador  │  │ Renderer     │  │ Presets de             │ │
│  │ de Branding │  │ (cores,      │  │ Tema                   │ │
│  │ (assets)    │  │  formatação) │  │ (professional/casual)  │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Diretórios

```
your-cli-harness/
├── src/
│   ├── core/                          # CORE (nunca específico de cliente)
│   │   ├── cli/                       # Interface CLI
│   │   │   ├── parser.ts
│   │   │   ├── dispatcher.ts
│   │   │   ├── renderer.ts
│   │   │   └── commands/              # Comandos built-in
│   │   ├── config/                    # Configuração
│   │   │   ├── loader.ts
│   │   │   ├── schema.ts
│   │   │   └── defaults.ts
│   │   ├── context/                   # Gerenciamento de contexto
│   │   │   ├── session.ts
│   │   │   ├── window.ts
│   │   │   ├── compaction.ts
│   │   │   └── headroom.ts
│   │   ├── orchestrator/              # Orquestração de agents
│   │   │   ├── agent-loop.ts
│   │   │   ├── modes/
│   │   │   └── subagent-spawner.ts
│   │   ├── agents/                    # Implementações de agents
│   │   ├── subagents/                 # Sistema de subagents
│   │   ├── skills/                    # Motor de skills
│   │   ├── mcp/                       # Integração MCP
│   │   ├── memory/                    # Sistemas de memória
│   │   ├── llm/                       # Provedores LLM
│   │   ├── tools/                     # Implementações de ferramentas
│   │   └── branding/                  # Sistema de branding
│   │
│   ├── clients/                       # DEFINIÇÕES DE CLIENTES
│   │   └── {nome-do-cliente}/
│   │       ├── config.yaml
│   │       ├── CLAUDE.md
│   │       ├── branding/
│   │       ├── memory/
│   │       ├── skills/
│   │       └── agents/
│   │
│   └── shared/                        # UTILITÁRIOS
│       ├── types.ts
│       ├── logger.ts
│       ├── errors.ts
│       └── utils.ts
│
├── tests/
│   ├── unit/                          # Testes unitários
│   ├── integration/                   # Testes de integração
│   └── e2e/                           # Testes end-to-end
│
├── docs/                              # Documentação
│   ├── API.md
│   ├── CLIENT-GUIDE.md
│   ├── EXAMPLES.md
│   └── ARCHITECTURE.md
│
└── .vibecoding/                       # Contexto do projeto
    ├── intent/
    ├── architecture/
    ├── decisions/
    └── plan/
```

---

## Princípios de Design do Core

### 1. Isolamento do Cliente

**Regra:** `src/core/` NUNCA contém lógica específica de cliente.

```
src/core/           → Componentes genéricos e reutilizáveis
src/clients/        → Configurações específicas do cliente
```

### 2. Orientado a Configuração

Todo comportamento do cliente é definido em `config.yaml`:

- Provedor e modelo LLM
- Modos disponíveis
- Configuração de memória
- Servidores MCP
- Branding (cores, tema)

### 3. Sistema de Precedência

Recursos são resolvidos com precedência clara:

| Recurso | Precedência (maior vence) |
|---------|---------------------------|
| Skills | projeto > cliente > built-in |
| Config | cliente > padrões |
| Temas | customizado > preset |

### 4. Carregamento Lazy

Recursos dispendiosos são carregados sob demanda:

- Ferramentas MCP: buscadas quando necessárias, cache com TTL
- Memória vetorial: consultada apenas quando relevante
- Skills: carregadas por sessão, não na inicialização

### 5. Gerenciamento de Headroom

A janela de contexto é tratada como um recurso escasso:

| Uso | Ação |
|-----|------|
| 0–60% | Operação normal |
| 60–80% | Sugerir compactação |
| 80–95% | Auto-compactar |
| 95%+ | Truncamento agressivo |

---

## Fluxo de Dados

### Processamento de Requisições

```
Entrada do Usuário
    │
    ▼
┌─────────────┐
│ Parser      │ → Extrair comando, argumentos, opções
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Dispatcher  │ → Rotear para handler do comando
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Config      │ → Carregar configuração do cliente
│ Loader      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Mode        │ → Aplicar restrições do modo
│ Manager     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Agent Loop  │ → Executar com LLM
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Tools       │ → Executar chamadas de ferramentas
│ Registry    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Context     │ → Atualizar sessão, rastrear tokens
│ Manager     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Headroom    │ → Verificar se compactação é necessária
│ Monitor     │
└──────┬──────┘
       │
       ▼
    Resposta
```

### Fluxo de Memória

```
Consulta do Usuário
    │
    ▼
┌─────────────┐
│ Auto Memory │ → Carregar MEMORY.md
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Busca       │ → Busca semântica (se habilitada)
│ Vetorial    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Montagem    │ → Combinar com conversa
│ de Contexto │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ LLM         │ → Gerar resposta
│ Provider    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Extração    │ → Extrair aprendizados
│ de Memória  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Auto Memory │ → Atualizar MEMORY.md
│ Salvar      │
└─────────────┘
```

---

## Componentes Principais

### Agent Loop

O ciclo de execução central:

```typescript
async function agentLoop(input: string): Promise<Response> {
  // 1. Carregar contexto
  const context = await loadContext(session);

  // 2. Chamar LLM
  const response = await llm.complete({
    messages: context.messages,
    tools: context.tools,
  });

  // 3. Executar chamadas de ferramentas
  for (const toolCall of response.toolCalls) {
    const result = await executeTool(toolCall);
    context.messages.push(result);
  }

  // 4. Verificar headroom
  if (headroomMonitor.shouldCompact(context)) {
    await compactionEngine.compact(context);
  }

  // 5. Retornar resposta
  return response;
}
```

### Sistema de Modos

Modos controlam o comportamento do agent:

```typescript
interface ModeConfig {
  enabled: boolean;
  readOnly: boolean;        // Somente leitura, não escrita
  autoExecute: boolean;     // Executar sem confirmação
  requireConfirmation: boolean;
  description: string;
}
```

**Comportamentos dos modos:**

| Modo | ReadOnly | AutoExecute | Confirmação |
|------|----------|-------------|-------------|
| plan | ✓ | Config | Sempre |
| build | ✗ | Config | Config |
| yolo | ✗ | ✓ | Nunca |
| default | ✗ | ✗ | Destrutivas |

### Sistema de Skills

Skills são unidades de conhecimento com precedência:

```
Skills do Projeto (maior)
    ↓
Skills do Cliente
    ↓
Skills Built-in (menor)
```

**Resolução de skills:**

```typescript
function resolveSkill(name: string): Skill {
  // Verificar skills do projeto primeiro
  const projectSkill = projectRegistry.get(name);
  if (projectSkill) return projectSkill;

  // Depois skills do cliente
  const clientSkill = clientRegistry.get(name);
  if (clientSkill) return clientSkill;

  // Por último built-in
  return builtinRegistry.get(name);
}
```

### Integração MCP

Ferramentas MCP são descobertas lazy:

```typescript
class MCPToolSearch {
  async search(query: string): Promise<MCPTool[]> {
    // Verificar cache
    if (this.cache.isValid(query)) {
      return this.cache.get(query);
    }

    // Buscar dos servidores
    const tools = await Promise.all(
      this.servers.map(server => server.listTools())
    );

    // Armazenar no cache
    this.cache.set(query, tools);

    return tools;
  }
}
```

---

## Estratégia de Testes

### Níveis de Teste

| Nível | Escopo | Velocidade | Cobertura |
|-------|--------|------------|-----------|
| Unitário | Função/classe individual | Rápido | 100% core |
| Integração | Múltiplos componentes | Médio | Caminhos críticos |
| E2E | Fluxo completo da CLI | Lento | Cenários do usuário |

### Estrutura de Testes

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

### Executando Testes

```bash
# Todos os testes
npm test

# Somente unitários
npm run test:unit

# Somente integração
npm run test:integration

# Somente E2E
npm run test:e2e

# Com cobertura
npm run test:coverage
```

---

## Sistema de Build

### Desenvolvimento

```bash
# Modo watch
npm run build

# Build uma vez
npm run build

# Verificação de tipos
npm run typecheck

# Lint
npm run lint
```

### Build do Cliente

```bash
# Build um cliente específico
your-harness build-client meu-cliente

# Saída: dist/clients/meu-cliente/
#   ├── cli.ts
#   ├── package.json
#   ├── config.yaml
#   └── branding/
```

---

## Considerações de Segurança

### Variáveis de Ambiente

Nunca commite segredos. Use a sintaxe `${VAR}`:

```yaml
# ✓ Correto
apiKey: ${ANTHROPIC_API_KEY}

# ✗ Errado
apiKey: sk-ant-...
```

### Isolamento do Core

Código do cliente não pode acessar internals do core:

```
src/core/     → Sem imports de clientes
src/clients/  → Apenas imports do core
```

### Restrições de Ferramentas

Skills podem restringir ferramentas disponíveis:

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

### Otimização de Tokens

- **Auto-compactação** a 95% de uso do contexto
- **MCP lazy** com cache TTL
- **Busca semântica** apenas quando relevante
- **Precedência de skills** evita carregar skills não utilizadas

### Cache

| Componente | Estratégia de Cache |
|------------|---------------------|
| Ferramentas MCP | Baseado em TTL (5 min padrão) |
| Config | Por sessão |
| Skills | Por sessão |
| Busca Vetorial | Baseado em consulta |

### Execução Paralela

Subagents rodam em paralelo via orquestrador DAG:

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

## Considerações Futuras

### Funcionalidades Planejadas

- WebSocket MCP transport
- Definições de modos personalizados
- Sistema de plugins para ferramentas
- Suporte multi-idioma
- Deploy em nuvem

### Pontos de Extensão

- Provedores LLM personalizados
- Transportes personalizados
- Adaptadores de memória personalizados
- Renderizadores de branding personalizados
