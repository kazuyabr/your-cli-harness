# Product Scope

## O que é

**Your CLI Harness** é um framework para geração de CLIs de IA white-label. O produto principal é o próprio harness — não a CLI de nenhum cliente específico.

## O que NÃO é

- Não é uma CLI de IA específica para um domínio
- Não é um produto SaaS com backend próprio
- Não é um substituto para Claude Code ou OpenCode — é uma harness para criar alternativas

## Funcionalidades Core

### 1. CLI Engine
- Parser de argumentos e comandos
- Dispatcher para modos e agentes
- Renderer de output (cores, logo, formatação)

### 2. Config Manager
- Carregamento de `client.config.yaml`
- Validação via Zod schemas
- Defaults sensatos

### 3. Session & Context Manager
- Gerenciamento de janela de contexto
- Contagem de tokens em tempo real
- Compaction automática e sob demanda

### 4. Agent Loop
- Orquestração de tool use
- Multi-turn conversations
- Streaming de respostas

### 5. Subagent Engine
- Spawn de subagentes especializados
- Execução paralela
- Isolamento de contexto

### 6. Skills Engine
- Carregamento de SKILL.md
- Registry por escopo (built-in, cliente, projeto)
- Invocation control (auto vs manual)

### 7. MCP Client
- Conexão com servidores MCP (stdio, http, ws)
- Tool search (lazy loading)
- OAuth 2.0

### 8. Memory Manager
- Auto-memory (estilo Claude Code)
- Memória vetorial (Qdrant/Pinecone)
- Indexação de docs corporativos

### 9. Headroom Compressor
- Monitoramento de contexto
- Alertas por nível
- Compaction inteligente

### 10. Branding
- Logo ASCII customizável
- Paleta de cores
- Tom de voz configurável

## Modos de Operação

| Modo | Descrição | Read-Only | Auto-Execute |
|---|---|---|---|
| **Plan** | Analisa e propõe plano | ✅ | ❌ (aguarda aprovação) |
| **Build** | Implementa com validação | ❌ | ✅ |
| **YOLO** | Execução direta sem confirmação | ❌ | ✅ (sem perguntar) |
| **Default** | Interativo padrão | Parcial | Parcial |

## Integrações

- **LLM Providers**: Anthropic, OpenAI, Azure OpenAI (via adapters)
- **Vector DBs**: Qdrant (default), Pinecone
- **MCP Servers**: Qualquer servidor MCP compatível
- **Fontes de Docs**: Confluence, arquivos locais, web

## Entregáveis

1. **Harness Core** — Biblioteca reutilizável (`src/core/`)
2. **Cliente Jogatinando** — Exemplo completo (`src/clients/jogatinando/`)
3. **Templates** — Para criação de novos clientes (`templates/`)
4. **CLI de gerenciamento** — `harness create-client`, `harness build-client`

## Roadmap Resumido

| Fase | Entregável |
|---|---|
| Fase 0-2 | Setup + CLI Engine + Config |
| Fase 3-5 | Context + LLM + Agent Loop |
| Fase 6-8 | Subagents + Skills + MCP |
| Fase 9-11 | Memory + Vector + Modes |
| Fase 12-14 | Branding + Client Gen + Onboarding |
| Fase 15-16 | Testes + Docs |

## Critérios de Sucesso

- Cliente consegue criar uma CLI funcional com `harness create-client`
- CLI gerada tem identidade visual própria
- Agentes e modos funcionam conforme configuração
- Memória vetorial indexa e recupera docs corporativos
- Headroom mantém contexto dentro do limite
- Testes cobrem 100% do core

## Documentação Relacionada

- [Vision](./vision.md) — Visão estratégica
- [Architecture](../architecture/architecture.md) — Arquitetura técnica
- [PLANO-COMPLETO](./PLANO-COMPLETO.md) — Plano completo
