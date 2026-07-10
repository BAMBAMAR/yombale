# Tri et filtres sur les pages guide — design

Date : 2026-07-10

## Contexte

Le site a 4 pages "guide" à résultats (`guide-prix`, `guide-achat`, `guide-immo`, `guide-forfait`). Un audit a montré que `guide-achat`, `guide-immo` et `guide-forfait` ont déjà un système de tri (boutons Score/Prix/Dispo-Surface-Data) et des filtres riches dans un panneau gauche (budget, catégorie/type, sliders de pondération). `guide-prix` n'a qu'un filtre par catégorie et aucun tri sur sa liste de résultats — c'est le vrai trou fonctionnel.

Périmètre validé avec l'utilisateur : combler ce trou sur `guide-prix`, et ajouter des filtres/tri ciblés sur `guide-achat` et `guide-immo` là où la donnée backend le permet réellement. `guide-forfait` n'est pas touché (pas de champ date fiable, et un tri "plus récent" n'a pas de sens pour un catalogue de forfaits opérateur).

## 1. guide-prix (`frontend-next/src/app/guide-prix/GuidePrixContent.tsx`)

### Tri
Ajouter une rangée de pills de tri au-dessus de la liste de résultats (`.guide-prix-liste`), même pattern visuel que `.guide-tri-btns`/`.guide-tri-btn` déjà utilisé sur les 3 autres guides :
- **Pertinence** (défaut — ordre renvoyé par l'API, non trié côté client)
- **Prix croissant** (`prix_min` asc)
- **Prix décroissant** (`prix_min` desc)
- **Plus d'offres** (`nb_offres` desc)

Implémentation : nouvel état `triPar` (`'pertinence' | 'prix_asc' | 'prix_desc' | 'nb_offres'`), tri appliqué côté client sur `results` avant le rendu (`sorted = [...results].sort(...)`), comme `guide-achat`/`guide-immo`/`guide-forfait` le font déjà. Le tri "Pertinence" ne trie pas (retourne le tableau tel quel).

### Filtre prix
Ajouter deux champs numériques (Prix min / Prix max, FCFA) à côté des pills de catégorie existantes dans `.guide-prix-cats`. Envoyés en query params `prixMin`/`prixMax` à `GET /api/produits` (déjà supportés par le backend, confirmé par leur usage existant dans `guide-achat`). Si min > max ou champ vide, pas de filtrage forcé (dégradation silencieuse, cohérent avec le style existant du filtre budget des autres guides).

Le filtre prix et les pills de catégorie déclenchent chacun une nouvelle recherche (comme le fait déjà le changement de catégorie).

## 2. guide-achat (`frontend-next/src/app/guide-achat/GuideAchatContent.tsx`)

### Filtre État (neuf/occasion/reconditionné)
Nouveau champ select dans le panneau gauche (`.guide-left`), à côté ou sous le champ Catégorie : "Neuf", "Occasion", "Reconditionné", "Tous" (défaut).

**Changement backend requis** : `GET /api/produits` (`backend/routes/produits.js`, SELECT ligne ~115-119) n'agrège aujourd'hui que `prix_min`/`prix_max`/`nb_offres` depuis `offres` — pas de donnée `etat`. Étendre le SELECT pour agréger les états distincts des offres de chaque produit :

```sql
jsonb_agg(DISTINCT o.specs->>'etat') FILTER (WHERE o.specs->>'etat' IS NOT NULL) AS etats
```

Ajouter un paramètre `etat` optionnel à la route, filtrant en SQL (`HAVING` ou sous-requête `EXISTS` sur `offres.specs->>'etat' = $etat`) pour éviter du N+1 côté frontend. Un produit sans aucune offre avec état renseigné (specs non extraites) reste visible si le filtre est "Tous", et est exclu si un état spécifique est sélectionné.

### Filtre disponibilité minimum
Nouveau champ numérique "Disponible chez au moins N marchands" dans le panneau gauche. Filtrage **côté client** sur le champ déjà présent `nb_offres` (pas de changement backend nécessaire) : `results.filter(p => p.nb_offres >= dispoMin)`, appliqué avant le tri existant.

### Pas de tri "plus récent"
Confirmé abandonné — `produits` n'a pas de colonne `created_at` fiable/utilisée dans le code actuel. Les tris existants (Score/Prix/Dispo) sont conservés tels quels.

## 3. guide-immo (`frontend-next/src/app/guide-immo/GuideImmoContent.tsx`)

### Tri "Plus récent"
Ajouter un 4ᵉ bouton de tri à `.guide-tri-btns` (actuellement `score`/`prix`/`surface`) : **"🆕 Récent"**, triant sur `created_at` décroissant.

`annonces_immo.created_at` existe et est déjà exploité côté backend (`backend/routes/immo.js`, `ORDER_MAP.recent = 'created_at DESC'`, tri par défaut). Ajouter `created_at` à l'interface `AnnonceImmo` du frontend (actuellement non mappé dans ce fichier) et l'inclure dans le tri client `sorted` aux côtés de `score`/`prix`/`surface` :

```ts
const [triPar, setTriPar] = useState<'score' | 'prix' | 'surface' | 'recent'>('score')
// ...
if (triPar === 'recent') return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
```

## 4. guide-forfait

Aucun changement (confirmé avec l'utilisateur — pas de champ date fiable sur `forfaits_telecom`, et le concept ne s'applique pas à un catalogue de forfaits opérateur).

## Hors-scope

- Pas de nouvelle colonne `created_at` sur `produits`/`forfaits_telecom`.
- Pas de refonte visuelle des composants de tri/filtre existants — réutilisation stricte des classes CSS `.guide-tri-btn`/`.budget-pill`/`.guide-field`/`.guide-select`/`.guide-input` déjà en place.
- Pas de persistance des nouveaux filtres dans l'URL sur `guide-prix` (les 3 autres guides synchronisent leurs filtres dans l'URL via `router.push` — hors-scope ici sauf si ça s'avère trivial à l'implémentation, mais pas un requis).

## Tests / vérification

Vérification manuelle en navigateur (convention du projet pour les changements UI) :
- `guide-prix` : rechercher un produit, tester chaque option de tri, tester le filtre prix min/max.
- `guide-achat` : tester le filtre État (nécessite des offres avec `specs.etat` peuplé en base — déjà le cas pour une partie des 6100+ offres backfillées), tester le filtre disponibilité minimum.
- `guide-immo` : tester le tri "Récent", vérifier l'ordre correspond à la date de création réelle.
