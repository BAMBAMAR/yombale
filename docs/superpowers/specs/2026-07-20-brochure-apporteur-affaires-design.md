# Brochure commerciale PDF — Programme apporteur d'affaires

Date : 2026-07-20

## Contexte

Le programme apporteur d'affaires existe déjà (`/compte/apporteur`, backend `/api/apporteurs/*`) et dispose d'un kit de présentation interne sur `/admin/communication` (visuel 1080×1080, texte de recrutement, grille de commission, argumentaire court). Ce kit est pensé pour l'admin (Nopalou) qui recrute des apporteurs — il n'existe rien qu'un apporteur déjà actif puisse **remettre lui-même** à un commerçant prospect pour présenter le site et l'inciter à créer sa boutique.

Objectif : une brochure commerciale PDF, téléchargeable, que l'apporteur peut envoyer par WhatsApp/email ou imprimer, qui présente le site, les avantages d'un compte boutique, et un guide pratique — pour qu'une personne qui la reçoit puisse immédiatement comprendre l'offre et, côté apporteur, savoir comment démarrer son rôle.

## Portée

- Nouvelle route Next.js générant un PDF A4 de 5 pages, servie à `/assets/brochure-apporteur.pdf`.
- Lien vers cette brochure ajouté sur `/compte/apporteur` (à côté du visuel déjà proposé) et dans le kit admin `/admin/communication` (section programme apporteur).
- Aucune nouvelle donnée backend : la brochure lit `/api/settings/public` (déjà exposé) pour les tarifs/taux, exactement comme le fait déjà `/admin/communication`.
- Hors périmètre : FAQ complète, plan de démarchage terrain, argumentaire objections détaillé (réservés au kit admin interne) ; personnalisation du PDF avec le nom/code de l'apporteur (le PDF est générique, l'apporteur ajoute son lien/code lui-même au moment de l'envoi — cohérent avec le fait que le kit admin actuel ne personnalise pas non plus ses visuels).

## Génération technique

- **HTML source** : `frontend-next/src/app/assets/brochure-apporteur/route.tsx` — route `GET` qui retourne le HTML complet des 5 pages (une `<section>` par page, `break-after: page` en CSS print), stylée en styles inline React comme le reste du kit (`/admin/communication`, routes `ImageResponse`). Sert aussi d'aperçu navigateur direct.
- **PDF** : `frontend-next/src/app/assets/brochure-apporteur.pdf/route.tsx` — route `GET` qui lance Playwright (déjà en devDependency, `frontend-next/package.json`), navigue vers la route HTML ci-dessus (fetch interne côté serveur), appelle `page.pdf({ format: 'A4', printBackground: true })`, retourne le buffer avec `Content-Type: application/pdf` et `Content-Disposition: inline; filename="nopalou-brochure-apporteur.pdf"`.
- `runtime` Node (pas edge) sur les deux routes — Playwright a besoin de Node, comme documenté pour `/assets/carte-visite` (piège déjà connu sur ce projet : `next/og`/edge ne conviennent pas partout).
- Données dynamiques (`prixPro`, `prixBusiness`, `commissionBusiness`, `tauxApporteur`) lues depuis `${BACKEND_URL}/api/settings/public`, avec les mêmes valeurs de repli que `/admin/communication` (15000 / 35000 / 2 / 10) si le fetch échoue.

## Contenu — 5 pages A4

### Page 1 — Couverture
- Logo Nopalou (bloc "N" orange + wordmark, identique au visuel apporteur existant).
- Titre : "Devenez apporteur d'affaires Nopalou".
- Accroche 1 ligne : ex. "Présentez Nopalou aux commerçants de votre réseau et touchez une commission chaque mois."
- Fond dégradé bleu marine + halos orange (réutilise la palette de `assets/apporteur-affaires/route.tsx`).

### Page 2 — C'est quoi Nopalou
- Pitch en 3-4 lignes (comparateur de prix + immo + télécom + boutiques, 100% Sénégal/Dakar).
- 5 mini-cartes verticales (emoji + titre + 1 phrase) : Produits (comparateur multi-marchands), Immobilier, Télécom (forfaits opérateurs), Boutiques en ligne, Annonces classifiées.
- Pas de captures d'écran réelles (aucun outil de capture disponible) — blocs stylés cohérents avec l'identité visuelle du kit existant.

### Page 3 — Le programme apporteur
- Bandeau taux de commission (ex. "10% récurrent", valeur dynamique).
- Tableau grille de commission par formule (réutilise la logique de `getApporteurExemples` de `/admin/communication`).
- 3 étapes "Comment ça marche" (réutilise le texte des `ETAPES` de `ApporteurClient.tsx`).
- Argumentaire court "Quoi dire à un commerçant" (même citation que sur `/compte/apporteur`).

### Page 4 — Guide pratique pour démarrer (destiné à l'apporteur lui-même)
4 étapes numérotées :
1. Activer son statut sur `nopalou.com/compte/apporteur`.
2. Récupérer son code et son lien unique.
3. Le partager (WhatsApp avec le message pré-rempli existant, en personne, réseaux).
4. Suivre ses commissions dues/payées depuis la même page.

### Page 5 — Contact / CTA
- Rappel : "Aucun investissement, paiement mensuel, sans limite de recrutement" (texte déjà utilisé sur le visuel apporteur).
- Lien `nopalou.com/compte/apporteur`.
- Contact WhatsApp officiel Nopalou.

## Intégration dans le produit

- `/compte/apporteur` (`ApporteurClient.tsx`) : un bouton "📄 Télécharger la brochure PDF" à côté du bouton existant "🖼 Télécharger le visuel", pointant vers `/assets/brochure-apporteur.pdf`.
- `/admin/communication` : dans la section "💼 Programme apporteur d'affaires" déjà existante, un lien vers la brochure PDF à côté du texte de recrutement.

## Erreurs et dégradation

- Si `/api/settings/public` échoue : valeurs de repli (mêmes que le kit admin), pas d'erreur visible.
- Si Playwright échoue à générer le PDF (environnement sans navigateur headless disponible, ex. certains PaaS) : la route retourne une erreur 500 explicite plutôt qu'un fichier corrompu ; le lien HTML brut (`/assets/brochure-apporteur`) reste consultable indépendamment comme repli manuel (impression navigateur → PDF).

## Non couvert / dette assumée

- Pas de personnalisation automatique du PDF par apporteur (nom, code, QR code) — reste un document générique, cohérent avec le reste du kit.
- Pas de vérification par génération réelle du PDF dans un navigateur Windows local avant merge, si Playwright pose un problème d'environnement connu sur ce projet (voir CLAUDE.md, pièges Windows/`@vercel/og` déjà documentés) — à tester en priorité pendant l'implémentation, avec repli sur la version HTML si le PDF Playwright s'avère instable en local.
