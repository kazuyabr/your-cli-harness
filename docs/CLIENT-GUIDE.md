# Your CLI Harness — Client Guide

## Overview

Your CLI Harness is a white-label framework that generates custom AI-powered CLI tools for your organization. Each client gets:

- Custom branding (name, logo, colors, voice tone)
- Configurable agents and modes
- Semantic memory for corporate documentation
- MCP integrations for external tools
- Intelligent context compression

---

## Quick Start

### 1. Create a New Client

```bash
# Using the CLI
your-harness create-client my-company

# Or with interactive onboarding
your-harness init
```

This creates the client structure:

```
src/clients/my-company/
├── config.yaml          # Client configuration
├── CLAUDE.md            # Persistent instructions for AI
├── branding/
│   └── logo.txt         # ASCII logo
├── memory/
│   └── MEMORY.md        # Auto-memory file
├── skills/              # Custom skills (SKILL.md files)
└── agents/              # Custom agent definitions
```

### 2. Configure the Client

Edit `src/clients/my-company/config.yaml`:

```yaml
name: my-company
command: my-company
version: "1.0.0"
description: "My Company AI Assistant"

llm:
  provider: anthropic
  model: claude-sonnet-4-20250514
  apiKey: ${ANTHROPIC_API_KEY}

modes:
  plan:
    enabled: true
    readOnly: true
    autoExecute: false
    requireConfirmation: true
  build:
    enabled: true
    readOnly: false
    autoExecute: true
    requireConfirmation: false
  yolo:
    enabled: false
  default:
    enabled: true

memory:
  auto:
    enabled: true
    maxLines: 200
    maxKB: 25
  vector:
    provider: qdrant
    qdrant:
      url: ${QDRANT_URL}
      collection: my-company-docs
    indexer:
      sources:
        - type: local
          path: ./docs
          patterns: ["**/*.md"]
      chunkSize: 1000
      overlap: 200

mcp:
  servers:
    - name: github
      type: http
      url: https://api.githubcopilot.com/mcp/
      headers:
        Authorization: Bearer ${GITHUB_TOKEN}

branding:
  colors:
    primary: "#3B82F6"
    secondary: "#10B981"
    accent: "#F59E0B"
    error: "#EF4444"
    warning: "#F59E0B"
    success: "#10B981"
  theme: professional
```

### 3. Build the Client

```bash
your-harness build-client my-company
```

This generates:

```
dist/clients/my-company/
├── cli.ts               # Client entry point
├── package.json          # Client package
├── config.yaml           # Copied config
└── branding/
    └── logo.txt          # Copied logo
```

### 4. Run the Client

```bash
# Development
node dist/clients/my-company/cli.ts "help me with code review"

# Production (after npm install && npm run build in dist/clients/my-company)
my-company "deploy to staging"
```

---

## Configuration Reference

### LLM Provider

```yaml
llm:
  provider: anthropic | openai | azure
  model: claude-sonnet-4-20250514 | gpt-4o | gpt-4o-mini
  apiKey: ${API_KEY_ENV_VAR}
  # Azure-specific:
  # endpoint: https://your-resource.openai.azure.com/
  # apiVersion: 2024-02-15-preview
  # deploymentName: your-deployment
```

### Modes

| Mode | Read-only | Auto-execute | Confirmation | Use case |
|------|-----------|--------------|--------------|----------|
| `plan` | Yes | Configurable | Always | Analysis, planning |
| `build` | No | Configurable | Configurable | Implementation |
| `yolo` | No | Yes | Never | Hotfixes, urgent tasks |
| `default` | No | No | Destructive tools | Interactive sessions |

### Memory

#### Auto Memory

Persists learnings between sessions in `memory/MEMORY.md`:

```yaml
memory:
  auto:
    enabled: true
    maxLines: 200    # Max lines before compaction
    maxKB: 25        # Max size in KB
```

#### Vector Memory

Semantic search over corporate documentation:

```yaml
memory:
  vector:
    provider: qdrant | pinecone | none
    qdrant:
      url: ${QDRANT_URL}
      apiKey: ${QDRANT_API_KEY}
      collection: my-docs
    pinecone:
      apiKey: ${PINECONE_API_KEY}
      environment: us-east-1
      index: my-docs
    indexer:
      sources:
        - type: local
          path: ./docs
          patterns: ["**/*.md", "**/*.pdf"]
        - type: web
          urls: ["https://docs.mycompany.com"]
        - type: confluence
          url: https://mycompany.atlassian.net
          spaces: ["ENG", "PROD"]
          auth: ${CONFLUENCE_TOKEN}
      chunkSize: 1000
      overlap: 200
```

### MCP Servers

Connect to external tools:

```yaml
mcp:
  servers:
    - name: github
      type: http
      url: https://api.githubcopilot.com/mcp/
      headers:
        Authorization: Bearer ${GITHUB_TOKEN}

    - name: jira
      type: http
      url: https://mcp.atlassian.com/mcp
      oauth:
        scopes: "read:jira-work write:jira-work"

    - name: local-db
      type: stdio
      command: npx
      args: ["-y", "@modelcontextprotocol/server-sqlite"]
      env:
        DB_PATH: ./data/app.db
```

### Branding

```yaml
branding:
  logo: "./branding/logo.txt"  # Path to ASCII logo
  colors:
    primary: "#3B82F6"         # Blue
    secondary: "#10B981"       # Green
    accent: "#F59E0B"          # Amber
    error: "#EF4444"           # Red
    warning: "#F59E0B"         # Amber
    success: "#10B981"         # Green
  theme: professional | casual | technical
```

