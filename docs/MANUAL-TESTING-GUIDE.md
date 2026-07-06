# Manual Testing Guide — Your CLI Harness v0.1.0

## Prerequisites

```bash
npm install
npm run build
npm link
```

## Phase 1 — Harness CLI

### 1.1 Help
```bash
harness --help
```
**Expected:** Shows usage, commands (create-client, build-client, list-clients, init)

### 1.2 Create Client
```bash
harness create-client jogatinando
```
**Expected:** Creates `src/clients/jogatinando/` with:
- `config.yaml`
- `CLAUDE.md`
- `memory/MEMORY.md`
- `branding/logo.txt`
- `skills/`
- `agents/`
- `.vibecoding/`

### 1.3 Build Client
```bash
harness build-client jogatinando
```
**Expected:** Creates `dist/clients/jogatinando/` with:
- `cli.ts`
- `package.json`
- `config.yaml`
- `branding/logo.txt`
- `.vibecoding/`

### 1.4 List Clients
```bash
harness list-clients
```
**Expected:** Lists jogatinando with command and provider

## Phase 2 — Client CLI (jogatinando)

### 2.1 Help
```bash
jogatinando help
```
**Expected:** Shows help with commands

### 2.2 Status
```bash
jogatinando status
```
**Expected:** Shows session status

### 2.3 Config
```bash
jogatinando config
```
**Expected:** Shows configuration details

### 2.4 Memory
```bash
jogatinando memory --show
jogatinando memory --add "Test note"
jogatinando memory --show
jogatinando memory --clear
```
**Expected:** Memory operations work correctly

### 2.5 Skills
```bash
jogatinando skills
```
**Expected:** Lists available skills

### 2.6 Logo
```bash
jogatinando
```
**Expected:** Shows FIGlet logo

## Phase 3 — TUI (Interactive Mode)

### 3.1 Launch TUI
```bash
jogatinando
```
**Expected:** Shows:
- Header with client name and version
- Chat panel (empty)
- Status panel (model, tokens, cost, mode)
- Input bar at bottom

### 3.2 Type a message
Type `Hello` and press Enter
**Expected:**
- Message appears in chat panel as "You: Hello"
- Assistant responds with placeholder
- Tokens update in status panel

### 3.3 Slash commands
Type `/help` and press Enter
**Expected:** Shows list of available slash commands

### 3.4 Slash menu
Type `/` (just the slash)
**Expected:** Shows slash command menu with keyboard navigation

### 3.5 Keyboard shortcuts
- `Ctrl+C` — Exit TUI
- `↑/↓` — Navigate slash menu (when visible)
- `Enter` — Select slash command
- `Esc` — Close slash menu

## Phase 4 — Language System

### 4.1 Change language
```bash
jogatinando language pt-BR
```
**Expected:** Language changed to pt-BR

### 4.2 Supported languages
```
pt-BR, en, es, fr, de, it, ja, zh, ko
```

## Phase 5 — Token Economy

### 5.1 Economy stats
```bash
jogatinando economy
```
**Expected:** Shows compression stats (Headroom, Caveman)

### 5.2 Enable/disable compression
```bash
jogatinando economy --on
jogatinando economy --off
```

## Phase 6 — Orchestration

### 6.1 Mode selection
```bash
jogatinando --plan "Analyze this code"
jogatinando --build "Implement feature"
jogatinando --yolo "Do it fast"
```
**Expected:** Different modes activate

## Phase 7 — Context Persistence

### 7.1 Context files
Check that `.vibecoding/` directory is created with:
- `intent/`
- `plan/`
- `decisions/`
- `architecture/`

### 7.2 Context loading
Context is loaded in priority order:
1. Session messages
2. AGENTS.md
3. CLAUDE.md
4. .vibecoding/*

## Phase 8 — Security

### 8.1 Input validation
```bash
jogatinando config --name "../../etc/passwd"
```
**Expected:** Input is sanitized, no path traversal

### 8.2 API key security
API keys are never displayed in output or logs

## Phase 9 — E2E Tests

```bash
npm test
```
**Expected:** All tests pass (565+)

## Phase 10 — Build Verification

### 10.1 TypeScript
```bash
npm run typecheck
```
**Expected:** No errors

### 10.2 Build
```bash
npm run build
```
**Expected:** Build succeeds

### 10.3 Lint
```bash
npm run lint
```
**Expected:** Runs (warnings acceptable)

## Troubleshooting

### "Command not found"
Run `npm link` again

### "Module not found"
Run `npm install` then `npm run build`

### "TypeScript errors"
Run `npm run typecheck` to see details
