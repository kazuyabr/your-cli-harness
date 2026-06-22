# PLANO DE TESTES: Homologacao v0.0.1

## Visao Geral

Plano de testes progressivo para garantir que todas as funcionalidades do `feat/homologacao-v0.0.1` funcionam corretamente e que desenvolvimentos anteriores nao quebram.

---

## 1. Principios

1. **Testes evoluem com o projeto** — cada fase adiciona testes
2. **Regressao bloqueada** — testes antigos nunca podem quebrar
3. **Coverage minimo** — 80% branches, 90% functions/lines/statements
4. **Criterios de aceite** — cada AC-001 a AC-015 tem teste dedicado
5. **Progressivo** — testes crescem junto com o codigo

---

## 2. Estado Atual

| Aspecto | Status |
|---------|--------|
| **Testes existentes** | 265 passando |
| **Estrutura** | unit/ + integration/ + e2e/ |
| **Coverage** | branches: 80%, functions/lines/statements: 90% |
| **Framework** | Vitest + Playwright |
| **Padrao** | `*.test.ts` |

---

## 3. Estrutura Proposta

```
tests/
├── unit/
│   ├── core/
│   │   ├── economy/                  ← NOVO
│   │   │   ├── token-reporter.test.ts
│   │   │   ├── cost-calculator.test.ts
│   │   │   └── savings-tracker.test.ts
│   │   │
│   │   ├── language/                 ← NOVO
│   │   │   ├── detector.test.ts
│   │   │   ├── interactive-detector.test.ts
│   │   │   ├── persistence.test.ts
│   │   │   ├── translations.test.ts
│   │   │   └── rules.test.ts
│   │   │
│   │   ├── compression/              ← NOVO
│   │   │   ├── headroom/
│   │   │   │   ├── compressor.test.ts
│   │   │   │   ├── strategies.test.ts
│   │   │   │   └── cache.test.ts
│   │   │   ├── caveman/
│   │   │   │   ├── compressor.test.ts
│   │   │   │   ├── rules.test.ts
│   │   │   │   └── patterns.test.ts
│   │   │   └── summarizer/
│   │   │       ├── engine.test.ts
│   │   │       └── triggers.test.ts
│   │   │
│   │   ├── llm/                      ← ATUALIZAR
│   │   │   ├── ai-sdk.test.ts        ← NOVO
│   │   │   ├── factory.test.ts       ← ATUALIZAR
│   │   │   └── provider.test.ts      ← MANTER
│   │   │
│   │   ├── branding/                 ← ATUALIZAR
│   │   │   ├── branding.test.ts      ← MANTER
│   │   │   └── logo-generator.test.ts ← NOVO
│   │   │
│   │   └── (outros mantidos)
│   │
│   └── shared/
│       └── utils.test.ts             ← MANTER
│
├── integration/
│   ├── full-pipeline.test.ts         ← ATUALIZAR
│   ├── config-to-session.test.ts     ← MANTER
│   ├── token-economy-pipeline.test.ts ← NOVO
│   ├── language-pipeline.test.ts     ← NOVO
│   └── compression-pipeline.test.ts  ← NOVO
│
└── e2e/
    ├── cli-commands.test.ts          ← MANTER
    ├── economy-flow.test.ts          ← NOVO
    ├── language-flow.test.ts         ← NOVO
    ├── publish-flow.test.ts          ← NOVO
    └── anti-duplication.test.ts      ← NOVO
```

---

## 4. Mapeamento: Criterio de Aceite → Teste