---

## Creating Custom Skills

Skills are knowledge units in SKILL.md format.

### Skill File Structure

```markdown
---
name: deploy
description: Deploy application to production
disable-model-invocation: true
user-invocable: true
allowed-tools:
  - Bash(git *)
  - Bash(npm *)
  - Bash(docker *)
context: fork
---

# Deploy $ARGUMENTS

## Steps

1. Run test suite:
   ```bash
   npm test
   ```

2. Build for production:
   ```bash
   npm run build
   ```

3. Create Docker image:
   ```bash
   docker build -t myapp:$ARGUMENTS .
   ```

4. Push to registry:
   ```bash
   docker push registry/myapp:$ARGUMENTS
   ```

5. Deploy:
   ```bash
   kubectl set image deployment/myapp myapp=registry/myapp:$ARGUMENTS
   ```

6. Verify rollout:
   ```bash
   kubectl rollout status deployment/myapp
   ```
```

### Frontmatter Options

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Skill name (filename without .md) |
| `description` | string | Short description |
| `disable-model-invocation` | boolean | Only user can invoke |
| `user-invocable` | boolean | User can invoke directly |
| `allowed-tools` | string[] | Tools allowed in this skill |
| `disallowed-tools` | string[] | Tools blocked in this skill |
| `context` | "inline" \| "fork" | Execution context |
| `model` | string | Override LLM model |
| `effort` | string | Reasoning effort level |
| `agent` | string | Agent to use |
| `tags` | string[] | Tags for organization |
| `argumentHint` | string | Hint for arguments |

### Variables

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments joined |
| `$ARGUMENTS[0]` | First argument |
| `$WORKING_DIR` | Current directory |
| `$SESSION_ID` | Session identifier |
| `$CLIENT_ID` | Client name |
| `$MODE` | Current mode |

### Skill Precedence

Skills are resolved with this precedence (highest wins):

1. **Project** skills (in project root)
2. **Client** skills (in `src/clients/{name}/skills/`)
3. **Built-in** skills (in `src/core/skills/builtin/`)

---

## Creating Custom Agents

Define agents in Markdown files with frontmatter.

### Agent File Structure

```markdown
---
name: security-reviewer
description: Security-focused code reviewer
model: claude-sonnet-4-20250514
maxTurns: 10
tools:
  - read
  - grep
  - glob
---

You are a security expert reviewing code for vulnerabilities.

Focus on:
- SQL injection
- XSS vulnerabilities
- Authentication/authorization issues
- Secrets in code
- Dependency vulnerabilities

When reviewing, provide:
1. Severity level (Critical/High/Medium/Low)
2. Location (file:line)
3. Description of the issue
4. Recommended fix
```

---

## CLAUDE.md

The `CLAUDE.md` file provides persistent instructions to the AI agent.

```markdown
# My Company AI Assistant

## Project Context

This is the AI assistant for My Company. It helps with:

- Code review and quality
- Architecture decisions
- Deployment and operations
- Documentation

## Conventions

- Use TypeScript for all new code
- Follow ESLint rules in .eslintrc
- Write tests for new features
- Use conventional commits

## Security

- Never log API keys or secrets
- Validate all user input
- Use parameterized queries
- Follow OWASP guidelines

## Team Structure

- Frontend team: React/Next.js
- Backend team: Node.js/Express
- DevOps team: Kubernetes/AWS
```

---

## Listing Clients

```bash
your-harness list-clients
```

Output:

```
Available clients:

  my-company        v1.0.0    anthropic
  jogatinando       v1.0.0    anthropic
  acme-corp         v2.1.0    openai
```

---

## Environment Variables

Use `${VAR_NAME}` syntax in config files. The CLI resolves these at runtime.

```yaml
llm:
  apiKey: ${ANTHROPIC_API_KEY}

memory:
  vector:
    qdrant:
      url: ${QDRANT_URL}
      apiKey: ${QDRANT_API_KEY}

mcp:
  servers:
    - name: github
      headers:
        Authorization: Bearer ${GITHUB_TOKEN}
```

---

## Best Practices

### 1. Start Minimal

Begin with a basic config and add features as needed:

```yaml
name: my-app
command: my-app
version: "1.0.0"
llm:
  provider: anthropic
  model: claude-sonnet-4-20250514
```

### 2. Use Environment Variables

Never commit secrets. Use `${VAR}` syntax:

```yaml
apiKey: ${ANTHROPIC_API_KEY}  # ✓
apiKey: sk-ant-...            # ✗
```

### 3. Organize Skills

```
skills/
├── deploy/
│   └── SKILL.md
├── review-pr/
│   └── SKILL.md
└── database/
    ├── migrate.md
    └── seed.md
```

### 4. Version Your Client

Increment version when making breaking changes:

```yaml
version: "1.2.0"  # Not "1.0.0" forever
```

### 5. Test Locally

Build and test before deploying:

```bash
your-harness build-client my-app
node dist/clients/my-app/cli.ts --help
```

---

## Troubleshooting

### Config Validation Error

```
Error: Invalid config: name is required
```

**Fix:** Ensure `name` is present in `config.yaml`.

### LLM Connection Failed

```
Error: Anthropic API error: 401 Unauthorized
```

**Fix:** Check `ANTHROPIC_API_KEY` environment variable.

### MCP Server Not Connecting

```
Error: MCP server "github" connection failed
```

**Fix:** Verify server URL and credentials in config.

### Memory Not Persisting

```
Warning: MEMORY.md not found
```

**Fix:** Create `memory/MEMORY.md` in client directory.
