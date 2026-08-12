# Plan de correction complet — mode offline

## Résultat attendu

Après une première visite connectée, la boutique et la caisse restent utilisables sans réseau. Chaque cache est isolé par utilisateur et boutique ; une vente offline ne peut être enregistrée qu'une fois au retour du réseau.

## Priorité 1 — Service worker

- Utiliser un timeout court pour les stratégies NetworkFirst.
- Ne jamais retourner un JSON vide avec HTTP 200 lorsqu'une API n'est pas en cache.
- Réserver le fallback HTML aux navigations document.
- Ne servir une réponse RSC que lorsqu'elle est réellement en cache.
- Versionner les caches et purger les versions obsolètes à l'activation.
- Ne mettre en cache que les requêtes GET sûres.

## Priorité 2 — Caches isolés

- Toutes les clés localStorage doivent inclure userId et boutiqueId.
- IndexedDB doit indexer produits, clients et ventes avec userId + boutiqueId.
- Ne jamais vider le cache de toutes les boutiques pour actualiser une seule boutique.
- Invalider les caches legacy non attribuables.
- Purger les caches privés lors de la déconnexion.
- Valider la boutique restaurée contre la liste de l'utilisateur courant.

## Priorité 3 — Détection desktop

- Garder les événements online/offline comme indices, sans les considérer comme une preuve d'accès internet.
- Ajouter une route légère de santé applicative.
- Vérifier cette route au démarrage, au focus, à l'événement online et avant une synchronisation POS.
- Appliquer timeout et backoff ; suspendre les vérifications quand l'onglet est masqué.
- Distinguer réseau absent, backend indisponible et synchronisation terminée dans l'UI.

## Priorité 4 — Ventes POS sans doublon

- Générer une clé UUID d'idempotence avant toute requête.
- La sauvegarder avec la vente dans IndexedDB et la transmettre à chaque reprise.
- Ajouter une contrainte SQL unique boutique_id + idempotency_key.
- Exécuter stock, vente, comptabilité et session dans une transaction PostgreSQL unique.
- Retourner la vente existante si la même clé est reçue.
- Supprimer la vente locale seulement après accusé confirmé.
- Afficher les erreurs métier comme conflits à traiter.
- Verrouiller la synchronisation par boutique.

## Tests de recette requis

1. Première visite online, coupure réseau, rechargement boutique puis caisse.
2. Wi-Fi actif mais backend coupé : fallback avant timeout.
3. Navigation RSC offline avec cache présent et absent.
4. AMAR → TECH → AMAR : données et file de ventes distinctes.
5. Deux comptes dans le même navigateur : aucune fuite de cache.
6. Vente offline, réponse perdue, reprise : une seule vente et une seule déduction de stock.
7. Mise à jour du service worker sans cache incompatible.

## Déploiement

1. Appliquer les migrations SQL avant le frontend.
2. Tester un profil navigateur vierge et un profil avec ancien SW.
3. Déployer d'abord en préproduction.
4. Suivre erreurs SW, taille des caches, latence de synchronisation, conflits et doublons.
5. Prévoir un flag permettant de désactiver le runtime caching API en cas d'incident.

