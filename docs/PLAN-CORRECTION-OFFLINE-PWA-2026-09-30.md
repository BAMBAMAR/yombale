# Plan de correction — hors-ligne, PWA, E2E, WhatsApp (AUD-087 à AUD-107)

Livrable séparé de `AUDIT-OFFLINE-PWA-2026-09-30.md` : **aucun code modifié**. Les preuves, fichiers et lignes de chaque fiche sont dans le rapport ; ce plan ne les répète pas, il donne pour chaque anomalie la correction, ses contraintes et sa validation. Méthode : `METHODOLOGIE-AUDIT.md` §3 (branche dédiée, commits locaux `fix(zone): AUD-NNN …`, pas de `git push` sans ordre, chaque correctif prouvé par un test qui échoue sans lui, migrations idempotentes validées sur base vide puis existante).

## 0. Hypothèses, décisions, hors périmètre

- **Décisions attendues du propriétaire produit** avant d'ouvrir les lots concernés : (D1) survente hors-ligne : accepter et signaler (recommandé) ou refuser (AUD-097) ; (D2) caissier hors-ligne avec abonnement expiré connu : bloquer après un délai de grâce ou laisser vendre en file à traiter (AUD-089) ; (D3) rétention locale après déconnexion avec ventes non synchronisées : bloquer la déconnexion, ou conserver seules les files chiffrées/exportables (AUD-091) ; (D4) méthode de paiement portée par « WhatsApp Direct » (AUD-095).
- **Hors périmètre** : refonte du design du POS, intégrations de paiement réelles (Wave/OM/Stripe), impression ESC/POS, notifications push.
- **Limite des preuves** : Chromium headless, pas d'appareil réel. Chaque lot de la Phase 1 doit être **rejoué une fois sur un Android réel** (réseau mobile instable) avant d'être déclaré terminé ; tant que ce n'est pas fait, le statut reste « validé en environnement isolé, appareil réel non testé ».

## 1. Phases et dépendances

| Phase | Contenu | Pourquoi dans cet ordre |
|---|---|---|
| **0 — Filet** | (a) transformer `scripts/audit/offline/` en tests à assertions (aujourd'hui ils impriment du JSON) et les brancher sur un job CI « build production + Playwright » ; (b) règle ESLint `no-undef` sur `backend/` (aurait détecté AUD-094) ; (c) garde `git diff --exit-code frontend-next/public/sw.js` : le build ne doit pas laisser un `sw.js` différent du commit | sans filet, les correctifs de file de synchronisation ne sont pas rejouables |
| **1 — P1** | 087 → 092 → 088 → 089 → 090 → 093 → 091 → 094 → 095 | 087 supprime le déclencheur de 088 ; 092 rend le hors-ligne fiable avant de toucher aux files ; 088/089 posent le modèle d'états de file dont 090 et 093 dépendent ; 091 dépend de ce modèle (que faire des files à la déconnexion) |
| **2 — P2** | 096, 097, 101, 102, 100, 099, 098, 103, 104 | 096/097 étendent le contrat serveur de 088 ; 101/102/100 touchent `commande-service.js` ensemble |
| **3 — P3** | 105, 106, 107 | sans dépendance |
| **Régression globale** | suite complète `scripts/audit/offline` + suites existantes + relecture manuelle sur Android | voir §5 |

## 2. Conception commune (à valider avant la Phase 1)

**Modèle d'états des files locales** (ventes, dettes, clients, dépenses, clôtures, commandes WhatsApp) : `pending → syncing → done` et deux états terminaux visibles, `failed` (erreur métier 4xx : message serveur conservé, action « réessayer / exporter / abandonner ») et `conflict` (écart de stock, AUD-097). Une entrée `syncing` porte `syncing_since` ; toute entrée `syncing` de plus de 60 s est **réclamée** (remise en `pending`) au démarrage et à chaque cycle. Sûr car le serveur est idempotent (vérifié : 6 envois simultanés → 1 vente, stock −1).

**Déclenchement de la synchronisation** : au démarrage de l'application quand elle est en ligne, à chaque transition `online`, à intervalle (60 s tant qu'il reste des entrées), et via Background Sync quand disponible (AUD-104). **Jamais de rechargement de page** (AUD-087).

**Identifiants locaux** : tout objet créé hors-ligne reçoit un `id_temporaire` **et** une clé d'idempotence serveur. La synchronisation traite les dépendances dans l'ordre (client → dettes/ventes, session → ventes → clôture) et **remappe** les références locales vers les identifiants serveur dans les entrées dépendantes avant de les envoyer.

