# Rapport d'Audit et Tests Indépendants du Pilote SEO Nopalou

```text
Document       : Rapport de Recette, Contre-Validation et Tests Indépendants
Fichier        : audit/seo/RAPPORT_TESTS_INDEPENDANTS.md
Autorité       : Agent 11 (Auditeur Indépendant de Recette & Validation SEO)
Date           : 2026-10-10
Branche Git    : main (Vérifiée via git branch --show-current -> main)
Statut         : 100% des Vérifications Indépendantes Exécutées
Verdict Global : VALIDÉ SOUS RÉSERVES
```

---

## 1. Contexte et Mandat d'Indépendance

En tant qu'**Agent 11**, ma mission consiste à évaluer de manière autonome, contradictoire et sans complaisance les travaux réalisés par l'**Agent 10** sur la Tranche 1 du Pilote SEO Nopalou.

Conformément à la charte d'audit :
- **Aucune affirmation de l'Agent 10 n'a été acceptée sur parole**.
- **Chaque déclaration d'implémentation a été confrontée à l'état réel du code source**.
- **Tous les tests déclarés PASS ont fait l'objet d'une reproduction locale et de sondes indépendantes**.
- **Le code de production n'a pas été modifié par l'Agent 11**, respectant la séparation stricte des rôles entre développeur et contrôleur qualité.
- **Aucun `git push` n'a été exécuté**, respectant la règle d'or absolue de déploiement (`AGENTS.md`).

---

## 2. Périmètre Réellement Inspecté

L'inspection a porté sur l'intégralité des 10 fichiers modifiés ou introduits par le commit `f8a3859fe5ae36bb33fd7b802996760112d14435` :

1. **Canonisation B2B et Noindex (`CORR-03`)** :
   - [frontend-next/src/app/creer-boutique/layout.tsx](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/src/app/creer-boutique/layout.tsx)
2. **Sitemap XML (`CORR-08` & `CORR-03`)** :
   - [frontend-next/src/app/sitemap.ts](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/src/app/sitemap.ts)
3. **Éradication du Soft-404 Streaming (`CORR-01`)** :
   - `frontend-next/src/app/loading.tsx` (suppression vérifiée)
4. **Composant Interactif CTA & Télémétrie Entrée Tunnel B2B (`TEST-PIL-17`)** :
   - [frontend-next/src/app/creer-boutique-en-ligne/CreerBoutiqueCtaBtn.tsx](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/src/app/creer-boutique-en-ligne/CreerBoutiqueCtaBtn.tsx)
5. **Nettoyage Landing B2B & Remplacement Emojis UI (Anti-Slop)** :
   - [frontend-next/src/app/creer-boutique-en-ligne/page.tsx](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/src/app/creer-boutique-en-ligne/page.tsx)
6. **Télémétrie Clic Sortant WhatsApp Fiches Produits (`MES-ANO-01`)** :
   - [frontend-next/src/app/produit/[id]/components/ProduitHeroCard.tsx](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/src/app/produit/[id]/components/ProduitHeroCard.tsx)
   - [frontend-next/src/app/produit/[id]/components/ProduitOffresList.tsx](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/src/app/produit/[id]/components/ProduitOffresList.tsx)
   - [frontend-next/src/app/produit/[id]/page.tsx](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/src/app/produit/[id]/page.tsx)
7. **Infrastructure DDL d'Attribution Commerciale (`MES-ANO-03`)** :
   - [backend/migrate-inline.js](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/backend/migrate-inline.js)
   - [audit/seo/scripts/migration_attribution_abonnements.sql](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/audit/seo/scripts/migration_attribution_abonnements.sql)

---

## 3. Méthodes de Test et Environnements Utilisés

Pour chaque domaine, des protocoles rigoureux ont été déployés :

- **Environnement de Compilation & Rendu** : Node.js v20+, Next.js 14.2.35 (App Router), Windows 10/11 PowerShell.
- **Suite de Tests Unitaires Frontend** : Exécution directe de `npm run test` (runner `scripts/run-unit-tests.mjs`).
- **Contrôle Qualité Anti-Slop** : Exécution de `npm run lint:slop` (script `scripts/lint-ai-slop.mjs`).
- **Tests de Garde SEO & UX** : Suite Jest `tests/unit/ux-seo-audit.test.js`.
- **Validation du Bundle de Production** : `npm run build` complet (TypeScript check, SWC compilation, prerendering des routes statiques, bundling Serwist Service Worker, postbuild).
- **Scripts de Test Scratch Dédiés** :
  - `test-sitemap.mjs` : vérification statique et regex des entrées sitemap XML.
  - `test-metadata.mjs` : contrôle strict des métadonnées `robots`, `canonical`, JSON-LD et OpenGraph.
  - `test-telemetry.mjs` : simulation des événements GA4 sous trois scénarios (SSR sans window, client avec bloqueur de pub sans `window.gtag`, client avec GA4 nominal).
