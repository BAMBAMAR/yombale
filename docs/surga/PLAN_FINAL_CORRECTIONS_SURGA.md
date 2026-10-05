# PLAN FINAL DE CORRECTIONS & FEUILLE DE ROUTE OPÉRATIONNELLE — SURGA

> **Document Officiel Consolidé de Remédiation — Clôture de la Série d'Audits**  
> **Auteur** : Agent 4 (Synthèse Consolidée des Agents -1, 0, 1, 2, 3 et 4)  
> **Date** : 5 Octobre 2026  
> **Statut** : **FEUILLE DE ROUTE DÉFINITIVE & DÉDUPLIQUÉE POUR LA MISE EN PRODUCTION**

---

## 1. PRINCIPES DIRECTEURS DE LA REMÉDIATION

Pour garantir un assainissement rapide et méthodique sans régressions transverses sur l'écosystème Nopalou :
1. **Priorisation Stricte par Impact Réel** : Les failles de sécurité, de perte de données et de fraude financière sont traitées en P0 absolu.
2. **Élimination des Doublons Inter-Agents** : Les constats recoupés (ex: déconnexion DB relevée par Agent 0 et 3, activation gratuite relevée par -1, 0 et 4) sont fusionnés en tickets d'ingénierie uniques.
3. **Règle Zéro Correction Silencieuse** : Toute modification appliquée en phase de développement devra faire l'objet d'un retest systématique documenté et d'un contrôle de non-régression.
4. **Sanctuaire Nopalou Intouchable** : Aucune correction sur Surga ne doit modifier les tables marchandes (`boutique_*`, `produits`) ni impacter le logiciel de caisse tactile POS (`/caisse`).

---

## 2. RÉCAPITULATIF DES TICKETS PAR NIVEAU DE PRIORITÉ

```text
+-------------------------------------------------------------------------------+
| TOTAL DES ACTIONS CORRECTIVES IDENTIFIÉES : 17 ACTIONS STRUCTURANTES          |
+-------------------------------------------------------------------------------+
| P0 — BLOQUANT POUR LA SÉCURITÉ & L'INTÉGRITÉ FINANCIÈRE : 4 ACTIONS          |
| P1 — CRITIQUE AVANT LANCEMENT PUBLIC & ACQUISITION      : 6 ACTIONS          |
| P2 — IMPORTANT POUR LA QUALITÉ PRODUIT & LE SEO         : 4 ACTIONS          |
| P3 — AMÉLIORATIONS PLANIFIÉES POST-LANCEMENT            : 3 ACTIONS          |
+-------------------------------------------------------------------------------+
```

---

## 3. P0 — TICKETS BLOQUANTS (SÉCURITÉ, ARGENT & INTÉGRITÉ DES DONNÉES)

---

### TICKET-P0-01 : Sécurisation Absolue de l'Export & Suppression des Données (Anti-IDOR)
- **ID Source** : `BLOC-P0-01` (Agent -1) / `SURGA-003` (Agent 0)
- **Problème** : Dump et effacement complet des données personnelles (notes, dépenses, rappels) accessibles à quiconque connaît un numéro de téléphone via `?phone=`, sans jeton d'authentification.
- **Preuve** : `GET /api/surga/donnees/export?phone=221770000000` renvoie le payload JSON complet en statut 200 OK.
- **Cause** : Utilisation de `tokenOptional` au lieu de `verifierToken` strict dans `backend/routes/surga/donnees.js`.
- **Correction** :
  1. Remplacer `tokenOptional` par `verifierToken` sur `routes/surga/donnees.js`.
  2. Forcer `const userId = req.user.userId;` et interdire la lecture d'un `phone` tiers transmis dans la query string.
  3. Vérifier que `req.user.id` correspond exactement aux données interrogées.
- **Fichiers concernés** :
  - `backend/routes/surga/donnees.js`
  - `backend/services/surga/donnees-service.js`
- **Critères de validation** : Une requête sans en-tête `Authorization: Bearer <token>` renvoie HTTP 401 Unauthorized. Une requête avec le token de l'utilisateur B tentant de lire les données de A renvoie HTTP 403 Forbidden.
- **Retest** : Script d'intrusion automatisé tentant l'export sans token et avec token forgé.