**Contrat serveur** : les routes d'écriture hors-ligne acceptent `idempotency_key` et `client_date`, répondent `{success, duplicate?, id}` et **n'utilisent jamais 500 pour un doublon**.

**Retour arrière général** : chaque lot est un commit isolé ; les migrations sont additives (`ADD COLUMN IF NOT EXISTS`, index `IF NOT EXISTS`), sans suppression ; les nouveaux champs sont optionnels côté API pour que d'anciens clients (SW en cache) continuent de fonctionner.

---

## 3. Phase 1 — P1

### AUD-087 — Rechargement à chaque retour du réseau
- **Fonctionnalité** : toutes les pages, caisse en priorité. **Environnement** : production (Next + Serwist).
- **Constat / preuve / reproduction** : rapport AUD-087 ; `t04a`, `t04b`, `t04c`, `t05e`, `t07`.
- **Cause** : DÉMONTRÉE (`reloadOnOnline` par défaut `true`).
- **Impact** : ticket et saisies perdus, PIN redemandé, synchronisation tuée.
- **Correction** : désactiver le rechargement automatique ; la reconnexion déclenche la synchronisation, pas un rechargement. Garder les rechargements volontaires (nouvelle version du SW) mais **seulement si aucun travail en cours** (ticket non vide, formulaire modifié, file non vide).
- **Étapes** : 1) `withSerwist({ …, reloadOnOnline: false })` dans `frontend-next/next.config.js` ; 2) dans `RegisterSW.tsx` (`:97-104`), conditionner le rechargement sur `controllerchange` à l'absence de travail en cours, sinon afficher « Nouvelle version — recharger quand vous avez terminé » ; 3) retirer le `location.reload()` du HTML de secours une fois la page réelle restaurée sans rechargement (ou le conserver car cette page n'a aucun état).
- **Fichiers** : `next.config.js`, `RegisterSW.tsx`, `sw.ts` (HTML de secours). **API / DB** : aucune.
- **Stratégie offline / synchronisation** : la reconnexion lance `syncToutesLesBoutiquesEnAttente` (déjà branchée, `RegisterSW.tsx:175-189`). **Conflit** : aucun.
- **Critères d'acceptation** : aucun `Page.frameRequestedNavigation reason=reload` sur 20 cycles hors-ligne/en ligne ; ticket de 2 articles conservé après coupure de 2,5 s ; impression hors-ligne sans rechargement.
- **Test réel** : `t05e` (assertion : 0 rechargement, file vide 3/3), `t07` (a) (ticket conservé). **Régression** : la mise à jour du SW reste effective (déployer une version factice, vérifier l'invitation puis le rechargement volontaire) ; `t03`.
- **Risque de régression** : faible ; le risque est qu'une nouvelle version du SW ne s'applique jamais si l'utilisateur ne recharge pas → prévoir l'invitation visible et un rechargement forcé après N jours.
- **Retour arrière** : remettre l'option. **Effort** : 0,5 j.
- **Offline — DONNÉE LOCALE → SYNCHRONISATION → SERVEUR → CONFLIT → ÉTAT FINAL** : ticket (état React) + file IndexedDB → transition `online` → synchronisation sans rechargement → idempotence serveur → aucun conflit → file vidée, ticket intact.

### AUD-092 — Précache supprimé à l'activation
- **Constat / preuve** : rapport ; `t01b`, `t01c`. **Cause** : DÉMONTRÉE (`sw.ts:409-422`).
- **Correction** : la purge d'activation ne supprime que les caches **Nopalou** des versions précédentes (préfixe `nopalou-` absent de `CACHE_NAMES`) et laisse le précache de Serwist à sa propre gestion (`cleanupOutdatedCaches`). Après correction, vérifier la taille du précache (le manifeste filtré contient de nombreux chunks) et décider d'un sous-ensemble essentiel (caisse, carnet, panier, pages de secours) pour ne pas alourdir la première installation mobile.
- **Étapes** : 1) remplacer le filtre `!CACHE_NAMES.includes(key)` par `key.startsWith('nopalou-') && !CACHE_NAMES.includes(key)` ; 2) mesurer le poids du précache ; 3) **ne pas** incrémenter `CACHE_VERSION` sans raison (il ne fait pas partie du correctif).
- **Fichiers** : `sw.ts`. **API / DB** : aucune. **Offline** : le JS nécessaire à la caisse est servi depuis le SW, plus seulement depuis le cache HTTP.
- **Critères** : `caches.keys()` contient `serwist-precache-v2-…` après activation ; `t01c` cas B : bouton « Ajouter au panier » fonctionnel hors-ligne avec cache HTTP vidé.
- **Test réel** : `t01b` (le cache n'a plus de `goneMs`), `t01c`. **Régression** : pas d'ancien cache résiduel après mise à jour (simuler deux versions) ; poids du premier chargement mesuré.
- **Risque** : premier chargement plus lourd (données mobiles) → limiter le précache. **Retour arrière** : revert du filtre. **Effort** : 0,5 j + mesure.

### AUD-088 — Entrée `syncing` bloquée
- **Constat / preuve** : rapport ; `t05c`, `t05e`, `t06`, `t07` (b). **Cause** : DÉMONTRÉE (filtre `'pending'` seul, `db-offline.ts:374`, sans reprise).
- **Correction** : implémenter le modèle d'états de la §2 sur les **cinq** files (`ventes_queue`, `dettes_queue`, `clotures_queue`, `depenses_queue`, `nouveaux_clients_queue`) : réclamation des `syncing` périmées, compteur et liste des `failed`, indicateur persistant dans la barre de la caisse (« N ventes à traiter »).
- **Étapes** : 1) ajouter `syncing_since` et `last_error` (migration IndexedDB `DB_VERSION` 7, compatible avec les entrées existantes : absence de champ = `pending`) ; 2) `marquer…Syncing` écrit l'horodatage ; 3) `obtenir…HorsLigne` renvoie `pending` **et** `syncing` périmées ; 4) au démarrage, exécuter une passe de réclamation avant la première synchronisation ; 5) écran « À traiter » listant les `failed` avec réessai/export.
- **Fichiers** : `db-offline.ts`, `sync-manager.ts`, `usePosSyncNotifications.ts`, composants de la barre de caisse. **API** : aucune (idempotence existante). **DB serveur** : aucune.
- **Stratégie / conflit** : réclamer une entrée dont le POST est peut-être arrivé ne crée pas de doublon (clé d'idempotence, `duplicate:true`). Verrou inter-onglets : `navigator.locks.request('nopalou-sync', …)` au lieu du `Map` par module (non partagé entre onglets).
- **Critères** : zéro entrée `syncing` de plus de 60 s après un cycle ; `t07` (b) : l'entrée injectée à `syncing` est envoyée en moins de 70 s et disparaît ; aucun doublon en base.
- **Test réel** : `t07` (b), `t06`. **Régression** : `t14` (idempotence), `t05b`, deux onglets.
- **Risque** : réclamation trop agressive pendant un envoi lent → durée de bail ≥ 2× le délai maximal d'une requête. **Retour arrière** : la migration IndexedDB est additive. **Effort** : 2 j.
- **Offline — flux** : vente en file `pending` → (sync) `syncing` + horodatage → POST idempotent → `done` supprimée ; si le processus est tué : `syncing` périmée → réclamée → renvoyée → serveur répond `duplicate` ou crée → `done`.

### AUD-089 — Vente refusée par le serveur affichée comme réussie
- **Constat / preuve** : `t09`. **Cause** : DÉMONTRÉE.
- **Correction** : séparer **erreur réseau** (exception `fetch`, délai, 5xx → mise en file, ticket marqué « hors-ligne / non confirmé ») et **erreur métier** (4xx → la vente n'est pas présentée comme réussie : message explicite avec le texte serveur ; si l'encaissement physique a déjà eu lieu, la vente passe en `failed` visible avec actions). Le compteur de session ne s'incrémente qu'après confirmation serveur ou mise en file avérée. Décision D2 pour l'abonnement expiré.
- **Étapes** : 1) `creerPosVente` renvoie le statut HTTP et le code (`ABONNEMENT_POS_REQUIS`) ; 2) `useCaisseCheckout.ts:284-310` branche sur le type d'erreur ; 3) la synchronisation envoie les 4xx vers `failed` (AUD-088) au lieu de `pending` ; 4) message et bannière.
- **Fichiers** : `useCaisseCheckout.ts`, `caisseComptaActions.ts`, `sync-manager.ts`. **API** : codes d'erreur stables (existent). **DB** : aucune.
- **Critères** : avec abonnement expiré : message visible, aucune vente « réussie », entrée `failed` listée, compteur de session inchangé.
- **Test réel** : `t09` (assertions inversées). **Régression** : vente en ligne normale, hors-ligne normale, panne réseau en ligne (bascule en file).
- **Risque** : cas 4xx légitimes à reclasser (422 validation, 409 stock) → tableau de décision par code. **Effort** : 1,5 j.
- **Offline — flux** : vente locale → sync → 403 → `failed` + message conservé → décision marchand (régulariser l'abonnement puis « réessayer ») → `done`.

### AUD-090 — Dette d'un client créé hors-ligne
- **Constat / preuve** : `t10`. **Cause** : DÉMONTRÉE (identifiant temporaire non remappé).
- **Correction** : synchroniser le client d'abord, **remapper** son identifiant serveur dans les dettes, ventes et clôtures en file qui le référencent, puis envoyer ces entrées. Rendre la création du client idempotente.
- **Étapes** : 1) migration serveur idempotente : `ALTER TABLE caisse_clients_credits ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128)` + index unique partiel `(boutique_id, idempotency_key) WHERE idempotency_key IS NOT NULL` ; 2) `POST /credits-clients` accepte `idempotency_key` et renvoie `{client, duplicate}` ; 3) `syncNouveauClient` envoie la clé, lit `client.id`, met à jour `client_id` des entrées dépendantes (dettes, ventes) puis les libère ; 4) `useCarnetClients.ts:193` : décider hors-ligne avec l'état applicatif (`useOnlineStatus`) et non `navigator.onLine`.
- **Fichiers** : `sync-manager.ts`, `db-offline.ts`, `useCarnetClients.ts`, `credits.js`, migration. **API** : `POST /api/boutiques/:id/credits-clients` (clé optionnelle). **DB** : colonne + index.
- **Conflit** : deux appareils créant le même client (même téléphone) → la clé d'idempotence ne les fusionne pas ; prévoir un rapprochement par téléphone (proposition, pas automatique). **Retour arrière** : colonne ignorée si inutilisée.
- **Critères** : `t10` : après reconnexion, client unique en base, dette présente avec le bon `client_id`, solde exact, file vide. Un second envoi du même client ne crée pas de doublon.
- **Test réel** : `t10` (assertions), puis test de perte de réponse (couper après le POST client). **Régression** : création de client en ligne, import batch, plafond de crédit.
- **Effort** : 2 j.
- **Offline — flux** : client `cli_temp_x` + dette(`cli_temp_x`) → sync client → `id` serveur → dette réécrite avec l'`id` serveur → sync dette (idempotente) → solde = montant, historique créé.

