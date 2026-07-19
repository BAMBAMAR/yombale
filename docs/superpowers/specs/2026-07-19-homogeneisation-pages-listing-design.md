# Homogénéisation en-tête / filtres / bloc SEO des pages à résultats — Design

Date : 2026-07-19

## Contexte

Retour utilisateur direct, avec captures d'écran à l'appui : les pages du site n'ont pas de style homogène — en-têtes, zones de filtres et blocs de texte de fin de page divergent fortement selon la page. Chaque page a été construite dans un chantier séparé (SEO le 11-12 juillet, tri/filtres guides le 10 juillet, etc.) sans composant partagé, donc chacune a réinventé son propre pattern.

Audit du code confirmant le constat visuel :

| Page | Classe de pill | Structure d'en-tête | Bloc SEO fin de page |
|---|---|---|---|
| `categorie/[slug]` | `.budget-pill` / `.filtres-bar` | Fil d'Ariane + H1 + intro longue + compteur | Oui, `<div maxWidth:720>` improvisé |
| `immo` | `.budget-pill` dans `.immo-filtres-row` (9 lignes empilées) | `.immo-header` : titre/sous-titre + wizard bouton à droite, pas de fil d'Ariane | Aucun |
| `telecom` | `.budget-pill` dans `.filtres-group` | `.telecom-header` : titre/sous-titre + compteur + wizard bouton à droite, pas de fil d'Ariane | Aucun |
| `annonces` | `.annonces-cat-pill` (classe entièrement différente) | `.annonces-header` : titre/sous-titre + CTA Publier, pas de fil d'Ariane, + formulaire recherche texte | Aucun |
| `guide-prix`/`guide-achat`/`guide-immo`/`guide-forfait` | Outils interactifs : profils pills + curseurs de pondération + panneau de filtres propre à chaque guide | `.guide-*-hero` propre à chaque guide | Aucun |

Le footer global (`layout.tsx`) est déjà unique et cohérent — hors périmètre.

Le bloc `.seo-card` de la page d'accueil (perforation façon ticket, 2 colonnes de texte lisibles, chips catégories/recherches) est déjà le meilleur standard visuel du site pour ce type de contenu (chantier du 12 juillet) — il sert de référence à généraliser plutôt que réinventer un nouveau pattern.

## Objectif

Un seul standard visuel partagé pour l'en-tête, la barre de filtres et le bloc SEO de fin de page, appliqué à 8 pages (4 listings simples + 4 guides interactifs), sur le modèle des grands sites marketplace (Amazon, Jumia, Leboncoin) :
- Fil d'Ariane systématique
- Titre + compteur courts, filtres immédiatement en dessous (pas de gros pavé de texte qui repousse les filtres)
- Barre de filtres compacte : essentiels visibles, secondaires repliés derrière « Plus de filtres »
- Tri toujours à la même place (fin de barre)
- Bloc éditorial/SEO toujours en tout dernier, après les résultats, jamais entre le titre et les filtres

Le reste du site (boutiques, compte, admin, pages statiques) est explicitement hors périmètre de ce chantier — un audit séparé sera produit ensuite pour prioriser la suite (voir section Hors-scope).

## Périmètre

### Groupe A — Pages de listing simple (SSR, filtres = query params d'URL)
`categorie/[slug]/page.tsx`, `immo/page.tsx`, `telecom/TelecomClient.tsx` (+ `telecom/page.tsx`), `annonces/page.tsx`

### Groupe B — Pages guides (outils interactifs client-side, filtres = state React + profils pré-réglés + curseurs de pondération)
`guide-prix/GuidePrixContent.tsx`, `guide-achat/GuideAchatContent.tsx`, `guide-immo/GuideImmoContent.tsx`, `guide-forfait/GuideForfaitContent.tsx`

Les deux groupes partagent le même standard visuel (en-tête, style des pills, bloc SEO) mais gardent leur mécanique de filtrage propre — SSR par URL pour le groupe A, state client + scoring pondéré pour le groupe B. Aucune page ne change de mécanique de filtrage, seulement d'habillage et de structure.

## Design

### 1. Composant partagé `PageHeader` (nouveau, `frontend-next/src/components/PageHeader.tsx`)

Structure commune à toutes les pages du périmètre :

```
Accueil › Catégorie                              ← fil d'Ariane, toujours présent
📱 Titre de la page              [CTA optionnel]  ← H1 (+ emoji) + action principale à droite
659 résultats · [complément optionnel]            ← ligne de compteur courte
```

Props : `breadcrumb: {label, href}[]`, `emoji?: string`, `titre: string | ReactNode`, `compteur?: string`, `cta?: {label, href}`.

Le paragraphe d'intro éditorial actuellement présent en haut de `categorie/[slug]` (`cat.intro`) est retiré de cet emplacement — son contenu descend dans le bloc SEO de fin de page (section 3), pour ne pas repousser les filtres sous la ligne de flottaison.

### 2. Composant partagé `FiltresBar` (nouveau, `frontend-next/src/components/FiltresBar.tsx`) + classe CSS unique `.filter-pill`