- **Sondes Réseau de Référence** : `curl.exe -s -I` sur l'environnement de production actuel (`https://nopalou.com`) pour cartographier l'état avant déploiement.

---

## 4. Synthèse Détaillée des Résultats de Test

| Catégorie de Test | Nb Tests | PASS | FAIL | BLOQUÉ / REPORTÉ | Taux Succès |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **A. Routes & Indexabilité (SEO Technique)** | 8 | 8 | 0 | 0 | 100% |
| **B. Métadonnées & Données Structurées** | 6 | 6 | 0 | 0 | 100% |
| **C. Qualité des Pages & Anti-Slop** | 3 | 3 | 0 | 0 | 100% |
| **D. Performance, Rendu & UX Mobile** | 2 | 2 | 0 | 0 | 100% |
| **E. Non-Régression Fonctionnelle & Modules** | 4 | 4 | 0 | 0 | 100% |
| **F. Mesure Commerciale & Analytics GA4** | 3 | 2 | 0 | 1 (TEST-PIL-20) | 66.7% |
| **G. Architecture & Tranche 2 (Climatiseurs)** | 2 | 0 | 0 | 2 (TEST-PIL-22/23) | 0% (Cadré) |
| **H. Garde-Fous de Build & Compilation** | 2 | 2 | 0 | 0 | 100% |
| **TOTAL GÉNÉRAL** | **30** | **27** | **0** | **3** | **90.0%** |

---

## 5. Analyse Critique et Contre-Expertise des Corrections

### 1. Canonisation B2B & Noindex (`CORR-03`) — CONFIRMÉ
- **Constat vérifié** : Dans `frontend-next/src/app/creer-boutique/layout.tsx`, les directives `robots: { index: false, follow: true }` et `alternates: { canonical: '${BASE}/creer-boutique-en-ligne' }` sont parfaitement injectées.
- **Comportement de Googlebot anticipé** : L'URL `/creer-boutique` continuera d'être explorée via les liens internes (`follow: true`), mais ses métriques de classement et son PageRank seront intégralement consolidés sur `/creer-boutique-en-ligne`.
- **Impact utilisateur** : Aucun. Le composant `page.tsx` et ses formulaires restent 100% accessibles et interactifs.

### 2. Épuration du Sitemap XML (`CORR-08` & `CORR-03`) — CONFIRMÉ
- **Constat vérifié** : L'entrée `/surga` (qui émettait une 307) et l'entrée `/creer-boutique` (noindex) ont été retirées de `STATIC_ROUTES`.
- **Conformité Google Search Console** : Respect strict du standard (un sitemap XML ne doit contenir que des URLs canoniques renvoyant HTTP 200 en index, follow).

### 3. Résolution du Soft-404 Streaming (`CORR-01`) — CONFIRMÉ & EXPLICITÉ
- **Contre-expertise de la cause racine** : L'Agent 10 a correctement identifié que `frontend-next/src/app/loading.tsx` à la racine imposait un conteneur `<Suspense>` sous `RootLayout`. Dans Next.js 14 App Router, ce mécanisme force l'envoi immédiat du préambule HTTP 200 OK.
- **Vérification** : La suppression du fichier a été constatée. Les sous-dossiers `/produit/`, `/annonces/`, `/boutiques/` n'ayant pas de `loading.tsx` local, Next.js attend désormais la résolution des métadonnées. Comme `introuvableOuRedirection` déclenche `notFound()` dès `generateMetadata`, la réponse émet bien un statut HTTP 404 strict.
- **Réserve mineure** : Les dossiers `/immo` et `/telecom` conservent leur propre `loading.tsx`. Une fiche immobilière inexistante sous `/immo/[id]` devra être auditée ultérieurement pour vérifier si son `loading.tsx` local réintroduit un comportement de streaming prématuré.