### AUD-093 — Session de caisse locale ; clôture Z sans effet
- **Constat / preuve** : rapport, `boutique_pos_sessions` vide, `cloturer` → 200 sans écriture. **Cause** : DÉMONTRÉE.
- **Correction** : ouvrir la session côté serveur (`POST /pos-sessions/ouvrir`, déjà codé) quand en ligne ; hors-ligne, créer une session locale `loc_…` placée en file `session_open` avec clé d'idempotence, dont les ventes référencent l'identifiant local et sont remappées à la synchronisation. La route `cloturer` **refuse** (400) un identifiant invalide au lieu de répondre `success`, et ne répond `success` qu'après avoir écrit.
- **Étapes** : 1) `ouvrirSession` appelle l'API ; 2) migration : `ALTER TABLE boutique_pos_sessions ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128)` + index unique partiel ; 3) file `session_open` avant `ventes` et `clôtures` ; 4) `cloturer` : validation, 404 si la session n'existe pas pour cette boutique, calcul serveur comme aujourd'hui ; 5) `pos-vente` rattache `session_id` après remappage.
- **Fichiers** : `PosModalsHost.tsx`, `PosSessionModals.tsx`, `sync-manager.ts`, `db-offline.ts`, `boutiques-pos.js`, migration. **API** : `ouvrir` (idempotence), `cloturer` (400/404). **DB** : colonne + index.
- **Conflit** : deux appareils ouvrant chacun une session pour la même boutique → autorisé (sessions par caissier), sinon fusion à décider avec le marchand ; clôture d'une session déjà clôturée → 409 idempotent.
- **Critères** : après ouverture, une ligne `boutique_pos_sessions` ; les ventes portent le bon `session_id` ; `cloturer` avec `SESS-…` → 400 ; clôture hors-ligne synchronisée → session `cloturee`, écart calculé, journal d'audit écrit.
- **Test réel** : nouveau test (ouvrir → vendre → clôturer, en ligne puis hors-ligne) + `cloturer` sans effet. **Régression** : rapport X/Z existants, `pos-vente` sans session, terminal par jeton.
- **Risque** : moyen (touche l'ouverture de caisse). **Retour arrière** : revert du lot ; colonnes inoffensives. **Effort** : 3 j.
- **Offline — flux** : session locale + ventes `session=loc_1` → sync : `session_open` crée l'UUID → ventes remappées → clôture envoyée → serveur recalcule par `session_id` → `cloturee`.

### AUD-091 — Déconnexion sans purge de l'appareil
- **Constat / preuve** : `t08`. **Cause** : DÉMONTRÉE.
- **Correction** : (1) fonction unique `purgerDonneesLocales()` **attendue avant** la soumission de la déconnexion, qui supprime : entrées privées du Cache Storage, `localStorage` par préfixes (`nopalou_offline_`, `nopalou_pos_`, `nopalou_bilan_`, `nopalou_plan_`, `nopalou_user_id`…), IndexedDB (`produits`, `clients`, `caissiers`, `marchand_boutiques`) ; (2) ne plus mettre en cache les réponses authentifiées : le SW rejette tout ce qui porte `Cache-Control: private/no-store` et le backend pose `private` sur les routes authentifiées ; (3) purge aussi sur session expirée (réponse 401) ; (4) files non synchronisées : décision D3 (par défaut : avertir et exiger la synchronisation ou un export avant déconnexion).
- **Étapes** : 1) nouveau module `lib/purge-local.ts` ; 2) `NavbarActions.tsx:54-80`, `MobileNavUserCard.tsx` et tout autre bouton de déconnexion l'appellent ; 3) plugin `cacheWillUpdate` dans `sw.ts` ; 4) en-têtes `Cache-Control: private` sur `/api/boutiques|comptabilite|agences|analytics` (middleware) ; 5) message SW `PURGE_PRIVATE` pour vider les caches d'exécution.
- **Fichiers** : `NavbarActions.tsx`, `MobileNavUserCard.tsx`, `db-offline.ts`, `sw.ts`, `useBoutiqueOfflinePreloader.ts` (clés), `backend/app.js` ou middleware d'en-têtes. **DB** : aucune.
- **Critères** : après déconnexion, `caches` sans entrée privée, aucune clé `nopalou_*` liée à un compte, IndexedDB vidé, et hors-ligne `/boutique/caisse`, `/boutique`, `/compte` renvoient la page de secours ou la connexion.
- **Test réel** : `t08` (assertions inversées) + variante session expirée. **Régression** : le hors-ligne de l'utilisateur **connecté** fonctionne toujours (`t05b`) ; déconnexion avec file non vide (D3) ; changement de compte sur le même appareil.
- **Risque** : élevé pour le hors-ligne si le cache authentifié est retiré sans alternative → conserver les données POS hors-ligne dans IndexedDB **par utilisateur** (déjà le cas) et supprimer seulement le cache SW des API privées. **Effort** : 3 j.
- **Offline — flux** : données locales du compte A → déconnexion → purge complète ; file non vide → blocage ou export → état final : appareil sans donnée de A.

