# Fiabilisation du catalogue Meta/WhatsApp — Chantier 1/3 "Marketing boutique"

## Contexte

Ce chantier est le premier d'une série de trois visant à faciliter le marketing des vendeurs boutique sur Nopalou :

1. **Fiabiliser le catalogue Meta/WhatsApp** (ce document)
2. Simplifier l'ajout de produit (mode rapide vs détaillé)
3. Outils de partage et de publicité (visuel prêt-à-partager, bouton partage, kit boutique, aide au boost Meta)

Un audit du code (7 juillet 2026) a établi que la synchronisation automatique des produits boutique vers le catalogue Meta Commerce existe déjà (`backend/services/whatsapp-catalog.js`, déclenchée à chaque création/modification/suppression de produit depuis `backend/routes/boutiques.js`), mais que l'utilisateur du projet a signalé que **le catalogue ne fonctionne pas** en pratique. Un diagnostic ciblé a confirmé la cause : ce n'est pas un bug de code cachė, c'est une **configuration jamais terminée**, documentée comme telle dans le propre `docs/LANCEMENT-CHECKLIST.md` du projet ("`WHATSAPP_CATALOG_ID` — optionnel, toujours pas configuré") et confirmée par `render.yaml` (la variable est déclarée avec `sync: false`, donc jamais assignée automatiquement).

Concrètement, trois choses manquent, dans cet ordre de dépendance :
1. Le catalogue Meta Commerce n'a probablement jamais été créé ni lié au WABA de production côté Meta Commerce Manager (démarche externe, pas du code).
2. `WHATSAPP_CATALOG_ID` n'a jamais été posé sur Render — sans cette valeur, `guard()` dans `whatsapp-catalog.js` bloque silencieusement toute tentative de synchro avant même le premier appel HTTP à Meta.
3. Aucune synchro initiale (`POST /api/boutiques/admin/sync-catalog`, déjà codée) n'a jamais été lancée pour rattraper les produits déjà en base.

Une fois ces trois points résolus, l'audit a aussi révélé des limites fonctionnelles à corriger : le payload envoyé à Meta laisse tomber des données déjà en base (marque, état, prix barré, catégorie), aucune erreur de synchro n'est visible pour le vendeur ni l'admin, l'identité de la boutique n'apparaît pas dans la fiche produit vue par l'acheteur côté WhatsApp, et le vendeur n'a aucun moyen d'organiser/filtrer ses propres produits dans son dashboard.

**Décision validée avec l'utilisateur** : on reste sur le catalogue Meta **partagé** (un seul compte WhatsApp Business Nopalou pour toute la plateforme), pas de connexion de compte Meta personnel par boutique. Ce choix est cohérent avec le positionnement marketplace de Nopalou (comme Jumia) — le numéro WhatsApp vérifié Nopalou reste le point de contact unique, et la recherche chatbot reste unifiée tous vendeurs confondus. Une connexion de compte personnel par boutique (OAuth Meta Embedded Signup) reste un chantier séparé, à envisager plus tard si des vendeurs Business le demandent explicitement.

## Étape 0 — Configuration Meta (préalable, hors code)

À faire avant tout développement, pour ne pas coder une amélioration invérifiable :

1. **business.facebook.com → Catalogue Manager → Créer un catalogue**, type "E-commerce".
2. Lier le catalogue au Business Manager Nopalou (SKYROAD SARL, déjà vérifié).
3. **WhatsApp Manager → Catalogue → connecter ce catalogue au WABA de production** (`901008702321523`, le vrai numéro `+221 70 87179 42` — **pas** le WABA de test `1663286391571815`, piège déjà rencontré une fois sur ce projet pour les messages).
4. Noter l'ID du catalogue (visible dans l'URL ou Catalogue Manager → Paramètres) → variable `WHATSAPP_CATALOG_ID` sur Render.
5. Vérifier via `GET /v19.0/{waba_id}/subscribed_apps` et l'équivalent catalogue que la liaison est bien active côté Meta (pas seulement déclarée côté Nopalou) — même prudence que celle qui avait révélé le problème du double WABA en juillet.
6. Une fois posé et déployé, lancer `POST /api/boutiques/admin/sync-catalog` (route existante, admin-only) pour rattraper tous les produits déjà en base.
7. Vérifier dans **Catalogue Manager → Articles** que les produits apparaissent en statut "Actif" (un statut "Rejeté" indique le plus souvent une image invalide ou un prix manquant).

Cette étape est effectuée par l'utilisateur (ou guidée en direct), pas par du code — elle conditionne le reste du chantier.

## Ce qui est développé (une fois l'étape 0 validée)

### 1. Compléter le payload envoyé à Meta

`whatsapp-catalog.js` → `syncProduit()` envoie aujourd'hui `retailer_id`, `name`, `description`, `price`, `currency`, `availability`, `url`, `image_url` — en laissant tomber des données pourtant déjà en base :

