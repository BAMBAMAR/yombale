# Chatbot WhatsApp — pagination « plus / encore / d'autres » (design)

**Date** : 13 juillet 2026
**Fichier concerné** : `backend/services/whatsapp-chatbot.js` uniquement. Aucun changement de schéma DB, aucun template Meta.

## Problème

Après une recherche (ex: « Samsung »), la session repasse en `MENU` sans garder trace de ce qui a été montré. Un « plus », « encore » ou « d'autres » est traité comme une nouvelle recherche full-text (souvent 0 résultat), et retaper la même requête relance exactement le même SQL `LIMIT 3`/`LIMIT 5` sans exclusion — l'utilisateur revoit les mêmes produits. Même problème pour les listes immo (3 annonces) et télécom (5 forfaits) du menu, toujours identiques.

## Décisions validées

- **Périmètre** : recherche produits **et** listes immo/télécom du menu (réponse utilisateur : « tous »).
- **Mécanisme** : exclusion par IDs déjà vus (approche A), pas d'offset SQL ni de préchargement.
- **Mots-clés** : `plus`, `encore`, `d'autres`, `autres`, `autre`, `voir plus`, `la suite`, `suivant`, **`ok`**, **`oui`** (ajout explicite utilisateur — répondre « oui » à « Envie de continuer ? » montre la suite).

## Design

### Détection du mot-clé « plus »

- Comparaison sur texte normalisé (même helper `normaliserTexte` que `CLOTURE`), correspondance exacte sur la liste ci-dessus.
- Testée en état `MENU`, **avant** `detecterFAQ` et avant le fallback « texte libre → recherche » — sinon « plus » partirait en recherche full-text.
- `ok merci` reste une clôture (`CLOTURE` est testée avant, correspondance exacte — pas de conflit avec `ok` seul).

### Contexte de session

Après chaque affichage de résultats (recherche, liste immo, liste télécom), le contexte de session (`whatsapp_sessions.context`, JSONB existant) stocke :

```json
{ "last": { "type": "search" | "immo" | "telecom", "query": "samsung", "shownIds": ["id1", "id2", ...] } }
```

- `query` présent uniquement pour `type: "search"`.
- `shownIds` cumule les IDs sur les pages successives (page 2 exclut pages 1+2, etc.).
- Une **nouvelle recherche** (même identique) réinitialise `last` — c'est « plus » qui pagine, pas la répétition de la requête.
- Les autres flux (alerte, commande, support, FAQ) ne touchent pas `last` s'ils n'affichent pas de résultats paginables — mais comme `setSession` remplace le contexte entier, ils l'écrasent de fait : acceptable, « plus » après un détour FAQ retombe sur le message « Plus de quoi ? ».

### Requêtes

- `searchContent(query, excludeIds = [])` : chaque sous-requête de l'UNION reçoit `AND id::text <> ALL($2)` (paramètre `text[]`, vide par défaut — additif, l'appel existant reste valide).
- Listes immo et télécom du menu : même filtre `AND id::text <> ALL($n)` ajouté à leurs requêtes, factorisées pour être appelées soit depuis le menu (excludeIds vide), soit depuis « plus ».

### Comportements

| Situation | Réponse |
|---|---|
| « plus » avec `last.type='search'` | relance `searchContent(last.query, last.shownIds)`, affiche via le rendu existant (`handleSearchQuery` factorisé), met à jour `shownIds` |
| « plus » avec `last.type='immo'` ou `'telecom'` | relance la liste correspondante en excluant `shownIds` |
| « plus » sans contexte `last` (session neuve/expirée/écrasée) | « 🔍 Plus de quoi ? Dites-moi ce que vous cherchez » + état `SEARCH_QUERY` |
| Plus aucun résultat | « ✅ Vous avez vu tout ce que j'ai pour *"…"*. Essayez d'autres mots-clés ou tapez *menu*. » (variante sans requête pour immo/télécom) + bouton menu/fin habituel |

### Hors scope

- Doublons de données en base (ex: deux « Samsung Galaxy 16 5G » distincts) — problème de dédoublonnage produits, pas de pagination.
- Pagination des résultats FAQ, alertes, commandes.
- Bouton interactif « Voir plus » (les reply buttons sont limités à 3 et déjà utilisés par menu/fin) — mots-clés texte uniquement.

## Tests / vérification

- `node -e` ou script de test local simulant `handleIncoming` avec une session mockée n'est pas en place — vérification par lecture + test réel WhatsApp en production (comme les chantiers chatbot précédents), plus `node --check` sur le fichier.
- Cas à vérifier manuellement : recherche → « plus » (nouveaux résultats), « plus » ×2 (3ᵉ page ou fin), « oui » après « Envie de continuer ? », « ok merci » (clôture, pas pagination), immo → « plus », télécom → « plus », « plus » à froid.
