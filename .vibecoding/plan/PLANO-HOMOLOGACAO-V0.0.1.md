# PLANO: Homologacao v0.0.1 — Token Economy + Idioma + Transparencia

## Visao Geral

Transformar o CLI gerado por **Your CLI Harness** em uma ferramenta profissional com:
- Economia inteligente de tokens (P0-P3)
- Deteccao automatica de idioma
- Transparencia total de custos
- Publicacao via NPX
- Anti-duplicacao de skills

---

## 1. Token Economy (P0-P3)

### 1.1 Camadas de Compressao

| Prioridade | Camada | O que faz | Economia |
|------------|--------|-----------|----------|
| **P0** | Headroom (Input) | Comprime prompts ANTES de enviar ao LLM | 60-95% |
| **P0** | Caveman (Output) | Comprime respostas do modelo | 65-75% |
| **P1** | Context Cache | Reutiliza compressao anterior | 10-30% |
| **P3** | Smart Summarization | Resume conversas longas | 30-50% |

### 1.2 Estrutura de Arquivos

```
src/core/
├── economy/
│   ├── token-reporter.ts          # Exibe custos e economia
│   ├── cost-calculator.ts         # Calcula custos reais por provider
│   ├── savings-tracker.ts         # Historico de economia
│   └── types.ts                   # Tipos do sistema de economia
│
├── language/
│   ├── detector.ts                # Detecta idioma do input
│   ├── interactive-detector.ts    # Deteccao interativa
│   ├── persistence.ts             # Salva preferencia de idioma
│   ├── translations.ts            # Traducoes dos prompts
│   ├── rules.ts                   # Regras de traducao/nao-traducao
│   └── types.ts                   # Tipos do sistema de idioma
│
├── compression/
│   ├── headroom/
│   │   ├── compressor.ts          # Compressor de input (P0)
│   │   ├── strategies.ts          # Estrategias por tipo de conteudo
│   │   └── cache.ts               # Cache de compressao (P1)
│   │
│   ├── caveman/
│   │   ├── compressor.ts          # Compressor de output (P0)
│   │   ├── rules.ts               # Regras de compressao
│   │   └── patterns.ts            # Padroes preservados
│   │
│   └── summarizer/
│       ├── engine.ts              # Smart summarization (P3)
│       └── triggers.ts            # Quando resumir
│
├── llm/
│   ├── ai-sdk.ts                  # Wrapper AI SDK (novo)
│   ├── provider.ts                # Interface (manter)
│   └── factory.ts                 # Atualizar para AI SDK
│
└── branding/
    └── logo-generator.ts          # FIGlet (novo)
```

---

## 2. Sistema de Idioma

### 2.1 Deteccao Automatica

```
1. Verificar configuracao existente (.vibecoding/language.json)
2. Detectar pelo sistema operacional (locale)
3. Detectar pelo terminal (LANG, LC_ALL)
4. Fallback: perguntar ao usuario interativamente
```

### 2.2 Persistencia

```json
// .vibecoding/language.json
{
  "language": "pt-BR",
  "updatedAt": "2026-06-17T14:30:00.000Z",
  "autoDetected": true,
  "override": false
}
```

### 2.3 Regras de Idioma

| Regra | Comportamento |
|-------|---------------|
| **Deteccao automatica** | Sempre detectar no inicio |
| **Override manual** | Cliente pode mudar a qualquer momento |
| **Termos tecnicos** | Manter em ingles (API, SDK, CLI, etc.) |
| **Modelo** | Sempre responde no idioma do cliente |
| **Persistencia** | Salvar preferencia para proximas sessoes |

### 2.4 Traducoes dos Prompts

O harness (criador de CLI) e o CLI do cliente ambos devem:
- Detectar idioma no inicio
- Exibir todos os prompts no idioma detectado
- Permitir override manual em qualquer momento

```
pt-BR: (S/n)  — Default: Sim
en:    (Y/n)  — Default: Yes
es:    (S/n)  — Default: Si
```

---

## 3. Transparencia de Custos

### 3.1 Display Abaixo do Campo de Mensagem

```
📊 $0.02 | -74% | claude-sonnet-4-20250514
   In: 3,200 (-9,250) | Out: 540 (-1,280)
```

- Menos verboso
- Facil de enxergar
- Custo total da interacao
- Valores contados do total por interacao
- Mostra ENTRADA e SAIDA do modelo
- Custo efetivo e custo final economizado

### 3.2 Comando /economy

| Comando | Funcao |
|---------|--------|
| `/economy` | Mostra historico de economia |
| `/economy --off` | Desliga compressao |
| `/economy --on` | Liga compressao |

### 3.3 Comando /tokensummary

Mostra os prompts originais e como o modelo transformou:
- O que o usuario digitou
- O que foi enviado ao modelo (apos compressao)
- Economia achievada

### 3.4 Calculo de Custos Reais

| Provider | Modelo | Input/1K | Output/1K |
|----------|--------|----------|-----------|
| Anthropic | claude-sonnet-4-20250514 | $0.003 | $0.015 |
| Anthropic | claude-3-5-haiku-20241022 | $0.001 | $0.005 |
| OpenAI | gpt-4o | $0.0025 | $0.01 |
| OpenAI | gpt-4o-mini | $0.00015 | $0.0006 |
| Google | gemini-2.0-flash | $0.0001 | $0.0004 |
| xAI | grok-2 | $0.002 | $0.01 |

---

## 4. Publicacao NPX

### 4.1 Opcoes de Build