- Une seule classe de pill (`.filter-pill`, état actif `.filter-pill--active`) remplace `.budget-pill`, `.immo-filtres-row` / pills embarquées, `.filtres-group` / pills embarquées, et `.annonces-cat-pill`. Même apparence, même comportement hover/focus partout.
- Rangée horizontale, `overflow-x: auto` sur mobile (scroll tactile), `flex-wrap: wrap` sur desktop.
- **Filtres essentiels** toujours visibles (définis par page, voir tableau ci-dessous) + **Trier par** toujours en dernière position de la barre.
- **Filtres secondaires** regroupés derrière un bouton `⚙ Plus de filtres` (badge avec le nombre de filtres secondaires actifs si > 0) qui ouvre un panneau/drawer contenant les filtres restants.

Répartition essentiels / secondaires par page (Groupe A) :

| Page | Essentiels (barre) | Secondaires (« Plus de filtres ») |
|---|---|---|
| `categorie/[slug]` | Budget, Trier | Sous-type (déjà piloté par ⚖ comparaison, pas de changement) |
| `immo` | Transaction, Type de bien, Budget, Ville, Trier | Quartier, Surface min, Pièces, Chambres, Meublé |
| `telecom` | Opérateur, Type, Trier | *(déjà minimal — rien à replier)* |
| `annonces` | Catégorie, Budget max, Trier | Ville, Origine |

Le champ de recherche texte libre d'`annonces` reste au-dessus de cette barre, tel quel (fonction différente d'un filtre, pattern standard e-commerce : search bar séparée des filtres).

Pour le Groupe B (guides), la même classe `.filter-pill` habille :
- Les boutons « profil » pré-réglés (déjà l'équivalent visuel de pills)
- Les pills de catégorie/type/opérateur/ville existantes
- Le tri simple

Les curseurs de pondération manuelle (importance prix/specs/dispo/surface/data/etc.) et leurs labels (`POIDS_LABELS`) sont **conservés tels quels**, à l'intérieur d'un panneau « Réglage avancé » réutilisant le même style de carte que « Plus de filtres » du Groupe A, pour rester visuellement cohérent sans perdre la fonctionnalité de pondération fine (différenciante par rapport aux standards du marché, gardée par choix explicite de l'utilisateur).

### 3. Bloc SEO de fin de page — généraliser `.seo-card`

- Réutilisation telle quelle de la carte `.seo-card` existante (perforation façon ticket, `seo-head`/`seo-tag`, `seo-blurb`/`seo-icon`, `chip-row`/`chip`, `seo-foot`) au lieu du `<div style={{maxWidth:720}}>` codé en dur sur `categorie/[slug]`.
- La carte occupe la largeur du conteneur de page (1200px, cohérent avec `--max-w`), mais le texte à l'intérieur reste contraint en largeur de lecture via `.home-seo-cols` (grille 2 colonnes desktop, ~580px chacune, empilé en 1 colonne sous 900px) — répond à la préférence exprimée : largeur de lecture, pas pleine largeur du texte lui-même.
- Ajouté sur `immo`, `telecom`, `annonces` et les 4 guides, qui n'en ont aujourd'hui aucun (gain SEO cohérent avec le chantier du 12 juillet — maillage interne, contenu unique par page).
- Contenu de chaque bloc : texte court réutilisant ce qui existe déjà par page quand disponible (ex. `cat.intro`/`cat.contenu` pour `categorie`), sinon un texte minimal à rédiger par page (pas de génération dynamique de contenu — texte statique en dur comme le reste du site).

### 4. CSS à nettoyer

Les classes remplacées (`.immo-filtres-row` définitions de layout, `.filtres-group`, `.annonces-cat-pill` et ses variantes `--active`) sont retirées de `globals.css` une fois toutes les pages migrées, pour éviter d'avoir deux systèmes qui cohabitent indéfiniment. Vérification par grep qu'aucune page ne les référence plus avant suppression.

## Hors-scope (explicite)

- Le style des cartes de résultats elles-mêmes (`card-produit`, `ImmoCard`, `ForfaitCard`, `annonce-pub-card`) — non demandé, gros chantier séparé si un jour souhaité.
- Le footer global — déjà cohérent.
- Toute page hors du périmètre listé (boutiques, compte, admin, pages statiques comme CGU/mentions légales, assistant-whatsapp, guide-emploi).
- La mécanique de scoring/pondération des guides — habillage visuel uniquement, logique inchangée.

## Livrable complémentaire : audit global du reste du site

Une fois ce chantier livré (8 pages), un document d'audit séparé (pas de spec d'implémentation immédiate) sera produit pour le reste du site : `boutiques/`, `compte/*`, `admin/*`, pages statiques — avec, pour chaque page/section, l'écart constaté au standard désormais établi par ce chantier et une proposition de priorisation. Ce document servira de base pour décider des chantiers suivants un par un, plutôt que de tenter une refonte totale en une fois.

## Vérification

Comme pour les chantiers précédents sur ce projet, aucun outil de navigateur automatisé n'est disponible dans cet environnement. Vérification prévue :
- `npx tsc --noEmit` propre après chaque page migrée.
- Lecture de diff systématique (`git diff --stat`) pour repérer toute suppression massive inattendue (piège Unicode déjà documenté avec les modèles haiku sur ce projet).
- Vérification manuelle recommandée par l'utilisateur après déploiement : parcourir les 8 pages, tester « Plus de filtres » sur `immo`/`annonces`, confirmer que le panneau de pondération des guides fonctionne toujours identiquement.
