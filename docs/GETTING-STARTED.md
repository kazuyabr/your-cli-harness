# Getting Started with Your CLI Harness

## Quick Start

### 1. Install the Harness

```bash
npm install -g your-cli-harness
```

### 2. Create a Client CLI

```bash
harness create-client my-cli
```

This creates a complete CLI structure with:
- Configuration files
- Branding (FIGlet logo)
- Token economy (Headroom + Caveman)
- Language detection
- Interactive mode

### 3. Build the Client

```bash
harness build-client my-cli --publish
```

This will:
- Build the CLI
- Optionally publish to npm
- Make it available via `npx @my-cli/cli`

### 4. Use the CLI

```bash
# Via NPX (after publishing)
npx @my-cli/cli

# Or locally
cd src/clients/my-cli
node cli.js
```

---

## Features

### Token Economy

The CLI automatically compresses tokens to save costs:

- **Headroom**: Compresses input (60-95% reduction)
- **Caveman**: Compresses output (65-75% reduction)
- **Cache**: Reuses previous compressions

View savings with `/economy` command.

### Language Detection

The CLI automatically detects your language:
- Portuguese (Brazil)
- English
- Spanish
- French
- German
- Italian
- Japanese
- Chinese
- Korean

Change language with `/language <code>`.

### Interactive Mode

The CLI provides an interactive interface:

```
my-cli v1.0.0
Type /help for available commands or Ctrl+C to exit.

> /help
📚 Available Commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /help (h, ?) - Show available commands
  /connect - Connect to a provider
  /model - Show or change model
  /sessions - List sessions
  /compact - Compact conversation
  /new (n) - Start new session
  /undo - Undo last action
  /agents - List agents
  /skills - List skills
  /mcp - List MCP servers
  /economy (eco) - Show token economy stats
  /language (lang) - Show or change language
  /tokensummary - Show token summary
```

---

## Configuration

### Client Configuration

Edit `src/clients/my-cli/config.yaml`:

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

Create `.env` file:

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

## Publishing to NPM

### Automatic Publishing

```bash
harness build-client my-cli --publish --access public
```

### Manual Publishing

```bash
cd src/clients/my-cli
npm publish --access public
```

### Using NPX

After publishing, anyone can use your CLI:

```bash
npx @my-cli/cli
```

---

## Directory Structure

```
src/clients/my-cli/
├── config.yaml           # Configuration
├── CLAUDE.md             # Instructions
├── package.json          # NPM package
├── .vibecoding/          # Context persistence
│   ├── vision.md
│   ├── decisions/
│   │   └── invariants.md
│   ├── intent/
│   ├── context/
│   ├── plan/
│   └── memory/
├── branding/
│   └── logo.txt          # FIGlet logo
├── skills/               # Custom skills
├── agents/               # Custom agents
└── memory/
    └── MEMORY.md         # Auto memory
```

---

## Advanced Usage

### Custom Skills

Add skills to `src/clients/my-cli/skills/`:

```markdown
---
name: deploy
description: Deploy to production
allowed-tools: Bash(git *)
---

Deploy $ARGUMENTS to production:
1. Run tests
2. Build
3. Push to registry
```

### Custom Agents

Add agents to `src/clients/my-cli/agents/`:

```markdown
---
name: reviewer
description: Code review agent
tools: [read, write, bash]
---

You are a code reviewer. Review code for:
- Security issues
- Performance problems
- Code style
```

### Smart Orchestration

The CLI uses smart routing to select the best model:

- **Manual**: Rules defined in AGENTS.md
- **Automatic**: AI decides based on task
- **Hybrid**: Rules + fallback to automatic

---

## Troubleshooting

### API Key Not Found

Set the environment variable:

```bash
export OPENROUTER_API_KEY=sk-or-xxxxx
```

### Model Not Available

Check available models:

```bash
/model
```

### Token Economy Not Working

Check economy status:

```bash
/economy
```

### Language Detection Wrong

Set language manually:

```bash
/language pt-BR
```

---

## Support

- Documentation: `docs/`
- Issues: GitHub Issues
- Examples: `docs/EXAMPLES.md`