### AUD-094 — Chatbot : import manquant, « Oups » après commande
- **Constat / preuve** : `t13`, `t13b`. **Cause** : DÉMONTRÉE (`whatsapp-chatbot.js:2194`).
- **Correction** : importer `sendWhatsAppTemplate` ; isoler les notifications (une erreur de notification ne doit **jamais** empêcher la confirmation au client) ; rendre la confirmation idempotente par session/groupe (un second « confirmer » renvoie la confirmation, sans nouvelle notification).
- **Étapes** : 1) ajouter l'import (`:3-16`) ; 2) `try/catch` autour des notifications dans `notifierVendeurPanierGroupe` ; 3) stocker `groupeCommande` dans la session et le réutiliser au nouvel essai ; 4) ESLint `no-undef` sur `backend/` (Phase 0).
- **Fichiers** : `whatsapp-chatbot.js`, config ESLint. **API / DB** : aucune.
- **Critères** : `t13` : le client reçoit le récapitulatif de confirmation, pas le message d'erreur ; `t13b` : une seule notification marchand, même référence de groupe.
- **Test réel** : `t13`, `t13b` (assertions). **Régression** : commande simple, commande groupée, retrait/livraison, suite `tests/unit` du chatbot. **Risque** : faible. **Retour arrière** : revert. **Effort** : 0,5 j.

