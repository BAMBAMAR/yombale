# Plan de Déploiement et Procédure de Retour Arrière (Rollback) — Pilote SEO

```text
Document       : Protocole de Déploiement Sécurisé, Surveillance & Rollback
Fichier        : audit/seo/PLAN_DEPLOIEMENT_ET_RETOUR_ARRIERE.md
Autorité       : Agent 9 (Ingénieur Préparation du Pilote & Cadre d'Exécution)
Date           : 2026-10-10
Branche Git    : main (Vérifiée via git branch --show-current -> main)
Statut         : Procédure Opérationnelle Validée — Zéro Risque de Données
```

---

## 1. Principes Directeurs & Règles de Sécurité

Conformément aux directives absolues du projet (`AGENTS.md`) :
1. **Zéro `git push` sans Demande Explicite** : L'assistant ne doit **JAMAIS** pousser sur le remote GitHub sans ordre direct et non équivoque de l'utilisateur. Toutes les modifications sont préparées, testées et commitées localement d'abord.
2. **Cloisonnement Absolu NOPALOU vs SURGA** : Aucune modification ne doit affecter les routes `/surga`, ni le sous-domaine `surga.nopalou.com`, ni la caisse POS physique en cours d'exploitation par les commerçants.
3. **Protection des Données Privées** : Aucune donnée client (coordonnées des acheteurs, mots de passe, numéros de téléphone privés, carnets de dettes) ne doit être exposée ou modifiée pour faciliter l'indexation.

---

## 2. Conditions d'Autorisation du Déploiement (Quality Gates)

Le déploiement en production ne peut être autorisé que si l'ensemble des contrôles préalables ci-dessous affiche un résultat **PASS** :

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CHECKLIST DES QUALITY GATES PRÉ-DÉPLOIEMENT                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [GATE 1] BRANCHE GIT STRICTE                                                           │
│   • Commande : git branch --show-current                                               │
│   • Critère : Doit renvoyer exactement "main". Interdiction formelle sur feature/surga.│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [GATE 2] VALIDATION DES TESTS UNITAIRES FRONTEND                                       │
│   • Commande : cd frontend-next && npm run test                                        │
│   • Critère : 97/97 tests passés (100% de succès). Zéro échec toléré.                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [GATE 3] LINTER DE QUALITÉ & ANTI-AI-SLOP                                              │
│   • Commande : cd frontend-next && npm run lint:slop                                   │
│   • Critère : Zéro injection d'icônes émojis Unicode dans l'UI ou les boutons.         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [GATE 4] VALIDATION DES TESTS DE GARDE SEO                                             │
│   • Commande : npx jest tests/unit/ux-seo-audit.test.js                                 │
│   • Critère : Zéro régression sur les canonicals, 404 introuvables et allégations.     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [GATE 5] VALIDATION DU BUILD NEXT.JS LOCAL                                             │
│   • Commande : cd frontend-next && npm run build                                       │
│   • Critère : Compilation sans erreur TypeScript, génération statique réussie.        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Procédure de Déploiement Pas à Pas (Tranche 1)

Le déploiement de la **Tranche 1** (Fondations P0, Sanctuarisation B2B & Retrait Sitemap) s'effectue selon la séquence stricte suivante :

### Étape 1 : Sauvegarde & Marquage du Point de Restauration
Avant toute modification locale :
```bash
# Identifier le commit de référence propre
git rev-parse HEAD > audit/seo/PRE_PILOT_COMMIT_HASH.txt
# Créer un tag local de sécurité
git tag pre-pilote-seo-checkpoint
```

### Étape 2 : Application des Modifications dans le Code Local
1. Modification de `frontend-next/src/app/creer-boutique/layout.tsx` : injection de `robots: { index: false, follow: true }` et alignement du canonical vers `https://nopalou.com/creer-boutique-en-ligne`.
2. Modification de `frontend-next/src/app/sitemap.ts` : suppression de `/surga` et de `/creer-boutique`.
3. Correction synchrone du statut 404 dans `frontend-next/src/app/produit/[id]/page.tsx` et `lib/introuvable.ts`.
4. Ajout de la télémétrie `click_whatsapp_order` sur les CTA WhatsApp du comparateur.

### Étape 3 : Exécution des Tests de Non-Régression
```bash
cd frontend-next
npm run test
npm run lint:slop
cd ..
npx jest tests/unit/ux-seo-audit.test.js
```

