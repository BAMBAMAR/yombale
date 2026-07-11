# Design : signature « ticket » + finition typographique — Homepage (maquette de validation)

**Date** : 11 juillet 2026
**Statut** : validé par l'utilisateur (conversation du 11 juillet 2026)
**Branche** : `feat/design-ticket-homepage` — `main` n'est jamais touché avant validation visuelle

## Contexte et objectif

Le CDC v4.0 décrit une identité « ticket de Sandaga » (métaphore du reçu de marché). Les composants
`Ticket`/`PriceTag`/`Badge` existent depuis le chantier Phase 1-6 mais ne sont utilisés nulle part.
L'utilisateur veut une identité visuelle **travaillée et distinctive** — exigence explicite :
« surtout pas de code par défaut, couleur par défaut ou code généré par IA présent dans tous les
sites ; travail fin, police nette, tout doit être affiné ».

Ce chantier applique la signature à la **homepage uniquement**, comme maquette de validation
sur données réelles (localhost:3001). La généralisation aux autres pages est un chantier séparé,
déclenché seulement après validation visuelle par l'utilisateur.

## Décisions validées (avec alternatives rejetées)

| Décision | Choix | Rejeté |
|---|---|---|
| Intensité | **Évolution** : palette actuelle conservée (sable `#F8F5F0`, marine `#1C2B4A`, orange brûlé `#C75B00`, vert prix `#0A5C36`) + signature ticket | Refonte palette CDC (kraft/indigo/ocre) — rebrand trop risqué sur 60+ pages |
| Typo des prix | **Pile monospace système** (0 Ko) : `ui-monospace, 'Cascadia Mono', 'Roboto Mono', Consolas, monospace` | Webfont IBM Plex Mono (+15-20 Ko — contraire à la contrainte low-data < 50 Ko/page du CDC) |
| Inclinaison | **Cartes promo uniquement** (badge -XX%) : le tilt est un signal sémantique « bon plan à saisir » | Toutes les cartes (brouillon × 24) ; aucune carte (signature invisible) |
| Typo titres | **Archivo** (variable, graisses 600-900, légèrement condensée) remplace Sora — voix d'affiche de marché/signalétique | Bricolage Grotesque (moins « marché ») ; garder Sora (pas de différenciation) |

## Spécification

### 1. Typographie