### AUD-095 — « WhatsApp Direct » : référence inventée, commande absente
- **Constat / preuve** : `t12`, `t12b`. **Cause** : DÉMONTRÉE ; la branche « Wave opérationnel » reste en CODE.
- **Correction** : (1) ne plus forcer `wave` : utiliser une méthode sans passerelle (décision D4 ; sinon `especes` avec note `[À confirmer sur WhatsApp]`) ; (2) n'afficher une référence que si l'API a répondu OK ; sinon message sans « Réf » et texte « commande non enregistrée, le vendeur vous répond sur WhatsApp » ; (3) hors-ligne : file locale `commande_whatsapp` avec clé d'idempotence, créée à la synchronisation, le message WhatsApp partant quand même ; (4) `POST /comptabilite/:id/commandes` accepte `idempotency_key`.
- **Étapes** : 1) `useDrawerCartCheckout.ts:349-448` ; 2) migration : `ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128)` + index unique partiel ; 3) route de création ; 4) indicateur « commande en attente d'envoi » dans l'interface.
- **Fichiers** : `useDrawerCartCheckout.ts`, `db-offline.ts` (nouvelle file), `sync-manager.ts`, `comptabilite.js`/`commande-service.js`, migration. **DB** : colonne + index.
- **Conflit** : le client renvoie le même panier deux fois → deux clés différentes, deux commandes (comportement normal) ; même clé → une seule.
- **Critères** : en ligne, la référence du message = la référence en base ; hors-ligne, la commande apparaît à la reconnexion avec la référence affichée à l'écran ; aucun `CMD-WA-…` fabriqué ; aucune session Wave créée pour ce bouton.
- **Test réel** : `t12`, `t12b` (S3) avec assertions. **Régression** : formulaire espèces, Wave (échec et succès simulé), stock restitué, AUD-010/083. **Effort** : 2 j.
- **Offline — flux** : clic hors-ligne → commande locale + clé → lien WhatsApp avec « commande en attente d'envoi » → reconnexion → création idempotente → référence serveur → (option) message complémentaire au marchand.

