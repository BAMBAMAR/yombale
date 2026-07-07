# Corrections fiche produit, tri des listes et filtre opérateur

## Contexte

Retour d'usage réel (7 juillet 2026) signalant 4 insuffisances côté Next.js :

1. Sur la fiche produit, le bouton d'achat n'est pas assez visible — il n'apparaît qu'après le bloc de métriques (marchands/prix min/max/économie), loin sous le nom du produit.
2. Dans la table "Comparer les prix du marché" (produits similaires) de la fiche produit, seule une petite colonne d'action est cliquable vers la fiche du produit similaire — pas toute la ligne.
3. Aucune option de tri n'est exposée à l'utilisateur sur la page principale (liste de produits), ni sur les pages Annonces et Boutiques.
4. Le wizard "🎯 Trouver mon forfait" (télécom) n'a pas de filtre Opérateur, alors que la donnée existe en base et que la page `/telecom` classique l'a déjà.

Un audit du code a confirmé l'état exact de chaque point (voir détail par section ci-dessous) — ce chantier n'ajoute pas de nouvelle infrastructure de données, il branche/déplace de l'UI sur des capacités déjà largement présentes côté backend.

## 1. Bouton "Acheter" déplacé dans le header de la fiche produit

**Fichier** : `frontend-next/src/app/produit/[id]/page.tsx`

Le CTA existant (actuellement lignes 415-419, `<a href="/api/click/{id}" class="cta-acheter">🛒 Acheter au meilleur prix →</a>`) est retiré de sa position actuelle (après le bloc `.forfait-fiche-specs`) et déplacé dans `.produit-fiche-nom-row` (lignes 372-379), à droite du `<h1>` :

- Desktop : nom du produit à gauche, bouton aligné à droite sur la même ligne (flex, `justify-content: space-between`).
- Mobile : passe en dessous du nom (flex-wrap), pleine largeur ou centré selon l'espace disponible.

Comportement inchangé : condition d'affichage (`best?.url_achat` truthy), lien `/api/click/{best.id}` (tracking existant conservé), `target="_blank"`. Seul le placement DOM/CSS change.

La grille de métriques (`.forfait-fiche-specs`) reste à sa place actuelle, juste sans le CTA qui la suivait.

## 2. Lignes cliquables — table "Comparer les prix du marché"

**Fichier** : même fichier, section `similaires-table` (~lignes 542-648).

