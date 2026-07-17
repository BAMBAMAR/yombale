# Boutique : responsive mobile, multi-photos et variantes produit

Date : 17 juillet 2026

## Contexte

Trois problèmes remontés par l'utilisateur avec captures d'écran mobile à l'appui :

1. Les pages de gestion de boutique (`/boutique`) ne sont pas adaptées au mobile — la vue "Gérer la boutique" (sidebar + contenu) et les formulaires (créer boutique, ajouter produit) s'affichent écrasés/tronqués sur téléphone.
2. Impossible d'ajouter plusieurs photos à un produit du catalogue (un seul champ fichier dans le formulaire, un seul fichier accepté côté backend), alors qu'un vendeur veut souvent montrer un produit sous plusieurs angles — comme sur AliExpress.
3. Impossible d'ajouter des variantes (couleur, taille…) à un produit du catalogue — toujours en référence à AliExpress, où chaque produit peut avoir des options sélectionnables par l'acheteur.

Tout le code concerné vit dans `frontend-next/src/app/boutique/` (gestion vendeur), `frontend-next/src/app/boutiques/[id]/produits/[produitId]/` (fiche produit publique), et `backend/routes/boutiques.js` + `backend/migrate-inline.js` côté serveur. La table `boutique_produits` a déjà une colonne `images TEXT[]` (tableau, prête pour plusieurs photos) mais le formulaire et la route backend (`upload.single('image')`) ne permettent qu'un seul fichier — c'est uniquement une limitation du formulaire/de la route, pas du schéma.

## Périmètre

Dans le périmètre :
- Rendre responsive toute la zone "Ma boutique" : liste des boutiques, formulaire boutique (création/édition), formulaire produit (ajout/édition), et la vue "Gérer la boutique" (sidebar + les 6 onglets Catalogue/Commandes/Comptabilité/Analytics/Paramètres/Marketing).
- Support de 5 photos par produit du catalogue boutique (max), au lieu d'une seule.
- Variantes simples (options + valeurs, ex: Couleur: Rouge/Bleu, Taille: S/M/L) sur un produit du catalogue boutique, optionnelles, avec un seul prix et un seul stock pour tout le produit (pas de prix/stock par combinaison).
- Sélection de variante côté acheteur sur la fiche produit publique, obligatoire avant de pouvoir commander si le produit a des variantes ; la sélection est reportée dans le champ "Note / précisions" déjà existant du formulaire de commande.

