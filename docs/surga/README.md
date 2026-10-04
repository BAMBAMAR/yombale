# Surga, dossier de référence

Surga est l'assistant de poche de Nopalou : une app installable (PWA) personnalisable, avec
WhatsApp pour les tâches précises et l'audio en option. Ce dossier contient tout ce qu'il faut
pour le construire avec un agent (Claude Code) dans le dépôt Nopalou existant.

## Contenu
```
(racine du dépôt)
├── CLAUDE_SURGA.md          règles de l'agent (à fusionner avec CLAUDE.md s'il existe)
├── .env.example             variables à ajouter à votre .env (ne jamais commiter le vrai .env)
└── docs/surga/
    ├── README.md            ce fichier
    ├── INTEGRATION_NOPALOU.md   audit et questions à poser, à lire en premier
    ├── RESUME_PROJET.md     la vision en une page
    ├── PRD.md               produit, personas, exigences, métriques
    ├── CAHIER_DES_CHARGES.md    périmètre fonctionnel et technique détaillé
    ├── PLAN.md              ordre de travail en tranches, seul endroit où les statuts évoluent
    ├── DESIGN.md            design system et écrans de l'app
    ├── DECISIONS.md         décisions tranchées et points ouverts
    ├── AUDIT.md             état réel du dépôt, rempli en Phase 0
    ├── LECONS_APPRISES.md   erreurs passées et risques anticipés
    └── JOURNAL-LIVRAISONS.md    registre des livraisons
```

## Installer dans le dépôt Nopalou
1. Créer la branche : `git checkout -b feature/surga`.
2. Copier `docs/surga/` dans le dépôt.
3. Copier `CLAUDE_SURGA.md` à la racine. Ne pas le renommer en `CLAUDE.md` si un `CLAUDE.md`
   existe déjà. S'il n'existe pas, le renommer.
4. Ajouter les variables de `.env.example` à votre `.env` existant, sans l'écraser.

## Ordre de lecture pour l'agent
1. `docs/surga/INTEGRATION_NOPALOU.md`, puis `CLAUDE_SURGA.md`
2. `docs/surga/CAHIER_DES_CHARGES.md` et `docs/surga/PLAN.md`
3. `docs/surga/DECISIONS.md` pour ne pas rediscuter ce qui est tranché
4. `docs/surga/DESIGN.md` avant la première interface
5. `docs/surga/LECONS_APPRISES.md` avant un sujet sensible (sécurité, vocal, données
   personnelles)

## Qui fait autorité
| Sujet | Fichier |
|---|---|
| Règles de l'agent | `CLAUDE_SURGA.md` (puis `CLAUDE.md` fusionné) |
| Fonctions et périmètre | `CAHIER_DES_CHARGES.md` |
| Ordre de travail et statuts | `PLAN.md` |
| Visuel | `DESIGN.md` |
| État réel du dépôt | `AUDIT.md` |
| Décisions déjà prises | `DECISIONS.md` |

En cas de contradiction : règles, `CLAUDE_SURGA.md` ; fonctions, cahier des charges ; état du
dépôt, `AUDIT.md`.

## Tenir les documents à jour
- Les statuts des tâches ne changent que dans `PLAN.md`.
- Toute décision tranchée est notée dans `DECISIONS.md` avec sa date et sa raison.
- Chaque tranche livrée ajoute une entrée en haut de `JOURNAL-LIVRAISONS.md`.
- Un incident ajoute une entrée dans `LECONS_APPRISES.md`.
- `CLAUDE_SURGA.md` reste court : les explications détaillées vont dans les autres fichiers.

