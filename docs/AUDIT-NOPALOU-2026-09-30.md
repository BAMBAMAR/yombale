# Audit NOPALOU — 30 septembre 2026

Méthode : environnement isolé (PostgreSQL 16 local port 54329, backend :4100, frontend :3001, intégrations externes bloquées). Aucune écriture en production. Aucun code modifié.
Convention : PROUVÉ = reproduit par exécution ; CODE = démontré par lecture de code croisée avec un comportement observé ; NON DÉTERMINÉ = investigation supplémentaire nécessaire.

## Couverture

| Domaine | Statut |
|---|---|
| Énumération routes (1 292) + sondage non authentifié (1 253) | Fait |
| Balayage IDOR marchand A → boutique B (459 routes) | Fait (372×403 ; 87 à affiner, voir AUD-IDOR-RESTE) |
| Authentification (révocation, forge, alg=none, scope admin) | Fait |
| Balayage authentifié admin (89 GET) et utilisateur (154 GET) | Fait |
| Commandes express / paiement / webhooks | Fait |
| Schéma prod (dump 24/09) vs migrations | Fait |
| Tests unitaires backend / frontend | Fait |
| SEO, en-têtes de sécurité, CORS | Fait (frontend en mode dev) |
| Parcours UI Playwright (e2e) | NON FAIT |
| Chatbot / WhatsApp / WhatBot (flux conversationnels) | NON FAIT |
| Immobilier / agences : parcours d'écriture | NON FAIT (lecture et contrôle d'accès seulement) |
| Performance mesurée, mobile, accessibilité, PWA hors-ligne | NON FAIT |
| Matrice RBAC des sous-rôles admin | NON FAIT |

---

## Fiches

### AUD-010 — CRITIQUE — Stock vidable par un visiteur anonyme
- Fonctionnalité : commande express (`POST /api/boutiques/commandes/express`).
- Constat : la commande est enregistrée et le stock décrémenté avant l'appel Wave. Si Wave échoue, l'utilisateur reçoit 400 mais la commande reste `en_attente` et le stock n'est pas restitué.
- Preuve (PROUVÉ) : produit de test stock 10 → 0 ; 4 commandes `wave` `en_attente` en base après 4 réponses 400 (`CMD-20260930-C996D9`, `8334D8`, `3AC887`, `76482B`, `7D69E9`).
- Cause (CODE) : `boutiques-commandes.js` COMMIT ligne 265, appel Wave et message d'erreur ligne 391, aucune compensation. Aucun mécanisme d'expiration/restitution trouvé dans `backend/services` (seul le statut `annulee` existe).
- Impact : mise hors vente de tout un catalogue sans payer.
- Non déterminé : existence d'un nettoyage des commandes impayées en production.
- Correction : enregistrer la commande (ou décrémenter le stock) seulement après création de la session Wave ; sinon ROLLBACK/restitution. Ajouter une expiration des `en_attente` impayées.
- Priorité : P0. Fichiers : `backend/routes/boutiques-modules/boutiques-commandes.js`. Tables : `commandes_boutique`, `boutique_produits`.
- Validation : Wave simulé en échec → stock inchangé, aucune commande orpheline. Régression : commande cash, commande Wave réussie, webhook Wave.
- Scénario : commande `wave` quantité 2 avec Wave injoignable. Attendu : 4xx, stock = initial. Obtenu : 400, stock −2, commande créée.

### AUD-011 — MAJEUR — Prix fixé par le client (article libre)
- Constat : article sans `produit_id` accepté avec le prix du client.
- Preuve (PROUVÉ) : commande `CMD-20260930-7520BC`, `montant_total = 1` FCFA. Articles liés à un produit : re-tarifés côté serveur (OK).
- Impact : commande à montant arbitraire ; avec Wave le webhook valide le montant attendu (1 F).
- Correction : refuser tout article sans `produit_id` appartenant à la boutique. Fichier : `boutiques-commandes.js` (boucle articles, ~l.140). Validation : article libre → 400 ; panier normal → 201.

### AUD-012 — MAJEUR — `composants` et `tarifs-quantite` inutilisables
- Preuve (PROUVÉ) : propriétaire sur sa boutique → 500 ; autre marchand → 500 ; aucune écriture.
- Cause (CODE) : `boutiques-produits.js:768` et `:814` appellent `checkBoutiqueAccess(req.user.id, id)` : arguments inversés, `req.user.id` inexistant (le jeton porte `userId`), résultat traité comme `{allowed}` alors que la fonction (`middlewares/tenantSecurity.js`) renvoie la boutique ou `null`. Le `catch` ne logue rien.
- Impact : fonctionnalité packs / tarifs B2B cassée ; fail-closed par accident.
- Correction : aligner sur l'usage des lignes 115/247 ; loguer dans le `catch`. Validation : propriétaire 200 + relecture GET ; autre marchand 403.

### AUD-013 — MOYEN — Webhooks : signature non exigée hors production ; montant Stripe non contrôlé
- Preuve (PROUVÉ, NODE_ENV=development) : événement Stripe non signé annonçant 1 centime → commande de 10 000 F `payee`, `paiement_recu = true` (`CMD-20260930-445D23`).
- Cause (CODE) : `paiement.js:627` n'applique le refus que si `NODE_ENV === 'production'` ; Orange : `paiement.js:931-945` accepte sans secret hors production ; Stripe ne compare jamais `amount_total` au montant de la commande (Wave le fait, l.475).
- Impact prod : dépend de `NODE_ENV` sur Render (NON DÉTERMINÉ). `.env` local : NODE_ENV=production et aucune variable STRIPE.
- Correction : refuser toujours sans signature valide ; comparer le montant. Validation : requête non signée → 401 partout ; événement signé avec mauvais montant → non validé.

### AUD-014 — MOYEN — Informations internes publiques
- Preuve : sans authentification, 200 sur `/api/scraper/status`, `/api/scraper/facebook/progress`, `/api/scraper/sites`, `/api/paiement/server-ip`, `/api/whatsapp/health`. Réponses 500 des webhooks renvoient `err.message` (`details`).
- Correction : `requireAdminAuth` sur ces routes ; retirer `details`. Validation : 401 anonyme, 200 admin.

### AUD-015 — MOYEN — Alias de routes
- `app.js:315-317` monte le routeur boutiques sous `/api/promotions`, `/api/devises`, `/api/paiements`. Preuve : `/api/paiements/:id/produits` → 200. Conséquence : le limiteur strict `/api/paiement/` ne couvre pas `/api/paiements/`.
- Correction : retirer les alias après recherche des usages (frontend, WhatsApp, API partenaire).

### AUD-016 — MOYEN — Limiteur global contournable
- `app.js:~150-158` : `skip` sur `req.path.includes('/webhook' | '/analytics' | '/health' | '/scanner-remote')`. `POST /api/analytics/event` n'a donc aucune limite (charge utile valide : NON DÉTERMINÉ).

### AUD-017 — MINEUR — 500 sans journal
- Sur base vide, 22 routes renvoient 500 sans ligne de log (catch muets). Causes démontrées uniquement pour celles des fiches AUD-012, AUD-018, AUD-019 et `paiement-sequestre/.../statut` (`uuid = text`).

