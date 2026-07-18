# Panier natif WhatsApp/Meta Commerce — traitement dans le chatbot (design)

**Date** : 18 juillet 2026
**Fichiers concernés** : `backend/services/whatsapp-chatbot.js` (nouvelle interception + généralisation du flux `COMMANDE_*`), `backend/routes/comptabilite.js` (extraction de la notification hors de `creerCommandeBoutique`), `backend/migrate-inline.js` (colonne additive `groupe_commande`), `frontend-next/src/app/boutique/Commandes.tsx` (affichage groupé côté vendeur).

## Problème

Quand un client consulte une fiche produit boutique envoyée par le bot (Product Message native Meta, catalogue synchronisé), WhatsApp propose nativement d'ajouter au panier et de « l'envoyer » au vendeur — fonctionnalité native de l'app, indépendante du code Nopalou. Confirmé par capture d'écran utilisateur : bouton « Voir le panier envoyé », icône panier, total estimé.

Meta transmet alors au webhook un message de type `order` (`msg.type === 'order'`, `msg.order.product_items = [{ product_retailer_id, quantity, item_price, currency }]`). Aujourd'hui, **rien dans `backend/routes/whatsapp.js` ni `backend/services/whatsapp-chatbot.js` ne traite ce type** — confirmé par grep, `handleIncoming` ne lit que `msg.text`/`msg.interactive`, donc un panier envoyé ne déclenche silencieusement rien (ou un comportement non pertinent selon l'état de session en cours).

## Décisions validées avec l'utilisateur

- **Panier multi-produits → commande groupée** : chaque article reste une ligne distincte dans `commandes_boutique` (cohérent avec le schéma existant, un `produit_id` par ligne), liées entre elles par une nouvelle colonne `groupe_commande` (UUID, nullable). Une seule notification WhatsApp groupée au vendeur pour tout le panier, pas une par article.
- **Collecte des infos client** : réutilise le flux conversationnel `COMMANDE_*` existant (nom → téléphone → adresse → zone → paiement → récapitulatif → confirmation), généralisé pour accepter plusieurs articles au lieu d'un seul. `COMMANDE_QUANTITE` est sauté quand on vient d'un panier (quantités déjà connues dans `msg.order`).
- **Priorité d'interception** : un message `order` est traité en priorité absolue, quel que soit l'état de session courant — interrompt toute conversation en cours (recherche, FAQ, etc.), au même titre que la détection `boutique_{slug}` ou les mots-clés globaux `menu`/salutations.
- **Article introuvable en base** (produit supprimé, `retailer_id` invalide) : ignoré silencieusement, le reste du panier est traité normalement. Si aucun article n'est valide, le panier entier est rejeté avec un message clair.
- **Affichage vendeur** : les lignes d'un même groupe s'affichent regroupées visuellement dans `/boutique` (onglet Commandes), avec un total agrégé — les commandes existantes (mono-produit, web classique) restent inchangées visuellement.
- **Refactor nécessaire** : `creerCommandeBoutique()` (extraite lors du chantier précédent, `backend/routes/comptabilite.js`) notifie aujourd'hui le vendeur en interne, à chaque appel. Elle est modifiée pour ne plus envoyer de notification elle-même — chaque appelant (route web existante, nouveau flux panier) décide quand notifier. La route web garde son comportement actuel (notifie immédiatement après chaque commande individuelle) ; le flux panier notifie une seule fois à la fin, avec la liste complète des articles.

## Architecture générale

`context.commande` passe d'un objet à article unique implicite à un objet `{ items: [...], client_nom, client_telephone, ... }` où `items` est un tableau (`[{ produit_id, nom_produit, prix, quantite, stock_quantite }]`). Le flux `COMMANDE_*` existant (déjà en prod) est généralisé pour toujours raisonner en termes de `items` — y compris le chemin actuel « Commander » un-produit-à-la-fois, qui devient un cas particulier `items` à une seule entrée. Ça élimine la duplication entre un flux mono-produit et un flux multi-produits séparés.

