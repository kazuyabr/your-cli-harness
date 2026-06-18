# Your CLI Harness — Examples

## Example 1: Minimal Client

### config.yaml

```yaml
name: my-tool
command: my-tool
version: "1.0.0"
description: "Simple AI assistant"

llm:
  provider: anthropic
  model: claude-sonnet-4-20250514

modes:
  plan:
    enabled: true
    readOnly: true
  build:
    enabled: false
  yolo:
    enabled: false
  default:
    enabled: true

memory:
  auto:
    enabled: true
  vector:
    provider: none

mcp:
  servers: []

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

### Usage

```bash
my-tool "explain this code"
my-tool --help
```

---

## Example 2: Enterprise Client with MCP

### config.yaml

```yaml
name: acme-corp
command: acme
version: "2.1.0"
description: "ACME Corporation AI Platform"

llm:
  provider: azure
  endpoint: https://acme-ai.openai.azure.com/
  apiKey: ${AZURE_OPENAI_KEY}
  apiVersion: "2024-02-15-preview"
  deploymentName: gpt-4o

modes:
  plan:
    enabled: true
    readOnly: true
    autoExecute: false
  build:
    enabled: true
    readOnly: false
    autoExecute: true
    requireConfirmation: false
  yolo:
    enabled: true
  default:
    enabled: true

memory:
  auto:
    enabled: true
    maxLines: 300
    maxKB: 50
  vector:
    provider: qdrant
    qdrant:
      url: https://qdrant.acme.com
      apiKey: ${QDRANT_API_KEY}
      collection: acme-docs
    indexer:
      sources:
        - type: confluence
          url: https://acme.atlassian.net
          spaces: ["ENG", "PRODUCT", "OPS"]
          auth: ${CONFLUENCE_TOKEN}
        - type: local
          path: ./docs
          patterns: ["**/*.md", "**/*.pdf"]
        - type: web
          urls:
            - https://docs.acme.com
            - https://wiki.acme.com
      chunkSize: 1200
      overlap: 300
      schedule: "0 2 * * *"

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

    - name: datadog
      type: http
      url: https://mcp.datadoghq.com/mcp
      headers:
        DD-API-KEY: ${DATADOG_API_KEY}

    - name: postgres
      type: stdio
      command: npx
      args: ["-y", "@modelcontextprotocol/server-postgres"]
      env:
        DATABASE_URL: ${DATABASE_URL}

branding:
  logo: "./branding/logo.txt"
  colors:
    primary: "#1E40AF"
    secondary: "#059669"
    accent: "#D97706"
    error: "#DC2626"
    warning: "#D97706"
    success: "#059669"
  theme: professional
```

### CLAUDE.md

```markdown
# ACME Corporation AI Platform

## Context

You are the AI assistant for ACME Corporation, a leading technology company.

## Code Standards

- TypeScript strict mode
- ESLint with airbnb config
- Prettier for formatting
- 100% test coverage for new code

## Git Workflow

- Conventional commits required
- PR reviews need 2 approvals
- Squash merge to main

## Security

- Never commit secrets
- Use environment variables
- Follow least privilege principle

## Teams

- Platform: Go, Kubernetes, AWS
- Product: React, Node.js, PostgreSQL
- Data: Python, Spark, Airflow
```

### Custom Skills

#### skills/deploy-staging/SKILL.md

```markdown
---
name: deploy-staging
description: Deploy to staging environment
disable-model-invocation: true
allowed-tools:
  - Bash(git *)
  - Bash(docker *)
  - Bash(kubectl *)
context: fork
---

# Deploy $ARGUMENTS to Staging

## Pre-deployment

1. Ensure on main branch:
   ```bash
   git checkout main
   git pull origin main
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Build:
   ```bash
   npm run build
   ```

## Deploy

1. Build Docker image:
   ```bash
   docker build -t acme-app:$ARGUMENTS .
   ```

2. Push to registry:
   ```bash
   docker push registry.acme.com/acme-app:$ARGUMENTS
   ```

3. Update staging deployment:
   ```bash
   kubectl set image deployment/acme-app \
     acme-app=registry.acme.com/acme-app:$ARGUMENTS \
     -n staging
   ```

4. Verify:
   ```bash
   kubectl rollout status deployment/acme-app -n staging
   ```

## Post-deployment

1. Run smoke tests:
   ```bash
   curl -f https://staging.acme.com/health
   ```

2. Notify team in Slack:
   ```
   ✅ Deployed $ARGUMENTS to staging
   ```
```

