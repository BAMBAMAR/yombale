# Audit hors-ligne, PWA, parcours E2E et WhatsApp — 30 septembre 2026

Complète `AUDIT-NOPALOU-2026-09-30.md` (qui listait « PWA hors-ligne », « parcours UI » et « chatbot / WhatsApp » comme NON FAIT). Numérotation à la suite : **AUD-087 à AUD-107**. Plan de correction : `PLAN-CORRECTION-OFFLINE-PWA-2026-09-30.md`. Tests rejouables : `scripts/audit/offline/` (README inclus).

**Convention de preuve.** PROUVÉ = reproduit par exécution (script cité). CODE = démontré par lecture de code, non exécuté de bout en bout. HYPOTHÈSE = plausible, non démontré. Un comportement « PASS » n'est déclaré que s'il a été exécuté. Rien n'a été corrigé pendant l'audit.

---

## 1. Résumé

- **21 anomalies** : 9 en P1, 9 en P2, 3 en P3. Aucune P0 : pas de perte d'argent exploitable sans authentification, pas de fuite inter-tenant, pas d'arrêt de service.
- **Cause racine principale, prouvée par contrôle de mutation : `@serwist/next` recharge la page à chaque événement `online`** (`reloadOnOnline` vaut `true` par défaut, `next.config.js` ne le désactive pas). Sur la caisse, une micro-coupure de 2,5 s suffit à perdre le ticket en cours, redemander le PIN et tuer une synchronisation en cours (AUD-087, AUD-088).
- **Le mode hors-ligne de la caisse enregistre bien les ventes** (persistance IndexedDB, survie à la fermeture de l'onglet, rejeu idempotent côté serveur), mais **il ne garantit ni la reprise, ni l'information du caissier, ni la justesse comptable** : entrée bloquée à vie, vente refusée affichée comme réussie, dette rattachée à un client temporaire jamais résolue, clôture Z sans effet serveur, ventes datées de la reconnexion.
- **La déconnexion ne purge pas l'appareil** : 33 réponses d'API privées, ~40 clés `localStorage` et les caches IndexedDB restent, et la caisse et l'espace boutique du marchand s'ouvrent encore hors-ligne (AUD-091).
- **WhatsApp** : le flux « WhatsApp Direct » invente une référence absente de la base (AUD-095) ; le chatbot crée les commandes puis répond « Oups » au client à cause d'un import manquant (AUD-094) ; le lien « paiement 1-clic » perd 2 articles sur 3 (AUD-100).
- **Recoupés et tenus** (rejoués, non re-signalés) : restitution du stock si Wave échoue, prix fixés par le serveur, accès anonyme à l'administration (voir §6).

## 2. Méthode, périmètre, état de départ

- **Environnement** : pile isolée (`scripts/audit/`) — PostgreSQL local `nopalou_audit` (port 54329), backend `:4100`, garde réseau en liste blanche, clés externes factices. Aucun appel vers la production ni vers Wave, WhatsApp/Meta, Cloudinary, Resend, Stripe.
- **Frontend en production** (`next build` + `next start :3001`) : le Service Worker est désactivé en mode dev, ce qui explique que les audits précédents n'aient pas pu l'examiner. Le build régénère `public/sw.js` (fichier suivi) : **restauré** par `git checkout` en fin d'audit. Seul changement résiduel : le dossier `scripts/audit/offline/` (non commité).
- **Navigateur** : Chromium headless via Playwright 1.61 (bureau 1280×800). **Pas d'appareil réel, pas de réseau mobile réel.**
- **Chatbot WhatsApp** : le vrai `whatsapp-chatbot.js` exécuté dans un processus Node contre la base locale ; seul l'envoi vers `graph.facebook.com` est remplacé par une capture (`bot-harness.js`). Aucun message réel.
- **Données** : comptes et commandes de test créés dans `nopalou_audit` uniquement (marchand M, boutique X à abonnement expiré, acheteur Z). L'abonnement de M, modifié pour un test, a été **restauré** (vérifié en base).
- **Branche** `audit/corrections-p0`, arbre propre au départ. **Limiteur du backend d'audit** : un HTTP 429 est apparu en cours de route (1 000 req/15 min) ; backend redémarré.

## 3. Ce qui doit fonctionner hors-ligne et ce qui exige le serveur

| Fonction | Attendu | Constat (test réel) |
|---|---|---|
| Pages publiques déjà visitées (accueil, boutique, fiche produit) | Hors-ligne, cache | **PASS** affichage depuis le cache HTML du SW ; contenu potentiellement périmé (AUD-099) |
| Pages jamais visitées | Page de secours explicite | **PASS** `/immo`, `/annonces` → page « Hors-Ligne » |
| Recherche déjà faite | Hors-ligne | **FAIL** AUD-098 : une autre recherche affiche les résultats de la première |
| Nouvelle recherche | Serveur | Non exécuté hors-ligne, voir AUD-098 (mauvais résultats affichés au lieu d'un avertissement) |
| Panier : ajout, quantités | Hors-ligne (`localStorage`) | **PASS** (cache HTTP du navigateur intact) ; **FAIL** si ce cache est vidé (AUD-092) |
| Commande en ligne (formulaire, Wave, OM) | Serveur (stock et prix autoritaires) | **PASS** en ligne ; hors-ligne **non exécuté** |
| « WhatsApp Direct » | Serveur pour créer la commande | **FAIL** AUD-095 : succès affiché sans commande |
| Caisse : consultation catalogue, PIN, vente | Hors-ligne | **PASS** catalogue, PIN et mise en file ; **FAIL** reprise et cohérence (AUD-087 à 090, 093, 096, 097) |
| Carnet de dettes : client, dette | Hors-ligne | **PASS** saisie locale ; **FAIL** synchronisation de la dette (AUD-090) |
| Clôture Z | Hors-ligne puis synchronisation | **FAIL** sans effet serveur (AUD-093) |
| Connexion, inscription | Serveur | **Non exécuté hors-ligne** (le SW les traite en `NetworkOnly`, CODE) |
| Paiement Wave / OM / Stripe | Serveur | En ligne : gestion d'erreur **PASS** ; succès **NON VALIDÉ** (intégration bloquée par l'isolation) |
| Dépôt d'annonce / immo | Serveur | **NON VALIDÉ** (téléversement Cloudinary bloqué) |
| Administration | Serveur | **PASS** en ligne ; hors-ligne non exécuté |
| Chatbot web | Serveur | **PASS** en ligne ; hors-ligne message inexact (AUD-106) |
| Chatbot WhatsApp | Serveur | Voir §5 |

## 4. Couverture des parcours E2E (INTERFACE → FRONTEND → API → BACKEND → DB → RÉSULTAT)

| Parcours | Résultat | Script |
|---|---|---|
| Inscription e-mail | **PASS** : formulaire → server action → API → ligne `utilisateurs` (`email_verifie=false`) → `/compte` | `t20a` |
| Connexion e-mail | **PASS** (toutes les sessions de test) | `lib.mjs` |
| Recherche → fiche produit | **PASS** : `/recherche?q=robe bazin` → fiche | `t20a` |
| Boutique, fiche produit, panier | **PASS** (2×15 000 + 1×25 000 = 55 000 affiché) | `t12` |
| Commande formulaire, espèces | **PASS** : en base, montant 55 000, client, adresse, `en_attente`, espèces ; stock décrémenté | `t12` |
| Commande Wave | Échec Wave géré : message clair, panier conservé, commande `annulee`, stock restitué (**PASS**, isolation : Wave injoignable). Succès Wave **NON VALIDÉ** | `t20e` |
| Annonce | Étape « Photos » atteinte ; publication **NON VALIDÉ — TEST RÉEL IMPOSSIBLE** (Cloudinary) | `t20c` |
| Immobilier | `/immo` et 5 liens chargent ; fiche détail et dépôt **NON VALIDÉ** (le premier lien est une page SEO, pas une fiche) | `t21` |
| Compte | 12 pages principales répondent 200 sans erreur affichée (chargement seulement) | `t20b` |
| Administration | **PASS** : anonyme → `/admin/login`, aucune donnée dans le HTML brut ; clé maîtresse → 7 pages chargées. Exactitude des chiffres **non vérifiée** | `t20f`, `t20g` |
| Chatbot web | **PASS** en ligne (produit et prix 15 000 corrects) | `t20d` |

## 5. Chaîne WEB → PANIER → COMMANDE → WHATSAPP → BOT → BACKEND → DB

Constat d'architecture (CODE + exécution) : **le message produit par le panier n'est jamais analysé par le chatbot.** Le message part vers le WhatsApp personnel du marchand via `wa.me`. La commande est créée séparément par un appel API avant l'ouverture de WhatsApp ; le texte n'est qu'informatif. L'étape « WHATBOT » de la chaîne demandée n'existe donc pas pour le panier web ; le chatbot a son propre flux de commande, audité séparément.

| Donnée | Formulaire web (espèces) | « WhatsApp Direct » web | Panier natif WhatsApp → bot |
|---|---|---|---|
| Produits, quantités | cohérents | message juste ; **commande absente ou annulée** | cohérents (DB : 2 commandes) |
| Prix, montant | serveur ; si le prix change après l'ajout au panier : 16 000 en base, 15 000 à l'écran (AUD-099) | message = prix du panier | DB juste ; **`prix_unitaire` erroné, ligne « 60 000 » dans la notification** (AUD-101) |
| Client | nom, téléphone, adresse saisis : cohérents | « Client WhatsApp / Via WhatsApp », sans adresse (par conception) | « Client WhatsApp », téléphone = expéditeur ; **adresse « Livraison standard » même en retrait** |
| Boutique | correcte | correcte | correcte |
| Statut | `en_attente` | `annulee` (Wave injoignable) | `en_attente` |
| Référence | `C-…` cohérente | **`CMD-WA-…` inventée, absente de la base** (AUD-095) | groupe ; **notification doublée avec une autre référence au nouvel essai** (AUD-094) |

---

## 6. Recoupement avec l'existant (règle permanente)

| Antérieur | Rejeu | Résultat |
|---|---|---|
| AUD-010 (stock non restitué si Wave échoue) | commande Wave forcée en échec via l'interface, stock relu | **recoupé, tenu** : commande `annulee`, stock restitué |
| AUD-011 / AUD-072 (prix client) | panier natif bot avec `item_price: 1` ; panier web à prix périmé | **recoupé, tenu côté serveur** (prix de la base) ; l'affichage client reste périmé : nouvelle fiche AUD-099 |
| AUD-083 (échec Wave : commande annulée + message) | idem | **recoupé, tenu** (message affiché dans le navigateur, ce qui était « non vérifié » dans l'audit précédent) |
| AUD-081/082 (POS sans session, PIN, pool) | `pos-vente` hors session → 403 ; 6 envois simultanés | **recoupé, tenu** : 1 vente, stock −1 ; 2 réponses 500 → AUD-105 |
| Accès anonyme à l'administration | GET `/admin*` sans session, HTML brut inspecté | **recoupé, tenu** |

---

## 7. Fiches

### AUD-087 — P1 — Chaque retour du réseau recharge toute l'application
- **Fonctionnalité** : toutes les pages (critique sur la caisse). **Environnement** : frontend production local.
- **Constat (PROUVÉ)** : `window.addEventListener("online", () => location.reload())` est enregistré par le code généré de `@serwist/next`. Un simple événement `online`, **même en ligne**, recharge la page.
- **Preuves** : `t04b` — événement `online` synthétique → `Page.frameRequestedNavigation reason=reload` ; `t04c` — le gestionnaire est listé par le navigateur, source `…/chunks/6763-….js` ; `t07` — ticket de 2 articles, coupure 2,5 s, reconnexion : ticket perdu, PIN redemandé ; `t05e` (mutation) — écouteur neutralisé : 0 rechargement sur 3 essais, file vidée 3/3 ; code tel quel : 1 rechargement à chacun des 3 essais, file bloquée à `syncing` dans 2 cas sur 3.
- **Cause (DÉMONTRÉE)** : `reloadOnOnline: z.boolean().default(true)` dans `@serwist/next@9.5.12` (`dist/chunks/schema-BHBmKqX3.js:9`) ; `frontend-next/next.config.js:1-4` ne le désactive pas.
- **Effets induits** : ticket et formulaires perdus, caisse reverrouillée (PIN), synchronisation interrompue (AUD-088), impression automatique hors-ligne qui recharge la page (`t21` : rechargement sans correction, aucun avec écouteur neutralisé).
- **Impact** : sur mobile en zone à réseau instable, chaque coupure/retour détruit le travail en cours du caissier.

### AUD-088 — P1 — Vente restée à l'état `syncing` : jamais renvoyée, jamais signalée
- **Constat (PROUVÉ)** : `t05e` tel quel : entrée bloquée 2 fois sur 3 alors que le serveur a bien enregistré la vente ; `t07` (b) : entrée à l'état `syncing` (état écrit par l'application avant l'envoi) → **0 requête en 45 s, absente de la base, aucun indicateur à l'écran**.
- **Cause (DÉMONTRÉE)** : `db-offline.ts:374` ne relit que `status === 'pending'` ; aucune remise en `pending` au démarrage ; déclencheur = rechargement en plein envoi (AUD-087, prouvé par mutation). Mêmes fonctions pour dettes, clôtures, dépenses, nouveaux clients (CODE).
- **Impact** : **perte silencieuse d'un encaissement** si l'application est rechargée ou fermée entre le marquage et la réponse, sans POST émis.

### AUD-089 — P1 — Vente refusée par le serveur affichée comme réussie
- **Constat (PROUVÉ, `t09`)** : abonnement expiré côté serveur pendant que la caisse est ouverte. Encaissement : ticket vidé, **aucun message**, compteur de session +5 000 / 1 vente, entrée `pending`, **aucune vente en base**. Chaque rechargement renvoie le même 403 (`ABONNEMENT_POS_REQUIS`), l'entrée reste `pending` sans signal.
- **Cause (DÉMONTRÉE)** : `useCaisseCheckout.ts:284-310` traite toute erreur de `creerPosVente` comme une panne réseau et met en file ; `sync-manager.ts:88-96` remet en `pending` les 4xx sans les exposer.
- **Impact** : espèces encaissées sans trace comptable ; aucun chemin de résolution pour le marchand.

### AUD-090 — P1 — Dette hors-ligne d'un client créé hors-ligne jamais synchronisée
- **Constat (PROUVÉ, `t10`)** : client créé hors-ligne + dette de 4 000 FCFA. Reconnexion : client présent en base (nouvel UUID) ; **dette toujours `pending` avec `client_id: cli_temp_…` après 25 s ; aucune ligne d'historique**.
- **Cause (DÉMONTRÉE)** : `useCarnetClients.ts:218` attribue `cli_temp_…` ; `sync-manager.ts:260-305` ne remappe pas l'identifiant serveur reçu ; `syncDette` (`:110-158`) poste sur l'identifiant temporaire. Complément (CODE) : création du client sans `idempotency_key` (`credits.js:125-149`), décision hors-ligne fondée sur `navigator.onLine` (`useCarnetClients.ts:193`).
- **Impact** : créance non enregistrée en base, sans signal.

### AUD-091 — P1 — La déconnexion ne purge pas les données de l'appareil
- **Constat (PROUVÉ, `t08`)** : après clic sur « Se déconnecter » : **33 réponses d'API privées** en Cache Storage (commandes, bilan, ventes, historique de dettes, équipe, journaux, fournisseurs, documents…), **~40 clés `nopalou_*`** en `localStorage`, IndexedDB `produits` 7, `clients` 1, `caissiers` 2 (codes PIN hachés), `marchand_boutiques` 1. **Hors-ligne et déconnecté**, `/boutique/caisse` et `/boutique` affichent « Boutique Off M… » et `/compte` le nom du compte.
- **Cause (DÉMONTRÉE)** : `NavbarActions.tsx:54-80` ne supprime que les clés contenant l'`userId` ; `db-offline.ts:965-990` ne purge que les stores dotés d'un index `by_user` (un seul) ; le SW met en cache les `GET /api/*` authentifiés 72 h et le HTML authentifié 7 j (`sw.ts:254-307`) sans purge à la déconnexion.
- **Impact** : appareil partagé (courant) : le suivant voit les données du marchand précédent ; la caisse reste utilisable hors-ligne avec les PIN. Exposition locale, pas inter-tenant via le serveur.

### AUD-092 — P1 — Le précache du Service Worker est supprimé dès l'activation
- **Constat (PROUVÉ, `t01b`)** : `serwist-precache-v2-…` créé à 254 ms puis **supprimé à 1 288 ms**. 21 chunks JS passent par le SW mais **0 est stocké** dans un cache. `t01c` : hors-ligne + cache HTTP vidé → la page s'affiche (HTML en cache) mais **le bouton « Ajouter au panier » ne fait rien** (panier `null`, 30 requêtes de chunks en échec).
- **Cause (DÉMONTRÉE)** : le handler `activate` (`sw.ts:409-422`) supprime tout cache absent de `CACHE_NAMES`, dont celui de Serwist.
- **Impact** : le hors-ligne dépend uniquement du cache HTTP du navigateur (éviction possible sur mobile) ; l'écran reste affiché alors que la fonction est morte.

### AUD-093 — P1 — Session de caisse uniquement locale ; clôture Z sans effet serveur
- **Constat (PROUVÉ)** : `boutique_pos_sessions` vide malgré une session « ouverte » à l'écran ; toutes les ventes ont `session_id = NULL`. `POST /pos-sessions/cloturer` avec `sessionId: "SESS-…"` → **HTTP 200 « Session clôturée avec succès »**, 0 session en base, aucune trace d'audit.
- **Cause (DÉMONTRÉE)** : `PosModalsHost.tsx:208-218` crée `SESS-<timestamp>` dans l'état React sans appeler `/pos-sessions/ouvrir` ; `boutiques-pos.js:841` ignore silencieusement les identifiants non-UUID et `:902` répond toujours `success`.
- **Impact** : rapport Z, écart de caisse et clôtures hors-ligne (file `clotures_queue`) sans aucune persistance serveur, avec message de succès.

### AUD-094 — P1 — Chatbot : commandes créées puis erreur « Oups » ; notification doublée
- **Constat (PROUVÉ, `t13`, `t13b`)** : panier natif de 2 articles → formule → confirmation : **2 commandes en base, stock décrémenté, texte envoyé au marchand, puis message « indisponibilité momentanée » au client**. Nouvel essai du client : nouvelle notification au marchand avec **une autre référence de groupe** (aucune commande supplémentaire : 2 en base).
- **Cause (DÉMONTRÉE)** : `ReferenceError: sendWhatsAppTemplate is not defined` — appelé à `whatsapp-chatbot.js:2194`, **non importé** (import `:3-16`), alors que `whatsapp.js:622` l'exporte.
- **Impact** : client non informé, risque de doublon d'intention, notification par modèle (hors fenêtre 24 h) jamais émise.

### AUD-095 — P1 — « WhatsApp Direct » : référence inventée, commande absente ou annulée
- **Constat (PROUVÉ, `t12`, `t12b`)** : le message annonce `Réf: *CMD-WA-2026-5794*` ; la base contient `C-MUOOKY3S336A`, statut **`annulee`** (« Annulée automatiquement : initialisation Wave impossible »). **Hors-ligne** : lien ouvert avec `CMD-WA-2026-2944`, panier vidé, écran de succès, **0 commande**.
- **Cause (DÉMONTRÉE)** : `useDrawerCartCheckout.ts:349-448` force `methode_paiement: 'wave'` (`:393`), ignore toute erreur de l'API (`:381-411`) et fabrique `CMD-WA-<année>-<aléatoire>` (`:413`) ; `data.wave_url` n'est pas exploité dans ce chemin.
- **Non vérifié** : avec Wave opérationnel, la session Wave créée n'est jamais transmise au client (CODE) ; la commande resterait `en_attente` jusqu'à l'annulation automatique.
- **Impact** : le marchand reçoit un message dont la référence n'existe pas, sans commande exploitable.

### AUD-096 — P2 — Ventes hors-ligne horodatées à la synchronisation
- **Constat (PROUVÉ, `t05b`)** : vente à 21:37:51, enregistrée `created_at` 21:38:23 (instant de reconnexion).
- **Cause** : le champ `date` est stocké localement mais non envoyé (`sync-manager.ts:61-74`) ; `boutiques-pos.js:275` écrit `NOW()`.
- **Impact** : une vente du soir synchronisée le lendemain est imputée au mauvais jour (bilan, rapports, relances de bilan).

### AUD-097 — P2 — Survente silencieuse hors-ligne / multi-appareil
- **Constat (PROUVÉ, `t05b`)** : dernier exemplaire vendu par un autre appareil pendant la coupure ; la vente hors-ligne du même article est **acceptée** à la synchronisation (2 ventes pour 1 unité), stock plafonné à 0, aucun signalement.
- **Cause** : `boutiques-pos.js:246` `GREATEST(0, stock − qté)`. Décision métier à prendre : la marchandise est déjà remise, le serveur doit accepter **et signaler** l'écart.

### AUD-098 — P2 — Le SW sert les résultats d'une autre recherche
- **Constat (PROUVÉ, `t01`)** : hors-ligne, `/recherche?q=boubou` (jamais faite) affiche la page titrée `"robe" — Recherche Nopalou`, sans avertissement.
- **Cause (DÉMONTRÉE)** : `caches.match(request, { ignoreSearch: true })` (`sw.ts:434`, aussi `:453`, `:483`).

### AUD-099 — P2 — Prix et stock périmés présentés sans indication (réseau lent, panier)
- **Constat (PROUVÉ, `t11b`)** : latence serveur 6 s : au bout de 3,1 s le SW sert la fiche en cache à **15 000 FCFA** alors que le prix réel est **17 000** ; aucun indicateur. `t12b` (S4) : prix passé de 15 000 à 16 000 après l'ajout au panier ; le panier et l'écran de confirmation affichent 15 000, **la base enregistre 16 000**.
- **Cause (DÉMONTRÉE)** : `NetworkFirst` à délai court sur le HTML (3 s, 7 j) et l'API (1 s, 72 h) (`sw.ts:254-307`) ; `CartContext.tsx:146-178` fige le prix à l'ajout, sans revalidation.
- **Limite du test** : proxy de délai local, pas un réseau mobile réel.

### AUD-100 — P2 — Le lien « paiement 1-clic » du bot ne porte que le premier article
- **Constat (PROUVÉ, `t13c`)** : panier de 3 articles (55 000 FCFA) → lien `checkout-express?produit=<premier>` → page avec **1 × Robe, 15 000 FCFA** (Boubou et quantité 2 perdus).
- **Cause** : `whatsapp-chatbot.js:2126` (un seul `produit`, pas de quantités ni de panier).

### AUD-101 — P2 — `prix_unitaire` incohérent avec la quantité ; libellés et adresse
- **Constat (PROUVÉ)** : ligne « 2× Robe » : `commandes_boutique.prix_unitaire = 30 000`, `quantite = 2` (la table de lignes porte 15 000) ; notification marchand « • 2x Robe Bazin Off × 2 — **60 000 FCFA** » avec « Total : 55 000 ». Commande web de 3 articles : `prix_unitaire = 55 000`, `quantite = 3`. Adresse `Livraison standard` même en retrait.
- **Cause** : `commande-service.js:350-360` écrit `sousTotal` dans `prix_unitaire` ; `whatsapp-chatbot.js:2172` multiplie à nouveau.
- **Impact** : tout calcul `prix_unitaire × quantite` (facture, export) est faux.

### AUD-102 — P2 — Notification vendeur marquée « transmise » malgré l'échec d'envoi
- **Constat (PROUVÉ)** : journaux : les deux envois (texte et modèle) échouent ; la commande porte néanmoins `[Notif WhatsApp vendeur transmise]` et `notification_echecs` reste vide. Le marchand est aussi notifié d'une commande qui sera annulée (Wave).
- **Cause** : `commande-service.js:111-119` écrit la note dans le `.then` ; `sendWhatsAppNotification` ne rejette pas en cas d'échec.

### AUD-103 — P2 — Lien mort et promesse non tenue dans la page hors-ligne
- **Constat (PROUVÉ)** : le bouton « Ouvrir le Carnet de Dettes » mène à `/boutique/carnet` → **« Page introuvable »** (en ligne et connecté). Le carnet est à `/boutique?manage=<id>&tab=carnet`. Le texte promet que caisse et carnet « restent pleinement opérationnels hors-ligne » (faux pour la synchronisation, AUD-087 à 090).
- **Fichier** : `sw.ts:154,172`.

### AUD-104 — P2 — Aucune synchronisation en arrière-plan
- **Constat (CODE + recherche exhaustive)** : les écouteurs `sync`/`periodicsync` du SW (`sw.ts:505-524`) ne font que journaliser ; **aucun** `sync.register` dans l'application. La synchronisation ne s'exécute que dans une page ouverte, sur transition hors-ligne → en ligne (`RegisterSW.tsx:175-189`, `usePosSyncNotifications.ts:30-41`). Application fermée hors-ligne puis rouverte déjà en ligne : pas de transition, pas de synchronisation avant la prochaine ouverture de la caisse.
- **Statut** : CODE (le cas « rouverte déjà en ligne » n'a pas été exécuté).

### AUD-105 — P3 — Envois simultanés : HTTP 500 au lieu de « doublon »
- **Constat (PROUVÉ, `t14`)** : 6 envois identiques → 1 vente, stock −1, mais **2 réponses 500**. Le client réessaie, sans conséquence durable.

### AUD-106 — P3 — Chat web hors-ligne : message inexact
- **Constat (PROUVÉ, `t20d`)** : « Nos serveurs sont momentanément occupés » avec l'en-tête « Assistant certifié • En ligne » alors que l'appareil est hors-ligne.

### AUD-107 — P3 — Icônes `maskable` non déclarées
- **Constat (PROUVÉ)** : `public/icons/icon-maskable-*.png` existent ; `manifest.json` ne déclare que `purpose: "any"`. Toutes les ressources déclarées répondent 200.

---

## 8. Hypothèses et causes à confirmer (non numérotées)

- **H-1** Injection dans le ticket imprimé : `usePosPrinting.ts:105-151` insère noms de boutique, de caissier et de produits dans `document.write` sans échappement (CODE). Exploitabilité non établie : exige un nom contrôlé par un tiers.
- **H-2** Les codes PIN sont stockés hachés (SHA-256 salé par l'identifiant de boutique) dans IndexedDB/`localStorage` pour la validation hors-ligne ; l'espace de 4 à 6 chiffres rend le hachage peu protecteur contre quelqu'un disposant de l'appareil (CODE, non testé ; lié à AUD-091).
- **H-3** Toute erreur 4xx à la synchronisation (session expirée, 401) suit le même chemin que le 403 d'AUD-089 (CODE, seul le 403 est exécuté).
- **H-4** Le rechargement à l'impression hors-ligne est expliqué par AUD-087 (mutation concluante) ; le déclencheur exact de l'événement `online` à l'ouverture de la fenêtre d'impression n'est pas établi et peut différer sur appareil réel.

## 9. Non vérifié — NON VALIDÉ, TEST RÉEL IMPOSSIBLE ou non exécuté

| Point | Raison |
|---|---|
| Installation PWA (invite, Android, iOS « Ajouter à l'écran d'accueil ») | pas d'appareil ; `beforeinstallprompt` non déclenchable en headless. Seuls manifeste et ressources contrôlés |
| Notifications push, Periodic Sync, widgets, `file_handlers`, `share_target` | non testables ici |
| Mise à jour du SW (nouveau déploiement), `controllerchange`, Force-update | non rejoué ; le rechargement sur changement de contrôleur (`RegisterSW.tsx:97-104`) n'a pas été exercé |
| Comportement sur réseau mobile réel, batterie, mémoire, éviction du cache | pas de matériel |
| Connexion, inscription, commande, annonce, administration **hors-ligne** | non exécutés |
| Succès Wave / Orange Money / Stripe, webhooks, reversement | intégrations bloquées par l'isolation |
| Publication d'annonce, dépôt immobilier, photos | Cloudinary bloqué |
| Fiche immobilière détaillée, agences | non atteinte |
| Menus marchand du chatbot (`menu_marchand`, caisse WhatsApp…), recherche immo, suivi de commande | non exercés |
| Impression réelle (ESC/POS, Bluetooth) | neutralisée dans les tests |
| Deux onglets synchronisant simultanément | non exercé (verrou par module, CODE) |
| Exactitude des chiffres de l'administration | chargement seulement |

## 10. Actions hors code

Aucune rotation de secret ni variable d'exploitation n'est requise par ces constats. **Décisions métier à prendre** (par le propriétaire du produit) : politique de survente hors-ligne (AUD-097), horodatage des ventes différées (AUD-096), durée de rétention des données locales après déconnexion et sur session expirée (AUD-091).

## 11. Rejouer

```powershell
powershell -File scripts\audit\check-pg.ps1
powershell -File scripts\audit\start-stack.ps1            # backend :4100
# frontend production : voir scripts/audit/offline/README.md
node scripts/audit/offline/01-setup.js
$env:AUDIT_TMP = "<dossier contenant q.js>"; $env:AUDIT_BASE = 'http://localhost:3001'   # panier
node scripts/audit/offline/t05e-mutation-reload.mjs      # contrôle par mutation d'AUD-087/088
node scripts/audit/offline/t13-bot.js                    # chatbot réel, envoi Meta capturé
```
