# Your CLI Harness — Guia do Cliente

## Visão Geral

Your CLI Harness é um framework white-label que gera ferramentas CLI de IA personalizadas para sua organização. Cada cliente recebe:

- Branding personalizado (nome, logo, cores, tom de voz)
- Agents e modos configuráveis
- Memória semântica para documentação corporativa
- Integrações MCP para ferramentas externas
- Compressão inteligente de contexto

---

## Início Rápido

### 1. Criar um Novo Cliente

```bash
# Usando a CLI
your-harness create-client minha-empresa

# Ou com onboarding interativo
your-harness init
```

Isso cria a estrutura do cliente:

```
src/clients/minha-empresa/
├── config.yaml          # Configuração do cliente
├── CLAUDE.md            # Instruções persistentes para IA
├── branding/
│   └── logo.txt         # Logo em ASCII
├── memory/
│   └── MEMORY.md        # Arquivo de auto-memória
├── skills/              # Skills personalizadas (arquivos SKILL.md)
└── agents/              # Definições de agents personalizados
```

### 2. Configurar o Cliente

Edite `src/clients/minha-empresa/config.yaml`:

```yaml
name: minha-empresa
command: minha-empresa
version: "1.0.0"
description: "Assistente IA da Minha Empresa"

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
      collection: minha-empresa-docs
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

### 3. Buildar o Cliente

```bash
your-harness build-client minha-empresa
```

Isso gera:

```
dist/clients/minha-empresa/
├── cli.ts               # Ponto de entrada do cliente
├── package.json          # Pacote do cliente
├── config.yaml           # Configuração copiada
└── branding/
    └── logo.txt          # Logo copiada
```

### 4. Executar o Cliente

```bash
# Desenvolvimento
node dist/clients/minha-empresa/cli.ts "ajude-me com code review"

# Produção (após npm install && npm run build em dist/clients/minha-empresa)
minha-empresa "deploy em staging"
```

---

## Referência de Configuração

### Provedor LLM

```yaml
llm:
  provider: anthropic | openai | azure
  model: claude-sonnet-4-20250514 | gpt-4o | gpt-4o-mini
  apiKey: ${API_KEY_ENV_VAR}
  # Específico do Azure:
  # endpoint: https://seu-resource.openai.azure.com/
  # apiVersion: 2024-02-15-preview
  # deploymentName: seu-deployment
```

### Modos

| Modo | Somente leitura | Auto-execução | Confirmação | Caso de uso |
|------|-----------------|---------------|-------------|-------------|
| `plan` | Sim | Configurável | Sempre | Análise, planejamento |
| `build` | Não | Configurável | Configurável | Implementação |
| `yolo` | Não | Sim | Nunca | Hotfixes, tarefas urgentes |
| `default` | Não | Não | Ferramentas destrutivas | Sessões interativas |

### Memória

#### Auto Memory

Persiste aprendizados entre sessões em `memory/MEMORY.md`:

```yaml
memory:
  auto:
    enabled: true
    maxLines: 200    # Máximo de linhas antes da compactação
    maxKB: 25        # Tamanho máximo em KB
```

#### Memória Vetorial

Busca semântica em documentação corporativa:

```yaml
memory:
  vector:
    provider: qdrant | pinecone | none
    qdrant:
      url: ${QDRANT_URL}
      apiKey: ${QDRANT_API_KEY}
      collection: meus-docs
    pinecone:
      apiKey: ${PINECONE_API_KEY}
      environment: us-east-1
      index: meus-docs
    indexer:
      sources:
        - type: local
          path: ./docs
          patterns: ["**/*.md", "**/*.pdf"]
        - type: web
          urls: ["https://docs.minhaempresa.com"]
        - type: confluence
          url: https://minhaempresa.atlassian.net
          spaces: ["ENG", "PROD"]
          auth: ${CONFLUENCE_TOKEN}
      chunkSize: 1000
      overlap: 200
```

### Servidores MCP

Conecte-se a ferramentas externas:

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
  logo: "./branding/logo.txt"  # Caminho para o logo ASCII
  colors:
    primary: "#3B82F6"         # Azul
    secondary: "#10B981"       # Verde
    accent: "#F59E0B"          # Âmbar
    error: "#EF4444"           # Vermelho
    warning: "#F59E0B"         # Âmbar
    success: "#10B981"         # Verde
  theme: professional | casual | technical
```

---

## Criando Skills Personalizadas

Skills são unidades de conhecimento no formato SKILL.md.

### Estrutura do Arquivo de Skill

```markdown
---
name: deploy
description: Deploy da aplicação em produção
disable-model-invocation: true
user-invocable: true
allowed-tools:
  - Bash(git *)
  - Bash(npm *)
  - Bash(docker *)
context: fork
---

# Deploy $ARGUMENTS

## Passos

1. Executar suite de testes:
   ```bash
   npm test
   ```

2. Buildar para produção:
   ```bash
   npm run build
   ```

3. Criar imagem Docker:
   ```bash
   docker build -t minhaapp:$ARGUMENTS .
   ```

4. Enviar para registry:
   ```bash
   docker push registry/minhaapp:$ARGUMENTS
   ```

5. Deploy:
   ```bash
   kubectl set image deployment/minhaapp minhaapp=registry/minhaapp:$ARGUMENTS
   ```

6. Verificar rollout:
   ```bash
   kubectl rollout status deployment/minhaapp
   ```
```

