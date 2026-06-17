# Invariantes

## Regras Invioláveis do Sistema

### Core
- **INV-001**: `src/core/` NUNCA importa de `src/clients/`
- **INV-002**: `src/core/` NUNCA contém strings específicas de marca (nome, logo, cores)
- **INV-003**: Toda comunicação com LLM passa pelo módulo `headroom` antes do envio
- **INV-004**: Todo provider LLM implementa a interface `LLMProvider`

### Configuração
- **INV-005**: Toda config de cliente é validada por schema Zod antes do uso
- **INV-006**: Defaults são aplicados para toda config opcional não definida
- **INV-007**: Secrets NUNCA são logados ou expostos em output

### Contexto
- **INV-008**: System prompt + CLAUDE.md + auto-memory SEMPRE são preservados em compaction
- **INV-009**: Skills invocadas são preservadas; descrições não invocadas são descartadas
- **INV-010**: Subagentes NUNCA compartilham contexto com o agente pai (apenas resumo retorna)

### Segurança
- **INV-011**: Comandos destrutivos (rm -rf, drop table, etc) SEMPRE requerem confirmação no modo Default
- **INV-012**: YOLO mode é desabilitado por default e requer ativação explícita
- **INV-013**: MCP servers de fontes não confiáveis requerem aprovação antes de conectar
- **INV-014**: Tokens e API keys são lidos de variáveis de ambiente, nunca hardcoded

### Testes
- **INV-015**: 100% de cobertura em `src/core/` (unit + integration)
- **INV-016**: Toda BR (regra de negócio) tem pelo menos um teste de aceite
- **INV-017**: E2E tests cobrem o fluxo completo: init → config → build → run

## Documentação Relacionada

- [Decisions](./decisions.md) — Decisões arquiteturais
- [Anti-Patterns](./anti_patterns.md) — Anti-padrões
- [Architecture](../architecture/architecture.md) — Arquitetura
