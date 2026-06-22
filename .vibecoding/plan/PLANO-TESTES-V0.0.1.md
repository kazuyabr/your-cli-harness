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
6. **Seguranca obrigatória** — CVEs e vulnerabilidades cobertos desde o inicio

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
│   │   ├── security/                 ← NOVO (CVEs)
│   │   │   ├── prompt-injection.test.ts
│   │   │   ├── api-key-security.test.ts
│   │   │   ├── path-traversal.test.ts
│   │   │   ├── command-injection.test.ts
│   │   │   ├── token-leakage.test.ts
│   │   │   └── data-exposure.test.ts
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
│   ├── compression-pipeline.test.ts  ← NOVO
│   └── security-pipeline.test.ts     ← NOVO
│
└── e2e/
    ├── cli-commands.test.ts          ← MANTER
    ├── economy-flow.test.ts          ← NOVO
    ├── language-flow.test.ts         ← NOVO
    ├── publish-flow.test.ts          ← NOVO
    ├── anti-duplication.test.ts      ← NOVO
    └── security-flow.test.ts         ← NOVO

generated-cli/                         ← NOVO (Testes do CLI Gerado)
├── jogatinando.test.ts               ← Testes do CLI "jogatinando"
├── happy-path.test.ts                ← Fluxo completo
├── features/
│   ├── language.test.ts              ← Testes de idioma
│   ├── economy.test.ts               ← Testes de economia
│   ├── branding.test.ts              ← Testes de branding
│   └── commands.test.ts              ← Testes de comandos
└── acceptance/
    ├── ac-001-language-detect.test.ts
    ├── ac-002-language-prompts.test.ts
    ├── ac-003-language-model.test.ts
    ├── ac-004-headroom.test.ts
    ├── ac-005-caveman.test.ts
    ├── ac-006-cost-display.test.ts
    ├── ac-007-economy-command.test.ts
    ├── ac-008-economy-off.test.ts
    ├── ac-009-publish-npm.test.ts
    ├── ac-010-npx.test.ts
    ├── ac-011-anti-duplication.test.ts
    ├── ac-012-language-override.test.ts
    ├── ac-013-persistence.test.ts
    ├── ac-014-cache.test.ts
    └── ac-015-summarization.test.ts
```

---

## 4. Mapeamento: Criterio de Aceite → Teste

### 4.1 Funcionalidades

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

### 4.2 Seguranca (CVEs)

| CVE/Ataque | Risco | Teste | Tipo |
|------------|-------|-------|------|
| Prompt injection | Usuario injeta comandos no prompt | `security/prompt-injection.test.ts` | Unit |
| API key leakage | Chaves expostas em logs/erros | `security/api-key-security.test.ts` | Unit |
| Path traversal | Acesso a fora do diretorio permitido | `security/path-traversal.test.ts` | Unit |
| Command injection | Injecao de comandos via bash tool | `security/command-injection.test.ts` | Unit |
| Token leakage | Tokens expostos em outputs | `security/token-leakage.test.ts` | Unit |
| Data exposure | Dados sensiveis em logs | `security/data-exposure.test.ts` | Unit |
| Dependency vulnerabilities | npm packages com CVEs | CI/CD pipeline (`npm audit`) | Automated |

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

### Fase 11: Seguranca (CVEs)

```
tests/unit/core/security/
├── prompt-injection.test.ts
│   ├── rejeita prompt com "ignore previous instructions"
│   ├── rejeita prompt com "system: you are now..."
│   ├── rejeita prompt com injecao de system prompt
│   ├── sanitiza input do usuario
│   └── loga tentativa de injecao
├── api-key-security.test.ts
│   ├── API key nao aparece em logs
│   ├── API key nao aparece em erros
│   ├── API key nao aparece em output
│   ├── API key mascarada em debug
│   └── API key nao em .vibecoding/
├── path-traversal.test.ts
│   ├── rejeita ../../../etc/passwd
│   ├── rejeita ..\..\windows\system32
│   ├── rejeita symlink para fora do projeto
│   ├── rejeita path com null bytes
│   └── permite apenas paths dentro do projeto
├── command-injection.test.ts
│   ├── rejeita comando com ;
│   ├── rejeita comando com &&
│   ├── rejeita comando com |
│   ├── rejeita comando com $(...)
│   ├── rejeita comando com `...`
│   └── sanitiza argumentos do bash tool
├── token-leakage.test.ts
│   ├── tokens nao aparecem em output
│   ├── tokens nao aparecem em logs
│   ├── tokens nao aparecem em erros
│   ├── tokens mascarados em debug
│   └── tokens nao persistidos em disco
└── data-exposure.test.ts
    ├── dados sensiveis nao em logs
    ├── dados sensiveis nao em erros
    ├── dados sensiveis nao em output
    ├── dados sensiveis mascarados
    └── dados sensiveis nao em .vibecoding/

