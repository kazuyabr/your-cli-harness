# Jogatinando — CLAUDE.md

## Project Context

This is the **Jogatinando** AI CLI, built on the Your CLI Harness framework.

## Identity

- **Name**: Jogatinando
- **Command**: `jogatinando`
- **Theme**: Professional
- **Primary Color**: #D97757

## Coding Standards

- Use TypeScript for all new code
- Follow the existing code style in each file
- Write tests for new features
- Keep functions small and focused
- Use meaningful variable names

## Architecture

- Core logic lives in `src/core/` — never modify for client-specific needs
- Client configuration in `src/clients/jogatinando/`
- Skills in `src/clients/jogatinando/skills/`
- Agents in `src/clients/jogatinando/agents/`

## Memory

- Auto-memory is enabled (200 lines / 25KB limit)
- Vector memory is disabled by default
- Memory is stored in `memory/MEMORY.md`

## Available Modes

| Mode | Description |
|---|---|
| `--plan` | Analyze and propose (read-only) |
| `--build` | Implement with validation |
| `--yolo` | Execute without confirmation (disabled by default) |
| (default) | Interactive mode with confirmations |

## Rules

1. Always check the PLANO-COMPLETO.md before implementing new phases
2. Respect the invariants in `.vibecoding/decisions/invariants.md`
3. Avoid anti-patterns from `.vibecoding/decisions/anti_patterns.md`
4. Never put client logic in `src/core/`
5. 100% test coverage on core modules