### AUD-018 — MAJEUR — Détail de commande admin en erreur en production
- Constat : `GET /api/admin/commandes/:id` → 500 « la colonne b.email n'existe pas ».
- Preuve : code `admin-commandes.js:88` (`b.email` sur `boutiques b`) ; le dump de production du 24/09 liste toutes les colonnes de `boutiques` : aucune colonne `email`. Erreur reproduite sur la base d'audit.
- Impact : l'inspection de commande admin (et le bouton de reversement qu'elle porte) ne charge pas.
- Correction : utiliser `COALESCE(b.whatsapp, u.email)` via jointure `utilisateurs`, ou retirer le champ. Validation : 200 avec les lignes de la commande.
- Limite : le dump date de 6 jours ; une colonne ajoutée depuis est improbable (aucune migration ne l'ajoute).

### AUD-019 — MAJEUR — Écrans admin POS en erreur
- Constat : `GET /api/admin/pos/stats` et `/sessions` → 500.
- Preuve : `admin-pos.js:40-41, 113` utilise `ecart`, `ouvert_le` et le statut `fermee` ; la table `boutique_pos_sessions` (migration et dump de production) contient `ecart_caisse`, `date_ouverture`, `date_cloture`. `boutiques-pos.js` utilise les bons noms.
- Correction : aligner `admin-pos.js` sur les colonnes réelles et sur les statuts réellement écrits par `boutiques-pos.js` (à vérifier : valeurs de `statut`). Validation : les deux routes renvoient 200 avec des sessions de test.

### AUD-001 / AUD-002 — MAJEUR — Migrations non reproductibles, schéma de production divergent
- AUD-001 : sur base vide, `migrate-inline.js` échoue (relations absentes), affiche « MIGRATE OK » ; il faut `migrate.js` puis 3-4 passes. Le démarrage de l'API lance les migrations et avale les erreurs (`app.js`, `[MIGRATE] Avertissement`).
- AUD-002 (PROUVÉ par comparaison dump/migrations, 78 tables avec données) : présents en production mais absents des migrations : table `notifications_immo` ; colonnes `annonces_immo.motif_rejet`, `annonces_immo.visite_virtuelle`, `boutique_produits.notes`, `boutiques.plan_actif`, `feature_flags.created_at`, `ventes.prix_achat`. Conséquence observée sur base reconstruite : 500 sur `/api/comptabilite/:id/dashboard` (`v.prix_achat`), `/api/prospection/leads` et `/crons/status` (`sous_profil`), `/campagnes` (`nb_reponses`) — alors que ces colonnes existent en production.
- Impact : la reprise après sinistre par migrations donne une plateforme partiellement cassée ; `npm run test:pra` restaure un dump, il ne couvre pas ce cas.
- Correction : générer un schéma de référence depuis la production (pg_dump --schema-only), ajouter les migrations manquantes, faire échouer `migrate` sur erreur. Validation : base vide + migrations = 0 différence de schéma avec la production.

### AUD-020 — MAJEUR — Suite de tests backend rouge, contrairement à la documentation
- Preuve (PROUVÉ, NODE_ENV=test, sans base) : 13 suites en échec sur 49, 41 tests en échec sur 389 (348 réussis). CLAUDE.md annonce « 383 passed, 48 suites, 0 régression ».
- Suites en échec : relance-catalogue, spec-master-exhaustive, spec-03-promotions, spec-01-mode-switch, spec-04-pixels, club-vip-and-ab-testing, spec-06-multi-devises-stripe, spec-05-webhooks-api-keys, comptabilite, support-service, immo-favoris-and-resolver, admin-alerts-and-health, analytics-filters.
- Cause (CODE, démontrée pour spec-01) : `pool.query` est mocké avec une séquence ordonnée ; `verifierToken` exécute désormais une requête supplémentaire (`jwt_version`, `auth.js`), ce qui décale toutes les réponses mockées (404 au lieu de 200). Autres suites : cause NON DÉTERMINÉE individuellement.
- Autre constat : avec `DATABASE_URL` défini, `pos-pin-security.test.js` ouvre une vraie connexion et Jest plante (`net.isIP` après teardown) sans résumé.
- Correction : mettre à jour les mocks (helper commun pour la requête d'authentification), isoler la connexion de `pos-pin-security`. Validation : `npm run test:unit` vert, exécuté en CI.
- Frontend : `npm test` 69/69 OK. `tsc --noEmit` OK.

### AUD-021 — MOYEN — Jeton de session accepté en query string
- Preuve : `GET /api/auth/profil?token=<jeton>` → 200. `app.js` (format production de morgan) journalise `:url` complète, donc les jetons atterrissent dans les logs.
- Correction : limiter à un jeton d'usage unique et court pour les PDF, ou supprimer. Validation : 401 avec `?token=` sur les routes ordinaires.

### AUD-022 — MINEUR — Énumération de comptes à l'inscription
- Preuve : inscription avec e-mail existant → 409 « Email déjà utilisé » ; connexion avec e-mail inconnu ou mauvais mot de passe → message identique (bon).
- Atténuation : `authLimiter` 20 req / 15 min.

### AUD-023 — MINEUR — Défense en profondeur de `verifierToken`
- En cas d'erreur DB dans la vérification de version, la requête passe (`auth.js`, `catch` → `next`). Un jeton signé sans `jwtVersion` n'est jamais révoqué (prouvé avec le secret d'audit : utile seulement si `JWT_SECRET` fuit). Tous les jetons légitimes émis par le code portent `jwtVersion`.
- Vérifié OK : révocation à la déconnexion (ancien jeton → 401), `alg=none` → 401, mauvais secret → 401, jeton utilisateur sur routes admin → 401/404.

### AUD-024 — MOYEN/MINEUR — SEO et en-têtes (frontend en mode dev)
- Produit inexistant : HTTP 200 + `noindex` au lieu de 404 (soft 404).
- Titres doublonnés : « … | Nopalou | Nopalou » sur `/immo`, `/annonces` ; « … — Nopalou | N… » sur `/boutiques`.
- CSP frontend : `script-src 'unsafe-inline' 'unsafe-eval'`. `X-Frame-Options` : DENY (frontend) vs SAMEORIGIN (backend).
- HSTS absent en dev (à vérifier sur le domaine déployé : NON DÉTERMINÉ).
- Vérifié OK : canonical, description, JSON-LD présents ; robots.txt et sitemap.xml servis ; `/compte` et `/boutique/caisse` redirigent vers `/connexion` ; pas de fuite de données sur les pages `/admin/*` sans session ; CORS n'autorise pas les origines étrangères.

### AUD-003 — MOYEN — Repli du frontend vers la production
- `frontend-next/src/lib/api.ts:8` ajoute `https://yombale.onrender.com` aux URL de secours.

### AUD-004 — MOYEN — TLS base de données non vérifié
- `backend/models/db.js:10` : `rejectUnauthorized: false` dès que `DATABASE_URL` est défini. Impact réel selon le réseau Render : NON DÉTERMINÉ.

### AUD-005 — MOYEN — Crons métier lancés avec l'API
- `app.js:~486-500` : en mode `web`, `demarrerCronsMetier()` et cinq crons de relance démarrent ; en cas de scale-out, exécution multiple possible (NON DÉTERMINÉ : instances Render).

### AUD-006 — MOYEN — Garde-fou qualité non bloquant
- `npm run lint:slop` : 886 émojis d'interface, 94 `catch` silencieux, 2 fichiers > 800 lignes ; le script termine toujours en succès. CLAUDE.md annonce « 0 violation ».

### AUD-007 — MINEUR — Fixtures de test obsolètes
- `database/test-fixtures.sql` incompatible avec le schéma (colonne `role` absente, identifiants non UUID, `boutique_produits.actif` absent).

### AUD-IDOR-RESTE — À affiner
- Sur 459 routes à identifiant de boutique : 372×403, 51×404, 14×400, 8×500 (dont AUD-012), 12 ignorées, 2×200 (`DELETE /api/alertes/:id`, `DELETE /api/favoris/:type/:id` avec identifiant inexistant).
- Les 14×400 (`/mode`, `/admins`, `/comptabilite/:id/{commandes,depenses,stock,ventes,zones}`) ont été rejetés par la validation avant tout contrôle d'accès avec un corps vide : le contrôle d'accès n'est pas prouvé par ce test. `PUT /:id/mode` contient un contrôle (`boutiques-crud.js:1204-1210`). Pour `comptabilite` : NON DÉTERMINÉ — rejouer avec des charges valides.
- `alertes/:id` et `favoris/:type/:id` : filtrage par utilisateur NON DÉTERMINÉ (relire le SQL).


---

# Phase 3 — compléments (mêmes conventions : PROUVÉ / CODE / NON DÉTERMINÉ)

## Couverture ajoutée
| Domaine | Résultat |
|---|---|
| E2E Playwright desktop (chromium) | 105 réussis, 4 échecs, 10 ignorés (7,9 min) |
| E2E Playwright mobile 360 (sous-ensemble : débordement, pages publiques, auth, chatbot web, parcours critiques) | 61 réussis, 2 échecs, 3 ignorés. **Audit de débordement horizontal à 360 px : tous les tests passent.** |
| Chatbot WhatsApp (moteur exécuté en processus, envois interceptés) | 18 scénarios + déduplication + injection SQL |
| Chat web | 6 scénarios |
| Agences immobilières : création, membres, rôles | testés |
| RBAC administrateurs (4 rôles × 150 routes) | testé |
| SSRF, XSS stocké, secrets, dépendances (npm audit), SQL dynamique | testés |
| Schéma production vs migrations ; sauvegarde/restauration | testés |

## Incident d'isolation (mon fait, à connaître)
Sous Windows, une variable d'environnement affectée à une chaîne vide est supprimée. Mon premier environnement d'audit a donc laissé `dotenv` charger les vraies clés de `.env` (Wave, WhatsApp, Telegram, Resend, Cloudinary, Facebook). Le garde DNS (liste noire) bloquait Wave, graph.facebook.com, resend et cloudinary, mais **pas api.telegram.org** (motif ancré sans `.org`) ni Stripe/Orange. Constaté : l'appel de `/api/paiement/server-ip` a joint Internet. Un événement Stripe falsifié (`CMD-20260930-445D23`) a exécuté `alerterPaiementRecu`, qui écrit sur Telegram avec le jeton réel : **un message Telegram factice de « paiement reçu » de 10 000 FCFA a pu être envoyé au chat administrateur** (non vérifiable : journaux écrasés). Correctif appliqué à l'environnement : valeurs factices non vides + garde en liste blanche (loopback uniquement) ; vérifié (Telegram, Stripe, ipify refusés). Aucune écriture en base de production : `DATABASE_URL` pointait toujours vers la base locale.

## Fiches

### AUD-025 — CRITIQUE — XSS stocké sur les pages publiques (JSON-LD non échappé)
- Preuve (PROUVÉ, Chromium) : produit et boutique nommés `X</script><script>window.__XSS_PROOF=1</script>` ; `window.__XSS_PROOF === 1` sur `/boutiques/<slug>` et `/boutiques/<slug>/produits/<id>`. L'API accepte le nom sans assainissement (`POST /api/boutiques/:id/produits` 201, `PUT /api/boutiques/:id` 200).
- Cause (CODE) : `dangerouslySetInnerHTML={{ __html: JSON.stringify(...) }}` dans 38 fichiers, aucun échappement de `<` (seul `lib/format.ts:86` échappe autre chose). Exemples : `boutiques/[id]/page.tsx:219`, `boutiques/[id]/produits/[produitId]/page.tsx:193,197`, `annonces/[id]/page.tsx:97,266`, `immo/[id]/page.tsx:480`, `agences/[slug]/page.tsx:109`. Le CSP de `middleware.ts:97` garde `script-src 'unsafe-inline' 'unsafe-eval'` ; le `nonce` généré (l.93) n'est jamais utilisé dans la directive, donc le CSP ne bloque pas l'exécution (en production aussi : seule la directive `upgrade-insecure-requests` dépend de `isDev`).
- Impact : tout marchand inscrit (gratuit) ou déposant d'annonce exécute du JavaScript chez chaque visiteur de sa page (actions au nom du visiteur connecté, hameçonnage, exfiltration des données de la page via `connect-src https:`). Les cookies de session sont HttpOnly (non lisibles).
- Exploitation déjà présente : recherche dans le dump de production du 24/09 : aucune charge utile dans `boutiques`, `boutique_produits`, `annonces_*` (5 occurrences dans `social_posts`, non analysées : NON DÉTERMINÉ).
- Correction : fonction `safeJsonLd` (`JSON.stringify(x).replace(/</g,'\\u003c')`) appliquée aux 38 sites ; nonce réel dans le CSP ; assainir les champs texte côté API. Validation : le test Chromium ci-dessus renvoie `undefined` ; un test unitaire vérifie l'absence de `</script>` brut dans le HTML rendu.

### AUD-026 — CRITIQUE — SSRF non authentifié (`/api/boutiques/magic-import`)
- Preuve (PROUVÉ) : avec `{"url":"http://[::1]:4555/produit"}` sans jeton, le serveur a interrogé un service interne sur le loopback IPv6 et renvoyé son `<title>` et `og:description` (`INTERNAL-ADMIN-PANEL-SECRET`).
- Cause (CODE) : `backend/services/magic-import.js:22-55`, filtre par expression régulière sur le nom d'hôte. Contournements testés (autorisés) : `http://[::1]/`, `http://[::ffff:127.0.0.1]/`, `http://[fd00::1]/`, `http://100.64.0.1/`, `http://localtest.me/`. Pas de résolution DNS ni de contrôle après redirection (DNS rebinding, `follow-redirects`). Route sans authentification (`boutiques-crud.js:218`, seulement `limiterImport`).
- Impact : lecture partielle (titres, prix, images) de services internes joignables depuis l'hébergeur, y compris le réseau privé Render.
- Correction : exiger l'authentification ; résoudre le DNS et refuser toute IP privée/réservée (IPv4 et IPv6), y compris après redirection ; liste d'hôtes autorisés si possible. Validation : les 5 URL ci-dessus sont refusées ; un lien AliExpress normal fonctionne.

### AUD-027 — MAJEUR — Relais WhatsApp anonyme (`POST /api/whatsapp/send`)
- Preuve (PROUVÉ) : sans jeton, avec un identifiant de produit réel et un numéro arbitraire, le serveur tente l'envoi vers `graph.facebook.com` (bloqué par mon garde) ; route `whatsapp.js:207`, `tokenOptional`.
- Impact : tout visiteur peut faire envoyer des messages WhatsApp depuis le numéro de la plateforme à n'importe quel numéro (spam, coût, dégradation de la qualité du numéro Meta, risque de blocage). Seule limite : limiteur global 1 000 requêtes / 15 min / IP.
- Correction : exiger un compte, limiter par compte et par numéro, n'autoriser que le numéro du compte. Validation : requête anonyme 401 ; 6e envoi en une minute refusé.

### AUD-028 — MAJEUR — Contrôle d'accès administrateur (RBAC) décoratif
- Preuve (PROUVÉ) : un compte `support_client` (lecture seule d'après `ROLE_PERMISSIONS`) a pu : désactiver le drapeau `POS_ENABLED` (`PUT /api/feature-flags/admin/POS_ENABLED` 200, valeur publique passée de `true` à `false`), vider toutes les sessions du chatbot (`DELETE /api/whatsapp/admin/sessions` 200), supprimer des leads et des entrées de blacklist (200), lancer `auto-collecte`, `nettoyer`, `assainir-immo`, `sync-artp` (200). Sur 150 routes admin testées : `support_client` non refusé sur 98, `moderateur` sur 99, `finance` sur 112, `admin_operationnel` sur 117 (les 404 et 400 sont inclus : ce sont des routes atteintes).
- Cause (CODE) : seules 27 occurrences de `requireAdminRole(` (9 dans `admin-utilisateurs.js`, 4 dans `comptabilite.js`…) sur 192 routes protégées par `requireAdminAuth`/`adminSecretOnly` ; les autres n'exigent que « être administrateur ».
- Impact : un compte de support compromis ou malveillant peut couper la caisse POS de toute la plateforme ou détruire des données de prospection.
- Correction : appliquer `requirePermission` par route selon la matrice ; tests automatiques par rôle. Validation : la matrice 4 rôles × routes renvoie 403 hors droits.

### AUD-029 — MAJEUR — Secrets exposés à tout rôle administrateur (`GET /api/settings`)
- Preuve (PROUVÉ, valeurs canari) : `GET /api/settings/` renvoie `wave_api_key`, `wave_signing_secret`, `telegram_bot_token`, `fb_page_access_token` au compte `support_client` (`settings.js`, `adminSecretOnly` + `s.getAll()` sans masque). La route publique `/api/settings/public` ne les renvoie pas.
- Production : le dump du 24/09 contient `fb_page_access_token` renseigné (204 caractères) ; `wave_api_key` et `wave_signing_secret` vides (les clés Wave viennent de l'environnement).
- Correction : masquer les clés sensibles en lecture (`****` + 4 derniers caractères), réserver l'écriture/lecture complète à `super_admin`. Validation : un rôle non `super_admin` ne reçoit jamais la valeur complète.

### AUD-030 — MOYEN — Secret maître administrateur faible et stocké en cookie
- `ADMIN_SECRET` de la production : **13 caractères** (longueur mesurée, valeur non lue). Le secret est accepté en en-tête `X-Admin-Secret` sur toutes les routes admin (limiteur global seulement) et recopié tel quel dans un cookie `nopalou_admin` pendant 7 jours (`admin-auth.js`). Un seul secret donne `super_admin` sans journal nominatif ni second facteur.
- Correction : secret ≥ 32 caractères aléatoires, désactivable hors urgence, limiteur dédié et alerte à chaque usage ; cookie contenant uniquement le JWT.

### AUD-031 — MAJEUR — Sauvegarde non restaurable sur le schéma réel
- Preuve (PROUVÉ) : le dump (`backups/…pra-drill.sql.gz`) est une seule transaction ; la restauration sur un schéma construit par les migrations échoue à la première erreur et **rien n'est chargé** (13 577 commandes ignorées). Première cause : `boutique_produits.images` est `text[]` alors que le dump l'écrit en `jsonb`. Autres causes : colonnes et table absentes des migrations (voir AUD-002), colonnes ajoutées à la volée (AUD-032).
- Impact : en cas de sinistre, la sauvegarde applicative ne suffit pas ; `npm run test:pra` ne détecte pas ce cas. Sauvegardes managées Render : NON DÉTERMINÉ.
- Correction : sérialiser les tableaux en `ARRAY[...]`/littéral `'{...}'`, exporter le schéma dans le même dump, rejouer la restauration dans un schéma vide lors du test PRA. Validation : restauration dans une base vide, comptage ligne à ligne identique.

### AUD-032 — MOYEN — DDL exécuté dans les requêtes
- 16 fichiers hors migrations exécutent `CREATE TABLE`/`ALTER TABLE` au runtime : `services/prospection.js` (53 instructions), `routes/categories.js` (9), `routes/admin-migration.js` (8), `routes/boutiques-modules/credits.js` (6, dont `ALTER TABLE … ADD COLUMN reference` et `CREATE UNIQUE INDEX` aux lignes 316-317 dans un handler), `paiement-sequestre.js` (6), `credit-service.js` (5)…
- Impact : verrous `ACCESS EXCLUSIVE` pendant le trafic, schéma dépendant de l'historique des appels, base reconstruite différente de la production (114 tables après démarrage, 115 après mes appels, 110 par migrations seules).
- Correction : déplacer dans des migrations versionnées ; retirer tout DDL des handlers.

### AUD-033 — MOYEN — Dépendances vulnérables (npm audit, dépendances de production)
- Frontend : 1 critique (`next` : DoS de l'optimiseur d'images via `remotePatterns`, correctif disponible), 6 hautes (`@serwist/next`, `brace-expansion`, `browserslist`, `fast-uri`, `nanoid`, `postcss`).
- Backend : 6 hautes (`axios` SSRF sans correctif, `follow-redirects`, `multer` DoS, `form-data`, `undici`, `duckduckgo-images-api`) et 6 moyennes.
- Aucun secret en clair dans le code suivi (recherche de motifs sk_live, AKIA, AIza, EAA, ghp_, jetons Telegram, clés privées : seuls les exemples de `.env.example`).
- Correction : `npm audit fix` sur une branche, relecture des changements majeurs de `next`.

### AUD-034 — MOYEN — Courtier partenaire : accès aux données financières de l'agence
- Preuve (PROUVÉ) : un membre de rôle `courtier` lit `/api/locatif-immo/agence/:id/compta`, `/commissions-immo/agence/:id`, `/credits-immo/agence/:id/config`, `/crm-immo/agence/:id/contacts`, `/agences/:id/membres` (200). Il est refusé (403) sur la modification de l'agence, l'ajout ou la modification de membres et le sponsoring. Un non-membre est refusé partout (403).
- NON DÉTERMINÉ : accès voulu ou non pour un courtier externe.

### AUD-035 — MINEUR — Chatbot : écarts entre documentation et comportement
- Suivi d'une commande par référence : la phrase « suivi commande CMD-… » est traitée comme une recherche produit (« Aucun résultat trouvé ») ; aucun flux de suivi acheteur dans le bot (le chat web renvoie vers une page de suivi). CLAUDE.md affirme le contraire.
- Recherche d'une boutique par son nom complet (« Boutique Audit A ») : « introuvable » ; « boutique » liste bien les boutiques.
- Chat web : « bonjour » → « Je n'ai pas trouvé de produit correspondant ».
- Vérifié OK : un numéro non marchand ne peut pas ouvrir l'espace marchand (refus + proposition de création) ; le marchand doit saisir son PIN (3 essais) ; déduplication des messages par identifiant ; STOP/START ; injection SQL et message de 5 000 caractères sans effet (l'écho est tronqué).

### AUD-036 — MINEUR — Tests E2E non hermétiques ; règle des 450 lignes non tenue
- Échecs E2E dont la cause est l'environnement (base sans catalogue comparateur) : `fiche produit accessible`, `Recherche produit retourne des résultats` ; POS (`07…:213`, `10…:215`) : dépendent d'une boutique et d'un jeton `pos-test-token` préexistants : **non concluants**, pas de défaut produit démontré. `liens navbar fonctionnels` (`/telecom`) : cause NON DÉTERMINÉE.
- 87 composants `.tsx` sur 960 dépassent 450 lignes (plus grand : `SamaKalpeClient.tsx` 817). CLAUDE.md déclare la règle appliquée.

### AUD-037 — MOYEN — Intégrité des données (snapshot de production du 24/09, restauré en local, agrégats uniquement)
Réserve : le journal indique des assainissements massifs les 28-29/09 (produits orphelins, annonces immo) **postérieurs** à ce dump ; les chiffres « comparateur » et « immo » ne décrivent donc pas l'état actuel (NON VÉRIFIÉ en production). Constats structurels retenus :
- 11 commandes payées en ligne (6 Wave, 2 Orange Money, 2 carte, 1 mixte) sont au statut `livree` avec `paiement_recu = false` ; aucune des 44 commandes livrées n'a `paiement_recu = true`. Le drapeau de paiement n'est pas fiable pour le rapprochement comptable.
- 54 abonnements `statut = 'actif'` dont 9 avec `fin` dépassée : aucun traitement de passage à `expire` (le contrôle caisse lit `fin > NOW()`, d'autres écrans peuvent lire `statut` : NON DÉTERMINÉ).
- Les ventes POS sont stockées dans `commandes_boutique` avec `prix_unitaire = 0.00` (ex. total 4 000 F, prix 0) ; d'anciennes commandes `CMD-2026-xxxx` ont un `montant_total` qui exclut les frais de livraison (300 F pour 300 F + 1 500 F de frais). 40 commandes sur 99 ne vérifient pas `montant_total = quantite × prix + frais`.
- 5 boutiques dont le propriétaire n'existe plus malgré des clés étrangères déclarées dans le schéma (cause NON DÉTERMINÉE : restauration sous `session_replication_role = replica`, ou contrainte absente en production).
- 85 boutiques : 56 sans WhatsApp, 80 sans logo, 51 sans produit en stock ; 105 produits dont 16 sans image, 3 à prix ≤ 0, 9 doublons (boutique, nom) ; 30 comptes sur 100 sans téléphone.
- `historique_prix` : 1,28 M lignes, 175 Mo, sans purge ni agrégation (index présents sur offre et date).

### AUD-038 — MOYEN — Performance (API locale, snapshot de 45 543 produits, 12 appels séquentiels, machine de développement)
| Endpoint | 1er appel | médiane (chaud) |
|---|---|---|
| `GET /api/search?q=telephone` | 345 ms | **366 ms** (non mis en cache, 31 Ko) |
| `GET /api/produits/instantanee?q=robe` (saisie semi-automatique) | 85 ms | **84 ms** à chaque frappe |
| `GET /api/produits?limit=20` (accueil) | **317 ms** à froid | 15 ms (cache) |
| `GET /api/produits?q=iphone` | 173 ms | 15 ms |
| autres routes publiques (boutiques, immo, annonces, télécom, catégories, fiche produit) | ≤ 30 ms | 13-18 ms |
- Limites : charge mono-utilisateur, pas de charge concurrente (le limiteur global 1 000 req / 15 min interdit un test de charge sans le désactiver) ; frontend mesuré en mode développement seulement : **aucune mesure de Core Web Vitals valide**.
- Correction : cache et/ou index trigramme pour `/api/search` et `instantanee` ; vérifier les plans d'exécution (`EXPLAIN ANALYZE`) ; purge de `historique_prix`.

### AUD-039 — MINEUR — Accessibilité (heuristiques automatiques, 9 pages, pas d'audit axe/lecteur d'écran)
- Bon : `lang="fr"`, titre, un `h1`, toutes les images ont un `alt`, pas de blocage du zoom, lien d'évitement présent.
- Défauts : champs sans étiquette (`/boutiques` 4, `/boutiques/<slug>` 2, `/immo` 1, `/annonces` 1, `/creer-boutique` 1), 4 liens sans nom accessible sur la vitrine boutique, deux éléments `<main>` sur `/` et `/tarifs-boutique`.
- Contraste, ordre de tabulation, lecteur d'écran, formulaires d'erreur : NON DÉTERMINÉ.

### Résolution d'un échec E2E
`liens navbar fonctionnels` (`/telecom`) : le lien fonctionne dans un vrai navigateur (clic → `/telecom`, 4 occurrences dont 3 visibles) ; l'échec est dû à la compilation à la demande du mode dev (délai de 5 s). Non concluant, pas un défaut.


---

# Phase 4 — constats ajoutés pendant l'exécution des corrections P0 (tous reproduits par exécution)

| ID | Gravité | Constat | Statut |
|---|---|---|---|
| AUD-040 | MAJEUR | Orange Money du checkout express : `notif_url` par défaut vers une route inexistante (`/api/paiements/orange-money/webhook`) | corrigé, testé |
| AUD-041 | MAJEUR | Admin désactivé ou supprimé gardait l'accès pendant 7 jours | corrigé, testé |
| AUD-042 | MAJEUR | Webhook Wave : paiement légitime refusé (« fraude montant ») avec frais, promo ou plusieurs articles | corrigé, testé |
| AUD-044 | CRITIQUE | Panier de 2 articles ou plus : HTTP 500 (UNIQUE `reference`) | corrigé, testé |
| AUD-045 | MAJEUR | `notifierVendeurCommande` : `ReferenceError: commande is not defined` pour toute commande sans frais de livraison → aucune notification vendeur (aussi 500 sur `POST /api/comptabilite/:boutiqueId/commandes`) | corrigé, testé |
| AUD-046 | MOYEN | Limite d'usage des codes promo jamais appliquée au checkout express (colonne `max_utilisations` inexistante, la vraie est `limite_utilisation`) | corrigé, testé |
| AUD-047 | CRITIQUE | Checkout public : saisie d'un numéro de carte + CVC envoyés à un simulateur qui « approuve » toute carte sans débit ; session Stripe simulée renvoyant vers la page de succès si la clé Stripe est absente | corrigé (saisie supprimée, option masquée, simulateur coupé en production), vérifié en navigateur |
| AUD-048 | MOYEN | Signature des webhooks Stripe impossible à valider (`JSON.stringify` d'un Buffer) | corrigé, testé |
| AUD-049 | MINEUR | `frontend-next/scripts/run-unit-tests.mjs` : `it()` n'attend pas les callbacks asynchrones (tests 17 à 20 et crédit ne peuvent jamais échouer) | NON corrigé |
| AUD-050 | MINEUR | Les tests d'intégration existants (`tests/integration/*`) sont ignorés sans `DATABASE_URL_TEST` et utilisent des identifiants non UUID (`test-boutique-001`) : ils ne peuvent pas s'exécuter sur le schéma réel | NON corrigé |
| AUD-051 | MINEUR | Les références `C-…` (WhatsApp, `POST /api/comptabilite/:id/commandes`) ne sont pas reconnues par `GET /api/boutiques/commandes/suivi` (préfixes acceptés : `CMD-`, `PAY-`, `V-`, UUID) | NON corrigé |

---

# Phase 5 — Audit ciblé Identité & Authentification (30 septembre 2026, soir)

**Périmètre** : inscription, connexion (mot de passe + OTP WhatsApp + lien magique), déconnexion, vérification d'e-mail, récupération/changement de mot de passe, session (JWT, cookies), 2FA WhatsApp, profil, suppression/annulation de compte (RGPD), permissions liées à l'identité. Chaîne testée de bout en bout : frontend (Next.js, cookie `nopalou_session`, Server Actions) → backend (`backend/routes/auth.js`, `backend/middlewares/auth.js`) → PostgreSQL (`utilisateurs`, `auth_otp_phones`, `auth_otps`) → réponse → interface.

**Méthode** : pile isolée (`scripts/audit/audit-env.ps1`, PostgreSQL local :54329, backend :4100, frontend :3001), toutes les intégrations externes (Resend, Meta WhatsApp, Telegram) interceptées par un relais de capture qui journalise le corps de chaque appel sortant sans jamais atteindre Internet (aucune fuite ; conforme à la garde réseau en liste blanche du kit). ~140 sondes automatisées exécutées (`scratch` de session, non commité) : cas nominaux, doublons, concurrence, jetons forgés/expirés/mal typés, états de compte (suspendu/anonymisé/en grâce), énumération par mesure de temps, désynchronisation d'ordre SQL.

**Recoupement avec les livraisons déjà faites (obligatoire avant de lister quoi que ce soit)** : `git log` confirme qu'aucun commit postérieur à `a7aac784` (30/09, refonte identité — séparation `RESET_SECRET`/`VERIFY_SECRET`, `jwt_version`, suppression RGPD à 30 jours) n'a touché `backend/routes/auth.js`, `backend/middlewares/auth.js`, `backend/services/otp.js`, `backend/lib/magicAuthToken.js`, `frontend-next/src/lib/session.ts`, `frontend-next/src/app/actions/auth.ts` ni `frontend-next/src/middleware.ts` ; les 7 commits de la branche d'audit ne modifient aucun de ces fichiers. Toutes les anomalies ci-dessous portent donc sur le code actuellement en place, après la refonte du jour, pas sur une version dépassée. Deux correctifs déjà revendiqués ont été recoupés et tenus pour confirmés (aucune nouvelle fiche) :
- **AUD-002/AN-002 (révocation par `jwt_version`)** : reconfirmé — après déconnexion, l'ancien jeton est rejeté (401) ; comportement inchangé.
- **AUD-041/AUD-028 (repli `super_admin` sur secret de compte désactivé)** : `backend/middlewares/admin-rbac.js:150` n'autorise le repli `super_admin` que si `decoded.adminId === BREAK_GLASS_ID` **et** qu'aucune ligne n'existe (`!rows[0]`) — un compte désactivé (`actif=false`) ou supprimé ne bénéficie plus du repli. Rejoué : `node scripts/audit/verify-rbac.js` → **150/150 conformes** (5 rôles × 30 routes). Confirmé tenu.

## Fiches (PROUVÉ = reproduit par exécution dans l'environnement isolé)

### AUD-052 — CRITIQUE — Confusion d'authentification par téléphone partagé : l'OTP WhatsApp peut ouvrir la session d'un autre compte
- **Preuve** : `utilisateurs.telephone` n'a **aucune contrainte unique** en base (`\d utilisateurs` — seuls `id`, `email`, `code_apporteur` sont uniques). N'importe quel compte connecté peut, via `PUT /api/auth/profil`, écrire dans son propre `telephone` le numéro d'un autre utilisateur sans aucune preuve de possession (reproduit : 2 comptes distincts partagent ensuite le même numéro). Les 4 requêtes qui résolvent un numéro en compte (`/whatsapp-otp-send`, `/whatsapp-otp-login` ×2, `/whatsapp-otp-register`) utilisent `WHERE telephone=$1 OR telephone=$2 OR telephone=$3 OR REPLACE(telephone,'+','')=$1` **sans `ORDER BY`** : l'ordre renvoyé dépend de l'ordre physique des tuples PostgreSQL, qui change dès qu'une des deux lignes est modifiée (UPDATE = nouvelle version de tuple). Reproduit précisément : avant une écriture anodine sur la ligne du propriétaire légitime (ex. `jwt_version+1`, ce qui arrive à **chaque déconnexion**), l'OTP de connexion authentifie le bon compte ; après cette écriture, le **même code, envoyé au même numéro réel**, authentifie le compte de l'usurpateur (`res-t3.json`, sondes G8/G9/G9b).
- **Impact** : le titulaire réel du numéro WhatsApp, qui reçoit lui-même le code sur son téléphone et le saisit de bonne foi, peut se retrouver connecté au compte d'un tiers (accès à son panier, ses commandes, sa boutique, son carnet Sama Xaalis) — et réciproquement l'usurpateur peut basculer sur le compte de la victime. Déclenchable à tout moment par un attaquant qui connaît ou devine un numéro (ou son propre numéro s'il veut simplement observer le comportement), sans rien d'autre qu'un compte Nopalou ordinaire.
- **Cause racine** : (1) absence d'index unique sur `utilisateurs.telephone` ; (2) `PUT /api/auth/profil` accepte un numéro sans vérification (OTP) de possession ; (3) résolution SQL non déterministe (pas de `ORDER BY`, pas de rejet en cas de doublon).
- **Fichiers** : `backend/routes/auth.js` (`PUT /profil` L.432-471 ; `whatsapp-otp-send` L.489 ; `whatsapp-otp-login` L.599 ; `whatsapp-otp-register` L.666), migration schéma `utilisateurs`.
- **Correctif proposé** : (a) index unique partiel `CREATE UNIQUE INDEX ON utilisateurs (telephone) WHERE telephone IS NOT NULL` après nettoyage des doublons existants en production (7 groupes mesurés sur `nopalou_audit_data`, voir Phase 3bis ci-dessous) ; (b) `PUT /profil` doit exiger un OTP de vérification avant d'accepter un changement de `telephone` (réutiliser `services/otp.js`) ou, a minima, rejeter l'écriture si le numéro est déjà pris par un autre `id` ; (c) supprimer la dépendance à l'ordre physique : si plusieurs lignes correspondent, traiter comme une erreur d'intégrité (log + 409), jamais un choix silencieux.
- **Test de non-régression** : script `idor.js`-like scénario « deux comptes, même numéro, OTP envoyé, vérifier que le login résout toujours vers le compte qui a initié la demande » ; test d'insertion qui doit échouer sur doublon après l'index unique.

### AUD-053 — CRITIQUE — Changement d'e-mail sans nouvelle vérification ni notification : consolidation de prise de contrôle de compte
- **Preuve** : `PUT /api/auth/profil` accepte `{email}` sans mot de passe, sans OTP, sans e-mail de confirmation vers l'ancienne adresse, et **sans repasser `email_verifie` à `false` de façon durable dans le parcours réel** : un compte déjà vérifié (`email_verifie=true`) qui change d'adresse reste vérifié instantanément (sonde D5 : `email_verifie=true`, 0 courrier envoyé). Pire, un jeton de vérification (`type=verify`) émis pour l'**ancienne** adresse au moment de l'inscription — lié uniquement à `userId`, jamais à l'adresse e-mail elle-même — valide rétroactivement la **nouvelle** adresse si le compte l'avait changée entre-temps (sonde D4c).
- **Impact** : si une session est compromise par un vecteur quelconque (jeton volé via le fallback `?token=` en query string déjà connu — AUD-021 —, XSS stocké via le nom d'utilisateur — voir AUD-058 —, ou tout autre moyen), l'attaquant change l'e-mail vers une adresse qu'il contrôle, en une requête, sans que la victime en soit avertie sur son ancienne adresse. Le compte reste marqué « vérifié » et **toute réinitialisation de mot de passe future part désormais chez l'attaquant** (`/mot-de-passe-oublie` utilise le nouvel e-mail) : prise de contrôle complète et durable, sans bruit.
- **Cause racine** : `PUT /profil` (`backend/routes/auth.js:432-471`) ne distingue pas un changement d'e-mail d'un changement de nom/téléphone ; pas de ré-émission d'un jeton `verify` lié à la nouvelle adresse, pas de remise à `email_verifie=false`, pas de notification de sécurité à l'ancienne adresse.
- **Fichiers** : `backend/routes/auth.js:432-471` ; `frontend-next/src/app/actions/auth.ts:updateProfil`.
- **Correctif proposé** : sur changement d'e-mail, (1) repasser `email_verifie=false` en base dans la même transaction ; (2) envoyer un e-mail de confirmation à la **nouvelle** adresse avec un jeton lié à `{userId, email}` (et non plus seulement `userId`) ; (3) envoyer systématiquement une alerte de sécurité à l'**ancienne** adresse (« votre e-mail a été changé vers … , si ce n'est pas vous … ») ; (4) exiger le mot de passe courant (comme pour `supprimer-compte`) avant d'accepter un changement d'e-mail.
- **Test de non-régression** : après changement d'e-mail, vérifier `email_verifie=false` en base, un courrier vers l'ancienne adresse, un courrier de vérification vers la nouvelle, et que l'ancien jeton `verify` (même valide) est rejeté car il ne porte pas la nouvelle adresse.

### AUD-054 — CRITIQUE — Création de compte non sollicitée pour n'importe quel numéro, sans preuve de possession (`POST /api/auth/whatsapp-login`)
- **Preuve** : un appel anonyme `POST /api/auth/whatsapp-login {telephone, nom}` crée immédiatement un compte **marqué vérifié** (`email_verifie=true`) pour le numéro fourni, avec le `nom` choisi par l'appelant, puis envoie un message WhatsApp non sollicité à ce numéro contenant un lien de connexion magique valide 72 h (sonde O10, reproduit : compte créé avec `id`, `email_verifie:true`, 2-3 messages WhatsApp émis par appel).
- **Impact** : (1) fabrique de comptes « vérifiés » pour des numéros n'appartenant pas à l'appelant, avec un nom arbitraire (utile pour usurper une identité avant que le vrai titulaire ne s'inscrive — cf. AUD-055) ; (2) oracle d'envoi de messages WhatsApp non sollicités vers n'importe quel numéro sénégalais via le compte WhatsApp Business payant de Nopalou (abus de réputation/coût, risque de blocage du compte Meta) ; (3) le seul frein est `limiterAuth` (20 requêtes/15 min **par IP**, uniquement actif en production), contournable par rotation d'IP — non vérifiable depuis l'environnement isolé si le proxy Render neutralise les en-têtes forgés (voir « non vérifié » ci-dessous).
- **Cause racine** : `router.post('/whatsapp-login', ...)` (`backend/routes/auth.js:709-753`) ne vérifie aucune preuve de possession (pas d'OTP préalable) avant de créer le compte et d'envoyer le message.
- **Fichiers** : `backend/routes/auth.js:709-753`.
- **Correctif proposé** : transformer ce flux en 2 étapes comme les autres (envoyer d'abord un OTP via `services/otp.js`, ne créer/renvoyer le lien magique qu'après vérification), ou supprimer la création de compte à la volée et exiger un compte déjà existant.
- **Non vérifié** : si le limiteur par IP est réellement efficace derrière le proxy Render (`trust proxy:1`) contre un en-tête `X-Forwarded-For` forgé côté client — dépend de la configuration réseau de production, non testable depuis la pile locale.

### AUD-055 — MAJEUR — Squattage de l'espace d'adresses réservé `<numéro>@whatsapp.nopalou.com`, blocage de l'inscription WhatsApp légitime
- **Preuve** : un compte e-mail ordinaire peut s'inscrire directement avec l'adresse `2217xxxxxxxx@whatsapp.nopalou.com` (`POST /api/auth/inscription`, 201) — ou la revendiquer plus tard via `PUT /api/auth/profil` (sonde G7, 200) — avant même que le vrai titulaire du numéro ne s'inscrive par OTP. Quand le vrai titulaire tente ensuite `POST /api/auth/whatsapp-otp-register`, il reçoit `409 « Un compte existe déjà avec ce numéro WhatsApp. Veuillez vous connecter. »` (sonde G10) alors que ce n'est pas son compte.
- **Impact** : déni de service ciblé sur l'inscription WhatsApp d'un numéro donné ; combiné à AUD-052, la tentative de « se connecter » proposée par le message d'erreur peut en plus aboutir sur le compte de l'usurpateur.
- **Cause racine** : `2217xxxxxxxx@whatsapp.nopalou.com` est traité comme un e-mail ordinaire par `POST /api/auth/inscription` et `PUT /api/auth/profil`, sans réservation de cet espace de noms.
- **Fichiers** : `backend/routes/auth.js` (`/inscription` L.22, `PUT /profil` L.432).
- **Correctif proposé** : rejeter (400) toute inscription/mise à jour de profil dont l'e-mail se termine par `@whatsapp.nopalou.com` lorsqu'elle n'émane pas du code interne d'auto-provisionnement.

### AUD-056 — MAJEUR — Comptes historiques à e-mail non normalisé : verrouillage silencieux de la connexion et de la récupération
- **Preuve** : un compte stocké avec un e-mail à casse mixte (`Marie.Curie@Gmail.com`, plausible pour tout compte créé avant l'ajout de `.normalizeEmail()`, ou via un import/correctif direct) ne peut **plus se connecter avec sa propre adresse exacte** : `body('email').isEmail().normalizeEmail()` la met en minuscule avant la requête `WHERE email=$1` sur une colonne à contrainte unique sensible à la casse → `401 Identifiants incorrects` (sonde B8, reproduit sur 3 adresses). `POST /mot-de-passe-oublie` normalise l'e-mail de la même façon et répond `success:true` (bonne pratique anti-énumération) mais **n'envoie aucun courrier** puisque la requête interne ne trouve personne : la voie de récupération annoncée comme universelle est en réalité sans effet pour ces comptes.
- **Impact** : perte d'accès totale et silencieuse (aucun message d'erreur n'indique la cause réelle) pour tout compte historique ou importé à casse non normalisée ; aucune voie de sortie côté produit.
- **Cause racine** : la normalisation a été ajoutée après coup sur les routes d'entrée sans migration des e-mails existants ni harmonisation de la comparaison SQL.
- **Fichiers** : `backend/routes/auth.js:101-161` (connexion), `:341-370` (mot-de-passe-oublié) ; table `utilisateurs`.
- **Correctif proposé** : migration en base `UPDATE utilisateurs SET email = lower(email) WHERE email <> lower(email)` (après vérification qu'elle ne crée pas de doublon — aucun trouvé lors du contrôle : `email_doublon_insensible_casse = 0` sur l'échantillon de production restauré), puis comparer systématiquement `lower(email)` dans toutes les requêtes de connexion/reset, ou ajouter un index fonctionnel `lower(email)` unique et l'utiliser partout.
- **Test de non-régression** : créer un compte à casse mixte, vérifier connexion et réinitialisation fonctionnelles après le correctif.

### AUD-057 — MAJEUR — Lien de réinitialisation de mot de passe rejouable pendant toute sa durée de validité
- **Preuve** : `POST /api/auth/reinitialiser-mot-de-passe` ne marque jamais le jeton comme consommé ; le même lien, utilisé une première fois avec succès, réapplique un **second** mot de passe différent avec succès une seconde fois, dans la fenêtre de validité d'1 h (sonde E4 : deux appels à `200`, le second mot de passe étant celui qui reste actif). Le jeton de réinitialisation n'a pas non plus de trace de mise à jour de `jwt_version` incohérente avec la coupure des sessions du format « cookie du frontend » (sonde E5b : une session au format émis par `frontend-next` — sans `jwtVersion` — reste valide même après réinitialisation, alors que la session émise par le backend est bien coupée en E5).
- **Impact** : un lien de réinitialisation intercepté (journal, historique navigateur, redirection, boîte mail partagée) reste exploitable pendant toute son heure de validité, y compris après usage légitime par la victime — fenêtre d'attaque qui n'existerait pas si le jeton était à usage unique.
- **Cause racine** : `backend/routes/auth.js:373-398` ne révoque pas le jeton après usage (pas de registre de jetons consommés, pas de `jti`) ; par ailleurs les sessions au format `frontend-next/src/lib/session.ts` (JWT `{userId,...}` signé `SESSION_SECRET||JWT_SECRET`, sans `jwtVersion`) échappent totalement au contrôle de révocation `verifierToken`, qui ne rejette que sur incohérence de `jwtVersion` — absent ici, donc jamais incohérent.
- **Fichiers** : `backend/routes/auth.js:373-398` ; `backend/middlewares/auth.js:45-62` ; `frontend-next/src/lib/session.ts`.
- **Correctif proposé** : (a) ajouter un identifiant unique (`jti`) au jeton de reset, le marquer consommé dans une table/registre (ou signer avec `jwt_version` courant au moment de l'émission et comparer), rejeter tout jeton dont le `jti`/`jwt_version` a déjà servi ; (b) faire émettre par `frontend-next` un jeton portant `jwtVersion` (aligné sur celui du backend) pour que `verifierToken` puisse réellement le révoquer — actuellement les deux mécanismes de session (backend JWT et cookie Next signé séparément) ne sont pas interopérables pour la révocation.
- **Test de non-régression** : rejouer un jeton de reset déjà utilisé → 400 ; vérifier qu'une session cookie Next est bien coupée après reset.

### AUD-058 — MAJEUR — Injection HTML non échappée via le nom d'utilisateur, reproduite dans l'e-mail de bienvenue de marque Nopalou
- **Preuve** : `POST /api/auth/inscription` accepte `nom = '<b>GRAS</b><a href="https://evil.example/x">Confirmez ici</a>'` sans échappement, stocké tel quel, puis injecté brut dans `templateEmail()` (`contenuHtml` utilise le nom sans `escapeHtml`) : l'e-mail de bienvenue envoyé à l'utilisateur lui-même contient le HTML actif, y compris un lien arbitraire (sonde A4, `htmlBrutDansEmail:true`, `contientLienEvil:true`).
- **Impact** : dans l'immédiat, auto-XSS limité (l'e-mail part à l'adresse de l'inscrivant) ; mais `nom` est un champ largement redistribué dans l'application (notifications de commande au marchand, fiches client, listes admin, apporteur) sans qu'on ait pu, dans le périmètre de cet audit, vérifier que **toutes** ces surfaces échappent le nom à l'affichage — seule la surface e-mail a été prouvée vulnérable. À traiter comme un point d'injection générique tant que les autres surfaces n'ont pas été vérifiées individuellement.
- **Cause racine** : `backend/services/email.js:templateEmail()` interpole `contenuHtml` sans échappement, et les appelants (`backend/routes/auth.js`) construisent `contenuHtml` avec le nom brut de l'utilisateur.
- **Fichiers** : `backend/routes/auth.js:66-80` (et tout autre appelant de `templateEmail` avec un nom utilisateur) ; `backend/services/email.js`.
- **Correctif proposé** : échapper systématiquement (`escapeHtml`) toute valeur utilisateur avant interpolation dans un gabarit HTML d'e-mail ; a minima, borner/assainir `nom` à l'inscription (rejeter les caractères `<`, `>` ou les encoder).
- **Non vérifié** : présence du même défaut d'échappement sur les autres surfaces qui affichent `nom` (admin, commandes, apporteur) — à auditer séparément.

### AUD-059 — MAJEUR — 2FA WhatsApp : activable sur un numéro non vérifié, « fail-open » si le numéro devient invalide, aucune voie de récupération
- **Preuve** : `POST /api/auth/2fa/activer {telephone}` accepte n'importe quel numéro sans OTP de vérification préalable (sonde T1, 200) ; si ce numéro n'est pas celui de l'utilisateur, la connexion suivante envoie le code 2FA **au mauvais numéro** et verrouille le propriétaire légitime hors de son propre compte (sonde T2). Une réinitialisation de mot de passe réussie ne désactive pas le 2FA (sonde T3) : aucune voie de récupération documentée si le numéro 2FA est perdu/erroné. À l'inverse, si `a2f_telephone` devient invalide (`normalisePhone` renvoie une valeur vide), la connexion **bascule en clair sans second facteur** et délivre un jeton (sonde T5, « fail-open »). Enfin, `POST /api/auth/2fa/desactiver` ne demande ni mot de passe ni code, seule la session suffit (sonde T4) — cohérent avec le reste de l'application mais à noter comme absence de défense en profondeur si une session est compromise.
- **Impact** : un attaquant qui contrôle une session peut (a) activer le 2FA sur son propre numéro pour un compte qu'il vient de compromettre, verrouillant la vraie victime dehors le temps qu'elle réagisse, sans que la victime ait de porte de sortie par e-mail ; (b) le fail-open (T5) signifie qu'un 2FA mal configuré protège moins qu'annoncé.
- **Fichiers** : `backend/routes/auth.js:239-293` (activation/désactivation), `:126-143` (vérification à la connexion).
- **Correctif proposé** : exiger un OTP de vérification du numéro avant d'activer le 2FA ; fermer (refuser la connexion, ne pas fail-open) si `a2f_telephone` est invalide et alerter l'utilisateur/le support ; offrir une voie de récupération 2FA (codes de secours, ou désactivation par e-mail vérifié avec délai de carence, à l'instar de la suppression de compte).

### AUD-060 — MAJEUR — Portail locataire WhatsApp (contacts_immo) : échec HTTP 500 systématique par absence de contrainte unique sur `telephone`
- **Preuve** : le parcours d'auto-provisionnement documenté dans `whatsapp-otp-login` (`backend/routes/auth.js:622-649`, pour un locataire/propriétaire reconnu dans `contacts_immo` mais sans compte `utilisateurs`) exécute `INSERT ... ON CONFLICT (telephone) DO UPDATE ...` : PostgreSQL rejette cette clause faute de contrainte unique ou d'exclusion sur `telephone` (erreur confirmée : *« il n'existe aucune contrainte unique ou contrainte d'exclusion correspondant à la spécification ON CONFLICT »*), renvoyant un 500 générique au locataire (sonde O9).
- **Impact** : le parcours de connexion WhatsApp pour tout locataire/propriétaire fraîchement identifié (sans compte préexistant) est **cassé à 100 %** dans l'état actuel du schéma — confirme et aggrave la cause racine d'AUD-052 (absence d'index unique sur `telephone`) par un second effet, fonctionnel cette fois.
- **Cause racine** : identique à AUD-052 — absence d'index unique sur `utilisateurs.telephone`, alors que le code (`ON CONFLICT (telephone)`) présuppose son existence.
- **Fichiers** : `backend/routes/auth.js:640-649`.
- **Correctif proposé** : traité par le même correctif qu'AUD-052 (index unique partiel) ; ajouter un test d'intégration qui couvre ce chemin (il n'existait aucun test l'exerçant, d'où la non-détection jusqu'ici).

### AUD-061 — MOYEN — Lien magique (magic link) réutilisable, non révoqué par déconnexion ni par changement de mot de passe (72 h)
- **Preuve** : `genererMagicToken`/`validerMagicToken` (`backend/lib/magicAuthToken.js`) signent un HMAC autonome valable **72 h**, sans registre d'usage unique. Le même lien magique authentifie avec succès à répétition (sonde M1, deux appels `200`), reste valide après une déconnexion explicite du compte (sonde M2) et après un changement de mot de passe via réinitialisation (sonde M3). Seule l'altération du jeton ou un HMAC forgé sans le secret sont correctement rejetés (M4, M4b).
- **Impact** : un lien magique intercepté (capture d'écran WhatsApp, appareil partagé, lien transféré par erreur) reste un moyen de connexion valable jusqu'à 72 h après émission, indépendamment de toute action de sécurité prise entre-temps par l'utilisateur (déconnexion, changement de mot de passe) — combiné à AUD-059 (2FA), ce lien contourne aussi le second facteur (sonde T7).
- **Fichiers** : `backend/lib/magicAuthToken.js` ; `backend/routes/auth.js:708-837` (`whatsapp-login`, `magic-login`, `magic-verify`).
- **Correctif proposé** : usage unique (registre en base ou colonne `utilise_le` avec verrou), durée réduite (15 min, alignée sur le jeton `2fa_pending`), et invalidation explicite sur déconnexion/changement de mot de passe (lier le HMAC à `jwt_version` au moment de la vérification).

### AUD-062 — MOYEN — OTP téléphone : codes multiples valides simultanément, compteur d'essais partiel, fenêtre de rejeu de 60 s
- **Preuve** : contrairement à `genererOtp` (variante authentifiée, qui invalide systématiquement les anciens codes non utilisés), `genererOtpPhone` (`backend/services/otp.js`) n'invalide que les codes déjà **expirés**, pas les codes encore valides : 5 envois successifs laissent 5 codes simultanément acceptés par `verifierOtpPhone`, qui n'en décrémente les essais que sur le plus récent — un ancien code reste donc utilisable après plusieurs essais faux sur le nouveau (sonde O3). La fenêtre dite « d'idempotence » de 60 s (prévue contre la double soumission) accepte en réalité le même code déjà consommé pour une **nouvelle** vérification réussie, sans lien avec la requête d'origine (sonde O4, deuxième `200`). Un code émis pour `action='register'` est en outre accepté par `/whatsapp-otp-login` pour la même action tolérante (sonde O5).
- **Impact** : élargit la surface de force brute (plusieurs codes à deviner en parallèle, plusieurs bassins d'essais) et permet à quiconque intercepte un code dans la minute qui suit son usage légitime (journal, proxy, capture) d'ouvrir une session supplémentaire indépendante.
- **Fichiers** : `backend/services/otp.js:158-260` (`genererOtpPhone`, `verifierOtpPhone`).
- **Correctif proposé** : invalider systématiquement tout code non utilisé du même numéro/action à chaque nouvel envoi (comme `genererOtp`) ; supprimer la fenêtre de rejeu de 60 s ou la lier explicitement à la session/requête d'origine (pas à « n'importe quel appelant dans la minute ») ; restreindre la tolérance d'action aux cas documentés uniquement.

### AUD-063 — MOYEN — Inscription simultanée du même e-mail : HTTP 500 au lieu de 409 en cas de course
- **Preuve** : 12 inscriptions concurrentes avec le même e-mail produisent 1×`201`, 10×`409`, et **1×`500`** (violation de contrainte unique non interceptée — sonde A7).
- **Impact** : robustesse, pas de fuite ; une vraie tentative d'inscription peut occasionnellement essuyer une erreur serveur au lieu d'un message clair en cas de double-clic ou de rejeu réseau.
- **Fichiers** : `backend/routes/auth.js:22-86`.
- **Correctif proposé** : capturer le code d'erreur PostgreSQL `23505` sur l'`INSERT` et répondre `409 Email déjà utilisé` au lieu de laisser remonter au gestionnaire générique.

### AUD-064 — MOYEN — Aucune limite par compte sur les demandes de réinitialisation de mot de passe : bombardement de boîte mail
- **Preuve** : 15 demandes `POST /mot-de-passe-oublie` pour la même victime, émises depuis 15 adresses IP différentes (simulées), produisent **15 courriers envoyés** (sonde E12) — `limiterAuth` limite par IP, jamais par compte/destinataire.
- **Impact** : un attaquant qui connaît l'e-mail d'une victime peut inonder sa boîte de réception (nuisance, risque de classement en spam de tout le domaine `nopalou.com`, coût Resend).
- **Fichiers** : `backend/routes/auth.js:341-370` ; `backend/middlewares/rateLimit.js`.
- **Correctif proposé** : plafond additionnel par compte/destinataire (ex. 3 e-mails de reset / heure, indépendamment de l'IP source), en base ou en cache.

### AUD-065 — MOYEN — Aucune route de changement de mot de passe pour un utilisateur connecté ; impossible pour les comptes WhatsApp seuls
- **Preuve** : aucune des routes plausibles (`/changer-mot-de-passe`, `/change-password`, `/mot-de-passe`, `/modifier-mot-de-passe`, `/utilisateurs/mot-de-passe`) n'existe (sonde F1, 404 partout). Le seul chemin de changement de mot de passe passe par `/mot-de-passe-oublie` → e-mail. Or un compte créé uniquement par OTP WhatsApp porte un e-mail fictif (`<numéro>@whatsapp.nopalou.com`) qu'il ne consulte jamais : **il ne peut structurellement jamais définir de mot de passe utilisable**, et perd tout accès s'il perd son numéro de téléphone (aucune voie de secours, cf. `mot-de-passe-oublie` sur cette adresse fictive : réponse « succès » mais rien n'arrive nulle part).
- **Impact** : produit — un segment entier d'utilisateurs (inscription WhatsApp) n'a aucune méthode de récupération de compte si le numéro est perdu/changé/volé ; sécurité — impossible de faire adopter un mot de passe fort à ces comptes en marge du seul canal WhatsApp.
- **Fichiers** : `backend/routes/auth.js` (absence de route dédiée).
- **Correctif proposé** : ajouter `PUT /api/auth/mot-de-passe` (authentifié, exige l'ancien mot de passe ou un OTP de confirmation) ; pour les comptes WhatsApp-only, proposer explicitement dans le profil « Ajouter un e-mail et un mot de passe de secours » avec vérification réelle de l'adresse saisie.

### AUD-066 — MOYEN — Erreurs 500 non maîtrisées sur des entrées invalides (validation manquante côté identité)
- **Preuve regroupée** : `nom` de 5000 caractères à l'inscription → 500 (dépassement probable de colonne, sonde A4b) ; `mot_de_passe` de type tableau/objet/nombre/booléen à la connexion → 500 au lieu de 400 (`bcrypt.compare` reçoit un non-`string`, sonde B4) ; inscription WhatsApp sans `nom` → 500 (`NOT NULL` sur `utilisateurs.nom`, sonde O8). Dans tous les cas le message renvoyé reste générique (`Erreur serveur`), sans fuite de détail technique, mais le code de statut est incorrect et l'erreur est journalisée comme une exception non prévue plutôt qu'une validation.
- **Impact** : robustesse et qualité de journalisation (bruit dans les logs d'erreur, alertes admin déclenchées à tort sur incident « critique » — cf. journaux de la pile d'audit montrant des alertes admin de crash pour ces cas) ; pas d'accès non autorisé démontré.
- **Fichiers** : `backend/routes/auth.js` (validations `express-validator` à compléter : `body('nom').isString()`, `body('mot_de_passe').isString()`, borne de longueur sur `nom`).
- **Correctif proposé** : ajouter des validateurs de type et de longueur explicites sur `nom` et `mot_de_passe` sur toutes les routes d'identité (inscription e-mail, inscription/connexion WhatsApp), retour `400` uniforme.

## Fiches mineures (P3)

### AUD-067 — MINEUR — `normalizeEmail` modifie silencieusement l'adresse saisie (points/alias Gmail)
- **Preuve** : `marie.curie+boutique@gmail.com` et `moussa.ba-seck@yahoo.fr` sont stockés respectivement `mariecurie@gmail.com` et `moussa.ba@yahoo.fr` (sondes A6) ; le courrier de bienvenue part bien à l'adresse normalisée (qui reste généralement fonctionnelle pour Gmail/Yahoo, ces fournisseurs routant les variantes vers la même boîte), mais l'utilisateur n'est jamais informé que l'adresse qu'il a saisie a été modifiée.
- **Correctif proposé** : afficher côté frontend l'adresse réellement enregistrée après inscription, ou désactiver les options agressives de `normalizeEmail` (`gmail_remove_subaddress: false`, etc.) pour ne garder que la mise en minuscule.

### AUD-068 — MINEUR — Téléphone de profil accepté sans validation de format
- **Preuve** : `PUT /profil {telephone:'abc'}` répond `200` et stocke une chaîne vide après nettoyage des caractères non numériques (sonde G4).
- **Correctif proposé** : valider avec `normalisePhone` (déjà utilisé ailleurs dans le code) et rejeter (400) si le résultat est vide.

### AUD-069 — MINEUR — Réinitialisation de mot de passe opérationnelle sur des comptes suspendus/anonymisés
- **Preuve** : `POST /reinitialiser-mot-de-passe` change effectivement `mot_de_passe_hash` pour un compte `suspendu=true` ou `anonymise_le` renseigné (sonde E10) ; sans conséquence d'accès immédiate (la connexion reste bloquée par ailleurs) mais incohérent avec l'état métier du compte.
- **Correctif proposé** : vérifier `suspendu`/`anonymise_le` avant d'appliquer un nouveau mot de passe, répondre 403.

### AUD-070 — MINEUR — Énumération de compte par numéro de téléphone (`/whatsapp-otp-send`, type=login)
- **Preuve** : réponse `404 {code:'ACCOUNT_NOT_FOUND'}` explicite si le numéro n'est associé à aucun compte (sonde O1) — symétrique à AUD-022 (déjà acceptée pour l'e-mail, atténuée par le limiteur 20/15 min) mais plus explicite ici (code dédié).
- **Correctif proposé** : optionnel/produit — aligner sur le comportement e-mail (réponse uniforme) si l'énumération par téléphone est jugée plus sensible (ex. utilisée pour du harcèlement ciblé) ; sinon accepter comme risque résiduel documenté au même titre qu'AUD-022.

### AUD-071 — MAJEUR — Le jeton de session n'est jamais invalidé pour un compte anonymisé (purge RGPD)
- **Preuve** : `backend/middlewares/auth.js:45-62` (`verifierToken`) ne vérifie que `suspendu` ; il ne lit `anonymise_le` que pour armer `req.compteEnSuppression` (qui reflète en réalité `supprime_le`, pas `anonymise_le`) — aucune ligne ne rejette une requête portant un jeton valide pour un `id` dont `anonymise_le` est renseigné. Reproduit : un jeton émis avant la purge d'un compte (`POST /admin/utilisateurs/:id/purger`, ou tout `UPDATE ... anonymise_le=NOW()`) continue d'authentifier `GET /api/auth/profil` avec `200` après la purge (sonde C9b).
- **Impact** : la purge RGPD (Art. 17) — censée rendre un compte définitivement inexploitable — n'invalide pas les sessions déjà ouvertes tant que `jwt_version` ne change pas par ailleurs ; une session active au moment d'une purge administrative reste un moyen d'accès aux routes qui se contentent de `verifierToken` sans revérifier l'état du compte.
- **Fichiers** : `backend/middlewares/auth.js:45-62` ; `backend/routes/admin-utilisateurs.js:291-330` (`/purger`).
- **Correctif proposé** : dans `verifierToken`, rejeter (401/403) si `rows[0].anonymise_le` est renseigné ; et/ou incrémenter `jwt_version` dans la même transaction que `/purger` (déjà fait pour `suspendre`/suppression volontaire, manquant ici — à vérifier dans `admin-utilisateurs.js:291-330`).
- **Test de non-régression** : ouvrir une session, purger le compte côté admin, rejouer le jeton → doit être rejeté.

## Ce qui reste non vérifié dans ce périmètre
- Comportement réel du limiteur de débit (`limiterAuth`, `apiLimiter`) derrière le vrai proxy Render face à un `X-Forwarded-For` forgé (AUD-054) — dépend de la configuration réseau de production, non reproductible en local.
- Présence du même défaut d'échappement HTML (AUD-058) sur les autres surfaces affichant `nom` (commandes, admin, apporteur, avis) — seule la surface e-mail de bienvenue a été prouvée.
- Parcours desktop/mobile à proprement parler (rendu, ergonomie) : cet audit a porté sur la chaîne API/session/DB ; aucun test Playwright visuel n'a été exécuté dans ce lot (cohérent avec la couverture « NON FAIT » déjà notée en Phase 1 pour les parcours UI).
- Messages WhatsApp/SMS : le contenu et le routage ont été vérifiés (capture des appels sortants), mais pas la présentation réelle dans l'application WhatsApp cliente (rendu de template Meta).

---

# Phase 6 — Audit du parcours commercial (30 septembre 2026, nuit)

**Parcours audité** : Produit → Boutique → Recherche → Panier → Commande → WhatsApp → Paiement → Statut → Suivi. Chaîne exécutée : frontend (code du panier `useDrawerCartCheckout.ts`, non exécuté dans un navigateur, voir « Non vérifié ») → API (`/api/comptabilite/:id/commandes`, `/api/boutiques/commandes/express`, `/api/boutiques/:id/produits`, `PATCH …/commandes/:cmdId`, `/api/boutiques/commandes/suivi`, `/api/boutiques/:id/pos-vente`) → backend (`commande-service.js`, `comptabilite.js`, `boutiques-produits.js`, `boutiques-pos.js`, `paiement.js`) → PostgreSQL local (`commandes_boutique`, `commandes_boutique_items`, `boutique_produits`, `boutique_produit_variantes`, `boutique_promotions`, `boutique_caissiers`).

**Méthode** : pile isolée (PostgreSQL local :54329 base `nopalou_audit`, backend :4100, clés externes factices, garde réseau bouclée). Wave, WhatsApp et Telegram jamais atteints (le journal du backend montre `AUDIT-GUARD blocked api.wave.com` / `graph.facebook.com`). Deux marchands de test (M, N), 6 produits, 1 zone de livraison (2 500 F), 1 promo ; environ 45 requêtes de sonde par script (`scratch` de session, non commité) plus un test Jest isolé avec Wave simulé pour le virement automatique. Aucun code de l'application modifié. **Incident d'environnement (à connaître)** : `scripts/audit/.local/pgpass.txt` avait disparu ; avec l'accord explicite de l'utilisateur, le mot de passe du rôle `postgres` de l'instance locale :54329 a été réinitialisé (accès local `trust` temporaire puis `pg_hba.conf` restauré et confirmé : connexion sans mot de passe de nouveau refusée, 4 bases intactes). Procédure consignée dans `scripts/audit/README.md`, contrôle ajouté : `scripts/audit/check-pg.ps1`.

## Recoupement avec les livraisons déjà faites (obligatoire)
Commits du périmètre depuis le dernier rapport : `744272e0` (checkout express, AUD-010/011/013/040/042/044/045/046/047/048) et `c035d530` (AUD-014). Rejeu effectif :
- `tests/integration/commande-express-pipeline.integration.test.js` contre la base locale : **13/13** réussis. `tests/unit/stripe-webhook-signature.test.js` + `spec-02-checkout-upsell.test.js` : **11/11**.
- Sondes directes sur la route express : stock insuffisant → **409** ; article libre ou prix falsifié → refusé/re-tarifé (T1b, T2c) ; expiration des impayés et compensation d'échec Wave/Orange (couvertes par les 13 tests). Le cas « webhook Wave reçu sur une commande déjà annulée » (`paiement.js:465`) n'a pas de test : lu dans le code seulement, NON REJOUÉ.
- **Verdict : « recoupé, tenu » pour la route express uniquement.** Les correctifs AUD-010 et AUD-011 n'ont **pas** été appliqués à `POST /api/comptabilite/:boutiqueId/commandes`, qui est la route réellement appelée par le panier du site (`useDrawerCartCheckout.ts:278` et `:381`) et par le chatbot WhatsApp. Les fiches AUD-073 et AUD-074 sont donc des **fermetures incomplètes** d'AUD-011 et AUD-010, pas des doublons.
- AUD-051 (références `C-…` non reconnues par le suivi) : reconfirmé et **reclassé** (AUD-080) car ces références sont celles de la route principale.

## Synthèse des parcours (PASS = état cohérent entre interface, API, base et historique)
| Parcours | Résultat | Fiches |
|---|---|---|
| Création / modification produit | FAIL partiel | AUD-085 |
| Catalogue public, produit suspendu ou hors vente | FAIL | AUD-075 |
| Panier réel → commande (prix, stock, variantes) | FAIL | AUD-073, 074, 076 |
| Checkout express → commande | PASS sur stock/prix ; FAIL sur livraison et promo | AUD-084 |
| Paiement Wave (échec d'initialisation) | FAIL | AUD-083 |
| Encaissement et virement marchand | FAIL (P0 conditionnel) | AUD-072 |
| Changement de statut / annulation / frais | FAIL | AUD-077, 078 |
| Suivi client | FAIL | AUD-079, 080 |
| Notifications WhatsApp (contenu, destinataire, cadence) | FAIL partiel | AUD-082 |
| Caisse POS (accès sans session) | FAIL | AUD-081 |
| Orange Money, Stripe réels, rendu navigateur, chatbot WhatsApp | NON VALIDÉ — voir « Non vérifié » | — |

## Fiches

### AUD-072 — CRITIQUE (P0 conditionnel) — Virement Wave automatique déclenché sans paiement reçu, répétable, et commande laissée dans la liste des reversements admin
- **Preuve (PROUVÉ, test Jest isolé, Wave simulé)** : commande créée via `POST /api/comptabilite/:id/commandes` avec `methode_paiement: 'wave'` et un article fictif à 100 000 F. La session Wave échoue (commande `en_attente`, `paiement_recu = false`). Le marchand la passe à `livree` : `sendPayout` est appelé avec **98 000 F** vers le numéro de la boutique. Retour à `en_attente` puis nouveau `livree` : **second virement de 98 000 F** (la référence est la même, mais `Idempotency-Key` est un UUID neuf à chaque appel, `wave.js:202`). Après coup : `statut = livree`, `payout_ref = NULL`, `paiement_recu = false`, et la commande **figure dans la requête de `GET /admin/reversements-dus`** (`comptabilite.js:1971`), donc un troisième virement par l'écran admin reste possible (`payer` ne contrôle ni `paiement_recu` ni l'absence de virement automatique préalable, `:1984-2034`).
- **Cause racine (CODE)** : `comptabilite.js:1217-1231` n'exige pas `commande.paiement_recu = true`, ne marque pas la commande (`statut='reverse'`, `payout_ref`, `payout_date`), n'est pas idempotent, et la route `PATCH` accepte des transitions arbitraires (AUD-077). Combiné à AUD-073 (prix libre), le montant versé est choisi par le marchand.
- **Impact** : un marchand (compte gratuit suffisant) peut se faire virer de l'argent depuis le compte Wave Business de Nopalou sans aucun encaissement ; perte sèche, sans alerte. Le virement automatique échoue aujourd'hui en production si `payouts_api` n'est pas activé chez Wave (constat du 29/09 dans le journal : `403 no-permission`) : **le risque devient réel dès l'activation de cette permission** ou si `REVERSEMENT_AUTOMATIQUE_WAVE` est actif. État de la variable sur Render : NON DÉTERMINÉ.
- **Correctif recommandé** : (1) n'autoriser le virement que si `paiement_recu = true` et montant encaissé égal au total ; (2) verrouiller la commande (`SELECT … FOR UPDATE`), écrire `statut`/`payout_ref` avant l'appel et utiliser une `Idempotency-Key` dérivée de la commande (`payout_<id>`) ; (3) exclure de `reversements-dus` ce qui a un `payout_ref` ; (4) journaliser et alerter chaque virement. Effort : 0,5 j.
- **Test** : commande Wave non payée → `livree` → aucun appel `sendPayout` ; commande payée → un seul appel même après aller-retour de statut ; liste admin sans commande déjà virée.

### AUD-073 — MAJEUR — Prix fixé par le client sur la route du panier (AUD-011 non fermé)
- **Preuve (PROUVÉ)** : `POST /api/comptabilite/:id/commandes` avec `items:[{nom_produit:'Article libre', prix_unitaire:1}]` → **201, total 1 F** (`C-MUOICK9Q7199`). Même résultat avec le `produit_id` d'une **autre boutique** (prix réel 3 000 F) envoyé à 1 F → 201, total 1 F. Un produit de la boutique est bien re-tarifé (2 000 F, sonde T2c).
- **Cause (CODE)** : `commande-service.js:211-223` ne re-tarife que si le produit existe dans la boutique et ne refuse jamais un article sans produit valide (la boucle ne fait rien sinon).
- **Impact** : commande à montant arbitraire, avec Wave session pour ce montant ; condition d'exploitation de AUD-072. **Correctif** : refuser tout article sans `produit_id` valide appartenant à la boutique (comme `boutiques-commandes.js:191-197`) ; factoriser le calcul du panier dans un seul service partagé par les deux routes. **Test** : article libre → 400 ; produit d'une autre boutique → 400 ; panier normal → 201.

### AUD-074 — MAJEUR — Aucun contrôle de stock sur la route du panier (AUD-010 partiel)
- **Preuve (PROUVÉ)** : produit en stock 1, commande de 5 unités → **201**, total 5 000 F, stock ramené à 0 (`GREATEST(0, …)`). La même demande sur la route express est refusée (409).
- **Impact** : survente ; une seule personne peut mettre un produit hors vente ; le stock affiché cesse de refléter le réel. **Cause (CODE)** : `commande-service.js:372-381`. **Correctif** : verrouillage de ligne et refus (409) si `stock_quantite < quantité` (idem variantes). **Test** : stock 1, quantité 5 → 409, stock inchangé ; deux commandes concurrentes de la dernière unité → une seule acceptée.

### AUD-075 — MAJEUR — Produits suspendus, hors vente ou sans prix : visibles et commandables
- **Preuve (PROUVÉ)** : produit `statut_moderation = 'suspendu'` → `GET /api/boutiques/:id/produits` (anonyme) le renvoie (`visible: true`) et `POST …/express` l'accepte (201). Produit `en_stock=false` sans `stock_quantite` → commande acceptée sur les deux routes (201, 500 F). Produit sans prix → express 201 à **0 F** (`prix = Number(null) || 0`, `boutiques-commandes.js:168`).
- **Impact** : contournement de la modération admin (le journal du 28/09 annonce l'exclusion des produits suspendus, vraie pour l'accueil, pas pour la vitrine ni la commande) ; commandes à 0 F. **Correctif** : filtre `statut_moderation`, `en_stock`, `prix > 0`, boutique `actif` dans le catalogue public et dans les deux routes de commande. **Test** : suspendu → absent du catalogue public et commande 400/409.

### AUD-076 — MAJEUR — Prix et stock des variantes ignorés
- **Preuve (PROUVÉ)** : produit à 1 000 F avec variante « XL » à 5 000 F : commande avec `variante_id` → **1 000 F** sur la route du panier et sur la route express. Stock variante : décrémenté par le panier, **jamais par l'express** (`variante_id` codé `NULL`, `boutiques-commandes.js:294`).
- **Impact** : tout produit dont les variantes ont des prix différents est facturé au prix de base ; écart entre prix affiché (variante) et total enregistré. **Correctif** : résoudre la variante côté serveur (appartenance au produit, prix, stock). **Test** : variante 5 000 F → total 5 000 F ; stock variante décrémenté sur les deux routes.

### AUD-077 — MAJEUR — Statuts de commande sans machine d'états : stock restitué plusieurs fois, commande payée annulable sans trace
- **Preuve (PROUVÉ)** : stock 10, commande de 3 (→ 7). `annulee` → 10 ; `confirmee` → 10 (non redécrémenté) ; `annulee` → **13** ; `livree`, `en_attente` acceptés. Stock final **13 pour une commande encore ouverte**, donc 3 unités fantômes. Une commande `paiement_recu = true` passe à `annulee` (200) sans marqueur de remboursement ni alerte ; `payee` n'est pas un statut acceptable par l'API (400) alors que le webhook l'écrit.
- **Cause (CODE)** : `comptabilite.js:999-1025` ne vérifie aucune transition et teste `ancienStatut !== 'annulee'` au lieu d'un état « stock déjà restitué » ; `STATUTS_VALIDES` (`commande-service.js:7`) ne contient pas `payee` (AUD-043). **Correctif** : table de transitions autorisées, stock restitué une fois (transaction + indicateur), refus ou alerte d'annulation d'une commande encaissée, `payee` et `reverse` dans le vocabulaire. **Test** : cycle annuler/réactiver ne change le stock qu'une fois ; `livree → en_attente` refusé.

### AUD-078 — MAJEUR — `PATCH` du seul `frais_livraison` : erreur 500 après écriture, client jamais prévenu
- **Preuve (PROUVÉ)** : `PATCH /api/comptabilite/:id/commandes/:cmd {"frais_livraison":9000}` → **500**, alors que la base est modifiée (frais 9 000, total 2 000 → 11 000) ; y compris sur une commande déjà payée (`paiement_recu=true`, total modifié a posteriori).
- **Cause (CODE)** : `comptabilite.js:1368` exécute `req.body.statut.toUpperCase()` alors que `statut` est absent ; l'exception est attrapée en 500 après l'`UPDATE`. La fonction « fixer le tarif de livraison » livrée le 30/09 (journal : « Ajustement Backend des Frais de Livraison ») ne fonctionne donc pas.
- **Impact** : le marchand voit une erreur alors que le montant a changé, le client n'est ni notifié ni relancé (Wave) ; une commande payée voit son total changer, ce qui fait échouer ensuite tout contrôle de montant. **Correctif** : gérer `statut` absent, refuser la modification des frais d'une commande payée, notifier le client. **Test** : PATCH frais seul → 200 + message client ; commande payée → 409.

### AUD-079 — MAJEUR — Suivi public : joker `ILIKE` ouvrant toutes les boutiques
- **Preuve (PROUVÉ)** : `GET /api/boutiques/commandes/suivi?ref=CMD-%` (anonyme) → 200, 5 commandes ; `ref=CMD-20260930-N0B%` renvoie la commande de la **boutique N** (produit « 1x PN autre boutique », 3 000 F, statut, nom de boutique) sans en connaître la référence.
- **Cause (CODE)** : `boutiques-commandes.js:549` `c.reference ILIKE $1` avec la saisie brute ; `CMD-%` passe le test `startsWith('CMD-')`.
- **Impact** : énumération des commandes de toutes les boutiques (produits, montants, statuts, noms de boutique ; téléphone et nom masqués) par tout internaute. **Correctif** : égalité stricte (`=`), échapper `%`, `_`, `\`, limiter aux références bien formées, limiteur par IP. **Test** : `CMD-%` → 400/404 ; référence exacte → 200.

### AUD-080 — MAJEUR — Le client ne peut pas suivre une commande passée depuis le panier (réévaluation d'AUD-051)
- **Preuve (PROUVÉ)** : référence réelle `C-MUOICK7KC158` (route du panier) → `GET …/suivi?ref=C-MUOICK7KC158` → **404**. La référence express `CMD-…` → 200. Le message WhatsApp de confirmation envoie pourtant vers `suivi-commande?ref=<référence>` (`comptabilite.js:897`).
- **Cause (CODE)** : `boutiques-commandes.js:531` n'accepte que `CMD-`, `PAY-`, `V-` et UUID. **Correctif** : accepter `C-` (ou unifier le format) ; test de bout en bout lien WhatsApp → page de suivi.

### AUD-081 — MAJEUR — Caisse POS : un code PIN de caissier suffit, sans session, sans verrouillage
- **Preuve (PROUVÉ)** : `POST /api/boutiques/:id/pos-vente` sans jeton : 120 PIN erronés → 120 × 403 (aucun 429, aucun verrouillage) ; le PIN correct `9876` → **201**, vente `POS-425049` enregistrée, stock décrémenté, prix unitaire choisi par l'appelant (1 F).
- **Cause (CODE)** : `boutiques-pos.js:110-116` : `superviseur_pin` remplace l'authentification ; PIN de 4 à 6 chiffres (`boutiques-equipe.js:227`) stocké en clair (`boutique_caissiers.code_pin`) ; l'identifiant de boutique est public ; seul le limiteur global (1 000 requêtes/15 min/IP) freine.
- **Impact** : un tiers qui connaît l'identifiant d'une boutique peut retrouver un PIN à 4 chiffres (≤ 10 000 essais ; le seul frein mesuré est le limiteur global de 1 000 requêtes/15 min/IP, non contourné ici) et enregistrer de fausses ventes (comptabilité, TVA, stock, fidélité). **Correctif** : exiger la session ou le jeton de terminal ; le PIN n'autorise qu'une action supervisée dans une session existante ; hacher le PIN ; verrouillage progressif par boutique et par IP. **Test** : PIN seul → 403 ; 5 échecs → 429.

### AUD-082 — MOYEN — Création de commande anonyme sans limiteur propre : saturation du pool et messages vers des tiers
- **Preuve (PROUVÉ)** : 60 commandes anonymes simultanées sur la route du panier → **28 × 201 et 32 × 500** (`timeout exceeded when trying to connect` dans le journal : pool de connexions saturé). Aucun 429. Chaque commande envoie un message WhatsApp (repli SMS observé : `Vers +221770008888`) au numéro saisi par l'appelant, sans preuve de propriété.
- **Impact** : indisponibilité du paiement pour les clients légitimes, bourrage de la base, messagerie de la plateforme utilisable pour contacter n'importe quel numéro (même famille qu'AUD-027). **Correctif** : limiteur dédié (par IP et par téléphone) sur la route, comme `limiterCommandeExpress`, et plafond de connexions par requête. **Test** : rafale de 60 → 429 au-delà du seuil, aucune 500.

### AUD-083 — MOYEN — Échec Wave sur le panier : le client n'est pas informé, la commande est annulée seule 2 h plus tard
- **Preuve (PROUVÉ pour l'API, CODE pour l'interface)** : initialisation Wave impossible → **201** `fallback_manuel: true`, `numero_depot: "777202086"` (numéro d'administration), commande `en_attente` et stock consommé. `useDrawerCartCheckout.ts` ne lit jamais `fallback_manuel` (aucune occurrence dans ce fichier) : le client voit « commande enregistrée » sans instruction de paiement ; le cron `cron-commandes-impayees` annule la commande après 2 h (`commande-service.js:474`).
- **Correctif** : afficher le paiement manuel, ou annuler tout de suite comme la route express (`compenserEchecPaiement`). Décision métier : numéro de dépôt affiché au client (propriétaire : direction).

### AUD-084 — MOYEN — Route express : frais de livraison fixés par le client, promotion « livraison offerte » mal appliquée
- **Preuve (PROUVÉ)** : zone réelle à 2 500 F ; `frais_livraison: 0` envoyé → total 2 000 F (la route ne reçoit aucune zone ; `boutiques-commandes.js:132`). Promo `livraison_offerte` (valeur 2 500) avec livraison 2 500 et panier 2 000 : route panier **2 000 F** (correct), route express **2 500 F** (la remise est retirée du prix des articles, `:235`).
- **Impact** : le marchand supporte un transport non payé ; le client est surfacturé de la remise promise. **Correctif** : résoudre zone et type de promotion dans le service commun (voir AUD-073).

### AUD-085 — MOYEN — Modification d'un produit : champs effacés et stock écrasé
- **Preuve (PROUVÉ)** : `PUT …/produits/:id {"prix":2100}` → 200, **description remise à NULL** (`boutiques-produits.js:315`, `description||null`). Stock 10 → commande de 4 (→ 6) → enregistrement d'une fiche ouverte avant la commande (stock saisi 10) → stock **10** : les 4 unités vendues sont « rendues ».
- **Correctif** : mise à jour partielle (`COALESCE`), comparaison de version (`updated_at`) ou opération de stock relative. **Test** : PUT partiel conserve la description ; écriture de stock obsolète refusée (409).

### AUD-086 — MINEUR — Verrou « anti double soumission » trop large
- **Preuve (PROUVÉ, par accident de sonde)** : deux commandes de produits différents, même téléphone et même montant à moins de 5 s → la seconde renvoie la **première commande** (aucune création, aucun stock décrémenté, `commande-service.js:304-317`). Le message de notification est renvoyé deux fois. **Correctif** : clé d'idempotence explicite envoyée par le client.

## Non vérifié dans cette phase (et pourquoi)
- **Interface** : aucun test navigateur (Playwright) du panier, de l'écran marchand des commandes et de la page de suivi n'a été exécuté ; le frontend n'a pas été démarré. Les constats AUD-080, AUD-083 sont prouvés côté API, le comportement d'écran est lu dans le code. **NON VALIDÉ — rendu non exécuté dans cette passe.**
- **Orange Money, Stripe, Wave réels** : simulés ou bloqués ; seules la signature des webhooks et les montants (tests existants) ont été rejoués. Le virement Wave réel n'a pas été testé.
- **Chatbot WhatsApp** (`whatsapp-chatbot.js`, commande par conversation) : appelle `creerCommandeBoutique`, donc exposé à AUD-073/074/075 par lecture de code ; le flux conversationnel n'a pas été exécuté.
- **Données réelles** : cet audit n'a pas utilisé `nopalou_audit_data` ; l'ampleur en production des cas ci-dessus (commandes à prix libre, stocks incohérents) n'est pas mesurée. La partie « incohérences existantes » d'AUD-037 reste valable.
- **Notifications** : contenu et destinataires vérifiés dans le journal du backend ; livraison réelle WhatsApp non testable (garde réseau).
- **Performance du panier sous charge réelle** : un seul test de rafale (60 requêtes), machine de développement.

## Statut des corrections de la Phase 6 (30 septembre 2026, nuit)
| Fiche | Statut | Preuve |
|---|---|---|
| AUD-072 | corrigé | `commande-panier.integration.test.js` (virement seulement si encaissé, une fois ; liste admin) |
| AUD-073, 074, 075, 076 | corrigé | même fichier (prix serveur, 409 surstock + concurrence, suspendu/hors vente/sans prix, variantes) |
| AUD-077, 078 | corrigé | même fichier (cycle de statuts, trace de remboursement, frais seuls) |
| AUD-079, 080 | corrigé | même fichier (jokers refusés, référence `C-…` suivie) |
| AUD-081 | corrigé pour `pos-vente`, `pos-incident` et `boutiques-equipe.js` (4 routes) ; **reste ouvert** : verrouillage des essais de PIN | même fichier |
| AUD-082 | partiellement corrigé : limiteur ajouté (inactif hors production, donc rafale non rejouée) ; saturation du pool non traitée | lecture de code |
| AUD-083 | corrigé (annulation + 502) ; le message affiché côté panier n'a pas été vérifié dans un navigateur | test d'intégration API |
| AUD-084 | corrigé, y compris Club VIP : palier réel côté serveur (`lib/clubVip.js`), facturé = affiché, reversement marchand non pénalisé ; coût pour Nopalou à valider | pipeline express + panier + test Club VIP |
| AUD-085 | corrigé | même fichier |
| AUD-086 | corrigé (critère : mêmes articles et même montant) | même fichier |