---

### TICKET-P0-02 : Verrouillage Cryptographique des Abonnements Wave & Orange Money
- **ID Source** : `BLOC-P0-02` (Agent -1) / `SURGA-004` (Agent 0) / `FIN-A4-07` (Agent 4)
- **Problème** : Activation gratuite d'abonnements 1 an Premium et Pro sur simple fourniture d'une référence textuelle arbitraire.
- **Preuve** : `POST /api/surga/abonnements/verifier` avec `{ "reference": "FAUSSE_REF" }` active l'abonnement en table `surga_abonnements` sans interroger Wave ni Orange Money.
- **Cause** : Implémentation permissive dans `abonnement-service.js` (lignes 254-265) sans validation de webhook ni appel à `wave.getCheckoutSession`.
- **Correction** :
  1. Supprimer l'activation aveugle dans `routes/surga/abonnements.js`.
  2. Créer un webhook officiel `POST /api/surga/abonnements/webhook-wave` avec vérification de la signature HMAC Wave.
  3. Dans `activerAbonnementParReference`, conditionner la mise à jour à l'interrogation synchrone de l'API Wave certifiant que le statut de la session est bien `complete` et le montant conforme.
- **Fichiers concernés** :
  - `backend/routes/surga/abonnements.js`
  - `backend/services/surga/abonnement-service.js`
  - `backend/services/wave.js`
- **Critères de validation** : Une fausse référence renvoie HTTP 400 Bad Request et laisse l'abonnement en statut `en_attente`. Seul un événement webhook signé HMAC avec statut `complete` passe l'abonnement en `actif`.

---

### TICKET-P0-03 : Correction du Crash UUID lors de la Synchronisation Hors-Ligne
- **ID Source** : `BUG-A2-01` (Agent 2)
- **Problème** : Lorsque l'utilisateur crée des notes ou des dépenses en mode hors-ligne, la synchronisation à la reconnexion crashe en HTTP 500 dans PostgreSQL (`invalid input syntax for type uuid`).
- **Preuve** : Playwright test `test_sync_offline` échoue avec l'erreur SQL `22P02: invalid input syntax for type uuid: "srg_1728094839201_8472"`.
- **Cause** : Dans `surga-offline-sync.ts`, la fonction cliente `genererId()` fabrique une chaîne temporaire non-UUID rejetée par la colonne `id UUID PRIMARY KEY` de PostgreSQL.
- **Correction** :
  1. Dans `backend/routes/surga/sync.js`, détecter si l'ID client est un UUID valide via regex v4. Si ce n'est pas un UUID, générer un nouvel `uuidv4()` pour la base et renvoyer une table de correspondance `{ clientTempId, permanentId }` au frontend.
  2. Dans `frontend-next/src/lib/surga-offline-sync.ts`, intégrer un polyfill standard UUID v4 (`crypto.randomUUID()`).
- **Fichiers concernés** :
  - `frontend-next/src/lib/surga-offline-sync.ts`
  - `backend/routes/surga/sync.js`
- **Critères de validation** : Création de 3 dépenses en mode déconnecté, reconnexion simulée : les 3 entités sont insérées en base sans erreur 500 et confirmées au client.

---

