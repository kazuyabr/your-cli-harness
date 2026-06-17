<!-- CORTEX:START -->
## Project Memory (auto-managed by Cortex)

### Last Session
_No session recorded yet._

### Recent Decisions
_No decisions recorded yet._

### Current Context
- Project: your-cli-harness
- Status: Ready

### Open Problems
_No open problems._

_Last updated: 2026-06-17T14:29:26.540Z | Tokens: 63/800_
<!-- CORTEX:END -->

## Índice do Projeto

Toda a documentação de produto/arquitetura está em `.vibecoding/`:

- **`.vibecoding/plan/PLANO-COMPLETO.md`** — Plano completo de implementação (fonte primária)
- **`.vibecoding/intent/vision.md`** — Visão estratégica
- **`.vibecoding/intent/product_scope.md`** — Escopo do produto
- **`.vibecoding/architecture/architecture.md`** — Arquitetura do sistema
- **`.vibecoding/decisions/decisions.md`** — Decisões arquiteturais
- **`.vibecoding/decisions/invariants.md`** — Invariantes do sistema
- **`.vibecoding/decisions/anti_patterns.md`** — Anti-padrões a evitar

## Regras de Desenvolvimento

1. **Consulte o PLANO-COMPLETO.md** antes de implementar qualquer fase
2. **Siga o roadmap sequencialmente** — fases têm dependências
3. **Respeite os invariantes** em `.vibecoding/decisions/invariants.md`
4. **Evite os anti-padrões** em `.vibecoding/decisions/anti_patterns.md`
5. **Nunca coloque lógica de cliente em `src/core/`** — core é genérico
6. **100% de cobertura no core** — toda função precisa de teste
7. **Documente decisões** em `.vibecoding/decisions/decisions.md`
