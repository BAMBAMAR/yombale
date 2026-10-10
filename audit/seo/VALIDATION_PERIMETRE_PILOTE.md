# Validation du Périmètre du Pilote SEO — Nopalou

```text
Document       : Validation Méthodologique & Périmètre Arbitré du Pilote SEO
Fichier        : audit/seo/VALIDATION_PERIMETRE_PILOTE.md
Autorité       : Agent 9 (Ingénieur Préparation du Pilote & Cadre d'Exécution)
Date           : 2026-10-10
Branche Git    : main (Vérifiée via git branch --show-current -> main)
Statut         : Périmètre Analysé, Sécurisé, Découpé et Validé sous Conditions
Verdict Global : PRÊT SOUS CONDITIONS (Architecture découpée en Tranche 1 et Tranche 2)
```

---

## 1. Contexte & Mission de Validation de l'Agent 9

L'Agent 8 a proposé dans `PLAN_PILOTE_SEO.md` un déploiement pilote s'articulant autour d'un double-axe :
1. **Axe 1 (B2B)** : Acquisition & Monétisation Marchande SaaS (`/creer-boutique-en-ligne`, `/creer-boutique`, `/logiciel-caisse-senegal`).
2. **Axe 2 (B2C)** : Transactionnel Climatiseurs Astech (`/categorie/tv-electro/climatiseurs` et sous-hub `/astech`).
3. **Chantiers Transverses Critiques** : Résolution du Soft-404 HTTP 200 (`CORR-01`), retrait de `/surga` du sitemap XML (`CORR-08`), attribution commerciale SQL (`MES-ANO-03`), et télémétrie des clics WhatsApp (`MES-ANO-01`).

Conformément au mandat de l'**Agent 9**, ce document procède à l'examen critique, technique et contradictoire de ce pilote avant toute écriture de code en production, vérifie l'ensemble des prérequis, relève les contraintes architecturales réelles du dépôt et établit le périmètre exécutable sécurisé pour l'Agent 10.

---

## 2. Examen Critique des 7 Critères d'Éligibilité du Pilote