### TICKET-P0-04 : Éradication de la Perte Silencieuse des Écritures WhatsApp
- **ID Source** : `ANOM-A3-01` (Agent 3) / `LEC-01`
- **Problème** : Un utilisateur qui commande Surga par WhatsApp sans être pré-inscrit reçoit un message de confirmation « Dépense enregistrée avec succès », mais **0 ligne n'est écrite en base de données**.
- **Preuve** : Message « Note 3500 repas » envoyé avec réponse « OUI » : inspection SQL de `surga_depenses` = 0 enregistrement.
- **Cause** : `backend/services/surga/whatsapp-handler.js` effectue `if (userId)` sans bloc `else` pour créer le compte utilisateur ou lier le numéro de téléphone.
- **Correction** :
  1. Si `userId` est nul, rechercher le numéro dans la table `utilisateurs` par suffixe téléphonique.
  2. Si l'utilisateur n'existe pas, auto-provisionner un compte avec son numéro normalisé (comme le fait l'auth WhatsApp de Nopalou).
  3. Lier immédiatement la dépense au nouvel ID créé avant d'envoyer le message de confirmation.
- **Fichiers concernés** :
  - `backend/services/surga/whatsapp-handler.js`
- **Critères de validation** : Un numéro inconnu envoyant « Note 2000 carburant » voit son compte provisionné et la ligne `2000 FCFA` insérée en table `surga_depenses`.

---

## 4. P1 — TICKETS CRITIQUES (LANCEMENT PUBLIC & ACQUISITION)

---

### TICKET-P1-01 : Reconnexion des 4 Services Métier à PostgreSQL & Seeding Initial
- **ID Source** : `SURGA-001` (Agent 0) / `ANOM-A3-02` (Agent 3) / `SURGA-002`
- **Problème** : 4 services majeurs (`immo-service`, `concours-service`, `places-service`, `trafic-service`) importent `require('../../db')` inexistant, restent masqués par des `catch {}` vides et tournent sur mocks en ignorant les vraies tables.
- **Correction** :
  1. Remplacer `require('../../db')` par `const { pool } = require('../../models/db')` dans les 4 services.
  2. Exécuter le script de seed idempotent `scripts/seed-surga-data.js` pour insérer les 8 axes de Dakar, les 10 concours et les 10 adresses de référence (afin d'éviter les violations de clés étrangères).
  3. Raccorder `immo-service.js` à la table réelle `annonces_immo` (1 649 annonces certifiées).
- **Fichiers concernés** :
  - `backend/services/surga/immo-service.js`
  - `backend/services/surga/concours-service.js`
  - `backend/services/surga/places-service.js`
  - `backend/services/surga/trafic-service.js`
  - `scripts/seed-surga-data.js`
- **Critères de validation** : Les routes `/api/surga/immo`, `/api/surga/concours` et `/api/surga/places` retournent les données extraites de la base PostgreSQL et non des tableaux statiques en mémoire.

---

### TICKET-P1-02 : Référencement XML & Rendu Sémantique SSR (H1/H2)
- **ID Source** : `SEO-A4-01` & `SEO-A4-02` (Agent 4)
- **Problème** : Surga est absent du fichier `sitemap.xml` et son rendu SSR initial est une coquille vide ne contenant aucun H1, aucun H2 et aucun contenu textuel indexable.
- **Correction** :
  1. Ajouter `{ url: `${BASE}/surga`, changeFrequency: 'daily', priority: 0.95 }` dans `frontend-next/src/app/sitemap.ts`.
  2. Dans `frontend-next/src/app/surga/page.tsx`, fournir un pré-rendu HTML SSR contenant un H1 accessible (`<h1 className="sr-only">Surga — Assistant Quotidien à Dakar</h1>`), une description complète et le résumé éditorial du jour, masqué dynamiquement dès l'hydratation client.
- **Fichiers concernés** :
  - `frontend-next/src/app/sitemap.ts`
  - `frontend-next/src/app/surga/page.tsx`
- **Critères de validation** : `curl http://localhost:3001/sitemap.xml` contient l'URL `/surga`. `curl http://localhost:3001/surga` contient une balise `<h1>` et plus de 200 mots de contenu sémantique.

---

### TICKET-P1-03 : Rétablissement du Tracking UTM & Attribution Marketing
- **ID Source** : `MKT-A4-05` (Agent 4)
- **Problème** : `<UtmTracker />` est exclu de Surga dans `app/layout.tsx`, rendant impossible le suivi des campagnes TikTok, Facebook ou du partage WhatsApp.
- **Correction** :
  1. Déplacer `<UtmTracker />` en dehors de la condition `{!isSurga}` dans `frontend-next/src/app/layout.tsx`, ou l'injecter directement dans `frontend-next/src/app/surga/layout.tsx`.
  2. Aligner la constante `SURGA_BASE_URL` dans `surga-share.ts` sur `https://surga.nopalou.com`.
- **Fichiers concernés** :
  - `frontend-next/src/app/layout.tsx`
  - `frontend-next/src/lib/surga-share.ts`
- **Critères de validation** : Une navigation sur `/surga?utm_source=tiktok` enregistre l'objet `{ utm_source: "tiktok" }` dans le `localStorage` sous la clé `nopalou_utm`.

---

### TICKET-P1-04 : Conception de la Landing Page d'Accueil & Réassurance
- **ID Source** : `UX-A4-06` (Agent 4)
- **Problème** : Tout nouveau visiteur arrive directement sur un formulaire d'onboarding sans présentation de l'utilité du produit.
- **Correction** :
  1. Créer un sous-composant `SurgaLandingHero.tsx` affiché aux visiteurs dont le `localStorage` ne contient pas encore de session.
  2. Présenter la promesse claire : *« Votre quotidien à Dakar en une seule app »*, 3 cartes d'illustration (Briefing, Dépenses FCFA, Trafic en direct), et un bouton CTA clair : *« Démarrer ma journée avec Surga »*.
  3. Le clic sur le bouton déclenche l'onboarding fluide.
- **Fichiers concernés** :
  - `frontend-next/src/app/surga/page.tsx`
  - `frontend-next/src/app/surga/components/SurgaLandingHero.tsx`
- **Critères de validation** : Un nouvel arrivant en navigation privée voit l'écran de présentation et peut déclencher la configuration sans friction.

---

### TICKET-P1-05 : Isolation Étanche des Vocaux WhatsApp & Suppression des Boutons Marchands
- **ID Source** : `ANOM-A3-03` (Agent 3) / `LEC-06`
- **Problème** : Les notes vocales WhatsApp adressées à Surga sont captées par le vieux bot de commerce Nopalou qui sert des boutons e-commerce de boutiques marchandes.
- **Correction** :
  1. Dans `backend/services/whatsapp-chatbot.js` (ligne 2268), vérifier avant tout traitement marchand si le numéro est en session Surga active.
  2. Si l'intention concerne Surga, router vers le gestionnaire Surga.
  3. À défaut de moteur STT activé, répondre courtoisement : *« Surga traite actuellement vos commandes textuelles. Veuillez taper votre message en attendant l'activation de la transcription vocale. »* sans jamais renvoyer de catalogue e-commerce.
- **Fichiers concernés** :
  - `backend/services/whatsapp-chatbot.js`
  - `backend/services/surga/whatsapp-handler.js`
- **Critères de validation** : L'envoi d'un audio WhatsApp à Surga ne génère aucun message e-commerce Nopalou.

---

### TICKET-P1-06 : Durcissement des Quotas WhatsApp Gratuits & Protection Financière
- **ID Source** : `FIN-A4-08` (Agent 4)
- **Problème** : Le quota de 20 requêtes WhatsApp gratuites par jour expose Nopalou à un coût Meta Cloud API non maîtrisé (~660 FCFA/mois/utilisateur gratuit).
- **Correction** :
  1. Abaisser le quota gratuit non abonné à **2 commandes de test par jour** sur WhatsApp.
  2. Dès la 3e commande, renvoyer un message d'invitation avec lien de souscription vers **Surga Premium** (1 500 FCFA/mois) pour débloquer les commandes WhatsApp illimitées.
  3. L'usage Web/PWA reste quant à lui 100% gratuit et sans limite.
- **Fichiers concernés** :
  - `backend/services/surga/whatsapp-handler.js`
- **Critères de validation** : À la 3e tentative journalière sans abonnement, WhatsApp répond avec le message d'invitation au forfait Premium.

---

## 5. P2 — TICKETS IMPORTANTS (QUALITÉ, SEO & FLUIDITÉ)

---

### TICKET-P2-01 : Ajout de la Balise Canonical & Schéma JSON-LD SoftwareApplication
- **ID Source** : `SEO-A4-03` & `SEO-A4-04` (Agent 4)
- **Correction** :
  1. Ajouter `alternates: { canonical: 'https://surga.nopalou.com' }` dans `frontend-next/src/app/surga/layout.tsx`.
  2. Injecter un script JSON-LD dédié `@type: SoftwareApplication` (Nom: "Surga", applicationCategory: "Productivity", operatingSystem: "All", price: "0 XOF").
- **Fichiers concernés** : `frontend-next/src/app/surga/layout.tsx`

---

### TICKET-P2-02 : Allègement du Bundle JS Initial (< 120 Ko) via next/dynamic
- **ID Source** : `SURGA-009` (Agent 0) / Audit Perf Agent 4
- **Correction** :
  1. Remplacer les imports statiques des modales lourdes dans `page.tsx` et `SurgaModalsContainer.tsx` par `dynamic(() => import(...), { ssr: false })` pour :
     - `SurgaImmoModal`
     - `SurgaConcoursModal`
     - `SurgaTraficModal`
     - `SurgaRadioModal`
     - `SurgaPremiumModal`
- **Fichiers concernés** :
  - `frontend-next/src/app/surga/page.tsx`
  - `frontend-next/src/app/surga/components/SurgaModalsContainer.tsx`
- **Critères de validation** : Le chunk JS initial de la route `/surga` passe de 146,9 Ko à moins de 115 Ko (Gzip).

---

### TICKET-P2-03 : Correction du Scope du Service Worker sur Sous-Domaine
- **ID Source** : `BUG-A2-03` (Agent 2) / `SURGA-010` (Agent 0)
- **Correction** : Dans `frontend-next/public/surga/sw.js`, élargir le filtre de cache pour intercepter les requêtes arrivant sur la racine `/` lorsque l'hôte est `surga.nopalou.com`.
- **Fichiers concernés** : `frontend-next/public/surga/sw.js`

---

### TICKET-P2-04 : Automatisation du Cron RSS & Suppression des Fausses Dates
- **ID Source** : `ANOM-A3-04` (Agent 3) / `LEC-08`
- **Correction** :
  1. Ajouter `cron.schedule('*/30 * * * *', collecterTousLesFlux)` dans `backend/app.js`.
  2. Figer les dates d'articles de secours dans `rss-collector.js` et afficher la mention *« Mode archive locale »* dans le frontend si aucune actualité récente n'est trouvée.
- **Fichiers concernés** : `backend/app.js`, `backend/services/surga/rss-collector.js`

---

## 6. P3 — AMÉLIORATIONS PLANIFIÉES (POST-LANCEMENT)

---

### TICKET-P3-01 : Intégration de la Reconnaissance Vocale en Wolof
- **Description** : Brancher un modèle Speech-to-Text spécialisé sur les langues nationales sénégalaises (Whisper finetuné Wolof ou API locale) pour permettre la dictée orale en wolof.
- **Priorité** : P3 (Post-lancement v1.1).

---

### TICKET-P3-02 : Notifications Web Push VAPID Locales
- **Description** : Implémenter le protocole VAPID Web Push pour alerter les utilisateurs à 7h30 de la disponibilité de leur briefing du matin sans passer par WhatsApp.
- **Priorité** : P3 (Post-lancement v1.2).

---

### TICKET-P3-03 : Pages Satellites Indexables pour les Concours et le Trafic
- **Description** : Créer des pages publiques statiques pré-générées pour chaque concours officiel (`/surga/concours/fastef-2026`, etc.) afin de drainer le trafic organique Google.
- **Priorité** : P3 (Stratégie SEO SEO-Scale v1.2).

---

## 7. ORDRE RECOMMANDÉ D'EXÉCUTION DES CORRECTIONS

```text
PHASE 1 : SÉCURITÉ & DONNÉES (24h)
  → TICKET-P0-01 (Anti-IDOR export données)
  → TICKET-P0-02 (Paiement Wave/OM vérifié)
  → TICKET-P0-03 (UUID offline-sync)
  → TICKET-P0-04 (Persistance WhatsApp user inconnu)

PHASE 2 : RECONNEXION SERVICES & ROBUSTESSE (24h)
  → TICKET-P1-01 (Connecteur DB 4 services + seed)
  → TICKET-P1-05 (Détachement vocaux WhatsApp bot Nopalou)
  → TICKET-P1-06 (Protection quotas WhatsApp 2 req/j)

PHASE 3 : ACQUISITION, SEO & MARKETING (24h)
  → TICKET-P1-02 (Sitemap XML + SSR H1/H2)
  → TICKET-P1-03 (Tracking UTM rétabli)
  → TICKET-P1-04 (Landing page d'accueil)
  → TICKET-P2-02 (Allègement bundle JS dynamic)
```

Ce plan constitue la feuille de route exhaustive, ordonnée et testable pour achever la fiabilisation industrielle de Surga.
