# Comparaison « zéro rejet » — filtrage automatique par groupe de produit

**Date** : 13 juillet 2026
**Statut** : validé par l'utilisateur

## Problème

La comparaison Next.js (`CardActions.tsx` / `CompareBar.tsx` / `/comparaison`) n'a aucun contrôle
de type : on peut comparer un écouteur et un frigo. Le SPA legacy (`frontend/app.js`) avait ce
contrôle (`comparerCat` + filtre auto de la liste, `toggleComparer` l. 4753) — il n'a jamais été
porté vers Next.js.

Exigence utilisateur : **jamais de rejet après clic**. Au lieu de bloquer les sélections
incompatibles, filtrer automatiquement la liste dès le premier ajout pour que tout ce qui est
visible soit sélectionnable (« recherche automatique » déclenchée par la sélection).

## Décisions validées

1. **Périmètre : produits uniquement.** Immo/télécom gardent leur comparaison séparée actuelle.
2. **Comportement : liste filtrée + bandeau explicatif** (pas de grisage des cartes incompatibles
   dans la liste produits — elles disparaissent).
3. **Mécanisme : détection du type par mots-clés + dictionnaire de synonymes** (`sousType`
   backend), pas une recherche sur les mots bruts du nom — « AirPods Pro 2 » doit faire remonter
   les Galaxy Buds et casques Bluetooth, pas seulement d'autres AirPods.

## Conception

### 1. Inférence du groupe — `frontend-next/src/lib/infererGroupe.ts` (nouveau)

Portage de `_inferCat()` du legacy (`frontend/app.js` l. 727-766). Entrée : nom du produit.
Sortie : clé de groupe alignée sur `SOUS_TYPE_MOTS` backend, ou `''` si indétectable.

Groupes : `audio`, `tv`, `froid`, `clim`, `electro`, `tablette`, `smartphones`, `ordinateurs`,
`maison`, `mode`, `auto-moto`, `jeux`.

L'**ordre des tests est significatif** (repris du legacy) : audio et tv avant smartphones
(« Galaxy Buds », « Samsung TV » sinon classés téléphone), tablette avant smartphones
(« Galaxy Tab »), froid/clim avant electro. Normalisation NFD + minuscules avant les regex.

Replis en cascade quand aucun groupe n'est détecté :
- repli 1 : la catégorie DB du produit (le champ `categorie` déjà présent sur les cartes) ;
- repli 2 : aucun filtre — la comparaison reste permissive, jamais de blocage.

### 2. Backend — extension additive de `SOUS_TYPE_MOTS`

`backend/routes/produits.js` (l. 36-48) : ajouter 5 clés manquantes, sur le modèle existant :

- `smartphones` : iphone, samsung galaxy, tecno, infinix, itel, redmi, xiaomi, oppo, realme,
  vivo, huawei, nokia, oneplus, pixel, smartphone, telephone portable…
- `maison` : canape, chaise, matelas, lit, armoire, meuble, table basse, commode…
- `mode` : robe, chaussure, sac a main, chemise, pantalon, sneaker, basket, parfum…
- `auto-moto` : voiture, moto, scooter, trottinette, piece auto, batterie voiture…
- `jeux` : playstation, ps4, ps5, xbox, nintendo, manette, jeu video, gaming…

Aucun autre changement backend : le paramètre `sousType` et sa validation existent déjà.
`infererGroupe` (frontend) et `SOUS_TYPE_MOTS` (backend) doivent rester alignés sur les clés.

### 3. Déclenchement dans `CardActions.tsx`

Au **premier ajout** (`toggleCompare`, liste vide → 1 élément) :
- inférer le groupe depuis `nom` (la prop existe déjà) avec repli catégorie DB — la carte devra
  transmettre `categorie` en prop optionnelle ;
- stocker le groupe dans `nopalou_compare` (nouvelle forme : `{ items: [...], groupe, groupeLabel,
  premierNom }` ou champ par entrée — au choix du plan, en gardant la rétrocompatibilité de
  lecture avec l'ancien tableau brut) ;
- pousser `?sousType=<groupe>` dans l'URL via `router.push` (en préservant les autres
  paramètres, en réinitialisant `page`) — uniquement si la page courante est une liste produits
  (accueil, catégorie). Si l'ajout vient d'une fiche produit, seul le storage est mis à jour ;
  c'est le bandeau (§4) qui synchronise le filtre à l'arrivée sur une liste : monté sur une page
  liste avec une comparaison active dont le groupe manque à l'URL, il pousse le paramètre.

Aux ajouts suivants : pas de re-poussée d'URL (le filtre est déjà en place). Au retrait du
dernier élément ou au « Vider » (`CompareBar.tsx`) : retirer `sousType` de l'URL et le groupe du
storage.

### 4. Bandeau « Comparaison active »

Composant client affiché au-dessus des listes produits quand `nopalou_compare` est non vide :

> ⚖ Comparaison active — affichage limité aux **écouteurs** (similaires à « AirPods Pro 2 »)
> [✕ Vider]

Libellés français des groupes (écouteurs & audio, téléviseurs, réfrigérateurs, climatiseurs,
électroménager, tablettes, smartphones, ordinateurs, maison, mode, auto-moto, jeux & consoles)
dans une map partagée avec `infererGroupe.ts`. « Vider » réutilise la logique de `CompareBar`
(clear storage + event `nopalou:compare` + retrait du paramètre d'URL).

### 5. Zéro rejet sur les autres surfaces

- **Cartes immo / télécom / annonces** : quand une comparaison **produit** est active, leur
  bouton ⚖ est rendu désactivé (grisé + `title` explicatif « Comparaison produits en cours —
  videz-la d'abord ») au lieu d'autoriser un mélange de types. L'inverse (comparaison immo ou
  télécom en cours, bouton ⚖ des produits) n'est **pas** modifié — hors périmètre validé.
- **Fiche produit atteinte par lien direct** avec un produit d'un autre groupe que la comparaison
  en cours : même traitement — bouton ⚖ désactivé avec explication, jamais de toast d'erreur
  après clic.

### 6. Pages qui appliquent le filtre

- Accueil `/` (liste produits) et pages catégorie : transmettre `searchParams.sousType` à l'appel
  `GET /api/produits` (le backend le gère déjà).
- La recherche `?q=` reste combinable avec le filtre (chercher « Sony » dans les écouteurs).
- `/categorie/[slug]/[sousCategorie]` (landing pages SEO) n'est pas concernée — URLs statiques.

## Hors périmètre

- Contrôle symétrique quand la comparaison active est immo/télécom (les boutons produits restent
  tels quels).
- Garde côté serveur sur `/comparaison` (rejet d'IDs de groupes différents) — l'UX empêche déjà
  le mélange ; à envisager plus tard si des URLs forgées posent problème.
- Tri « les plus proches d'abord » dans la liste filtrée (option « les deux combinés » écartée).

## Critères de succès

1. Sélectionner « AirPods Pro 2 » sur l'accueil → la liste ne montre plus que des produits
   audio (toutes marques), avec le bandeau explicatif.
2. Aucun clic de l'utilisateur ne produit de rejet « type incompatible » : tout ⚖ cliquable
   aboutit, tout ⚖ non pertinent est visiblement désactivé avec explication.
3. Vider la comparaison restaure la liste complète (paramètre d'URL retiré).
4. La pagination et le compteur de résultats restent justes (filtre serveur, pas masquage client).
5. Un produit au nom inclassable ne bloque rien : repli catégorie DB, sinon aucun filtre.
