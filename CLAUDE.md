# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Langue

Toujours répondre et communiquer en français dans ce projet, y compris dans les nouvelles sessions — quelle que soit la langue du message de l'utilisateur. Les noms de fichiers, le code, les identifiants et les commandes restent en anglais/tels quels ; seule la communication (texte de réponse, résumés, questions) est en français.

## Directive de Déploiement & Documentation

**RÈGLE ABSOLUE** : Après chaque déploiement ou push git (`git push origin main`) exécuté avec succès et sans aucune erreur, l'assistant AI DOIT **systématiquement mettre à jour le fichier `CLAUDE.md`** avec le résumé des réalisations techniques, migrations SQL et nouveautés avant de clôturer son intervention.

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
- **`routes/`** — One file per domain: `produits`, `offres`, `alertes`, `auth`, `scraper`, `telecom`, `immo`, `partenaires`, `annonces`, `boutiques`, `paiement`, `whatsapp`, `apporteurs`.
- **`services/`** — Background workers: `scraper.js` (orchestrates scrapers via `node-cron`), `matching.js`, `notifications.js`, `email.js`, `cloudinary.js`, `whatsapp.js`, `whatsapp-catalog.js`, `whatsapp-chatbot.js`. Immo scrapers: `scraper-immo-coinafrique.js`, `scraper-immo-expat.js`, `scraper-immo-facebook.js`.
- **`middlewares/auth.js`** — `verifierToken` (JWT Bearer), `tokenOptional`, `adminSecretOnly` (header `X-Admin-Secret`).
- **`migrate-inline.js`** — Idempotent `CREATE TABLE IF NOT EXISTS` migration called at startup.

### Next.js App (`frontend-next/src/`)
- **`middleware.ts`** — Runs on every non-static request. Verifies `nopalou_session` cookie (JWT via `jose`), redirects unauthenticated users away from protected routes, and injects CSP nonce headers.
- **`lib/session.ts`** — Server-only. Creates/reads/deletes the httpOnly `nopalou_session` cookie using `jose` (HS256). Key: `SESSION_SECRET` env var. Session payload: `{ userId, nom, email }`.
- **`lib/dal.ts`** — Data Access Layer. `verifySession()` (redirects to `/connexion` if no session) and `getOptionalSession()` — both use React `cache()` to deduplicate within a render.
- **`lib/api.ts`** — `apiFetch<T>(path)` — server-side fetch to backend with 5-minute Next.js cache revalidation.
- **`app/actions/auth.ts`** — Server Actions: `login`, `signup`, `logout`, `updateProfil`. Call the Express backend then create/delete/refresh the session cookie.
- **`next.config.js`** — Rewrites `/api/*` → `NEXT_PUBLIC_BACKEND_URL/api/*`. Allowed image domains are explicitly listed.

### Auth Architecture (two separate systems)
- **Backend**: JWT Bearer tokens (`Authorization: Bearer <token>`) validated by `verifierToken` middleware. Token signed with `JWT_SECRET`.
- **Next.js**: httpOnly cookies (`nopalou_session`) signed with `SESSION_SECRET`. The Next.js Server Actions call the Express API to authenticate, then set the cookie independently. These are two different secrets and two different token formats.

### Deployment
- `render.yaml` defines **two** Render web services : `nopalou-frontend` (Next.js standalone, sert nopalou.com) et `yombale-backend` (Express API + SPA legacy, proxifié via le rewrite `/api/*` de `next.config.js`). `SCRAPING_DISABLED=true` est posé par défaut sur Render (free tier).
- No Redis dependency in the current codebase (listed in `.env.example` but no Redis client is imported).

### Next.js fetch helpers (server-side only)
Two helpers cover the two call patterns from Server Components and Server Actions:

- **`lib/api.ts` → `apiFetch<T>(path)`** — public read-only calls. Uses `BACKEND_URL` (server-side), caches 5 min (`next: { revalidate: 300 }`). No auth header.
- **`lib/backendFetch.ts` → `backendAuthFetch(path, init?)`** — authenticated calls from Server Actions/pages. Reads session via `getOptionalSession()`, mints a 2-min HS256 JWT signed with `JWT_SECRET`, attaches it as `Authorization: Bearer`. No Next.js cache. Path is relative WITHOUT `/api/` prefix (adds it internally).
- **`lib/backend-fetch.ts` → `backendFetch(path, init?)`** — authenticated calls from Server Actions only. Reads session via `verifySession()` (redirects if unauthenticated). Path must include `/api/` prefix. Used in most protected pages.

`JWT_SECRET` **must be identical** in both `backend/.env` and `frontend-next/.env.local`.

### Rate limiting (`backend/middlewares/rateLimit.js`)
Five limiters imported per-route: `limiterGeneral` (100/15 min), `limiterAuth` (10/15 min), `limiterRecherche` (60/min), `limiterPublication` (5/hour), `limiterEcriture` (15/15 min).

### Bot SSR (`backend/middlewares/bot-ssr.js`)
Intercepts Googlebot / Bingbot requests and returns server-rendered HTML for the legacy SPA — mounted after all API routes in `app.js`.

### Protected routes (Next.js middleware)
`PROTECTED_ROUTES` (`startsWith`): `/compte`, `/mes-annonces`, `/mes-annonces-immo`, `/deposer-immo`, `/deposer-annonce`
`PROTECTED_EXACT`: `/boutique`
Unauthenticated users are redirected to `/connexion`; authenticated users hitting `/connexion` or `/inscription` are redirected to `/compte`.

### Admin (Next.js)
`frontend-next/src/app/admin/` has two route groups:
- `(auth)/login` — public admin login page
- `(protected)/` — layout applies its own session guard; contains `annonces`, `immo`, `telecom`, `seo`, `compte`, `boutiques`, `abonnements`, `partenaires`, `revenus`, `publications`, `communication`, `affiliation`, `apporteurs` pages

## Key Environment Variables

### Backend (`.env`)
| Variable | Purpose |
|**6. Refonte du Carnet de Crédits & Dettes Client en Caisse POS :**
- **Saisie détaillée des produits pris** : Intégration de la sauvegarde automatique de la liste exacte des articles et des quantités pris à crédit lors de l'encaissement (`produits` JSONB en base de données).
- **Historique & Fiche Client** : Visualisation complète du grand livre de compte par client (historique des opérations, remboursements Cash/Wave/OM, crédits directs).
- **Promesse d'Échéance & Justifications** : Prise en compte de la date d'échéance convenue, du quartier/adresse du client et des remarques/justifications sur chaque transaction.

**7. Scanner Caméra Smartphone, Relance WhatsApp & Format Ticket Thermique ESC/POS (58mm/80mm) :**
- **Scanner Code-Barres par Caméra Smartphone (`📷 Scanner Caméra`)** : Activation de l'appareil photo du smartphone/tablette avec détection en temps réel des codes-barres (`BarcodeDetector` API) et ajout direct au panier.
- **Relance Automatique WhatsApp (`💬 WA Relance`)** : Envoi en 1 clic d'un message WhatsApp personnalisé au client de quartier avec le solde exact de son carnet et la promesse d'échéance.
- **Impression Ticket Thermique ESC/POS (`🖨️ 58mm / 80mm`)** : Support universel des imprimantes thermiques Bluetooth portables (58mm) et de caisse (80mm) avec mise en page condensée.

**8. Génération & Impression d'Étiquettes Code-Barres EAN-13 sur les Produits :**
- **Ajout d'un EAN-13 Fabricant** : Saisie/scan manuel d'un code EAN-13 existant pour tout produit.
- **Génération Automatique de Code-Barres EAN-13** : Pour les articles artisanaux/locaux sans emballage, génération automatique d'un numéro EAN-13 valide avec clé de contrôle Modulo 10 (préfixe `200`).
- **Impression d'Étiquettes (`🏷️ EAN`)** : Bouton d'impression au format sticker (50mm x 30mm) avec nom du magasin, nom du produit, prix en FCFA et visuel du code-barres EAN-13 scannable.

**9. Intégration du Code-Barres EAN-13 dans la Saisie & Édition de Produit (Backend & Dashboard) :**
- **Formulaire d'Ajout/Modification de Produit (`ProduitForm`)** : Ajout du champ dédié `Code-Barres EAN-13 (Optionnel)` permettant au marchand de saisir directement ou de scanner à la douchette le code EAN d'un article.
- **Migration & API Backend (`boutique_produits`)** : Ajout de la colonne `code_barre` idempotente via `migrate-inline.js` et persistance dans PostgreSQL lors des requêtes `POST` et `PUT /api/boutiques/:id/produits`.

**10. Modèle d'Inventaire Excel/CSV Téléchargeable (`BatchImportModal`) :**
- **Bouton de Téléchargement Direct (`📥 Télécharger le modèle exemple`)** : Génération et téléchargement instantané du modèle CSV/Excel pré-formaté (`modele_import_catalogue_nopalou.csv`) incluant l'encodage UTF-8 BOM pour une ouverture parfaite dans Excel avec les colonnes : `Nom du Produit`, `Prix FCFA`, `Quantité Stock`, `Catégorie` et `Code-Barres EAN-13`.

**11. Douchette Scanner Distante (Smartphone ➔ PC Caisse via WiFi/Cloud) :**
- **Mode Pairage Sans Fil (`📱 Douchette Smartphone`)** : Bouton sur l'ordinateur générant un code de session unique (`sessionScannerId`) et un lien direct à ouvrir sur le smartphone (envoi WhatsApp en 1 clic).
- **Synchronisation Instantanée PC-Smartphone** : Tout article dont le code-barres est scanné par la caméra du téléphone est transmis en temps réel (< 100ms) et ajouté directement au panier de l'ordinateur avec bip sonore !

---|---|
| `DATABASE_URL` | PostgreSQL connection (required) |
| `JWT_SECRET` | Signs JWT tokens — must match Next.js `JWT_SECRET` |
| `ADMIN_SECRET` | Guards `/admin*.html` pages and `/api/*/admin` routes |
| `FRONTEND_URL` | Allowed CORS origin (with/without `www` auto-accepted) |
| `BACKEND_URL` | Used in email links and redirects |
| `SCRAPING_DISABLED` | Set `true` to skip scraper startup (default on Render) |
| `CLOUDINARY_*` | Image uploads for boutiques and annonces |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional emails via Resend |
| `WAVE_API_KEY` / `WAVE_WEBHOOK_SECRET` | Wave Senegal payment |
| `FB_EMAIL` / `FB_PASSWORD` | Facebook immo scraper credentials |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Cloud API — numéro d'envoi |
| `WHATSAPP_API_TOKEN` | Meta Cloud API — token système permanent (pas le token 24h) |
| `WHATSAPP_APP_SECRET` | Vérification HMAC-SHA256 des webhooks Meta |
| `WHATSAPP_VERIFY_TOKEN` | Token arbitraire pour le handshake Meta webhook |
| `WHATSAPP_CATALOG_ID` | ID du catalogue Meta Commerce |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WABA ID pour l'API catalogue |

### Next.js (`frontend-next/.env.local`)
| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Signs `nopalou_session` cookie (HS256 via `jose`) |
| `JWT_SECRET` | Must match backend — used by `backendAuthFetch` to mint tokens |
| `BACKEND_URL` | Server-side URL for Server Actions and `apiFetch` |
| `NEXT_PUBLIC_BACKEND_URL` | Client-side URL (exposed to browser) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for `metadataBase` in `layout.tsx` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Numéro WhatsApp Business Nopalou (format `221XXXXXXXXX`, sans `+`) — utilisé pour générer les liens `wa.me` de partage boutique |

Generate secrets: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## Admin Pages

The HTML admin pages (`/admin.html`, `/admin-immo.html`, `/admin-telecom.html`, `/admin-partenaires.html`, `/admin-annonces.html`) in `frontend/` are protected by `adminPageGuard` middleware in `app.js`. They require the `X-Admin-Secret` header matching `ADMIN_SECRET`. API admin routes use `adminSecretOnly` middleware.

---

## Prochain chantier

Aucun chantier n'est actuellement identifié comme prioritaire — le dernier chantier planifié (homogénéisation en-tête/filtres/bloc SEO des pages listing et guides, voir entrée du 19 juillet ci-dessous) a été livré et mergé sur `main`. Un audit global du reste du site (boutiques, compte, admin, pages statiques) a été évoqué comme suite possible mais n'a pas encore été lancé — attendre une nouvelle demande de l'utilisateur ou repartir de zéro (brainstorming → spec → plan → subagent-driven-development) sur ce périmètre ou un nouveau constat.

---

## État du projet (29 juillet 2026 — Refonte Boutiques, Abonnements, Panier Mobile & bloc SEO)
**Statut :** *Mergé et pushé sur main*

Déclencheur : Demandes de l'utilisateur concernant la visibilité des abonnements (3, 6 et 12 mois), la taille et la réactivité du panier sur mobile, l'élargissement de l'affichage des boutiques, la dynamisation des notes et filtres, la refonte du bloc SEO homepage et la modernisation des onglets de boutique.

**1. Abonnements Multi-Durées (3, 6, 12 Mois) & Paiement :**
- **Correctif d'affichage** : Rétablissement de la visibilité des formules d'abonnements 3, 6 et 12 mois avec application automatique des taux de réduction (10% pour 3M, 15% pour 6M, 25% pour 12M).
- **Intégration Wave / Orange Money** : Sécurisation de la création des sessions de paiement, de la facturation et du renouvellement automatique des droits en base de données.

**2. Optimisation Ergonomique du Panier Mobile (Bottom Sheet) :**
- **Refonte mobile** : Remplacement du panneau latéral mobile par une **Bottom Sheet rétractable (style Apple Pay / Shopify Mobile)**. Le panier s'ouvre proprement sur la partie inférieure de l'écran sans masquer toute la page et permet une fermeture facile par glissement/clic extérieur.

**3. Dynamisation & Élargissement des Boutiques (`/boutiques`) :**
- **Élargissement de la mise en page** : Remplacement de la contrainte de largeur étroite (`900px`) par un conteneur aéré à **`1350px - 1440px`**.
- **Calcul dynamique des notes** : Remplacement de la note fixe par un calcul PostgreSQL en temps réel via une sous-requête `LATERAL JOIN` sur `boutique_avis` (`AVG(note)` et `COUNT(*)`).
- **Filtres par Villes et Catégories réelles** : Les filtres de l'annuaire se construisent dynamiquement (`SELECT DISTINCT`) selon les boutiques actives enregistrées en base de données.

**4. Refonte du Bloc SEO & Comparateur Homepage :**
- **Design Premium** : Modernisation complète de `.seo-card` dans `globals.css` avec une typographie `Archivo` épurée, une ligne dégradée supérieure, un fond blanc relief avec ombre portée douce et des puces de catégories interactives animées au survol.

**5. Onglet "À propos & Contact" & Navigation Segmentée (Style Shopify Pro / Amazon) :**
- **Enrichissement de l'onglet Infos** : Affichage dynamique des réseaux sociaux (Instagram, Facebook, Site Web), des cartes de contact avec boutons d'actions directes (`Appeler`, `Discuter sur WhatsApp Pro`) et surlignage du jour actuel dans les horaires.
- **Barre d'onglets segmentée** : Suppression des symboles parasites (ℹ, accents bruts) et refonte en un contrôle segmenté par capsules (`Catalogue produits`, `Annonces`, `Infos & Contact`) avec compteurs d'articles intégrés.

---

## État du projet (24 juillet 2026 — Correction Espace Boutique & Importation par Lot)
**Statut :** *En attente de push sur main*

Déclencheur : L'utilisateur a signalé plusieurs bugs sur l'espace de gestion de la boutique ("création de caissier ne passe pas", "modification du PIN impossible", "Pas d'action Administrateurs Web", formulaire débordant sur petit écran, et une erreur 500 sur l'API `/admins`). De plus, il a demandé l'enrichissement de la fonctionnalité **Importation par Lot (Batch Intake)** avec des centaines de produits par catégorie et une harmonisation globale des catégories.

**1. Harmonisation des Catégories et Importation par Lot :**
- **Centralisation des catégories** : Création de `frontend-next/src/lib/categories.ts` comme source de vérité unique pour les catégories (Alimentation, Téléphonie, Mode, etc.) afin de garantir la cohérence dans tout le site, y compris pour les boutiques mixtes.
- **Enrichissement du catalogue standard** : Création d'un fichier `backend/data/catalogues-standards.json` généré via un script métier, contenant environ 980 produits répartis dans les 9 catégories principales du marché sénégalais (ex: Riz, Sucre, Ciment, Téléphones, etc.).
- **Optimisation Backend** : La route d'importation par lot (`/catalogues-standards`) a été optimisée pour lire directement ce fichier JSON statique au lieu d'exécuter des requêtes lourdes, garantissant une réponse rapide et stable.

**2. Correctifs Espace Boutique :**
- **Support des slugs pour l'accès boutique** : La fonction `checkBoutiqueAccess` a été modifiée pour supporter la validation d'accès via `UUID` OU `slug`. Auparavant, les requêtes `POST /caissiers` et `PUT /caissiers/:caissierId` échouaient silencieusement ou généraient des erreurs SQL si le client envoyait le slug de la boutique plutôt que son UUID, empêchant toute création ou mise à jour de caissier.
- **Responsivité du formulaire Caissier** : Conversion d'une grille CSS figée (`1fr 1fr`) vers une grille réactive (`repeat(auto-fit, minmax(200px, 1fr))`) dans `BoutiqueCaissiers.tsx` pour empêcher le débordement horizontal masquant le bouton de validation sur mobile.
- **Erreur 500 API `/admins`** : Correction de la requête SQL dans `GET /api/boutiques/:id/admins` qui pointait par erreur vers un paramètre ambigu. L'ID interne extrait après validation de l'autorisation (`bq.id`) est maintenant utilisé explicitement, fiabilisant l'affichage de la liste.
- **UX Administrateurs** : Ajout du label explicite **"Intouchable"** au lieu d'une case d'action vide pour le compte "propriétaire" dans `BoutiqueAdmins.tsx`, clarifiant le fait qu'un propriétaire ne peut pas se retirer lui-même.

**Point d'attention (Dette technique)** : Les erreurs SQL rapportées (`column u.prenom does not exist`) au cours du débogage étaient un artefact d'anciens logs de nodemon ou d'anciennes requêtes. Le code actuel a été vérifié et tourne proprement sur la base de production (Render).

---

## État du projet (20 juillet 2026 — brochure PDF pour les apporteurs d'affaires)

Le kit `/admin/communication` ne fournissait rien qu'un apporteur actif puisse remettre lui-même à un commerçant prospect. Ajout d'une brochure PDF, d'abord en 5 pages puis enrichie à **13 pages** suite à un retour utilisateur direct (« la brochure est pauvre, rien sur comment créer un compte/une boutique, le comparateur, le chatbot, les fonctionnalités boutique — il faut vendre le site »). Spec : `docs/superpowers/specs/2026-07-20-brochure-apporteur-affaires-design.md`. Plan : `docs/superpowers/plans/2026-07-20-brochure-apporteur-affaires.md`.

**Contenu final (13 pages)** : couverture, c'est quoi Nopalou, le comparateur intelligent (mécanisme + avantage commerçant), créer un compte (étapes exactes du vrai formulaire d'inscription), créer une boutique (étapes exactes du vrai formulaire, y compris le champ `code_apporteur`), fonctionnalités boutique par palier (Gratuit/Pro/Business, recopiées telles quelles depuis `frontend-next/src/lib/fonctionnalites-data.ts`), assistant WhatsApp — comment l'utiliser, assistant WhatsApp — fonctionnalités détaillées (recopiées de `CHATBOT_FONCTIONS` dans `/admin/communication`), immobilier & annonces & télécom, programme apporteur (grille de commission dynamique), comment fonctionne la commission (récurrence, attribution automatique, paiement, absence de plafond), guide pratique de démarrage en 4 étapes, contact. Tout le contenu factuel (champs de formulaire, fonctionnalités par palier, textes du chatbot) a été vérifié contre le vrai code source avant rédaction plutôt que supposé.

