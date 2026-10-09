# Audit du dépôt Nopalou (Phase 0)

> Rempli par l'agent à partir de `docs/surga/INTEGRATION_NOPALOU.md`, section 1, puis validé par
> le porteur du projet. Ce fichier décrit la réalité du dépôt ; il prime sur les hypothèses de
> stack des autres documents.

Date de l'audit : 2026-10-04 (lecture seule, aucun fichier de code modifié)
Branche et commit audités : `main` @ `31c91b12`
Validation : audit et réponses validés par le porteur du projet le 2026-10-04

## 1. Gouvernance de l'agent
- `CLAUDE.md` existant (863 lignes) : règles en lignes 1-29, puis journal des versions.
  - **Git** : aucun `git push` sans ordre explicite ; journal des livraisons dans
    `docs/JOURNAL-LIVRAISONS.md` ; jamais de jeton dans l'URL du remote (AUD-136).
  - **Code / UI** : zéro émoji, `lucide-react` 14/16/18px, composants < 450 lignes, CSS dans
    des fichiers dédiés, tokens obligatoires (pas de hex inline), ergonomie épurée (tiroirs
    contextuels, pleine largeur, cartes en 2 sous-lignes, en-têtes monolignes).
  - **Sécurité** : anti-IDOR via `requireBoutiqueOwnership` / `checkBoutiqueAccess`, 404 API
    en JSON strict.
  - **Audit** : environnement isolé `scripts/audit/`, jamais contre la prod ou les API réelles ;
    rapports `docs/AUDIT-*` / `docs/PLAN-*` ignorés par git.
- `AGENTS.md` (racine et `.agents/`) : mêmes règles, plus la mise à jour de `CLAUDE.md` en fin
  de session et une interdiction des polices externes (CDN).
- `BRAND.md` : charte de marque (palette, logos `/public/icons/`, zone sûre PWA).
- Incohérence interne relevée : `AGENTS.md` donne un exemple de token dans l'URL du remote,
  alors que `CLAUDE.md` (AUD-136) l'interdit. Hors périmètre Surga, signalée pour arbitrage.
- Résultat de la fusion avec `CLAUDE_SURGA.md` : fusion légère décidée (D18), texte à soumettre
  avant écriture.

## 2. Stack réelle
| Élément | Réel | Écart avec la cible |
|---|---|---|
| Frontend | Next.js 14.2 App Router, React 18, TypeScript, CSS vanilla (`frontend-next/src/styles/*.css`) | Pas de Tailwind |
| Backend | Node ≥ 18 + Express 4 (helmet, express-validator, express-rate-limit, compression), `backend/app.js` | Express au lieu de Fastify |
| ORM et base de données | PostgreSQL via `pg` brut (`backend/models/db.js`). Migrations idempotentes dans `backend/migrate-inline.js` (`CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`) + `database/migrations/001_init.sql`. CI sur Postgres 15 | Pas de Prisma |
| Recherche | `backend/services/search-service.js` : `pg_trgm`, synonymes wolof, phonétique. Adaptateur Meilisearch nommé mais non configuré | Pas de Meilisearch actif |
| Cache et sessions | `backend/services/redis-cache.js` : `ioredis` si `REDIS_URL`, sinon cache mémoire. `ioredis` absent des dépendances, donc cache mémoire en pratique. Sessions = JWT | Pas d'Upstash Redis |
| Tâches planifiées | `node-cron`, 14 `cron.schedule` (`backend/services/cron-*.js`, scraper, relances) | Conforme, réutilisable |
| IA | Gemini 1.5 Flash (`backend/services/llm-chat.js`, clé `GEMINI_API_KEY` ou réglage DB) | Fournisseur IA déjà présent |
| Observabilité | Sentry (backend et frontend) | — |
| Hébergement | Render, offre gratuite (`render.yaml` : `yombale-backend`, `nopalou-frontend`) | La cible est VPS OVH + Cloudflare |

