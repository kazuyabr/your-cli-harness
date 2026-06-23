# Your CLI Harness

> White-label AI CLI framework — generate custom AI-powered CLIs for your brand

[![npm version](https://img.shields.io/npm/v/your-cli-harness.svg)](https://www.npmjs.com/package/your-cli-harness)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What is Your CLI Harness?

Your CLI Harness is a framework that generates fully interactive AI CLIs with:

- **Token Economy**: Automatic compression (60-95% cost reduction)
- **Multi-Language**: 10 languages supported
- **Smart Orchestration**: Automatic model selection
- **Interactive Mode**: Slash commands, TUI interface
- **NPX Ready**: Publish and use via `npx`

---

## Quick Start

```bash
# Install the harness
npm install -g your-cli-harness

# Create a client CLI
harness create-client my-cli

# Build and publish
harness build-client my-cli --publish

# Use via NPX
npx @my-cli/cli
```

---

## Features

### Token Economy

Automatic compression to save costs:

| Technique | Reduction | Description |
|-----------|-----------|-------------|
| **Headroom** | 60-95% | Compresses input (JSON, code, logs) |
| **Caveman** | 65-75% | Compresses output (removes filler) |
| **Cache** | 10-30% | Reuses previous compressions |

### Multi-Language Support

Detects and responds in 10 languages:

| Language | Code | Flag |
|----------|------|------|
| Português (Brasil) | `pt-BR` | 🇧🇷 |
| English | `en` | 🇺🇸 |
| Español | `es` | 🇪🇸 |
| Français | `fr` | 🇫🇷 |
| Deutsch | `de` | 🇩🇪 |
| Italiano | `it` | 🇮🇹 |
| 日本語 | `ja` | 🇯🇵 |
| 中文 | `zh` | 🇨🇳 |
| 한국어 | `ko` | 🇰🇷 |

### Smart Orchestration

Automatic model selection based on:

- Task type (code, chat, analysis, creative)
- Complexity (low, medium, high)
- Cost constraints
- Latency requirements

### Interactive Mode

Slash commands for easy interaction:

```
/help       - Show available commands
/connect    - Connect to a provider
/model      - Show or change model
/economy    - Show token economy stats
/language   - Show or change language
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR CLI HARNESS                          │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ AI SDK      │  │ Language     │  │ Token Economy      │ │
│  │ Integration │  │ System       │  │ (Headroom+Caveman) │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ Smart       │  │ Context      │  │ Interactive CLI    │ │
│  │ Orchestration│  │ Persistence  │  │ (Slash Commands)   │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
your-cli-harness/
├── src/
│   ├── core/
│   │   ├── ai-sdk/          # AI SDK integration
│   │   ├── language/        # Language detection
│   │   ├── compression/     # Token compression
│   │   ├── economy/         # Cost tracking
│   │   ├── orchestrator/    # Smart routing
│   │   ├── context/         # Context persistence
│   │   ├── cli/             # CLI commands
│   │   └── branding/        # FIGlet logos
│   └── clients/             # Generated CLIs
├── tests/                   # Unit, integration, E2E
├── docs/                    # Documentation
└── .vibecoding/             # Project context
```

---

## Commands

### Harness Commands

```bash
harness create-client <name>    # Create a new client CLI
harness build-client <name>     # Build a client CLI
harness list-clients            # List all clients
```

### Client Commands

```bash
npx @<client>/cli              # Start interactive mode
npx @<client>/cli chat [msg]   # Send a message
npx @<client>/cli status       # Show status
```

### Slash Commands

```
/help (h, ?)      - Show available commands
/connect          - Connect to a provider
/model            - Show or change model
/sessions         - List sessions
/compact          - Compact conversation
/new (n)          - Start new session
/undo             - Undo last action
/agents           - List agents
/skills           - List skills
/mcp              - List MCP servers
/economy (eco)    - Show token economy stats
/language (lang)  - Show or change language
/tokensummary     - Show token summary
```

---

## Configuration

### Client Configuration

```yaml
name: my-cli
command: my-cli
version: 1.0.0
description: "My AI CLI"

llm:
  provider: openrouter
  model: openrouter/owl-alpha
  maxTokens: 8192
  temperature: 0.7

modes:
  plan:
    enabled: true
    readOnly: true
  build:
    enabled: true
    readOnly: false
  default:
    enabled: true
```

### Environment Variables

```env
# OpenRouter (free tier)
OPENROUTER_API_KEY=sk-or-xxxxx

# Groq (free tier)
GROQ_API_KEY=gsk_xxxxx

# Together AI (free tier)
TOGETHER_API_KEY=xxxxx

# LM Studio (local)
LM_STUDIO_URL=http://localhost:1234

# Ollama (local)
OLLAMA_URL=http://localhost:11434
```

---

## Examples

### Create a CLI

```bash
harness create-client jogatinando
harness build-client jogatinando --publish
```

### Use the CLI

```bash
npx @jogatinando/cli

> /help
> /connect openrouter
> /model openrouter/owl-alpha
> Analyze this code for bugs
```

### View Economy

```bash
> /economy

📊 Relatório de Economia de Tokens
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Resumo da Sessão:
  • Interações: 15
  • Custo total (original): $0.4500
  • Custo total (final): $0.1200
  • Total economizado: $0.3300 (73%)
```

---

## Documentation

- [Getting Started](docs/GETTING-STARTED.md)
- [API Reference](docs/API.md)
- [Client Guide](docs/CLIENT-GUIDE.md)
- [Examples](docs/EXAMPLES.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Security](docs/SECURITY.md)

---

## Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Support

- Issues: [GitHub Issues](https://github.com/kazuyabr/your-cli-harness/issues)
- Documentation: [docs/](docs/)
- Examples: [docs/EXAMPLES.md](docs/EXAMPLES.md)