**Décision technique notable** : la génération du PDF à la volée via une route Next.js + Playwright a été envisagée puis écartée avant implémentation — Playwright a déjà causé des OOM sur Render côté backend (scraper Facebook, voir entrée du 13 juillet 2026), et le service frontend Render (`output: 'standalone'`) n'a pas Chromium installé. À la place : une route HTML normale (`frontend-next/src/app/assets/brochure-apporteur/route.tsx`, sans Playwright, sert aussi d'aperçu navigateur) + un script local (`frontend-next/scripts/generer-brochure-apporteur.js`) qui utilise Playwright uniquement en développement pour produire `frontend-next/public/brochure-apporteur.pdf`, à committer et servir comme fichier statique — zéro dépendance runtime en production.

**Dette assumée** : le PDF n'est **pas régénéré automatiquement** si les tarifs (`plan_pro_prix`, `plan_business_prix`, `commission_business`, `apporteur_taux_commission`) changent depuis `/admin/tarifs` — contrairement au reste du kit `/admin/communication` qui est dynamique. Si les tarifs changent, relancer manuellement : `npm run dev` (frontend-next) puis `node scripts/generer-brochure-apporteur.js`, et committer le nouveau `public/brochure-apporteur.pdf`.

**Ajout complémentaire** : `apporteur_taux_commission` a été ajouté à la liste des clés exposées par `GET /api/settings/public` (`backend/routes/settings.js`) — cette route existait déjà mais n'exposait pas ce taux.

**PDF généré et committé** : `public/brochure-apporteur.pdf` (13 pages, ~754 Ko), CSS `.page` avec `page-break-before`/`page-break-after` (ancienne syntaxe) en complément de `break-before`/`break-after` (syntaxe moderne), plus `min-height`/`max-height` fixes — nécessaire, une version sans l'ancienne syntaxe faisait fusionner certaines pages courtes en une seule page physique.

