# Simplification de l'ajout de produit — Chantier 2/3 "Marketing boutique"

## Contexte

Deuxième chantier de la série "faciliter le marketing du client boutique" (après le [Chantier 1 — fiabilisation du catalogue Meta/WhatsApp](2026-07-07-catalogue-meta-fiabilisation-design.md)). L'idée de départ de l'utilisateur : l'ajout de produit devrait pouvoir se limiter à une photo et un type de produit, avec le reste rempli automatiquement par défaut (mais modifiable), pour réduire la friction de publication.

Un audit du code (`ProduitForm` dans `frontend-next/src/app/boutique/BoutiqueClient.tsx:408-537`, et les routes `POST`/`PUT /:id/produits` dans `backend/routes/boutiques.js`) a établi que le formulaire actuel est déjà relativement permissif côté serveur : seul le champ `nom` est strictement requis (`if (!nom?.trim()) return res.status(400)...`, `boutiques.js:267`) — prix, photo, catégorie, description et caractéristiques par catégorie sont déjà optionnels. Le point de friction réel n'est donc pas une validation serveur trop stricte, mais l'expérience du formulaire complet lui-même : un vendeur pressé doit remplir un champ nom obligatoire et naviguer un formulaire à plusieurs sections même pour publier un article simple.

Un point vérifié et écarté d'emblée : les informations de contact du vendeur (nom de la boutique, téléphone, WhatsApp) ne sont **jamais** à ressaisir par produit — elles vivent uniquement sur la fiche boutique (`boutiques.telephone`/`whatsapp`) et sont jointes automatiquement à chaque produit et chaque commande via `JOIN boutiques b ON b.id = p.boutique_id`. Ce n'est donc pas un point de friction existant à corriger.

## Décisions validées avec l'utilisateur

- **Le prix reste obligatoire**, y compris en mode rapide — un produit sans prix affiché est jugé peu utile pour l'acheteur, même si le serveur le permettrait techniquement.
- **La reconnaissance d'image par IA** (suggérer marque/modèle/nom depuis la photo) est conçue dans ce document pour ne pas être oubliée, mais **livrée en phase 2**, après que le mode rapide sans IA soit en production et fonctionne seul.
- **Deux boutons d'entrée séparés** ("⚡ Ajout rapide" / "Ajout détaillé") plutôt qu'un formulaire unique avec section repliable — le choix se fait avant l'ouverture du formulaire.
- **Le vendeur choisit toujours ce qu'il veut**, à tout moment : le mode rapide n'est pas une prison — un lien permet de voir tous les champs sans perdre la saisie déjà faite, et un produit créé en rapide reste modifiable en détaillé ensuite.

## Design

### Point d'entrée : deux boutons, un seul formulaire

Dans l'onglet Catalogue (`CatalogueProduits`, `BoutiqueClient.tsx:604-619`), le bouton unique actuel "+ Ajouter un produit" devient deux boutons côte à côte : **"⚡ Ajout rapide"** et **"Ajout détaillé"**. Les deux ouvrent le même composant `ProduitForm` existant, avec une nouvelle prop `modeInitial: 'rapide' | 'detaille'` qui contrôle uniquement quels champs sont visibles au premier rendu — pas de duplication de formulaire, pas de nouvelle route API, pas de nouveau composant serveur.

### Mode rapide — champs visibles

Uniquement : **Photo**, **Catégorie**, **Prix**. Le nom n'est pas demandé — il est généré automatiquement à partir de la catégorie choisie et envoyé tel quel au serveur (le champ `nom` reste techniquement requis côté API, satisfait par cette valeur générée). Description et caractéristiques par catégorie restent vides à la création (déjà optionnelles côté serveur, aucun changement de validation nécessaire).

Table de correspondance catégorie → nom par défaut (couvre les 11 valeurs de `PRODUIT_CATEGORIES`, `BoutiqueClient.tsx:394-406`) :

