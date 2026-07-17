# Chatbot WhatsApp — navigation boutiques, catalogue et commande (design)

**Date** : 17 juillet 2026
**Fichiers concernés** : `backend/services/whatsapp-chatbot.js` (state machine), `backend/routes/comptabilite.js` (extraction fonction commande partagée), `backend/services/whatsapp.js` (aucun changement attendu — fonctions d'envoi déjà suffisantes). Aucune migration de schéma nécessaire (`boutiques.categorie`, `boutiques.whatsapp`, `boutiques.telephone`, `zones_livraison`, `commandes_boutique.source` existent déjà).

## Problème

Aujourd'hui, le chatbot WhatsApp ne permet de découvrir un produit boutique que via la recherche full-text globale (mélangée avec produits comparateur/annonces/immo, 3 résultats max par boutique_produits). Il n'existe aucun moyen de :
- parcourir le catalogue complet d'une boutique précise,
- qu'un marchand partage un lien direct vers sa boutique dans le bot,
- contacter facilement le marchand depuis le bot,
- commander un produit sans quitter WhatsApp (le client doit aller sur le site).

## Décisions validées avec l'utilisateur

- **Commande complète dans le chat** : quantité, nom, téléphone, adresse, zone de livraison (frais inclus si configurée), méthode de paiement souhaitée → crée une vraie ligne `commandes_boutique`. Le paiement réel reste géré par le vendeur directement avec le client (comportement identique au web actuel) — **pas de paiement en ligne dans ce chantier**, ajoutable plus tard séparément (impacterait aussi le web).
- **Partage boutique** : lien direct `wa.me/{numero}?text=boutique_{slug}` qui ouvre le bot directement filtré sur cette boutique.
- **Contact marchand** : bouton dédié dans le menu boutique, pointe vers une conversation WhatsApp directe avec le marchand (`boutiques.whatsapp` ou à défaut `telephone`) — le bot n'intervient pas dans cet échange.
- **Recherche dans une boutique** : recherche mot-clé filtrée sur cette boutique **et** navigation par catégorie de produits.
- **Liste de toutes les boutiques** : groupée par secteur (`boutiques.categorie`), accessible depuis le menu principal.
- **Fiche produit complète** : Product Message Meta native (1 photo, nom, prix) + message texte juste après avec description complète, caractéristiques/variantes, stock, nom boutique, bouton « Commander ».
- **Réutilisation** : la logique de création de commande est extraite de `POST /api/comptabilite/:boutiqueId/commandes` (`backend/routes/comptabilite.js:466-529`) en une fonction partagée, appelée à la fois par cette route HTTP et par le chatbot — même notification vendeur, même table, zéro duplication.
- **Zone de livraison incluse dès cette V1** — si la boutique a des zones configurées, le client en choisit une (frais ajoutés au total) ; sinon l'étape est sautée automatiquement.

## Architecture générale

Le principe central : `whatsapp_sessions.context` (JSONB déjà existant) reçoit un nouveau champ `context.boutique = { id, nom, slug, whatsapp }`. Tant que ce champ est présent, le client est « dans » cette boutique — toute recherche/navigation reste scopée dessus via une clause SQL additionnelle (`AND boutique_id = $n`), en réutilisant au maximum les fonctions et le pattern de pagination (`shownIds`) déjà en place depuis le chantier du 13 juillet. `context.commande` porte l'état transitoire du formulaire de commande en cours, nettoyé après confirmation ou annulation.

Aucun nouvel état ne duplique un état existant : les nouveaux états `BOUTIQUE_*` et `COMMANDE_*` sont additifs dans le même `if (state === ...)` du dispatcher `handleIncoming`.

## Section 1 — Entrer en mode boutique (3 chemins)

### a) Lien direct partagé
Avant le traitement `IDLE` habituel dans `handleIncoming`, détection d'un texte matchant `/^boutique_(.+)$/i` (insensible à la casse, testé sur le tout premier message aussi bien qu'à tout moment). Si trouvé : résolution de la boutique par `slug`, pose de `context.boutique`, envoi direct du menu boutique (section 2) — sans le message de bienvenue générique dans ce cas précis (le marchand a déjà fait l'accueil en partageant son lien).

Boutique introuvable ou inactive → message d'erreur + fallback vers le menu principal normal.

### b) Menu principal → « 🏪 Boutiques »
Nouvelle option dans `sendMenu()`. Déclenche l'état **`BOUTIQUE_SECTEUR`** :
1. `SELECT DISTINCT categorie FROM boutiques WHERE actif=true AND categorie IS NOT NULL ORDER BY categorie` → liste interactive Meta (même pattern que `sendWhatsAppInteractive`).
2. Choix d'un secteur → état **`BOUTIQUE_LISTE`**, liste les boutiques de ce secteur, 3 par 3, paginée avec `shownIds` (même mécanisme que `envoyerListeImmo`).
3. Sélection d'une boutique dans la liste (reply avec `id` de la boutique) → pose `context.boutique`, entre dans le menu boutique.

### c) Depuis une recherche globale existante
Dans `handleSearchQuery`, pour chaque résultat de type `produit` (boutique_produits), la Product Message est suivie d'un message avec un bouton reply `entrer_boutique_{boutiqueId}` (« 🏪 Voir toute la boutique {nom} »). Un clic pose `context.boutique` et entre dans le menu boutique.

## Section 2 — Menu boutique (état `BOUTIQUE_MENU`)

À l'entrée, envoi d'un message d'en-tête (nom, description courte, secteur, ville) suivi d'un menu interactif :

| Option | Comportement |
|---|---|
| 🔍 Rechercher dans cette boutique | → état `BOUTIQUE_SEARCH_QUERY` |
| 📂 Parcourir par catégorie | → état `BOUTIQUE_CATEGORIE` (liste `DISTINCT categorie` de `boutique_produits` pour cette boutique) |
| 📞 Contacter le vendeur | Envoie un lien `https://wa.me/{whatsapp ou telephone normalisé}` en texte — pas de suivi par le bot ensuite |
| ⬅️ Changer de boutique / Menu principal | Efface `context.boutique`, retour à `MENU` |

**Recherche et navigation par catégorie** réutilisent la requête `boutique_produits` déjà présente dans `searchContent`, avec en plus `AND boutique_id = $n` et, pour la navigation catégorie, `AND categorie = $m` à la place du `plainto_tsquery`. Pagination via `shownIds`, exactement comme l'existant.

### Fiche produit complète
Quand un produit boutique est affiché (recherche boutique, navigation catégorie, ou recherche globale) :
1. Product Message Meta native (`sendWhatsAppProduct`, existant) — photo, nom, prix.
2. Message texte immédiat : description complète, caractéristiques/variantes (`caracteristiques` JSONB formaté en liste à puces), disponibilité (`en_stock` / `stock_quantite` si renseigné), nom de la boutique.
3. Bouton reply `commander_{produitId}` (« 🛒 Commander ce produit »).

## Section 3 — Flux de commande

Déclenché par le clic sur « 🛒 Commander ce produit ». Séquence d'états linéaires, un produit à la fois (pas de panier multi-produits) :

1. **`COMMANDE_QUANTITE`** — « Combien en voulez-vous ? » ; valide un entier ≥ 1 ; si `stock_quantite` renseigné et insuffisant, message d'erreur et redemande.
2. **`COMMANDE_NOM`** — nom complet du client.
3. **`COMMANDE_TELEPHONE`** — numéro de téléphone (le numéro WhatsApp de la conversation est proposé en suggestion dans le message, mais une saisie explicite est demandée — peut différer du numéro de livraison).
4. **`COMMANDE_ADRESSE`** — adresse en texte libre.
5. **`COMMANDE_ZONE`** (sautée automatiquement si la boutique n'a aucune `zones_livraison`) — liste interactive des zones avec leur prix ; option implicite de ne pas en choisir si la liste le permet.
6. **`COMMANDE_PAIEMENT`** — boutons Wave / Orange Money / Cash / Virement (mêmes libellés que le web).
7. **Récapitulatif** — affiche produit, quantité, prix unitaire, frais de livraison, total, nom/téléphone/adresse, méthode de paiement choisie ; boutons « ✅ Confirmer » / « ✏️ Annuler ».
8. **Confirmation** → appelle la fonction partagée de création de commande (section 4) avec `source: 'whatsapp'`. Déclenche automatiquement la notification WhatsApp au vendeur (déjà existante dans cette logique).
9. Message final : « ✅ Commande {reference} envoyée à {boutique.nom}, le vendeur va vous contacter pour finaliser le paiement et la livraison. » → retour à **`BOUTIQUE_MENU`** (pas `MENU` — `context.boutique` est conservé pour permettre de continuer à explorer/commander dans la même boutique).

**Annulation** (à tout moment de la séquence via « annuler » en texte libre, ou clic « ✏️ Annuler ») : nettoie `context.commande`, retour à `BOUTIQUE_MENU`.

## Section 4 — Détails techniques

### Extraction de la logique de commande
`backend/routes/comptabilite.js:474-529` (`POST /:boutiqueId/commandes`) est refactorée : le corps de la logique (résolution produit/stock, calcul zone de livraison, calcul montant total, génération référence, `INSERT`, notification WhatsApp vendeur) devient une fonction exportée, par exemple `creerCommandeBoutique({ boutiqueId, produitId, quantite, clientNom, clientTelephone, clientAdresse, note, source, methodePaiement, zoneLivraisonId })`, retournant la commande créée ou levant une erreur typée (produit introuvable / stock insuffisant / boutique introuvable). La route HTTP devient un mince wrapper validation + appel + réponse JSON. Le chatbot importe et appelle directement cette fonction (pas d'appel HTTP interne).

### Structure de `context`
```json
{
  "boutique": { "id": "uuid", "nom": "...", "slug": "...", "whatsapp": "..." },
  "commande": {
    "produit_id": "uuid", "nom_produit": "...", "prix": 1000, "quantite": 2,
    "client_nom": "...", "client_telephone": "...", "client_adresse": "...",
    "zone_livraison_id": "uuid|null", "methode_paiement": "wave"
  },
  "last": { "type": "boutique_search|boutique_categorie|...", "query": "...", "shownIds": [...] }
}
```
`commande` est effacé après confirmation ou annulation. `boutique` persiste jusqu'à sortie explicite (« menu », choix « Changer de boutique »).

### Interaction avec les comportements globaux existants
- Salutations/« menu » globales : comportement inchangé, effacent tout le contexte (y compris `boutique`) et retournent au menu principal — cohérent avec l'existant, pas de sur-complexification pour préserver `boutique` dans ce cas.
- Clôture (« merci », etc.) : comportement inchangé.
- Timeout 1h (`resetInactiveSessions`) : s'applique tel quel, une commande abandonnée en cours expire normalement sans traitement spécial.

### Portée du contact marchand
Le bouton « 📞 Contacter le vendeur » envoie un lien `wa.me` — il n'ouvre pas de nouvelle conversation gérée par le bot avec le marchand. Aucune notification n'est envoyée au marchand à ce stade (uniquement lors d'une commande effective, comportement déjà existant).

## Hors scope (explicitement exclu de ce chantier)

- Paiement en ligne réel (Wave/Orange avec webhook) pour les commandes boutique — reste un choix déclaratif comme le web actuel ; chantier séparé futur qui impacterait aussi le site.
- Panier multi-produits dans une même commande — un produit à la fois, comme le formulaire web actuel.
- Suivi de commande depuis le mode boutique (l'option « 📦 Suivre commande » du menu principal existant reste inchangée et généraliste).
- Modification/annulation d'une commande déjà confirmée depuis le chat.
- Notifications automatiques du bot au client sur le changement de statut de sa commande (le vendeur contacte directement).

## Tests / vérification

Pas de suite de tests automatisés existante pour ce fichier (cohérent avec les chantiers chatbot précédents). Vérification prévue :
- `node --check` sur les fichiers modifiés.
- Vérification manuelle du flux complet en conditions réelles WhatsApp après implémentation : lien direct boutique → menu boutique → recherche → fiche produit → commander → quantité/nom/téléphone/adresse/zone/paiement → récapitulatif → confirmation → vérifier la ligne `commandes_boutique` en base (`source='whatsapp'`) et la notification reçue côté vendeur.
- Vérifier aussi les chemins b) et c) d'entrée en mode boutique, l'annulation en cours de commande, et le cas boutique sans zone de livraison (étape sautée) vs avec zones.
