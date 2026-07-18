# Marketing boutique — faciliter le partage, pas ajouter des templates à copier

## Contexte

L'onglet Marketing de `/boutique` (`frontend-next/src/app/boutique/BoutiqueClient.tsx`, composant `MarketingBoutique` ligne ~982) est aujourd'hui minimal : deux cartes (lien boutique classique + lien assistant WhatsApp), chacune avec un bouton `📤 Partager` (`frontend-next/src/components/BoutonPartager.tsx`) qui ouvre un menu à 3 choix (copier le lien / partager sur WhatsApp / télécharger le visuel).

Le partage par produit individuel existe déjà, mais pas dans l'onglet Marketing : chaque ligne du catalogue produits (`CatalogueProduits`, même fichier, ligne ~1250) a son propre `BoutonPartager` avec un visuel dédié (`/assets/produit-boutique/[id]/story`).

**Objectif explicite du chantier** (demande directe de l'utilisateur) : ne pas ajouter de textes/templates que le marchand doit copier-coller lui-même — **faciliter le partage et réduire le travail réel du marchand**. Un petit commerçant sénégalais n'a ni le temps ni l'envie de réfléchir à quoi écrire ; chaque étape/choix en moins est un gain réel.

## Périmètre

Cinq changements, tous dans `frontend-next/` (aucune logique de scraping/paiement touchée) :

1. Partage produit en 1 clic (WhatsApp direct), message enrichi automatiquement
2. Traçage "jamais partagé" par produit (nouvelle colonne backend additive)
3. Bloc "Conseils & rappels" en haut de l'onglet Marketing, avec signal actionnable
4. "Pack de partage" boutique en 1 clic dans l'onglet Marketing
5. Refonte qualité du visuel story boutique (`/assets/boutique/[id]/story`)

Hors périmètre (tranché explicitement pendant le brainstorming) :
- Templates de texte à copier-coller (le kit admin Nopalou en a pour lui-même, ce n'est pas reconduit ici).
- Nouveaux canaux (Facebook/Instagram) dans `BoutonPartager` — WhatsApp reste le canal prioritaire unique, ajouter des choix irait à l'encontre de l'objectif "moins de décisions à prendre".
- Refonte du visuel story **produit** (`/assets/produit-boutique/[id]/story`) — jugé déjà correct, non retouché.
- Tout ce qui concerne les guides d'utilisation abonnés, les outils apporteur — chantiers séparés déjà identifiés ailleurs.

## 1. Partage produit en 1 clic (WhatsApp direct)

**Aujourd'hui** (`BoutiqueClient.tsx:1250-1254`) : le bouton `BoutonPartager` sur chaque carte produit ouvre un menu de 3 choix avant toute action.

**Changement** : l'action principale du bouton devient directe — un clic ouvre immédiatement `wa.me/?text=...` (WhatsApp) avec le message déjà composé, sans étape de menu intermédiaire. Les actions secondaires (copier le lien, télécharger le visuel) restent disponibles mais déplacées derrière un petit bouton `⋯` séparé, à côté du bouton principal — elles ne disparaissent pas, elles perdent juste la priorité.

**Message enrichi** : le message pré-rempli pour un produit intègre désormais une mention de promo quand elle existe. Actuellement (`BoutiqueClient.tsx:1252`) :
```
${p.nom}${p.prix ? ` — ${fcfa(p.prix)}` : ''}\n\n${lien}
```
Devient, quand `p.prix_barre` est renseigné et supérieur à `p.prix` :
```
🔥 ${p.nom} en promo : ${fcfa(p.prix)} au lieu de ${fcfa(p.prix_barre)} !\n\n${lien}
```
Sinon, le format actuel est conservé tel quel.

**Composant partagé** : `BoutonPartager` (`frontend-next/src/components/BoutonPartager.tsx`) est modifié pour accepter cette nouvelle disposition (action principale + menu secondaire réduit à 2 choix). Il est réutilisé tel quel par la carte boutique de l'onglet Marketing (point 4 ci-dessous) et par le catalogue produits — un seul composant, pas de duplication.

## 2. Traçage "jamais partagé" par produit

**Nouvelle colonne additive** : `boutique_produits.partage_le TIMESTAMPTZ` (nullable, pas de défaut — `NULL` signifie "jamais partagé"), ajoutée dans `backend/migrate-inline.js` à la suite des autres `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS` déjà présents (pattern établi, ex. `variantes`, `stock_quantite`).

**Mise à jour** : au clic sur l'action principale du `BoutonPartager` (WhatsApp) ou sur "copier le lien" d'un produit, un appel `PATCH` (ou équivalent) vers le backend met à jour `partage_le = NOW()` pour ce produit. Cet appel est **fire-and-forget côté UX** — aucun spinner, aucun blocage de l'action de partage elle-même ; un échec silencieux de cet appel ne doit jamais empêcher l'ouverture de WhatsApp ou la copie du lien.

**Nouvelle route backend** : `PATCH /api/boutiques/:boutiqueId/produits/:produitId/partage` (ou une extension de la route de mise à jour produit existante si plus simple — décision d'implémentation), qui se contente de poser `partage_le = NOW()`. Pas d'authentification supplémentaire au-delà de ce qui protège déjà les routes boutique existantes.

## 3. Bloc "Conseils & rappels" en haut de l'onglet Marketing

**Remplace** le texte d'intro statique actuel (`BoutiqueClient.tsx:1519`, "Partagez votre boutique pour attirer plus de clients.").

**Contenu dynamique** : si au moins un produit du catalogue a `partage_le IS NULL`, afficher un bandeau actionnable, par exemple :
> 📢 **3 produits n'ont jamais été partagés** — un partage régulier aide vos produits à être vus. [Voir ces produits →]

Le lien "Voir ces produits" bascule vers l'onglet Catalogue avec un filtre pré-appliqué sur les produits non partagés (réutilise le mécanisme de filtre déjà présent dans `CatalogueProduits`, ligne ~1049 `filtreStatut` — un nouveau filtre `jamais_partage` est ajouté à la même logique, pas un système parallèle).

Si tous les produits ont déjà été partagés au moins une fois, le bandeau affiche un message neutre positif (ex: "✅ Tous vos produits ont déjà été partagés au moins une fois.") plutôt que de disparaître — garde le bloc utile comme point d'ancrage visuel constant de l'onglet.

## 4. "Pack de partage" boutique en 1 clic

**Nouveau bouton** dans la carte boutique existante de l'onglet Marketing (`BoutiqueClient.tsx:994-1015`, la carte avec logo + nom + lien boutique). Aujourd'hui cette carte a déjà un `BoutonPartager` — après le point 1, il devient lui aussi une action WhatsApp directe en 1 clic (message boutique déjà composé, `messageBoutique` existant ligne 985), sans étape de menu — cohérent avec le comportement produit du point 1, pas un bouton en plus, la simplification du bouton existant EST le "pack de partage en 1 clic".

Pas de nouvelle fonctionnalité technique distincte ici — ce point formalise que la carte boutique suit la même simplification que les cartes produit, avec le même composant `BoutonPartager` mis à jour.

## 5. Refonte qualité du visuel story boutique

**Fichier** : `frontend-next/src/app/assets/boutique/[id]/story/route.tsx` — route `ImageResponse` (`next/og`), même famille technique que le visuel chatbot déjà refondu dans le chantier précédent.

**Direction** : appliquer le même niveau d'exigence visuelle que la refonte du visuel `/assets/chatbot-whatsapp` (composition intentionnelle plutôt que template plat) — mettre en valeur le logo et le nom de la boutique, avec une identité visuelle cohérente avec la marque Nopalou (couleurs `#1C2B4A`, `#C75B00`, et éventuellement les couleurs propres de la boutique si elles sont disponibles dans les données — à vérifier en implémentation, ne pas inventer un champ qui n'existe pas).

**Contraintes techniques identiques au chantier précédent** : `export const runtime = 'edge'` obligatoire (bug documenté `next/og` sous Windows/Node runtime), dimensions à conserver telles quelles — 1080×1920 (format story, confirmé dans le fichier actuel).

## Vérification

- `npx tsc --noEmit` propre côté `frontend-next`.
- Migration `partage_le` testée : colonne présente en base après redémarrage backend local, `NULL` par défaut sur les produits existants.
- Parcours manuel local : partager un produit avec promo (vérifier le message enrichi), partager un produit sans promo (message inchangé), vérifier `partage_le` se met à jour après partage, vérifier le bandeau de conseils reflète correctement le nombre de produits jamais partagés, vérifier le rendu du visuel story boutique refondu dans un navigateur.
- Aucun outil d'automatisation navigateur disponible dans l'environnement (limite déjà documentée sur ce projet) — vérification visuelle via fetch direct de la route `ImageResponse` et lecture de l'image générée.
