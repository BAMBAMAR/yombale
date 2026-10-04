# Directives et Règles Agentic AI (Nopalou)

## 📌 Règle Obligatoire de Documentation & Déploiement
- **Mise à Jour Systématique de `CLAUDE.md`** : À la fin de chaque session ou dès qu'un déploiement/push git (`origin main`) est effectué avec succès et sans aucune erreur remontée, l'assistant DOIT **systématiquement mettre à jour le fichier `CLAUDE.md`** avec le résumé précis des nouveautés, fonctionnalités ajoutées, migrations SQL et corrections effectuées.

## 🏷️ Règle Fondamentale de Démarcation : NOPALOU vs SURGA
- **SURGA** (`surga.nopalou.com`, `/surga`, `/admin/surga`) : Assistant personnel de poche au quotidien. Code sous `frontend-next/src/app/surga/`, `backend/services/surga/`, tables `surga_*`. Interface 100% autonome et détachée, zéro élément marketplace (navbar, footer, panier Nopalou masqués).
- **NOPALOU** (`nopalou.com`) : Marketplace e-commerce, comparateur de prix, logiciel de caisse tactile POS offline-first, boutiques et baux immobiliers.
- **Cloisonnement** : Ne jamais impacter la caisse ni le comparateur lors des travaux sur Surga, et ne jamais réinjecter d'éléments marketplace dans Surga.