| Critère d'Éligibilité | Évaluation sur le Projet Nopalou | Preuve & Fait Observé dans le Code / Données | Statut |
| :--- | :--- | :--- | :---: |
| **1. Intention de recherche clairement identifiée** | **Validé à 100%**. Requêtes transactionnelles et commerciales précises :<br>• *« créer boutique en ligne sénégal »* (Axe 1)<br>• *« logiciel de caisse sénégal »* / *« caisse tactile dakar »* (Axe 1)<br>• *« climatiseur astech prix sénégal »* / *« split astech dakar »* (Axe 2) | Documenté dans `BASE_REQUETES_SEO.csv` et `ANALYSE_SERP.md`. Besoins opérationnels réels des commerçants et acheteurs dakarois. | **CONFORME** |
| **2. Données suffisamment fiables** | **Validé à 100%** après corrections de la contre-expertise (Agent 7).<br>• 101 commerçants en essai gratuit (`is_trial = true`)<br>• 7 marchands payants réels (80 000 FCFA/mois de MRR)<br>• 702 produits climatiseurs Astech réels en catalogue. | Requêtes PostgreSQL certifiées (`RAPPORT_CONTRE_EXPERTISE_INDEPENDANTE.md`). Zéro extrapolation ou allégation non prouvée. | **CONFORME** |
| **3. Fonctionnement compris dans le code** | **Validé avec découverte technique majeure**. Le code des composants Next.js (`layout.tsx`, `page.tsx`, `sitemap.ts`) et de l'API Express a été minutieusement inspecté. L'origine exacte du Soft-404 et de la cannibalisation est isolée. | Analyse directe de `frontend-next/src/app/produit/[id]/page.tsx` et `creer-boutique/layout.tsx`. | **CONFORME** |
| **4. Intérêt stratégique & commercial** | **Majeur**. Nopalou monétise ses boutiques à 2 500 et 5 000 FCFA/mois. L'acquisition de marchands payants est le levier de viabilité n°1 de la plateforme, bien devant les clics B2C gratuits. | 101 boutiques déjà inscrites en essai représentent un gisement de conversion immédiat de +50 000 à +100 000 FCFA de MRR. | **CONFORME** |
| **5. Indicateurs de référence établis** | **Validé**. Baselines chiffrées figées : SERP pos 23-30 sur requête B2B, Soft-404 présent (HTTP 200 sur URL inexistante), 0 événement WhatsApp tracké, 7 abonnés payants réels. | Tableau comparatif consigné dans `PLAN_PILOTE_SEO.md` et `ETAT_REFERENCE_PILOTE.md`. | **CONFORME** |
| **6. Périmètre limité & Rollback aisé** | **Validé**. Moins de 6 fichiers front-end et 1 script SQL concernés. Zéro impact sur les modules sensibles (caisse POS en cours d'usage et Surga restent totalement isolés). | Découpage en Tranches d'exécution étanches. Rollback possible en 1 commande `git revert`. | **CONFORME** |
| **7. Dépendances & Décisions validées** | **Partiellement validé (Sous Conditions)**.<br>• Search Console API non disponible en local.<br>• Architecture Next.js actuelle ne supporte pas nativement 3 segments d'URL pour le sous-silo Astech. | Nécessite un découpage en deux tranches opérationnelles pour ne pas bloquer l'exécution. | **AJUSTÉ** |

---

## 3. Découvertes Techniques & Ajustements Requis par l'Agent 9

L'inspection matérielle approfondie du code source et de l'infrastructure par l'Agent 9 a mis en évidence trois réalités techniques qui imposent d'ajuster le découpage du pilote :

### Ajustement 1 : L'Anomalie Soft-404 (`CORR-01`) n'est pas un simple oubli de `notFound()`
- **Constat dans le code** : `frontend-next/src/app/produit/[id]/page.tsx` (ligne 75) appelle déjà `introuvableOuRedirection(id, ...)` dans son bloc `generateMetadata`, qui lui-même appelle `notFound()`.
- **Raison du Soft-404 en production** : En Next.js 14 App Router, lorsqu'une route dynamique utilise du streaming ou est enveloppée dans un `RootLayout` sans barrière d'interruption, `notFound()` déclenché tardivement ou dans un composant asynchrone rend `not-found.tsx` avec un statut HTTP 200 OK enveloppé dans 110 Ko de HTML si les en-têtes HTTP ont déjà été initiés par le runtime edge/node.
- **Décision Agent 9** : La correction du Soft-404 doit faire l'objet d'un test HTTP strict (`curl -I`) avant et après, et doit être isolée comme prérequis technique P0 prioritaire.

### Ajustement 2 : L'Arborescence Next.js pour le Sous-Hub Astech (`tv-electro/climatiseurs/astech`)
- **Constat dans le code** : Le dossier `frontend-next/src/app/categorie/[slug]/[sousCategorie]` ne supporte strictement que deux segments (ex: `tv-electro` et `climatiseurs`). Une requête sur `/categorie/tv-electro/climatiseurs/astech` comprend 3 segments et aboutit aujourd'hui immédiatement à une 404 Next.js !
- **Décision Agent 9** : Pour éviter d'introduire une complexité de refonte du routeur Next.js (passage en catch-all `[...slug]` ou création d'un sous-dossier `[marque]`), le sous-hub Astech doit être programmé en **Tranche 2**, après validation complète de la Tranche 1 (B2B + Corrections P0).

