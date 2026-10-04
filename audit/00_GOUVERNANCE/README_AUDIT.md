# Gouvernance et Cadre Opérationnel de l'Audit Nopalou

## 1. Objectif du Programme d'Audit

Le programme d'audit Nopalou a pour vocation d'évaluer de manière exhaustive, systématique, objective et factuelle la robustesse, la conformité fonctionnelle, la résilience technique, la sécurité multi-tenant et la performance globale de la plateforme Nopalou (Marketplace, ERP Boutiques & POS, ERP Agences Immobilières, Assistant Vocal Wolof/Français, Chatbot WhatsApp, Scrapers Omnisources et CRM Commercial).

L'audit vise à identifier l'ensemble des anomalies potentielles (régressions, failles de sécurité IDOR, ruptures de flux de paiement, incohérences comptables, dysfonctionnements du mode hors-ligne, dégradations SEO et pannes d'intégration), à tracer leurs causes profondes de manière démontrée, et à encadrer leur remédiation jusqu'à retest contradictoire et validation formelle.

---

## 2. Périmètre de l'Audit

Le périmètre d'audit couvre 100% de la base de code du projet `yombale` (Nopalou) :

1. **Frontend Web & Mobile (Next.js 14 App Router, Serwist PWA)** :
   - Pages publiques : Accueil, Recherche, Catalogue, Fiches Produits, Comparateur, Catégories, Landing pages métier.
   - Vitrines marchandes (`/boutiques/[id]`, `/b/[slug]`) et formulaires de commande intégrés.
   - ERP Boutiques & Caisse POS (`/boutique`, `/boutique/caisse`, `/pos`).
   - Espace Personnel & Mon Compte (`/(account)/compte`, `mes-annonces`, `favoris`).
   - ERP Agences Immobilières (`/agence/[slug]`, `/agences`, `/immo`).
   - Espace Administration Globale (`/admin/(protected)`).

2. **Backend API (Node.js, Express, PostgreSQL, Redis)** :
   - 74 modules de routes API (`backend/routes/`).
   - 19 modules spécialisés boutiques (`backend/routes/boutiques-modules/`).
   - 63 services métier (`backend/services/`).
   - Modèle relationnel PostgreSQL de 140 tables (`backend/migrate-inline.js`).
   - Middlewares de sécurité (JWT, RBAC admin, multi-tenant isolation, rate limiting, anti-scraping).

3. **Modules Spécialisés & Intégrations Critiques** :
   - Assistant Vocal bilingue Wolof/Français (moteur phonétique, Sama Xaalis, POS vocal).
   - Chatbot WhatsApp interactif (Meta Graph API Cloud, commandes, catalogue, carnet de dettes, immo).
   - Scrapers omnisources (CoinAfrique, Expat-Dakar, Jumia, Decathlon, Jiji, ARTP).
   - CRM Prospection commerciale (collecte automatisée, fit score, crons de relances marchands).
   - Passerelles de paiement (Wave, Orange Money, Cash à la livraison, séquestre immobilier).
   - Mode PWA & Synchronisation Hors-ligne (IndexedDB, Service Worker, background sync).

---

## 3. Architecture des Agents et Séparation des Responsabilités

Pour garantir une impartialité absolue et prévenir les biais de confirmation, l'audit est exécuté par une chaîne d'agents spécialisés opérant en sessions strictement cloisonnées :

```text
┌──────────────┐
│   AGENT 1    │  Architecte & Planificateur (Cartographie, Risques, Plan de tests)
└──────┬───────┘
       │  [Handover 01 + Plan de tests]
       ▼
┌──────────────┐
│   AGENT 2    │  Exécuteur de Tests & Collecteur de Preuves (Exécution stricte, 0 correction)
└──────┬───────┘
       │  [Handover 02 + Registre Anomalies + Preuves brutes]
       ▼
┌──────────────┐
│   AGENT 3    │  Analyste des Causes Profondes (Analyse technique, reproduction, 0 correction)
└──────┬───────┘
       │  [Handover 03 + Rapport Causes démontrées]
       ▼
┌──────────────┐
│   AGENT 4    │  Contre-Expert Indépendant (Revue contradictoire, challenge des conclusions)
└──────┬───────┘
       │  [Handover 04 + Arbitrage & Validation anomalies]
       ▼
┌──────────────┐
│   AGENT 5    │  Architecte des Correctifs (Plan de remédiation, spécifications techniques)
└──────┬───────┘
       │  [Handover 05 + Plan de patchs ordonné]
       ▼
┌──────────────┐
│   AGENT 6    │  Développeur de Remédiation (Implémentation ciblée des patchs, tests locaux)
└──────┬───────┘
       │  [Handover 06 + Patchs appliqués + Tests mutation]
       ▼
┌──────────────┐
│   AGENT 7    │  Contre-Expert du Code Corrigé (Revue de code, vérification non-régression)
└──────┬───────┘
       │  [Handover 07 + Validation conformité code]
       ▼
┌──────────────┐
│   AGENT 8    │  Recetteur de Régression (Exécution tests régression baseline, retests)
└──────┬───────┘
       │  [Handover 08 + Résultats retests]
       ▼
┌──────────────┐
│   AGENT 9    │  Auditeur Final & Synthèse de Certification (Rapport d'audit consolidé)
└──────────────┘
```

### Règle d'or de non-ingérence :
- **L'Agent 1** planifie et structure ; il ne teste pas et ne corrige pas.
- **L'Agent 2** teste et recueille les preuves ; il ne diagnostique pas les causes profondes et ne modifie pas le code.
- **L'Agent 3** investigue la cause racine ; il ne propose pas de correctif à la volée.
- **L'Agent 6** applique les correctifs ; il n'est pas juge de son propre code (rôle de l'Agent 7).

---

## 4. Ordre des Phases et Jalons

1. **Phase 1 — Planification & Cartographie (Agent 1)** : Établissement du référentiel, inventaire exhaustif, modélisation des permissions et formalisation du plan de test.
2. **Phase 2 — Exécution & Collecte de Preuves (Agent 2)** : Exécution de chaque cas de test, archivage des preuves brutes (logs, requêtes, captures).
3. **Phase 3 — Qualification des Causes (Agent 3)** : Détermination de la cause racine démontrée pour chaque FAIL.
4. **Phase 4 — Contre-Expertise Contradictoire (Agent 4)** : Validation ou rejet motivé des constatations.
5. **Phase 5 — Spécification des Correctifs (Agent 5)** : Élaboration du plan de correction ordonné par criticité (P0 à P3).
6. **Phase 6 — Exécution des Correctifs (Agent 6)** : Application des correctifs en branches isolées.
7. **Phase 7 — Revue de Code & Conformité (Agent 7)** : Contrôle qualité strict (standards Nopalou, anti-IA-slop, sécurité).
8. **Phase 8 — Recette de Non-Régression (Agent 8)** : Rejeu de la baseline de régression complète.
9. **Phase 9 — Clôture & Bilan Final (Agent 9)** : Rapport consolidé final et archivage.

---

## 5. Système de Preuves & Traçabilité

- **Preuve requise** : Aucun état `PASS`, `FAIL` ou `BLOCKED` ne peut être proclamé sans référence directe à un fichier de preuve stocké dans `/audit/03_PREUVES/`.
- **Formats acceptés** :
  - Extraits de réponses HTTP avec corps JSON exact et code de statut.
  - Résultats de requêtes SQL brutes avant/après action.
  - Traces d'exécution console ou logs serveur horodatés (`X-Request-Id`).
  - Captures d'écran ou traces d'exécution Playwright/DOM.
- **Identifiant Unique** : Chaque test dispose d'un identifiant immuable `TEST-XXX` reporté dans la matrice de traçabilité.

---

## 6. Gestion des Sessions & Handovers

- **Autonomie des sessions** : Chaque session de travail est strictement indépendante. L'agent démarrant une session lit l'état central dans `/audit/00_GOUVERNANCE/ETAT_AUDIT.md` et le dernier handover `HANDOVER_AGENT_*.md`.
- **Interdiction d'écrasement** : L'historique des sessions (`HISTORIQUE_SESSIONS.md`) est un journal d'append-only. Aucun événement passé ne doit être masqué, effacé ou réécrit.
- **Handover obligatoire** : Toute session se clôt obligatoirement par la rédaction d'un document de transmission formalisé.