| AC | Criterio | Teste | Tipo |
|----|----------|-------|------|
| AC-001 | CLI detecta idioma automaticamente | `language/detector.test.ts` | Unit |
| AC-002 | Prompts exibidos no idioma detectado | `language/translations.test.ts` | Unit |
| AC-003 | Modelo responde no idioma do cliente | `language-pipeline.test.ts` | Integration |
| AC-004 | Headroom comprime input em 60-95% | `compression/headroom/compressor.test.ts` | Unit |
| AC-005 | Caveman comprime output em 65-75% | `compression/caveman/compressor.test.ts` | Unit |
| AC-006 | Custo real exibido abaixo da mensagem | `economy/token-reporter.test.ts` | Unit |
| AC-007 | /economy mostra historico completo | `economy-flow.test.ts` | E2E |
| AC-008 | /economy --off desliga compressao | `economy/token-reporter.test.ts` | Unit |
| AC-009 | Build com --publish publica no npm | `publish-flow.test.ts` | E2E |
| AC-010 | CLI funciona via NPX apos publicacao | `publish-flow.test.ts` | E2E |
| AC-011 | Anti-duplicacao detecta skills repetidas | `anti-duplication.test.ts` | E2E |
| AC-012 | Override de idioma funciona | `language/persistence.test.ts` | Unit |
| AC-013 | Persistencia de preferencias funciona | `language/persistence.test.ts` | Unit |
| AC-014 | Cache de compressao reutiliza | `compression/headroom/cache.test.ts` | Unit |
| AC-015 | Smart Summarization resume conversas | `compression/summarizer/engine.test.ts` | Unit |

---

## 5. Testes por Fase

### Fase 1: AI SDK Integration

```
tests/unit/core/llm/
├── ai-sdk.test.ts
│   ├── cria provider com AI SDK
│   ├── streaming funciona
│   ├── tool calls funcionam
│   ├── retry em erro
│   └── fallback para provider antigo
├── factory.test.ts (atualizar)
│   ├── cria provider via AI SDK
│   ├── fallback para anthropic/openai/azure
│   └── valida configuracao
└── provider.test.ts (manter)
```

### Fase 2: Language System

```
tests/unit/core/language/
├── detector.test.ts
│   ├── detecta pt-BR por caracteres especiais
│   ├── detecta en por palavras comuns
│   ├── detecta es por padroes
│   ├── fallback para ingles
│   └── retorna codigo ISO correto
├── interactive-detector.test.ts
│   ├── pergunta se nao detectar
│   ├── salva preferencia
│   └── usa preferencia salva
├── persistence.test.ts
│   ├── salva em .vibecoding/language.json
│   ├── carrega preferencia existente
│   ├── override manual funciona
│   └── persiste entre sessoes
├── translations.test.ts
│   ├── carrega traducoes pt-BR
│   ├── carrega traducoes en
│   ├── carrega traducoes es
│   ├── fallback para en se idioma nao suportado
│   └── todas as chaves existem em todos os idiomas
└── rules.test.ts
    ├── termos tecnicos nao sao traduzidos
    ├── API, SDK, CLI permanecem em ingles
    └── URLs nao sao traduzidas
```

### Fase 3: Token Economy

```
tests/unit/core/economy/
├── token-reporter.test.ts
│   ├── formata custo corretamente
│   ├── calcula economia percentual
│   ├── exibe abaixo do campo de mensagem
│   ├── /economy mostra historico
│   └── /economy --off desliga compressao
├── cost-calculator.test.ts
│   ├── calcula custo Anthropic correto
│   ├── calcula custo OpenAI correto
│   ├── calcula custo Google correto
│   ├── calcula custo xAI correto
│   ├── fallback para modelo desconhecido
│   └── calcula economia
└── savings-tracker.test.ts
    ├── registra economia por interacao
    ├── acumula total da sessao
    ├── reseta ao iniciar nova sessao
    └── exporta relatorio

tests/unit/core/compression/
├── headroom/
│   ├── compressor.test.ts
│   │   ├── comprime JSON
│   │   ├── comprime codigo
│   │   ├── comprime logs
│   │   ├── comprime texto
│   │   ├── preserva semantica
│   │   └── economia minima 60%
│   ├── strategies.test.ts
│   │   ├── detecta tipo de conteudo
│   │   ├── aplica estrategia correta
│   │   └── fallback para texto
│   └── cache.test.ts
│       ├── cacheia compressao
│       ├── reutiliza do cache
│       ├── expira apos TTL
│       └── invalida por chave
├── caveman/
│   ├── compressor.test.ts
│   │   ├── remove artigos
│   │   ├── remove filler words
│   │   ├── remove conectivos
│   │   ├── preserva codigo inline
│   │   ├── preserva URLs
│   │   ├── preserva paths
│   │   ├── preserva termos tecnicos
│   │   └── economia minima 65%
│   ├── rules.test.ts
│   │   ├── regras de remocao
│   │   ├── regras de substituicao
│   │   └── regras de preservacao
│   └── patterns.test.ts
│       ├── detecta codigo inline
│       ├── detecta code blocks
│       ├── detecta URLs
│       └── detecta paths
└── summarizer/
    ├── engine.test.ts
    │   ├── resume conversa longa
    │   ├── preserva contexto essencial
    │   ├── mantem intencao do usuario
    │   └── mantem arquivos modificados
    └── triggers.test.ts
        ├── ativa apos N mensagens
        ├── ativa apos X tokens
        └── nao ativa prematuramente
```