- `brand` ← `produit.caracteristiques?.marque` (présent pour la plupart des catégories : smartphones, informatique, tv-electro, mode, alimentation, beauté).
- `condition` ← mappé depuis `caracteristiques?.etat` (valeurs Nopalou : Neuf/Bon état/Occasion/Pour pièces) vers les valeurs Meta (`new`/`used`/`refurbished`) ; défaut raisonnable si absent.
- `sale_price` + `sale_price_effective_date` ← `produit.prix_barre` quand renseigné et supérieur à `prix` (le prix barré est déjà affiché à l'acheteur sur la fiche produit Nopalou — cohérence à maintenir côté Meta).
- `category` ← la catégorie Nopalou du produit (mapping simple vers une valeur de catégorie Meta acceptable, pas besoin d'une taxonomie Google Product Category complète pour ce chantier).

### 2. Rendre la synchro visible (badge de statut par produit)

Ajout de deux colonnes sur `boutique_produits` :
- `whatsapp_sync_statut` — `'synchronise' | 'en_attente' | 'echec'`, défaut `'en_attente'` à la création.
- `whatsapp_sync_erreur` — texte nullable, message d'erreur brut de Meta en cas d'échec (utile pour diagnostiquer un rejet "image invalide" ou "prix manquant" sans devoir aller dans Meta Commerce Manager).

`syncProduit()`/`deleteProduit()` mettent à jour ces colonnes après chaque tentative (succès ou échec) au lieu de se contenter d'un `console.error` invisible côté produit.

Dans l'onglet Catalogue du dashboard boutique (`CatalogueProduits` dans `BoutiqueClient.tsx`), chaque carte produit affiche un badge : "✓ Sur WhatsApp" (vert) / "⏳ En attente" (neutre) / "✗ Échec" (rouge, avec le message d'erreur au survol/clic) — cohérent avec le système de badges de statut déjà utilisé ailleurs dans le dashboard (ex. statuts de commande).

### 3. Le vendeur reste visible dans le catalogue partagé

Le template WhatsApp qui présente un produit à l'acheteur (`sendFiche`/`sendWhatsAppProduct` dans `whatsapp.js`) inclut le nom de la boutique dans le texte du message accompagnant la fiche produit (ex. "iPhone 13 — 250 000 FCFA — *Boutique TechDakar*"). Le lien déjà présent dans `syncProduit()` (`url` vers `/boutiques/{slug}/produits/{id}`) est conservé tel quel — il ramène déjà correctement vers la bonne boutique.

### 4. Le vendeur organise ses propres produits

Dans l'onglet Catalogue du dashboard (déjà scopé à `boutique_id` — aucun changement de périmètre de données, uniquement l'ajout de contrôles de tri/filtre côté frontend) :
- Recherche texte sur le nom du produit.
- Filtre par statut de synchro (Synchronisé / En attente / Échec).
- Filtre par catégorie (déjà existant comme donnée, jamais exposé comme filtre ici).

### 5. L'acheteur retrouve les produits d'une boutique précise via le chatbot

Le nom de la boutique est ajouté à chaque résultat de recherche produit renvoyé par le chatbot WhatsApp (`whatsapp-chatbot.js`, fonction `searchContent()`), qu'il s'agisse d'un produit marketplace ou d'un produit boutique — actuellement seul le nom du produit et son prix apparaissent, sans indiquer la boutique d'origine. Une reconnaissance de nom de boutique dans la requête libre (ex. "produits de Boutique TechDakar") est un raffinement possible mais hors du périmètre strict de ce chantier si l'effort s'avère disproportionné à l'implémentation — l'affichage systématique du nom de la boutique sur chaque résultat est en revanche non négociable pour ce chantier, car c'est le minimum pour que l'acheteur sache déjà quelle boutique lui répond.

## Hors périmètre (explicitement)

- Connexion de compte WhatsApp Business personnel par boutique (OAuth Meta Embedded Signup) — chantier séparé, futur, si demande explicite de vendeurs Business.
- Taxonomie Google Product Category complète pour le champ `category` Meta — un mapping simple suffit ici.
- Aperçu visuel simulé de la fiche WhatsApp dans le dashboard vendeur — le badge de statut textuel suffit pour ce chantier.
- Facebook/Instagram Shops (produit Meta distinct du catalogue WhatsApp), campagnes publicitaires Meta, partage en Statut/Story — traités dans le Chantier 3.

## Vérification

- Configuration Meta : produits visibles en statut "Actif" dans Catalogue Manager après la synchro initiale.
- Payload : inspecter un produit avec marque/état/prix barré renseignés et confirmer via l'API Graph (`GET /{catalog_id}/products`) que `brand`, `condition`, `sale_price`, `category` sont bien présents.
- Badge de statut : créer un produit avec `WHATSAPP_CATALOG_ID` temporairement invalide pour vérifier qu'il passe bien en "✗ Échec" avec un message, puis corriger et vérifier qu'une nouvelle tentative (à la prochaine modification, ou via un nouveau bouton "Réessayer" si retenu à l'implémentation) le repasse en "✓ Synchronisé".
- Nom de boutique visible : envoyer un message de test WhatsApp réel (vers un numéro autorisé) déclenchant `sendFiche('produit', ...)` et confirmer visuellement que le nom de la boutique apparaît dans le message reçu.
- Filtres dashboard : vérifier manuellement dans le navigateur que la recherche/filtre fonctionne sur un compte boutique avec plusieurs produits de catégories/statuts différents.
- Recherche chatbot : envoyer une recherche produit de test réelle et confirmer que le nom de la boutique apparaît dans chaque résultat retourné.
