# Your CLI Harness — Exemplos

## Exemplo 1: Cliente Mínimo

### config.yaml

```yaml
name: minha-ferramenta
command: minha-ferramenta
version: "1.0.0"
description: "Assistente IA simples"

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

### Uso

```bash
minha-ferramenta "explique este código"
minha-ferramenta --help
```

---

## Exemplo 2: Cliente Enterprise com MCP

### config.yaml

```yaml
name: acme-corp
command: acme
version: "2.1.0"
description: "Plataforma IA da ACME Corporation"

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
# Plataforma IA da ACME Corporation

## Contexto

Você é o assistente IA da ACME Corporation, uma empresa líder em tecnologia.

## Padrões de Código

- TypeScript em modo strict
- ESLint com configuração airbnb
- Prettier para formatação
- 100% de cobertura de testes para código novo

## Fluxo de Git

- Conventional commits obrigatórios
- PR reviews precisam de 2 aprovações
- Squash merge para main

## Segurança

- Nunca commite segredos
- Use variáveis de ambiente
- Siga o princípio do menor privilégio

## Equipes

- Plataforma: Go, Kubernetes, AWS
- Produto: React, Node.js, PostgreSQL
- Dados: Python, Spark, Airflow
```

### Skills Personalizadas

#### skills/deploy-staging/SKILL.md

```markdown
---
name: deploy-staging
description: Deploy em ambiente de staging
disable-model-invocation: true
allowed-tools:
  - Bash(git *)
  - Bash(docker *)
  - Bash(kubectl *)
context: fork
---

# Deploy $ARGUMENTS em Staging

## Pré-deploy

1. Certifique-se de estar na branch main:
   ```bash
   git checkout main
   git pull origin main
   ```

2. Execute os testes:
   ```bash
   npm test
   ```

3. Build:
   ```bash
   npm run build
   ```

## Deploy

1. Build imagem Docker:
   ```bash
   docker build -t acme-app:$ARGUMENTS .
   ```

2. Envie para o registry:
   ```bash
   docker push registry.acme.com/acme-app:$ARGUMENTS
   ```

3. Atualize o deploy em staging:
   ```bash
   kubectl set image deployment/acme-app \
     acme-app=registry.acme.com/acme-app:$ARGUMENTS \
     -n staging
   ```

4. Verifique:
   ```bash
   kubectl rollout status deployment/acme-app -n staging
   ```

## Pós-deploy

1. Execute smoke tests:
   ```bash
   curl -f https://staging.acme.com/health
   ```

2. Notifique a equipe no Slack:
   ```
   ✅ Deploy $ARGUMENTS realizado em staging
   ```
```

#### skills/database-migrate/SKILL.md

```markdown
---
name: database-migrate
description: Executar migrações do banco de dados
disable-model-invocation: true
allowed-tools:
  - Bash(npx *)
context: inline
---

# Migração do Banco de Dados: $ARGUMENTS

## Passos

1. Verifique o status da migração atual:
   ```bash
   npx prisma migrate status
   ```

2. Crie a migração:
   ```bash
   npx prisma migrate dev --name $ARGUMENTS
   ```

3. Revise o SQL gerado em `prisma/migrations/`

4. Aplique em staging:
   ```bash
   DATABASE_URL=$STAGING_DB_URL npx prisma migrate deploy
   ```

5. Verifique:
   ```bash
   npx prisma migrate status
   ```
```

---

## Exemplo 3: Agent Específico para Equipe

### agents/security-reviewer.md

```markdown
---
name: security-reviewer
description: Revisor de código focado em segurança
model: claude-sonnet-4-20250514
maxTurns: 15
tools:
  - read
  - grep
  - glob
  - bash
---

Você é um especialista em segurança revisando código para a ACME Corporation.

## Checklist de Revisão

### Autenticação
- [ ] Tokens JWT validados corretamente
- [ ] Gerenciamento de sessão seguro
- [ ] Hash de senhas (bcrypt/argon2)
- [ ] Implementação de MFA

### Autorização
- [ ] Controle de acesso baseado em funções
- [ ] Permissões em nível de recurso
- [ ] Proteção de endpoints de API

### Validação de Entrada
- [ ] Prevenção contra injeção SQL
- [ ] Prevenção contra XSS
- [ ] Prevenção contra path traversal
- [ ] Validação de upload de arquivos

### Segredos
- [ ] Sem credenciais hardcoded
- [ ] Uso de variáveis de ambiente
- [ ] Política de rotação de segredos
- [ ] Redação em logs

### Dependências
- [ ] Sem vulnerabilidades conhecidas
- [ ] Versões atualizadas
- [ ] Conformidade de licenças

## Formato de Saída

Para cada problema encontrado:

```
[SEVERIDADE] arquivo:linha
Problema: <descrição>
Impacto: <impacto potencial>
Correção: <correção recomendada>
```

