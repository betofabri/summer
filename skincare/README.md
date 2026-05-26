# Skin

App pessoal de skincare. Você abre à noite, diz como a pele está, e o app sugere a rotina baseado nos seus produtos + o que você usou nos últimos dias.

## Stack

- **Frontend** — React + Vite + TS + Tailwind v4 (PWA)
- **Backend** — Cloudflare Worker único, serve API + assets
- **DB** — D1 (SQLite) com 3 tabelas: `products`, `daily_log`, `routine_log`
- **AI** — Gemini 2.5 Flash escolhe a rotina a partir da lista já filtrada por regras determinísticas

## Como o motor funciona

1. Você diz: estado da pele + fiz a barba (sim/não) + nota opcional
2. Worker filtra produtos por regras duras:
   - Ácido nos últimos 2 dias → remove ácidos hoje
   - Retinol nos últimos 2 dias → remove retinol
   - Pós-barba ou pele irritada → só hidratação/calmantes
   - Vermelhidão/ressecada → só intensidade baixa, sem retinol
3. Gemini recebe a lista filtrada + contexto e devolve uma rotina ordenada de 2-4 produtos
4. Você confirma o que aplicou e o app salva no `routine_log`

Conflitos perigosos nunca chegam no Gemini — são bloqueados antes.

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

# Sua API key do Gemini (pega em aistudio.google.com/apikey)
npx wrangler secret put GEMINI_API_KEY
```

Pra dev local, cria `.dev.vars`:

```
ACCESS_TOKEN=qualquer-string-aleatoria
GEMINI_API_KEY=AIza...
```

### 4. Deploy

```bash
npm run deploy
```

Sai inicialmente em `https://skincare.<seu-subdomain>.workers.dev/summer/skincare/`.

### 5. Roteamento em `betofabri.com/summer/skincare/*`

No painel Cloudflare → Workers & Pages → `skincare` worker → **Settings → Domains & Routes** → Add → Route:

```
Zone:    betofabri.com
Route:   betofabri.com/summer/skincare/*
```

Pronto. Rotas no Cloudflare resolvem por **especificidade**: `/summer/skincare/*` é mais específico que `/summer/*`, então:

- `betofabri.com/summer/` → worker `summer` (app de dieta, intocado)
- `betofabri.com/summer/skincare/` → worker `skincare` (este app)

O worker já reconhece o prefixo `/summer/skincare/` internamente, e o frontend foi construído com `base: '/summer/skincare/'` — todos os links de assets e chamadas de API saem prefixados corretamente. Nada a configurar além da rota.

Abre no iPhone → Compartilhar → Adicionar à Tela de Início pra virar PWA.

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
  suggest.ts    filtro de conflitos + chamada Gemini
  db.ts         queries D1
  types.ts      tipos compartilhados
src/            React app
  App.tsx       orquestrador
  components/   UI
  lib/          api client + tipos
schema.sql      DDL + seed dos produtos
wrangler.jsonc  config Cloudflare
```
