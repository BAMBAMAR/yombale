# Refonte visuelle du bloc SEO homepage

## Contexte

Le bloc SEO en bas de la homepage (`Le comparateur de prix N°1 au Sénégal`) existe pour le
maillage interne et le contenu éditorial (voir chantier SEO site-wide du 11-12 juillet 2026).
Il fonctionnait mais était visuellement plat : un `<div>` bordé générique, du texte brut en
2 colonnes, et deux rangées de liens simplement soulignés — sans lien avec l'identité visuelle
"ticket" du reste de la homepage (cartes perforées, badges, hover à liseré accent). L'utilisateur
l'a jugé "pas vivant ni attirant" et a demandé une refonte.

Objectif : rendre ce bloc cohérent avec le langage visuel déjà établi ailleurs sur la page,
sans changer son rôle (texte éditorial + maillage interne SEO), sans ajouter de complexité
disproportionnée pour un bloc qui reste en bas de page.

## Design validé

Maquette de référence (approuvée) : voir l'artifact publié pendant le brainstorming
(perforation en haut de carte façon ticket, titre + badge centrés, texte en 2 colonnes avec
icône, catégories principales en chips pleine largeur, recherches longue traîne en chips
discrètes, ligne de pied avec point de statut).

### Structure

1. **Carte** : reprend le motif de perforation déjà utilisé sur `.card-produit--ticket`
   (`::before` avec `radial-gradient` répété, pas de `border-dashed`).
2. **En-tête centré** : `<h2>` titre + badge "tag" (`6800+ produits · maj / 6h`) centrés en
   colonne, avec un `gap` entre les deux (pas de ligne pointillée décorative superflue).
3. **Texte (2 colonnes)** : structure déjà en place réutilisée telle quelle (grid 2 colonnes,
   1 paragraphe par colonne, équilibrée) — chaque paragraphe précédé d'une icône emoji dans un
   badge rond (📊 comparateur, 📍 couverture géographique), même famille visuelle que
   `.home-how-icon`.
4. **Chips catégories** (`Comparer par catégorie`) : les 7 liens de catégories principales
   (`CATEGORIES.filter(c => c.slug !== 'telecom')`) deviennent des chips avec icône emoji +
   libellé court (pas de suffixe "au Sénégal" répété sur chaque chip — le badge/contexte de la
   carte porte déjà cette info), fond blanc, bordure `var(--border)`, hover = liseré accent
   inset + léger `translateY`, cohérent avec le hover déjà utilisé sur les cartes du site.
5. **Chips longue traîne** (`Recherches populaires à Dakar`) : les 8 liens existants
   (climatiseur, iPhone, Samsung, TV, frigo, ordinateur portable, location appartement, chambre
   à louer), même traitement chip mais variante `small` (fond `var(--bg)`, texte plus discret)
   pour ne pas rivaliser visuellement avec les chips catégories.
6. **Pied de carte** : ligne de réassurance discrète (point vert + texte sur la fraîcheur des
   prix), séparée par une bordure fine en pointillé.

### Contenu

Le texte éditorial (2 paragraphes) et la liste des liens (catégories + longue traîne) restent
strictement identiques à l'existant — c'est une refonte visuelle, pas une réécriture SEO. Seul
changement de libellé : les chips catégories affichent le nom court (`c.label`) sans le suffixe
répété "au Sénégal" pour éviter la redondance visuelle en chip (le H2 de la carte porte déjà
"au Sénégal"). Les liens longue traîne gardent leur libellé complet actuel (ils contiennent déjà
"Dakar" et sont plus spécifiques).

### Icônes par thème (chips catégories, mapping fixe)

| Catégorie (`slug`) | Icône |
|---|---|
| smartphones (Téléphones) | 📱 |
| informatique | 💻 |
| tv-electro | 📺 |
| mode | 👕 |
| maison | 🏠 |
| auto-moto | 🚗 |
| jeux | 🎮 |

Si `CATEGORIES` contient un slug non listé ici, fallback sur une icône générique (🛍️) plutôt que
de planter — le tableau est correctif visuel, jamais bloquant.

### Icônes par thème (chips longue traîne, mapping fixe par `href`)

Reprend le mapping déjà illustré dans la maquette : ❄️ climatiseur, 📱 iPhone/Samsung, 📺 TV,
🧊 frigo, 💻 ordinateur portable, 🏢 location appartement, 🛏️ chambre à louer.

## Fichiers concernés

- `frontend-next/src/app/page.tsx` — structure JSX du bloc `{/* ── Bloc SEO ── */}`
  (lignes ~437-486 avant refonte).
- `frontend-next/src/app/globals.css` — nouvelles classes `.seo-*`/`.chip*` ajoutées à la suite
  du bloc `.home-seo-cols` existant (section "Bloc SEO homepage" déjà présente vers la ligne
  8069). `.home-seo-cols` reste utilisée telle quelle pour la grille de texte 2 colonnes.

Aucun changement backend, aucune nouvelle dépendance (les icônes restent des emoji Unicode,
cohérent avec le reste du site qui n'a pas de librairie d'icônes SVG).

## Hors scope

- Pas de changement du contenu éditorial ni de la liste de catégories/liens.
- Pas de changement des autres sections de la homepage.
- Pas d'animation/transition au-delà du hover déjà standard sur le site (`transform`,
  `box-shadow`).

## Vérification

- `npx tsc --noEmit` dans `frontend-next/` sans erreur.
- Rendu visuel en dev (`npm run dev` sur le port 3001) : carte perforée visible, en-tête centré,
  chips cliquables avec hover cohérent, comportement responsive à ≤900px (les 2 colonnes de
  texte repassent en 1 colonne — comportement déjà en place à conserver).
- Vérifier que tous les `href` existants (catégories + longue traîne) sont préservés à
  l'identique (aucune URL ne doit changer).
