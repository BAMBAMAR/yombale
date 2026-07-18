# Formulaire produit boutique — champs modernes en chips, suppression des doublons, champs optionnels

**Date** : 18 juillet 2026
**Fichier concerné** : `frontend-next/src/app/boutique/BoutiqueClient.tsx` (+ `globals.css` pour les styles de chips)

## Contexte

Retour utilisateur avec capture d'écran du formulaire "Ajouter un produit" (catégorie Mode) : les champs Marque/Matière sont en texte libre, Taille et État sont obligatoires, et la section "Variantes" (déjà en chips visuelles depuis le chantier du 17 juillet) fait doublon avec le champ "Taille" du bloc Caractéristiques quand le marchand ajoute une variante Taille. Le formulaire doit rester simple pour un petit commerçant : moins de saisie obligatoire, des choix cliquables plutôt que du texte libre quand c'est possible.

## Décisions validées

1. **Chips + saisie libre** pour les champs actuellement en texte libre qui ont un ensemble de valeurs courantes identifiable (Marque par catégorie, Matière, Couleur simple, Type d'article/produit/service, Genre). Chaque champ affiche des suggestions cliquables (pill buttons, style réutilisant l'esthétique déjà en place pour les valeurs de variantes) + un choix "Autre" qui révèle un `<input type="text">` pour toute valeur non listée. Les champs à valeurs réellement non bornées (Modèle, Dimensions, Année, Kilométrage, Contenance, Poids/Quantité, dates) restent des inputs texte/nombre classiques.
2. **Suppression des doublons Caractéristiques ↔ Variantes** : pour les 3 paires identifiées (Taille/mode, Couleur/smartphones+tv-electro, Stockage/smartphones+informatique), le champ simple du bloc Caractéristiques est masqué dès que le marchand a ajouté une variante du type correspondant. Tant qu'aucune variante de ce type n'existe, le champ simple reste affiché en repli (chips à sélection unique).
3. **Tout optionnel sauf Nom et Prix** : retrait de `required` sur tous les champs de `CaracteristiquesFields` (toutes catégories confondues — État, Genre, Taille, Marque, Année pour auto-moto, etc.). Seuls le nom du produit et le prix restent obligatoires (déjà le cas pour le prix, inchangé).

## Design détaillé

### Nouveau composant `CaracChips`

```
function CaracChips({ label, name, value, onChange, suggestions, allowAutre = true }: {
  label: string; name: string; value: string; onChange: (k: string, v: string) => void
  suggestions: string[]; allowAutre?: boolean
})
```

- Affiche `suggestions` en pill buttons cliquables (sélection unique — cliquer une pastille appelle `onChange(name, valeur)` ; re-cliquer la pastille active la désélectionne → `onChange(name, '')`).
- Si `allowAutre`, une dernière pastille "Autre" bascule l'affichage d'un `<input type="text">` sous les chips ; taper dedans appelle aussi `onChange(name, ...)`. Si `value` ne correspond à aucune suggestion (ex: en édition d'un produit existant), le mode "Autre" s'active automatiquement avec l'input pré-rempli.
- Style : réutilise la logique visuelle des pastilles de variantes déjà en place (`estCouleur` a des ronds de couleur avec hex ; les autres types de variante ont des pastilles texte simples `border-radius` arrondi) — pas de nouvelle palette, juste un composant générique pour les Caractéristiques.
- Pas de `required` — aucun `CaracChips` n'a de marqueur `*`.

### Champs convertis en `CaracChips` (par catégorie)

| Catégorie | Champ | Suggestions |
|---|---|---|
| smartphones | Marque | Samsung, Apple, Xiaomi, Tecno, Infinix, Autre |
| smartphones | Couleur | (réutilise `COULEURS_PALETTE`, rendu simple pastille couleur comme dans Variantes) |
| smartphones | Stockage | mêmes valeurs que `STOCKAGES_RAM` |
| informatique | Marque | Dell, Lenovo, HP, Asus, Apple, Autre |
| informatique | Stockage | `STOCKAGES_RAM` |
| tv-electro | Marque | Samsung, LG, Hisense, TCL, Autre |
| tv-electro | Couleur | n/a (pas de champ couleur sur cette catégorie actuellement — ignorer) |
| auto-moto | Marque | Toyota, Yamaha, Hyundai, Kia, Autre |
| auto-moto | Carburant | Essence, Diesel, Hybride, Électrique, Autre |
| mode | Marque | Zara, Nike, Adidas, H&M, Shein, Autre |
| mode | Genre | Homme, Femme, Enfant, Unisexe (remplace le `<select>` `CaracSelect`) |
| mode | Matière | Coton, Lin, Cuir, Synthétique, Denim, Autre |
| maison | Type d'article | Canapé, Lit, Table, Armoire, Chaise, Autre |
| maison | Matière | Bois, Métal, Tissu, Verre, Plastique, Autre |
| jeux | Plateforme | reste `CaracSelect` (déjà une liste fermée cohérente, pas de saisie libre à remplacer) |
| alimentation | Conditionnement | Sachet, Boîte, Vrac, Bouteille, Autre |
| beauté | Type | Crème, Parfum, Shampoing, Savon, Maquillage, Autre |
| beauté | Pour qui | Homme, Femme, Mixte (remplace `CaracSelect`) |
| services | Type de service | Plomberie, Cours, Transport, Ménage, Réparation, Autre |

Champ `État` (`ETATS_PRODUIT`, présent sur presque toutes les catégories) : reste un `CaracSelect` classique (liste fermée courte, un `<select>` est déjà approprié) mais perd son `required`.

### Anti-doublon Caractéristiques ↔ Variantes

`CaracteristiquesFields` reçoit une nouvelle prop `typesVarianteActifs: Set<TypeVarianteId>` (dérivée de `typesDejaUtilises`, déjà calculée dans `ProduitForm`).

Règle de masquage :
- Catégorie `mode`, champ Taille → masqué si `typesVarianteActifs.has('taille')`
- Catégories `smartphones`/`tv-electro`, champ Couleur → masqué si `typesVarianteActifs.has('couleur')`
- Catégories `smartphones`/`informatique`, champ Stockage → masqué si `typesVarianteActifs.has('stockage')`

Si le champ est masqué, sa clé est retirée de l'objet `caracteristiques` soumis (pour ne pas garder une valeur obsolète si le marchand avait rempli le champ simple puis ajouté la variante après coup) — géré par un `useEffect` dans `ProduitForm` qui nettoie `carac` quand un type de variante correspondant devient actif.

### Champs non touchés

- Modèle, Dimensions, Année, Kilométrage, Contenance, Poids/Quantité, Date de péremption, Durée/Fréquence, Disponibilité, Zone d'intervention : restent `CaracField` texte/nombre standard, sans `required`.
- Section Variantes : aucun changement de comportement, uniquement lue pour la règle anti-doublon ci-dessus.

## Hors-scope

- Aucun changement de schéma backend (`caracteristiques JSONB`/`variantes JSONB` inchangés).
- Aucun changement sur la fiche produit publique ni sur le comportement de commande.
- Pas de nouvelle catégorie ni de nouveaux champs métier — uniquement une refonte de la présentation des champs existants.