### Étape 4 : Commit Local Documenté
```bash
git add frontend-next/src/app/creer-boutique/layout.tsx frontend-next/src/app/sitemap.ts frontend-next/src/app/produit/[id]/page.tsx
git commit -m "fix(seo): tranche 1 pilote - canonisation b2b, nettoyage sitemap et correction soft-404"
```

### Étape 5 : Déploiement en Production (Sur Ordre Explicite Uniquement)
Une fois l'autorisation de push donnée par l'utilisateur :
```bash
git push origin main
```
*Le pipeline CI/CD Render déploie automatiquement le frontend et le backend sous 3 à 5 minutes.*

---

## 4. Procédure de Contrôle Post-Déploiement (Smoketests sous 15 Minutes)

Immédiatement après confirmation de la mise en ligne par Render :

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PROTOCOLE DE SMOKETEST POST-DÉPLOIEMENT                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. CONTRÔLE CANONICAL & NOINDEX SUR /creer-boutique                                    │
│    curl -sL https://nopalou.com/creer-boutique | grep -i 'canonical'                  │
│    -> Attendu : href="https://nopalou.com/creer-boutique-en-ligne"                     │
│    curl -sL https://nopalou.com/creer-boutique | grep -i 'robots'                     │
│    -> Attendu : content="noindex, follow"                                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. CONTRÔLE DU SITEMAP XML                                                             │
│    curl -s https://nopalou.com/sitemap.xml | grep -c '/surga<'                         │
│    -> Attendu : 0                                                                      │
│    curl -s https://nopalou.com/sitemap.xml | grep -c '/creer-boutique<'                │
│    -> Attendu : 0                                                                      │
│    curl -s https://nopalou.com/sitemap.xml | grep -c '/creer-boutique-en-ligne<'       │
│    -> Attendu : 1                                                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. CONTRÔLE DU SOFT-404 STRICT                                                         │
│    curl -s -o /dev/null -w "%{http_code}" https://nopalou.com/produit/00000000-0000-0000-0000-000000000000-inexistant
│    -> Attendu : 404                                                                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. CONTRÔLE DU FONCTIONNEMENT DU FORMULAIRE MARCHAND                                   │
│    Vérification manuelle sur mobile : le formulaire d'onboarding reste pleinement      │
│    fonctionnel et permet d'inscrire une boutique sans encombre.                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Procédure de Retour Arrière Immédiat (Rollback)

En cas d'anomalie critique détectée lors des smoketests (ex: rupture du formulaire d'inscription, erreurs 500 sur les fiches produits, régression de style) :

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PROCÉDURE DE ROLLBACK EN 3 ÉTAPES                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ÉTAPE 1 : ANNULATION DU COMMIT DÉPLOYÉ                                                 │
│   git revert HEAD --no-edit                                                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ÉTAPE 2 : REDÉPLOIEMENT D'URGENCE                                                      │
│   git push origin main                                                                 │
│   (Restaure immédiatement l'état stable précédent sur Render)                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ÉTAPE 3 : NOTIFICATION & CONSIGNATION D'INCIDENT                                       │
│   Consigner l'heure, l'erreur observée et le motif du rollback dans :                  │
│   docs/JOURNAL-LIVRAISONS.md et audit/seo/BLOCAGES_ET_PREREQUIS.md                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Rollback Spécifique Base de Données (Tranche 2)
Si une migration SQL DDL a été exécutée sur la table `abonnements` :
```sql
-- Script de rollback immédiat et sécurisé :
ALTER TABLE abonnements DROP COLUMN IF EXISTS utm_source;
ALTER TABLE abonnements DROP COLUMN IF EXISTS utm_medium;
ALTER TABLE abonnements DROP COLUMN IF EXISTS utm_campaign;
ALTER TABLE abonnements DROP COLUMN IF EXISTS landing_page;
```
*Cette commande est non bloquante et préserve l'intégralité des données d'abonnements préexistantes.*

---

## 6. Surveillance & Télémétrie des Erreurs

Pendant les 72 heures suivant le déploiement :
1. **Sentry Dashboard** : Suivi du taux d'erreurs d'exception JavaScript côté client et serveur (`@sentry/nextjs` et `@sentry/node`).
2. **Logs Render** : Surveillance des statuts HTTP 500 éventuels.
3. **Alertes WhatsApp Admin** : Vérification qu'aucune alerte de rupture de base de données n'est émise par le backend.
