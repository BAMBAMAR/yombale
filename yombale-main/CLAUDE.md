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

Yombale is a Senegalese price comparison app. The Express backend serves both the REST API and the frontend SPA as static files. PostgreSQL is the sole datastore (Redis is referenced in `.env.example` but currently **not used** — `db.js` bypasses it with direct queries).

### Request flow

```
Browser → Express (backend/app.js)
  ├── /api/*         → routes/* → models/db.js (PostgreSQL)
  └── *              → frontend/index.html (SPA catch-all)
```

### Data model (database/migrations/001_init.sql)

Core tables: `categories` → `produits` → `offres` → `historique_prix`  
Users: `utilisateurs` → `alertes`, `commandes`  
`marchands` tracks scraped sites with `derniere_sync`.

UUIDs as primary keys everywhere. Requires PostgreSQL extensions `uuid-ossp` and `pg_trgm` (for fuzzy product matching).

### Scraping pipeline (backend/services/scraper.js)

Three scrapers (Expat-Dakar, Jumia SN, CoinAfrique) run on a cron schedule:
- **Every 4h**: `expat + jumia + coinafrique`
- **Every 6h** (offset 2h): new sites from `scraper-new-sites.js`
- **30s after boot**: CoinAfrique only (fast initial fill)
- **90s after boot**: all new sites

Each scraper tries multiple CSS selector strategies to handle site layout changes. Scraped items go through `sauvegarderProduits()` which:
1. Rejects prices < 500 FCFA as invalid
2. Tries EAN match → fuzzy title match via `pg_trgm` similarity (threshold 0.35) → inserts new product
3. Upserts the offer and appends a row to `historique_prix`

Set `SCRAPING_DISABLED=true` in `.env` to skip scraping on startup (useful for dev).

### Product matching (backend/services/matching.js)

Title deduplication uses Jaccard similarity on word bags (threshold 0.7), with a fallback model-number extractor (e.g. "A55", "128Go") that accepts matches at 0.4. The DB-side match in `sauvegarderProduits` uses `pg_trgm` + `_motsClesCommuns` (≥2 shared keywords).

### Category classification

Categories are stored in the DB with slugs (`smartphones`, `informatique`, `tv-electro`, `mode`, `maison`, `auto-moto`, `jeux`). A keyword list (`CAT_MOTS` in scraper.js and `CAT_FALLBACK` in routes/produits.js) maps product title words to category slugs. Both lists must be kept in sync when adding categories.

### Price correction

Scraped prices are in FCFA (XOF). Several places apply runtime corrections for prices that appear divided by 100 or 1000 (common scraping artifact): `corrigerPrixXOF()` in scraper.js, and ratio-based corrections in `GET /api/produits` and `GET /api/produits/:id/offres`.

### Auth

JWT Bearer tokens via `middlewares/auth.js`. Use `verifierToken` to require auth, `tokenOptional` to attach user if token present but not require it. Admin scraper routes use a separate `ADMIN_SECRET` env var checked via `X-Admin-Secret` header.

### Startup migration

`app.js` calls `migrate-inline.js` automatically on every boot (idempotent `CREATE TABLE IF NOT EXISTS`). Manual migration via `npm run migrate` runs `backend/migrate.js` instead.

## Key environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | 64-char random hex string |
| `ADMIN_SECRET` | Protects `/api/scraper/*` write endpoints |
| `SCRAPING_DISABLED` | Set `true` to disable cron scrapers on startup |
| `FRONTEND_URL` | Added to CORS allowlist |
| `WAVE_API_KEY` / `ORANGE_*` | Payment providers |
| `AT_API_KEY` | Africa's Talking SMS |
| `SENDGRID_API_KEY` | Email notifications |
