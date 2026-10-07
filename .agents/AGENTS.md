# Directives et Règles Agentic AI (Nopalou)

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
