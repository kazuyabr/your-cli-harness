# Decisions

## Decisões Arquiteturais Registradas

### DEC-001: TypeScript como linguagem principal
**Data**: 2026-06-17
**Status**: Aprovada
**Razão**: Type-safe, ecossistema LLM maduro em JS/TS, compatibilidade com SDKs oficiais
**Alternativas consideradas**: Python (rejeitado — menos tooling CLI), Rust (rejeitado — curva de aprendizado)

### DEC-002: commander.js como framework CLI
**Data**: 2026-06-17
**Status**: Aprovada
**Razão**: Mais leve que oclif, menos abstração, controle total
**Alternativas consideradas**: oclif (rejeitado — pesado demais para o caso de uso)

### DEC-003: Qdrant como vector DB default
**Data**: 2026-06-17
**Status**: Aprovada
**Razão**: Open source, self-hostable, filtros avançados, API simples
**Alternativas consideradas**: Pinecone (manter como alternativa), Weaviate (rejeitado — complexidade)

### DEC-004: SKILL.md como formato de skills
**Data**: 2026-06-17
**Status**: Aprovada
**Razão**: Padrão aberto (agentskills.io), compatível com Claude Code, suporte a frontmatter
**Alternativas consideradas**: Formato proprietário (rejeitado — lock-in)

### DEC-005: Separação core/clientes
**Data**: 2026-06-17
**Status**: Aprovada
**Razão**: Core nunca contém lógica de cliente; clientes são configurações plugáveis
**Alternativas consideradas**: Monolito com flags (rejeitado — acoplamento), fork por cliente (rejeitado — manutenção)

### DEC-006: Compaction automática a 95%
**Data**: 2026-06-17
**Status**: Aprovada
**Razão**: Baseado no comportamento do Claude Code; 80% = sugestão, 95% = automática
**Alternativas consideradas**: Manual apenas (rejeitado — usuário esquece), agressivo a 70% (rejeitado — perde contexto cedo)

### DEC-007: Multi-provider LLM
**Data**: 2026-06-17
**Status**: Aprovada
**Razão**: Clientes têm preferências diferentes; adapter pattern permite trocar sem mudar core
**Alternativas consideradas**: Apenas Anthropic (rejeitado — limitante), abstração genérica (aprovada com adapters)

### DEC-008: Binário standalone via pkg
**Data**: 2026-06-17
**Status**: Aprovada
**Razão**: Distribuição simples, sem necessidade de Node.js instalado
**Alternativas consideradas**: npm global (rejeitado — requer Node), Docker (rejeitado — pesado para CLI)

### DEC-009: Zod para validação de config
**Data**: 2026-06-17
**Status**: Aprovada
**Razão**: Type-safe, inferência de tipos, mensagens de erro claras
**Alternativas consideradas**: JSON Schema (rejeitado — verboso), Joi (rejeitado — menos TS-native)

### DEC-010: Auto-memory estilo Claude Code
**Data**: 2026-06-17
**Status**: Aprovada
**Razão**: Padrão comprovado, MEMORY.md como index, 200 linhas/25KB limit
**Alternativas consideradas**: DB-only (rejeitado — sem transparência), sem persistência (rejeitado — perde aprendizados)

## Documentação Relacionada

- [Invariants](./invariants.md) — Invariantes do sistema
- [Anti-Patterns](./anti_patterns.md) — Anti-padrões a evitar
- [Architecture](../architecture/architecture.md) — Arquitetura
- [PLANO-COMPLETO](./PLANO-COMPLETO.md) — Plano completo
