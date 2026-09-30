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