### Fase 4: FIGlet Logo

```
tests/unit/core/branding/
└── logo-generator.test.ts
    ├── gera logo a partir do nome
    ├── suporta multiplas fontes
    ├── fallback se fonte nao existir
    └── output e string ASCII
```

### Fase 5: Directory Structure

```
tests/unit/core/cli/
└── create-client.test.ts (atualizar)
    ├── gera ~/.config/<command>/
    ├── gera ~/.local/share/<command>/
    ├── gera .vibecoding/ com .gitkeep
    ├── gera package.json para npm
    └── gera entry point interativo
```

### Fase 6: Interactive CLI (TUI)

```
tests/e2e/
└── cli-commands.test.ts (atualizar)
    ├── /connect funciona
    ├── /model funciona
    ├── /sessions funciona
    ├── /compact funciona
    ├── /new funciona
    ├── /undo funciona
    ├── /agents funciona
    ├── /skills funciona
    ├── /mcp funciona
    ├── /help funciona
    ├── /economy funciona
    ├── /economy --off funciona
    └── /economy --on funciona
```

### Fase 7: Smart Orchestration

```
tests/unit/core/orchestrator/
└── smart-router.test.ts
    ├── modo manual usa regras
    ├── modo automatico decide por custo
    ├── modo hibrido combina ambos
    ├── fallback em caso de erro
    └── log de decisoes
```

### Fase 8: Context Persistence

```
tests/integration/
└── context-pipeline.test.ts
    ├── carrega .vibecoding/vision.md
    ├── carrega .vibecoding/invariants.md
    ├── carrega .vibecoding/domain_mode.md
    ├── prioridade: session > AGENTS.md > CLAUDE.md > .vibecoding
    └── persiste entre sessoes
```

### Fase 9: Documentation

```
(nenhum teste adicional — documentacao nao e testavel)
```

### Fase 10: Testes Finais

```
tests/e2e/
├── full-flow.test.ts
│   ├── cria cliente
│   ├── build com --publish
│   ├── CLI funciona via NPX
│   ├── economia funciona
│   ├── idioma funciona
│   └── anti-duplicacao funciona
└── regression.test.ts
    ├── todas as fases anteriores ainda funcionam
    ├── 265+ testes passando
    └── coverage minimo atingido
```

---

## 6. Pipeline de CI/CD

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test -- --coverage
      - run: npm run test:e2e
```

---

## 7. Comandos de Teste

```bash
# Todos os testes
$ npm test

# Apenas unitarios
$ npm run test:unit

# Apenas integracao
$ npm run test:integration

# Apenas E2E
$ npm run test:e2e

# Coverage
$ npm run test:coverage

# Watch mode
$ npm run test:watch
```

---

## 8. Resumo

| Aspecto | Quantidade |
|---------|------------|
| **Testes unitarios** | ~150+ (novos) |
| **Testes de integracao** | ~20+ (novos) |
| **Testes E2E** | ~30+ (novos) |
| **Total estimado** | 450+ testes |
| **Coverage minimo** | 80% branches, 90% functions/lines/statements |

---

## 9. Criterios de Sucesso

| Criterio | Meta |
|----------|------|
| Todos os ACs testados | 15/15 |
| Coverage minimo | 80% branches, 90% functions/lines/statements |
| Testes passando | 100% |
| Regressoes | 0 |
| Testes antigos | Todos ainda passando |

---

**Versao do Plano:** 1.0
**Data:** 2026-06-17
**Autor:** Your CLI Harness Team