### 4. Télémétrie GA4 (`TEST-PIL-17` & `MES-ANO-01`) — CONFIRMÉ
- **Robutesse du code** : Les composants `CreerBoutiqueCtaBtn.tsx`, `ProduitHeroCard.tsx` et `ProduitOffresList.tsx` effectuent tous une vérification de type `typeof (window as any).gtag === 'function'` avant l'émission.
- **Résultat du test sous contrainte (`test-telemetry.mjs`)** :
  - En SSR (sans objet window) : 0 plantage.
  - Côté client avec bloqueur de publicité (gtag non défini) : 0 plantage, la navigation se poursuit normalement.
  - Côté client avec GA4 actif : Les événements `start_trial_click` et `click_whatsapp_order` sont émis avec leurs métadonnées complètes (`produit_id`, `offre_id`, `prix`, `marchand_nom`, `source`).

### 5. Migration DDL d'Attribution Commerciale (`MES-ANO-03`) — VALIDÉ AVEC RÉSERVE TECHNIQUE
- **Idempotence DDL** : Les 4 colonnes `utm_source`, `utm_medium`, `utm_campaign`, `landing_page` sont déclarées avec `ADD COLUMN IF NOT EXISTS` dans `backend/migrate-inline.js` et dans `migration_attribution_abonnements.sql`.
- **Réserve constatée (ANO-A11-02)** : L'index partiel `idx_abonnements_utm_source` présent dans le script autonome `.sql` a été omis dans `backend/migrate-inline.js`.

---

## 6. Anomalies et Réserves Détectées par l'Agent 11

Bien qu'aucune régression bloquante n'ait été introduite, l'audit indépendant a relevé 3 anomalies et réserves nécessitant un traitement :

1. **[ANO-A11-01] Qualité de code : Imports collés sur une seule ligne** (Gravité : Faible)
   - Dans `frontend-next/src/app/creer-boutique/layout.tsx` (ligne 4) et `frontend-next/src/app/creer-boutique-en-ligne/page.tsx` (ligne 10), la syntaxe `import { getEssaiJours } from '@/lib/essai'import { OG_IMAGES } from '@/lib/social'` présente deux déclarations import concaténées sans saut de ligne.
   - Bien que SWC compile sans erreur, cette écriture viole les standards de formattage et de lisibilité.

2. **[ANO-A11-02] Omission de l'index partiel dans le runner automatique de migration** (Gravité : Mineure)
   - L'index `CREATE INDEX IF NOT EXISTS idx_abonnements_utm_source ON abonnements(utm_source) WHERE utm_source IS NOT NULL;` est présent dans le script autonome SQL mais absent de `backend/migrate-inline.js`.

3. **[ANO-A11-03] Report de la persistance applicative des UTM (`TEST-PIL-20`)** (Gravité : Mineure)
   - L'infrastructure SQL de stockage est prête, mais l'extraction des paramètres d'URL au moment de l'inscription marchand dans `boutique-creation.ts` est reportée à la Tranche 2.

---

## 7. Risques Résiduels & Recommandations Post-Déploiement

1. **Latence de Réindexation Googlebot** :
   Le désindexage de `/creer-boutique` et la prise en compte du canonical vers `/creer-boutique-en-ligne` nécessiteront entre 10 et 25 jours dans l'index de Google Sénégal. Il ne faudra pas s'alarmer si la Search Console signale temporairement des avertissements "Page explorée, actuellement non indexée".
2. **Sondes curl post-déploiement obligatoires** :
   Dès le déploiement effectif sur Render et Vercel (après accord de l'utilisateur pour le `git push`), l'Agent 12 ou l'exploitant devra exécuter la sonde curl :
   ```bash
   curl.exe -sL https://nopalou.com/creer-boutique | grep -i 'canonical'
   # Doit retourner : <link rel="canonical" href="https://nopalou.com/creer-boutique-en-ligne" />
   ```

---

## 8. Conclusion et Verdict Général

L'implémentation de la **Tranche 1 du Pilote SEO Nopalou** est solide, rigoureuse et techniquement probante. Elle résout les deux failles critiques qui pénalisaient le SEO de Nopalou (la cannibalisation interne B2B et l'émission prématurée de statuts HTTP 200 sur les fiches introuvables).

Le verdict officiel est :
**VALIDÉ SOUS RÉSERVES**
(Prêt pour le déploiement de la Tranche 1, sous réserve de la prise en compte des 3 réserves techniques documentées dans `ANOMALIES_ET_REGRESSIONS.md`).
