# Directives et Règles Agentic AI (Nopalou)

## 🌿 Règle Absolue de Gestion des Branches Git : NOPALOU vs SURGA
- **Branche `main` Obligatoire pour NOPALOU** : Toute modification relative à **NOPALOU** (marketplace, panel d'administration global `/admin`, caisse POS, boutiques, comparateur, CRM/prospection, routes API générales) DOIT IMPÉRATIVEMENT être effectuée sur la branche **`main`**. L'assistant a interdiction formelle de travailler sur ces périmètres dans la branche `feature/surga`.
- **Branche `feature/surga` Exclusivement pour SURGA** : La branche `feature/surga` est STRICTEMENT réservée aux développements exclusifs de l'assistant personnel **SURGA** (`/surga`, `/admin/surga`, `backend/services/surga/`).
- **Vérification Systématique** : Avant de démarrer ou poursuivre toute tâche relative à Nopalou ou à l'administration générale, vérifier systématiquement la branche active avec `git branch --show-current` et basculer sur `main`.

## 🧊 Gel du Dépôt pendant un Audit SURGA (décision utilisateur du 2026-10-07)
- **Un seul dossier, une seule session à la fois** : ce dossier de travail est partagé. Pendant qu'un agent d'audit de la campagne pré-production Surga y travaille (signe : `git branch --show-current` renvoie `feature/surga` et `audit/HANDOVER/` contient un handover en cours), **aucune autre session ne doit** y exécuter `git commit`, `git stash`, `git checkout`, `git switch`, `git reset` ni `git clean`.
- **Pourquoi** : le 2026-10-07, un `git stash -u` suivi d'un passage sur `main` a retiré du disque tous les livrables de l'Audit 1 en cours et déplacé `HEAD` sous les tests.
- **Travail Nopalou urgent pendant un audit** : le faire dans un dossier séparé (`git worktree add ../yombale-main main`), jamais dans celui-ci.
- **Dossiers de la campagne** : `audit/00_PREPARATION/`, `audit/01_ARCHITECTURE_SECURITE/`, `audit/HANDOVER/` et les suivants décrivent des failles. Ils sont ignorés par git : ne jamais les ajouter de force (`git add -f`).

## 📌 Règle Obligatoire de Documentation Exhaustive pour les Prochaines Sessions
- **Mise à Jour Systématique de TOUS les Documents** : À la fin de chaque session de travail, après chaque livraison ou tâche majeure (et obligatoirement avant tout déploiement / `git push`), l'assistant DOIT **systématiquement et sans exception mettre à jour l'ensemble des documents de documentation et de passation** pour garantir une reprise parfaite lors des prochaines sessions :
  1. `CLAUDE.md` (résumé des nouveautés, migrations SQL et corrections en tête du journal des versions).
  2. `docs/JOURNAL-LIVRAISONS.md` (compte-rendu des livraisons en tête du journal racine).
  3. `docs/surga/JOURNAL-LIVRAISONS.md` (journal spécifique du module concerné).
  4. `docs/surga/HANDOVER.md` (document de passation & reprise actualisé : date, statut, briques, cartographie, tests).
  5. `docs/surga/PLAN.md` (plan d'action actualisé avec statuts `[x] DONE`).
- **Commit Local Systématique** : Enregistrer ces mises à jour dans un commit local (sans aucun push automatique sans ordre explicite).

## 🏷️ Règle Fondamentale de Démarcation : NOPALOU vs SURGA
- **SURGA** (`surga.nopalou.com`, `/surga`, `/admin/surga`) : Assistant personnel de poche au quotidien. Code sous `frontend-next/src/app/surga/`, `backend/services/surga/`, tables `surga_*`. Interface 100% autonome et détachée, zéro élément marketplace (navbar, footer, panier Nopalou masqués).
- **NOPALOU** (`nopalou.com`) : Marketplace e-commerce, comparateur de prix, logiciel de caisse tactile POS offline-first, boutiques et baux immobiliers.
- **Cloisonnement** : Ne jamais impacter la caisse ni le comparateur lors des travaux sur Surga, et ne jamais réinjecter d'éléments marketplace dans Surga.

## 🎨 Sanctuarisation Absolue de l'Emblème & Logo Surga (/surga/surga-symbol.png)
- **Bannissement des Placeholders et Fausses Icônes** : L'assistant ne doit **JAMAIS** réinventer, bricoler ou substituer l'icône de Surga par un carré noir avec la lettre "S", un emoji, une icône vectorielle Lucide aléatoire ou du code HTML générique ad-hoc.
- **Source de Vérité Unique Obligatoire** : Tout affichage du logo ou de l'emblème de Surga (Desktop Sidebar, Mobile Header, modales, landing page, profil) DOIT IMPÉRATIVEMENT utiliser le composant sanctuarisé `<SurgaBrandLogo />` (`frontend-next/src/app/surga/components/SurgaBrandLogo.tsx`) ou charger directement le fichier image officiel `/surga/surga-symbol.png` (personnage en caftan stylisé en rubans S avec ceinture ambre).
- **Interdiction de Transfert de Mockup Statique vers Prod** : Lors du prototypage rapide de maquettes HTML/CSS, l'assistant a interdiction absolue de transférer des éléments placeholders (tels que `<div>S</div>`) dans les composants React de production.