```bash
# Build sem publish
$ harness build-client jogatinando

# Build + Publish interativo
$ harness build-client jogatinando --publish

# Build + Publish publico
$ harness build-client jogatinando --publish --access public

# Build + Publish privado
$ harness build-client jogatinando --publish --access private
```

### 4.2 Fluxo Interativo

```
$ harness build-client jogatinando

? Publicar no npm para acesso via NPX? (S/n)
> s

? Acesso do pacote:
  > Publico (recomendado)
    Privado

? Nome do pacote: @jogatinando/cli

? Versao inicial: 1.0.0

📦 Building CLI...
✅ Build completo: dist/jogatinando/cli.js (200kB)

📤 Publicando no npm...
✅ Publicado: @jogatinando/cli@1.0.0

🎉 CLI disponivel via NPX!
   $ npx @jogatinando/cli
```

### 4.3 Pre-requisitos

```bash
# 1. npm instalado
$ npm --version

# 2. Logado no npm (uma unica vez)
$ npm login

# 3. Conta no npmjs.com
# https://www.npmjs.com/signup
```

---

## 5. Anti-Duplicacao

### 5.1 Skills Ja Inclusas

```
🛡️ Skills de Economia Ativas

✅ Ja inclusas no framework:
   • Caveman (output compression)
   • Headroom (input compression)
   • Context Cache
   • Smart Summarization

⚠️ Nao instale:
   • Qualquer skill de "token optimization"
   • Qualquer skill de "prompt compression"
   • Qualquer skill de "cost reduction"

📚 Para mais detalhes: /economy
```

---

## 6. Arquitetura

### 6.1 Framework vs. CLI do Cliente

```
YOUR CLI HARNESS (Framework)
  • Codigo fonte que GERA CLIs
  • Templates e engines de compressao
  • Logica de build e empacotamento
  • NAO precisa "lembrar" de configuracoes de clientes
        │
        │ gera
        ↓
CLI DO CLIENTE (Ex: "jogatinando")
  • Self-contained (funciona sozinho)
  • Inclui: Headroom, Caveman, Cache, Language, etc.
  • Publicavel via NPX
  • Nao depende do framework apos build
```

### 6.2 Persistencia

| Local | Conteudo |
|-------|----------|
| `~/.config/<command>/` | Configuracoes do usuario |
| `~/.local/share/<command>/` | Dados da sessao |
| `.vibecoding/` | Configuracoes do projeto |

---

## 7. Roadmap de Implementacao

| Fase | Escopo | Dependencias |
|------|--------|--------------|
| **Fase 1** | AI SDK Integration | — |
| **Fase 2** | Language System | — |
| **Fase 3** | Token Economy (Headroom + Caveman) | Fase 2 |
| **Fase 4** | FIGlet Logo | — |
| **Fase 5** | Directory Structure | — |
| **Fase 6** | Interactive CLI (TUI) | Fase 1, 2, 3 |
| **Fase 7** | Smart Orchestration | Fase 1 |
| **Fase 8** | Context Persistence | Fase 2 |
| **Fase 9** | Documentation | Todas |
| **Fase 10** | Tests | Todas |

---

## 8. Stack Tecnologica (Atualizada)

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Runtime | Node.js 20+ / TypeScript | Ecossistema maduro, tipos seguros |
| CLI Framework | commander.js + ink | Simples + UI rica no terminal |
| Validacao | zod | Type-safe, mensagens claras |
| LLM SDK | ai (Vercel) + @ai-sdk/* | Multi-provider, streaming |
| MCP SDK | @modelcontextprotocol/sdk | SDK oficial do protocolo |
| Compression | Custom (Headroom + Caveman) | Economia P0-P3 |
| Language | Custom detector + translations | Multi-idioma |
| Cost Calculator | Custom (provider pricing) | Custos reais |
| Build | tsup + pkg | ESM + binario standalone |
| Testes | vitest + playwright | Rapido + E2E real |

---

## 9. Criterios de Aceite

| ID | Criterio | Verificacao |
|----|----------|-------------|
| AC-001 | CLI detecta idioma automaticamente | Integration test |
| AC-002 | Prompts sao exibidos no idioma detectado | E2E test |
| AC-003 | Modelo responde no idioma do cliente | Integration test |
| AC-004 | Headroom comprime input em 60-95% | Unit test |
| AC-005 | Caveman comprime output em 65-75% | Unit test |
| AC-006 | Custo real e exibido abaixo da mensagem | E2E test |
| AC-007 | /economy mostra historico completo | E2E test |
| AC-008 | /economy --off desliga compressao | Unit test |
| AC-009 | Build com --publish publica no npm | Integration test |
| AC-010 | CLI funciona via NPX apos publicacao | E2E test |
| AC-011 | Anti-duplicacao detecta skills repetidas | Unit test |
| AC-012 | Override de idioma funciona | Integration test |
| AC-013 | Persistencia de preferencias funciona | Unit test |
| AC-014 | Cache de compressao reutiliza | Unit test |
| AC-015 | Smart Summarization resume conversas | Unit test |

---

## 10. Proximos Passos

1. Criar branch `feat/homologacao-v0.0.1`
2. Implementar Fase 1 (AI SDK Integration)
3. Implementar Fase 2 (Language System)
4. Implementar Fase 3 (Token Economy)
5. ... (ate Fase 10)
6. Commit + merge para main
7. Push para origin

---

**Versao do Plano:** 1.0
**Data:** 2026-06-17
**Autor:** Your CLI Harness Team