#### skills/database-migrate/SKILL.md

```markdown
---
name: database-migrate
description: Run database migrations
disable-model-invocation: true
allowed-tools:
  - Bash(npx *)
context: inline
---

# Database Migration: $ARGUMENTS

## Steps

1. Check current migration status:
   ```bash
   npx prisma migrate status
   ```

2. Create migration:
   ```bash
   npx prisma migrate dev --name $ARGUMENTS
   ```

3. Review generated SQL in `prisma/migrations/`

4. Apply to staging:
   ```bash
   DATABASE_URL=$STAGING_DB_URL npx prisma migrate deploy
   ```

5. Verify:
   ```bash
   npx prisma migrate status
   ```
```

---

## Example 3: Team-Specific Agent

### agents/security-reviewer.md

```markdown
---
name: security-reviewer
description: Security-focused code reviewer
model: claude-sonnet-4-20250514
maxTurns: 15
tools:
  - read
  - grep
  - glob
  - bash
---

You are a security expert reviewing code for ACME Corporation.

## Review Checklist

### Authentication
- [ ] JWT tokens properly validated
- [ ] Session management secure
- [ ] Password hashing (bcrypt/argon2)
- [ ] MFA implementation

### Authorization
- [ ] Role-based access control
- [ ] Resource-level permissions
- [ ] API endpoint protection

### Input Validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Path traversal prevention
- [ ] File upload validation

### Secrets
- [ ] No hardcoded credentials
- [ ] Environment variables used
- [ ] Secrets rotation policy
- [ ] Logging redaction

### Dependencies
- [ ] No known vulnerabilities
- [ ] Versions up to date
- [ ] License compliance

## Output Format

For each issue found:

```
[SEVERITY] file:line
Issue: <description>
Impact: <potential impact>
Fix: <recommended fix>
```

Severity levels:
- CRITICAL: Immediate risk, must fix
- HIGH: Significant risk, fix before merge
- MEDIUM: Moderate risk, should fix
- LOW: Minor risk, consider fixing
```

---

## Example 4: Custom Mode

### Adding a "research" mode

Update `config.yaml`:

```yaml
modes:
  research:
    enabled: true
    readOnly: true
    autoExecute: false
    requireConfirmation: false
    description: "Research mode - read-only with web search"
```

### Using the mode

```bash
my-tool --mode research "research best practices for Kubernetes deployments"
```

---

## Example 5: Memory-Heavy Client

### config.yaml

```yaml
name: docs-ai
command: docs-ai
version: "1.0.0"
description: "Documentation AI Assistant"

llm:
  provider: anthropic
  model: claude-sonnet-4-20250514

memory:
  auto:
    enabled: true
    maxLines: 500
    maxKB: 100
  vector:
    provider: qdrant
    qdrant:
      url: ${QDRANT_URL}
      collection: company-docs
    indexer:
      sources:
        - type: local
          path: ./documentation
          patterns: ["**/*.md", "**/*.rst", "**/*.txt"]
        - type: confluence
          url: https://company.atlassian.net
          spaces: ["DOCS", "KB", "HOWTO"]
          auth: ${CONFLUENCE_TOKEN}
        - type: web
          urls:
            - https://docs.company.com
            - https://knowledge.company.com
            - https://blog.company.com
      chunkSize: 800
      overlap: 150
      schedule: "0 */6 * * *"  # Every 6 hours
```

### CLAUDE.md

```markdown
# Documentation AI Assistant

## Purpose

You help employees find and understand company documentation.

## Capabilities

- Search internal documentation
- Summarize long documents
- Explain technical concepts
- Guide through procedures

## Response Style

- Be concise but thorough
- Cite sources when available
- Link to relevant documents
- Suggest related topics

## Memory Usage

Store frequently accessed documents and common questions in memory for faster responses.
```

---

## Example 6: Multi-Model Setup

### config.yaml

```yaml
name: smart-ai
command: smart-ai
version: "1.0.0"

llm:
  provider: anthropic
  model: claude-sonnet-4-20250514

modes:
  plan:
    enabled: true
    model: claude-sonnet-4-20250514  # Use powerful model for planning
  build:
    enabled: true
    model: claude-sonnet-4-20250514  # Use powerful model for implementation
  yolo:
    enabled: true
    model: claude-sonnet-4-20250514  # Use fast model for quick fixes
  default:
    enabled: true
    model: claude-sonnet-4-20250514
```

