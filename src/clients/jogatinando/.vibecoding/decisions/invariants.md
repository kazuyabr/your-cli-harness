# Invariants

## INV-001: Core Isolation
Core logic (`src/core/`) must NEVER contain client-specific code.

## INV-002: Test Coverage
All core modules must have 100% test coverage.

## INV-003: Type Safety
All code must be TypeScript with strict mode.

## INV-004: Backward Compatibility
Changes must not break existing clients.
