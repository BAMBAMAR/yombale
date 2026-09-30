# Plan de correction NOPALOU — 30 septembre 2026

Source : `docs/AUDIT-NOPALOU-2026-09-30.md` (39 fiches). Aucun code modifié pour produire ce plan. Les causes ont été revérifiées par lecture de code ou exécution ponctuelle sur l'environnement d'audit isolé. Le tableau de couverture du haut du rapport d'audit est périmé (les lignes « NON FAIT » ont été traitées en phase 3).

Légende cause : **D** = cause démontrée ; **P** = partiellement démontrée ; **C** = à confirmer (investigation indiquée) ; **NON DÉTERMINÉ** = ne pas corriger avant investigation.

## 0. Constats ajoutés pendant la préparation du plan (preuves)

| ID | Gravité | Constat | Preuve |
|---|---|---|---|
| AUD-040 | MAJEUR | Paiement Orange Money du checkout express : la notification de paiement est envoyée vers une route qui n'existe pas. | `boutiques-commandes.js:400` appelle `createWebPayment({amount,currency,order_id})` sans `notif_url` ; `services/orange-money.js:70` prend alors `/api/paiements/orange-money/webhook` ; l'énumération des 1 292 routes ne contient que `POST /api/paiement/orange/webhook`. |
| AUD-041 | MAJEUR | Un super_admin désactivé ou supprimé garde l'accès administrateur jusqu'à 7 jours. | Exécuté : après `PUT /api/admin/equipe/:id {actif:false}` puis `DELETE`, `GET /api/admin/auth/me` reste 200 avec le jeton d'un `super_admin` ; le rôle `finance` est bien révoqué (401). Cause : `middlewares/admin-rbac.js:126-135` accorde `super_admin` d'après le rôle écrit dans le jeton quand la ligne est absente ou inactive. |
| AUD-042 | MAJEUR | Un paiement Wave légitime est rejeté comme « fraude montant » dès qu'il y a des frais de livraison, un code promo ou plusieurs articles ; la commande reste impayée. | Exécuté : commande 18 500 F + 1 500 F de frais, webhook signé `amount=20000` → journal « FRAUDE MONTANT reçu 20000 attendu 18500 », commande `en_attente`, `paiement_recu=f` (`CMD-20260930-3C970F`). Cause : `paiement.js:457-473` compare `data.amount` au `montant_total` d'une seule ligne (`rows[0]`), or `boutiques-commandes.js:256` stocke `item.totalLigne` (sans frais ni remise) et la session Wave est créée avec `totalGeneral` (l.273). |
| AUD-043 | MINEUR | Vocabulaire de statuts incohérent : `attente_paiement` est lu par `relance-panier.js:44` mais absent de `STATUTS_VALIDES` (`commande-service.js:7`). | Lecture de code ; aucune écriture de ce statut trouvée (P). |
| AUD-044 | CRITIQUE | Un panier de 2 articles ou plus échoue en HTTP 500 sur le checkout express. | Exécuté : 2 articles → 500, journal `commandes_boutique_reference_key` ; la migration définit `reference VARCHAR(100) UNIQUE NOT NULL` (`migrate-inline.js`, bloc `commandes_boutique`), alors que `boutiques-commandes.js:247-262` insère une ligne par article avec la même `ref`. Le modèle prévu (en-tête + `commandes_boutique_items`, `groupe_commande`) existe déjà et sert à `commande-service.js:331-351`. Snapshot de production du 24/09 : 99 lignes, 99 références distinctes, 0 `groupe_commande`. Appelants : `useCommander.ts:275`, `useDrawerCartCheckout.ts:121`. La présence de la contrainte en production actuelle est à confirmer par `\d commandes_boutique` (très probable). |

Incident hors code : un message Telegram factice a pu partir pendant l'audit (AUD voir rapport, « Incident d'isolation ») : action humaine, vérifier l'historique du bot.

---

## 1. RÉSUMÉ DU PLAN