---

## Example 7: MCP with Authentication

### OAuth Setup (Jira)

```yaml
mcp:
  servers:
    - name: jira
      type: http
      url: https://mcp.atlassian.com/mcp
      oauth:
        scopes: "read:jira-work write:jira-work"
        redirectUri: "http://localhost:3000/callback"
```

### API Key Setup (Datadog)

```yaml
mcp:
  servers:
    - name: datadog
      type: http
      url: https://mcp.datadoghq.com/mcp
      headers:
        DD-API-KEY: ${DATADOG_API_KEY}
        DD-APPLICATION-KEY: ${DATADOG_APP_KEY}
```

### Stdio with Environment

```yaml
mcp:
  servers:
    - name: sqlite
      type: stdio
      command: npx
      args: ["-y", "@modelcontextprotocol/server-sqlite"]
      env:
        DB_PATH: /data/company.db
        READ_ONLY: "true"
```

---

## Example 8: Complete Client Template

### Directory Structure

```
src/clients/enterprise-ai/
├── config.yaml
├── CLAUDE.md
├── branding/
│   └── logo.txt
├── memory/
│   └── MEMORY.md
├── skills/
│   ├── deploy/
│   │   └── SKILL.md
│   ├── review/
│   │   └── SKILL.md
│   └── database/
│       ├── migrate.md
│       └── backup.md
└── agents/
    ├── security-reviewer.md
    ├── architect.md
    └── devops.md
```

### config.yaml

```yaml
name: enterprise-ai
command: enterprise
version: "3.0.0"
description: "Enterprise AI Platform"

llm:
  provider: anthropic
  model: claude-sonnet-4-20250514

modes:
  plan:
    enabled: true
    readOnly: true
    autoExecute: false
    requireConfirmation: true
    description: "Planning mode - analyze and propose"
  build:
    enabled: true
    readOnly: false
    autoExecute: true
    requireConfirmation: false
    description: "Build mode - implement with validation"
  yolo:
    enabled: true
    readOnly: false
    autoExecute: true
    requireConfirmation: false
    description: "YOLO mode - fast execution"
  default:
    enabled: true
    readOnly: false
    autoExecute: false
    requireConfirmation: true
    description: "Interactive mode"

memory:
  auto:
    enabled: true
    maxLines: 400
    maxKB: 75
  vector:
    provider: qdrant
    qdrant:
      url: ${QDRANT_URL}
      collection: enterprise-docs
    indexer:
      sources:
        - type: confluence
          url: https://enterprise.atlassian.net
          spaces: ["ENG", "PRODUCT", "OPS", "SECURITY"]
          auth: ${CONFLUENCE_TOKEN}
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
    - name: jira
      type: http
      url: https://mcp.atlassian.com/mcp
      oauth:
        scopes: "read:jira-work write:jira-work"
    - name: pagerduty
      type: http
      url: https://mcp.pagerduty.com/mcp
      headers:
        Authorization: Bearer ${PAGERDUTY_TOKEN}

branding:
  colors:
    primary: "#1E3A5F"
    secondary: "#2E7D32"
    accent: "#F57F17"
    error: "#C62828"
    warning: "#F57F17"
    success: "#2E7D32"
  theme: professional
```

### CLAUDE.md

```markdown
# Enterprise AI Platform

## Identity

You are the AI assistant for Enterprise Corp. You help with software development, operations, and knowledge management.

## Capabilities

- Code review and implementation
- Architecture planning
- Deployment automation
- Documentation search
- Incident response

## Conventions

### Code
- TypeScript strict mode
- ESLint + Prettier
- 100% test coverage for new code
- Conventional commits

### Git
- Feature branches from main
- PR reviews required
- Squash merge

### Deployment
- Staging first, then production
- Rollback plan required
- Monitoring verification

## Security

- Never commit secrets
- Use environment variables
- Follow least privilege
- Validate all inputs

## Communication

- Be professional but friendly
- Provide actionable recommendations
- Cite sources and documentation
- Ask for clarification when needed
```

---

## Running the Examples

```bash
# Create a new client
your-harness create-client enterprise-ai

# Build it
your-harness build-client enterprise-ai

# Run it
node dist/clients/enterprise-ai/cli.ts --help

# Test a skill
node dist/clients/enterprise-ai/cli.ts deploy v1.2.3
```