## 3. Authentification et paiement
- **Authentification** : JWT maison (`backend/middlewares/auth.js` : `verifierToken`,
  `tokenOptional`, révocation par `jwt_version`, blocage des comptes suspendus ou anonymisés).
  Routes `backend/routes/auth.js` : email + mot de passe (`/inscription`, `/login`), **OTP
  WhatsApp** (`/whatsapp-otp-send`, `/whatsapp-otp-verify`, `/whatsapp-otp-login`,
  `/whatsapp-otp-register`), lien magique, 2FA, suppression de compte (RGPD). Les comptes
  WhatsApp sont auto-provisionnés avec `<numero>@whatsapp.nopalou.com`.
- **Fournisseur SMS** : API Orange SMS Sénégal (`backend/services/sms.js`), en repli si
  WhatsApp est indisponible. Pas d'OTP SMS primaire.
- **Paiement Mobile Money** : Wave en direct (`backend/services/wave.js`, signature HMAC),
  Orange Money via OM Pay Sonatel en direct (`backend/services/orange-money.js`), Stripe,
  paiement manuel, séquestre (`backend/routes/paiement-sequestre.js`). Routes
  `backend/routes/paiement.js` : `/wave/initier`, `/orange/initier`, webhooks, sponsoring,
  boost. Tables `abonnements`, `plans` (et `boutique_abonnements`, `kalpe_abonnements`). Pas de
  PayDunya ni de Bizao.

## 4. WhatsApp, PWA et notifications
- **API WhatsApp Business** : Meta Cloud API (Graph) via `backend/services/whatsapp.js`
  (`WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`). Un seul
  numéro (`wa.me/221708717942`), webhook `GET/POST /api/whatsapp/webhook`, chatbot comparateur
  et immobilier (`backend/services/whatsapp-chatbot.js`, `immo-chatbot.js`). Templates Meta
  utilisés en code : `nopalou_auth_otp`, `nopalou_carousel_telecoms`, `nopalou_fiche_texte`. Le
  statut d'approbation côté Meta n'a pas été vérifié (aucun appel aux API réelles).
- **PWA** : Serwist (`@serwist/next`), `frontend-next/src/app/sw.ts` qui génère
  `public/sw.js`, `public/manifest.json`, icônes `public/icons/`, mode hors ligne déjà travaillé
  (AUD-087).
