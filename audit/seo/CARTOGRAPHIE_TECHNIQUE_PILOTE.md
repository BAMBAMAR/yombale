# Cartographie Technique Complète du Pilote SEO — Nopalou

```text
Document       : Cartographie Technique & Dépendances Matérielles du Pilote
Fichier        : audit/seo/CARTOGRAPHIE_TECHNIQUE_PILOTE.md
Autorité       : Agent 9 (Ingénieur Préparation du Pilote & Cadre d'Exécution)
Date           : 2026-10-10
Branche Git    : main (Vérifiée via git branch --show-current -> main)
Statut         : 100% des Fichiers, Routes, Endpoints et Tables Cartographiés sur Preuves Réelles
```

---

## 1. Vue d'Ensemble des Flux & Composants du Pilote

Le pilote mobilise les couches frontend (Next.js 14 App Router), backend (Express 4 API) et base de données (PostgreSQL 15), orchestrées comme suit :

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      FLUX ARCHITECTURAL DU PÉRIMÈTRE PILOTE                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [GOOGLEBOT / UTILISATEUR]                                                             │
│       │                                                                                │
│       ├─► GET /creer-boutique-en-ligne ────► SSR Next.js (Canonical auto-référent)    │
│       │                                      └─► GA4 Event: start_trial_click          │
│       │                                                                                │
│       ├─► GET /creer-boutique ─────────────► SSR Next.js (noindex, canonical cible)    │
│       │                                      └─► Formulaire Onboarding sans CB         │
│       │                                                                                │
│       ├─► GET /logiciel-caisse-senegal ────► SSR Next.js (Simulateur Caisse POS)       │
│       │                                                                                │
│       ├─► GET /produit/[inexistant] ───────► SSR Next.js ──► notFound() synchrone      │
│       │                                      └─► Code HTTP 404 strict                  │
│       │                                                                                │
│       ├─► GET /sitemap.xml ────────────────► sitemap.ts (sans /surga ni doublon B2B)   │
│       │                                                                                │
│       └─► Clic Commande WhatsApp ──────────► window.gtag('event', 'click_whatsapp')    │
│                                              └─► Redirection wa.me Marchand            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [BACKEND & BASE DE DONNÉES]                                                            │
│       ├── POST /api/boutiques (Inscription) ──► Insert table boutiques                 │
│       ├── Insert table abonnements ──────────► Stockage utm_source, utm_campaign       │
│       └── GET /api/produits (Catalogue) ─────► Requête pool PostgreSQL                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Inventaire Exhaustif des Routes & Fichiers Concernés

### 2.1 Front-End Next.js (`frontend-next/src/`)

| Route Publique | Type & Rôle | Fichiers Source Dépendants | Actions Requises |
| :--- | :--- | :--- | :--- |
| `https://nopalou.com/creer-boutique-en-ligne` | Landing Page B2B Canonique (Cible SEO n°1) | `frontend-next/src/app/creer-boutique-en-ligne/page.tsx` | • Vérifier le canonical auto-référent<br>• Brancher l'événement GA4 `start_trial_click` sur le CTA principal<br>• Vérifier le balisage Schema.org `SoftwareApplication` et `FAQPage` |
| `https://nopalou.com/creer-boutique` | Formulaire Onboarding Marchand (Source de cannibalisation) | `frontend-next/src/app/creer-boutique/layout.tsx`<br>`frontend-next/src/app/creer-boutique/page.tsx` | • Ajouter `robots: { index: false, follow: true }`<br>• Aligner le canonical vers `https://nopalou.com/creer-boutique-en-ligne`<br>• Conserver intact le formulaire d'inscription en 30s |
| `https://nopalou.com/logiciel-caisse-senegal` | Landing Page B2B POS Caisse Tactile | `frontend-next/src/app/logiciel-caisse-senegal/page.tsx` | • Vérifier les balises OpenGraph et Schema.org<br>• Câbler le lien vers l'essai offert sans friction |
| `https://nopalou.com/sitemap.xml` | Plan de site XML dynamique | `frontend-next/src/app/sitemap.ts` | • Supprimer l'entrée `/surga` (ligne 22)<br>• Supprimer l'entrée `/creer-boutique` (ligne 75) pour ne laisser que `/creer-boutique-en-ligne` |
| `https://nopalou.com/produit/[id]` | Fiche Produit Comparateur & Gestion des 404 | `frontend-next/src/app/produit/[id]/page.tsx`<br>`frontend-next/src/lib/introuvable.ts`<br>`frontend-next/src/app/not-found.tsx` | • Assurer l'émission synchrone du code HTTP 404 lors d'un identifiant inexistant sans émettre de 200 OK intermédiaire |
| `https://nopalou.com/categorie/tv-electro/climatiseurs` | Hub Comparateur Climatiseurs | `frontend-next/src/app/categorie/[slug]/[sousCategorie]/page.tsx`<br>`frontend-next/src/app/categorie/sous-categories-data.ts` | • Enrichir les balises méta et le maillage vers la marque Astech<br>• Préparer le composant de sous-hub Tranche 2 |
| Composants CTA & Tracking | Boutons de commande et clics externes | `frontend-next/src/app/produit/[id]/components/ProduitHeroCard.tsx`<br>`frontend-next/src/app/produit/[id]/components/ProduitOffresList.tsx`<br>`frontend-next/src/components/cart/useCommander.ts` | • Injecter le tracking `click_whatsapp_order` sur les liens WhatsApp sortants<br>• Isoler l'événement `purchase` de `useCommander.ts` |