tests/integration/
└── security-pipeline.test.ts
    ├── pipeline completo com seguranca
    ├── prompt injection bloqueado
    ├── API key protegida
    └── path traversal bloqueado

tests/e2e/
└── security-flow.test.ts
    ├── tentativa de injecao e bloqueada
    ├── API key nao exposta na UI
    └── paths restritos nao acessaveis
```

### Fase 12: Generated CLI Tests (CLI Gerado)

```
tests/generated-cli/
├── jogatinando.test.ts
│   ├── harness cria cliente jogatinando
│   ├── harness build cliente jogatinando
│   ├── CLI gerado existe
│   ├── CLI gerado executa
│   └── CLI gerado mostra help
│
├── happy-path.test.ts
│   ├── fluxo completo: criar → build → usar
│   ├── idioma detectado automaticamente
│   ├── economia funciona
│   ├── branding exibido
│   ├── comandos funcionam
│   └── /economy mostra historico
│
├── features/
│   ├── language.test.ts
│   │   ├── detecta idioma pt-BR
│   │   ├── detecta idioma en
│   │   ├── detecta idioma es
│   │   ├── prompts exibidos no idioma
│   │   ├── modelo responde no idioma
│   │   └── override manual funciona
│   │
│   ├── economy.test.ts
│   │   ├── headroom comprime input
│   │   ├── caveman comprime output
│   │   ├── cache reutiliza compressao
│   │   ├── custo real exibido
│   │   ├── /economy mostra historico
│   │   ├── /economy --off desliga
│   │   ├── /economy --on liga
│   │   └── /tokensummary mostra prompts
│   │
│   ├── branding.test.ts
│   │   ├── FIGlet logo gerado
│   │   ├── cores aplicadas
│   │   ├── tema aplicado
│   │   └── versao exibida
│   │
│   └── commands.test.ts
│       ├── /connect funciona
│       ├── /model funciona
│       ├── /sessions funciona
│       ├── /compact funciona
│       ├── /new funciona
│       ├── /undo funciona
│       ├── /agents funciona
│       ├── /skills funciona
│       ├── /mcp funciona
│       └── /help funciona
│
└── acceptance/
    ├── ac-001-language-detect.test.ts
    │   └── CLI detecta idioma automaticamente
    ├── ac-002-language-prompts.test.ts
    │   └── Prompts exibidos no idioma detectado
    ├── ac-003-language-model.test.ts
    │   └── Modelo responde no idioma do cliente
    ├── ac-004-headroom.test.ts
    │   └── Headroom comprime input em 60-95%
    ├── ac-005-caveman.test.ts
    │   └── Caveman comprime output em 65-75%
    ├── ac-006-cost-display.test.ts
    │   └── Custo real exibido abaixo da mensagem
    ├── ac-007-economy-command.test.ts
    │   └── /economy mostra historico completo
    ├── ac-008-economy-off.test.ts
    │   └── /economy --off desliga compressao
    ├── ac-009-publish-npm.test.ts
    │   └── Build com --publish publica no npm
    ├── ac-010-npx.test.ts
    │   └── CLI funciona via NPX apos publicacao
    ├── ac-011-anti-duplication.test.ts
    │   └── Anti-duplicacao detecta skills repetidas
    ├── ac-012-language-override.test.ts
    │   └── Override de idioma funciona
    ├── ac-013-persistence.test.ts
    │   └── Persistencia de preferencias funciona
    ├── ac-014-cache.test.ts
    │   └── Cache de compressao reutiliza
    └── ac-015-summarization.test.ts
        └── Smart Summarization resume conversas
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

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Audit dependencies
        run: npm audit --audit-level=high
      - name: Run security tests
        run: npm run test:security

  generated-cli:
    runs-on: ubuntu-latest
    needs: [test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Create test client
        run: node dist/cli.js create-client jogatinando
      - name: Build test client
        run: node dist/cli.js build-client jogatinando
      - name: Run generated CLI tests
        run: npm run test:generated-cli
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

# Apenas Generated CLI
$ npm run test:generated-cli

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
| **Testes de seguranca** | ~40+ (novos) |
| **Testes do CLI gerado** | ~50+ (novos) |
| **Total estimado** | 550+ testes |
| **Coverage minimo** | 80% branches, 90% functions/lines/statements |
| **CVEs cobertos** | 7 vulnerabilidades |
| **ACs testados no CLI gerado** | 15/15 |

---

## 9. Criterios de Sucesso

| Criterio | Meta |
|----------|------|
| Todos os ACs testados | 15/15 |
| CVEs cobertos | 7/7 |
| Coverage minimo | 80% branches, 90% functions/lines/statements |
| Testes passando | 100% |
| Regressoes | 0 |
| Testes antigos | Todos ainda passando |
| Audit de dependencias | 0 vulnerabilidades high/critical |

---

**Versao do Plano:** 1.2
**Data:** 2026-06-17
**Autor:** Your CLI Harness Team
