# Handover Officiel : Agent 11 → Agent 12 (Directeur de Clôture & Déploiement)

```text
Émetteur     : Agent 11 (Auditeur Indépendant de Recette & Validation SEO)
Destinataire : Agent 12 (Ingénieur de Clôture, Finalisation & Déploiement)
Date         : 2026-10-10
Branche Git  : main (Vérifiée via git branch --show-current -> main)
Statut       : Recette Indépendante Achevée — Livrables Prêts
Verdict A11  : VALIDÉ SOUS RÉSERVES (Déployable après levée de 2 réserves mineures)
Références   : RAPPORT_TESTS_INDEPENDANTS.md, MATRICE_VALIDATION_EXIGENCES.csv,
               ANOMALIES_ET_REGRESSIONS.md, VERDICT_PILOTE_SEO.md
```

---

## 1. Contexte & Bilan de la Recette Indépendante

L'Agent 11 a procédé au contrôle exhaustif et contradictoire des travaux réalisés par l'Agent 10.
Les résultats consolidés sont les suivants :
- **27 exigences validées avec succès avec preuves reproductibles (PASS)**.
- **0 régression technique ou fonctionnelle**.
- **0 échec bloquant (FAIL)**.
- **3 exigences bloquées ou reportées** (TEST-PIL-20 instrumentation applicative, TEST-PIL-22/23 sous-hub climatiseurs soumis à arbitrage).
- **Compilation Next.js 14 de production 100% réussie** (`npm run build` -> code 0).
- **Suites de tests Nopalou 100% au vert** (97/97 tests unitaires, 76 tests de garde Nopalou).

---

## 2. Synthèse des 2 Réserves Immédiates à Traiter par l'Agent 12

L'Agent 12 dispose de 2 actions simples et rapides à réaliser avant déploiement :

### Action 1 : Séparation des Déclarations d'Imports Concaténées (`ANO-A11-01`)
- **Fichier 1** : `frontend-next/src/app/creer-boutique/layout.tsx` (ligne 4)
  - Actuel : `import { getEssaiJours } from '@/lib/essai'import { OG_IMAGES } from '@/lib/social'`
  - À remplacer par :
    ```typescript
    import { getEssaiJours } from '@/lib/essai'
    import { OG_IMAGES } from '@/lib/social'
    ```
- **Fichier 2** : `frontend-next/src/app/creer-boutique-en-ligne/page.tsx` (ligne 10)
  - Actuel : `import { getEssaiJours } from '@/lib/essai'import { OG_IMAGES } from '@/lib/social'`
  - À remplacer par :
    ```typescript
    import { getEssaiJours } from '@/lib/essai'
    import { OG_IMAGES } from '@/lib/social'
    ```

### Action 2 : Ajout de l'Index Partiel UTM dans `backend/migrate-inline.js` (`ANO-A11-02`)
- **Fichier** : `backend/migrate-inline.js` (ligne 901)
- **Code à insérer** :
  ```javascript
  ALTER TABLE abonnements ADD COLUMN IF NOT EXISTS landing_page VARCHAR(255);
  CREATE INDEX IF NOT EXISTS idx_abonnements_utm_source ON abonnements(utm_source) WHERE utm_source IS NOT NULL;
  ```
- **Bénéfice** : Synchronise parfaitement le runner automatique de Render avec le script DDL autonome `audit/seo/scripts/migration_attribution_abonnements.sql`.

---

## 3. Commandes de Recette Prêtes pour l'Agent 12

Toutes les commandes nécessaires pour re-vérifier la conformité après ces 2 retouches :

```bash
# 1. Vérification de la branche
git branch --show-current
# Attendu: main

# 2. Tests unitaires frontend
cd frontend-next
npm run test
# Attendu: 97 passés, 0 échoués

# 3. Linter anti-slop
npm run lint:slop
# Attendu: 0 régression, code 0

# 4. Compilation de production
npm run build
# Attendu: Compiled successfully (code 0)

# 5. Tests de garde Jest racine
cd ..
npx jest tests/unit/ux-seo-audit.test.js
# Attendu: 76 tests Nopalou PASS
```

---

## 4. Protocole de Déploiement en Production (`git push`)

> [!CAUTION]
> **RAPPEL DE LA RÈGLE D'OR ABSOLUE DU PROJET (`AGENTS.md`)** :
> L'Agent 12 ne doit **JAMAIS** déclencher de `git push` de sa propre initiative.
> Un `git push` vers `origin main` ne doit être exécuté **QUE SI et SEULEMENT SI l'utilisateur le demande explicitement**.

Dès que l'utilisateur donne son feu vert pour le push, l'Agent 12 exécutera :
1. `git add frontend-next/src/app/creer-boutique/layout.tsx frontend-next/src/app/creer-boutique-en-ligne/page.tsx backend/migrate-inline.js audit/seo/`
2. `git commit -m "fix(seo): levee des reserves agent 11 - formatage imports et index partiel utm"`
3. Configuration du remote GitHub avec le token présent dans `.env` si nécessaire.
4. `git push origin main`
5. Exécution des sondes de contrôle curl post-déploiement :
   ```bash
   curl.exe -sL https://nopalou.com/creer-boutique | grep -i 'canonical'
   curl.exe -s https://nopalou.com/sitemap.xml | grep -c '/creer-boutique<'
   curl.exe -s https://nopalou.com/sitemap.xml | grep -c '/surga<'
   ```

---

## 5. Dossier pour la Tranche 2 (Agent 12 / Post-Pilote)

Deux chantiers sont prêts et cadrés pour la phase suivante :
1. **Arbitrage du routage Astech Climatiseurs (`BLOQ-03`)** :
   - Choix entre `frontend-next/src/app/climatiseur-astech-dakar/page.tsx` (recommandé pour cibler la requête exacte sans toucher au routeur) ou le sous-répertoire hiérarchique à 3 segments.
2. **Capture applicative des UTM (`TEST-PIL-20`)** :
   - Mise en place de la lecture des paramètres de campagne dans `frontend-next/src/app/actions/boutique-creation.ts` et persistance dans la table `abonnements`.

---

**Le projet est sain, propre et prêt pour la clôture et la mise en production.**