---

## 4. Phase 2 — P2

**Valeurs par défaut de cette section et de la suivante**, sauf mention contraire dans la fiche : environnement = production locale isolée ; **constat, preuve, reproduction, cause et impact = fiche de même numéro du rapport** ; API et base de données : aucune modification ; stratégie offline, synchronisation et risque de conflit : non concernés ; risque de régression faible ; retour arrière = revert du commit ; **test de régression** = suite de la zone concernée + `t12` (panier/commande) et `t05b` (caisse hors-ligne) quand le lot touche ces parcours.

### AUD-096 — Horodatage des ventes hors-ligne
- **Cause** : DÉMONTRÉE. **Correction** : envoyer `client_date` (déjà stocké) pour ventes, dépenses, dettes, clôtures ; le serveur l'accepte seulement dans `[maintenant − 30 j ; maintenant + 5 min]` (sinon `NOW()` et note), l'écrit dans `created_at` et conserve `synced_at = NOW()` (colonne `ADD COLUMN IF NOT EXISTS`).
- **Fichiers** : `sync-manager.ts:61-74` (et homologues), `boutiques-pos.js:275`, `comptabilite.js`, `credits.js`, migration. **Conflit** : horloge d'appareil fausse → borne de validité et drapeau `date_corrigee`.
- **Critères / test** : `t05b` : `created_at` = heure de la vente (±1 s), `synced_at` = reconnexion ; bilan journalier inchangé pour les ventes en ligne. **Effort** : 1,5 j.
- **Offline — flux** : vente à 18:00 hors-ligne → sync à 08:00 → `created_at` 18:00, `synced_at` 08:00 → bilan du jour J correct.

### AUD-097 — Survente silencieuse
- **Cause** : DÉMONTRÉE (`GREATEST(0, …)`). **Correction** (selon D1, recommandé) : accepter la vente (marchandise remise), ramener le stock à 0 **et enregistrer l'écart** (`ventes.stock_conflit boolean`, table `stock_ecarts(boutique_id, produit_id, vente_reference, quantite_manquante, created_at)`), puis afficher l'écart dans l'inventaire et notifier le marchand.
- **Fichiers** : `boutiques-pos.js:246`, migration, vue inventaire. **API** : `pos-vente` renvoie `conflit: true`. **Conflit** : deux ventes hors-ligne du dernier article → deux écarts d'un ; résolution manuelle (recomptage).
- **Critères / test** : `t05b` (scénario autre appareil) : 2 ventes, stock 0, **1 écart enregistré et visible**. **Effort** : 2 j.
- **Offline — flux** : vente locale (stock local 1→0) → sync : stock serveur déjà 0 → vente acceptée, écart −1 → état `conflict` visible → recomptage → clôture de l'écart.

