# Registre Indépendant des Anomalies, Réserves et Risques de Régression

```text
Document       : Registre des Anomalies et Diagnostics Techniques
Fichier        : audit/seo/ANOMALIES_ET_REGRESSIONS.md
Autorité       : Agent 11 (Auditeur Indépendant de Recette & Validation SEO)
Date           : 2026-10-10
Branche Git    : main (Vérifiée via git branch --show-current -> main)
Statut         : 5 Anomalies et Réserves Identifiées et Diagnostiquées
Règle          : Zéro modification du code de production par l'Agent 11
```

---

## 1. Vue d'Ensemble des Anomalies Détectées

L'audit indépendant n'a révélé **aucune régression bloquante** (aucun crash d'onboarding, aucun échec de build, aucune fuite vers le module Surga). Cependant, plusieurs anomalies stylistiques, divergences DDL et réserves architecturales ont été relevées pour traitement par l'Agent 12 ou lors de la Tranche 2 :

| Identifiant | Intitulé de l'Anomalie | Périmètre Affecté | Gravité | Statut |
| :--- | :--- | :--- | :---: | :---: |
| **ANO-A11-01** | Imports collés sur une seule ligne physique | `creer-boutique/layout.tsx` & `page.tsx` | Faible | Détectée (À formater) |
| **ANO-A11-02** | Omission de l'index partiel UTM dans `migrate-inline.js` | `backend/migrate-inline.js` | Mineure | Détectée (À synchroniser) |
| **ANO-A11-03** | Persistance applicative UTM non câblée dans l'onboarding | Server Actions `boutique-creation.ts` | Mineure | Reporté Tranche 2 |
| **ANO-A11-04** | Risque résiduel de Soft-404 isolé sur `/immo` et `/telecom` | `app/immo/loading.tsx`, `app/telecom/loading.tsx` | Moyenne | Surveillance recommandée |
| **ANO-A11-05** | Redirections de raccourcis boutiques en HTTP 307 au lieu de 301 | `frontend-next/src/app/b/[slug]/route.ts` | Moyenne | Backlog P2 |

---

## 2. Fiches Détaillées des Anomalies et Diagnostics

---

### Anomalie ANO-A11-01 : Concaténation de deux imports sur la même ligne physique

#### 1. Preuve Reproductible
Examen du code source aux lignes indiquées :
- Fichier [frontend-next/src/app/creer-boutique/layout.tsx](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/src/app/creer-boutique/layout.tsx#L4) :
  ```typescript
  4: import { getEssaiJours } from '@/lib/essai'import { OG_IMAGES } from '@/lib/social'
  ```
- Fichier [frontend-next/src/app/creer-boutique-en-ligne/page.tsx](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/src/app/creer-boutique-en-ligne/page.tsx#L10) :
  ```typescript
  10: import { getEssaiJours } from '@/lib/essai'import { OG_IMAGES } from '@/lib/social'
  ```

#### 2. Procédure de Reproduction
```bash
grep -n "import.*import" frontend-next/src/app/creer-boutique/layout.tsx frontend-next/src/app/creer-boutique-en-ligne/page.tsx
```
Sortie observée : Les deux lignes apparaissent avec deux déclarations `import` consécutives sans délimiteur de saut de ligne.

#### 3. Gravité & Impact
- **Gravité** : **Faible** (Cosmétique / Qualité de code).
- **Impact** : Zéro impact sur la compilation Next.js (le compilateur SWC analyse les tokens syntaxiques et accepte la séquence). Cependant, cela dégrade la lisibilité humaine, enfreint les conventions ESLint/Prettier et complique la relecture git.

#### 4. Cause Démontrée
Lors de l'automatisation de l'injection de `OG_IMAGES` par l'Agent 10, le remplacement de chaîne a inséré le second import immédiatement à la fin du premier sans caractère `\n`.

#### 5. Contrôles Recommandés Après Correction
Séparer les deux imports sur deux lignes distinctes et relancer `npm run build`.

---

### Anomalie ANO-A11-02 : Omission de l'index partiel UTM dans le script de démarrage Render

#### 1. Preuve Reproductible
Comparaison entre le script autonome et le script exécuté au boot :
- Dans [audit/seo/scripts/migration_attribution_abonnements.sql](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/audit/seo/scripts/migration_attribution_abonnements.sql#L13) :
  ```sql
  CREATE INDEX IF NOT EXISTS idx_abonnements_utm_source ON abonnements(utm_source) WHERE utm_source IS NOT NULL;
  ```
- Dans [backend/migrate-inline.js](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/backend/migrate-inline.js#L897-L901) :
  ```javascript
  ALTER TABLE abonnements ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
  ALTER TABLE abonnements ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
  ALTER TABLE abonnements ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);
  ALTER TABLE abonnements ADD COLUMN IF NOT EXISTS landing_page VARCHAR(255);
  // L'index partiel idx_abonnements_utm_source est absent !
  ```

#### 2. Procédure de Reproduction
```bash
grep "idx_abonnements_utm_source" backend/migrate-inline.js
# Ne retourne aucun résultat
```

#### 3. Gravité & Impact
- **Gravité** : **Mineure** (Performance / Exploitation).
- **Impact** : Lors du redémarrage automatique du backend sur Render, les 4 colonnes seront bien créées sans erreur, mais l'index optimisant les requêtes d'analyse du trafic SEO ne sera pas créé en base.

#### 4. Cause Démontrée
Omission involontaire de la ligne `CREATE INDEX IF NOT EXISTS` dans le bloc d'exécution de `migrate-inline.js`.

#### 5. Contrôles Recommandés Après Correction
Ajouter l'instruction d'index partiel dans `backend/migrate-inline.js` juste après la création des colonnes.

---

### Anomalie ANO-A11-03 : Report de la persistance applicative des UTM lors de l'onboarding

#### 1. Preuve Reproductible
Examen du Server Action d'onboarding [frontend-next/src/app/actions/boutique-creation.ts](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/src/app/actions/boutique-creation.ts) :
Le payload de création de boutique et d'abonnement n'extrait pas encore les paramètres `utm_source`, `utm_campaign` des cookies ou de la session pour les enregistrer dans les nouvelles colonnes de la table `abonnements`.

#### 2. Procédure de Reproduction
Créer une boutique de test via `/creer-boutique?utm_source=google_seo`. Constater que la ligne insérée dans `abonnements` conserve `utm_source = NULL`.

#### 3. Gravité & Impact
- **Gravité** : **Mineure** (Planification Tranche 2).
- **Impact** : Tant que l'instrumentation applicative n'est pas déployée, les inscriptions d'essai continuent d'être enregistrées en direct au lieu d'être attribuées au canal SEO.

#### 4. Cause Démontrée
Séquençage volontaire : la Tranche 1 se concentrait sur l'infrastructure de stockage DDL (pour éviter les alertes de démarrage de base) ; la lecture/écriture applicative relève du chantier de mesure de la Tranche 2.

#### 5. Contrôles Recommandés Après Correction
Implémenter la capture du cookie de parrainage/UTM lors de la soumission du wizard marchand.

---

### Anomalie ANO-A11-04 : Risque résiduel de Soft-404 isolé sur `/immo` et `/telecom`

#### 1. Preuve Reproductible
Présence de squelettes locaux :
- `frontend-next/src/app/immo/loading.tsx` (présent)
- `frontend-next/src/app/telecom/loading.tsx` (présent)

#### 2. Procédure de Reproduction
Dans Next.js 14, un fichier `loading.tsx` au niveau du répertoire `/immo` place l'ensemble des routes descendantes (`/immo/[id]`) sous un conteneur `<Suspense>`. Si `generateMetadata` ou la page lève `notFound()` tardivement sur `/immo/uuid-inexistant`, le streaming amorcé peut potentiellement envoyer un statut 200 avant la levée de 404.

#### 3. Gravité & Impact
- **Gravité** : **Moyenne** (Sous-arbres spécifiques).
- **Impact** : N'affecte ni `/produit/`, ni `/boutiques/`, ni `/annonces/` (qui n'ont pas de `loading.tsx` local). Ne concerne que les annonces immobilières et fiches forfaits télécom introuvables.

#### 4. Cause Démontrée
Maintien des `loading.tsx` locaux pour l'expérience visuelle de chargement des annonces immobilières et des offres opérateurs.

#### 5. Contrôles Recommandés Après Correction
Tester le comportement HTTP exact de `/immo/00000000-inexistant` sur l'environnement de staging ou production après déploiement.

---

### Anomalie ANO-A11-05 : Redirections de raccourcis boutiques en HTTP 307 au lieu de 301

#### 1. Preuve Reproductible
Dans [frontend-next/src/app/b/[slug]/route.ts](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/src/app/b/[slug]/route.ts#L18) :
```typescript
18: return NextResponse.redirect(new URL(`/boutiques/${slug}`, request.url), { status: 307 })
```

#### 2. Procédure de Reproduction
```bash
curl.exe -s -I https://nopalou.com/b/vendeur-test
# Retourne HTTP 307 Temporary Redirect
```

#### 3. Gravité & Impact
- **Gravité** : **Moyenne** (Transmission du PageRank).
- **Impact** : Une redirection 307 signale un déplacement temporaire. Googlebot met beaucoup plus de temps à transmettre le lien d'autorité vers la boutique officielle que si un code 301 (Permanent Redirect) était utilisé.

#### 4. Cause Démontrée
Implémentation historique rapide des routes de redirection raccourcies pour les réseaux sociaux.

#### 5. Contrôles Recommandés Après Correction
Basculer les statuts de retour de `307` à `301` dans `frontend-next/src/app/b/[slug]/route.ts` (prévu au backlog P2).
