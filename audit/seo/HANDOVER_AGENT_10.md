# Handover Officiel : Agent 9 → Agent 10 (Ingénieur d'Exécution & Implémentation)

```text
Émetteur     : Agent 9 (Préparation du Pilote SEO & Cadre d'Exécution)
Destinataire : Agent 10 (Ingénieur d'Exécution & Déploiement SEO)
Date         : 2026-10-10
Branche Git  : main (HEAD vérifié via git branch --show-current -> main)
Statut       : Cadre d'Exécution, Cartographie, Baselines, Matrice & Sécurité Complétés à 100%
Références   : VALIDATION_PERIMETRE_PILOTE.md, CARTOGRAPHIE_TECHNIQUE_PILOTE.md,
               ETAT_REFERENCE_PILOTE.md, MATRICE_TESTS_PILOTE.csv,
               PLAN_DEPLOIEMENT_ET_RETOUR_ARRIERE.md, BLOCAGES_ET_PREREQUIS.md
Verdict      : PRÊT SOUS CONDITIONS (Tranche 1 Prête pour Exécution Immédiate — Tranche 2 Cadrée)
```

---

## 1. Contexte & Résumé Exécutif pour l'Agent 10

L'**Agent 9** a analysé, vérifié sur pièces et sécurisé l'intégralité du dispositif d'exécution du premier pilote SEO de **Nopalou** (`nopalou.com`).

### Ce qui a été accompli :
1. **Périmètre Vérifié et Découpé en Deux Tranches Étanche** :
   - **Tranche 1 (Immédiatement Exécutable)** : Résolution P0 du Soft-404 (`CORR-01`), canonisation B2B & noindex sur `/creer-boutique` (`CORR-03`), assainissement du `sitemap.xml` (retrait de `/surga` et de `/creer-boutique`, `CORR-08`), et télémétrie des clics WhatsApp (`MES-ANO-01`).
   - **Tranche 2 (Cadrée & Conditionnée)** : Déploiement du sous-hub B2C Astech Climatiseurs (702 produits) et migration SQL d'attribution sur la table `abonnements` (`MES-ANO-03`).
2. **Identification des Contraintes Matérielles Clés** :
   - *Soft-404* : Détection du comportement de streaming Next.js 14 qui émettait un HTTP 200 sur des fiches introuvables.
   - *Routage Astech* : Mise en évidence que le dossier `categorie/[slug]/[sousCategorie]` ne supporte que 2 segments d'URL, évitant à l'Agent 10 une erreur 404 imprévue.
   - *PostgreSQL Render* : Protection contre les alertes WhatsApp d'urgence automatiques générées par les tentatives de connexion SQL locales hors session réseau autorisée.
3. **Respect Absolu des Règles d'Or (`AGENTS.md`)** :
   - **Zéro `git push` sans Demande Explicite de l'Utilisateur**.
   - **Branche `main` Obligatoire**.
   - **Zéro Émoji Unicode dans l'UI** (`npm run lint:slop`).
   - **Zéro Altération de la Caisse POS ou de Surga**.

---

## 2. Feuille de Route d'Exécution Immédiate pour l'Agent 10 (Tranche 1)

L'Agent 10 peut débuter immédiatement par les **5 étapes opérationnelles de la Tranche 1** suivantes :

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ACTIONS IMMÉDIATES À EXÉCUTER PAR L'AGENT 10                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ÉTAPE 1 : CONTRÔLE INITIAL DE L'ENVIRONNEMENT LOCAL                                    │
│   • Vérifier la branche : git branch --show-current  (doit renvoyer 'main').           │
│   • Rejouer la suite de tests frontend : cd frontend-next && npm run test              │
│     -> Attendu : 97/97 tests passés (100%).                                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ÉTAPE 2 : CANONISATION & NOINDEX SUR /creer-boutique (CORR-03)                         │
│   • Fichier : frontend-next/src/app/creer-boutique/layout.tsx                          │
│   • Actions :                                                                          │
│     1. Remplacer alternates: { canonical: `${BASE}/creer-boutique` }                   │
│        par alternates: { canonical: `${BASE}/creer-boutique-en-ligne` }                │
│     2. Ajouter dans metadata : robots: { index: false, follow: true }                  │
│     -> Conserver intact le composant page.tsx et son formulaire fonctionnel.           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ÉTAPE 3 : NETTOYAGE DU SITEMAP XML (CORR-08 & CORR-03)                                 │
│   • Fichier : frontend-next/src/app/sitemap.ts                                         │
│   • Actions :                                                                          │
│     1. Ligne 22 : Supprimer l'entrée { url: `${BASE}/surga`, ... }                     │
│     2. Ligne 75 : Supprimer l'entrée { url: `${BASE}/creer-boutique`, ... }            │
│     -> Vérifier que ${BASE}/creer-boutique-en-ligne (ligne 62) reste présent.          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ÉTAPE 4 : CORRECTION SYNCHRONE DU SOFT-404 SUR LES FICHES (CORR-01)                    │
│   • Fichiers : frontend-next/src/app/produit/[id]/page.tsx & src/lib/introuvable.ts    │
│   • Actions :                                                                          │
│     S'assurer que lors d'un appel avec un ID inexistant, la fonction notFound() est    │
│     invoquée avant tout streaming pour que le code HTTP 404 strict soit renvoyé.       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ÉTAPE 5 : CÂBLAGE DE LA TÉLÉMÉTRIE CLIC WHATSAPP (MES-ANO-01)                          │
│   • Fichiers : frontend-next/src/app/produit/[id]/components/ProduitOffresList.tsx     │
│                & frontend-next/src/app/produit/[id]/components/ProduitHeroCard.tsx     │
│   • Action : Ajouter sur les liens sortants WhatsApp un gestionnaire onClick :         │
│     if (typeof window !== 'undefined' && window.gtag) {                                │
│       window.gtag('event', 'click_whatsapp_order', { produit_id: ..., prix: ... });   │
│     }                                                                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Matrice de Validation Post-Exécution Locale

Avant d'envisager tout commit ou demande de déploiement, l'Agent 10 doit exécuter et réussir la séquence de tests ci-dessous :

```bash
# 1. Tests unitaires frontend (97 tests)
cd frontend-next
npm run test

# 2. Linter anti-slop
npm run lint:slop

# 3. Tests de garde SEO (canonical, 404, durées d'essai)
cd ..
npx jest tests/unit/ux-seo-audit.test.js

# 4. Compilation TypeScript Next.js
cd frontend-next
npm run build
```

---

## 4. Rappel Impératif des Interdictions & Sécurités

1. **Aucun `git push`** sans demande explicite écrite de l'utilisateur.
2. **Aucune régression sur le formulaire de création de boutique** (`/creer-boutique`).
3. **Aucune utilisation d'émojis dans l'interface** (utiliser `lucide-react`).
4. **Zéro contact ou modification sur l'arborescence `/surga`**.

---

## 5. Verdict Officiel de l'Agent 9

> **VERDICT : PRÊT SOUS CONDITIONS**
> 
> - **Tranche 1 (Fondations P0, Canonisation B2B, Sitemap & Soft-404)** : **PRÊTE POUR EXÉCUTION IMMÉDIATE**. Tous les prérequis techniques, fichiers et tests sont identifiés et validés.
> - **Tranche 2 (Verticale Astech & Attribution SQL)** : **CADRÉE**, à exécuter dès livraison de la Tranche 1 et validation de la sous-route `[marque]`.