### Opções do Frontmatter

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Nome da skill (nome do arquivo sem .md) |
| `description` | string | Descrição curta |
| `disable-model-invocation` | boolean | Somente o usuário pode invocar |
| `user-invocable` | boolean | O usuário pode invocar diretamente |
| `allowed-tools` | string[] | Ferramentas permitidas nesta skill |
| `disallowed-tools` | string[] | Ferramentas bloqueadas nesta skill |
| `context` | "inline" \| "fork" | Contexto de execução |
| `model` | string | Substituir modelo LLM |
| `effort` | string | Nível de esforço de raciocínio |
| `agent` | string | Agent a utilizar |
| `tags` | string[] | Tags para organização |
| `argumentHint` | string | Dica para argumentos |

### Variáveis

| Variável | Descrição |
|----------|-----------|
| `$ARGUMENTS` | Todos os argumentos juntos |
| `$ARGUMENTS[0]` | Primeiro argumento |
| `$WORKING_DIR` | Diretório atual |
| `$SESSION_ID` | Identificador da sessão |
| `$CLIENT_ID` | Nome do cliente |
| `$MODE` | Modo atual |

### Precedência de Skills

Skills são resolvidas com esta precedência (a mais alta vence):

1. Skills do **Projeto** (na raiz do projeto)
2. Skills do **Cliente** (em `src/clients/{nome}/skills/`)
3. Skills **Built-in** (em `src/core/skills/builtin/`)

---

## Criando Agents Personalizados

Defina agents em arquivos Markdown com frontmatter.

### Estrutura do Arquivo de Agent

```markdown
---
name: security-reviewer
description: Revisor de código focado em segurança
model: claude-sonnet-4-20250514
maxTurns: 10
tools:
  - read
  - grep
  - glob
---

Você é um especialista em segurança revisando código em busca de vulnerabilidades.

Foque em:
- Injeção SQL
- Vulnerabilidades XSS
- Problemas de autenticação/autorização
- Segredos no código
- Vulnerabilidades de dependências

Ao revisar, forneça:
1. Nível de severidade (Crítico/Alto/Médio/Baixo)
2. Localização (arquivo:linha)
3. Descrição do problema
4. Correção recomendada
```

---

## CLAUDE.md

O arquivo `CLAUDE.md` fornece instruções persistentes ao agent de IA.

```markdown
# Assistente IA da Minha Empresa

## Contexto do Projeto

Este é o assistente IA da Minha Empresa. Ele ajuda com:

- Code review e qualidade
- Decisões de arquitetura
- Deploy e operações
- Documentação

## Convenções

- Use TypeScript para todo código novo
- Siga as regras do ESLint em .eslintrc
- Escreva testes para novas funcionalidades
- Use conventional commits

## Segurança

- Nunca registre API keys ou segredos
- Valide toda entrada do usuário
- Use queries parametrizadas
- Siga as diretrizes OWASP

## Estrutura da Equipe

- Equipe Frontend: React/Next.js
- Equipe Backend: Node.js/Express
- Equipe DevOps: Kubernetes/AWS
```

---

## Listando Clientes

```bash
your-harness list-clients
```

Saída:

```
Clientes disponíveis:

  minha-empresa      v1.0.0    anthropic
  jogatinando        v1.0.0    anthropic
  acme-corp          v2.1.0    openai
```

---

## Variáveis de Ambiente

Use a sintaxe `${VAR_NAME}` nos arquivos de configuração. A CLI resolve essas variáveis em tempo de execução.

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

## Boas Práticas

### 1. Comece Mínimo

Comece com uma configuração básica e adicione funcionalidades conforme necessário:

```yaml
name: minha-app
command: minha-app
version: "1.0.0"
llm:
  provider: anthropic
  model: claude-sonnet-4-20250514
```

### 2. Use Variáveis de Ambiente

Nunca commite segredos. Use a sintaxe `${VAR}`:

```yaml
apiKey: ${ANTHROPIC_API_KEY}  # ✓
apiKey: sk-ant-...            # ✗
```

### 3. Organize as Skills

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

### 4. Versione seu Cliente

Incremente a versão ao fazer alterações incompatíveis:

```yaml
version: "1.2.0"  # Não "1.0.0" para sempre
```

### 5. Teste Localmente

Build e teste antes de fazer deploy:

```bash
your-harness build-client minha-app
node dist/clients/minha-app/cli.ts --help
```

---

## Solução de Problemas

### Erro de Validação de Configuração

```
Error: Invalid config: name is required
```

**Correção:** Verifique se `name` está presente em `config.yaml`.

### Falha na Conexão LLM

```
Error: Anthropic API error: 401 Unauthorized
```

**Correção:** Verifique a variável de ambiente `ANTHROPIC_API_KEY`.

### Servidor MCP Não Conectando

```
Error: MCP server "github" connection failed
```

**Correção:** Verifique a URL do servidor e as credenciais na configuração.

### Memória Não Persistindo

```
Warning: MEMORY.md not found
```

**Correção:** Crie `memory/MEMORY.md` no diretório do cliente.