## Section 1 — Détection et résolution du panier

Dans `handleIncoming`, avant toute autre logique (au même niveau de priorité que la détection `boutique_{slug}`) :

```js
if (msg.type === 'order' && msg.order) {
  await traiterPanierMeta(phone, msg.order);
  return;
}
```

`traiterPanierMeta(phone, order)` :
1. Extrait l'`id` de chaque `product_retailer_id` (format `nopalou-produit-{id}`, préfixe retiré).
2. Résout la boutique via le premier article valide : `SELECT boutique_id FROM boutique_produits WHERE id=$1`, puis charge la boutique (`SELECT ... FROM boutiques WHERE id=$1 AND actif=true`). Boutique introuvable/inactive → message d'erreur, retour au menu principal.
3. Pour chaque article du panier, résout le produit réel en base (nom, prix actuel — **jamais le prix envoyé par Meta dans le panier**, qui peut être obsolète —, `stock_quantite`, `en_stock`). Article dont le produit n'existe plus ou n'appartient pas à cette boutique → écarté silencieusement.
4. Si la liste finale d'articles valides est vide → message « Ces produits ne sont plus disponibles. » + retour au menu principal.
5. Sinon, construit `context.commande = { items: [...], stock_ok: true }` et enchaîne directement sur la collecte des coordonnées, en sautant `COMMANDE_QUANTITE` (transition directe vers `COMMANDE_NOM` avec un message adapté : « 🛒 Panier reçu ({N} article(s)) — Votre nom complet ? »).

## Section 2 — Généralisation du flux `COMMANDE_*`

Les états `COMMANDE_NOM`, `COMMANDE_TELEPHONE`, `COMMANDE_ADRESSE`, `COMMANDE_ZONE`, `COMMANDE_PAIEMENT` restent structurellement identiques (ils ne lisent jamais le contenu de `items`, seulement `context.commande.client_*`/`methode_paiement`) — aucune modification de leur logique interne, seulement de la forme de `context.commande` qu'ils propagent (`items` au lieu d'un seul produit).

`COMMANDE_QUANTITE` reste utilisé tel quel pour le flux « Commander » classique (bouton sur une fiche produit unique) — non supprimé, seulement contourné pour l'entrée panier.

`envoyerRecapFinal(phone, boutique, commande)` est réécrite pour itérer sur `commande.items` :
```
📋 Récapitulatif de votre commande

🛍️ ASICS KAYANO 14 × 1 — 20 000 FCFA
🛍️ Sandales homme × 2 — 20 000 FCFA
🚚 Livraison (Ouest Foire) : 1 000 FCFA
Total : 41 000 FCFA

👤 ... 📞 ... 📍 ...
💳 Paiement : ...
```

