# Your CLI Harness

> White-label AI CLI framework — generate custom AI-powered CLIs for your brand.

## Quick Start

```bash
npm install
npm run build
npm test
```

## Project Structure

```
src/
├── core/           # Generic harness core (no client logic)
│   ├── cli/        # Parser, dispatcher, renderer
│   ├── config/     # Config loader + Zod validation
│   ├── context/    # Session, window, compaction, headroom
│   ├── orchestrator/ # Agent loop, modes, subagent spawner
│   ├── agents/     # Base, default, explore, plan agents
│   ├── subagents/  # Registry, runner, types
│   ├── skills/     # Engine, loader, registry, built-in
│   ├── mcp/        # Client, registry, transports, tool search
│   ├── memory/     # Manager, auto-memory, vector adapters
│   ├── llm/        # Provider interface, adapters, factory
│   └── branding/   # Renderer, loader, types
├── clients/        # Client-specific definitions
│   └── jogatinando/ # First client (reference implementation)
└── shared/         # Types, logger, errors, utils
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Watch mode development |
| `npm run build` | Build all packages |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint |
| `npm run test` | Run all tests |
| `npm run test:coverage` | Coverage report |
| `npm run harness:create-client <name>` | Create new client |
| `npm run harness:build-client <name>` | Build client binary |

## Documentation

- [PLANO-COMPLETO](.vibecoding/plan/PLANO-COMPLETO.md) — Full implementation plan
- [Architecture](.vibecoding/architecture/architecture.md) — System architecture
- [Decisions](.vibecoding/decisions/decisions.md) — Architectural decisions
- [Invariants](.vibecoding/decisions/invariants.md) — System invariants
- [Anti-Patterns](.vibecoding/decisions/anti_patterns.md) — What to avoid

## License

MIT
