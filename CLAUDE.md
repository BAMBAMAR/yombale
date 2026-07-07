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
- `render.yaml` defines a single "yombale-backend" web service on Render (Node 18). `SCRAPING_DISABLED=true` is set by default on Render to avoid scraping on the free tier.
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
|---|---|
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

Generate secrets: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## Admin Pages

The HTML admin pages (`/admin.html`, `/admin-immo.html`, `/admin-telecom.html`, `/admin-partenaires.html`, `/admin-annonces.html`) in `frontend/` are protected by `adminPageGuard` middleware in `app.js`. They require the `X-Admin-Secret` header matching `ADMIN_SECRET`. API admin routes use `adminSecretOnly` middleware.

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

#### Next.js 14 — sécurité
- httpOnly cookies JWT (`nopalou_session`) — plus de localStorage
- CSP nonce sans `unsafe-inline`
- DAL avec `verifySession()` + `getOptionalSession()` via React `cache()`
- Middleware de protection des routes

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

**Colonnes sur `utilisateurs`** : `est_apporteur BOOLEAN`, `code_apporteur VARCHAR(20)` (unique, 6 caractères alphanumériques).
**Colonne sur `boutiques`** : `apporteur_id UUID` (FK `utilisateurs.id`, ON DELETE SET NULL).
**Colonne sur `abonnements`** : index unique partiel sur `commande_ref` (ajouté 4 juillet 2026 — corrige un bug de double-commission sur replay webhook Wave/Orange ; `ON CONFLICT (commande_ref) DO NOTHING` s'appuie dessus).