Toute la `<tr>` de chaque produit similaire devient cliquable vers `/produit/{id}` (navigation complète de ligne, pas juste la colonne d'action actuelle). Le bouton "Voir l'offre"/achat à l'intérieur de la ligne continue de pointer vers le marchand (`/api/click/{offreId}`) et stoppe la propagation du clic (`e.stopPropagation()`) pour ne pas déclencher la navigation de ligne en plus du lien marchand.

Implémentation : `onClick` sur la `<tr>` avec `router.push(...)` (le composant est déjà `'use client'` d'après le contexte de la page), `cursor: pointer` en style, et `role="link"`/`tabIndex` pour l'accessibilité clavier reste hors scope de ce chantier (comportement identique au reste du site, pas de régression introduite).

**Non concerné** : la liste "offres marchands" plus haut sur la même fiche (lignes 427-472, même produit chez différents marchands) reste inchangée — elle pointe déjà correctement vers le marchand via le bouton "Voir l'offre", et une ligne entière cliquable vers le marchand n'apporte pas de valeur supplémentaire par rapport au bouton déjà présent.

## 3. Tri — Produits (accueil), Annonces, Boutiques

Pattern repris à l'identique de `frontend-next/src/app/immo/page.tsx` (déjà en place pour immo et telecom) : une rangée de pills `<Link href="?tri=...">`, classe `budget-pill`/`active`, navigation serveur (pas de state client — chaque clic recharge la page avec le nouveau query param `tri`).

### 3.a Produits (page d'accueil)

- **Backend** : déjà prêt. `GET /api/produits` (`backend/routes/produits.js` lignes 15, 18-21) accepte `tri` ∈ `prix_asc | prix_desc | nom_asc`, défaut = tri par popularité (`COUNT(o.id) DESC`). Aucun changement backend nécessaire.
- **Frontend** :
  - `frontend-next/src/app/page.tsx` : lire `searchParams.tri`, l'ajouter à `URLSearchParams` avant l'appel `fetch(/api/produits?...)`, et l'ajouter à la clé `key={`${q}-${categorie}-${prixMax}`}` de `<ProduitsListe>` pour forcer un remount propre au changement de tri. Ajouter une rangée de pills sous la rangée Budget existante (lignes 166-187) : `Pertinence (défaut) / Prix ↑ / Prix ↓ / Nom A-Z`.
  - `frontend-next/src/app/ProduitsListe.tsx` : la prop `tri` doit être ajoutée à `Props` et transmise dans `voirPlus()` (ligne ~39-42) pour que la pagination "Voir plus" respecte le tri actif.

### 3.b Annonces

- **Backend** : `backend/routes/annonces.js`, route `GET /` (lignes 109-138) trie actuellement en dur `ORDER BY created_at DESC`. Ajouter un paramètre `tri` optionnel avec le même schéma que `produits.js` :
  - `recent` (défaut, `created_at DESC`), `prix_asc` (`prix ASC NULLS LAST`), `prix_desc` (`prix DESC NULLS LAST`).
- **Frontend** : `frontend-next/src/app/annonces/page.tsx` — ajouter la rangée de pills (`Récent / Prix ↑ / Prix ↓`) sur le même modèle que `immo/page.tsx`.

### 3.c Boutiques

- **Contrainte à respecter** : `backend/routes/boutiques.js` (lignes 122-157) a déjà un ordre par défaut à 3 niveaux — plan Business avant Pro avant gratuit, puis sponsorisées, puis récence (`created_at DESC`). C'est un ordre de mise en avant commerciale (monétisation des plans payants) : le nouveau tri ne doit **pas** l'écraser silencieusement par défaut.
  - Règle : si `tri` n'est pas fourni (ou vaut `defaut`), on garde exactement l'`ORDER BY` actuel. Si `tri` est fourni explicitement par l'utilisateur (`recent` ou `nom_asc`), on trie uniquement sur ce critère, sans la préséance plan/sponsorisation.
  - Valeurs : `defaut` (actuel, implicite), `recent` (`created_at DESC` seul), `nom_asc` (`nom ASC`).
- **Frontend** : `frontend-next/src/app/boutiques/page.tsx` — rangée de pills `Recommandé (défaut) / Récent / Nom A-Z`.

## 4. Filtre Opérateur — Wizard "Trouver mon forfait"

**Fichier** : `frontend-next/src/app/telecom/WizardForfait.tsx`

Ajout d'un 4e champ à l'étape 1, à côté de Budget / Profil d'usage / Durée de validité :

- Select "Opérateur" avec option par défaut `''` = "Peu importe" (aucun filtre appliqué), puis une option par valeur distincte retournée par `GET /api/telecom/operateurs` (route déjà existante, `backend/routes/telecom.js` lignes 49-56, `SELECT DISTINCT operateur ... ORDER BY operateur`).
- Le composant reçoit la liste `operateurs: string[]` en prop depuis le parent `TelecomClient.tsx` (qui la reçoit déjà lui-même de `page.tsx` ligne 70) plutôt que de refaire un fetch dédié — évite un appel réseau redondant, réutilise une donnée déjà chargée au niveau page.
- Nouveau state `operateur` (même niveau que `budget`/`profil`/`validite`, lignes 49-55).
- Le fetch des résultats (lignes 57-82, `GET /api/telecom?limit=100&prixMax=...&type=...`) ajoute `&operateur=...` quand non vide — le backend l'accepte déjà (`backend/routes/telecom.js` ligne 12, 24 : `operateur ILIKE $1`).

Pas de changement sur l'étape 2 (résultats) — le filtre est appliqué en amont, à l'étape 1, avant l'appel API.

## Hors périmètre (explicitement)

- Tri sur d'autres listes non mentionnées (ex. favoris) — non demandé.
- Reconnaissance de préférence opérateur mémorisée entre sessions — un simple filtre ponctuel suffit.
- Modification du CSS `.cta-acheter` au-delà de ce qui est nécessaire pour le nouveau placement (pas de refonte visuelle du bouton lui-même).
- Rendre les lignes de la liste "offres marchands" (même produit, section 2) cliquables dans leur ensemble — seule la table "produits similaires" est concernée par ce changement (voir section 2).

## Vérification

- Fiche produit : le bouton "Acheter" apparaît visuellement à droite du nom du produit dès le chargement de la page, sur desktop et mobile (repli en dessous du nom).
- Table produits similaires : cliquer n'importe où sur une ligne (hors bouton d'achat) navigue vers `/produit/{id}` du produit similaire ; cliquer sur le bouton d'achat à l'intérieur de la ligne ouvre bien le lien marchand sans déclencher la navigation de ligne.
- Tri produits : chaque pill (Pertinence/Prix ↑/Prix ↓/Nom) change effectivement l'ordre affiché et persiste au clic sur "Voir plus".
- Tri annonces : chaque pill change l'ordre ; vérifier `ORDER BY` correct pour `prix_asc`/`prix_desc` (annonces sans prix renseigné en fin de liste, pas en erreur).
- Tri boutiques : par défaut (aucun tri sélectionné), l'ordre plan Business > Pro > gratuit est inchangé ; en sélectionnant "Récent" ou "Nom A-Z", l'ordre change sans egard au plan.
- Wizard forfait : sélectionner un opérateur à l'étape 1 puis lancer la recherche ne renvoie que des forfaits de cet opérateur ; "Peu importe" renvoie tous les opérateurs comme avant ce chantier.