- **Push web** : aucun (ni VAPID, ni `web-push`, ni table d'abonnements push).
- **Bulle « Assistant Nopalou »** : `frontend-next/src/components/chat/ChatbotWidget.tsx`
  (341 lignes), montée dans `frontend-next/src/app/layout.tsx`, appelle `/api/chat/message`
  (`backend/routes/chat.js`). Elle sert le comparateur.

## 5. Modèle de données existant
- **Modèle `User`** : table `utilisateurs` : `id` UUID, `nom`, `prenom`, `email` (UNIQUE NOT
  NULL), `mot_de_passe_hash` (NOT NULL), `telephone` (facultatif, non unique), `ville`,
  `created_at`, `email_verifie`, `a2f_actif`, `a2f_telephone`, `jwt_version`, `suspendu`,
  `supprime_le`, `supprime_par_utilisateur`, `anonymise_le`, `quota_annonces`, `est_apporteur`,
  `code_apporteur`. Pas de `phone_number` unique ni de `role`.
- **Tables immobilières** : `agences_immo`, `agence_membres`, `agence_logs`, `biens_immo`,
  `annonces_immo`, `annonces_classifiees`, `baux_immo`, `mandats_immo`, `offres_immo`,
  `visites_immo`, `contacts_immo`, `proprietaires_immo`, `transactions_immo`,
  `commissions_immo`, `credits_immo`, `factures_immo`, `maintenance_immo`,
  `notifications_immo`, `reservations_sequestre_immo`. La cible `Property` correspond à
  `biens_immo` / `annonces_immo`.
- **Tables boutiques et middleware multi-tenant** : `boutique_*` (articles, caissiers, clients,
  abonnements, avis, api_keys...). Middlewares `backend/middlewares/tenantSecurity.js`
  (`requireBoutiqueOwnership`, `checkBoutiqueAccess`) et
  `backend/middlewares/tenantSecurityImmo.js` (`requireAgenceAccess`, `checkAgenceAccess`).

## 6. Design system existant
- **Couleurs et tokens** : `frontend-next/src/styles/design-tokens.css` : `--navy` #1C2B4A,
  `--accent` #C75B00, `--accent-text` #A64800, `--price` #0A5C36, `--bg` #F8F5F0, `--border`
  #E8DDD2, `--text1` #1A1612, `--text2` #5A4E42, `--text3` #73675E. Police système
  (`--font-inter`). **Texte de base 14px** (`--text-base`). Classes `.btn-npl`, `.badge-npl`.
- **Icônes** : `lucide-react` ; linter anti-émoji `npm run lint:slop`.
- **Config Tailwind** : aucune.

## 7. Conventions et qualité
- **Hooks** : aucun hook pre-commit (ni husky ni lint-staged, pas de hook actif dans
  `.git/hooks`). Script manuel `npm run pre-push` (`scripts/quality-gate.mjs`).
- **Linter** : `next lint` (ESLint 8, `eslint-config-next`), `lint:slop`, `tsc --noEmit`.
- **CI** : `.github/workflows/ci-tests.yml` (push sur `main`/`develop`, PR vers `main`) :
  TypeScript, anti-slop, tests unitaires frontend, Jest backend (373 tests unitaires + 22 tests
  d'intégration sur Postgres 15), Playwright E2E. `db-backup.yml` pour les sauvegardes. Pas de
  seuil de couverture à 70 %.
- **Découpage** : composants < 450 lignes, sous-dossiers `components/`, CSS dédiés par écran.

## 8. Écarts et réponses de l'utilisateur
Décisions reportées dans `docs/surga/DECISIONS.md` (D11 à D18).

| # | Question posée | Réponse / décision |
|---|---|---|
| Q1 | Stack réelle (Express, `pg`, CSS vanilla) ou migration vers Fastify, Prisma et Tailwind ? | **D11** : stack existante. Routes `backend/routes/surga/`, migrations SQL dans le mécanisme actuel, CSS vanilla |
| Q2 | Rattachement au modèle `utilisateurs` ? | **D12** : `utilisateurs` inchangée ; table `surga_preferences` (FK) et tables Surga dédiées ; connexion par l'OTP WhatsApp existant |
| Q3 | Paiement du premium Surga ? | **D13** : Wave et Orange Money existants, même compte marchand, type `surga_premium`, tables `abonnements` / `plans` |
| Q4 | Charte : Nopalou ou `DESIGN.md` ? (choix fait sur aperçus) | **D14** : design system Nopalou ; base 16px limitée aux écrans Surga via une classe de portée |
| Q5 | WhatsApp : même numéro ou numéro dédié ? | **D15** : même numéro et même webhook, routage par intention vers `backend/services/surga/` |
| Q6 | PWA : étendre l'existante ou en créer une séparée ? | **D16** : PWA Surga séparée (manifest et scope `/surga`, service worker dédié) |
| Q7 | Bulle « Assistant Nopalou » ? | **D17** : la bulle garde son rôle pour Nopalou ; Surga reçoit son propre point d'entrée visible |
| Q8 | Fusion de `CLAUDE.md` ? | **D18** : fusion légère (section `## Module Surga — Règles Spécifiques` qui renvoie à `CLAUDE_SURGA.md`) |

### Points de vigilance
- **D16** : le service worker racine (`/sw.js`) contrôle aussi `/surga`. Il faut un worker
  `/surga/sw.js` de scope `/surga/` et vérifier que le worker racine n'intercepte plus ces routes.
  À tester en Tranche 1.
- **D17** : l'emplacement du point d'entrée (navbar, nav mobile, accueil) est à choisir en
  début de Tranche 1, sur aperçus.
- **D14** : la police reste la pile système (interdiction des polices externes, `AGENTS.md`).
- **Écarts qualité, à traiter plus tard** : pas de pre-commit, pas de seuil de couverture,
  Redis non installé, aucun Web Push (à créer pour Surga), hébergement Render gratuit.
- **Templates WhatsApp Surga** (briefing, rappel, confirmation) : à créer et faire approuver
  par Meta (point ouvert O1).
