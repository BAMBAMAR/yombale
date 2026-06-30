# Déploiement Nopalou — Checklist complète

## Architecture cible

```
Render (Free/Starter)
├── yombale-backend    → backend Express (port auto)
│   ├── /health        → healthcheck Render
│   └── /api/*         → toutes les routes
└── nopalou-frontend   → Next.js standalone (port auto)
    └── /api/ping      → healthcheck Render

Render PostgreSQL (ou Neon / Supabase)
└── DATABASE_URL       → injectée dans yombale-backend
```

---

## 1. Base de données

### Option A — Render PostgreSQL (recommandé si même compte Render)
1. Dashboard Render → **New → PostgreSQL**
2. Nom : `nopalou-db`, plan : Free (ou Starter pour production)
3. Copier la **Internal Database URL** → `DATABASE_URL` du backend

### Option B — Neon (free tier généreux, 0.5 GB)
1. [neon.tech](https://neon.tech) → Create project → Copier la connection string
2. Cocher **SSL mode = require**

> La migration s'exécute automatiquement au démarrage (`migrate-inline.js`), pas d'action manuelle requise.

---

## 2. Déployer le backend (`yombale-backend`)

### Sur Render
1. **New → Web Service** → connecter le repo GitHub
2. **Root directory** : *(laisser vide — racine du repo)*
3. **Runtime** : Node
4. **Build command** : `npm install`
5. **Start command** : `node backend/app.js`
6. **Health check path** : `/health`
7. Plan : Free (ou Starter si scraping activé)

### Variables d'environnement à renseigner

| Variable | Valeur / Source |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | URL PostgreSQL (voir §1) |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `ADMIN_SECRET` | chaîne aléatoire ≥ 32 chars |
| `FRONTEND_URL` | URL publique du frontend Next.js (ex: `https://nopalou.com`) |
| `BACKEND_URL` | URL publique du backend (ex: `https://yombale-backend.onrender.com`) |
| `RESEND_API_KEY` | Dashboard [resend.com](https://resend.com) → API Keys |
| `EMAIL_FROM` | `Nopalou <noreply@nopalou.com>` (après validation DNS Resend) |
| `ADMIN_EMAIL` | email de l'admin |
| `CLOUDINARY_CLOUD_NAME` | Dashboard Cloudinary → Settings → API Keys |
| `CLOUDINARY_API_KEY` | idem |
| `CLOUDINARY_API_SECRET` | idem |
| `WAVE_API_KEY` | Dashboard Wave for Business → API |
| `WAVE_WEBHOOK_SECRET` | Générer et coller dans l'interface Wave webhook |
| `SCRAPING_DISABLED` | `true` (plan gratuit) ou `false` (plan payant) |

Variables optionnelles (activer selon les features) :

| Variable | Feature |
|---|---|
| `ORANGE_CLIENT_SECRET` / `ORANGE_MERCHANT_KEY` | Paiement Orange Money |
| `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_API_TOKEN` / `WHATSAPP_APP_SECRET` / `WHATSAPP_VERIFY_TOKEN` / `WHATSAPP_CATALOG_ID` / `WHATSAPP_BUSINESS_ACCOUNT_ID` | WhatsApp Business API |
| `FB_PAGE_ID` / `FB_PAGE_ACCESS_TOKEN` / `FB_APP_ID` / `FB_APP_SECRET` / `IG_USER_ID` | Publication auto Facebook/Instagram |
| `FB_EMAIL` / `FB_PASSWORD` | Scraper immo Facebook |

---

## 3. Déployer le frontend (`nopalou-frontend`)

### Sur Render
1. **New → Web Service** → même repo GitHub
2. **Root directory** : `frontend-next`
3. **Runtime** : Node
4. **Build command** : `npm install --include=dev && npm run build`
   *(inclut automatiquement le postbuild qui copie public/ et .next/static/ dans standalone)*
5. **Start command** : `node .next/standalone/server.js`
6. **Health check path** : `/api/ping`
7. Plan : Free

### Variables d'environnement

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `BACKEND_URL` | URL interne Render du backend (ex: `https://yombale-backend.onrender.com`) |
| `NEXT_PUBLIC_BACKEND_URL` | même URL publique |
| `NEXT_PUBLIC_SITE_URL` | `https://nopalou.com` |
| `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `JWT_SECRET` | **identique** au `JWT_SECRET` du backend |

> ⚠️ `JWT_SECRET` doit être **exactement le même** dans les deux services. C'est ce qui permet au frontend de minter des tokens valides pour le backend.

---

## 4. Domaine custom (`nopalou.com`)

### Frontend
1. Dashboard Render → `nopalou-frontend` → **Custom Domains** → Ajouter `nopalou.com` et `www.nopalou.com`
2. Chez votre registrar DNS : ajouter les enregistrements CNAME fournis par Render
3. Render gère le SSL Let's Encrypt automatiquement

### Backend (si API sous sous-domaine)
- Option A : garder l'URL `*.onrender.com` en interne (recommandé pour commencer)
- Option B : ajouter `api.nopalou.com` → CNAME vers `yombale-backend.onrender.com`
- Dans ce cas mettre `FRONTEND_URL=https://nopalou.com` et `BACKEND_URL=https://api.nopalou.com`

---

## 5. Emails — validation domaine Resend

1. [resend.com](https://resend.com) → **Domains** → Add domain → `nopalou.com`
2. Ajouter les 3 enregistrements DNS (SPF, DKIM, DMARC) fournis par Resend
3. Attendre la validation (5-30 min)
4. Mettre `EMAIL_FROM=Nopalou <noreply@nopalou.com>`

---

## 6. Vérifications post-déploiement

```bash
# Backend opérationnel
curl https://yombale-backend.onrender.com/health
# → {"status":"ok","db":"ok",...}

# Frontend opérationnel
curl https://nopalou.com/api/ping
# → {"ok":true}

# CORS OK (frontend → backend)
# Ouvrir https://nopalou.com → vérifier que les produits se chargent
# Se connecter → vérifier que /compte fonctionne

# Migration OK
# Dans les logs Render du backend : "[MIGRATE] ✅ Tables comptabilité boutique OK"
```

---

## 7. WhatsApp Business — configuration Meta (séparée, 3-7 jours)

Voir `docs/superpowers/plans/2026-06-29-whatsapp-catalogue-chatbot.md` pour le guide complet.

Étapes principales :
1. Business Manager → vérification entreprise
2. Créer un WABA (WhatsApp Business Account)
3. Ajouter un numéro dédié (SIM Sonatel ou Expresso recommandé)
4. Soumettre les 4 templates pour approbation Meta :
   - `nopalou_carousel_annonce`
   - `nopalou_carousel_immo`
   - `nopalou_carousel_telecom`
   - `nopalou_fiche_texte`
5. Configurer le webhook : `https://yombale-backend.onrender.com/api/whatsapp`
6. Renseigner les 6 variables `WHATSAPP_*` dans Render
