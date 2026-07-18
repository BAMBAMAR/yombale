# Kit communication — mise à jour du volet assistant WhatsApp

## Contexte

Le « Kit assistant WhatsApp » de `/admin/communication` (`CHATBOT_FONCTIONS`, `CHATBOT_TEXTE`) et la page publique `/assistant-whatsapp` datent du 6-7 juillet 2026 et ne listent que 6 fonctions figées : recherche produit/annonce, annonces immo, offres télécom, alerte de prix, suivi de commande, support.

Depuis, le chatbot (`backend/services/whatsapp-chatbot.js`) a gagné des capacités jamais reflétées dans ces deux endroits :
- **Boutiques marchandes** : parcourir une boutique par lien direct (`boutique_{slug}`), rechercher/parcourir par catégorie ses produits, passer commande dans le chat (nom, téléphone, adresse, zone de livraison, mode de paiement), suivi.
- **Panier natif WhatsApp/Meta Commerce** : un client compose un panier multi-produits directement depuis le catalogue Meta et l'envoie d'un coup (`traiterPanierMeta`), sans passer par la recherche texte.
- **FAQ par mots-clés** (`FAQ` array) : gratuit/payant, publier annonce/immo, boutique, comparer, favoris, apporteur, télécom, comment ça marche.
- **Recherche unifiée** couvrant désormais le vrai marketplace scrapé (table `produits`, 3000+ fiches) en plus des boutiques marchandes — le kit actuel ne précise pas l'étendue réelle du catalogue.
- **Pagination "plus/encore/d'autres"** sur les résultats — mécanique interne, pas une fonction à lister séparément, mais qui change l'expérience perçue (mentionnée en une phrase, pas comme point à part).

Le volet boutique/commande/panier est probablement l'argument de vente le plus fort auprès des commerçants (vendre depuis WhatsApp sans app) — il doit être mis en avant, pas noyé dans une liste plate.

## Périmètre

Trois fichiers, contenu et présentation uniquement (aucune logique backend touchée) :

1. `frontend-next/src/app/admin/(protected)/communication/page.tsx` — section « Kit assistant WhatsApp » (`CHATBOT_FONCTIONS`, `CHATBOT_TEXTE`)
2. `frontend-next/src/app/assistant-whatsapp/page.tsx` — page publique (`FONCTIONS`)
3. `frontend-next/src/app/assets/chatbot-whatsapp/route.tsx` — visuel `ImageResponse` partagé sur les réseaux

Hors périmètre : le kit démarchage B2B (`ARGUMENTAIRE_B2B`, objections, script oral, plan de démarchage), le programme apporteur (traité dans un chantier séparé), toute modification du chatbot lui-même.

## Structure de contenu (remplace la liste plate de 6 fonctions)

Regroupement en 4 thèmes, chacun avec un titre de groupe + ses points, au lieu d'une liste numérotée à plat. Ordre voulu (Boutiques & achat en position forte, juste après la recherche) :

### 1. 🔍 Recherche & comparaison
- Recherche en texte libre couvrant tout le catalogue : produits scrapés du comparateur (3000+ fiches, tous marchands) **et** boutiques marchandes Nopalou, en une seule requête.
- Annonces immobilières (appartements, villas, terrains) envoyées avec photo, prix et lien.
- Offres télécom (Orange, Yas, Expresso, Promobile) à jour.
- Mention courte de la pagination : « Dites *plus* ou *encore* pour voir d'autres résultats sans reformuler votre recherche. »

### 2. 🛍️ Boutiques & achat — *argument de vente principal*
- Parcourir une boutique précise via un lien direct partagé par le commerçant, ou par catégorie/secteur.
- Commander directement dans la conversation : le client choisit ses produits, indique ses coordonnées et son mode de livraison/paiement, sans quitter WhatsApp.
- **Panier multi-produits natif** : depuis le catalogue WhatsApp/Meta Commerce d'une boutique, le client peut composer un panier avec plusieurs articles et l'envoyer en une seule fois — pas besoin de chercher chaque produit un par un.
- Vue d'ensemble orientée bénéfice (pas de détail des champs du formulaire de commande) : « Un client peut parcourir votre boutique, choisir plusieurs produits à la fois et commander — vous recevez la commande directement sur WhatsApp, sans app à installer. »

