# DIRECTIVES PERMANENTES & RÈGLES D'OR — SURGA (ASSISTANT DE POCHE DE NOPALOU)

> Ce fichier est livré sous le nom `CLAUDE_SURGA.md` pour ne jamais écraser un `CLAUDE.md`
> existant. Si le dépôt n'a pas de `CLAUDE.md`, renommez-le simplement. Sinon, l'agent fusionne
> les deux selon `docs/surga/INTEGRATION_NOPALOU.md`, section 4, et le résultat s'appelle
> `CLAUDE.md` à la racine.

> **Lire `docs/surga/INTEGRATION_NOPALOU.md` AVANT ce fichier.** Surga s'intègre dans le dépôt Nopalou
> existant (comparateur d'achats, Caisse PRO, pôle immobilier déjà en production). Ce n'est pas
> un projet neuf : l'agent audite l'existant, applique les règles de priorité et pose les
> questions listées dans ce protocole plutôt que de supposer.
>
> Ne génère aucun code avant d'avoir confirmé avoir assimilé ce fichier,
> `docs/surga/CAHIER_DES_CHARGES.md` et `docs/surga/PLAN.md`. Avant toute fonctionnalité touchant à la
> sécurité, la performance, l'UI, le déploiement, la devise, la modularité ou l'intégration,
> relire aussi `docs/surga/LECONS_APPRISES.md`.

## Hiérarchie de référence
- **Règles de l'agent** : ce fichier (une fois fusionné, `CLAUDE.md`). Le garder court : le
  détail vit dans les autres documents.
- **Périmètre fonctionnel** : `docs/surga/CAHIER_DES_CHARGES.md`.
- **Ordre de travail et statuts** : `docs/surga/PLAN.md`, seul endroit où les statuts évoluent.
- **Visuel** : `docs/surga/DESIGN.md`.
- **État réel du dépôt** : `docs/surga/AUDIT.md` (rempli en Phase 0).
- **Décisions tranchées** : `docs/surga/DECISIONS.md`, à consulter avant de rediscuter un point.
- En cas de contradiction : pour les règles, ce fichier l'emporte ; pour les fonctions, le
  cahier des charges.

## 0. Produit, Persona et Périmètre
- **Surga** est un assistant de poche personnalisable pour des utilisateurs actifs sur les
  réseaux sociaux (Android en majorité, donnée mobile comptée). Objectif : devenir indispensable
  par l'usage quotidien. Indicateur central : jours d'utilisation par semaine.
- **Signification du nom** : terme wolof pour le serviteur dévoué, loyal et fiable. Ton : direct,
  respectueux, proactif, sans détour.
- **Zéro émoji Unicode** partout (UI, messages du bot, code, documents). Icônes SVG
  `lucide-react` uniquement (14px, 16px, 18px).
- **Noyau** : profil et personnalisation, briefing quotidien, notes, dépenses structurées,
  calculatrice, agenda et rappels, commandes vocales, partage.
- **Briques activables** : actualités et revue de presse, sport, trafic, immobilier, concours,
  bons plans. Détail dans `docs/surga/CAHIER_DES_CHARGES.md`.
- **Hors périmètre, ne jamais toucher sans instruction explicite** : le comparateur d'achats et
  la Caisse PRO.

## 1. Architecture des canaux
- **L'app (PWA) est le produit principal.** La discussion libre avec l'assistant n'existe que
  dans l'app.
- **WhatsApp est un canal à tâches précises** : briefing, alertes, rappels, commandes
  structurées, notes vocales à transcrire. **Interdit** : exposer sur WhatsApp un assistant
  conversationnel généraliste (politique Meta sur l'API Business, en vigueur depuis le
  15 janvier 2026). En cas de doute sur un flux WhatsApp, poser la question avant d'implémenter.
- **L'audio d'écoute est une option désactivée par défaut** (lecteur dans l'app, flux podcast).
  Le comportement par défaut reste le texte.

## 2. Règles de fiabilité de l'assistant (non négociables)
- **Aucun calcul n'est effectué par le modèle d'IA.** Le modèle extrait l'opération, un moteur
  de calcul déterministe l'exécute (ex. `mathjs`). Même règle pour les totaux de dépenses.
- **Toute écriture déclenchée par la voix demande une confirmation** avant d'être enregistrée
  (montant, catégorie, date). Les chiffres issus de la transcription sont considérés comme
  incertains.
- **Les dépenses, notes et événements sont des données structurées**, pas du texte libre
  (montant en FCFA, catégorie, date).
- **Le contenu d'actualité est toujours sourcé** : lien vers la source, pas de reproduction
  intégrale d'articles, respect des conditions des flux RSS.
- **Quotas** : chaque appel de transcription ou d'IA est mesuré ; un quota gratuit journalier
  s'applique, le reste est réservé au premium.

## 3. Données personnelles
- Les notes, dépenses et événements sont sensibles : consentement explicite, stockage protégé,
  export et suppression complète à la demande de l'utilisateur.
- Ne jamais journaliser le contenu des notes ou des transcriptions en clair dans les logs.

## 4. Déploiement, Git & CI/CD
- **Interdiction du `git push` autonome** : attendre un ordre explicite de l'utilisateur.
- **Branche dédiée** (ex. `feature/surga`), jamais de développement direct sur `main`.
- **Journal** : ajouter le compte-rendu de chaque livraison en tête de
  `docs/surga/JOURNAL-LIVRAISONS.md` (jamais dans ce fichier).
- **CI** : pré-commit hooks existants (ou `npm run lint` à créer), couverture de tests > 70 %,
  build non bloquant.

## 5. Contrainte "Mobile-First Low-Data" (CRITIQUE)
- **Pages publiques (SSR)** : < 50 Ko transférés, HTML < 30 Ko, JS initial < 80 Ko.
- **App connectée** : budget propre à fixer à la Tranche 1 (point de départ proposé : JS initial
  < 120 Ko) puis tenu comme une règle. Aucune dépendance lourde ajoutée sans justification.
- Images AVIF qualité 60 %, `loading="lazy"`. Tailwind JIT avec purge stricte (réutiliser la
  config existante).
- Contenus de briefing et flashs : texte par défaut. Audio : pré-généré, compressé,
  téléchargeable en Wi-Fi, jamais lu en streaming par défaut.
- Mode hors ligne minimal : notes, dépenses, calculatrice et dernier briefing disponibles sans
  réseau, avec synchronisation au retour.

## 6. Modularité & Qualité de Code
- Aucun composant React > **450 lignes**. Extraire modales, formulaires, listes, écrans.
- Nouveaux modules Surga dans des dossiers dédiés (ex. `backend/routes/surga/`,
  `frontend/app/(surga)/`), isolés du comparateur et de la Caisse PRO.
- Chaque brique activable est un module indépendant, activable ou non par l'utilisateur.

## 7. Design System
Voir `docs/surga/DESIGN.md`. **Si une charte graphique est déjà établie dans le dépôt, elle prime**
(`docs/surga/INTEGRATION_NOPALOU.md`, section 2). Tokens de référence : `--paper` #F1EDE4, `--ink`
#1B2A2E, `--indigo` #2B4570, `--ocre` #C8722A, `--vert` #3F7A5C, `--rouge` #B23A2E. Contraste
7:1, texte de base 16px. Affichage conditionnel, listes pleine largeur, cartes en 2 sous-lignes,
actions secondaires dans des tiroirs contextuels.

## 8. Localisation Financière
Montants manipulés, stockés et affichés **exclusivement en FCFA (XOF)**. Aucune conversion.

## 9. Sécurité Multi-Tenant & API
- **Anti-IDOR obligatoire** sur toute ressource appartenant à un utilisateur ou un professionnel
  (notes, dépenses, annonces, fiches). Réutiliser le middleware existant s'il existe.
- Erreurs 404 en JSON strict : `{ success: false, error: 'Not Found' }`.
- Latences cibles : calcul local et réponses texte < 3 s ; note vocale transcrite et confirmée
  ~ 5 s ; `/search` P95 < 200 ms ; alertes livrées < 2 min.

## 10. Stack de Référence (cible, à confronter à l'existant)
Next.js 14 (App Router, PWA) + Tailwind JIT ; Node.js + Fastify ; PostgreSQL 16 + Prisma ;
Meilisearch ; Upstash Redis ; Web Push (VAPID) ; API Meta WhatsApp Business ; OTP SMS ;
Wave / Orange Money via PayDunya ou Bizao ; transcription vocale (fournisseur à choisir) ;
modèle d'IA pour comprendre les commandes et résumer ; Google Places API et flux RSS / API
sportive pour les briques. **L'existant prime** : si le dépôt utilise une autre stack
fonctionnelle, Surga est développé avec elle.

## 11. Suivi des Tâches
Statuts : `PROPOSED` → `IN_PROGRESS` → `IN_REVIEW` → `DONE` → `ARCHIVED`. Une tâche passe à
`DONE` après validation du critère de démonstration de sa tranche (`docs/surga/PLAN.md`) et des tests.
