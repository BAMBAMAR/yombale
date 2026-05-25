# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env   # then fill in DATABASE_URL, JWT_SECRET, etc.

# Create the PostgreSQL database and run migrations
createdb prixmalin
npm run migrate        # runs backend/migrate.js

# Development (auto-restart on changes)
npm run dev            # nodemon backend/app.js → http://localhost:3000

# Production
npm start              # node backend/app.js
```

**Health check:** `GET /health` — returns DB status and version.

**Admin scraper endpoints** (require `X-Admin-Secret` header or `?secret=` query param):
```
GET  /api/scraper/status                  # stats: products, offers, last sync
GET  /api/scraper/diagnostic/:source      # dry-run: expat | jumia | coinafrique
POST /api/scraper/run                     # trigger scraping (body: { sources: [...] })
GET  /api/scraper/diagnostic-new/:siteId  # dry-run a new site
POST /api/scraper/run-new                 # trigger new-sites scraping
```

## Architecture

### Overview

Yombale (branded PrixMalin) is a Senegalese price comparison app. The Express backend serves both the REST API and the frontend SPA as static files from a single process. PostgreSQL is the sole active datastore — Redis is referenced in `.env.example` but **not used**; `models/db.js` goes directly to PostgreSQL for all queries.

### Request flow

```
Browser → Express (backend/app.js)
  ├── /api/*  → routes/* → models/db.js (PostgreSQL)
  └── *       → frontend/index.html (SPA catch-all)
```

### Data model (`database/migrations/001_init.sql`)

Core chain: `categories` → `produits` → `offres` → `historique_prix`  
Users: `utilisateurs` → `alertes`, `commandes`  
`marchands` tracks scraped merchant sites with `derniere_sync`.

UUIDs as primary keys everywhere. Requires PostgreSQL extensions `uuid-ossp` and `pg_trgm` (fuzzy product matching via trigram similarity).

### Scraping pipeline (`backend/services/scraper.js`)

Three core scrapers (Expat-Dakar, Jumia SN, CoinAfrique) plus additional sites (`scraper-new-sites.js`) run on cron schedules:
- **Every 4h**: `expat + jumia + coinafrique`
- **Every 6h** (offset 2h): new sites
- **30s after boot**: CoinAfrique fast-fill
- **90s after boot**: all new sites

Each scraper tries multiple CSS selector strategies to handle site layout changes. Scraped items flow through `sauvegarderProduits()`, which:
1. Rejects prices < 500 FCFA as invalid
2. Tries EAN match → fuzzy title match via `pg_trgm` similarity (threshold 0.35) → inserts new product
3. Upserts the offer and appends a row to `historique_prix`

Set `SCRAPING_DISABLED=true` in `.env` to skip cron scrapers on startup (recommended for dev).

### Product matching (`backend/services/matching.js`)

Title deduplication uses Jaccard similarity on word bags (threshold 0.7), with a fallback model-number extractor (e.g. "A55", "128Go") that accepts matches at 0.4. The DB-side match in `sauvegarderProduits` uses `pg_trgm` + `_motsClesCommuns` (≥2 shared keywords).

### Category classification

Categories live in the DB with slugs (`smartphones`, `informatique`, `tv-electro`, `mode`, `maison`, `auto-moto`, `jeux`). Two keyword maps must be kept in sync when adding categories:
- `CAT_MOTS` in `backend/services/scraper.js` — used at scrape time
- `CAT_FALLBACK` in `backend/routes/produits.js` — used at query time

### Price correction

Prices are in FCFA (XOF). Several places apply runtime corrections for prices that arrive divided by 100 or 1000 (common scraping artifact): `corrigerPrixXOF()` in `scraper.js`, and ratio-based corrections in `GET /api/produits` and `GET /api/produits/:id/offres`.

### Auth

JWT Bearer tokens via `backend/middlewares/auth.js`:
- `verifierToken` — require authenticated user
- `tokenOptional` — attach user if token present, but don't block unauthenticated requests

Admin scraper routes use a separate `ADMIN_SECRET` env var checked via `X-Admin-Secret` header (not JWT).

### Startup migration

`app.js` awaits `migrate-inline.js` on every boot (idempotent `CREATE TABLE IF NOT EXISTS`). Manual migration via `npm run migrate` runs `backend/migrate.js` instead.

### Frontend

Single-page application in `frontend/app.js` (no build step, no framework). Client-side features include: natural-language search parsing ("moins de 15000" → `prixMax` filter), product grid/list toggle, price comparison sidebar, favorites via localStorage, and PWA support (`manifest.json` + `service-worker.js`).

## Key environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | 64-char random hex string |
| `ADMIN_SECRET` | Protects `/api/scraper/*` write endpoints |
| `SCRAPING_DISABLED` | Set `true` to disable cron scrapers on startup |
| `FRONTEND_URL` | Added to CORS allowlist |
| `WAVE_API_KEY` / `ORANGE_*` | Wave and Orange Money payment providers |
| `AT_API_KEY` / `AT_USERNAME` | Africa's Talking SMS (alerts) |
| `SENDGRID_API_KEY` | Email notifications |
