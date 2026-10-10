# Registre des Blocages, Prérequis et Dépendances du Pilote SEO — Nopalou

```text
Document       : Inventaire Exhaustif des Blocages, Accès Manquants & Prérequis
Fichier        : audit/seo/BLOCAGES_ET_PREREQUIS.md
Autorité       : Agent 9 (Ingénieur Préparation du Pilote & Cadre d'Exécution)
Date           : 2026-10-10
Branche Git    : main (Vérifiée via git branch --show-current -> main)
Statut         : 5 Blocages & Dépendances Formellement Identifiés avec Plans de Résolution
Verdict Tranche 1 : ZÉRO BLOCAGE POUR LA TRANCHE 1 (EXÉCUTION IMMÉDIATE POSSIBLE)
Verdict Tranche 2 : CONDITIONNÉ AUX PRÉREQUIS CI-DESSOUS
```

---

## 1. Tableau Synthétique des Blocages & Dépendances

| Identifiant | Domaine | Nature du Blocage / Dépendance | Impact sur le Pilote | Criticité | Responsable / Action Requise |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **BLOQ-01** | **Accès Données** | **Indisponibilité de l'API Google Search Console (GSC)**<br>Aucun fichier de compte de service (`service-account.json`) ni jeton OAuth configuré en local. | Impossible de lire automatiquement les clics et impressions GSC quotidiens par script local. | **Moyenne** (N'empêche pas l'exécution technique) | Propriétaire du site / Intégrer un compte de service ou exploiter manuellement l'interface web GSC. |
| **BLOQ-02** | **Infrastructure SQL** | **Connectivité Distante PostgreSQL Render (`nopalou_db`)**<br>Une tentative de connexion locale directe échouée déclenche une alerte WhatsApp d'urgence vers l'admin (`221777202086`). | La migration SQL `MES-ANO-03` ne doit pas être exécutée par un script node local aveugle. | **Élevée** (Risque de spam d'alertes) | Agent 10 / Intégrer la migration dans `backend/services/migrate-inline.js` exécuté par Render au déploiement. |
| **BLOQ-03** | **Architecture Routeur** | **Routage Next.js Limité à 2 Segments pour les Catégories**<br>L'arborescence actuelle `[slug]/[sousCategorie]` ne supporte pas 3 segments (`/categorie/tv-electro/climatiseurs/astech`). | Tenter d'ouvrir l'URL du sous-hub Astech renvoie immédiatement une 404 du routeur Next.js. | **Élevée** (Bloque la Tranche 2 B2C) | Agent 10 / Créer la route dédiée `[slug]/[sousCategorie]/[marque]` ou sous-page dédiée avant déploiement Astech. |
| **BLOQ-04** | **Arbitrage Métier** | **Directive Directionnelle sur `robots.ts` pour SemrushBot**<br>SemrushBot et AhrefsBot sont actuellement bloqués (`Disallow: /`) pour protéger le catalogue contre le pillage. | Décision requise : maintenir le blocage pour sécurité ou autoriser temporairement pour audit tiers. | **Faible** (Recommandation : maintenir le blocage) | Propriétaire du projet / Arbitrage `SEC-01` de l'Agent 8 recommandé (maintien du blocage). |
| **BLOQ-05** | **Communication WhatsApp** | **Numéro d'Émission des Relances Commerçants J-5 / J-1**<br>Deux numéros coexistent : `221708717942` (support/commercial) et `221777202086` (alertes système). | Clarifier quel numéro émettra les notifications de fin d'essai aux 101 commerçants. | **Moyenne** (Commerciale) | Direction / Confirmer l'usage de `221708717942` pour les échanges avec les commerçants. |

---

## 2. Analyse Approfondie & Plan d'Action par Blocage

---

### 2.1 BLOQ-01 : Absence de Jeton Search Console API

- **Constat Matériel** :
  L'inspection de l'arborescence et des variables d'environnement prouve qu'aucun compte de service Google Cloud (`service-account.json`) n'est provisionné dans l'IDE ou le dépôt.
- **Impact Réel** :
  Cela n'entrave en rien la modification du code, l'application du `noindex`, la correction du sitemap ou la résolution du Soft-404. Cela empêche uniquement l'extraction programmatique des clics GSC.
- **Solution Opérationnelle pour l'Agent 10** :
  1. Procéder à l'exécution technique complète sans attendre GSC.
  2. Valider le succès technique via sondes HTTP curl directes.
  3. Suivre le comportement d'exploration via GA4 (`G-3KGE1YBMVJ`) et inviter le propriétaire à vérifier l'indexation dans son interface Search Console en ligne.

---

### 2.2 BLOQ-02 : Connexion PostgreSQL Distante & Alerte WhatsApp

- **Constat Matériel** :
  Le backend Express possède un mécanisme de résilience strict : si la connexion au pool PostgreSQL échoue après 3 tentatives, un message d'alerte critique WhatsApp est automatiquement envoyé au numéro de l'administrateur (`221777202086`).
- **Risque Évité** :
  Tenter d'exécuter des scripts DDL locaux non autorisés par le pare-feu de Render provoquerait une pluie d'alertes WhatsApp anxiogènes.
- **Solution Opérationnelle pour l'Agent 10** :
  1. Rédiger le script DDL d'attribution sous la forme d'une migration idempotente :
     ```sql
     ALTER TABLE abonnements ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
     ALTER TABLE abonnements ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
     ALTER TABLE abonnements ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);
     ALTER TABLE abonnements ADD COLUMN IF NOT EXISTS landing_page VARCHAR(255);
     ```
  2. L'enregistrer dans `backend/services/migrate-inline.js` qui s'exécute automatiquement au démarrage du service backend dans l'environnement Render officiel.

---

### 2.3 BLOQ-03 : Architecture de Routage Next.js pour Climatiseurs Astech

- **Constat Matériel** :
  La structure de fichiers Next.js dans `frontend-next/src/app/categorie/` est la suivante :
  ```text
  categorie/
  ├── [slug]/
  │   ├── [sousCategorie]/
  │   │   └── page.tsx
  │   └── page.tsx
  ├── categories-data.ts
  └── sous-categories-data.ts
  ```
  Le routeur dynamique `[sousCategorie]` ne consomme que le 2ème segment. L'URL cible `/categorie/tv-electro/climatiseurs/astech` comprend 3 segments après `/categorie/`.
- **Solution Opérationnelle pour l'Agent 10** :
  1. **Découpage strict** : Exécuter d'abord la **Tranche 1** (B2B + Corrections P0) qui ne dépend aucunement de cette route.
  2. Pour la **Tranche 2**, créer soit :
     - Option A (Recommandée) : Un sous-dossier dédié `frontend-next/src/app/categorie/[slug]/[sousCategorie]/[marque]/page.tsx`.
     - Option B : Une route d'atterrissage éditoriale dédiée `frontend-next/src/app/climatiseur-astech-dakar/page.tsx` offrant un ciblage SEO direct et ultra-optimisé sur la requête reine.

---

## 3. Matrice de Déblocage Chronologique

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CHRONOLOGIE DE LEVÉE DES BLOCAGES                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 1 : IMMÉDIATE (TRANCHE 1 PILOTE)                                                 │
│   • Aucun blocage actif. L'Agent 10 peut débuter immédiatement.                        │
│   • Fichiers modifiables sans risque :                                                 │
│     - frontend-next/src/app/creer-boutique/layout.tsx                                  │
│     - frontend-next/src/app/sitemap.ts                                                 │
│     - frontend-next/src/app/produit/[id]/page.tsx                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 2 : DIFFÉRÉE (TRANCHE 2 PILOTE)                                                  │
│   • Étape 1 : Validation de l'option de routage Astech (Option A vs Option B).         │
│   • Étape 2 : Intégration de la migration SQL dans migrate-inline.js.                  │
│   • Étape 3 : Déploiement groupé sous contrôle CI/CD Render.                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
