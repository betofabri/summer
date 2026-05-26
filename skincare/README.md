# Skin

App pessoal de skincare. Você abre à noite, diz como a pele está, e o app sugere a rotina baseado nos seus produtos + o que você usou nos últimos dias.

## Stack

- **Frontend** — React + Vite + TS + Tailwind v4 (PWA)
- **Backend** — Cloudflare Worker único, serve API + assets
- **DB** — D1 (SQLite) com 3 tabelas: `products`, `daily_log`, `routine_log`
- **AI** — Claude Haiku 4.5 escolhe a rotina a partir da lista já filtrada por regras determinísticas

## Como o motor funciona

1. Você diz: estado da pele + fiz a barba (sim/não) + nota opcional
2. Worker filtra produtos por regras duras:
   - Ácido nos últimos 2 dias → remove ácidos hoje
   - Retinol nos últimos 2 dias → remove retinol
   - Pós-barba ou pele irritada → só hidratação/calmantes
   - Vermelhidão/ressecada → só intensidade baixa, sem retinol
3. Claude recebe a lista filtrada + contexto e devolve uma rotina ordenada de 2-4 produtos
4. Você confirma o que aplicou e o app salva no `routine_log`

Conflitos perigosos nunca chegam no Claude — são bloqueados antes.

## Setup (rodar uma vez)

### 1. Cria o D1 remoto

```bash
npx wrangler d1 create skincare-db
```

Copia o `database_id` do output e cola em `wrangler.jsonc` no lugar de `REPLACE_WITH_DATABASE_ID`.

### 2. Aplica o schema

```bash
# Remoto (produção)
npm run db:apply:remote

# Local (pra testar com wrangler dev)
npm run db:apply:local
```

### 3. Configura os secrets

```bash
# Token de acesso pessoal — qualquer string aleatória que você escolher.
# Você vai precisar dele pra entrar no app no celular.
npx wrangler secret put ACCESS_TOKEN

# Sua API key da Anthropic (pega em console.anthropic.com)
npx wrangler secret put ANTHROPIC_API_KEY
```

Pra dev local, cria `.dev.vars`:

```
ACCESS_TOKEN=qualquer-string-aleatoria
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Deploy

```bash
npm run deploy
```

Vai ficar em `https://skincare.<seu-subdomain>.workers.dev`. Abre no iPhone → Compartilhar → Adicionar à Tela de Início pra virar PWA.

### 5. (Opcional) Servir em `betofabri.com/summer/skincare/*`

No painel Cloudflare → Workers & Pages → `skincare` worker → **Settings → Triggers → Routes** → Add Route:

```
Route:  betofabri.com/summer/skincare/*
Zone:   betofabri.com
```

Como esta rota é mais específica que `betofabri.com/summer/*` (o app de dieta), o Cloudflare resolve ela primeiro — o app de dieta continua intacto.

⚠️ O worker do skincare hoje espera os paths sem prefixo (`/api/bootstrap`, `/`). Se você mapear pra `betofabri.com/summer/skincare/*`, o path que chega no worker vai ser `/summer/skincare/api/bootstrap`. Pra funcionar, ou (a) configura **Transform Rules** removendo o prefixo, ou (b) ajusta o worker pra reconhecer o prefixo. Avisa que eu adapto.

## Desenvolvimento local

```bash
# Terminal 1 — backend
npx wrangler dev

# Terminal 2 — frontend
npm run dev
```

Vite roda em `localhost:5173` e proxia `/api/*` pro worker em `:8787`.

## Editar catálogo de produtos

Edita `schema.sql` e reaplica:

```bash
npm run db:apply:remote
```

⚠️ O schema dropa e recria — você perde o histórico. Pra mudar só produtos preservando logs, faça `INSERT`/`UPDATE` direto:

```bash
npx wrangler d1 execute skincare-db --remote --command "INSERT INTO products VALUES (...)"
```

## Estrutura

```
worker/         API + lógica de sugestão
  index.ts      rotas
  suggest.ts    filtro de conflitos + chamada Claude
  db.ts         queries D1
  types.ts      tipos compartilhados
src/            React app
  App.tsx       orquestrador
  components/   UI
  lib/          api client + tipos
schema.sql      DDL + seed dos produtos
wrangler.jsonc  config Cloudflare
```
