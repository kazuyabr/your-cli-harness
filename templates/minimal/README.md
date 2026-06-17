# Minimal Client Template

This is the minimal template for creating a new client.

## Structure

```
{{client-name}}/
├── config.yaml          # Client configuration
├── CLAUDE.md            # Persistent instructions
├── branding/
│   └── logo.txt        # ASCII logo (optional)
├── agents/              # Custom agents (optional)
├── skills/              # Custom skills (optional)
└── memory/              # Initial memory (optional)
```

## Getting Started

1. Copy this template: `cp -r templates/minimal clients/{{client-name}}`
2. Edit `config.yaml` with your client details
3. Run: `harness build-client {{client-name}}`