### AUD-101 — `prix_unitaire`, libellés, adresse
- **Cause** : DÉMONTRÉE. **Correction** : `prix_unitaire` = prix réel d'une unité quand la commande n'a qu'une ligne, `NULL` pour une commande multi-lignes (le total fait foi, détail dans `commandes_boutique_items`) ; notifications et factures calculées depuis les lignes ; libellé sans doublon de quantité ; `client_adresse` = « Retrait en boutique » en retrait. **Ne pas recalculer l'historique** sans validation (proposer un script séparé, en lecture d'abord).
- **Fichiers** : `commande-service.js:350-360`, `whatsapp-chatbot.js:2172`, constructions de message/facture. **Critères / test** : `t13` : ligne « 2× Robe — 30 000 FCFA », total 55 000, adresse « Retrait en boutique » ; relire exports et PDF. **Risque** : moyen (rapports consommant `prix_unitaire`) → inventaire des lecteurs avant modification. **Effort** : 1,5 j.

### AUD-102 — Notification vendeur faussement « transmise »
- **Cause** : DÉMONTRÉE. **Correction** : `sendWhatsAppNotification` renvoie `{ delivered, channel }` et rejette sur échec total ; la note n'est écrite que si `delivered` ; un échec alimente `notification_echecs` (déjà existante) avec reprise planifiée ; ne notifier qu'**après** l'initialisation du paiement (commande Wave) pour ne pas alerter sur une commande annulée.
- **Fichiers** : `whatsapp.js`, `commande-service.js:111-119`. **Critères / test** : avec envoi bloqué (banc d'essai), pas de note « transmise », une ligne `notification_echecs` ; Wave en échec → aucune notification. **Effort** : 1 j.

### AUD-100 — Lien « paiement 1-clic » du bot
- **Cause** : DÉMONTRÉE. **Correction** : créer côté serveur un panier express signé (`POST /api/panier-express` → jeton 24 h, lignes et quantités figées), le lien porte le jeton ; la page relit le panier et **recalcule les prix**. Table `paniers_express(token, boutique_id, lignes jsonb, telephone, expire_le)` (migration idempotente).
- **Fichiers** : `whatsapp-chatbot.js:2126`, nouvelle route, `checkout-express/page.tsx`. **Sécurité** : jeton non devinable, expiration, pas de prix dans l'URL. **Critères / test** : `t13c` : 2× Robe + 1× Boubou, 55 000 FCFA. **Risque** : moyen. **Effort** : 2 j.

### AUD-099 — Prix/stock périmés (réseau lent, panier)
- **Cause** : DÉMONTRÉE. **Correction** : (1) le SW marque les réponses servies depuis le cache (en-tête ajouté par un plugin) et la page affiche « Prix relevés le … » ; (2) à l'ouverture du tiroir panier et avant validation, revalider les prix via un appel serveur et signaler tout écart avant le paiement ; (3) l'écran de confirmation affiche le **montant renvoyé par le serveur** (`commande.montant_total`), jamais un total calculé côté client ; (4) réévaluer les délais `NetworkFirst` (1 s / 3 s) pour les pages prix.
- **Fichiers** : `sw.ts:254-307`, `CartContext.tsx`, `DrawerCart*`, page produit. **Critères / test** : `t11b` : indicateur visible sur contenu périmé ; `t12b` S4 : écart détecté avant validation, confirmation = 16 000. **Régression** : promo, frais de livraison, variantes. **Effort** : 3 j.

### AUD-098 — Résultats d'une autre recherche
- **Cause** : DÉMONTRÉE. **Correction** : retirer `ignoreSearch: true` pour les pages dont le contenu dépend de la requête (`/recherche`, filtres) ; hors-ligne sans entrée exacte, afficher « Recherche indisponible hors-ligne » avec les recherches récentes disponibles. Conserver `ignoreSearch` seulement pour les ressources statiques.
- **Fichiers** : `sw.ts:434,453,483`. **Critères / test** : `t01` : `/recherche?q=boubou` hors-ligne → message explicite, jamais le titre `"robe"`. **Effort** : 0,5 j.

### AUD-103 — Lien mort et promesse de la page hors-ligne
- **Cause** : DÉMONTRÉE. **Correction** : lien carnet vers `/boutique?manage=<dernière boutique>&tab=carnet` (ou `/boutique`) ; texte véridique (« ventes et dettes saisies hors-ligne sont enregistrées et envoyées à la reconnexion ») ; test automatique qui extrait chaque `href` du HTML de secours et vérifie qu'aucun ne mène à 404.
- **Fichiers** : `sw.ts:154,172`. **Critères / test** : tous les liens répondent ≠ 404 (connecté). **Effort** : 0,5 j.

### AUD-104 — Synchronisation en arrière-plan inexistante
- **Cause** : DÉMONTRÉE (CODE). **Correction** : (1) à chaque mise en file, `registration.sync.register('nopalou-sync')` quand disponible ; (2) le SW, à l'événement `sync`, demande aux clients de synchroniser (ou exécute la synchronisation lui-même, les requêtes relatives portant le cookie) ; (3) repli obligatoire : synchronisation **au démarrage** de l'application en ligne et à intervalle (la Background Sync API est absente d'iOS/Safari) ; (4) supprimer le handler `periodicsync` inutile.
- **Fichiers** : `sw.ts:505-524`, `sync-manager.ts`, `RegisterSW.tsx`. **Critères / test** : application fermée en ligne retrouvée après coupure → la file se vide sans ouvrir la caisse (Chromium) ; rouverture déjà en ligne → synchronisation immédiate (à valider sur appareil). **Risque** : moyen (authentification dans le SW). **Effort** : 2 j.

---

## 5. Phase 3 — P3

- **AUD-105** : mapper le code PostgreSQL `23505` sur `caisse_documents` vers `{ success: true, duplicate: true }` (`boutiques-pos.js`, bloc d'insertion). Test : `t14` → 0 réponse 500 sur 6. Effort 0,25 j.
- **AUD-106** : le widget lit l'état réseau (`useOnlineStatus`) : en hors-ligne, message « Vous êtes hors-ligne », badge « Hors-ligne » à la place de « En ligne ». Test : `t20d` (capture et assertion de texte). Effort 0,25 j.
- **AUD-107** : déclarer `icon-maskable-192/512.png` avec `purpose: "maskable"` dans `manifest.json`, incrémenter le paramètre de version des icônes. Test : Lighthouse installabilité / inspecteur d'application sur Android. Effort 0,25 j.

## 6. Stratégie de test

- **Tests à assertions** dérivés de `scripts/audit/offline/` (Phase 0), exécutés contre la pile isolée : un test qui **échoue sans le correctif** (contrôle par mutation, comme `t05e`) puis passe avec.
- **Unitaires** : règles de réclamation des files, remappage des identifiants, validation de `client_date`, mapping d'erreurs (réseau/métier) — sans IndexedDB réel (simulation).
- **Intégration** : routes idempotentes (`pos-vente`, `credits-clients`, `pos-sessions`, `commandes`) contre la base locale ; `t14` généralisé (rafales identiques).
- **Navigateur** : coupure/retour réseau répétés (20 cycles), fermeture/réouverture, deux onglets, réseau lent via `delay-proxy.mjs`, mobile (émulation **et** appareil réel).
- **Non-régression** : suites existantes backend (55/55) et frontend (69), `tsc --noEmit`, `npm run lint:slop`, recoupements de l'audit précédent (AUD-010, 011, 072, 081, 082, 083, accès anonyme admin).

## 7. Indicateurs de sortie

1. 0 rechargement sur 20 cycles hors-ligne/en ligne ; ticket conservé.
2. Aucune entrée de file en `syncing` de plus de 60 s ; toute erreur métier visible côté caissier.
3. Client + dette hors-ligne : état final exact en base après reconnexion.
4. Sessions de caisse en base, clôture Z persistée, aucune réponse « succès » sans écriture.
5. Après déconnexion : 0 entrée privée en cache navigateur ; pages privées inaccessibles hors-ligne.
6. Précache présent après activation ; page interactive hors-ligne avec cache HTTP vidé.
7. Chatbot : aucune `ReferenceError` ; confirmation client reçue ; une seule notification marchand.
8. Référence affichée = référence en base pour tout parcours WhatsApp ; aucun montant affiché ≠ montant enregistré.
9. Rejeu complet sur un Android réel, réseau mobile instable, consigné dans `docs/JOURNAL-LIVRAISONS.md`.

## 8. Effort estimé

Phase 0 : 3 j ; Phase 1 : ~15 j ; Phase 2 : ~14 j ; Phase 3 : 0,75 j ; régression globale et appareil réel : 3 j. **Total indicatif : ~36 jours-personne**, dont le chemin critique 087 → 092 → 088/089 → 090/093 (~9 j).