| `categorie` (valeur) | Nom par défaut généré |
|---|---|
| `smartphones` | Smartphone — à modifier |
| `informatique` | Article informatique — à modifier |
| `tv-electro` | TV / Électroménager — à modifier |
| `mode` | Article mode — à modifier |
| `maison` | Article maison — à modifier |
| `auto-moto` | Véhicule — à modifier |
| `jeux` | Jeu / Console — à modifier |
| `alimentation` | Produit alimentaire — à modifier |
| `beaute` | Produit beauté — à modifier |
| `services` | Service — à modifier |
| `autre` | Produit — à modifier |
| (aucune catégorie sélectionnée) | Produit — à modifier |

### Un lien vers le mode détaillé, sans perte de saisie

En bas du mode rapide, un lien texte "Voir tous les champs (description, caractéristiques…)" bascule `modeInitial` de `'rapide'` à `'detaille'` **dans le même formulaire monté** (changement d'état local React, pas de re-navigation) — la photo, la catégorie et le prix déjà saisis restent dans les champs, les sections supplémentaires (nom éditable, description, caractéristiques dynamiques, prix barré) apparaissent simplement en plus.

### Signal "à compléter" dans la liste du dashboard

Un produit dont le `nom` se termine par `"— à modifier"` affiche un badge "✏️ À compléter" dans la carte produit de la liste du dashboard (`CatalogueProduits`, même rangée de badges que le badge de statut de synchro introduit au Chantier 1) — purement informatif, ne bloque ni la visibilité publique du produit ni sa synchronisation vers le catalogue Meta. Cliquer sur "Modifier" (bouton déjà existant) ouvre le formulaire en mode détaillé directement, pour compléter le nom et le reste.

### Phase 2 — reconnaissance d'image (conçue, non livrée dans ce chantier)

Point d'intégration prévu, pour ne pas redécouvrir ce choix plus tard : après l'upload de la photo en mode rapide, un appel optionnel à un service de reconnaissance d'image (choix du fournisseur non tranché ici — à décider en phase 2 selon coût/latence acceptables) suggérerait :
- un nom plus précis que le générique par catégorie (ex. "iPhone 13" au lieu de "Smartphone — à modifier"),
- les champs `caracteristiques.marque` / `caracteristiques.modele` quand la catégorie les prévoit.

Le vendeur resterait libre d'accepter, modifier, ou ignorer la suggestion avant publication — jamais une auto-publication silencieuse d'une valeur reconnue automatiquement. Aucune modification du contrat du formulaire ou de l'API n'est nécessaire pour cette phase : les mêmes champs seraient simplement pré-remplis par une source différente (IA au lieu du texte générique par catégorie).

## Hors périmètre (explicitement)

- Le service de reconnaissance d'image lui-même (choix du fournisseur, clé API, coût par appel, latence) — reporté en phase 2, non tranché ici.
- Toute modification de la validation serveur (`nom` requis) — le nom généré satisfait déjà cette contrainte, aucun changement d'API nécessaire.
- Suppression ou modification des champs du mode détaillé existant — le formulaire actuel (`ProduitForm`) reste inchangé dans sa version détaillée, seul un mode d'affichage initial différent est ajouté.

## Vérification

- Créer un produit en mode rapide (photo + catégorie "Auto & Moto" + prix) → vérifier que le produit apparaît dans la liste avec le nom "Véhicule — à modifier" et le badge "✏️ À compléter".
- Depuis cette liste, cliquer "Modifier" → vérifier que le formulaire s'ouvre en mode détaillé avec le nom pré-rempli, modifiable.
- En mode rapide, cliquer "Voir tous les champs" → vérifier que la photo/catégorie/prix déjà saisis sont conservés et que les champs supplémentaires (description, caractéristiques, prix barré, nom éditable) apparaissent.
- Tenter de soumettre le mode rapide sans prix → vérifier qu'une erreur de validation bloque la soumission (cohérent avec la décision "prix obligatoire même en mode rapide").
- Renommer un produit "— à modifier" en un vrai nom → vérifier que le badge "✏️ À compléter" disparaît de la liste.
