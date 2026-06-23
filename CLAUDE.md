# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nopalou** — a Senegalese price comparison platform covering products, real estate (immo), and telecom offers. The project has two frontends:
1. A legacy vanilla JS SPA (`frontend/`) served by the Express backend
2. A modern Next.js 14 app (`frontend-next/`) under active development (runs on port 3001)

The Express backend runs on port 3000 and also serves the legacy frontend.

## Development Commands

### Backend (root)
```bash
npm run dev        # Start backend with nodemon (port 3000)
npm start          # Start backend without hot-reload
npm run migrate    # Run DB migrations manually
```

### Next.js frontend
```bash
cd frontend-next
npm run dev        # Start Next.js dev server (port 3001)
npm run build      # Build for production
npm run lint       # ESLint
```

### Database
```bash
createdb prixmalin            # Create the database
npm run migrate               # Apply schema (idempotent — runs automatically on backend startup too)
```

## Architecture

### Backend (`backend/`)
- **`app.js`** — Express entry point. Runs auto-migration on startup, then starts scrapers unless `SCRAPING_DISABLED=true`. Serves the legacy `frontend/` as static files.
- **`models/db.js`** — Single shared `pg.Pool` instance. Import with `const { pool } = require('./models/db')`.
- **`routes/`** — One file per domain (`produits`, `offres`, `alertes`, `auth`, `scraper`, `telecom`, `immo`, `partenaires`, `annonces`, `boutiques`, `paiement`).
- **`services/`** — Background workers: `scraper.js` (orchestrates all scrapers via `node-cron`), `matching.js`, `notifications.js`, `email.js`, `cloudinary.js`. Multiple immo scrapers: `scraper-immo-coinafrique.js`, `scraper-immo-expat.js`, `scraper-immo-facebook.js`.
- **`middlewares/auth.js`** — `verifierToken` (JWT Bearer), `tokenOptional`, `adminSecretOnly` (header `X-Admin-Secret`).
- **`migrate-inline.js`** — Idempotent `CREATE TABLE IF NOT EXISTS` migration called at startup.

### Next.js App (`frontend-next/src/`)
- **`middleware.ts`** — Runs on every non-static request. Verifies `nopalou_session` cookie (JWT via `jose`), redirects unauthenticated users away from protected routes, and injects CSP nonce headers.
- **`lib/session.ts`** — Server-only. Creates/reads/deletes the httpOnly `nopalou_session` cookie using `jose` (HS256). Key: `SESSION_SECRET` env var.
- **`lib/dal.ts`** — Data Access Layer. `verifySession()` (redirects to `/connexion` if no session) and `getOptionalSession()` — both use React `cache()` to deduplicate within a render.
- **`lib/api.ts`** — `apiFetch<T>(path)` — server-side fetch to backend with 5-minute Next.js cache revalidation.
- **`app/actions/auth.ts`** — Server Actions for `login`, `signup`, `logout`. These call the Express backend API then create/delete the session cookie.
- **`next.config.js`** — Rewrites `/api/*` → `NEXT_PUBLIC_BACKEND_URL/api/*`. Allowed image domains are explicitly listed (no wildcards except for specific vendors).

### Auth Architecture (two separate systems)
- **Backend**: JWT Bearer tokens (`Authorization: Bearer <token>`) validated by `verifierToken` middleware. Token signed with `JWT_SECRET`.
- **Next.js**: httpOnly cookies (`nopalou_session`) signed with `SESSION_SECRET`. The Next.js Server Actions call the Express API to authenticate, then set the cookie independently. These are two different secrets and two different token formats.

### Deployment
- `render.yaml` defines a single "yombale-backend" web service on Render (Node 18). `SCRAPING_DISABLED=true` is set by default on Render to avoid scraping on the free tier.
- No Redis dependency in the current codebase (listed in `.env.example` but no Redis client is imported).

## Key Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection (required) |
| `JWT_SECRET` | Backend | Signs JWT tokens for API auth (required) |
| `SESSION_SECRET` | Next.js | Signs session cookies (required for Next.js) |
| `NEXT_PUBLIC_BACKEND_URL` | Next.js | Backend URL for API rewrites and server fetches |
| `ADMIN_SECRET` | Backend | Guards `/admin*.html` pages and `/api/*/admin` routes |
| `SCRAPING_DISABLED` | Backend | Set to `true` to skip scraper startup |
| `CLOUDINARY_*` | Backend | Image uploads (boutiques, annonces) |

## Admin Pages

The HTML admin pages (`/admin.html`, `/admin-immo.html`, etc.) in `frontend/` are protected by `adminPageGuard` middleware in `app.js`. They require the `X-Admin-Secret` header matching `ADMIN_SECRET`. API admin routes use `adminSecretOnly` middleware.