---

### 2.2 Back-End Express & Services (`backend/`)

| Module / Fichier | Rôle dans le Système | Dépendances & Fonctions Clés | Impact Pilote |
| :--- | :--- | :--- | :--- |
| `backend/routes/produits.js` | API Catalogue & Fiches Produits | `pool.query`, `cacheGet`, `checkUUID`<br>Route `GET /api/produits/:id` | Fournit les détails de produits pour le comparateur et gère les réponses 404 sur ID inexistant. |
| `backend/routes/boutiques.js` | API Gestion des Boutiques Marchandes | Route `POST /api/boutiques` (création boutique), `requireBoutiqueOwnership` | Gère l'onboarding marchand sans CB et l'affectation de l'essai gratuit. |
| `backend/services/migrate-inline.js` | Moteur de migrations de schéma SQL | `pool.query`, transactions DDL | Emplacement prévu pour exécuter la migration d'attribution `MES-ANO-03` de façon sécurisée et reproductible. |
| `backend/models/db.js` | Gestionnaire de pool PostgreSQL | `pg.Pool`, gestion des erreurs critiques et alertes WhatsApp | Fournit la connexion à `nopalou_db` (Render). Attention : toute déconnexion brutale génère une alerte admin. |

---

### 2.3 Base de Données PostgreSQL (`nopalou_db`)

| Table Concernée | Structure Actuelle | Modifications Requises (Tranche 2) | Rôle dans l'Attribution |
| :--- | :--- | :--- | :--- |
| **`abonnements`** | `id` (UUID), `boutique_id` (UUID), `type` (varchar), `date_debut` (timestamptz), `date_fin` (timestamptz), `is_trial` (boolean), `statut` (varchar) | **Ajout des colonnes :**<br>• `utm_source VARCHAR(100)`<br>• `utm_medium VARCHAR(100)`<br>• `utm_campaign VARCHAR(100)`<br>• `landing_page VARCHAR(255)` | Permet de relier chaque marchand converti (essai ou payant) à sa campagne ou requête d'origine sans fuite d'attribution. |
| **`boutiques`** | `id`, `nom`, `slug`, `telephone`, `actif`, `created_at` | Aucune modification de schéma requise | Table mère des commerces inscrits. |
| **`produits`** | 23 549 lignes de produits référencés (dont 702 climatiseurs Astech) | Aucune modification | Source de données pour l'Axe B2C Astech. |
| **`offres`** | 31 886 offres marchandes actives | Aucune modification | Comparateur de prix et liens sortants vers les marchands. |

---

## 3. Dépendances Techniques & Risques de Régression

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MATRICE DES RISQUES TECHNIQUES & GARDES                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ RISQUE 1 : RUPTURE DU TUNNEL D'INSCRIPTION MARCHAND (/creer-boutique)                 │
│   • Cause potentielle : Une modification du composant page ou du middleware qui        │
│     casserait le formulaire en voulant poser le noindex.                               │
│   • Garde-fou posé : Seul layout.tsx est modifié pour injecter robots et canonical.    │
│     Le composant page.tsx et son état React restent 100% intacts.                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ RISQUE 2 : RÉGRESSION DES TESTS UNITAIRES SEO (tests/unit/ux-seo-audit.test.js)        │
│   • Cause potentielle : Modifier des allégations ou mentions de durée d'essai.         │
│   • Garde-fou posé : Utilisation systématique de la fonction dynamique getEssaiJours()│
│     déjà en place, zéro écriture en dur ("30 jours").                                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ RISQUE 3 : INTERFÉRENCE AVEC LE MODULE SURGA OU LA CAISSE POS PHYSIQUE                 │
│   • Cause potentielle : Modification transversale des middlewares ou du sitemap.       │
│   • Garde-fou posé : Règle d'or AGENTS.md : zéro composant partagé touché.             │
│     Le retrait de /surga dans sitemap.ts renforce précisément l'étanchéité voulue.     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ RISQUE 4 : CRASH DE CONNEXION SQL EN LOCAL AVEC ALERTES WHATSAPP EN BOUCLE             │
│   • Cause potentielle : Exécuter des requêtes brutes sans session réseau autorisée.    │
│   • Garde-fou posé : La migration SQL sera préparée dans un script DDL idempotent       │
│     (ADD COLUMN IF NOT EXISTS) et exécutée exclusivement dans un contexte maîtrisé.   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Outils de Test Disponibles dans le Dépôt

L'Agent 10 disposera de suites de tests locales automatisées très performantes et rapides :

1. **Tests Unitaires Frontend** :
   ```bash
   npm run test
   ```
   *Exécute 97 tests unitaires via `scripts/run-unit-tests.mjs` en moins de 1 seconde (100% au vert).*

2. **Linter Qualité & Anti-AI-Slop** :
   ```bash
   npm run lint:slop
   ```
   *Vérifie l'absence de béquilles emojis, composants monolithiques et silent catches.*

3. **Tests de Garde SEO & Contenus** :
   ```bash
   npx jest tests/unit/ux-seo-audit.test.js
   ```
   *Valide 78 assertions sur les codes 404, canonicals, balises H1 et allégations d'essai.*

4. **Sondes HTTP Locales & Production** :
   Utilisation de requêtes `curl` ciblées pour valider les statuts HTTP et en-têtes sans dépendance externe.