Níveis de severidade:
- CRÍTICO: Risco imediato, corrigir obrigatoriamente
- ALTO: Risco significativo, corrigir antes do merge
- MÉDIO: Risco moderado, deve corrigir
- BAIXO: Risco menor, considerar correção
```

---

## Exemplo 4: Modo Personalizado

### Adicionando um modo "research"

Atualize `config.yaml`:

```yaml
modes:
  research:
    enabled: true
    readOnly: true
    autoExecute: false
    requireConfirmation: false
    description: "Modo pesquisa - somente leitura com busca web"
```

### Usando o modo

```bash
minha-ferramenta --mode research "pesquise melhores práticas para deployments Kubernetes"
```

---

## Exemplo 5: Cliente com Memória Pesada

### config.yaml

```yaml
name: docs-ai
command: docs-ai
version: "1.0.0"
description: "Assistente IA de Documentação"

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
      collection: empresa-docs
    indexer:
      sources:
        - type: local
          path: ./documentation
          patterns: ["**/*.md", "**/*.rst", "**/*.txt"]
        - type: confluence
          url: https://empresa.atlassian.net
          spaces: ["DOCS", "KB", "HOWTO"]
          auth: ${CONFLUENCE_TOKEN}
        - type: web
          urls:
            - https://docs.empresa.com
            - https://knowledge.empresa.com
            - https://blog.empresa.com
      chunkSize: 800
      overlap: 150
      schedule: "0 */6 * * *"  # A cada 6 horas
```

### CLAUDE.md

```markdown
# Assistente IA de Documentação

## Objetivo

Você ajuda os funcionários a encontrar e entender a documentação da empresa.

## Capacidades

- Buscar documentação interna
- Resumir documentos longos
- Explicar conceitos técnicos
- Guiar através de procedimentos

## Estilo de Resposta

- Seja conciso mas completo
- Cite fontes quando disponíveis
- Link para documentos relevantes
- Sugira tópicos relacionados

## Uso da Memória

Armazene documentos acessados frequentemente e perguntas comuns na memória para respostas mais rápidas.
```

---

## Exemplo 6: Configuração Multi-Modelo

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
    model: claude-sonnet-4-20250514  # Use modelo poderoso para planejamento
  build:
    enabled: true
    model: claude-sonnet-4-20250514  # Use modelo poderoso para implementação
  yolo:
    enabled: true
    model: claude-sonnet-4-20250514  # Use modelo rápido para correções rápidas
  default:
    enabled: true
    model: claude-sonnet-4-20250514
```

---

## Exemplo 7: MCP com Autenticação

### Configuração OAuth (Jira)

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

### Configuração API Key (Datadog)

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

### Stdio com Variáveis de Ambiente

```yaml
mcp:
  servers:
    - name: sqlite
      type: stdio
      command: npx
      args: ["-y", "@modelcontextprotocol/server-sqlite"]
      env:
        DB_PATH: /data/empresa.db
        READ_ONLY: "true"
```

---

## Exemplo 8: Template Completo de Cliente

### Estrutura de Diretórios

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
description: "Plataforma IA Enterprise"

llm:
  provider: anthropic
  model: claude-sonnet-4-20250514

modes:
  plan:
    enabled: true
    readOnly: true
    autoExecute: false
    requireConfirmation: true
    description: "Modo planejamento - analisar e propor"
  build:
    enabled: true
    readOnly: false
    autoExecute: true
    requireConfirmation: false
    description: "Modo build - implementar com validação"
  yolo:
    enabled: true
    readOnly: false
    autoExecute: true
    requireConfirmation: false
    description: "Modo YOLO - execução rápida"
  default:
    enabled: true
    readOnly: false
    autoExecute: false
    requireConfirmation: true
    description: "Modo interativo"

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
# Plataforma IA Enterprise

## Identidade

Você é o assistente IA da Enterprise Corp. Você ajuda com desenvolvimento de software, operações e gerenciamento de conhecimento.

## Capacidades

- Code review e implementação
- Planejamento de arquitetura
- Automação de deploy
- Busca de documentação
- Resposta a incidentes

## Convenções

### Código
- TypeScript em modo strict
- ESLint + Prettier
- 100% de cobertura de testes para código novo
- Conventional commits

### Git
- Branches de feature a partir da main
- PR reviews obrigatórios
- Squash merge

### Deploy
- Staging primeiro, depois produção
- Plano de rollback obrigatório
- Verificação de monitoramento

## Segurança

- Nunca commite segredos
- Use variáveis de ambiente
- Siga o menor privilégio
- Valide todas as entradas

## Comunicação

- Seja profissional mas amigável
- Forneça recomendações acionáveis
- Cite fontes e documentação
- Peça esclarecimentos quando necessário
```

---

## Executando os Exemplos

```bash
# Crie um novo cliente
your-harness create-client enterprise-ai

# Build
your-harness build-client enterprise-ai

# Execute
node dist/clients/enterprise-ai/cli.ts --help

# Teste uma skill
node dist/clients/enterprise-ai/cli.ts deploy v1.2.3
```
