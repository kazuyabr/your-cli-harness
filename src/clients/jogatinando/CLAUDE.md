# jogatinando — CLAUDE.md

## Project Context

This is the **jogatinando** AI CLI, built on the Your CLI Harness framework.

## Identity

- **Name**: jogatinando
- **Command**: `jogatinando`
- **Theme**: Professional

## Coding Standards

- Use TypeScript for all new code
- Follow the existing code style in each file
- Write tests for new features
- Keep functions small and focused

## Architecture

- Core logic lives in `src/core/` — never modify for client-specific needs
- Client configuration in `src/clients/jogatinando/`
- Skills in `src/clients/jogatinando/skills/`

## Rules

1. Respect the invariants in `.vibecoding/decisions/invariants.md`
2. Never put client logic in `src/core/`
3. 100% test coverage on core modules