`COMMANDE_CONFIRMATION`, à la confirmation :
1. Génère un `groupeCommande` (UUID v4) une seule fois si `items.length > 1` ; reste `null` si un seul article (comportement identique à aujourd'hui, pas de groupe pour une commande simple).
2. Boucle sur `items`, appelle `creerCommandeBoutique({ ..., groupeCommande })` pour chacun — chaque appel insère une ligne, ne notifie plus (voir Section 4).
3. Après la boucle, envoie **une seule** notification WhatsApp groupée au vendeur, listant tous les articles et le total (nouvelle fonction dédiée, voir Section 4).
4. Message de confirmation au client : référence(s) de commande, retour à `envoyerMenuBoutique`.

## Section 3 — Affichage groupé côté vendeur

Migration additive dans `backend/migrate-inline.js` :
```sql
ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS groupe_commande UUID;
CREATE INDEX IF NOT EXISTS idx_commandes_groupe ON commandes_boutique(groupe_commande) WHERE groupe_commande IS NOT NULL;
```

`frontend-next/src/app/boutique/Commandes.tsx` : les commandes récupérées côté client sont regroupées par `groupe_commande` avant rendu (`groupe_commande !== null` → bloc groupé ; sinon → ligne individuelle comme aujourd'hui, inchangé). Un bloc groupé affiche un en-tête (« Commande groupée · {N} articles · {total} FCFA », date, statut du client/adresse communs) puis le détail de chaque article en dessous. Les actions de changement de statut restent **par ligne individuelle** dans cette V1 — pas de « changer le statut du groupe entier » en un clic (explicitement hors scope, ajoutable plus tard).

## Section 4 — Détails techniques

### Extraction de la notification hors de `creerCommandeBoutique`

`backend/routes/comptabilite.js` : le bloc `sendWhatsAppText(vendeurTel, msg)` actuellement interne à `creerCommandeBoutique()` est retiré ; la fonction retourne `{ commande, boutique }` (elle charge déjà `boutique` en interne, autant l'exposer pour éviter à l'appelant de la recharger). La route HTTP `POST /:boutiqueId/commandes` (seul appelant existant) reconstruit et envoie la notification immédiatement après l'appel, avec exactement le même message qu'aujourd'hui — **aucun changement de comportement observable pour le web**.

Le flux panier (chatbot) appelle `creerCommandeBoutique()` en boucle sans notifier à chaque itération, puis construit une notification unique après la boucle :
```
🛒 Nouvelle commande groupée — {boutique.nom}

Réf groupe : {groupeCommande}
• ASICS KAYANO 14 × 1 — 20 000 FCFA
• Sandales homme × 2 — 20 000 FCFA
🚚 Livraison : 1 000 FCFA
💰 Total : 41 000 FCFA
💳 Paiement souhaité : ...

👤 Client : ... 📞 ... 📍 ...
⚡ Répondez vite pour confirmer !
```

### Résilience stock/produit à la confirmation

Chaque appel à `creerCommandeBoutique()` dans la boucle revalide indépendamment le stock (déjà fait par la fonction). Si un article échoue (ex: rupture de stock survenue entre la réception du panier et la confirmation), les autres articles de la boucle continuent d'être traités normalement — cohérent avec la décision « ignorer l'article problématique, continuer avec le reste » de la Section 1. Le message de confirmation final liste les articles réellement créés et signale ceux qui ont échoué, le cas échéant.

### Interaction avec les comportements globaux existants

- Salutations/« menu »/clôture : comportement inchangé, un panier en cours de traitement (client en train de répondre nom/téléphone/adresse) peut toujours être interrompu par ces mots-clés globaux — le panier en cours est perdu, comme n'importe quel `context.commande` abandonné aujourd'hui.
- Timeout 1h (`resetInactiveSessions`) : s'applique tel quel, un panier abandonné en cours de collecte expire normalement.
- `ANNULER` (mots-clés d'annulation) : efface `context.commande` (donc tous les `items`), retour à `envoyerMenuBoutique`.

## Hors scope (explicitement exclu de ce chantier)

- Changement de statut groupé (un clic pour toutes les lignes d'un groupe) côté vendeur — reste par ligne individuelle.
- Paiement en ligne réel pour le panier (même limitation que le flux « Commander » actuel — paiement déclaratif, vendeur gère le règlement réel).
- Modification du panier après réception (retirer un article, changer une quantité) depuis la conversation — le client doit renvoyer un nouveau panier ou annuler et recommencer.
- Fusion automatique de deux paniers envoyés successivement par le même client.

## Tests / vérification

Pas de suite de tests automatisée pour ce fichier (cohérent avec le reste du chatbot). Vérification prévue :
- `node --check` sur les fichiers backend modifiés.
- `npx tsc --noEmit` sur `Commandes.tsx`.
- Vérification manuelle en conditions réelles WhatsApp après implémentation : envoyer un panier à 1 article (doit se comporter comme aujourd'hui, sans `groupe_commande`), envoyer un panier à 2-3 articles de la même boutique (doit produire une seule notification groupée, un affichage groupé côté `/boutique`), tester un article invalide dans le panier (doit être écarté silencieusement), tester un panier avec tous les articles invalides (doit être rejeté proprement), vérifier que la route web `POST /:boutiqueId/commandes` continue de notifier immédiatement comme avant (non-régression).