Hors périmètre (explicitement écarté) :
- Prix ou stock différent par combinaison de variante (mode "avancé" AliExpress complet) — écarté par l'utilisateur au profit de la version simple.
- Toute autre page du site en dehors de `/boutique` et de la fiche produit boutique publique (le reste du site n'a pas été signalé comme cassé sur mobile).
- Changement du schéma de `commandes_boutique` — la variante sélectionnée passe par le champ texte `note` existant, pas par une nouvelle colonne structurée.

## Design

### 1. Responsive mobile de "Ma boutique"

**Cause racine** : tout `BoutiqueClient.tsx` est stylé en `style={{...}}` inline (pas de classes CSS), avec des largeurs fixes (`aside` sidebar 220px, conteneurs `maxWidth: 860/1100`) et des grilles `gridTemplateColumns: '1fr 1fr'` non responsives. Le style inline ne peut pas répondre à un media query CSS — d'où l'écrasement sur petit écran visible dans les captures.

**Approche** : remplacer les styles inline concernés par des classes dans `globals.css`, avec un breakpoint mobile cohérent avec le reste du site (~640px, déjà utilisé ailleurs d'après l'historique du projet — ex. grille produits 2 colonnes, `.auth-page`).

- **Vue "Gérer la boutique" (`BoutiqueManage`)** : la sidebar verticale à gauche (220px, nav en colonne) devient sous 640px une barre d'onglets horizontale scrollable en haut (icône + libellé court), sur le modèle des pills déjà utilisées ailleurs sur le site (`.guide-tri-btns`). Le contenu principal passe en pleine largeur en dessous. Le bloc "header boutique + Retour" en haut de la sidebar reste visible au-dessus de la barre d'onglets sur mobile.
- **Formulaires (`BoutiqueForm`, `ProduitForm`, `CommanderModal` si besoin)** : toutes les grilles `1fr 1fr` passent à 1 colonne sous 640px.
- **Vue liste des boutiques et cartes (`BoutiqueCard`)** : les paddings/marges larges (`padding: '20px 24px'`, `gap: 16`) sont réduits sur mobile ; les boutons d'action (Gérer/Modifier/Voir/Sponsoriser/Payer/Supprimer) qui débordaient passent en `flex-wrap` déjà en place mais avec des tailles de police/paddings réduits pour tenir sur un écran étroit.
- **Catalogue produits (liste + carte produit)** : la ligne produit (image + infos + actions) passe en layout empilé sous 640px si nécessaire (image en haut, infos, puis actions en bas) plutôt que tout sur une ligne.

Aucun changement de comportement fonctionnel — uniquement CSS/layout. Le changement se fait fichier par fichier en extrayant les styles inline vers des classNames pour permettre les media queries, sans réécrire la logique React.

### 2. Multi-photos (jusqu'à 5) sur un produit du catalogue

**Backend** (`backend/routes/boutiques.js`) :
- `POST /:id/produits` et `PUT /:id/produits/:prodId` : `upload.single('image')` → `upload.array('photos', 5)`, aligné sur le pattern déjà utilisé dans `backend/routes/annonces.js` (`upload.array('photos', 5)`).
- Toutes les images uploadées sont envoyées à Cloudinary (boucle sur `req.files`) et stockées dans `boutique_produits.images` (déjà `TEXT[]`, aucune migration nécessaire).
- En édition (`PUT`) : si de nouvelles photos sont envoyées, elles remplacent le tableau existant (comportement actuel conservé — pas d'ajout incrémental) ; si aucune nouvelle photo n'est envoyée, les images existantes sont conservées telles quelles.
- Le champ de formulaire attendu passe de `image` à `photos` (multiple), cohérent avec `deposer-annonce`.

**Frontend** (`ProduitForm` dans `BoutiqueClient.tsx`) :
- Le champ `<input type="file" name="image">` unique est remplacé par le même pattern dropzone déjà implémenté dans `frontend-next/src/app/(account)/deposer-annonce/FormulaireAnnonce.tsx` (état `photos: File[]` + `previews: string[]`, zone cliquable "Cliquez pour ajouter des photos", max 5 photos/5 Mo chacune, grille de miniatures avec bouton ✕ pour retirer chacune avant envoi).
- En édition, les images déjà enregistrées (`produit.images`) sont affichées en premier dans la grille de miniatures, avec la possibilité de les retirer (ce qui déclenchera un remplacement du tableau à l'enregistrement, cf. comportement backend ci-dessus) ; ajouter de nouvelles photos les combine avec celles conservées jusqu'à la limite de 5.

### 3. Variantes simples (options + valeurs)

**Schéma** : nouvelle colonne `boutique_produits.variantes JSONB DEFAULT '[]'` (migration additive dans `migrate-inline.js`, même pattern que `caracteristiques`). Forme :
```json
[
  { "nom": "Couleur", "valeurs": ["Rouge", "Bleu", "Vert"] },
  { "nom": "Taille",  "valeurs": ["S", "M", "L"] }
]
```
Pas de prix ni de stock par valeur — le produit garde un seul `prix` et un seul `stock_quantite` pour l'ensemble.

**Backend** : `POST`/`PUT /:id/produits` acceptent un champ `variantes` (JSON stringifié, même traitement que `caracteristiques` aujourd'hui — `JSON.parse` avec repli sur `[]` si absent/invalide) et l'écrivent dans la nouvelle colonne. `GET .../produits` et `GET .../produits/:id` (fiche publique) renvoient `variantes` dans la réponse.

**Formulaire vendeur (`ProduitForm`)** : nouvelle section optionnelle "Variantes" (visible seulement en mode détaillé, pas en ajout rapide — cohérent avec le traitement actuel de "Description"/"Caractéristiques"/"Prix barré"). Un bouton "+ Ajouter une option" crée une ligne avec :
- un champ texte pour le nom de l'option (ex: "Couleur")
- un champ de saisie de valeurs façon tags : taper une valeur puis Entrée l'ajoute comme puce, chaque puce a un ✕ pour la retirer
- un bouton pour retirer l'option entière

Aucune option n'est créée par défaut ; la section reste vide/masquée tant que le vendeur ne clique pas sur "+ Ajouter une option" (variantes 100% optionnelles).

**Fiche produit publique (`boutiques/[id]/produits/[produitId]/page.tsx` + `ProduitCTA.tsx`)** :
- Si `produit.variantes` est non vide, chaque option s'affiche au-dessus des boutons d'action sous forme d'une rangée de puces sélectionnables (une rangée par option, valeurs en boutons pill, une seule valeur sélectionnable par option — reprend visuellement le style des pills déjà utilisé ailleurs sur le site, ex. `.budget-pill`).
- Aucune valeur n'est présélectionnée par défaut. Le bouton "🛒 Commander sur le site" reste désactivé (même traitement visuel que "Rupture de stock" actuellement) tant qu'une valeur n'a pas été choisie pour chaque option présente. Les boutons WhatsApp/Téléphone restent cliquables sans sélection (canaux hors-site, pas de contrainte à imposer là).
- Une fois toutes les options renseignées, la sélection (ex: "Couleur: Rouge, Taille: M") est passée en prop à `CommanderModal`, qui pré-remplit son champ existant "Note / précisions" avec ce texte au montage (le champ reste éditable par l'acheteur — pas de nouveau champ, pas de changement du payload `POST .../commandes`).

## Erreurs et cas limites

- Produit sans variantes (cas actuel, majorité des produits) : aucun changement visible sur la fiche publique, comportement du bouton Commander inchangé.
- Édition d'un produit avec variantes existantes : le formulaire recharge les options/valeurs depuis `produit.variantes` pour permettre modification.
- Suppression de toutes les photos existantes sans en ajouter de nouvelles en édition : le formulaire empêche la soumission avec un tableau vide (au moins 1 photo requise), cohérent avec l'exigence actuelle qu'un produit ait une image pour la synchronisation catalogue WhatsApp.
- Nom d'option dupliqué ou valeur dupliquée dans une même option : ignoré silencieusement côté saisie (pas d'ajout si la valeur/le nom existe déjà dans la liste), pas d'erreur bloquante.

## Tests / vérification

Pas d'outil d'automatisation navigateur mobile disponible dans cet environnement (cohérent avec les limitations déjà notées dans l'historique du projet). Vérification prévue :
- `npx tsc --noEmit` sur `frontend-next` après chaque tâche (leçon retenue du chantier guides du 10 juillet — ne pas se fier à un simple chargement de page).
- Test manuel recommandé après déploiement : ouvrir `/boutique` sur un vrai téléphone (ou DevTools mode mobile) pour confirmer sidebar → onglets, formulaires en 1 colonne ; ajouter un produit avec 3-5 photos et 2 options de variantes ; vérifier la fiche publique (sélection obligatoire, note pré-remplie) et passer une commande de test.