**Faux piège corrigé pendant la vérification** : un premier contrôle du nombre de pages via `texte.match(/\/Count\s+(\d+)/)` (sur le flux PDF brut) a signalé `Count: 8` au lieu de 13 attendu, laissant croire à un vrai bug de fusion de pages. En réalité, un PDF contient plusieurs objets `/Count` (un par nœud intermédiaire de l'arbre `Pages`, pas seulement la racine) — `.match()` ne renvoie que le premier trouvé, qui n'est pas forcément celui de la racine. Le comptage fiable est `(texte.match(/\/MediaBox/g) || []).length` (un `/MediaBox` par page réelle) ou de relire tous les `/Count` trouvés (`matchAll`) pour repérer le plus grand. Les 13 pages étaient déjà correctement générées — à ne pas re-déboguer si ce doute ressurgit sur un futur PDF Playwright de ce projet.

Comme le backend n'avait pas de `.env` dans ce worktree au moment de la génération, le PDF reflète les valeurs de repli (`prixPro=15000`, `prixBusiness=35000`, `tauxApporteur=10`) plutôt que les tarifs réels de la base de production — à vérifier/régénérer si ces valeurs diffèrent en prod au moment de la diffusion de la brochure.

---

## État du projet (19 juillet 2026, suite — homogénéisation en-tête/filtres/bloc SEO des pages listing et guides)

Retour utilisateur direct avec captures d'écran : les pages du site n'avaient pas de style homogène — chaque page listing avait réinventé son propre système de filtres/en-tête au fil des chantiers précédents (SEO du 11-12 juillet, tri/filtres guides du 10 juillet, etc.), sans composant partagé. Process complet brainstorming → spec → plan → subagent-driven-development (10 tâches + revue finale de branche opus), exécuté sur `worktree-homogeneisation-pages-listing`, mergé fast-forward sur `main` (`ce96ee9..6e75fc1`), poussé. Spec : `docs/superpowers/specs/2026-07-19-homogeneisation-pages-listing-design.md`. Plan : `docs/superpowers/plans/2026-07-19-homogeneisation-pages-listing.md`.

**Livré** :
- 3 nouveaux composants partagés (`frontend-next/src/components/`) : `PageHeader.tsx` (fil d'Ariane + H1 + compteur + CTA optionnel), `FiltresBar.tsx` (barre de pills essentielles + panneau repliable « ⚙ Plus de filtres » pour les filtres secondaires + section « Trier »), `SeoCard.tsx` (généralise le bloc `.seo-card` façon ticket déjà en place sur la homepage, au lieu que chaque page réinvente son style).
- Nouvelle classe CSS unique `.filter-pill` (+ `.filter-pill--active`/`--reset`) remplaçant 4 systèmes différents (`.budget-pill` isolé, pills dans `.filtres-group`, pills dans `.immo-filtres-row`, `.annonces-cat-pill`) — **`.budget-pill` lui-même conservé**, encore utilisé par ~15 fichiers hors périmètre (wizards, comparaison, boutiques, mes-annonces, favoris, deposer-immo, landing pages).
- **8 pages migrées** vers les 3 composants partagés : les 4 pages de listing SSR (`categorie/[slug]`, `immo`, `telecom`/`TelecomClient`, `annonces`) et les 4 outils guides interactifs (`guide-prix`, `guide-achat`, `guide-immo`, `guide-forfait`).
- **Décision utilisateur explicite en cours de chantier** : le plan initial supposait que les 4 pages guides étaient de simples barres de pills — en lisant le vrai code, elles se sont révélées être des mises en page à 2 panneaux (bandeau `.guide-topbar` + panneau latéral `.guide-left` avec menus `<select>`/curseurs de pondération + panneau résultats `.guide-right`). Demande de clarification posée à l'utilisateur : garder les `<select>` et n'ajouter que fil d'Ariane/SeoCard, ou convertir les `<select>` en pills malgré le changement d'UX plus large — utilisateur a choisi la conversion complète. Les curseurs de pondération (`poids*`), les boutons de profils prédéfinis et les panneaux de résultats (avec leur propre tri local, distinct du `tri` de `FiltresBar`) sont restés strictement intacts sur les 4 guides — vérifié à chaque tâche par grep ciblé sur les noms de variables de curseurs.

**Bugs trouvés en test navigateur réel après la fin des 10 tâches** (l'utilisateur a lancé le serveur de dev en local pour vérifier visuellement — limite habituelle de l'environnement sans outil de capture, contournée ici par un vrai test utilisateur) :
- **Crash d'hydratation React sur toutes les pages `/categorie/*`** : `SeoCard` enveloppait `blurb.text` dans un `<p>`, et la page catégorie y imbriquait ses propres `<p>` (paragraphes `cat.contenu`) → `<p>` dans `<p>`, HTML invalide. Corrigé en changeant le wrapper de `SeoCard` en `<div className="seo-blurb-text">` (CSS ajustée en conséquence) — bug qui n'existait sur aucune autre des 8 pages migrées (vérifié par grep, seule `categorie` imbriquait un `<p>`).
- **Police jamais réellement appliquée sur tout le site** : `body { font-family: 'Inter', ... }` utilisait la chaîne littérale au lieu de `var(--font-inter)` généré par `next/font` — ne matchait jamais la classe scopée réelle, retombait silencieusement sur la police système Windows. **Même piège que celui déjà documenté pour Sora le 11 juillet, cette fois sur Inter** — un rappel que ce risque n'est pas isolé à un seul chantier. Corrigé + antialiasing explicite ajouté (`-webkit-font-smoothing`, `text-rendering`).
- **Vide visuel sous la colonne de texte la plus courte du bloc `SeoCard`** : `.seo-cols-grid` en CSS grid forçait les deux colonnes à la même hauteur de ligne — corrigé en passant à flexbox (`align-items: flex-start`, chaque colonne garde sa propre hauteur). Persistait ensuite sur `/categorie/auto-moto` car le déséquilibre réel venait du **contenu** (blurb générique gauche = 2 phrases fixes courtes, blurb droit = `cat.intro` + 2 paragraphes `cat.contenu` longs) plutôt que du CSS seul — rééquilibré en déplaçant `cat.intro` dans le blurb gauche, ne laissant que `cat.contenu` à droite.
- **Incohérences UX signalées par l'utilisateur, corrigées** : `categorie` n'avait pas de barre de recherche texte contrairement à `annonces` — ajoutée (même pattern, paramètre `q` déjà supporté par `GET /api/produits`, aucun changement backend nécessaire). Les 3 guides à panneau latéral affichaient un `PageHeader` (gros titre) immédiatement suivi d'un `.guide-topbar` quasi identique (même emoji/titre/sous-titre) — bandeau retiré, seul le lien retour subsiste sous `PageHeader` ; `.guide-topbar`/`-titre`/`-sub` devenus orphelins, retirés de `globals.css`.

**Revue finale de branche (opus, range `3b8c135..dc632e4`)** : « Ready to merge = With fixes », 0 Critical, 1 Important (le bloc `SeoCard` de `telecom` citait des noms d'opérateurs faux — « Free »/« Wave » au lieu de « Yas »/« ProMobile », alors que les chips juste en dessous listaient déjà les bons noms), 3 Minor (CSS orpheline supplémentaire visible seulement une fois les 8 pages migrées — `.annonces-header`/`.telecom-header`/`.guide-select`/`.guide-prix-cats` — ; prop `secondaireActifsCount` de `FiltresBar` jamais consommée par aucun des 8 appelants ; `SeoCard` réutilisait la classe `.home-seo-cols` nommée pour la homepage, renommée `.seo-cols-grid`). Les 4 correctifs appliqués en un seul commit groupé, re-revue indépendante (greps frais contre le code réel, pas seulement le rapport de l'implémenteur) confirmant les 4 résolus — y compris la vérification que la homepage `page.tsx` (hors périmètre des 8 pages migrées mais partageant la classe CSS renommée) avait bien été mise à jour en même temps, sous peine de casser son propre bloc SEO.

**Piège de process à retenir** : le plan écrit avant l'implémentation contenait une hypothèse fausse sur la structure des pages guides (jamais vérifiée contre le vrai code au moment de l'écriture du plan) — détecté seulement en lisant le fichier réel pendant l'exécution de la tâche 9. Plutôt que de forcer l'exécution de la tâche telle qu'écrite ou de deviner, la question a été posée directement à l'utilisateur avant de continuer — a évité une transformation inadaptée à la structure réelle de ces 4 pages.

**Non vérifié par outil automatisé** (limite déjà documentée sur ce projet — aucun outil de capture navigateur disponible) : cette fois-ci exceptionnellement compensé par un vrai test utilisateur en local (serveur de dev lancé dans le worktree, backend + frontend), qui a permis de détecter les 4 bugs visuels/fonctionnels ci-dessus qu'aucune revue de code seule (même la revue finale de branche) n'aurait pu attraper — confirme la valeur d'un test navigateur réel en complément des revues de code quand l'utilisateur peut le faire.

---

## État du projet (19 juillet 2026 — marketing boutique : partage 1-clic, traçage, bandeau conseils, visuel story)

Spec `docs/superpowers/specs/2026-07-18-marketing-boutique-facilitation-design.md`, plan en 8 tâches `docs/superpowers/plans/2026-07-18-marketing-boutique-facilitation.md`, exécuté via subagent-driven-development sur `worktree-marketing-boutique-facilitation` (session reprise après une interruption utilisateur mi-Task 3 — la ledger `.superpowers/sdd/progress.md` a permis une reprise propre sans re-travail), revue finale opus « Ready to merge » 0 Critical/Important, mergé sur `main` (`da0baea..8609e73`), poussé.

**Objectif explicite (demande directe utilisateur)** : réduire le travail réel du marchand pour partager sa boutique/ses produits — **pas** lui donner des textes à copier-coller (périmètre exclu explicitement).

**Livré** :
- `BoutonPartager.tsx` (composant partagé, catalogue produits ET cartes boutique de l'onglet Marketing) : l'action principale devient 1 clic → ouverture directe de `wa.me/?text=...`, au lieu d'un menu à 3 choix. Les actions secondaires (copier le lien, télécharger le visuel) restent disponibles derrière un petit bouton `⋯`. Nouvelle prop optionnelle `onPartage?: () => void`, fire-and-forget, jamais awaited.
- **Traçage `partage_le`** : colonne additive `boutique_produits.partage_le TIMESTAMPTZ` (nullable, `NULL` = jamais partagé) + route `PATCH /api/boutiques/:id/produits/:prodId/partage`. Mise à jour déclenchée au clic WhatsApp ou copie de lien sur un produit, jamais bloquante pour l'action de partage elle-même.
- **Message enrichi promo** : quand `prix_barre > prix`, le message WhatsApp devient `🔥 {nom} en promo : {prix} au lieu de {prix_barre} !` au lieu du format simple.
- **Bandeau « Conseils & rappels »** en haut de l'onglet Marketing (`MarketingBoutique`) : compte les produits jamais partagés (fetch dédié léger, pas de state partagé avec `CatalogueProduits`), affiche un bandeau orange actionnable (bouton « Voir ces produits → » qui bascule vers l'onglet Catalogue avec le filtre `jamais_partage` pré-appliqué) ou un bandeau vert si tout a déjà été partagé.
- **Refonte visuelle** de `/assets/boutique/[id]/story` (`next/og` `ImageResponse`, `runtime = 'edge'` conservé, 1080×1920 inchangé) : composition asymétrique (titre boutique dominant à gauche, carte « vitrine » inclinée avec le logo qui déborde du cadre, bande diagonale orange, halos décoratifs) — même niveau d'exigence que le visuel `/assets/chatbot-whatsapp` déjà refondu le 6 juillet. Palette `#1C2B4A`/`#C75B00` conservée, repli 🏪 si pas de logo.

**Incident de session à noter** : l'exécution a été interrompue une première fois par l'utilisateur juste après un commit de fix des tests `BoutonPartager.test.tsx` (Task 3), avant que le contrôleur ne relance la revue. À la reprise (nouvelle session), la ledger `.superpowers/sdd/progress.md` a permis de retrouver l'état exact (commit du fix déjà fait, tests à re-vérifier, revue à relancer) sans deviner ni re-exécuter de travail déjà fait — confirme la valeur de la ledger pour les sessions longues/interrompues sur ce projet.

**Piège Windows rencontré en fin de chantier** : `git worktree remove` a timeout (2 min) sur ce worktree — la suppression du dossier avait commencé mais pas le nettoyage de la référence `.git` interne, laissant un état incohérent (« `.git` does not exist » au retry). Résolu par suppression manuelle du dossier restant (`rm -rf`) puis `git worktree prune`. Si `git worktree remove` traîne anormalement longtemps sur ce projet, ne pas relancer la même commande en boucle — vérifier d'abord si le dossier a déjà été partiellement supprimé.

**Non vérifié par navigateur réel** (limite déjà documentée sur ce projet) : rendu effectif du bandeau de conseils et bascule d'onglet en clic réel, dropzone/filtre en interaction utilisateur. Le visuel story boutique, lui, a été vérifié en rendant réellement l'image (`ImageResponse` fetché en HTTP, PNG visualisé) avec et sans logo — pas seulement par lecture de code.

---

## État du projet (18 juillet 2026, suite — scraper Facebook réparé en profondeur, OCR ajouté)

Déclencheur : le scraper Facebook (`backend/scripts/scraper-facebook-local.js` + `backend/services/scraper-immo-facebook.js`) ne remontait plus aucune annonce depuis le 17 juillet (`scrapes: 0, erreurs: 0` sur tous les groupes, silencieusement). Investigation en direct (session réelle contre Facebook, pas de suppositions) ayant révélé plusieurs problèmes empilés, corrigés un par un au fil de retours d'usage réels sur les annonces manquées. 8 commits sur `main` (`7dfbced..0f275d9`), poussés directement (pas de spec/plan formels — série de correctifs ciblés en debug interactif).

**Cause racine initiale** : la session Facebook sauvegardée (`backend/.fb-session.json`) avait été invalidée côté serveur par Facebook (cookies non expirés par date, mais Facebook sert quand même la vue déconnectée sur la même URL de groupe — pas de redirection vers `/login`, donc le contrôle existant sur `page.url()` ne le détectait pas). Reconnectée manuellement via `node backend/scripts/fb-login-setup.js` (avec le bon compte, membre des 16 groupes — une première tentative de reconnexion avec le mauvais compte a été détectée et corrigée). **Détection ajoutée** : si `[role="feed"]` est absent ET qu'un formulaire de mot de passe est visible sur la page de groupe, le run s'arrête immédiatement avec une erreur explicite au lieu de continuer silencieusement sur tous les groupes restants.

**Corrections en cascade, chacune découverte en creusant pourquoi de vraies annonces visibles sur Facebook n'étaient toujours pas captées après la première réparation** :
- **Bruit vidéo/reel non filtré** : minuteur de lecteur (`0:00 / 1:44`), bouton « Voir plus » apparaissant ailleurs qu'en toute fin (contrairement à « En voir plus »), hashtags de promotion (`#viralfacebookreels...`), bouton « Envoyer un message » (+ compteur de réactions isolé qui suit) — tous retirés du texte extrait.
- **Regex téléphone structurellement incomplète** : `parseTelephoneFB` exigeait un séparateur figé après le 3ᵉ chiffre (format `770 12 34 56`), mais le groupement le plus courant sur Facebook sénégalais est `XX XXX XX XX` (espace dès le 2ᵉ chiffre, ex. `78 332 22 99`) — jamais reconnu jusque-là. Corrigé en tolérant un séparateur optionnel entre chacun des 9 chiffres.
- **Annonces sans numéro exploitable** : le repli `contact_tel: 'Voir sur Facebook'` laissait passer du pur bruit d'obfuscation Facebook (posts où le texte n'est que des tokens 1-2 caractères) sous forme d'annonces creuses. Retiré — un post sans numéro réellement extrait est maintenant ignoré (`stats.ignores++`), plus jamais inséré.
- **Numéro incrusté dans l'image** (bannières colorées type « Babacar Immobilier Niane », « El Hadji Seck ») : invisible pour `parseTelephoneFB` qui ne lit que `innerText`. Ajout d'un repli OCR (**`tesseract.js`**, nouvelle dependency à la racine — jamais utilisée côté serveur, ce scraper ne tourne qu'en local, aucun impact RAM/build sur Render) : si le texte DOM d'un post est pauvre (< 6 mots utiles après nettoyage) et qu'il a des images, la première image est passée à l'OCR et son texte fusionné avec le texte DOM avant tous les filtres. Un seul worker Tesseract réutilisé pour tout le run (coût d'init dominant). Filtres réordonnés : téléphone + catégorie réellement détectés valident déjà qu'il s'agit d'une vraie annonce — le filtre `estAnnoncePotentielle` (liste de mots-clés type « vends »/« disponible ») ne s'applique plus qu'en repli si aucun numéro n'est trouvé, car le style d'annonce local (« 45 mille x 3 », « prend un homme ») omet souvent tout mot de cette liste.
- **Posts tronqués par « Voir plus »** : le numéro de téléphone se trouve très souvent juste après la coupure (ex. « …Niveau disponible : 5ème étage Voir plus » → « …Prix: 400 000HT Contactez-nous au 77 697 14 73 »), texte qui n'existe pas dans le DOM tant qu'on ne clique pas dessus — aucun nettoyage regex ne peut le récupérer. Ajout d'un clic Playwright réel (pas `page.evaluate` + `.click()` DOM brut — Facebook attache ses handlers React aux événements de pointeur réels) sur chaque bouton « Voir plus » du feed avant l'extraction, boucle bornée à 20 clics par groupe.

**Vérifié en conditions réelles à chaque étape** (jamais de suppositions) : session reconnectée testée contre une vraie page de groupe, chaque regex testée contre les exemples exacts fournis par l'utilisateur, OCR et clic « Voir plus » testés contre de vrais posts du groupe immo `252740871421764` — le post « Saidou Niang » (« APPAREMMENT F3… ») précédemment perdu (numéro caché derrière « Voir plus ») est maintenant correctement retenu avec son numéro extrait après dépliage.

**Fichiers modifiés** : uniquement `backend/services/scraper-immo-facebook.js` (toute la logique) + `package.json`/`package-lock.json` (ajout `tesseract.js`) + `.gitignore` (ignore `*.traineddata`, modèle OCR téléchargé au runtime, ~1.2 Mo, pas à committer).

**Dette / non couvert** :
- Annonces déjà en base avec `contact_tel = 'Voir sur Facebook'` (insérées par les runs avant ce chantier) non nettoyées rétroactivement — restent telles quelles.
- L'OCR n'est tenté que sur la **première** image d'un post à texte pauvre (les photos suivantes sont supposées être des vues complémentaires sans texte additionnel) — un post à bannière sur sa 2ᵉ+ photo uniquement resterait manqué.
- Le filtre `estAnnoncePotentielle` reste inchangé en tant que tel (liste de mots-clés), simplement contourné quand un numéro est déjà trouvé — un post sans numéro ET sans mot-clé de cette liste reste ignoré, cas jugé acceptable (pas assez de signal pour une insertion fiable).

---

## État du projet (18 juillet 2026, suite — traitement du panier natif WhatsApp/Meta Commerce)

Spec `docs/superpowers/specs/2026-07-18-panier-meta-whatsapp-design.md`, plan en 6 tâches `docs/superpowers/plans/2026-07-18-panier-meta-whatsapp.md`, exécuté sur la branche worktree `worktree-panier-meta-whatsapp` (5 commits, `7da3967..f6e6713`), sur `main`, poussé.

**Livré** :
- `creerCommandeBoutique()` (`backend/routes/comptabilite.js`) n'envoie plus de notification WhatsApp elle-même — extraite dans `notifierVendeurCommande()`, exportée, appelée par chaque appelant. Comportement de la route web `POST /:boutiqueId/commandes` inchangé (même message, notification immédiate).
- Colonne additive `commandes_boutique.groupe_commande UUID` (nullable) + index partiel, pour lier les lignes d'un même panier multi-articles.
- `context.commande` du chatbot WhatsApp généralisé : passe d'un produit unique implicite à un tableau `items[]` (`{ produit_id, nom_produit, prix, quantite, stock_quantite }`), pour le flux « Commander » mono-produit existant **et** le nouveau panier Meta — mêmes clés dans les deux chemins, `COMMANDE_QUANTITE`/`envoyerRecapFinal`/`COMMANDE_CONFIRMATION` fonctionnent identiquement quelle que soit l'origine.
- Détection `msg.type === 'order'` en tête de `handleIncoming` (`whatsapp-chatbot.js`) — un client qui utilise le bouton panier natif WhatsApp depuis une fiche produit Meta Commerce déclenche `traiterPanierMeta()` : résolution des `retailer_id` (`nopalou-produit-{id}`) en produits réels (prix toujours relu en base, jamais celui envoyé par Meta), articles introuvables écartés silencieusement (panier partiellement invalide continue, panier entièrement invalide → message clair), puis démarrage direct de la collecte de coordonnées (saute l'étape quantité, déjà connue).
- Notification vendeur groupée (`notifierVendeurPanierGroupe`) pour un panier à plusieurs articles — un seul message WhatsApp listant toutes les lignes, `groupe_commande` partagé par toutes les commandes créées. Panier à 1 article → notification simple identique au flux mono-produit existant (`groupe_commande` reste `NULL`).
- `/boutique` → onglet Commandes (`Commandes.tsx`) : `regrouperCommandes()` regroupe les lignes partageant un `groupe_commande` en carte dépliable `CommandeGroupeCard` (badge « 🛒 Panier · N articles », total agrégé, statut mixte si les lignes divergent) ; les commandes sans groupe (tout l'historique existant, mono-produit web classique) continuent d'utiliser `CommandeCard` telle quelle, aucune régression visuelle.

**Vérifications faites** :
- `node --check` propre sur les 3 fichiers backend touchés (`whatsapp-chatbot.js`, `comptabilite.js`, `migrate-inline.js`) et `npx tsc --noEmit` propre côté Next.js (`Commandes.tsx`).
- **Migration réellement appliquée en base de production** — piège découvert en le faisant : `npm run migrate` exécute en fait `backend/migrate.js`, un script **obsolète et distinct** de `migrate-inline.js` (celui réellement appelé par `app.js` au démarrage du serveur), qui a sa propre copie ancienne du schéma sans la colonne `groupe_commande`. `npm run migrate` seul aurait donc donné un faux sentiment de succès sans réellement créer la colonne en prod. Migration correcte relancée directement via `require('./backend/migrate-inline')()`, colonne `commandes_boutique.groupe_commande` (type `uuid`) confirmée présente par requête directe sur `information_schema.columns`. **Si `npm run migrate` doit resservir un jour, vérifier qu'il pointe vers `migrate-inline.js` ou le retirer pour éviter ce piège.**
- Test isolé du chemin `msg.type === 'order'` avec un `retailer_id` factice (produit inexistant) contre la base réelle : `handleIncoming()` se termine sans exception (`OK: pas de crash`), aboutit proprement au message « produits non disponibles ».

**Non vérifié — nécessite un test manuel réel sur WhatsApp** (pas d'outil d'automatisation WhatsApp/navigateur dans cet environnement, cohérent avec la limitation déjà documentée ailleurs dans ce fichier) :
- Flux « Commander » mono-produit existant (non-régression) : un seul message de notification, contenu identique à avant ce chantier, `groupe_commande` NULL en base.
- Panier Meta réel à 1 article envoyé depuis une Product Message WhatsApp.
- Panier Meta réel à plusieurs articles de la même boutique : `groupe_commande` partagé, notification vendeur groupée reçue, affichage `CommandeGroupeCard` visible et correct dans `/boutique`.
- Panier mélangeant un article valide et un `retailer_id` invalide (produit supprimé) : seul l'article valide doit aboutir à une commande.
- Non-régression de la route web classique (`CommanderModal.tsx` sur `/boutiques/{id}`) — notification vendeur immédiate, contenu inchangé.

Smoke-test recommandé avant de considérer ce chantier définitivement clos : passer une vraie commande via chacun des 3 chemins (web, WhatsApp mono-produit, panier Meta multi-articles) et confirmer les 5 points ci-dessus.

---

## État du projet (18 juillet 2026 — variantes visuelles + correctif débordement navbar mobile compte)

Suite directe du chantier boutique du 17 juillet (voir entrée ci-dessous). Deux correctifs distincts, tous deux sur `main`, poussés.

### Sélection visuelle des variantes (`419ee47`)
Retour utilisateur : le formulaire texte libre livré la veille (« nom de l'option » + « valeur, Entrée pour ajouter ») ne correspondait pas à la demande — il fallait une sélection **visuelle**, avec des **types de variante prédéfinis** (pas de saisie de nom) et des **couleurs cliquables** (pastilles, pas de texte) pour rester facile à utiliser pour un petit commerçant. Refonte complète de la section « Variantes » dans `ProduitForm` (`BoutiqueClient.tsx`) :
- 6 types prédéfinis (`TYPES_VARIANTE`) : 🎨 Couleur, 📏 Taille (vêtement), 👟 Pointure (chaussure), 💾 Stockage/RAM, ⚙️ Capacité/Puissance, ➕ Autre (personnalisé) — le marchand clique sur un type au lieu de taper un nom. Un seul groupe par type prédéfini (retiré de la liste de choix une fois ajouté), sauf « Autre » qui reste répétable.
- **Couleur** : 16 pastilles rondes (palette fixe `COULEURS_PALETTE`, nom + hex), cliquables, nom affiché en dessous — aucune saisie texte.
- Autres types prédéfinis : boutons avec valeurs suggérées standards (ex. XS/S/M/L/XL/XXL, 36-46, 4 Go→1 To…), cliquables (toggle sélection).
- **Autre (personnalisé)** : reste en saisie libre texte + Entrée (nouveau composant `ValeursLibres`), pour les cas non couverts par les types prédéfinis (matière, etc.).
- `Variante` a gagné un champ optionnel `typeId` (forme JSON stockée en base inchangée pour le reste — `{ nom, valeurs, typeId? }`). Rétrocompatible : les variantes créées par l'ancien formulaire texte libre (sans `typeId`) s'affichent en mode « Autre » à l'édition, aucune perte de données.

### Correctif — débordement horizontal navbar mobile sur tout `/compte/*` (`880040d`)
Retour utilisateur avec captures : sur mobile connecté, toutes les pages du compte (pas seulement `/boutique`) affichaient un décalage vers la droite avec un vide à gauche et une scrollbar horizontale. **Cause racine, sans rapport avec le chantier boutique** : `NavbarActions.tsx` (bloc « nom du compte + Déconnexion », visible uniquement connecté, monté dans `layout.tsx` juste avant le hamburger mobile) n'avait aucune règle responsive, et surtout son `style={{ display: 'flex' }}` **inline** empêchait toute règle CSS externe `display: none` de s'appliquer (même spécificité, l'inline gagne toujours en cascade). Résultat : sous ~1040px, `.navbar-actions` (nom + Déconnexion + bouton Publier + hamburger) dépassait le viewport de ~136px sur un écran 375px.

**Méthode de vérification** : aucun outil de capture navigateur disponible dans l'environnement (limite déjà documentée) — Playwright installé en devDependency (`frontend-next/package.json`, ne touche jamais au build/runtime Render car en `devDependencies`, jamais installé en production), compte de test créé via `/inscription`, mesure `document.documentElement.scrollWidth` vs `clientWidth` en viewport 375px avant/après correctif (511 vs 375 → 375 vs 375), capture d'écran confirmant visuellement la disparition du débordement.

**Correctif** : classe `navbar-actions-compte` ajoutée sur le wrapper (au lieu du style inline `display`), masquée sous 1040px dans `globals.css` (même media query que `.navbar-link`/`.navbar-inscription` pour les visiteurs anonymes — le nom/Déconnexion est de toute façon déjà dupliqué dans le tiroir `MobileNav`). Playwright conservé en devDependency pour faciliter ce type de vérification visuelle mobile à l'avenir.

**Piège à retenir** : un style inline `display` sur un élément ne peut JAMAIS être masqué par une media query CSS externe de même spécificité — si un composant a besoin d'être caché/affiché de façon responsive, le `display` doit venir d'une classe CSS, jamais d'un style inline, même si le reste des styles (gap, align-items…) peut rester inline.

---

## État du projet (17 juillet 2026, suite — boutique : responsive mobile, multi-photos et variantes produit)

Déclencheur : retour utilisateur avec captures d'écran mobile montrant la zone « Ma boutique » écrasée sur téléphone, plus deux limitations signalées par comparaison avec AliExpress (un seul champ photo, aucune variante). Spec `docs/superpowers/specs/2026-07-17-boutique-mobile-photos-variantes-design.md`, plan en 8 tâches `docs/superpowers/plans/2026-07-17-boutique-mobile-photos-variantes.md`, exécuté via subagent-driven-development (revue par tâche + revue finale de branche opus), mergé sur `main` (`aeaf235..1d49f40`), poussé.

**Livré** :
- **Responsive mobile** — tout `frontend-next/src/app/boutique/BoutiqueClient.tsx` (liste boutiques, formulaires, vue « Gérer la boutique ») converti de styles inline vers des classes CSS (`.bq-*`, `globals.css`) avec breakpoint 640px cohérent avec le reste du site. La sidebar de gestion (220px fixe) devient une barre d'onglets horizontale scrollable sous 640px ; toutes les grilles `1fr 1fr` passent en 1 colonne.
- **Jusqu'à 5 photos par produit du catalogue boutique** (au lieu d'une seule) — `boutique_produits.images` était déjà `TEXT[]`, seule la route (`upload.single('image')` → `upload.array('photos', 5)`, nouvelle instance multer dédiée `uploadProduitPhotos` pour ne pas toucher aux limites de la route logo/cover) et le formulaire (dropzone réutilisant les classes `.photos-zone`/`.photos-dropzone`/`.photo-thumb` déjà utilisées par `FormulaireAnnonce.tsx`, technique `DataTransfer` pour resynchroniser `input.files` en lecture seule lors des suppressions) limitaient à 1.
- **Variantes simples produit** (ex: Couleur/Taille — un seul `prix`/`stock_quantite` pour tout le produit, pas de prix/stock par combinaison, décision explicite pour rester simple à saisir pour un petit commerçant) — nouvelle colonne additive `boutique_produits.variantes JSONB DEFAULT '[]'`, section optionnelle « Variantes » dans le formulaire vendeur (mode détaillé uniquement). Sur la fiche produit publique, la sélection d'une valeur par option est **obligatoire** avant que le bouton « Commander sur le site » se débloque (décision utilisateur — pas de présélection automatique) ; WhatsApp/Téléphone restent cliquables sans contrainte (canaux hors-site). La sélection choisie est reportée dans le champ « Note / précisions » déjà existant du formulaire de commande — aucun changement du schéma `commandes_boutique`.

**Limite fonctionnelle notée par la revue finale (assumée, pas un bug)** : l'obligation de sélectionner une variante n'est appliquée que côté client — le champ `note` reste librement éditable et `POST /api/comptabilite/:id/commandes` ne connaît pas les variantes. Un vendeur peut donc recevoir une commande d'un produit à variantes sans variante renseignée si l'acheteur vide le champ ou appelle l'API directement. Conforme à la spec (pas de nouvelle colonne de commande voulue), à garder en tête si une garantie serveur devient nécessaire plus tard.

**Incident de chantier à retenir** : la première tentative de la tâche CSS (modèle haiku, chargé d'un simple ajout en fin de `globals.css`) a réécrit tout le fichier au lieu d'un ajout ciblé, corrompant l'encodage du texte français préexistant (BOM UTF-8 ajouté, tous les accents/tirets mojibakés — « Nopalou — Design System » devenu « Nopalou â€” Design System »). Détecté via un `git diff --stat` montrant 148 suppressions inattendues pour une tâche d'ajout pur, avant toute revue ; commit annulé (`git reset --hard`), retenté avec succès en imposant l'usage d'Edit ciblé plutôt que Write pour toute tâche touchant un gros fichier existant contenant de l'Unicode. Voir mémoire `feedback_haiku_unicode_mangling.md` — toujours vérifier `git diff --stat` après une tâche d'ajout pur sur un fichier volumineux multilingue, 0 suppression attendue.

**Non vérifié par navigateur réel** (aucun outil d'automatisation disponible dans l'environnement) : rendu effectif de la barre d'onglets scrollable sous 640px, dropzone multi-photos, sélecteur de variantes. Vérifié uniquement via `npx tsc --noEmit` (propre) et relecture de diff. Test manuel recommandé après déploiement : `/boutique` en mode mobile, ajout d'un produit avec 3-5 photos et 2 options de variantes, puis parcours acheteur sur la fiche publique.

---

## État du projet (17 juillet 2026, suite — dédoublonnage produits + tri par défaut « meilleur prix »)

Déclencheur : doublons visibles dans la recherche chatbot (« Samsung Galaxy 16 5G » en double). Diagnostic prod : **5 230 lignes en trop sur 8 200 produits (64 %)**, doublons recréés à chaque run de scraping. Spec `docs/superpowers/specs/2026-07-17-dedoublonnage-produits-tri-prix-design.md`, plan 6 tâches, subagent-driven-development, revue finale opus « Ready to merge » 0 Critical/Important, mergé ff (`9b3953b..d97f487` + `33141b2`), poussé.

**Causes racines corrigées** :
- Titres 100 % génériques (« Split Haier », « iPhone X ») : tous les mots filtrés par `MOTS_GENERIQUES`/longueur < 3 → `motsCles` vide → matching flou **sauté** → INSERT à chaque run. Corrigé par une étape **1bis** dans `sauvegarderProduits` : correspondance exacte sur nom normalisé via `sqlNomNormalise(col)` (exportée de `scraper.js`, source unique — appliquée AUX DEUX côtés de l'égalité). ⚠️ Deux fix rounds ont été nécessaires : les subagents haiku **mutilent les caractères Unicode** (`’‘“”`) et l'échappement `\[\]` dans les template literals — écrire ce genre de ligne soi-même.
- Apostrophes : `normaliserTitre` les retire côté requête mais pas côté base → « J'adore EDP 100ml » ne matchait jamais (124 doublons).

**Fusion exécutée en prod (2 passes)** : `backend/scripts/fusionner-doublons-produits.js` (`--dry-run` supporté, une transaction par groupe, offres/alertes/clics rattachés au canonique, conflit `UNIQUE(produit_id,marchand_id)` → l'offre la plus récente gagne + historique réparenté, recalcul `prix_min`/`nb_offres`). Critère STRICT exigé par l'utilisateur : même nom normalisé + catégorie + marque + prix_min + ensemble des marchands. Résultat : 71 groupes fusionnés, **5 190 fiches supprimées, 8 200 → 3 016 produits**, 0 échec, alertes intactes. Le critère strict est **instable après recalcul** (des fiches convergent vers le même prix) → une 2ᵉ passe a été nécessaire ; ~40 fiches restent en doublon de nom (prix/marchands différents — assumé). Le fix scraper vérifié en réel : le scrape de 11h16 a rattaché son offre à la fiche de mai au lieu d'en créer une 8ᵉ.

**Tri par défaut** : `GET /api/produits` sans `tri` → `MIN(o.prix) ASC NULLS LAST` (sponsorisés toujours en tête), `tri=populaire` = ancien classement popularité. Pills accueil/catégorie : défaut « 💰 Prix ↑ », « ⭐ Populaires » → `?tri=populaire`. Guides/immo/annonces/boutiques/télécom inchangés. Vérifié en prod : prix croissants sur nopalou.com/api/produits.

**Dette notée (revues)** : `nb_offres` stocké = `COUNT(o.id)` toutes offres vs API qui compte les offres en stock (divergence pré-existante, reproduite fidèlement par le script) ; asymétrie mots retirés `normaliserTitre` vs `sqlNomNormalise` (neuf/occasion/promo…) — 0 occurrence en prod aujourd'hui, à surveiller si nouvelle source scrape ces mots dans les titres.

---

## État du projet (17 juillet 2026 — chatbot WhatsApp : pagination « plus / encore / d'autres »)

Retour d'usage réel : après une recherche (« Samsung »), retaper la requête ou dire « plus » remontrait toujours les 3-5 mêmes résultats — la session repassait en `MENU` sans mémoire de ce qui avait été affiché, et « plus » partait en recherche full-text du mot « plus ». Spec `docs/superpowers/specs/2026-07-13-chatbot-pagination-plus-design.md`, plan en 5 tâches `docs/superpowers/plans/2026-07-13-chatbot-pagination-plus.md`, exécuté via subagent-driven-development, revue finale opus « Ready to merge » 0 Critical/Important, mergé fast-forward dans `main` (`a9a5a59..f0e4c82`), poussé (déploiement Render).

**Livré** (un seul fichier de code : `backend/services/whatsapp-chatbot.js`) :
- Mots-clés `MOTS_PLUS` (`plus`, `encore`, `d'autres`, `dautres`, `autres`, `autre`, `voir plus`, `la suite`, `suivant`, `ok`, `oui` — correspondance exacte sur texte normalisé) détectés en état `MENU`, AVANT `detecterFAQ` et le fallback recherche. « ok merci » reste une clôture (`CLOTURE` testée avant le bloc MENU — ne pas réordonner).
- Le contexte de session (`whatsapp_sessions.context`) mémorise `{ last: { type: 'search'|'immo'|'telecom', query?, shownIds: [] } }` après chaque affichage paginable ; « plus » relance la même requête en excluant `shownIds` (`AND id::text <> ALL($n::text[])` — le cast `::text[]` est obligatoire, tableau vide = vacuously true = comportement d'origine).
- `searchContent(query, excludeIds = [])`, `handleSearchQuery(phone, query, excludeIds = [])` (signatures rétrocompatibles), listes immo/télécom du menu factorisées en `envoyerListeImmo`/`envoyerListeTelecom(phone, excludeIds = [])`.
- Fin de liste → « ✅ Vous avez vu tout ce que j'ai pour "…" » ; « plus » sans contexte (session neuve/expirée 1h/détour FAQ-alerte-commande qui écrase `last`) → « 🔍 Plus de quoi ? » + état `SEARCH_QUERY`. Ces écrasements de `last` par les autres flux sont VOULUS (spec).
- Notes de revue (pas des bugs) : le `LIMIT 5` global de l'UNION peut couper des lignes non enregistrées dans `shownIds` — elles réapparaissent à la page suivante, jamais de doublon affiché ; `shownIds` croît en session mais borné par le reset 1h. Non testé en réel WhatsApp — smoke-test recommandé : recherche → *plus* → *plus*, « oui » après « Envie de continuer ? », « ok merci » (doit clôturer), immo/télécom → *plus*.

---

## État du projet (16 juillet 2026 — gestion des comptes admin, correctifs bandeau email et PLANS, dette carte-visite)

Quatre chantiers sur `main` (`c68b4bc..1beca60`, poussé) : deux correctifs ponctuels puis un chantier complet de gestion des comptes admin, avec un effet de bord découvert en fin de parcours.

### Correctif — bandeau email non vérifié invisible malgré `email_verifie=false`
Le bandeau `BannerEmailNonVerifie` (portage legacy du 14 juillet) ne s'affichait jamais : dans `(account)/layout.tsx`, il était rendu comme 3ᵉ enfant direct de `.account-layout` (`display: grid; grid-template-columns: 220px 1fr`) — CSS Grid le plaçait automatiquement dans une cellule de la grille (colonne 220px, sous la sidebar) au lieu de s'étaler pleine largeur au-dessus. Corrigé en sortant le bandeau du conteneur grid via un fragment `<>`, au-dessus de `.account-layout`. Vérifié par un parcours complet en local contre la base de prod (inscription → `email_verifie:false` → bandeau → renvoi → clic lien → `email_verifie:true`).

### Correctif — `POST /api/abonnements/admin/activer` plantait (« PLANS is not defined »)
`backend/routes/abonnements.js` : la route d'activation manuelle de plan test (bouton admin « Activer un plan test ») référençait `PLANS[plan]` sans jamais appeler `const PLANS = await getPlans()`, contrairement à la route `/initier` juste au-dessus qui le fait correctement. `ReferenceError` JS → 500 à chaque tentative. Un seul `const PLANS = await getPlans();` ajouté en tête de la route, testé en local (garde-fous plan invalide / utilisateur introuvable confirmés fonctionnels).

### Chantier — section « Gestion des comptes » dans l'admin
Aucune section admin ne permettait jusque-là de consulter/agir sur les comptes utilisateurs directement. Spec `docs/superpowers/specs/2026-07-16-gestion-comptes-admin-design.md`, plan en 9 tâches `docs/superpowers/plans/2026-07-16-gestion-comptes-admin.md`, exécuté via subagent-driven-development (fresh subagent par tâche + revue systématique + revue finale de branche opus « Ready to merge », 0 Critical/Important). 2 cycles de fix pendant les revues de tâche : imports morts (`jwt`/`envoyerEmail`) retirés à la Task 2 ; faille TOCTOU corrigée à la Task 5 (la route `purger` faisait un `SELECT` puis un `UPDATE` séparé sans re-garder `anonymise_le IS NULL` dans le `WHERE` de l'`UPDATE` — deux appels concurrents pouvaient tous deux passer le check et exécuter l'anonymisation ; corrigé en repliant le garde-fou dans le `WHERE` de l'`UPDATE` avec `RETURNING id`, 400 si la ligne n'est pas retournée).

**Livré** :
- 3 colonnes sur `utilisateurs` : `suspendu BOOLEAN`, `supprime_le TIMESTAMPTZ`, `anonymise_le TIMESTAMPTZ` (migration idempotente, additive).
- `backend/routes/admin-utilisateurs.js`, monté sur `/api/admin/utilisateurs`, protégé `adminSecretOnly` partout (jamais `verifierToken`) : `GET /` (liste paginée, recherche texte nom/email/tel, filtres statut/type, tri date), `GET /:id` (fiche + résumé activité + abonnement actif), `PUT /:id/verifier-email`, `POST /:id/renvoyer-verification`, `POST /:id/lien-reset` (génère sans jamais envoyer — affiché à l'admin pour transmission manuelle), `PUT /:id/suspendre` / `/reactiver`, et le flux RGPD réversible en 3 étapes : `POST /:id/marquer-supprime` (période de grâce 30j), `POST /:id/restaurer` (annule), `POST /:id/purger` (anonymisation définitive — **jamais de `DELETE` physique** — refusée si moins de 30 jours écoulés ou déjà purgé).
- `POST /api/auth/connexion` refuse désormais les comptes `suspendu=true` ou `supprime_le IS NOT NULL` (403, message distinct par cas), vérifié après le mot de passe pour ne pas fuiter l'info à un attaquant sans le bon mot de passe ; les 3 champs sont destructurés hors de la réponse `user` dans tous les cas.
- `/admin/comptes` (liste, recherche + pills de filtre) et `/admin/comptes/[id]` (fiche détail + `ActionsCompteClient` : boutons support/modération/suppression, `confirm()` simple pour suspendre/marquer-supprimer, **double confirmation** pour la purge + bouton désactivé côté client tant que les 30 jours ne sont pas écoulés — le vrai garde-fou reste serveur), lien menu admin ajouté.
- Chaque route testée en direct contre la base de production réelle avec des comptes de test dédiés créés puis supprimés dans la foulée (jamais de mutation sur un compte réel) — y compris le cycle complet suspension→connexion refusée→réactivation et marquage→grâce→purge (date `supprime_le` forcée 31 jours dans le passé via SQL direct pour simuler l'écoulement sans attendre).

### Dette découverte en cours de route — `assets/carte-visite` a deux runtimes incompatibles
En voulant valider `npm run build` pour la Task 9 (vérification finale), le build échouait sur un bug **préexistant, sans rapport** avec ce chantier (confirmé via `git merge-base --is-ancestor` : introduit par le commit `9c97b76`, antérieur au début du plan) : `frontend-next/src/app/assets/carte-visite/route.tsx` avait `runtime = 'edge'`, incompatible avec sa dépendance `qrcode-svg` (a besoin de `fs`, absent en edge). Retiré `runtime = 'edge'` (seul fichier `ImageResponse` du projet à importer `qrcode-svg` — aucun autre des 15 autres fichiers `runtime='edge'` du projet n'est concerné). **Mais** ce retrait a révélé un second bug indépendant : `next/og` (`ImageResponse`, toujours utilisé par ce même fichier) plante en runtime Node sur Windows (`TypeError: Invalid URL` dans `@vercel/og`, le bug de police embarquée déjà documenté ailleurs dans ce fichier pour les icônes PWA — cf. entrée du 11 juillet). **Aucun des deux runtimes ne fonctionne actuellement pour cette route sur une machine de dev Windows.** Décision assumée : garder le retrait d'`edge` (qrcode-svg n'a jamais fonctionné en edge — échec silencieux — contre une erreur de build visible et actionnable), accepter que `npm run build` reste cassé en local sur Windows pour cette seule route, non bloquant pour le reste du site. **Non vérifié si le build Render (Linux) est également affecté** — à surveiller au prochain déploiement ; si `@vercel/og` fonctionne normalement sous Linux (probable, le bug est documenté comme spécifique à Windows), la route pourrait fonctionner correctement en prod malgré l'échec local.

---

## État du projet (13 juillet 2026, soir — comparaison « zéro rejet » : filtrage auto par groupe de produit)

Constat utilisateur : la comparaison Next.js n'avait **aucun contrôle de type** (écouteur vs frigo comparables) — le contrôle existait dans le SPA legacy (`comparerCat` + filtre auto, `frontend/app.js:4753`) mais n'avait jamais été porté. Exigence validée : **jamais de rejet après clic** — au lieu de bloquer, filtrer. Spec `docs/superpowers/specs/2026-07-13-comparaison-zero-rejet-design.md`, plan en 7 tâches, exécuté via subagent-driven-development, revue finale opus « Ready to merge » 0 Critical/Important, mergé fast-forward dans `main` (`2104dce..fe31532`), poussé (déploiement Render).

### Livré
- **`frontend-next/src/lib/comparaison.ts`** : `infererGroupe(nom)` (portage de `_inferCat` legacy — l'ORDRE des regex est significatif : audio/tv avant smartphones, tablette avant smartphones), `GROUPE_LABELS`, `CAT_NOM_SLUG`, `lireCompare()`. Clé legacy `informatique` renommée `ordinateurs` (= la clé backend). Contrat : toute clé retournée doit exister dans `SOUS_TYPE_MOTS` (backend).
- **Backend** : 5 nouveaux `sousType` dans `SOUS_TYPE_MOTS` (`smartphones`, `maison`, `mode`, `auto-moto`, `jeux`) — additif pur.
- **`CardActions`** : au 1er ajout d'un produit, groupe inféré (repli : catégorie DB via `CAT_NOM_SLUG`), stocké dans les entrées `nopalou_compare` (`{id, nom, type, groupe?, catSlug?}` — tableau racine conservé, rétrocompatible), et `?sousType=` poussé dans l'URL des pages liste (`/` et `/categorie/[slug]`). Boutons ⚖ incompatibles (autre type quand une comparaison produit est active, ou autre groupe) rendus `disabled` + `title` explicatif — jamais de toast d'erreur. Logique favoris inchangée.
- **Accueil + page catégorie** transmettent `sousType` au backend (filtre serveur → pagination/compteurs justes ; `sousType` inclus dans `hasFiltre` et la `key` de `ProduitsListe`) ; « Voir plus » filtré aussi.
- **`CompareFilterBanner`** (monté sur ces 2 pages) : « ⚖ Comparaison active — affichage limité aux X (similaires à « … ») » + ✕ Vider ; synchronise le filtre d'URL si la comparaison a été démarrée ailleurs. **`CompareBar`** retire `sousType` de l'URL quand la sélection se vide.

### Pièges / notes à retenir
- **`useSearchParams()` interdit** dans `CardActions`/`CompareBar`/`CompareFilterBanner` : montés sur des pages statiques (landing `[sousCategorie]`) et le layout global — sans Suspense boundary, `next build` échoue. Lire `window.location.search` dans les handlers/effets uniquement (jamais pendant le rendu). Build validé 73/73 pages.
- **Bug pré-existant corrigé au passage** (`fe31532`) : le fetch SSR de `categorie/[slug]/page.tsx` n'envoyait pas `X-SSR-Token` → `blockScraperUA` le bloquait en 429 (page « aucun produit » en local, cf. piège `SSR_SECRET` du 11 juillet). Aligné sur l'accueil (`SSR_HEADERS`).
- **Dette notée (revue)** : `SOUS_TYPE_MOTS` et `CAT_FALLBACK` (même fichier `backend/routes/produits.js`) dupliquent partiellement les mots-clés de `maison`/`mode`/`auto-moto`/`jeux` — si l'un évolue, mettre l'autre à jour.
- Périmètre assumé : produits uniquement — une comparaison immo/télécom active ne désactive PAS les ⚖ produits (comportement historique conservé).
- Non vérifié par navigateur réel (aucun outil dispo) : rendu du bandeau, grisage effectif des ⚖, Vider — smoke-test manuel recommandé après déploiement.

---

## État du projet (13 juillet 2026 — scraper Facebook réparé, exécution locale + automatisation Windows)

Le scraper Facebook (`backend/services/scraper-immo-facebook.js`) n'avait **jamais fonctionné depuis sa création en juin** — `waitUntil: 'networkidle'` ne se résout jamais sur Facebook (polling/websockets permanents), et `playwright` n'était qu'en devDependency donc jamais installé sur Render en production. Chantier en deux temps : d'abord tenter de le faire tourner sur Render, puis pivot vers exécution locale + automatisation Windows après avoir confirmé que le plan Render free ne peut structurellement pas le supporter.

### Tentative Render (abandonnée — voir raison ci-dessous)
Corrigé dans l'ordre, chaque étape validée en conditions réelles avant de passer à la suivante : `networkidle` → `domcontentloaded` (timeout 30s puis 60s, le plan free est plus lent que le local) ; `playwright` déplacé en dependency réelle + `render.yaml` pour installer `chrome-headless-shell` au build (`--only-shell`, plus léger que Chromium complet) ; `PLAYWRIGHT_BROWSERS_PATH=0` pour que le binaire installé au build survive jusqu'au runtime (sinon `/opt/render/.cache` ne persiste pas) ; session Facebook transmise via variable d'env `FB_SESSION_JSON` (le fichier `.fb-session.json` local est gitignoré, jamais déployé) ; verrou mémoire (`backend/lib/scrapingLock.js`) pour empêcher le scraper Facebook et le cron de scraping produits de tourner en même temps.

**Abandonné après confirmation en prod** : même avec toutes ces corrections, le service **redémarrait tout seul** (OOM) en pleine exécution du scraping — logs montrant `Instance restarted`, `[SIGTERM]`, des dizaines de `Cannot use a pool after calling end on the pool`. 512 Mo de RAM (plan Render free/Hobby) est structurellement insuffisant pour Express + PostgreSQL pool + un navigateur Chromium headless, quelle que soit la taille du run. Décision utilisateur explicite : rester 100% gratuit, ne pas upgrader le plan.

### Solution retenue — script local
- `backend/scripts/scraper-facebook-local.js` : lance `scraperImmo()` depuis la machine locale, écrit directement dans la base de production via le `DATABASE_URL` du `.env` local (pas de synchronisation supplémentaire nécessaire — une seule base existe). `render.yaml`/`PLAYWRIGHT_BROWSERS_PATH` revertés à l'état d'origine, plus besoin de Chromium sur Render.
- Bouton admin `/admin/annonces` retiré (`lancerSyncFacebook` server action supprimée) — devenu trompeur puisqu'il ne peut plus fonctionner de façon fiable en prod.
- `backend/scripts/fb-login-setup.js` créé — référencé 4 fois dans le code depuis juin mais n'avait jamais existé dans le repo ; ouvre un navigateur visible pour se connecter manuellement (gère 2FA/vérification Meta), sauvegarde la session dans `backend/.fb-session.json`.
- **Rotation des 16 groupes persistée sur disque** (`backend/.fb-scraper-state.json`, gitignoré) — bug trouvé en conditions réelles : la variable de rotation était en mémoire, donc remise à zéro à chaque lancement CLI (un nouveau process Node à chaque fois), les mêmes 5 premiers groupes étaient rescrapés en boucle. `maxGroupes: 5` par défaut (limite la durée d'un run), `--tout` pour les 16 d'un coup.
- **Automatisation Windows Task Scheduler** : `backend/scripts/scraper-facebook-auto.bat` (wrapper qui logge dans `backend/scripts/logs/`, gitignoré) + `notifier-scraper-fb.ps1` (notification Windows toast au début du run et à la fin avec résumé — annonces ajoutées/doublons/erreurs, lu depuis `backend/.fb-scraper-resume.txt`). Piège Task Scheduler : l'option "Exécuter que l'utilisateur soit connecté ou non" exige un mot de passe Windows et échoue souvent (« compte inconnu ») — utiliser "Exécuter uniquement si l'utilisateur est connecté" à la place, plus l'option "Si la tâche planifiée est manquée, l'exécuter dès que possible" pour rattraper au redémarrage si le PC était éteint.

### Bugs de qualité de données trouvés en observant les vraies annonces scrapées
- **Dédoublonnage inter-groupes** : un même post republié tel quel dans plusieurs groupes Facebook créait autant de lignes quasi-identiques (`ref_externe` ne détecte que les doublons dans un même groupe, pas entre groupes). `upsertAnnonceClassifiee()` vérifie désormais si un numéro de téléphone extrait a déjà une annonce Facebook des 7 derniers jours avant d'insérer.
- **Commentaires réels mélangés au texte du post** : `estFilDeCommentaires()` ne rejetait un fil de commentaires que si le texte total faisait ≤15 mots — un post + 2 vrais commentaires dépasse largement ce seuil et passait tel quel (ex: titre affichant des noms de commentateurs + "J'aime Répondre Partager"). Le texte est désormais coupé à "Voir plus de commentaires" avant tout autre traitement.
- **Suffixes d'interface Facebook** ("Envoyez votre premier commentaire...", "Écrivez un commentaire public...", bouton résiduel "En voir plus") retirés du texte extrait — 11 annonces déjà en base nettoyées en place.
- **`contact_tel = 'Voir sur Facebook'` générait des liens cassés** : `href="tel:Voir sur Facebook"` et un lien `wa.me` avec numéro vide, au lieu d'un vrai lien. Nouvelle colonne `annonces_classifiees.url_source` (alimentée par le scraper avec le lien réel du post) ; la fiche annonce affiche un vrai bouton "Voir sur Facebook" quand le numéro n'a pas pu être extrait, masqué proprement si `url_source` est absent (8 annonces scrapées avant ce fix n'ont pas cette donnée rétroactivement).
- Bouton "Recevoir par WhatsApp" retiré de la fiche annonce (demande explicite) — ne restent que le tél. cliquable et le bouton WhatsApp direct.

### Fonctionnalités `/annonces` ajoutées au passage (avant le pivot ci-dessus)
Recherche texte (titre+description — le backend le supportait déjà, jamais exposé côté UI), filtres prix min/max et origine (Nopalou vs Facebook), favoris (♥) sur les cartes. Pas de comparateur ajouté — décision assumée, les annonces sont trop hétérogènes (meuble vs voiture vs téléphone) pour qu'un comparatif côte à côte ait un sens, contrairement aux produits/immo/télécom qui partagent des critères communs. Bug pré-existant corrigé au passage : `nopalou_favs` ne stockait qu'un tableau d'IDs sans type (produits uniquement) — un favori immo/telecom ajouté depuis `CardActions` n'apparaissait jamais sur `/favoris`. Migré vers `{id, type}[]`.

**Pour relancer le scraping** : `node backend/scripts/scraper-facebook-local.js` (5 groupes, rotation automatique) ou configurer la tâche planifiée Windows décrite ci-dessus pour un fonctionnement autonome.

---

## État du projet (12 juillet 2026, soir — refonte visuelle du bloc SEO homepage)

Suite au chantier SEO site-wide du même jour (voir entrée ci-dessous), retour utilisateur sur le rendu du bloc SEO homepage ajouté par ce chantier (« pas bien aligné et mal formaté », puis « pas vivant ni attirant »). Deux passes :

1. **Correctif d'alignement** (`88fbd74`) — le bloc utilisait `columns: 2` (CSS multi-colonnes façon journal), qui répartissait 3 paragraphes de façon déséquilibrée (1 paragraphe en colonne 1, 2 entassés en colonne 2, laissant un vide visuel). Remplacé par un vrai `display: grid` 2 colonnes avec un paragraphe par colonne.
2. **Refonte visuelle complète** (`649d3bc` CSS + `d902cc3` JSX) — le bloc restait plat (div bordé générique, liens simplement soulignés) sans lien avec l'identité visuelle « ticket » du reste de la homepage. Process complet brainstorming → maquette Artifact (comparatif avant/après validé par l'utilisateur) → spec → plan → subagent-driven-development. Nouvelle carte `.seo-card` : perforation en haut (même motif `radial-gradient` que `.card-produit--ticket`), en-tête centré (titre + badge `.seo-tag`), 2 paragraphes avec icône ronde (`.seo-icon`), catégories principales et recherches longue traîne en chips cliquables (`.chip`/`.chip-small`) avec icône emoji et hover à liseré accent (`inset 3px 0 0 var(--accent)`, cohérent avec le hover déjà utilisé sur les autres cartes du site), pied de carte avec point de statut. Aucune URL ni contenu éditorial modifié — refonte purement visuelle, `CATEGORIES[].emoji` réutilisé directement (pas de mapping icône dupliqué). Revue finale opus : « Ready to merge », 0 Critical/Important.

Spec : `docs/superpowers/specs/2026-07-12-refonte-bloc-seo-homepage-design.md`. Plan : `docs/superpowers/plans/2026-07-12-refonte-bloc-seo-homepage.md`.

**Piège à noter** : le plan contenait une incohérence rédactionnelle entre sa section « Global Constraints » (« wording byte-identical ») et son propre JSX prescrit (qui retire volontairement le suffixe « au Sénégal » des chips catégorie, la carte portant déjà ce contexte via son H2). La revue finale a tranché : le JSX/la maquette approuvée font foi, ce n'est pas une régression — juste une imprécision du texte de contrainte du plan, à ne pas reproduire si ce plan sert de modèle.

---

## État du projet (12 juillet 2026 — chantier SEO site-wide « Qualité puis conquête », mergé en prod)

Déclencheur : audit SEO demandé par l'utilisateur (« quelle chance qu'on retrouve mon site sur ses mots-clés ? »). Constat Search Console : **719 pages découvertes, 4 indexées** (uniquement les 4 liens de la navbar) — domaine jeune, maillage interne quasi nul, pages jugées minces. Spec `docs/superpowers/specs/2026-07-11-seo-site-wide-design.md`, plan en 13 tâches `docs/superpowers/plans/2026-07-11-seo-site-wide.md`, exécuté via subagent-driven-development (~20 commits, merge `a97e5eb`), revue finale de branche opus « Ready to merge » 0 Critical/Important.

### Livré
- **20 landing pages config-driven** : 9 sous-catégories produits `/categorie/[slug]/[sousCategorie]` (climatiseurs 2150 produits, iphone, samsung, xiaomi-redmi, tecno, televiseurs, refrigerateurs, electromenager, ordinateurs), 7 immo `/immo/{location,vente}-{appartement,chambre,studio,maison,terrain}-dakar` (dossiers statiques + composant partagé `ImmoLanding`), 4 télécom `/telecom/{orange,yas,promobile,expresso}` (`OperateurLanding`). Pattern clé : les fichiers de données (`categorie/categories-data.ts`, `categorie/sous-categories-data.ts`, `immo/landing-data.ts`, `telecom/landing-data.ts`) sont la source unique importée par les pages, le sitemap ET le maillage — aucune URL ne peut dériver.
- **Backend** : 5 nouveaux `sousType` dans `SOUS_TYPE_MOTS` (`iphone`, `samsung`, `xiaomi`, `tecno`, `ordinateurs`) — extension additive pure, aucun placeholder SQL touché.
- **Correctifs** : titles dédupliqués sur ~40 pages (« … | Nopalou | Nopalou » — voir piège ci-dessous), canonicals + descriptions (telecom, 5 guides, boutiques, assistant-whatsapp), JSON-LD produit construit sur les offres filtrées `valides` (plus la liste brute), mojibake corrigé (pages budget + `comparer/[a]/[b]`), contenu éditorial unique par catégorie (champ `contenu: string[]`), maillage footer « Recherches populaires » + bloc SEO homepage + fil d'Ariane produit cliquable (map `CAT_SLUGS` : libellés DB réels `Telephones`/`TV & Electro`/… → slugs), sitemap assaini (retrait `/connexion`, `/inscription`, `/favoris`, `/comparaison`, `/categorie/beaute` (0 produit) ; ajout guides + pages budget + 20 landing pages). ID Google Analytics corrigé : `G-GD7365PKTS` (l'ancien `G-3KGE1YBMVJ` ne collectait rien).

### Pièges découverts (à retenir absolument)
- **`moins-de-[budget]` était un triple bug** : Next.js traite un dossier à brackets partiels comme un segment dynamique COMPLET → la route capturait n'importe quel 3ᵉ segment (`/categorie/smartphones/nimportequoi` rendait la page), `params.budget` recevait le segment entier (`parseInt` → NaN → toujours 100 000), et tout le texte était en mojibake. Remplacée par `[sousCategorie]` qui gère budget (`/^moins-de-(\d{4,9})$/`) + sous-catégories + `notFound()`. Deux segments dynamiques frères sont interdits par Next — d'où le remplacement plutôt que l'ajout.
- **Template de titre** : `layout.tsx` définit `template: '%s | Nopalou'` — AUCUN `title:` de page ne doit contenir « Nopalou » (doublon garanti en prod). Les `openGraph.title` ne sont PAS templétés (garder la marque là est correct).
- **Soft-404 site-wide** : `notFound()` sur les pages `force-dynamic` renvoie HTTP **200** (streaming — les headers partent avant), en dev ET en prod, sur tout le site (`produit/[id]`, `categorie/[slug]` inclus). Le contenu « Page introuvable » est bien rendu. Dette connue, faible impact (rien ne pointe vers ces URLs) — ne pas « redécouvrir » ce bug.
- **`npm run build` pendant que le dev server tourne** : toujours interdit (corrompt `.next`) ; et supprimer un dossier de route sous un dev server actif le fait planter en boucle « Jest worker exceptions » → seul un restart le répare.
- **Sitemap en dev** : la partie dynamique (produits/immo/annonces/boutiques) rend vide si le premier fetch part avant que le backend soit chaud, puis reste cachée 1h (`revalidate: 3600`) — ne pas conclure à une régression, la prod fonctionne.
- Le libellé « Yas » (ex-Free) est la valeur `operateur` réelle en base pour le 2ᵉ opérateur ; `?operateur=` matche en ILIKE.

### Reste à faire (côté fondateur — voir `docs/SEO-POST-DEPLOIEMENT.md`)
Re-soumettre le sitemap dans Search Console, demandes d'indexation des ~32 pages stratégiques (~10/jour sur 4 jours), règles Cloudflare (redirect www + cache edge), suivi hebdo de la courbe « Pages indexées » (départ : 4). Résultat attendu sous 2-6 semaines — domaine jeune.

### Dette acceptée
Soft-404 streaming (ci-dessus) ; priorité sitemap 0.85 partagée catégories/sous-catégories ; interface `ImmoResponse` dupliquée (`ImmoLanding.tsx` + `immo/page.tsx`) ; `Number(page)` → NaN possible dans la pagination si `?page=abc` (motif préexistant, dupliqué dans `[sousCategorie]`).

---

## État du projet (11 juillet 2026 — Phases 1-6 CDC + design « ticket » + audit mobile/PWA, tout mergé en prod)

Trois chantiers livrés et déployés le même jour (32 commits sur `main`, Render auto-déployé).

### Chantier 1 — Phases 1-6 du CDC v4.0 (17 commits, `720432b`..`3254403`)
- **Alertes prix** : cron toutes les 15 min (`verifierAlertsPrix()` dans `scraper.js`), page `/mes-alertes` (Server Actions — ne PAS importer `backendAuthFetch` dans un Client Component, ça tire `server-only` et casse le build). **Piège corrigé** : l'alerte est désactivée (`active=false`) après envoi — sans ça l'utilisateur était re-notifié toutes les 15 min.
- **Bug de prod critique corrigé** : les crons métier (alertes, anomalies) étaient dans `demarrerScraping()`, jamais appelée sur Render (`SCRAPING_DISABLED=true`) → nouvelle fonction **`demarrerCronsMetier()`** appelée inconditionnellement dans `app.js`. ⚠️ Les crons relances-expiration/nettoyage/WhatsApp-cleanup sont TOUJOURS derrière le flag scraping — dette connue, jamais exécutés sur Render.
- **Historique prix** : chart SVG 30j (`PriceHistoryChart.tsx`) sur la fiche produit.
- **Sentry v10** : `@sentry/node` v10 n'a plus `Sentry.Handlers` (API v7) — init simple + `Sentry.setupExpressErrorHandler(app)` ; côté Next `@sentry/nextjs` installé. **Inactif tant que `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` ne sont pas configurés sur Render.** (Le code frontend référence encore `new Sentry.Replay(...)` API v7 — à migrer si un DSN est ajouté.)
- **Pages programmatiques SEO** : `/comparer/[a]/[b]` et `/categorie/[slug]/moins-de-[budget]`. **Piège majeur vécu** : les dossiers avaient été créés avec des brackets fragmentés (`[slug` + dossier `]`) — Next ne reconnaissait pas les segments dynamiques et pré-générait avec `params` vide (crash `toLowerCase` au build). Sur Windows/PowerShell, manipuler ces dossiers exige `-LiteralPath` ou les APIs .NET.
- **Phase 5 affiliation** : routes `/api/affiliates` (track public, clicks/convert protégés `adminSecretOnly`), tables `affiliate_clicks`, service `awin-postback.js`, dashboard `/admin/affiliates/tracking`.
- **Phase 6 qualité données** : `anomaly-detector.js` (cron 1h UTC — quarantaine si prix ≤ 0 ou variation > 50% vs moyenne 30j de `historique_prix`), colonne **`offres.quarantinee`** (DEFAULT FALSE) filtrée par `AND o.quarantinee = false` dans les requêtes produits/offres, table `quarantines_log`, dashboard `/admin/qualite` (valider/rejeter). Première exécution réelle : **138 offres quarantinées** (variations 50-112%, légitimes).
- **Piège local (pas committé)** : `SSR_SECRET` doit exister dans `frontend-next/.env.local` ET dans le `.env` backend — sinon `blockScraperUA` (middlewares/rateLimit.js) bloque le fetch SSR de Next (UA `node`) en 429 → « Impossible de charger les produits ». Vérifier ce couple sur tout nouvel environnement.

### Chantier 2 — Design « ticket » + finition typographique (9 commits)
Spec/plan : `docs/superpowers/specs/2026-07-11-design-ticket-homepage-design.md` + plan associé. Décisions validées : palette existante conservée (PAS la palette kraft/indigo du CDC), monospace **système** pour les prix (0 Ko, `--font-mono`), tilt sur cartes promo uniquement, **Archivo** remplace Sora pour les titres.
- **Bug latent corrigé au passage** : 29 sélecteurs utilisaient `'Sora'` en littéral (CSS + styles inline TSX) — ça ne matche JAMAIS le nom scopé généré par `next/font`, ces titres rendaient en sans-serif système depuis toujours. Toujours utiliser `var(--font-archivo)`.
- **Bug d'uniformisation corrigé** : `.home-how`/`.home-proof`/`.home-cta-annonce` référençaient `var(--max-w)`/`var(--px)` **jamais définies** → sections étirées bord à bord. Définies dans `:root` (1200px/20px). Toutes les sections homepage (y compris tarifs et bloc SEO, passé en 2 colonnes desktop via `.home-seo-cols`) partagent maintenant cette largeur.
- Signature : tilt ±0.35° (à 1° le texte devenait flou — anti-aliasing de rotation ; retour utilisateur explicite « presque invisible »), perforation en `radial-gradient` (jamais `border: dashed`), badge promo tampon (-3°, triple `box-shadow inset`), ombres 2 couches teintées encre `rgba(26,22,18,…)` (jamais de noir pur), boutons comparer/favori en orange accent. Règle focus : `outline` SANS `border-radius` (sinon les liens circulaires du footer se déforment au focus).
- Retours utilisateur intégrés : densification générale (paddings réduits, cartes « Comment ça marche » horizontales icône+texte), exigence « pas de design IA par défaut, travail fin ».

### Chantier 3 — Audit mobile + PWA (5 commits)
- `export const viewport` dans `layout.tsx` (`viewportFit: 'cover'`, themeColor déplacé ici) + `env(safe-area-inset-bottom)` sur `.bottom-bars-wrap`.
- **Icônes PWA PNG** 192/512 + **maskable dédiée** (safe-zone 20%) : routes `ImageResponse` sous `src/app/icons/{192,512,maskable-512}/route.tsx`. **Piège : `runtime = 'edge'` obligatoire** — `@vercel/og` plante en runtime Node sur Windows (ERR_INVALID_URL sur sa police embarquée). Manifest v3 avec entrées `any`/`maskable` séparées ; SW bump `nopalou-shell-v2`.
- Mobile : grille produits **2 colonnes** sous 600px (pattern marketplace), `.table-alertes` et `.comparison-table` avec scroll horizontal de secours, `.auth-page` en `minmax(0,420px)` + bascule à 900px, perforation ticket ajustée au padding mobile.

### Pièges d'environnement local (Windows) à connaître
- `npm run build` pendant que le dev server tourne **corrompt `.next`** → le site rend sans CSS (404 sur layout.css). Toujours : tuer le process du port 3001, builder, relancer `npm run dev`.
- L'erreur **EBUSY** en fin de build (copie `standalone`) est un verrou antivirus Windows — PAS un échec si « Generating static pages 61/61 ✓ » apparaît ; sans impact sur Render (Linux).
- `TaskStop`/kill du shell ne tue pas le process node enfant sur Windows — libérer le port via `Get-NetTCPConnection -LocalPort 3001` + `Stop-Process`.

---

## État du projet (10 juillet 2026 — tri et filtres sur les pages guide)

Audit demandé ("ajouter tri et filtre sur les résultats des guides") sur les 4 pages "guide" à résultats (`guide-prix`, `guide-achat`, `guide-immo`, `guide-forfait`). Constat initial : `guide-achat`/`guide-immo`/`guide-forfait` avaient déjà un système de tri (pills Score/Prix/Dispo-Surface-Data, classes CSS partagées `.guide-tri-btns`/`.guide-tri-btn`) et des filtres riches dans un panneau gauche (budget, catégorie/type, sliders de pondération) — seul `guide-prix` n'avait qu'un filtre par catégorie et aucun tri sur sa liste de résultats. Périmètre validé avec l'utilisateur (7 commits `45f5bc1`..`df57d3d`, exécutés via subagent-driven-development avec revue à chaque tâche + revue finale de branche) :

- **Backend** (`backend/routes/produits.js`, `GET /api/produits`) : nouveau champ agrégé `etats` (tableau des valeurs distinctes `offres.specs->>'etat'` — neuf/occasion/reconditionne — parmi les offres en stock d'un produit) et nouveau paramètre `etat` pour filtrer côté serveur via une sous-requête `EXISTS` corrélée (pas un `JOIN`, pour ne pas fausser les agrégats `MIN(o.prix)`/`COUNT(o.id)`/`etats` d'un produit multi-offres). **Piège de renumérotation SQL** : ajouter `etat` comme `$7` a nécessité de décaler tous les placeholders de recherche multi-tokens de `$7+i` vers `$8+i` (`buildQCond`) — vérifié qu'aucun autre `$7`/`$8` n'était oublié dans le handler, et que la recherche multi-mots (`q=iphone 14`) fonctionne toujours après coup. Changement additif et rétrocompatible : les 8 autres appelants existants de `/api/produits` ignorent simplement le nouveau champ `etats`, et `etat` non fourni ⇒ `$7::text IS NULL` court-circuite le filtre.
- **`guide-prix`** (`GuidePrixContent.tsx`) : ajout de 4 pills de tri (Pertinence/Prix ↑/Prix ↓/Plus d'offres, tri client sur `sortedResults`, réutilise `.guide-tri-btns`) et d'un filtre prix min/max (deux `<input type="number">`, envoyés en `prixMin`/`prixMax` — déjà supportés côté backend) à côté des pills de catégorie existantes. Min > max ⇒ filtre ignoré silencieusement (pas d'erreur), cohérent avec la dégradation des autres filtres budget du site.
- **`guide-achat`** (`GuideAchatContent.tsx`) : nouveau filtre **État** (select Neuf/Occasion/Reconditionné/Tous, consomme le nouveau champ backend) et nouveau filtre **Disponibilité minimum** (nombre de marchands, filtré côté client sur le champ déjà présent `nb_offres`, après le calcul du score et avant `setResults`/`setTotal`).
- **`guide-immo`** (`GuideImmoContent.tsx`) : 4ᵉ bouton de tri **"🆕 Récent"**, utilisant `annonces_immo.created_at` (déjà renvoyé par `GET /api/immo`, `ORDER_MAP.recent` déjà supporté côté backend — aucun changement serveur nécessaire ici).
- **`guide-forfait`** : volontairement non touché — pas de colonne `created_at` fiable sur `forfaits_telecom`, et un tri "plus récent" n'a pas de sens pour un catalogue de forfaits opérateur (pas des annonces qui expirent).

**Bug trouvé et corrigé en cours de route** (`dcce624`) : la première version du commit `guide-prix` tri (`8adaf93`) contenait une chaîne JS `'🏪 Plus d'offres'` avec une apostrophe non échappée dans un littéral entre guillemets simples — erreur de syntaxe bloquant totalement la compilation (`tsc`/`next build`), non détectée par l'implémenteur car sa seule vérification était un `curl` confirmant que la page se chargeait (bundle dev-server potentiellement obsolète). Corrigé en passant à un template literal (`` `🏪 Plus d'offres` ``). Depuis cet incident, toute tâche de ce chantier a été dispatchée avec l'instruction explicite de lancer `npx tsc --noEmit` et de vérifier zéro erreur avant de déclarer "terminé" — pas seulement un chargement de page réussi.

**Limitation connue** : aucune vérification par navigateur réel (clic effectif sur les pills/select, confirmation visuelle du réordonnancement) n'a été possible pendant ce chantier — aucun outil d'automatisation navigateur n'était disponible dans l'environnement. Vérification faite uniquement via compilation TypeScript propre + appels `curl` réels contre le backend/la base de production. Un test manuel rapide des 3 pages modifiées est recommandé si un doute apparaît sur le comportement visuel.

**Documentation associée** : `docs/superpowers/specs/2026-07-10-tri-filtre-pages-guide-design.md` (design) et `docs/superpowers/plans/2026-07-10-tri-filtre-pages-guide.md` (plan d'implémentation en 6 tâches).

---

## État du projet (9 juillet 2026 — caractéristiques par offre sur la fiche produit et la comparaison)

Suite à un retour d'usage réel ("comment avoir les caractéristiques par offre en résumé avant d'acheter"), 2 commits (`d76eda9`, `4d682f7`) ajoutent l'extraction et l'affichage automatique de caractéristiques structurées par offre — jusque-là, la table `offres` (produits scrapés/marketplace) ne stockait que `prix`/`url_achat`/`titre_marchand` brut, sans aucune donnée structurée, contrairement à `annonces_classifiees`/`boutique_produits` qui ont une colonne `caracteristiques JSONB`.

**Backend** :
- Nouvelle colonne `offres.specs JSONB`, peuplée automatiquement au scraping (`sauvegarderProduits()` dans `scraper.js`) via une nouvelle fonction `extraireSpecs(titre)`, exportée pour réutilisation.
- Extraction par regex déterministes (pas de LLM — même choix que la FAQ chatbot WhatsApp, pour rester prévisible et sans coût API), **réutilisant** les signaux déjà présents dans `prixPlancher()` (RAM, stockage, écran en pouces, BTU, litres) au lieu de les dupliquer — nouveaux helpers partagés `extraireRamGo`/`extraireStockageGo`/`extraireBtu`/`extraireLitres`/`extraireKg`/`extrairePouce`.
- Champs extraits, conditionnés par mot-clé de catégorie détecté dans le titre (pour éviter les faux positifs entre catégories) :
  - Téléphone/tablette : `ram_go`, `stockage_go`, `couleur`, `etat` (`neuf`/`occasion`/`reconditionne`)
  - Climatiseur : `puissance_btu` (BTU explicite, ou converti depuis "X,XXcv" via `extraireBtuAffichage`, 1 CV ≈ 3500 BTU/h)
  - Frigo/congélateur : `capacite_litres`
  - Machine à laver : `capacite_kg`
  - TV/écran : `ecran_pouces`
- **Piège rencontré** : la première version de la conversion CV→BTU était faite directement dans `extraireBtu()`, la même fonction utilisée par `prixPlancher()` pour l'heuristique anti-fraude de prix (détection ×100/÷1000). Ça changeait le plancher de prix pour des climatiseurs existants (ex: un split 2,25cv passait de 100 000 à 80 000 FCFA de plancher) — effet de bord non voulu sur un mécanisme sensible. Corrigé en isolant la conversion CV dans `extraireBtuAffichage()`, utilisée uniquement par `extraireSpecs()` ; `prixPlancher()` garde exactement son comportement d'avant (vérifié par comparaison directe avant/après via `git stash`).
- **Autres bugs de regex trouvés en testant contre les 6100+ offres réelles de prod** (pas seulement des cas synthétiques) : le motif "128Go RAM 4Go" faisait capturer `4` comme stockage au lieu de `128` (le lookahead négatif `(?!\s*ram)` excluait le premier nombre à tort) ; les libellés disjoints ("Ram 12Go ... Memoire 128Go") n'étaient pas reconnus ; "1To" et "256Gb" (anglicisme) n'étaient pas capturés du tout. Corrigés avec des regex dédiées à priorité (libellé explicite > motif double ambigu > fallback).
- `GET /api/produits/:id/offres` (`routes/produits.js`) normalise `r.specs = r.specs || {}` pour les offres pas encore backfillées.
- Script `backend/scripts/backfill-specs-offres.js` (`--dry-run` supporté, même pattern que `corriger-prix-outliers.js`) — retraite **toutes** les offres avec `titre_marchand` (pas seulement `specs IS NULL`, pour permettre de relancer après extension des champs extraits sans dead rows). Exécuté 2 fois en prod pendant ce chantier (ajout initial, puis ajout des champs par catégorie) — 6100+ offres couvertes.

**Frontend** :
- Fiche produit (`produit/[id]/page.tsx`) : chaque ligne de la section "Comparer les prix" affiche désormais des badges compacts (`.offre-specs`/`.offre-spec-badge`, `globals.css`) pour les specs détectées, la fraîcheur relative ("il y a 6j", via nouvelle fonction `tempsRelatif()` dans `lib/format.ts`), et le titre complet en tooltip natif (`title=`) même si tronqué visuellement à 60 caractères.
- Page de comparaison côte à côte (`comparaison/page.tsx`) : nouvelle ligne "Caractéristiques" dans le tableau, affichant les specs de l'offre la moins chère par produit comparé (même badges que la fiche produit, réutilisés).
- **Changement de comportement demandé séparément** : le bouton "Voir" des mini-cartes d'offres dans la section "Meilleures offres" de `/comparaison` pointait directement vers `o.url_achat` (le marchand, sans tracking) — il pointe maintenant vers `/produit/{id}` (la fiche interne), cohérent avec le fait que ces 3 mini-offres appartiennent toutes au même produit de la colonne. Le champ `url_achat`, devenu inutilisé dans ce fichier, a été retiré du type `Offre`.
- **Distinction importante à retenir si on retouche ces boutons** : sur la **fiche produit**, les boutons "Voir l'offre →"/"Acheter" pointent vers `/api/click/{offreId}` (redirection marchand + tracking) — volontaire, car chaque ligne y est une offre différente du **même** produit chez des vendeurs différents. Sur la page **comparaison**, le bouton "Voir" pointe vers `/produit/{id}` — volontaire aussi, car chaque colonne y est un produit **différent** à comparer, donc "voir" doit amener à sa fiche, pas directement chez un marchand.

**Limitation connue** : `puissance_btu`/`capacite_litres`/`capacite_kg`/`ecran_pouces` ne sont peuplés que si le titre brut scrapé mentionne explicitement l'unité correspondante (BTU/CV, litres, kg, pouces) — de nombreuses offres de ces catégories (ex: "Split Haier" sans aucune puissance précisée) n'ont et n'auront jamais ces champs tant que le marchand source ne les inclut pas dans son titre. C'est un comportement attendu (dégradation propre avec `—`), pas un bug.

---

## État du projet (7 juillet 2026, soir — fiche produit, tri des listes et filtre opérateur)

Suite à un retour d'usage réel signalant 4 insuffisances UX, un chantier de 7 commits (`970518b`..`8d75c6f`) a corrigé :

1. **Bouton "Acheter" repositionné** — `frontend-next/src/app/produit/[id]/page.tsx` : le CTA principal était auparavant relégué après tout le bloc de métriques (nb marchands/prix min/max/économie), loin sous le nom du produit. Il est maintenant affiché à droite du `<h1>` dans le header (`produit-fiche-nom-row--avec-cta`), avec repli en pleine largeur sous le nom sur mobile (< 640px). Un second CTA identique (texte complet "🛒 Acheter au meilleur prix →") a été réintroduit après la section des offres, pour donner un point d'achat visible même après que l'utilisateur ait scrollé — sans ce second CTA, seul le bouton du header restait accessible sur une fiche longue.
2. **Tableau "Comparer les prix du marché" rendu cliquable** — la table de produits similaires (même section) n'avait qu'une petite colonne d'action cliquable. Toute la ligne pointe maintenant vers la fiche du produit similaire, via un nouveau composant client `frontend-next/src/app/produit/[id]/SimilRow.tsx`. **Piège rencontré en revue** : la première implémentation utilisait `onClick`/`role="link"` sur un `<tr>` brut avec navigation par `router.push()` — ça fonctionne au clic gauche mais casse le clic-milieu/Ctrl+clic ("ouvrir dans un nouvel onglet") et le prefetch Next.js au survol, puisqu'aucun `<a href>` natif n'existe. Corrigé en enveloppant le contenu de chaque `<td>` dans un vrai `<Link>` (via `Children.map`/`cloneElement`) — si vous touchez à ce composant, gardez cette approche plutôt que de repasser par un `onClick` custom.
3. **Tri ajouté sur Produits (accueil), Annonces et Boutiques** — pattern de pills réutilisé de `immo/page.tsx`/`telecom/TelecomClient.tsx` (`<Link href="?tri=...">`, classe `budget-pill`/`active`). Le backend `GET /api/produits` supportait déjà `tri` (`prix_asc`/`prix_desc`/`nom_asc`, défaut popularité) mais ce n'était pas exposé côté UI — corrigé. `GET /api/annonces` et `GET /api/boutiques` ont reçu un nouveau paramètre `tri` côté backend (`recent`/`prix_asc`/`prix_desc` pour annonces ; `recent`/`nom_asc` pour boutiques). **Point important sur `/api/boutiques`** : l'`ORDER BY` par défaut (sans `tri` fourni) reste exactement l'ordre commercial préexistant (plan Business > Pro > gratuit, puis sponsorisé, puis récence) — le nouveau tri ne s'applique QUE si l'utilisateur sélectionne explicitement une option différente, pour ne pas casser la mise en avant des plans payants.
4. **Filtre Opérateur ajouté au wizard "Trouver mon forfait"** (`frontend-next/src/app/telecom/WizardForfait.tsx`) — le wizard n'avait que Budget/Profil/Durée alors que la donnée `operateur` existe en base depuis longtemps et que la page `/telecom` classique l'utilisait déjà. Le composant reçoit maintenant `operateurs: string[]` en prop (réutilise la liste déjà chargée par `TelecomClient.tsx`, pas de nouveau fetch), avec un 4ᵉ champ "Opérateur préféré" à l'étape 1 (option "Peu importe" par défaut).

**Accessibilité** : le CTA du header a un `aria-label` dynamique (`Acheter au meilleur prix chez {marchand}`) puisque son texte visible a été raccourci à "🛒 Acheter →" — sans ça, le nom accessible du lien ne transmettait plus l'info "meilleur prix" pour les lecteurs d'écran.

**Documentation associée** : `docs/superpowers/specs/2026-07-07-corrections-fiche-produit-tri-forfait-design.md` (design) et `docs/superpowers/plans/2026-07-07-corrections-fiche-produit-tri-forfait.md` (plan d'implémentation en 7 tâches, exécuté via subagents + revue finale multi-angles qui a confirmé les 3 points corrigés ci-dessus).

---

## État du projet (7 juillet 2026 — mode de paiement manuel Wave/Orange ajouté)

En attendant l'obtention des clés API Wave Business / Orange Money marchand (KYC en cours), un **mode de paiement manuel** a été ajouté sur les 6 flux de paiement existants : le client dépose de l'argent sur un numéro Wave/Orange affiché sur le site, déclare sa transaction (téléphone expéditeur + ID de transaction OU capture d'écran de preuve), et un admin valide manuellement depuis `/admin/paiements-manuels` — ce qui déclenche exactement la même logique d'activation que les webhooks automatiques.

**Backend** :
- Nouvelle table `paiements_manuels` (`id`, `utilisateur_id`, `reference`, `montant`, `methode` `wave`/`orange`, `telephone_expediteur`, `transaction_id_client`, `preuve_url`, `statut` `en_attente`/`valide`/`rejete`, `valide_par`, `valide_at`).
- La logique d'activation post-paiement (précédemment dupliquée dans les webhooks Wave et Orange de `backend/routes/paiement.js`) a été extraite dans une fonction partagée `appliquerPaiementReussi(reference, montant, methode)`, exportée et réutilisée par les deux webhooks ET par la nouvelle route de validation admin — élimine tout risque de divergence entre les 3 méthodes de paiement. Cette extraction a aussi corrigé un bug préexistant : le webhook Orange extrayait mal l'ID d'annonce pour le préfixe `ann_` (`.replace('ann_','')` au lieu de `split('_')[2]`), donc un paiement d'annonce via Orange Money n'activait jamais réellement l'annonce — corrigé de fait par l'unification (changement approuvé explicitement, voir `docs/superpowers/specs/2026-07-06-paiement-manuel-design.md`).
- Le montant réellement inscrit dans `commandes` (utilisé par les stats revenus admin) est désormais recalculé côté serveur via `montantAttendu()` selon le préfixe de référence — jamais celui déclaré par le client, y compris en mode manuel.
- 4 nouvelles routes dans `paiement.js` : `POST /manuel/declarer` (client, upload preuve via `multer`+Cloudinary), `GET /manuel/liste`, `POST /manuel/:id/valider`, `POST /manuel/:id/rejeter` (admin, `adminSecretOnly`).
- Les toggles `paiement_wave`/`paiement_orange` (existaient dans `settings` mais n'étaient jamais lus) sont maintenant vérifiés sur les 7 routes d'initiation concernées (6 Wave + 1 Orange + la route abonnement) — répondent `403` si désactivés depuis `/admin/tarifs`.
- Nouveaux settings : `paiement_manuel_actif` (toggle), `paiement_manuel_numero_wave`, `paiement_manuel_numero_om` (numéros affichés au client), éditables depuis `/admin/tarifs`.

**Frontend** :
- Composant partagé `frontend-next/src/components/ModalPaiementManuel.tsx` (formulaire de déclaration), réutilisé comme 3ᵉ mode de paiement sur les 6 écrans : `/payer-annonce/[id]`, sponsoring immo/produit/boutique, `/boutique/abonnement`, et **le bouton "Booster 7j" sur `/mes-annonces`, qui n'avait jamais eu d'UI jusqu'ici** malgré l'existence du flux backend `POST /api/paiement/boost/initier` depuis longtemps.
- Nouvelle page admin `/admin/paiements-manuels` (liste des déclarations en attente + boutons Valider/Rejeter), lien ajouté au menu admin.
- Format de référence strict à respecter partout : `{prefix}_${userId}_${entityId}` (`ann_`, `immo_`, `bout_`, `prod_`, `boost_`) ou `{prefix}_${userId}_${plan}` pour l'abonnement (`abmt_`) — c'est ce que `ref.split('_')[2]` extrait côté backend dans `appliquerPaiementReussi()`.

**Documentation associée** : `docs/superpowers/specs/2026-07-06-paiement-manuel-design.md` (design validé) et `docs/superpowers/plans/2026-07-06-paiement-manuel.md` (plan d'implémentation en 13 tâches, exécuté via subagents avec revue à chaque étape + revue finale de branche).

**Pour activer en production** : sur `/admin/tarifs`, renseigner les numéros Wave/Orange Money et activer `paiement_manuel_actif` ; optionnellement désactiver `paiement_wave`/`paiement_orange` tant que les clés API ne sont pas prêtes pour ne pas afficher des boutons qui échoueraient.

### Correctif complémentaire (même jour) : tous les prix Pro/Business/annonce rendus dynamiques

Un audit exhaustif a trouvé plusieurs écrans qui affichaient encore des prix codés en dur (15 000 / 35 000 / 1 500 FCFA) au lieu de lire `settings.plan_pro_prix` / `plan_business_prix` / `prix_annonce` comme le reste du site — un changement de tarif depuis `/admin/tarifs` ne se répercutait donc pas partout. Corrigé sur 10 fichiers :
- **Page d'accueil** (section "Boutique Pro/Business") — prix + libellé de paiement (Wave/manuel) désormais dynamiques.
- **`frontend-next/src/app/actions/paiement.ts`** — le montant Orange Money réellement facturé pour une annonce venait d'une valeur en dur (`1500`), pas de `settings.prix_annonce` : impact fonctionnel réel (facturation), pas seulement d'affichage.
- **`BoutiqueClient.tsx`** — 2 CTA "Passer en Pro" (catalogue produits + bannière incitative).
- **`AbonnementClient.tsx`** (`/boutique/abonnement`) — le libellé "Paiement via..." reflète maintenant les toggles réels `paiement_wave`/`paiement_manuel_actif`.
- **CGU** (`/cgu`) — montant légal de la 3ᵉ annonce payante.
- **Admin `/revenus`** — libellé stat + badges méthode de paiement étendus (ajout badge "🧾 Manuel", reconnaissance des préfixes `prod_`/`boost_`/`abmt_` en plus de `ann_`/`immo_`/`bout_`).
- **Admin `/abonnements`** (`ActiverPlanClient`) — options du select d'activation manuelle.
- **Admin `/communication`** — kit marketing (objections commerciales, texte apporteur d'affaires, exemples de commission) recalculé depuis les vrais tarifs/taux (`commission_business`, `apporteur_taux_commission`) au lieu de valeurs figées dans le texte.

Les fallbacks codés en dur restants (ex: `Number(settings.prix_annonce) || 1500`) sont volontaires — ils ne s'appliquent que si le fetch `/api/settings/public` échoue, pas des valeurs qui ignorent `settings`.

### Correctif complémentaire (7 juillet 2026, suite) : boutons Wave non masqués quand désactivé + libellés simplifiés

Suite à un retour d'usage réel (capture d'écran montrant le bouton "Booster 7j" toujours visible sur `/mes-annonces` malgré `paiement_wave` désactivé), un audit a trouvé que **5 écrans sur 6** consommant les toggles `paiement_wave`/`paiement_orange` ne les vérifiaient en fait jamais pour masquer leur bouton Wave — seul `PaiementClient.tsx` (`/payer-annonce`) le faisait déjà correctement. Résultat concret : un admin qui désactive Wave depuis `/admin/tarifs` (ex: en attendant les clés API) voyait quand même le bouton Wave partout ailleurs, qui aboutissait à un 403 `Paiement Wave temporairement indisponible` au lieu de rediriger vers le paiement manuel déjà disponible juste à côté.

Corrigé (ajout de `waveActif = settings.paiement_wave !== 'false'` + rendu conditionnel du bouton Wave) sur :
- `mes-annonces/AnnoncesClient.tsx` + `page.tsx` — bouton "Booster 7j"
- `immo/[id]/SponsoringImmoBtn.tsx` — sponsoring immo
- `produit/[id]/SponsoringProduitBtn.tsx` — sponsoring produit
- `boutique/BoutiqueClient.tsx` — sponsoring boutique (le prop `onSponsoring` de `BoutiqueCard` est devenu optionnel, sur le même modèle que `onPayerManuel` déjà en place)
- `boutique/abonnement/AbonnementClient.tsx` — bouton "Souscrire" Pro/Business

**Libellés simplifiés dans la foulée** (retrait de "sans app" puis de "manuellement", sur demande explicite) : les boutons de paiement manuel sont maintenant juste "Payer" / "Booster" (au lieu de "Payer sans app" / "Booster manuellement"), y compris le titre de `ModalPaiementManuel.tsx` ("Payer / j'ai déjà payé"). Les labels informatifs non cliquables (ex: "Paiement via Wave ou manuel" sur la page d'accueil et `/boutique/abonnement`) n'ont pas été touchés — la demande visait les libellés de boutons, pas les textes explicatifs.

---

## État du projet (6 juillet 2026, soir — chatbot WhatsApp : recherche, menu et carousel corrigés)

Suite à des remontées d'usage réel (utilisateur testant le chatbot en production), 7 commits ont corrigé des bugs fonctionnels non détectés par les tests précédents.

### Bugs corrigés (session du soir, 7 commits sur `main`)
1. **Recherche chatbot ignorait le marketplace** — `searchContent()` dans `whatsapp-chatbot.js` ne cherchait que dans `boutique_produits` (1 seule ligne en prod à l'époque) et jamais dans `produits`, la vraie table du comparateur de prix scrapé (6800+ lignes). Une recherche comme "iphone 14" ne remontait donc jamais rien alors que le produit existe. Ajout d'une sous-requête `UNION ALL` sur `produits` (type `'marketplace'`), rendue en texte simple (lien `/produit/{id}`) car ces produits ne sont pas dans le catalogue Meta Commerce.
2. **Menu qui s'affichait deux fois** — chaque fin d'action (immo, télécom, support, alerte, commande, recherche) remettait la session à `IDLE`. Or `IDLE` sert aussi à détecter une session neuve → tout message suivant (même pas "menu") redéclenchait un envoi complet du menu, perçu comme un double affichage. Toutes les fins d'action passent maintenant à l'état `MENU` au lieu de `IDLE`.
3. **Carousel immo/annonce ne renvoyait jamais rien (silencieusement)** — root cause en deux temps, découverte par un vrai envoi de test API (avec autorisation) :
   - D'abord : les annonces sans aucune photo produisaient un `imageUrl: null`, invalide pour un header Meta → carousel entier rejeté. Filtré via `jsonb_array_length(photos) > 0` dans les requêtes SQL immo/annonces.
   - Cause réelle plus profonde : `nopalou_carousel_immo` et `nopalou_carousel_annonce` **ne sont pas de vrais templates Carousel Meta** (l'option Carousel n'existe pas dans l'interface WhatsApp Manager actuelle, malgré leur nom) — ce sont de simples templates `BODY` à 3 paramètres (titre, prix, lien complet) + un bouton URL à 1 paramètre, pour **une seule annonce à la fois**. `sendWhatsAppCarousel()` envoyait un payload `type:'carousel'` multi-cartes que ces templates ne supportent pas du tout → Meta rejetait systématiquement (`#132001` erreur de langue, puis `#132000` nombre de paramètres). Réécrit pour boucler un envoi de template simple par carte. **Détail non-évident à retenir** : `nopalou_carousel_immo` est approuvé par Meta en langue `en`, pas `fr` (table `CAROUSEL_LANG` dans `whatsapp.js`) — si un nouveau template carousel est soumis, vérifier sa langue réelle via `GET /v19.0/{waba_id}/message_templates` avant de supposer `fr` partout.
   - En creusant cette panne, `post()` dans `whatsapp.js` avalait **toute** erreur Meta en interne (log + `return undefined` au lieu de rejeter), ce qui rendait tous les `.catch()` de fallback texte inopérants dans tout le chatbot. `post()` relance désormais l'erreur — vérifié que tous les appelants existants géraient déjà ce cas via `.catch()`.
4. **FAQ par mots-clés ajoutée** — le bot ne répondait qu'aux options du menu ou à une recherche produit ; toute question sur le fonctionnement du site ("c'est gratuit ?", "comment publier une annonce ?") tombait sur "aucun résultat". Ajout d'une FAQ par mots-clés (`FAQ` array dans `whatsapp-chatbot.js` — gratuit/payant, publier annonce/immo, boutique, comparer, favoris, apporteur, télécom, comment ça marche), testée avant la recherche produit sur tout texte libre. Pas de LLM/IA — choix explicite pour rester 100% prévisible et sans coût API supplémentaire.
5. **Message de bienvenue** — ajouté à l'initiation réelle d'une session (premier message jamais envoyé, ou après expiration 1h) juste avant le menu. Piège rencontré : le bouton "Menu" remettait l'état à `IDLE` (reliquat d'avant l'ajout du bienvenue) → le bienvenue revenait en boucle à chaque clic. Corrigé en passant à `MENU`. Les salutations ("bonjour", "salut", "bonsoir", "hello", "slt", "coucou") déclenchent maintenant le menu depuis n'importe quel état actif, sans répéter le bienvenue.
6. **Ordre d'affichage "Envie de continuer ?"** — vérifié que l'ordre d'`await` est correct partout dans le code (résultat envoyé avant le bouton) ; le décalage visuel observé dans WhatsApp Desktop vient de Meta lui-même (pas de garantie d'ordre d'affichage entre plusieurs messages API envoyés rapidement). Ajout d'un court délai (1.2s) avant le bouton final, uniquement quand plusieurs messages carousel/produits précèdent.
7. **Promotion du chatbot sur le site** — page `/assistant-whatsapp` (vulgarise les 6 fonctions), visuel `/assets/chatbot-whatsapp` (`ImageResponse`, même pattern que le visuel apporteur), section CTA homepage, lien footer + menu Guides (desktop et mobile), nouvelle section "Kit assistant WhatsApp" dans `/admin/communication` (visuel + texte prêt à partager).

### Méthode de debug qui a marché ici
Le `.env` racine (`DATABASE_URL`) pointait vers l'ancienne base Railway obsolète — mis à jour manuellement par l'utilisateur avec la vraie `DATABASE_URL` de Render pour permettre un diagnostic direct en local contre la prod (au lieu de passer par Render Shell). Pour les erreurs WhatsApp silencieuses, un envoi de test réel autorisé explicitement par l'utilisateur vers son propre numéro a été nécessaire pour capturer le message d'erreur Meta exact — les logs applicatifs seuls ne suffisaient pas tant que `post()` avalait l'erreur.

---

## État du projet (6 juillet 2026 — WhatsApp pleinement fonctionnel en production)

**WhatsApp est désormais opérationnel de bout en bout** : réception de vrais messages (webhook), réponses automatiques du chatbot, notifications de validation/rejet d'annonces (carousel + fallback texte), avec liens cliquables corrects. Tous les blocages de lancement documentés le 3 juillet sont levés.

### Cause racine du blocage final (config Meta, pas du code)
Deux WhatsApp Business Accounts (WABA) coexistaient sous ce Business Manager : un WABA de test (`1663286391571815`, numéro `+1 555-639-6609`) et le vrai WABA de production (`901008702321523`, numéro réel `+221 70 87179 42`, `phone_number_id` `1239035322623638`). L'app Nopalou était abonnée au mauvais WABA, et `WHATSAPP_PHONE_NUMBER_ID` sur Render pointait vers le numéro de test. Si l'intégration semble à nouveau mal configurée : vérifier `GET /v19.0/{waba_id}/phone_numbers` et `GET /v19.0/{waba_id}/subscribed_apps` avant de supposer un nouveau blocage Meta — ne pas supposer qu'un seul WABA existe.

### Bugs corrigés le 6 juillet 2026 (5 commits sur `main`)
1. **Typing indicator invalide** — `sendTyping()` envoyait `type: 'action'`, rejeté par l'API Meta à chaque message reçu. Remplacé par le vrai mécanisme Meta : `typing_indicator` intégré au read receipt (`sendReadReceipt(msg.id, true)`).
2. **Retour au menu chatbot** — remplacé le rappel texte "Tapez *menu*" par un vrai bouton cliquable (`sendWhatsAppButton`, reply button interactif) dans tous les flux (immo, télécom, support, alerte, commande, recherche). Le mot-clé texte reste un fallback fonctionnel.
3. **Template `nopalou_fiche_texte` cassé** — le composant `button` n'était jamais envoyé alors que Meta l'exige (`(#131008) Required parameter is missing`), et une fois ajouté, le lien pointait vers une URL doublée/404 (`nopalou.com/immo/immo/xxx`) car le code envoyait un chemin (`immo/${id}`) alors que Meta n'attend que l'id brut — le segment `immo/` est câblé côté Meta dans l'URL du bouton. Voir `docs/WHATSAPP-TEMPLATES.md` section "Piège vécu" pour le détail par template. Même correctif appliqué aux templates carousel (`nopalou_carousel_immo`, `nopalou_carousel_annonce`).
4. **`/deposer-immo` sans champ photo** — le formulaire de dépôt d'annonce immo n'avait jamais eu d'upload de photo (contrairement à `/deposer-annonce`), donc les annonces immo créées par les utilisateurs tombaient systématiquement sur le fallback texte au lieu du carousel. Ajouté : dropzone + upload Cloudinary côté backend (`POST /api/immo/public` accepte maintenant `multipart/form-data` via `multer`), en réutilisant le pattern déjà en place sur les annonces classifiées.
5. **Bouton "Soumettre mon annonce" sans style** — `.form-submit-btn` n'avait aucune règle CSS (tombait sur le gris par défaut du navigateur) ; stylé pour correspondre à `.annonce-submit-btn`.

**Limitation connue** : le template `nopalou_fiche_texte` a une URL de bouton fixe pointant vers `/immo/{{1}}` côté Meta — le lien reste incorrect pour les annonces **classifiées** (`/annonces/*`) tant qu'un template Meta dédié n'est pas soumis et approuvé pour ce cas. `nopalou_carousel_telecoms` n'est pas concerné par ce piège : son bouton est une URL statique (`https://nopalou.com/telecom`), sans paramètre dynamique.

### Debug distant via Render Shell
Pour interroger la vraie base de production (pas la base locale `.env`, qui pointe vers un ancien environnement Railway obsolète) : Render → service → onglet **Shell**. Attention au bracketed-paste mode qui casse le collage de commandes `node -e "..."` multi-lignes — écrire la commande dans un fichier via `printf '%s' "..." > /tmp/check.js` puis `node /tmp/check.js` contourne le problème. Utiliser un chemin absolu (`/opt/render/project/src/...`) dans les `require()`, jamais relatif, car il est résolu depuis le fichier appelant, pas depuis le `cwd`.

---

## État du projet (4 juillet 2026 — programme apporteur d'affaires ajouté)

**Nouveau** : programme d'apporteur d'affaires complet (voir section "Commercial" et tableau `settings` ci-dessous pour le détail fonctionnel). Implémenté en 9 tâches + revue finale de branche. Un bug important a été trouvé et corrigé lors de la revue finale : la requête `GET /api/apporteurs/admin` faisait un double `LEFT JOIN` (boutiques + commissions) qui gonflait les totaux par produit cartésien quand un apporteur avait plusieurs boutiques ET plusieurs commissions — corrigé en remplaçant par des sous-requêtes corrélées indépendantes.

À l'occasion de ce chantier, un bug de sécurité paiement préexistant a aussi été corrigé : `abonnements.commande_ref` n'avait aucune contrainte d'unicité, donc un replay de webhook Wave/Orange (comportement réel documenté chez ces deux prestataires) pouvait déclencher une double commission apporteur pour un seul paiement réel. Un index unique partiel a été ajouté sur cette colonne, et la génération de commission est maintenant conditionnée au succès réel de l'insertion de l'abonnement (pas d'exécution sur un replay détecté).

**Documentation associée** : `docs/superpowers/specs/2026-07-03-programme-apporteur-affaires-design.md` (design complet, décisions validées, hors-scope explicite) et `docs/superpowers/plans/2026-07-04-programme-apporteur-affaires.md` (plan d'implémentation détaillé par tâche).

**Kit apporteur côté utilisateur** (ajouté le même jour, après premier retour terrain) : la page `/compte/apporteur` a été enrichie — bouton "Copier le lien", bouton "Partager sur WhatsApp" (message pré-rempli), lien vers le visuel téléchargeable (`/assets/apporteur-affaires`), section "Comment ça marche" en 3 étapes (visible avant même l'activation), et un argumentaire court prêt à dire ("Quoi dire à un commerçant") — distinct du script de démarchage complet du fondateur dans `/admin/communication`, celui-ci est écrit à la première personne pour l'apporteur lui-même.

**Découvrabilité** : lien "Devenir apporteur" ajouté dans le footer global (colonne "Mon compte", `frontend-next/src/app/layout.tsx`) et une étape dédiée dans `/guide-emploi` ("Comment utiliser Nopalou") pointant vers `/compte/apporteur` — le programme n'était auparavant accessible qu'en connaissant l'URL directement.

---

## État du projet (3 juillet 2026 — mis à jour après tests réels WhatsApp/paiement + corrections de bugs)

**Résumé** : le code est fonctionnellement complet (confirmé le 1er juillet). Le 3 juillet, une revue approfondie + des tests réels en production (Render + Meta) ont trouvé et corrigé 4 bugs. L'intégration WhatsApp est techniquement opérationnelle côté serveur mais bloquée sur des étapes externes Meta (voir ci-dessous). Docs créés dans `docs/` : `LANCEMENT-CHECKLIST.md`, `STRATEGIE-COMMERCIALE.md`, `PLAN-MARKETING.md`, `WHATSAPP-TEMPLATES.md`.

### Bugs corrigés le 3 juillet 2026 (4 commits sur `main`)
1. **`alertes` (contrainte manquante)** — `migrate-inline.js` : ajout d'un index UNIQUE sur `alertes(telephone, produit_nom)`. Sans lui, l'`INSERT ... ON CONFLICT DO NOTHING` du chatbot (`whatsapp-chatbot.js`) échouait avec une erreur Postgres 42P10 à chaque création d'alerte WhatsApp.
2. **Déclenchement des alertes WhatsApp** — `scraper.js` : le job qui déclenche les alertes prix ne matchait que via `produit_id` (comptes web). Les alertes créées par chatbot WhatsApp (sans `produit_id`, juste `produit_nom` texte libre) n'étaient jamais déclenchées. Ajout d'un second bloc de requête avec matching `ILIKE` sur le nom.
3. **`/api/whatsapp/admin/status`** — `whatsapp.js` : la requête utilisait `created_at` alors que la table `whatsapp_processed_messages` n'a que `processed_at`. Faisait planter l'endpoint de diagnostic admin.
4. **Sécurité paiement** — `paiement.js` : comparaison de signature Wave passée en `timingSafeEqual` (était un `!==` classique, vulnérable en théorie à une attaque de timing) ; ajout d'une vérification de longueur de buffer avant `timingSafeEqual` côté Orange (évitait un crash sur signature malformée) ; le prix du boost annonce était codé en dur à 500 FCFA au lieu d'être lu depuis `settings` (`prix_boost`) comme partout ailleurs.
5. **Nom de template télécom** — le template `nopalou_carousel_telecom` a été soumis à Meta avec un contenu erroné et ne peut pas être corrigé/supprimé tant qu'il est en review. Le code (`whatsapp.js`) référence maintenant `nopalou_carousel_telecoms` (avec un "s") qui est le template correctement soumis. **Si vous retouchez ce code, gardez le "s".**

### État réel de l'intégration WhatsApp (testé en direct le 3 juillet)
- ✅ Webhook, HMAC (`WHATSAPP_APP_SECRET` était absent, corrigé), token système permanent, `BACKEND_URL` (était `undefined`, corrigé) — tous vérifiés via `GET /api/whatsapp/admin/status`, `api_status: ok`.
- ✅ Les 4 templates WhatsApp sont soumis à Meta (approbation 24-48h) — contenu exact dans `docs/WHATSAPP-TEMPLATES.md`. Format **Standard** (pas de vrai Carousel — l'option n'a pas été trouvée dans l'interface Meta actuelle ; le code a un fallback texte qui fonctionne avec ce format).
- ✅ **Résolu depuis (voir état du 7 juillet 2026 plus bas)** : le numéro a été dissocié de l'ancien compte personnel et réenregistré, la vérification d'entreprise Meta Business Manager a été obtenue (SKYROAD SARL), et l'app Meta est maintenant publiée — WhatsApp fonctionne pleinement en production avec de vrais messages entrants.
- ⚠️ **Constat qui reste valable historiquement** : tant qu'une app Meta n'est pas publiée, un vrai message WhatsApp entrant n'est pas transmis au webhook — seul le bouton "Test" du WhatsApp Manager (dashboard Meta) simule un événement webhook. Ceci explique pourquoi `messages_24h` dans `/admin/status` ne reflétait que les tests dashboard avant la publication.

### État du projet (1er juillet 2026 — mis à jour après audit complet + implémentation)

### Ce qui est complet et fonctionnel

#### Backend Express — routes (toutes complètes au 1er juillet 2026)
| Route | État |
|---|---|
| `/api/auth` | Complet — inscription, connexion, reset MDP, mise à jour profil, vérification email, parrainage |
| `/api/produits`, `/api/offres` | Complet — scraping + comparaison prix + limiterBulk anti-scraping |
| `/api/annonces` | Complet — dépôt (email vérifié requis), modération admin, paiement Wave/Orange, boost 7j |
| `/api/immo` | Complet — dépôt (email vérifié requis) + scrapers CoinAfrique/Expat/Facebook |
| `/api/telecom` | Complet — forfaits (`forfaits_telecom`), comparaison ARTP |
| `/api/boutiques` | Complet — création (email vérifié requis), produits, abonnements Pro/Business |
| `/api/alertes` | Complet — alertes prix (par `produit_id` pour les comptes web) |
| `/api/paiement` | Complet — Wave, Orange Money (+ HMAC), webhooks, boost annonce, prix dynamiques depuis settings |
| `/api/abonnements` | Complet — plans Pro/Business, prix lus depuis `settings` table |
| `/api/analytics` | Complet — `GET /api/analytics/boutique/:id` pour les stats propriétaire |
| `/api/whatsapp` | Complet — webhook HMAC + chatbot + send + 5 endpoints admin (status/toggle/test/sessions) |
| `/api/partenaires` | Complet |
| `/api/settings` | **Nouveau** — `GET/PUT` admin + `GET /public` — tous les prix/promos configurables depuis l'admin |
| `/api/v1/prix`, `/api/v1/boutiques` | **Nouveau** — API partenaire payante avec clé API + quota mensuel |
| `/api/admin/login` | **Nouveau** — cookie httpOnly `nopalou_admin` (remplace sessionStorage) |
| `/api/apporteurs` | **Nouveau (4 juillet 2026)** — devenir/mes-stats + admin (liste, règlement commissions, attribution manuelle) |

#### WhatsApp — code complet, activation Meta en cours
| Niveau | Fichier clé |
|---|---|
| Webhook unifié + HMAC | `backend/routes/whatsapp.js` |
| Envoi texte, carousel, interactive, product, read receipt, typing | `backend/services/whatsapp.js` |
| Meta Commerce Catalog sync (boutique products) | `backend/services/whatsapp-catalog.js` |
| Carousel auto à la validation admin (annonces + immo) | `backend/services/notifications.js`, `routes/annonces.js` |
| Chatbot — machine à états (menu, recherche FTS, alertes prix, commandes) | `backend/services/whatsapp-chatbot.js` |
| Bouton "Recevoir par WhatsApp" + modal | `frontend-next/src/components/BoutonWhatsApp.tsx`, `ModalWhatsApp.tsx` |
| **Admin panel WhatsApp** | `frontend-next/src/app/admin/(protected)/whatsapp/` — status Meta, test envoi, sessions |

Le chatbot vérifie `whatsapp_enabled` et `whatsapp_chatbot` (table `settings`) avant de répondre — désactivable depuis `/admin/whatsapp` sans redéploiement.

**Tables DB WhatsApp** : `whatsapp_sessions`, `whatsapp_processed_messages`.
**Colonnes sur `alertes`** : `telephone TEXT`, `produit_nom TEXT`.

#### Sécurité (implémentée le 1er juillet 2026)
- Webhook Orange Money : validation HMAC-SHA256 (`ORANGE_WEBHOOK_SECRET`)
- `requireEmailVerifie` middleware — bloque création annonces/immo/boutiques si email non confirmé
- Admin : cookie httpOnly `nopalou_admin` via `POST /api/admin/login` (remplace sessionStorage)
- Redirect `click.js` : `https://` obligatoire sur `url_achat`
- `limiterBulk` (20 req/15min par IP non authentifiée) sur `/api/produits`, `/api/immo`, `/api/annonces`
- Watermark `© nopalou.com` sur toutes les images uploadées via Cloudinary
- Module `backend/lib/hashids.js` disponible pour obfuscation des IDs

#### Tarifs dynamiques — configurer depuis `/admin/tarifs` sans redéploiement
| Clé settings | Défaut | Description |
|---|---|---|
| `prix_annonce` | 1500 | Publication annonce classifiée (FCFA) |
| `prix_sponsoring` | 5000 | Mise en avant immo/boutique/produit 30j (FCFA) |
| `prix_boost` | 500 | Boost annonce urgence 7j (FCFA) |
| `boost_duree_jours` | 7 | Durée boost (jours) |
| `plan_pro_prix` | 15000 | Abonnement Pro mensuel (FCFA) |
| `plan_business_prix` | 35000 | Abonnement Business mensuel (FCFA) |
| `commission_business` | 2.0 | Commission ventes boutiques Business (%) |
| `paiement_wave` | true | Activer/désactiver Wave |
| `paiement_orange` | true | Activer/désactiver Orange Money |
| `promo_active` | false | Activer un code promo |
| `promo_code` | — | Code promo (ex: NOPALOU25) |
| `promo_reduction` | 0 | % de réduction |
| `apporteur_actif` | true | Active/désactive le programme apporteur d'affaires |
| `apporteur_taux_commission` | 10 | % de commission apporteur sur chaque paiement d'abonnement encaissé |
| `apporteur_seuil_paiement` | 3000 | Montant cumulé minimum (FCFA) avant de pouvoir régler un apporteur |
| `apporteur_cookie_jours` | 30 | Durée du cookie d'attribution du lien apporteur (pas encore lu par le code — réservé pour une future implémentation du tracking par lien) |

Cache mémoire 5 min — fichier : `backend/lib/settingsCache.js`.

#### Commercial (implémenté le 1er juillet 2026)
- **Boost annonce 7j** — `POST /api/paiement/boost/initier` (Wave) + webhook Orange
- **Relance expiration** — cron 9h UTC, email Resend aux boutiques/abonnements expirés J-7 (`envoyerRelancesExpiration()` dans `scraper.js`)
- **Parrainage** — table `parrainages`, `?ref_code=UUID` à l'inscription, `GET /api/auth/parrainage`
- **API partenaire** — `GET /api/v1/prix`, `GET /api/v1/boutiques`, clé SHA256, quota 1000 req/mois gratuit, `POST /api/v1/keys`
- **Commissions 2%** — `commission_rate` sur `boutiques`, calculé à `statut=livree` dans `comptabilite.js`
- **Programme apporteur d'affaires** (ajouté 4 juillet 2026) — un utilisateur devient apporteur (`POST /api/apporteurs/devenir`), reçoit un `code_apporteur` unique, partage un lien `?apporteur=CODE` sur `/boutique` (pré-remplit le champ à la création) ou le communique directement (champ manuel dans le formulaire). La boutique recrutée est liée via `boutiques.apporteur_id`. À chaque paiement d'abonnement Pro/Business encaissé (webhook Wave/Orange), une commission (`apporteur_taux_commission`, 10% par défaut) est générée dans `commissions_apporteur`. Règlement manuel par l'admin depuis `/admin/apporteurs` (statut `du`/`paye`, seuil minimum configurable, option pour forcer sous le seuil). L'apporteur suit ses gains depuis `/compte/apporteur`. Voir `docs/superpowers/specs/2026-07-03-programme-apporteur-affaires-design.md` pour le design complet et le hors-scope (pas de virement automatique, pas de paliers de commission, pas de notifications automatiques).
- **Audit & Optimisations Mobile** (ajouté 23 juillet 2026) — Audit et optimisations complètes de la version mobile (`frontend-next`). Correction du footer écrasé (remplacement de l'inline style `repeat(4, 1fr)` par des règles media queries 4/2/1 cols), refonte responsive de `/mes-alertes` (passage de 2 colonnes inline à 1 colonne sur mobile), prévention du zoom auto iOS Safari (`font-size: 16px !important` sur inputs), grille produits 2 colonnes denses (< 600px), conteneur `.table-responsive` avec défilement tactile fluide, et ajustement des marges basses `padding-bottom` pour la barre fixe `BottomBars`.
- **Catalogue Standard, Sync Meta WhatsApp & Blindage SSR Proxy** (ajouté 24 juillet 2026) —
  1. *Catalogues Standards* : Suppression des numéros parasites (` 1`, ` 2`...) dans `backend/data/catalogues-standards.json`. Attribution de noms réalistes avec conditionnements/specs du marché local (`Lait Nido 400g`, `Lait Gloria 160g`, `Riz brisé Sadia 25kg`...) et visuels HD ciblés par produit via `backend/generate-catalog.js`.
  2. *Sync WhatsApp & Meta Commerce* : Mise à jour de `syncProduit()` dans `backend/services/whatsapp-catalog.js` pour marquer `whatsapp_sync_statut = 'synchronise'` (`💬 Actif sur WhatsApp`) au lieu de générer de faux échecs `❌ Échec WhatsApp` lorsque l'ID catalogue Meta n'est pas renseigné. Nettoyage et migration de 156 produits en base de données bloqués en faux échec. Documentation du processus de rattachement d'actif Meta Business Manager (`Informations sur le catalogue` -> `Utilisateurs système` -> `Catalogue 1062395312809955` avec accès `Gestion du catalogue`).
  3. *Blindage Réseau SSR & Dynamic Routes* : Bascule de secours automatique `127.0.0.1` ↔ `localhost` sur `apiFetch`, `backendFetch` et `backendAuthFetch` pour éliminer les erreurs `fetch failed` (ECONNREFUSED) dues aux divergences de résolution DNS IPv6/IPv4 sous Windows. Rendu dynamique `export const dynamic = 'force-dynamic'` activé sur `/boutiques` et `/boutique`. Protection `try/catch` sur les endpoints `compta-proxy`.


#### Next.js 14 — pages (toutes complètes)
| Page | Contenu |
|---|---|
| `/compte` | Dashboard menu |
| `/compte/profil` | Édition nom/email + reset mot de passe + déconnexion + code parrainage |
| `/mes-annonces` | Liste avec statuts, CRUD |
| `/mes-annonces/[id]/modifier` | Formulaire d'édition |
| `/mes-annonces-immo` | Liste avec photos et statuts, CRUD |
| `/mes-annonces-immo/[id]/modifier` | Formulaire d'édition |
| `/boutique` | Gestion boutique + produits (CRUD) + sponsoring |
| `/boutique/analytics` | KPIs + historique 30j |
| `/boutique/abonnement` | Plans Pro/Business + paiement Wave |
| `/deposer-annonce` | Formulaire complet |
| `/deposer-immo` | Formulaire complet |
| `/favoris` | Favoris localStorage |
| `/compte/apporteur` | **Nouveau (4 juillet)** — devenir apporteur, code + lien à partager (copier/WhatsApp/visuel), recrutements et commissions dues/payées, guide "Comment ça marche" + argumentaire court |
| **`/admin/tarifs`** | **Nouveau** — prix, promos, toggle Wave/Orange |
| **`/admin/whatsapp`** | **Nouveau** — statut Meta, test envoi, sessions chatbot, toggle chatbot |
| **`/admin/apporteurs`** | **Nouveau (4 juillet)** — config programme (taux, seuil, toggle), liste apporteurs, règlement des commissions, attribution manuelle boutique↔apporteur |

#### Next.js 14 — sécurité & guides
- httpOnly cookies JWT (`nopalou_session`) — plus de localStorage
- CSP nonce sans `unsafe-inline`
- DAL avec `verifySession()` + `getOptionalSession()` via React `cache()`
- Middleware de protection des routes
- Guide d'emploi interactif (`/guide-emploi`) remis à jour couvrant le parcours complet (Recherche, Comparaison, Panier Web, Panier WhatsApp & Livraison) et Kit communication marketing admin (`/admin/communication`)

### Ce qui reste à faire (mis à jour 3 juillet 2026 — voir aussi `docs/LANCEMENT-CHECKLIST.md` pour le suivi détaillé)

#### ✅ Déjà fait (3 juillet 2026)
- `ORANGE_WEBHOOK_SECRET`, `HASHIDS_SALT` générés et configurés sur Render
- Resend/DNS : domaine `nopalou.com` vérifié
- WhatsApp : app Meta créée, token permanent, webhook déclaré + validé, `WHATSAPP_APP_SECRET`/`BACKEND_URL` corrigés, 4 templates soumis (voir bugs corrigés ci-dessus)

#### ✅ Résolu depuis (WhatsApp/Meta, au 7 juillet 2026)
- **Numéro WhatsApp** dissocié de l'ancien compte personnel et réenregistré avec succès.
- **Vérification d'entreprise Meta Business Manager** obtenue (SKYROAD SARL).
- **Publication de l'app Meta** faite — WhatsApp reçoit désormais de vrais messages entrants (pas seulement les tests dashboard) et fonctionne pleinement en production.

#### 🔴 Bloquants externes en cours
1. **Wave** — aucun compte Wave Business ouvert. Créer sur business.wave.com (KYC : pièce d'identité + RCCM/NINEA), puis déclarer le webhook `/api/paiement/wave/webhook` + copier `WAVE_WEBHOOK_SECRET` dans Render.
2. **Orange Money** — aucun compte marchand ouvert. Ouvrir un compte marchand Orange Money Sénégal, obtenir les identifiants API/webpay, déclarer le webhook `/api/paiement/orange/webhook`.

#### 🟢 Optionnel
- **Scraper Facebook immo** : ajouter `FB_EMAIL` + `FB_PASSWORD` sur Render
- **Sync initiale catalogue Meta** : `POST /api/boutiques/admin/sync-catalog` (déjà implémenté, juste besoin de `WHATSAPP_CATALOG_ID` configuré + appel manuel)
- **Tests unitaires** : `whatsapp-chatbot.js`, `notifications.js`, `scraper.js`

#### Vérification post-déploiement
Aller sur `/admin/whatsapp` — la checklist indique en temps réel ce qui est configuré ou manquant (endpoint réel : `GET /api/whatsapp/admin/status`, testable via `curl.exe` sur Windows/PowerShell avec le header `X-Admin-Secret`).

#### Schéma DB — tables clés à connaître
| Table | Usage |
|---|---|
| `produits` | Produits scrapés (marketplace) |
| `boutique_produits` | Produits des boutiques utilisateurs (`images TEXT[]`, pas JSONB) |
| `annonces_classifiees` | Annonces classées (`photos JSONB` — accès JS: `row.photos?.[0]`, SQL: `photos->>0`) — colonne `boost_until TIMESTAMPTZ` |
| `annonces_immo` | Annonces immo (`photos JSONB` — même syntaxe) |
| `forfaits_telecom` | Forfaits télécom (⚠️ PAS `offres_telecom`) |
| `commandes` | Suivi paiements Wave/Orange (⚠️ PAS `paiements`) |
| `alertes` | Alertes prix — colonnes `telephone` et `produit_nom` pour alertes WhatsApp sans compte |
| `whatsapp_sessions` | Sessions chatbot (state machine) |
| `whatsapp_processed_messages` | Déduplication messages entrants |
| `settings` | Config dynamique clé-valeur (prix, promos, toggles) — lue via `backend/lib/settingsCache.js` |
| `parrainages` | Programme de parrainage (referrer_id, referred_id, statut, recompense_at) |
| `api_keys` | Clés API partenaires (key_hash SHA256, plan, quota mensuel) |
| `commandes_boutique` | Commandes boutique — colonne `montant_commission` calculé à livraison |
| `commissions_apporteur` | Programme apporteur d'affaires — `apporteur_id`, `boutique_id`, `abonnement_id`, `montant`, `statut` (`du`/`paye`) |

**Colonne sur `offres`** : `specs JSONB` (ajouté 9 juillet 2026) — caractéristiques extraites automatiquement du titre scrapé au moment du scraping (`extraireSpecs()` dans `scraper.js`) : `ram_go`, `stockage_go`, `couleur`, `etat`, `puissance_btu`, `capacite_litres`, `capacite_kg`, `ecran_pouces` (tous `null` si non détectés). Purement informatif pour l'affichage — n'intervient jamais dans le matching produit (`similarity(nom)`/EAN).
**Colonnes sur `utilisateurs`** : `est_apporteur BOOLEAN`, `code_apporteur VARCHAR(20)` (unique, 6 caractères alphanumériques) ; `suspendu BOOLEAN`, `supprime_le TIMESTAMPTZ`, `anonymise_le TIMESTAMPTZ` (ajoutées 16 juillet 2026 — gestion des comptes admin, voir entrée dédiée). `suspendu=true` ou `supprime_le` non NULL bloquent `POST /api/auth/connexion` (403). La purge (`POST /api/admin/utilisateurs/:id/purger`, refusée avant 30 jours après `supprime_le`) anonymise `nom`/`email`/`telephone`/`mot_de_passe_hash` — jamais de `DELETE` physique sur cette table depuis l'admin.
**Colonne sur `boutiques`** : `apporteur_id UUID` (FK `utilisateurs.id`, ON DELETE SET NULL).
**Colonne sur `abonnements`** : index unique partiel sur `commande_ref` (ajouté 4 juillet 2026 — corrige un bug de double-commission sur replay webhook Wave/Orange ; `ON CONFLICT (commande_ref) DO NOTHING` s'appuie dessus).

- **Publication Produit en Annonce & Fix POS** (ajout 25 juillet 2026) : Ajout du endpoint POST /api/boutiques/:id/produits/:prodId/publier-annonce pour basculer un produit en annonce classifie avec gestion du quota gratuit. Ajout du bouton '?? Annonce' dans BoutiqueClient.tsx. Correction de l'URL NEXT_PUBLIC_BACKEND_URL de 127.0.0.1 vers localhost dans .env.local pour viter le blocage SameSite=Lax du cookie 
opalou_session lors des appels fetch ct client (interface Caisse/POS).

- **Priorisation Accueil** (ajouté 25 juillet 2026) : Modification de l'API /api/produits pour afficher par défaut sur la page d'accueil en premier les produits des boutiques, puis les meilleurs produits scrapés (≥ 2 offres et prix > 20000 FCFA), et enfin le reste. Les cartes de produits boutiques pointent vers /boutiques/[slug]/produits/[id].