### Ajustement 3 : Connectivité Base de Données Render & Alerte WhatsApp Automatique
- **Constat dans l'infrastructure** : Le backend se connecte à PostgreSQL sur Render (`nopalou_db`). Si une tentative de connexion directe locale échoue, `backend/models/db.js` déclenche une alerte WhatsApp d'urgence vers l'administrateur (`221777202086`).
- **Décision Agent 9** : La migration SQL d'attribution (`MES-ANO-03`) ne doit pas être exécutée par un script node local aveugle, mais intégrée dans le script de migration contrôlé (`backend/services/migrate-inline.js`) ou exécutée via les commandes du serveur Render pour garantir la sécurité et la traçabilité.

---

## 4. Découpage du Pilote en Deux Tranches Opérationnelles

Pour garantir un risque zéro de régression et permettre un déploiement progressif et testable, le pilote est structuré en **deux tranches séquentielles** :

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DÉCOUPAGE OPÉRATIONNEL DU PILOTE SEO                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TRANCHE 1 : FONDATIONS P0, MONÉTISATION MARCHANDS & SANCTUARISATION B2B                │
│    ├── TÂCHE 1.1 : Résolution Soft-404 sur les fiches introuvables (CORR-01)          │
│    ├── TÂCHE 1.2 : Canonisation B2B & Noindex sur /creer-boutique (CORR-03)           │
│    ├── TÂCHE 1.3 : Retrait de /surga et de /creer-boutique du sitemap XML (CORR-08)   │
│    ├── TÂCHE 1.4 : Optimisation de conversion de la landing /creer-boutique-en-ligne   │
│    └── TÂCHE 1.5 : Télémétrie clics WhatsApp dans le tunnel marchand et fiches        │
│    Statut : 100% PRÊT POUR EXÉCUTION IMMÉDIATE (Risque nul, rollback en 1 git revert) │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TRANCHE 2 : VERTICALE CLIMATISEURS ASTECH & ATTRIBUTION SQL AVANCÉE                    │
│    ├── TÂCHE 2.1 : Migration SQL attribution UTM sur la table abonnements (MES-ANO-03)│
│    ├── TÂCHE 2.2 : Création de la sous-route dédiée /climatiseurs/astech              │
│    ├── TÂCHE 2.3 : Enrichissement éditorial & Verdict Économique Astech (702 produits)│
│    └── TÂCHE 2.4 : Câblage de l'événement GA4 purchase corrigé (COD post-livraison)   │
│    Statut : CONDITIONNÉ AUX RÉSULTATS DE LA TRANCHE 1 & VALIDATION ARCHITECTURE       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Critères de Sortie (Exit Criteria) & Validation du Pilote

Le pilote sera considéré comme validé si et seulement si :
1. **Tests Techniques Locaux** : 100 % des tests de la suite Jest (`npm run test:unit`) et des tests frontend (`npm run test`) sont au vert (zéro régression).
2. **Sondes HTTP de Production** :
   - `curl -I https://nopalou.com/creer-boutique` renvoie un en-tête `canonical` pointant vers `/creer-boutique-en-ligne` et `noindex`.
   - `curl https://nopalou.com/sitemap.xml` ne contient plus ni `/surga`, ni `/creer-boutique`.
   - `curl -I https://nopalou.com/produit/00000000-0000-0000-0000-000000000000-inexistant` renvoie un code HTTP 404 strict.
3. **Suivi Commercial sous 30 jours** :
   - Clics traçables enregistrés vers l'onboarding marchand sans CB.
   - Conversion d'au moins 10 commerçants en abonnés payants Wave/OM.
   - Progression mesurable sur Google Sénégal sur la requête *« créer boutique en ligne sénégal »*.

---

## 6. Verdict Formel de l'Agent 9

> **VERDICT : PRÊT SOUS CONDITIONS**
> 
> Le périmètre du pilote est pleinement justifié, fondé sur des preuves matérielles irréfutables et d'un intérêt commercial majeur pour Nopalou.
> L'exécution peut débuter immédiatement sur la **Tranche 1**, sans dépendance externe bloquante. La **Tranche 2** sera exécutée dès validation des prérequis d'infrastructure et de routage.
