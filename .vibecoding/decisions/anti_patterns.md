# Anti-Patterns

## O que NUNCA fazer neste projeto

### Arquitetura
- **ANTI-001**: Nunca colocar lógica de cliente em `src/core/` — o core é genérico
- **ANTI-002**: Nunca fazer fork do repositório para criar um novo cliente — use templates
- **ANTI-003**: Nunca acoplar a um único provedor LLM sem adapter
- **ANTI-004**: Nunca ignorar erros de validação de config — falhe cedo com mensagem clara

### Contexto / Tokens
- **ANTI-005**: Nunca enviar contexto sem passar pelo módulo headroom
- **ANTI-006**: Nunca carregar todos os MCP tools de uma vez — use tool search (lazy)
- **ANTI-007**: Nunca incluir outputs completos de subagentes no contexto principal
- **ANTI-008**: Nunca duplicar informação entre CLAUDE.md e Skills — use @imports
- **ANTI-009**: Nunca deixar CLAUDE.md crescer além de 200 linhas — use path-scoped rules

### Skills
- **ANTI-010**: Nunca criar skill sem `description` — Claude não sabe quando usá-la
- **ANTI-011**: Nunca colocar side effects em skill sem `disable-model-invocation: true`
- **ANTI-012**: Nunca misturar múltiplos procedimentos em uma skill — uma skill = uma responsabilidade

### Segurança
- **ANTI-013**: Nunca logar API keys, tokens ou secrets
- **ANTI-014**: Nunca executar comandos do usuário sem sanitização
- **ANTI-015**: Nunca conectar MCP server sem verificar confiança

### Testes
- **ANTI-016**: Nunca commitar código sem testes passando
- **ANTI-017**: Nunca mockar o que deveria ser testado de verdade (integration > mock)
- **ANTI-018**: Nunca ignorar testes flaky — corrija ou remova

### Processo
- **ANTI-019**: Nunca implementar sem consultar o PLANO-COMPLETO.md
- **ANTI-020**: Nunca pular fase do roadmap — as fases são sequenciais por dependência
- **ANTI-021**: Nunca adicionar complexidade antes de ter a versão simples funcionando

## Documentação Relacionada

- [Decisions](./decisions.md) — Decisões arquiteturais
- [Invariants](./invariants.md) — Invariantes do sistema
- [Architecture](../architecture/architecture.md) — Arquitetura