- **`layout.tsx`** : `Sora` → `Archivo` via `next/font/google` (variable, axe `wght` 400-900 ;
  utiliser l'axe `wdth` légèrement condensé si disponible dans next/font, sinon graisse seule).
  Variable CSS : `--font-archivo` remplace `--font-sora`. Net 0 Ko (une police retirée, une ajoutée,
  auto-hébergée — aucune requête Google au runtime).
- **`globals.css`** : nouvelle variable
  `--font-mono: ui-monospace, 'Cascadia Mono', 'Roboto Mono', Consolas, monospace;`
- Tous les sélecteurs qui référencent `--font-sora` migrent vers `--font-archivo`.
- **Affinage Inter (texte courant, conservée)** :
  - `font-feature-settings: 'tnum' 1` (ou `font-variant-numeric: tabular-nums`) sur tous les
    contextes chiffrés : `.prix`, compteurs preuve sociale, nb d'offres, badges -XX%.
  - Interlettrage : `-0.02em` sur les titres ≥ 24px ; `+0.08em` sur les labels majuscules.
  - `text-wrap: balance` sur h1/h2/h3 de la homepage.

### 2. Cartes promo « ticket » (grille homepage)

Dans `ProduitsListe.tsx` : quand la carte affiche le badge promo (condition existante
`p.prix_min && p.prix_max && p.prix_max > p.prix_min * 1.1`), ajouter les classes
`card-produit--ticket` + `tilt-a`/`tilt-b` (alternance par index de carte promo : pair → `tilt-a`
−1°, impair → `tilt-b` +1°).

CSS (`globals.css`) :
- `.card-produit--ticket` : rotation, `transition: transform .25s ease, box-shadow .25s ease`,
  redressement `:hover` (`transform: rotate(0)`) — desktop seulement de fait (pas de hover mobile).
- **Perforation dessinée** : encoches semi-circulaires réelles en haut de carte, via
  `background: radial-gradient(...)` répété de la couleur du fond de page (`var(--bg)`), qui
  « poinçonne » visuellement le papier. Interdit : `border: dashed` (raccourci générique).
- `@media (prefers-reduced-motion: reduce)` : aucune rotation, aucune transition.

### 3. Badge promo « tampon encreur »

Le `.badge-promo` existant (-XX%) évolue :
- rotation −3°, encre orange brûlé existante (`var(--accent)`),
- double bordure légèrement irrégulière via `box-shadow` inset (effet tampon, pas de bordure nette
  parfaite),
- chiffres en `--font-mono` + tabular-nums.

### 4. Micro-finitions (le « affiné »)

- **Ombres 2 couches teintées encre chaude** — jamais de noir pur :
  contact `0 1px 2px rgba(26,22,18,.08)` + ambiance `0 8px 24px rgba(26,22,18,.10)`,
  appliquées de façon cohérente sur toutes les cartes de la grille.
- Bordures hairline uniformisées `1px solid var(--border)` (`#E8DDD2`).
- `:focus-visible` : anneau net `2px solid var(--accent)` + `outline-offset: 2px` (navigation clavier).
- Compteurs preuve sociale (`.home-proof-num`) : Archivo + tabular-nums.
- **Interdits explicites** (anti « design IA par défaut ») : dégradés violet/bleu, ombres floues
  génériques non teintées, `border-radius` > 12px « bulle SaaS », emojis en guise d'icônes ajoutés,
  couleurs hors palette existante.

### 5. Hors périmètre (YAGNI)

- Autres pages (fiche produit, catégorie, comparaison, admin) — chantier de généralisation séparé.
- Les composants React `Ticket`/`PriceTag`/`Badge` ne sont **pas** utilisés sur la grille (des
  classes CSS sont plus légères qu'un wrapper React par carte) ; ils restent disponibles pour les
  pages éditoriales futures. S'ils divergent du CSS final, les aligner fait partie du chantier de
  généralisation, pas de celui-ci.
- Palette CDC kraft/indigo/ocre — décision explicite de ne pas l'appliquer.
- Aucune dépendance npm ajoutée, aucun JS supplémentaire côté client.

## Architecture des changements

| Fichier | Changement | Ampleur |
|---|---|---|
| `frontend-next/src/app/layout.tsx` | Sora → Archivo (`next/font`) | ~6 lignes |
| `frontend-next/src/app/globals.css` | `--font-mono`, `--font-archivo`, `.card-produit--ticket`, perforation, tampon, finitions | ~80-100 lignes |
| `frontend-next/src/app/ProduitsListe.tsx` | Classes conditionnelles ticket/tilt | ~10 lignes |

## Critères de validation

1. `npx tsc --noEmit` : 0 erreur ; `next build` : compile.
2. Homepage sur localhost:3001 : cartes promo inclinées avec perforation visible, cartes normales
   droites, prix alignés verticalement en monospace, titres en Archivo.
3. Poids de page inchangé à ±2 Ko (vérifiable : taille du transfert homepage avant/après).
4. Mobile (viewport étroit) : tilt lisible, pas de débordement horizontal.
5. **Validation finale = jugement visuel de l'utilisateur** sur desktop + mobile. Sans son GO,
   pas de merge, pas de généralisation.

## Risques

- **Rendu monospace variable selon l'appareil** (pile système) — accepté explicitement en
  contrepartie du 0 Ko.
- **Archivo change la voix de tout le site** (partout où `--font-sora` était utilisée) — voulu :
  c'est le passage « police nette » ; la homepage sert de juge.
- Rotation sur cartes : vérifier qu'aucun conteneur parent ne coupe les coins inclinés
  (`overflow: hidden` sur la grille).