### 3. 🔔 Alertes & suivi
- Alerte de prix personnalisée : le client indique un produit et un prix cible, notifié dès que le seuil est atteint, sans compte requis.
- Suivi de commande par référence (ex: PAY-12345) → statut et montant.

### 4. ❓ Questions fréquentes & support
- Le bot répond automatiquement aux questions courantes sur le fonctionnement du site : gratuit/payant, comment publier une annonce ou un bien immo, comment créer une boutique, comment comparer, favoris, programme apporteur, forfaits télécom, guide général.
- Sinon, coordonnées de l'équipe Nopalou en un message.

## Kit admin (`/admin/communication`)

- `CHATBOT_FONCTIONS` devient un tableau de groupes `{ titre, items: [{ titre, detail }] }` (ou structure équivalente) au lieu d'une liste plate — le rendu existant (cercle numéroté + titre + detail) est conservé **par groupe**, avec un sous-titre de section entre chaque groupe (même style que les `<h2>` de section existants, décliné en `<h3>` pour rester sous le `<h2>` global "⚙️ Ce que le chatbot sait faire").
- `CHATBOT_TEXTE` (texte d'annonce à copier-coller) réécrit pour mentionner explicitement boutiques/achat/panier et FAQ, pas seulement les 6 fonctions d'origine — reste un seul bloc `<pre>` copiable comme aujourd'hui.

## Page publique (`/assistant-whatsapp`)

- `FONCTIONS` restructuré selon les mêmes 4 groupes, ton adapté au grand public (déjà le cas pour les 6 items actuels — on garde ce registre).
- Le bloc « Boutiques & achat » gagne en visibilité (peut-être un léger traitement visuel distinct, à trancher pendant l'implémentation en gardant la cohérence avec le reste de la page) puisqu'il concerne autant les acheteurs (commander facilement) que les commerçants qui liraient cette page.
- Bandeau CTA WhatsApp en haut de page inchangé.

## Visuel `/assets/chatbot-whatsapp`

Refonte complète pour une qualité visuelle nettement supérieure à la version actuelle (liste de bullet-points sur fond dégradé uni) :
- Contenu mis à jour : ne plus lister seulement les 6 anciennes fonctions en dur dans le texte — représenter les 4 groupes (ou une sélection resserrée pour ne pas surcharger un visuel carré 1080×1080), avec Boutiques & achat visible.
- Traitement graphique à revoir (composition, hiérarchie, éventuellement un élément de mockup de conversation WhatsApp plutôt qu'une simple liste centrée) — décision de détail prise pendant l'implémentation, en invoquant le skill `frontend-design` pour calibrer la direction artistique avant de coder le JSX de `ImageResponse`.
- Contraintes techniques à conserver : `runtime = 'edge'` (obligatoire pour `next/og` sur ce projet, cf. piège documenté dans CLAUDE.md), dimensions 1080×1080.

## Hors-scope explicite

- Pas de modification du chatbot (`whatsapp-chatbot.js`) lui-même.
- Pas de traitement du kit démarchage B2B, du programme apporteur, des guides abonnés ni du partage social — chantiers séparés à venir.
- Pas de nouvelle page ni de nouvelle route — uniquement le contenu/présentation des 3 fichiers listés.

## Vérification

- `npx tsc --noEmit` propre côté `frontend-next`.
- Relecture visuelle du kit admin et de la page publique en local (`npm run dev`), et du visuel généré par `/assets/chatbot-whatsapp` dans un navigateur.
- Confirmer qu'aucune fonction réelle du chatbot (cf. `whatsapp-chatbot.js`) n'est absente des 4 groupes.