- 42 problèmes à traiter (37 fiches initiales + AUD-040 à 044) ; `AUD-IDOR-RESTE` est clos (contrôles d'accès prouvés par les tests ciblés).
- 9 corrections racines (CR-01 à CR-09) résolvent 31 des 42 problèmes ; 11 restent unitaires.
- 9 phases (0 à 8). Les phases 1 et 2 (sécurité exploitable et chaîne commande/paiement) précèdent tout le reste.
- Aucune correction n'est validée sans test exécuté (section 12).

## 2. NOMBRE TOTAL : 42

## 3. RÉPARTITION PAR GRAVITÉ

| Gravité | Nombre | IDs |
|---|---|---|
| CRITIQUE | 4 | 010, 025, 026, 044 |
| MAJEUR | 14 | 001, 002, 011, 012, 018, 019, 020, 027, 028, 029, 031, 040, 041, 042 |
| MOYEN | 16 | 003, 004, 005, 006, 013, 014, 015, 016, 021, 024, 030, 032, 033, 034, 037, 038 |
| MINEUR | 8 | 007, 017, 022, 023, 035, 036, 039, 043 |

## 4. RÉPARTITION PAR PRIORITÉ

| Priorité | Nombre | IDs | Justification |
|---|---|---|---|
| P0 | 9 | 025, 026, 027, 029, 041, 010, 011, 042, 044 | sécurité exploitable sans compte ou avec compte gratuit ; perte de vente ou d'encaissement constatée |
| P1 | 12 | 028, 030, 012, 018, 019, 040, 031, 013, 014, 020, 001, 002 | autorisation, fonctions cassées, filet de sécurité (tests, schéma, sauvegarde) |
| P2 | 12 | 003, 004, 005, 015, 016, 021, 024, 032, 033, 034, 037, 038 | durcissement, performance, SEO, dette à risque |
| P3 | 9 | 006, 007, 017, 022, 023, 035, 036, 039, 043 | améliorations de qualité |

## 5. PROBLÈMES BLOQUANTS (à traiter avant toute mise en production d'autres changements)
025, 026, 027, 010, 044, 042, 011, 029, 041. AUD-020 (tests rouges) bloque la validation des autres corrections : réparer d'abord les mocks de `verifierToken`.

## 6. CAUSES RACINES COMMUNES

| CR | Cause | Problèmes résolus |
|---|---|---|
| CR-01 | JSON-LD injecté sans échappement de `<` ; CSP sans nonce effectif | 025, 024 (partie CSP) |
| CR-02 | Routes publiques sans authentification ni limite adaptée | 026, 027, 014, 015, 016 |
| CR-03 | Chaîne commande/paiement sans autorité serveur ni cohérence de modèle (une ligne par article, montants partiels, pas de compensation) | 010, 011, 040, 042, 044, 013 (montant Stripe), 037 (drapeau de paiement), 043 |
| CR-04 | RBAC non appliqué route par route ; secrets et sessions admin mal gouvernés | 028, 029, 030, 041 |
| CR-05 | Schéma géré hors migrations (manquants, DDL dans les handlers, sauvegarde non alignée) | 001, 002, 031, 032, 007 |
| CR-06 | Requêtes écrites sans test contre le schéma réel | 018, 019 |
| CR-07 | Filet de sécurité : tests désynchronisés, non hermétiques, garde-fous non bloquants | 020, 036, 006 |
| CR-08 | Erreurs avalées, pas de journal | 017, 012 (catch muet), 023 |
| CR-09 | Dépendances et configuration d'exécution | 033, 004, 003, 005 |

Unitaires : 012 (arguments inversés), 021, 022, 034, 035, 038, 039.

## 7. CORRECTIONS STRUCTURELLES (à créer une fois, réutilisées)
- **CS-1** `frontend-next/src/lib/jsonld.ts` (à créer) : `safeJsonLd(obj)` = `JSON.stringify` + remplacement de `<`, `>`, `&`, U+2028, U+2029 par leurs séquences `\uXXXX`. Utilisé par `components/JsonLd.tsx` (13 utilisateurs) et par tous les sites bruts.
- **CS-2** `backend/lib/safeFetch.js` (à créer) : requête sortante sûre (résolution DNS, refus des IP privées/réservées IPv4 et IPv6, IP épinglée, redirections revalidées, taille et durée limitées).
- **CS-3** Modèle de commande unique : en-tête `commandes_boutique` (total complet) + `commandes_boutique_items` (lignes), utilisé par le checkout express comme par `commande-service.js`.
- **CS-4** Garde RBAC systématique : `requireAdminPermission` (existe dans `admin-rbac.js`) sur chaque route admin, avec un test généré depuis l'inventaire des routes.
- **CS-5** Schéma de référence versionné : migration de base issue d'un `pg_dump --schema-only` de production, plus un test « base vide + migrations = schéma de production ».

---

## 8. FICHES DE CORRECTION

Format de chaque fiche : constat et preuve renvoient à l'audit ; les champs non listés (impact détaillé) sont identiques à ceux de la fiche d'audit correspondante.

### CR-01 — JSON-LD sûr et CSP réelle (AUD-025, AUD-024 partie CSP)
- **Titre/Module** : XSS stocké pages publiques / Frontend SEO. **Gravité** CRITIQUE. **Priorité** P0. **Cause** D.
- **Constat/Preuve** : `window.__XSS_PROOF===1` dans Chromium sur `/boutiques/<slug>` et `/boutiques/<slug>/produits/<id>` après `POST /api/boutiques/:id/produits` avec `nom = X</script><script>…`.
- **Cause racine** : `dangerouslySetInnerHTML={{__html: JSON.stringify(...)}}` sans échappement (38 fichiers contiennent `dangerouslySetInnerHTML`) ; `middleware.ts:97` garde `script-src 'unsafe-inline' 'unsafe-eval'` et le nonce de la ligne 93 n'est jamais injecté.
- **Impact** : utilisateur (JS arbitraire sur des pages de confiance), métier (hameçonnage, réputation), technique (surface XSS sur toute donnée marchande).
- **Correction / objectif** : le JSON-LD ne peut plus fermer la balise `<script>` ; la CSP bloque les scripts inline non autorisés.
- **Étapes** :
  1. Créer CS-1 et écrire son test unitaire (entrées : `</script>`, `<!--`, `&`, U+2028).
  2. Modifier `components/JsonLd.tsx` pour l'utiliser.
  3. Remplacer les usages bruts JSON-LD : `agences/[slug]/page.tsx:109`, `alternative-shopify-senegal/page.tsx:74`, `annonces/[id]/page.tsx` (constructeur l.97 et l.266), `boutiques/[id]/blog/[slug]/page.tsx:126`, `boutiques/[id]/page.tsx:219`, `boutiques/[id]/produits/[produitId]/page.tsx:193,197`, `categorie/[slug]/[sousCategorie]/page.tsx:129`, `categorie/[slug]/page.tsx:192,197`, `creer-boutique-en-ligne/page.tsx:93,97`, `creer-boutique/layout.tsx:146,150`, `gestion-stock-carnet-dettes/page.tsx:73`, `guide-creer-boutique/page.tsx:94,98`, `guide-sourcing-revente/page.tsx:104,105`, `immo/ImmoLanding.tsx:63`, `immo/[id]/page.tsx:480` (constructeur), `immo/page.tsx:169`, et les pages restantes de la liste des 38 (`layout.tsx`, `logiciel-caisse-senegal`, `logiciel-gestion-locative-senegal`, `paiement-en-ligne-senegal`, `partenaires`, `produit/[id]`, `promo`, `sama-xaalis`, `tarifs-boutique`, `telecom/[id]`, `telecom/page`, `vendre-sur-whatsapp`) : ouvrir chacune pour confirmer qu'elle émet bien du JSON-LD.
  4. Examiner séparément les usages non JSON-LD (QR/SVG : `PosFideliteModal.tsx:265`, `PosPairageModal.tsx:146`, `PosTicketPrintView.tsx:224`, `CarnetClientQrPassCard.tsx:63`, `ModalImprimerCodeBarres.tsx:414`, `ModalBoutiqueCreeeSucces.tsx:213`, `QrCodeShareModal.tsx`, `AbonnementClient.tsx:81` style, `SocialPostMediaViewer.tsx:125` déjà filtré) : vérifier qu'aucune donnée utilisateur n'entre non encodée dans le SVG.
  5. CSP : passer d'abord en `Content-Security-Policy-Report-Only` avec nonce (`script-src 'self' 'nonce-…' 'strict-dynamic'` et liste actuelle des tiers) ; propager le nonce (`x-nonce`, déjà posé dans `requestHeaders`) aux `<Script>` (GTM dans `layout.tsx`), collecter les violations une semaine, corriger, puis passer en mode bloquant.
  6. Défense en profondeur côté API : limiter longueur et caractères de contrôle des noms ; ne pas retirer `<` des contenus légitimes.
- **Fichiers** : ceux ci-dessus + `frontend-next/src/middleware.ts`, `frontend-next/src/components/JsonLd.tsx`. **Routes** : `/boutiques/[id]`, `/boutiques/[id]/produits/[produitId]`, `/annonces/[id]`, `/immo/[id]`, `/agences/[slug]`… **API** : `POST /api/boutiques/:id/produits`, `PUT /api/boutiques/:id`. **Tables** : `boutiques`, `boutique_produits`, `annonces_classifiees`, `annonces_immo`. **Migration** : aucune. **Config** : en-tête CSP.
- **Dépendances** : CS-1 indépendant ; l'étape 5 dépend de l'étape 3.
- **Risque de régression** : élevé pour l'étape 5 (GTM, Instagram/TikTok/Facebook embeds, scripts inline Next, thème). **Stratégie** : Report-Only d'abord, bascule par en-tête.
- **Critères d'acceptation / test** : recréer le produit `X</script><script>window.__XSS_PROOF=1</script>` → ouvrir les 3 URL dans Chromium → `window.__XSS_PROOF` est `undefined` ; le HTML rendu ne contient aucun `</script>` issu des données ; le JSON-LD reste valide (outil de test de données structurées ou `JSON.parse` du contenu du script).
- **Régression** : pages produit/boutique/annonce/immo/agence sur mobile et desktop ; GTM charge ; embeds sociaux ; SEO (JSON-LD présent, même contenu décodé) ; pas de violation CSP bloquante.

### CR-02 — Surface publique sans garde (AUD-026, 027, 014, 015, 016)

**AUD-026 SSRF `magic-import`** — CRITIQUE, P0, cause D.
- Preuve : `http://[::1]:4555/produit` → contenu interne renvoyé sans jeton. Contournements : `[::1]`, `[::ffff:127.0.0.1]`, `[fd00::1]`, `100.64.0.1`, `localtest.me`.
- Cause : filtre par regex sur le nom d'hôte (`services/magic-import.js:22-55`), pas de résolution DNS, pas de contrôle des redirections ; route sans authentification (`boutiques-crud.js:218`, `limiterImport`).
- Étapes : (1) créer CS-2 ; (2) `validateSafeUrl` appelle CS-2 ; (3) ajouter `verifierToken` à la route (le proxy `frontend-next/src/app/api/boutiques/magic-import/route.ts` doit transmettre le cookie ou l'en-tête, à vérifier) ; (4) limiteur par utilisateur ; (5) recenser tous les appels sortants dont l'URL vient d'un utilisateur (`axios`, `fetch`, `page.goto`) : NON DÉTERMINÉ tant que ce recensement n'est pas fait (le crawler admin `POST /api/prospection/crawler-ai` est à inclure) ; (6) retirer l'import inutile de `scrapeProductFromUrl` dans 10 autres fichiers de routes (lecture : importé mais inutilisé, à confirmer).
- Fichiers : `backend/services/magic-import.js`, `boutiques-crud.js`, `backend/lib/safeFetch.js` (à créer), proxy Next. Dépendance : `axios` vulnérable (AUD-033).
- Acceptation : les 5 URL ci-dessus, `http://127.0.0.1`, une URL qui redirige vers une IP privée et un nom qui résout vers une IP privée (résolveur simulé) sont refusés ; un lien produit public normal est importé ; sans jeton → 401.
- Régression : import de produits par un marchand connecté ; admin-migration qui réutilise le service.

**AUD-027 Relais WhatsApp anonyme** — MAJEUR, P0, cause D.
- Preuve : `POST /api/whatsapp/send` sans jeton atteint `graph.facebook.com`. Appelants légitimes : `components/BoutonWhatsApp.tsx:28` (connecté : envoie `{type,id}` sans téléphone) et `ModalWhatsApp.tsx:30` (visiteur : saisit un numéro).
- Cause : `whatsapp.js:207` en `tokenOptional`, le numéro du corps est accepté sans preuve de propriété.
- Étapes : (1) immédiat : ignorer `phone` du corps ; si non connecté → 401 ; (2) limiteur par compte (5/h) et par destinataire (3/jour), plafond global journalier ; (3) contrôle `estDesinscrit` ; (4) journal dans `security_audit_vault` ; (5) décision produit pour le visiteur : OTP réutilisant `services/otp.js` et les routes `whatsapp-otp-send/verify` de `auth.js`, sinon retirer la fonction pour les anonymes.
- Fichiers : `backend/routes/whatsapp.js`, `backend/services/whatsapp.js` (`sendFiche`), `BoutonWhatsApp.tsx`, `ModalWhatsApp.tsx`. Tables : `security_audit_vault`, `utilisateurs`.
- Acceptation : anonyme → 401 ; connecté → message vers son seul numéro ; 6e envoi en une minute → 429 ; numéro désinscrit ignoré.
- Régression : bouton « Recevoir par WhatsApp » connecté ; chatbot entrant inchangé.

**AUD-014 Informations internes publiques** — MOYEN, P1, D. Protéger par `requireAdminAuth` : `GET /api/scraper/status`, `/facebook/progress`, `/sites`, `GET /api/paiement/server-ip`, `GET /api/whatsapp/health` (`routes/scraper.js`, `paiement.js`, `whatsapp.js:200`) ; supprimer `details: err.message` des 500 des webhooks (`paiement.js` Wave/Stripe/Orange). Vérifier d'abord que `/api/whatsapp/health` et `/health` ne servent pas à une supervision externe (Render utilise `/health`, à conserver). Test : 401 anonyme, 200 admin ; la réponse 500 d'un webhook ne contient plus `details`.

**AUD-015 Alias de routes** — MOYEN, P2, D. Aucun appelant frontend trouvé pour `/api/(promotions|devises|paiements)` ; usages réels : tests (`tests/unit/spec-master-exhaustive.test.js:31-33`) et routes documentées `/api/devises/taux`, `/api/promotions/valider`, `/api/paiements/stripe/simuler` (`boutiques-crud.js:25,1294`, `boutiques-fidelite.js:334`). Plan : journaliser les accès aux alias deux semaines (en-tête `Deprecation`), déclarer explicitement les trois routes utiles sous leur préfixe, retirer le montage générique (`app.js:315-317`), mettre à jour les tests. Dépend de AUD-040 (la valeur par défaut Orange utilise le préfixe `paiements`). Test : les trois routes utiles répondent ; `GET /api/paiements/:id/produits` → 404 JSON `{success:false,error:'Not Found'}`.

**AUD-016 Limiteur contournable** — MOYEN, P2, D. `app.js` (`apiLimiter.skip`) utilise `req.path.includes(...)`. Remplacer par des chemins exacts : `/paiement/wave/webhook`, `/paiement/stripe/webhook`, `/paiement/orange/webhook`, `/whatsapp/webhook`, `/health`. Donner à `/analytics/event` et `/boutiques/:id/scanner-remote` leur propre limiteur. Risque : bloquer les webhooks ; test avec webhooks signés et 1 001 requêtes. Exploitation de `analytics/event` avec charge utile valide : NON DÉTERMINÉ (à mesurer avant/après).

### CR-03 — Chaîne commande/paiement (AUD-044, 010, 011, 042, 040, 013, 037, 043)
**Objectif** : une commande = un en-tête au total complet + des lignes ; le prix vient du serveur ; le stock n'est consommé que si la commande est viable ; le webhook compare le bon montant.

**AUD-044 Panier multi-articles en 500** — CRITIQUE, P0, cause D (reproduite sur schéma des migrations ; prod à confirmer).
- Étapes : (1) Phase 0 : lire `\d commandes_boutique` en production pour confirmer `UNIQUE(reference)` ; (2) choisir le modèle : en-tête `commandes_boutique` (une ligne par référence, `montant_total` = total complet, articles dans `commandes_boutique_items`) comme `commande-service.js:331-351` ; (3) réécrire la boucle d'insertion de `boutiques-commandes.js:247-262` ; (4) vérifier les lecteurs de `commandes_boutique` qui supposent une ligne-article : `admin-commandes.js:44,99`, `comptabilite.js:1029`, `CommandeCard.tsx`, exports comptables, `relance-panier.js` ; (5) traiter aussi `nom_produit`/`produit_id` de l'en-tête (colonnes NOT NULL/uniques à vérifier).
- Acceptation : panier de 3 articles, total avec frais → 201 ; 1 en-tête + 3 lignes en base ; affichage dans l'espace marchand, l'espace client et l'admin ; total cohérent partout ; stock décrémenté de chaque article.
- Risque : élevé (modèle de données partagé). Migration additive seulement ; pas de suppression de colonnes ; drapeau `ORDER_MODEL_V2` ; rollback = drapeau désactivé (l'ancien chemin n'est utilisable que pour 1 article).

**AUD-010 Stock vidable** — CRITIQUE, P0, D. Preuve : stock 10 → 0 avec 4 commandes Wave échouées. Cause : COMMIT (`boutiques-commandes.js:265`) avant l'appel Wave (l.371), aucune compensation (l.387-393), aucune expiration.
- Étapes : (1) ajouter `expires_at TIMESTAMPTZ` à `commandes_boutique` (migration additive) ; (2) pour les modes numériques, renseigner `expires_at = NOW() + N minutes` ; (3) en cas d'échec de création de session (Wave, Orange, Stripe), annuler la commande (`statut='annulee'`) et restituer le stock dans une seule transaction idempotente (`UPDATE … WHERE statut='en_attente' AND paiement_recu=false RETURNING`) ; (4) tâche périodique qui fait de même pour `expires_at` dépassé (à déclarer dans `demarrerCronsMetier`, emplacement exact du planificateur à confirmer) ; (5) ne jamais expirer les commandes espèces/livraison.
- Acceptation : Wave simulé en échec → 4xx, stock inchangé, aucune commande `en_attente` ; commande Wave non payée → annulée et stock restitué après expiration ; commande payée ensuite par webhook tardif : pas de double restitution (à spécifier : refuser ou ré-allouer).
- Régression : commande cash, Wave réussie, Orange, Stripe, stock POS, relances de panier (`relance-panier.js:44`).

**AUD-011 Prix client** — MAJEUR, P0, D. `boutiques-commandes.js:183-185` : sans `produit_id` valide, `prix = art.prix_unitaire`. Les champs `montant_reduction` et `remise` sont destructurés (l.101) mais non utilisés dans le calcul : pas de fraude constatée de ce côté (le test 4 n'avait pas abouti pour cause de stock ; relire avant clôture). Correction : refuser (400) toute ligne sans `produit_id` UUID valide appartenant à la boutique ; remplacer le test `length === 36` (l.149) par une vraie validation UUID. `frais_livraison` (l.103, `Math.max(0, …)`) vient du client : comparer à la zone de livraison quand elle existe (le cas « frais à convenir » doit rester possible) : C, à confirmer avec les règles métier. Test : ligne libre `prix=1` → 400 ; panier normal → 201 ; frais négatifs → 0.

**AUD-042 Webhook Wave vs montant** — MAJEUR, P0, D. Correction : stocker le total complet sur l'en-tête (AUD-044) puis comparer `data.amount` à ce total ; une commande sans frais ni remise ne doit plus être la seule à passer. Fichier : `paiement.js:457-488` (idem `paiement.js:106-109, 421-425` pour l'initiation). Test : Wave webhook signé avec (a) frais, (b) promo, (c) 3 articles → `paiement_recu=t` ; montant faux → non validé et alerte ; rejeu du même événement → idempotent.

**AUD-040 Orange Money sans notification** — MAJEUR, P1 (P0 si Orange est activé dans le checkout ; vérifier le réglage `paiement_orange`, présent et non vide dans le snapshot). Correction : passer `notif_url: ${BACKEND_URL}/api/paiement/orange/webhook` à `createWebPayment` dans `boutiques-commandes.js:400` ; supprimer la valeur par défaut erronée de `services/orange-money.js:70` ; corriger aussi le repli silencieux : en cas d'erreur Orange (l.415-417), la route répond 201 sans URL de paiement, il faut renvoyer une erreur et compenser (AUD-010). Test : création d'un paiement Orange simulé, appel du webhook signé à l'URL générée → commande `payee`.

**AUD-013 Webhooks hors production / montant Stripe** — MOYEN, P1, D. `render.yaml` fixe `NODE_ENV=production` et ne déclare aucune variable Stripe : l'exposition actuelle est faible sous réserve que la variable soit bien appliquée (NON DÉTERMINÉ sur le tableau de bord Render). Correction : refuser sans signature valide quel que soit `NODE_ENV` (`paiement.js:627`, `:931-945`) ; comparer `amount_total` et la devise à la commande (Stripe, `paiement.js:~640-725`) ; retirer `details`. Test : requête non signée → 401 en `development` ; événement signé de mauvais montant → non validé.

**AUD-037 (partie données de paiement)** — MOYEN, P2, P. 11 commandes en ligne livrées avec `paiement_recu=false`, abonnements `actif` expirés, ventes POS à `prix_unitaire=0`. Ne rien corriger en base avant d'avoir compris la règle métier : (1) relire après AUD-042/044 si les cas viennent du webhook ; (2) décider si `livree` implique paiement ; (3) tâche qui passe les abonnements à `expire` quand `fin < NOW()` ; (4) enregistrer `prix_unitaire` des ventes POS (`boutiques-pos.js:305`). Ne pas « réparer » les lignes historiques pour faire disparaître la statistique.

**AUD-043** — MINEUR, P3, P. Vérifier qui écrit `attente_paiement` ; ajouter le statut à `STATUTS_VALIDES` ou retirer la condition de `relance-panier.js:44`.

### CR-04 — Administration : droits, secrets, sessions (AUD-028, 029, 030, 041)

**AUD-041 Révocation admin** — MAJEUR, P0, D. Correction : dans `admin-rbac.js:102-135`, si `decoded.adminId` correspond à une ligne, exiger `actif=true` et utiliser le rôle de la base, jamais celui du jeton ; n'accepter le repli « super_admin technique » que pour l'identifiant nul du break-glass ; ajouter une version de session (`jwt_version` sur `admin_utilisateurs`, même principe que `utilisateurs`) incrémentée à la désactivation, à la suppression et au changement de mot de passe ; réduire la durée de 7 jours. Table : `admin_utilisateurs` (migration additive). Test : créer un super_admin, se connecter, le désactiver → `me` 401 ; le supprimer → 401 ; un admin actif continue de fonctionner.

**AUD-029 Secrets dans `GET /api/settings`** — MAJEUR, P0, D. Correction : masquer en lecture (`****` + 4 derniers caractères) toute clé sensible : `wave_api_key`, `wave_signing_secret`, `telegram_bot_token`, `fb_page_access_token`, et toute clé dont le nom contient `token|secret|api_key|password` (liste d'exceptions explicite) ; lecture complète réservée à `super_admin` ; à l'écriture, ignorer une valeur égale au masque. Consommateurs à tester : `actions/admin/admin-communication.ts:11,42`, `admin/(protected)/apporteurs/{page,ApporteursClient}.tsx`, `communication/page.tsx:329`, `force-de-vente/page.tsx:14`, `tarifs/{page,TarifsClient}.tsx`. Fichiers : `backend/routes/settings.js`, `backend/lib/settingsCache.js` (`getAll`, l.102). Test : valeurs canari (mêmes qu'à l'audit) jamais visibles par `support_client` ; le formulaire Tarifs enregistre sans effacer les clés masquées. Action humaine : la valeur de `fb_page_access_token` a été lisible par tout rôle admin, décider de sa rotation.

**AUD-028 RBAC** — MAJEUR, P1, D. 150 routes admin testées ; 27 usages de `requireAdminRole`. Correction : matrice route → permission (clés de `ROLE_PERMISSIONS` : `users:*`, `boutiques:*`, `produits:*`, `commandes:*`, `pos:*`, `immo:*`, `crm:*`, `whatsapp:*`, `settings:*`, `finances:*`, `paiements:*`, `reversements:*`, `abonnements:*`, `plans:*`, `credits:*`, `audit:*`) ; ajouter les clés manquantes (par exemple `flags:edit`) ; appliquer `requireAdminPermission` sur chaque route de mutation d'abord, puis de lecture. Routes avérées : `feature-flags/admin/*`, `whatsapp/admin/sessions` (DELETE), `prospection/*` (DELETE leads, blacklist, `auto-collecte`, `nettoyer`, `assainir-immo`), `telecom/sync-artp`, `settings` PUT. Mise en production : mode journal seul (log des refus qui auraient eu lieu) une semaine, puis application ; drapeau `RBAC_ENFORCE`. Test : matrice 5 rôles × routes générée depuis l'inventaire (script d'audit `enum-routes.js` + `rbac.js` à copier dans `scripts/audit/`), attendu 403 hors droits ; `super_admin` inchangé. Risque : verrouiller le personnel ; rollback par drapeau, le break-glass reste.

**AUD-030 Secret maître** — MOYEN, P1, D. `ADMIN_SECRET` : 13 caractères (longueur mesurée). Correction : (1) action ops : générer ≥ 32 caractères aléatoires, mettre à jour Render (backend) et les variables du frontend, se reconnecter ; (2) limiteur dédié sur le chemin « en-tête secret » (`admin-rbac.js:143`) et alerte à chaque usage ; (3) cesser de recopier le secret dans le cookie `nopalou_admin` (`admin-auth.js:42`, `app.js:283`) : les actions serveur du frontend lisent `COOKIE_JWT` avant `COOKIE_SECRET` (`actions/admin/admin-common.ts:16`), la bascule est donc possible mais plusieurs fichiers lisent directement `nopalou_admin` (`actions/facebook-posts.ts:6`, `abonnements/actions.ts:6`, `abonnements/page.tsx:6`…) : les migrer d'abord. Risque de perte d'accès : conserver un accès break-glass testé avant de retirer l'ancien.

### CR-05 — Schéma, migrations, sauvegarde (AUD-001, 002, 031, 032, 007)
Prérequis Phase 0 : `pg_dump --schema-only` de la production (lecture seule) versionné hors dépôt.
- **AUD-001/002** (MAJEUR, P1, D) : migration de base `backend/migrations/…` ou réécriture de `migrate-inline.js` à partir du schéma réel ; ajouter table `notifications_immo`, colonnes `annonces_immo.motif_rejet`, `annonces_immo.visite_virtuelle`, `boutique_produits.notes`, `boutiques.plan_actif`, `feature_flags.created_at`, `ventes.prix_achat`, `caisse_credit_historique.reference`, `categories.updated_at`, `commandes_boutique.relance_panier_envoyee`, `commandes_boutique.date_relance_panier`, les colonnes de `prospection_campagnes` (`segment_cible … nb_agences_creees`) et la table `prospection_lead_events` (liste issue de l'exécution de chargement du snapshot ; confirmer contre le schéma de production actuel) ; faire échouer le processus si une migration échoue (aujourd'hui `app.js:464` affiche un avertissement) ; supprimer « MIGRATE OK » trompeur.
- **AUD-031** (MAJEUR, P1, D) : le dump écrit les colonnes `text[]` en `jsonb` (cause de l'échec sur `boutique_produits.images`). Corriger `scripts/backup-database.mjs` (littéral `'{…}'`/`ARRAY[]`), joindre le schéma, rejouer la restauration dans une base vide dans `test:pra`. Test : sauvegarde → base vide + migrations → restauration → comptage par table identique. Vérifier en parallèle les sauvegardes managées Render (NON DÉTERMINÉ).
- **AUD-032** (MOYEN, P2, D) : déplacer le DDL des handlers vers des migrations (`prospection.js` 53, `categories.js` 9, `admin-migration.js` 8, `credits.js` 6 dont l.316-317, `paiement-sequestre.js` 6, `credit-service.js` 5, `otp.js` 3, `boutiques-abtest.js` 2, `relance-panier.js` 2, et les 6 fichiers à une occurrence). Ordre imposé : baseline validée en production d'abord, retrait des DDL ensuite.
- **AUD-007** (MINEUR, P3) : réécrire `database/test-fixtures.sql` ou le supprimer au profit de fixtures créées par l'API.
- Risque élevé. Stratégie : tout sur une copie de production ; migrations idempotentes (`IF NOT EXISTS`), aucun `DROP` ; sauvegarde complète avant déploiement ; rollback = restauration de cette sauvegarde.

### CR-06 — Requêtes désalignées (AUD-018, 019)
- **AUD-018** (MAJEUR, P1, D) : `admin-commandes.js:88` sélectionne `b.email` ; `boutiques` n'a pas cette colonne (dump du 24/09) et le champ `boutique_email` n'est lu nulle part. Confirmer sur le schéma de production actuel, puis retirer le champ ou joindre `utilisateurs` (`b.utilisateur_id`). Test : `GET /api/admin/commandes/:id` → 200 avec lignes (`commandes_boutique_items`) ; modale de reversement ouverte.
- **AUD-019** (MAJEUR, P1, D) : `admin-pos.js:40-41,113` utilise `ecart`, `ouvert_le`, statut `fermee` ; le schéma et `boutiques-pos.js` utilisent `ecart_caisse`, `date_ouverture`, statuts `ouverte`/`cloturee` (l.876). Aligner les trois. Test : `GET /api/admin/pos/stats` et `/sessions` → 200 avec une session ouverte puis clôturée.

### CR-07 — Filet de sécurité (AUD-020, 036, 006)
- **AUD-020** (MAJEUR, P1, cause D pour 2 suites, C pour le reste). Mesure actuelle : 13 suites et 41 tests en échec sur 49 suites et 389 tests (`NODE_ENV=test`, sans base). Causes établies : `spec-01-mode-switch` (séquence de `pool.query` mockée décalée par la requête `jwt_version` de `verifierToken`) ; `relance-catalogue` (`estDesinscrit` est exportée par `services/whatsapp` et utilisée par le code réel, le mock du test ne la fournit pas). Causes probables mais non démontrées : `spec-03`, `spec-04`, `spec-05`, `spec-06`, `spec-master-exhaustive`, `club-vip-and-ab-testing`, `comptabilite`, `analytics-filters`, `immo-favoris-and-resolver`, `support-service`, `admin-alerts-and-health` (statuts 403/401/500/200 différents) : examiner suite par suite avant de modifier. Étapes : (1) helper commun de mock d'authentification ; (2) corriger chaque suite après confirmation de sa cause ; (3) isoler la connexion réelle de `pos-pin-security.test.js` ; (4) exécuter `test:unit` en CI avant chaque push (`scripts/quality-gate.mjs` existe). Acceptation : 49/49 suites vertes ; un test volontairement cassé fait échouer la commande.
- **AUD-036** (MINEUR, P3) : rendre les e2e hermétiques (création des données par l'API ; le test POS dépend de `b-pos-e2e`, du jeton `pos-test-token` et du PIN 9999) ; la règle des 450 lignes (87 composants) est traitée en dette, pas en correction bloquante.
- **AUD-006** (MOYEN, P2) : rendre `lint:slop` bloquant pour les règles déjà tenues (nouveaux fichiers) ; ne pas bloquer sur les 886 émojis existants sans plan de résorption.

### CR-08 — Erreurs avalées (AUD-017, 012 partie journal, 023)
- **AUD-017** (MINEUR, P3, P) : ajouter `console.error` dans les `catch` des routes listées (`catalogues-standards`, `avis`, `cross-sell`, `composants`, `tarifs-quantite`, `paiement-sequestre/*/statut`). Cause démontrée seulement pour `paiement-sequestre` (`uuid = text`) : comparer avec un cast explicite au bon endroit, après lecture de la requête.
- **AUD-023** (MINEUR, P3, D) : dans `middlewares/auth.js`, décider explicitement du comportement sur erreur base (fermé par défaut) et refuser les jetons sans `jwtVersion`. Attention : des parcours légitimes pourraient émettre des jetons sans version ; vérifier `magicAuthToken` avant de durcir.

### CR-09 — Dépendances et configuration
- **AUD-033** (MOYEN, P2, D) : `npm audit fix` sur une branche ; `next` (critique, DoS de l'optimiseur d'images, correctif disponible) ; `multer`, `undici`, `form-data` (correctif disponible) ; `axios` et `follow-redirects` sans correctif : atténuer par CS-2. Exploitabilité réelle de chaque avis : NON DÉTERMINÉ (le DoS `next` exige une configuration `remotePatterns`, à lire dans `next.config.js`). Test : build, `tsc --noEmit`, tests unitaires et e2e.
- **AUD-004** (MOYEN, P2, D code / impact NON DÉTERMINÉ) : `models/db.js:10` `rejectUnauthorized:false` ; charger le certificat de l'hébergeur et vérifier, après test de connexion sur Render ; rollback par variable d'environnement.
- **AUD-003** (MOYEN, P3, D) : `frontend-next/src/lib/api.ts:8` : retirer `https://yombale.onrender.com` du repli ou le limiter à `NODE_ENV=production`.
- **AUD-005** (MOYEN, P2, P) : `render.yaml` déclare un seul service web en plan gratuit et `PROCESS_TYPE` absent : duplication de crons peu probable ; risque réel : les crons ne tournent pas quand le service dort (NON DÉTERMINÉ). Décision : passer les crons dans un worker dédié (`PROCESS_TYPE=worker`, déjà prévu dans `app.js:468`) ou documenter la limite. Noter : `render.yaml` fixe `NODE_VERSION` à 18 (fin de support) : confirmer la valeur effective sur Render.

### Fiches unitaires

**AUD-012** — MAJEUR, P1, D. `boutiques-produits.js:768` et `:814` : `checkBoutiqueAccess(req.user.id, id)` avec arguments inversés, clé `id` inexistante (le jeton porte `userId`), résultat traité comme `{allowed}` alors que `middlewares/tenantSecurity.js` renvoie la boutique ou `null` ; `catch` muet. Correction : même schéma que les lignes 115 et 247 (`checkBoutiqueAccess(id, req.user.userId)`, 403 si `null`), vérifier que `prodId` appartient à la boutique avant `DELETE`, journaliser. Routes : `POST /api/boutiques/:id/produits/:prodId/composants` et `/tarifs-quantite` (et leurs alias). Tables : `produit_composants`, `produit_tarifs_quantite`. Test : propriétaire 200 + relecture `GET` ; autre marchand 403 ; `prodId` d'une autre boutique 404 ; aucune ligne écrite dans les deux cas refusés. Régression : pages produit avec packs et grilles B2B ; cache `cat:${id}`.

**AUD-021** — MOYEN, P2, D. `verifierToken` accepte `?token=` (`auth.js`) et morgan journalise l'URL complète en production ; le frontend agences construit `?token=` pour les PDF (`agence/[slug]/bailleurs/page.tsx:175`, `BailleurCardItem.tsx:38`, `factures/components/TableFacturesDesktop.tsx:166`, `locatif/components/{BailCardMobile,BailTableRow,LoyerCardMobile,TableLoyersDesktop}.tsx`, `mandats/components/TableMandatsDesktop.tsx:241`). Correction : lien de téléchargement signé, court (60 s) et limité à un document, émis par une route authentifiée ; retirer le support de `?token=` pour les sessions ; masquer la query dans le format morgan. Les 9 composants doivent migrer avec le backend. Test : PDF ouvert dans un nouvel onglet ; `GET /api/auth/profil?token=<session>` → 401 ; le journal ne contient plus de jeton.

**AUD-022** — MINEUR, P3, D. `inscription` répond 409 « Email déjà utilisé ». Option : réponse uniforme avec e-mail de notification ; arbitrage produit (l'expérience d'inscription en souffre). Atténuation actuelle : 20 requêtes / 15 min.

**AUD-024** — MOYEN, P2, cause C pour le soft 404. `produit/[id]/page.tsx:100` appelle `notFound()` mais la réponse observée est 200 + `noindex` : cause probable (flux de rendu différé) non démontrée, à confirmer en production (`loading.tsx`, `Suspense`). Titres doublés (`| Nopalou | Nopalou`) : examiner le `title.template` du layout. HSTS : présent en production dans `middleware.ts:130-132` (absent seulement en dev) : résolu. `X-Frame-Options` frontend DENY / backend SAMEORIGIN : sans effet tant que le backend n'est pas encadré dans une iframe (aucun usage trouvé).

**AUD-034** — MOYEN, P2, D comportement / décision produit. Un `courtier` lit comptabilité, commissions, configuration crédit, CRM, membres. Définir les permissions par rôle d'agence (`requireAgenceAccess(requiredRoleOrPerm)` accepte déjà des permissions explicites) puis restreindre ; ne pas modifier avant la décision.

**AUD-035** — MINEUR, P3, D. Suivi de commande par référence dans le bot WhatsApp : fonction absente (écart avec CLAUDE.md) → corriger la documentation ou implémenter (amélioration) ; recherche de boutique par nom complet et salutation du chat web : corriger dans `services/whatsapp-chatbot.js` (recherche) et `routes/chat.js` (salutations). Test : scénarios du rapport d'audit rejoués.

**AUD-038** — MOYEN, P2, cause C. `GET /api/search` 366 ms et `instantanee` 84 ms à chaque frappe sur 45 543 produits. Avant correction : `EXPLAIN (ANALYZE, BUFFERS)` des requêtes de `routes/search.js` et `routes/produits.js` sur la copie restaurée ; puis index trigramme (`pg_trgm` et `f_unaccent` existent déjà), cache court, anti-rebond côté client. `historique_prix` (1,28 M lignes, 175 Mo) : politique de rétention à décider (donnée métier). Validation : médiane < 100 ms à volume égal, mesurée avant/après sur la même machine.

**AUD-039** — MINEUR, P3, D (heuristiques). Étiqueter les champs signalés (`/boutiques` 4, `/boutiques/<slug>` 2, `/immo`, `/annonces`, `/creer-boutique`), nommer les 4 liens de la vitrine boutique, supprimer le second `<main>` de `/` et `/tarifs-boutique`. Test : le script de contrôle de l'audit renvoie 0 ; audit axe et lecteur d'écran à faire ensuite.

---

## 9. PLAN PAR PHASE

| Phase | Contenu | Sortie attendue |
|---|---|---|
| 0 Préparation | branche dédiée ; `pg_dump --schema-only` et sauvegarde complète de production (lecture seule) ; lecture des variables Render (`NODE_ENV`, Stripe, `SCRAPING_DISABLED`, `PROCESS_TYPE`, `NODE_VERSION`) ; vérification de `\d commandes_boutique`, `\d boutiques` ; copie des scripts d'audit dans `scripts/audit/` ; réparation minimale des tests (helper d'auth, AUD-020 étape 1-2) ; vérifier l'historique Telegram | environnement reproductible, filet de tests utilisable |
| 1 Sécurité critique | CR-01 étapes 1-4, AUD-026, AUD-027 (hotfix 401), AUD-029, AUD-041, AUD-030 (rotation) | P0 sécurité fermés |
| 2 Commande/paiement | AUD-044, 010, 011, 042, 040, 013 | chaîne d'achat cohérente |
| 3 Autorisation et API | AUD-028, 014, 015, 016, 021, 012, 018, 019, 017, 023 | droits et routes alignés |
| 4 DB et reprise | AUD-001, 002, 031, 032, 007, 037 | reconstruction et restauration prouvées |
| 5 Frontend, UX, SEO | CR-01 étape 5 (CSP nonce), AUD-024, 035, 039, 034 (après décision) | CSP bloquante, SEO propre |
| 6 Performance | AUD-038 | latences mesurées |
| 7 Dette et dépendances | AUD-033, 004, 003, 005, 006, 036, 043 | dette réduite |
| 8 Régression globale | suites complètes section 12 | rapport de validation |

Phase 9 du modèle demandé non utilisée : fusionnée dans la phase 8.

## 10. MATRICE DES CORRECTIONS

| ID | Problème | Gravité | Prio | Cause | Correction | Dépendance | Validation |
|---|---|---|---|---|---|---|---|
| 025 | XSS JSON-LD | CRIT | P0 | D | CR-01 | — | `__XSS_PROOF` indéfini |
| 026 | SSRF | CRIT | P0 | D | CS-2 + auth | — | 5 URL refusées |
| 044 | panier ≥2 articles 500 | CRIT | P0 | D | modèle en-tête + lignes | Phase 0 (`\d`) | panier 3 articles 201 |
| 010 | stock vidable | CRIT | P0 | D | compensation + expiration | 044 | stock inchangé après échec |
| 011 | prix client | MAJ | P0 | D | refuser ligne libre | — | 400 |
| 042 | webhook Wave montant | MAJ | P0 | D | comparer total complet | 044 | paiement avec frais validé |
| 027 | relais WhatsApp | MAJ | P0 | D | auth + limites | décision OTP | anonyme 401 |
| 029 | secrets settings | MAJ | P0 | D | masque + super_admin | test UI tarifs | canari invisible |
| 041 | admin révoqué actif | MAJ | P0 | D | rôle base + version | — | `me` 401 |
| 028 | RBAC | MAJ | P1 | D | permission par route | 041, 020 | matrice 403 |
| 030 | secret maître | MOY | P1 | D | rotation + limiteur + cookie | migration actions | connexion OK, ancien refusé |
| 012 | composants/tarifs | MAJ | P1 | D | contrôle d'accès | — | 200/403 |
| 018 | `b.email` | MAJ | P1 | D | retirer/joindre | schéma prod | 200 |
| 019 | admin POS | MAJ | P1 | D | colonnes/statuts | — | 200 |
| 040 | callback Orange | MAJ | P1 | D | `notif_url` | — | commande `payee` |
| 031 | sauvegarde | MAJ | P1 | D | tableaux + schéma | CS-5 | restauration identique |
| 013 | webhooks | MOY | P1 | D | signature toujours | 042 | 401 partout |
| 014 | infos publiques | MOY | P1 | D | `requireAdminAuth` | — | 401 |
| 020 | tests rouges | MAJ | P1 | D/C | mocks | — | 49/49 |
| 001 | migrations | MAJ | P1 | D | baseline + échec dur | schéma prod | base vide = prod |
| 002 | écarts schéma | MAJ | P1 | D | colonnes/tables | 001 | diff nul |
| 003 | repli prod | MOY | P2 | D | retirer | — | dev isolé |
| 004 | TLS base | MOY | P2 | D/NON DÉT. | vérifier cert | test Render | connexion OK |
| 005 | crons | MOY | P2 | P | worker | décision | crons tracés |
| 015 | alias | MOY | P2 | D | retirer après journal | 040 | 404 JSON |
| 016 | limiteur | MOY | P2 | D | chemins exacts | — | webhooks OK |
| 021 | `?token=` | MOY | P2 | D | liens signés | 9 composants | 401 |
| 024 | SEO | MOY | P2 | C | confirmer | — | 404 réel |
| 032 | DDL runtime | MOY | P2 | D | migrations | 001 | aucun DDL handler |
| 033 | dépendances | MOY | P2 | D | audit fix | 020 | audit sans critique |
| 034 | courtier | MOY | P2 | D/décision | rôles | décision | 403 ciblé |
| 037 | données | MOY | P2 | P | règles métier | 042, 044 | rapprochement |
| 038 | performance | MOY | P2 | C | index/cache | EXPLAIN | médiane < 100 ms |
| 006 | lint | MOY | P3 | D | bloquant nouveaux fichiers | — | échec si violation |
| 007 | fixtures | MIN | P3 | D | réécrire | 001 | base de test |
| 017 | 500 sans log | MIN | P3 | P | journaliser | — | log présent |
| 022 | énumération | MIN | P3 | D | réponse uniforme | décision | 409 uniforme |
| 023 | verifierToken | MIN | P3 | D | fermé par défaut | magic | 401 sans version |
| 035 | chatbot | MIN | P3 | D | correctifs | — | scénarios |
| 036 | e2e | MIN | P3 | D | hermétique | 001 | e2e vert vide |
| 039 | accessibilité | MIN | P3 | D | étiquettes | — | script 0 |
| 043 | statut | MIN | P3 | P | aligner | 044 | cohérence |

Matrice des phases :

| Phase | Corrections | Modules | Risque | Prérequis | Validation |
|---|---|---|---|---|---|
| 0 | préparation, tests | tout | faible | accès lecture Render | suites exécutables |
| 1 | 025, 026, 027, 029, 041, 030 | frontend, admin, WhatsApp | moyen (CSP exclue) | phase 0 | tests sécurité |
| 2 | 044, 010, 011, 042, 040, 013 | commandes, paiements | élevé | phase 0 | tests paiement |
| 3 | 028, 014, 015, 016, 021, 012, 018, 019 | API, admin | moyen à élevé (028) | 041, tests | matrice RBAC |
| 4 | 001, 002, 031, 032, 007, 037 | DB | élevé | schéma prod | restauration vide |
| 5 | CSP nonce, 024, 035, 039 | frontend | élevé (CSP) | CS-1 | Report-Only propre |
| 6 | 038 | search, DB | faible | copie de prod | mesures |
| 7 | 033, 004, 003, 005, 006, 036 | config | moyen | tests verts | build, e2e |
| 8 | régression | tout | — | phases 1 à 7 | section 12 |

## 11. DÉPENDANCES ENTRE CORRECTIONS

```
AUD-020 (mocks) ──► AUD-028, 012, 010/044/042 (touchent des middlewares ou routes testées)
Phase 0 (\d commandes_boutique) ──► AUD-044 ──► AUD-010 ──► AUD-042 ──► AUD-013 ──► AUD-037
AUD-041 ──► AUD-028 ──► AUD-030 (migration des actions serveur avant retrait du cookie secret)
AUD-029 ──► test formulaires tarifs/apporteurs
AUD-001/002 (baseline) ──► AUD-031 ──► AUD-032 (retrait du DDL runtime en dernier)
AUD-040 ──► AUD-015 (valeur par défaut Orange utilise le préfixe alias)
CS-1 ──► CR-01 CSP (corriger d'abord les sites, puis le nonce, Report-Only avant blocage)
CS-2 ──► AUD-026 ; AUD-033 (axios sans correctif) s'appuie sur CS-2
```
Corrections bloquantes : 020, Phase 0. Corrections communes à plusieurs modules : CS-1, CS-2, CS-3, CS-4, CS-5. Corrections pouvant casser l'existant : CSP nonce, modèle de commande, RBAC, baseline schéma, retrait des alias, `?token=`.

## 12. RISQUES DE RÉGRESSION ET PLAN DE TEST

| Zone touchée | Risque | Tests à rejouer |
|---|---|---|
| CSP et JSON-LD | scripts tiers bloqués, SEO | Chromium : GTM, embeds ; JSON-LD parsable ; Lighthouse SEO en production après déploiement |
| Commande/paiement | commandes perdues, doubles débits | cash, Wave réussi/échec, Orange, Stripe simulé, multi-articles, promo, frais, webhook rejoué, expiration |
| RBAC | accès personnel perdu | matrice 5 rôles, break-glass, `super_admin` |
| Settings | clés écrasées | formulaires Tarifs, Apporteurs, Communication |
| Schéma | perte de données | base vide + migrations = schéma de production ; sauvegarde → restauration → comptage |
| Limiteur | webhooks bloqués | webhooks signés sous charge |
| Alias retirés | clients externes cassés | journal des accès deux semaines |
| Dépendances | régression Next | build, `tsc`, unitaires, e2e desktop et mobile 360 |

Suites à ajouter (les scripts d'audit servent de base, à copier depuis le répertoire temporaire de la session vers `scripts/audit/`) :
1. **Sécurité** : XSS (unitaire + Chromium), SSRF (table d'URL, redirections, DNS simulé), secrets canari dans settings, révocation admin, matrice RBAC, inventaire des routes avec classification d'authentification (fichier de référence).
2. **Paiement** : tarification serveur, compensation, expiration, webhooks signés/non signés/montant faux, Orange `notif_url`.
3. **Données** : schéma de référence, aller-retour sauvegarde, unicité et cohérence des totaux (`en-tête = Σ lignes + frais − remise`).
4. **E2E** : achat multi-articles, caisse POS (données créées par l'API), espace marchand, admin commande détail, admin POS.
5. **Non-régression globale (phase 8)** : 49 suites unitaires, 69 tests frontend, `tsc --noEmit`, `npm run build`, e2e desktop et mobile, `npm audit` sans critique, mobile 360 sans débordement (déjà vert).

## 13. PLAN DE ROLLBACK (corrections à risque)

| Correction | Stratégie de déploiement | Sauvegarde | Rollback |
|---|---|---|---|
| CSP nonce | Report-Only une semaine puis blocage | aucune donnée | rebasculer l'en-tête en Report-Only ou restaurer la directive précédente |
| Modèle de commande (044/010/042/040) | drapeau `ORDER_MODEL_V2`, migration additive (`expires_at`), essai sur une copie de production | dump complet avant migration | désactiver le drapeau (l'ancien chemin reste pour 1 article) ; la colonne ajoutée reste inoffensive |
| RBAC | mode journal puis `RBAC_ENFORCE` | — | `RBAC_ENFORCE=false` ; le break-glass reste actif |
| Rotation `ADMIN_SECRET` | rotation hors heures de pointe, test de connexion avant de fermer l'ancien accès | ancien secret conservé hors ligne jusqu'à validation | remettre l'ancienne valeur sur Render |
| Baseline schéma, retrait DDL runtime | sur copie d'abord, migrations idempotentes sans `DROP` | dump complet de production | restauration du dump ; retour au code précédent |
| Retrait des alias | journal deux semaines | — | remonter le montage |
| Limiteur | test de charge avec webhooks signés | — | revenir à l'ancienne fonction `skip` |
| `?token=` | migrer backend et 9 composants dans la même livraison | — | réactiver l'ancien paramètre |
| Mise à jour des dépendances | branche dédiée, e2e complets | `package-lock.json` précédent | revert du commit |

## 14. AMÉLIORATIONS NON BLOQUANTES (hors corrections obligatoires)
- Règle des 450 lignes : 87 composants sur 960 (plus gros : `SamaKalpeClient.tsx` 817) ; fichier `whatsapp-chatbot.js` de 6 103 lignes ; 886 émojis d'interface.
- Mettre CLAUDE.md en accord avec les mesures (tests, « 0 violation », suivi de commande du bot) ; documenter le processus de livraison.
- Rétention de `historique_prix` ; décision de purge ou d'agrégation.
- Audit d'accessibilité complet (axe, lecteur d'écran, contraste) et Core Web Vitals en production (non mesurés).
- Nettoyage des données métier du snapshot : 56 boutiques sans WhatsApp, 80 sans logo, 16 produits sans image, doublons. Tâche éditoriale, pas un correctif de code.
- Mise à jour de Node 18 (à confirmer sur Render), migration hors plan gratuit si les crons doivent rester actifs.
- Politique de rôles d'agence (AUD-034) après décision produit ; parcours anonyme WhatsApp avec OTP (AUD-027).

## 15. ORDRE EXACT D'EXÉCUTION RECOMMANDÉ
1. Phase 0 : branche, sauvegarde et schéma de production, variables Render, `\d commandes_boutique`, copie des scripts d'audit, vérification Telegram.
2. Réparer les mocks (AUD-020 étapes 1-2) : filet de tests utilisable.
3. AUD-041 (révocation admin), puis AUD-029 (masque des secrets), puis rotation `ADMIN_SECRET` (AUD-030 étape 1).
4. AUD-026 (CS-2 + authentification) et AUD-027 (hotfix 401).
5. CS-1 + remplacement des sites JSON-LD (CR-01 étapes 1-4) ; déployer ; CSP en Report-Only.
6. AUD-044 → AUD-010 → AUD-011 → AUD-042 → AUD-040 → AUD-013, avec les tests de paiement de la section 12.
7. AUD-012, 018, 019, 014, 017 (corrections locales à faible risque).
8. AUD-028 (mode journal puis application) ; AUD-016 ; AUD-021 avec ses 9 composants ; AUD-015 après journalisation.
9. Schéma : AUD-001/002 → AUD-031 → AUD-032 → AUD-037 ; test « base vide = production ».
10. CSP bloquante, AUD-024, 035, 039, puis AUD-038.
11. AUD-033, 004, 003, 005, 006, 036, 043, 007, 022, 023.
12. Phase 8 : régression globale, puis rapport de validation.

AUDIT TERMINÉ → PLAN DE CORRECTION ÉTABLI → CORRECTIONS PRIORISÉES → DÉPENDANCES IDENTIFIÉES → TESTS DE VALIDATION DÉFINIS → RÉGRESSION PLANIFIÉE.
