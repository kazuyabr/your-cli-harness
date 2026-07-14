# Manual Testing Guide — Your CLI Harness v0.1.0

> **IMPORTANTE**: Execute os passos na ordem EXATA. Cada `create-client` DEVE ser seguido de `build-client` + `npm link` antes de testar o cliente.

---

## FASE 1 — SETUP INICIAL

```
 1. npm run build
 2. npm link
 3. harness delete-client --all
```

**Verificações:**
- [ ] `npm run build` — build limpo
- [ ] `npm link` — `harness` instalado globalmente
- [ ] `harness delete-client --all` — limpa todos os clientes + bin entries órfãos

---

## FASE 2 — CICLO CRUD COMPLETO

```
 4. harness create-client jogatinando
 5. harness build-client jogatinando
 6. npm link
 7. jogatinando --help
 8. harness create-client jogatinando
 9. harness delete-client jogatinando
10. harness create-client jogatinando
11. harness build-client jogatinando
12. npm link
```

**Verificações:**
- [ ] Passo 4 — Cria `src/clients/jogatinando/` com estrutura completa
- [ ] Passo 5 — Compila `dist/clients/jogatinando/cli.js` + adiciona `jogatinando` ao `bin`
- [ ] Passo 6 — `npm link` linka `jogatinando` globalmente
- [ ] Passo 7 — `jogatinando --help` mostra TODOS os comandos (help, status, config, memory, compact, skills, economy, language)
- [ ] Passo 8 — Informa "already exists" (sem crashar)
- [ ] Passo 9 — Deleta cliente (src + dist + bin entry)
- [ ] Passo 10 — Recria cliente
- [ ] Passo 11 — Recompila + re-adiciona ao bin
- [ ] Passo 12 — Re-linka

---

## FASE 3 — HARNESS CLI

```
13. harness --help
14. harness list-clients
```

**Verificações:**
- [ ] Passo 13 — Mostra comandos (create-client, build-client, delete-client, list-clients, init)
- [ ] Passo 14 — Lista `jogatinando` com provider e modelo

---

## FASE 4 — CLIENTE CLI

```
15. jogatinando --help
16. jogatinando help
17. jogatinando status
18. jogatinando config
19. jogatinando memory --show
20. jogatinando memory --add "Nota de teste"
21. jogatinando memory --show
22. jogatinando memory --clear
23. jogatinando compact
24. jogatinando skills
25. jogatinando economy
26. jogatinando language pt-BR
27. jogatinando language
28. jogatinando
```

**Verificações:**
- [ ] Passo 15 — `--help` mostra todos os comandos
- [ ] Passo 16 — `help` mostra logo FIGlet + lista de comandos
- [ ] Passo 17 — `status` mostra session ID, client, mode, tokens, headroom
- [ ] Passo 18 — `config` mostra nome, command, version, LLM, maxTokens, theme, modes
- [ ] Passo 19 — `memory --show` mostra memória (vazia ou conteúdo)
- [ ] Passo 20 — `memory --add` adiciona nota (confirma "Note added")
- [ ] Passo 21 — `memory --show` mostra nota adicionada
- [ ] Passo 22 — `memory --clear` limpa memória (confirma "Memory cleared")
- [ ] Passo 23 — `compact` confirma "Context compacted successfully"
- [ ] Passo 24 — `skills` lista skills disponíveis
- [ ] Passo 25 — `economy` mostra Token Economy Stats (Headroom, Caveman)
- [ ] Passo 26 — `language pt-BR` salva preferência (confirma "Language changed to: pt-BR")
- [ ] Passo 27 — `language` mostra "Current language: pt-BR" (persistido)
- [ ] Passo 28 — Sem argumentos abre TUI interativo (Ink)

---

## FASE 5 — TUI (interativo)

Dentro do TUI (passo 28):

```
29. Digitar "Hello" + Enter
30. Digitar "/help" + Enter
31. Digitar "/" (abre menu slash)
32. ↑↓ navegar no menu
33. Enter para selecionar comando
34. Esc para fechar menu
35. Ctrl+C para sair
```

**Verificações:**
- [ ] Passo 29 — Mensagem "You: Hello" aparece + resposta do assistant
- [ ] Passo 30 — Lista de comandos slash aparece
- [ ] Passo 31 — Menu slash abre com lista navegável
- [ ] Passo 32 — Setas mudam seleção
- [ ] Passo 33 — Enter executa comando selecionado
- [ ] Passo 34 — Esc fecha menu
- [ ] Passo 35 — Ctrl+C sai da TUI

---

## FASE 6 — MODOS

```
36. jogatinando --plan "Analise este código"
37. jogatinando --build "Implemente feature"
```

**Verificações:**
- [ ] Passo 36 — Modo "plan" ativa (read-only)
- [ ] Passo 37 — Modo "build" ativa

---

## FASE 7 — VERIFICAÇÃO FINAL

```
38. npm test
39. npm run typecheck
40. npm run build
```

**Verificações:**
- [ ] Passo 38 — Todos os testes passam (565+)
- [ ] Passo 39 — TypeScript 0 erros
- [ ] Passo 40 — Build limpo

---

## LIMPEZA

```
harness delete-client --all
```

---

## Troubleshooting

### "jogatinando is not recognized"
Você esqueceu de rodar `harness build-client jogatinando` + `npm link` após `harness create-client jogatinando`.

### "already exists" aparece como erro
Esperado. O `create-client` informa graciosamente que o cliente já existe.

### TUI não abre (Raw mode error)
Esperado em pipes não-interativos. No terminal real funciona normalmente.

### Language não persiste
Verifique se `harness build-client jogatinando` foi rodado após `harness create-client`. O template gerado inclui `LanguagePersistence`.
