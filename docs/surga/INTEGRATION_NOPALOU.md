# PROTOCOLE D'INTÉGRATION — Surga dans le dépôt Nopalou existant

> **À lire en premier, avant `CLAUDE_SURGA.md` et tout autre document.** Surga ne se développe pas sur
> un dépôt vide : il s'intègre dans le code Nopalou en production (comparateur d'achats,
> Caisse PRO, pôle immobilier). Ce protocole définit l'audit à mener avant de coder, ce qui
> prime en cas de conflit, et les questions à poser à l'utilisateur.
>
> Règle générale : en cas de doute entre "l'existant" et ce que disent
> `docs/surga/CAHIER_DES_CHARGES.md` ou `docs/surga/DESIGN.md`, l'agent ne tranche jamais seul. Il pose la
> question correspondante (section 3), puis applique la réponse.

---

## 1. Audit Obligatoire Avant Toute Ligne de Code
L'agent exécute l'audit dans l'ordre et en rend compte par un résumé court (pas de pavé de code)
avant la Phase 0 de `docs/surga/PLAN.md`.

### 1.1. Gouvernance de l'agent
- [ ] Un `CLAUDE.md` (ou `.cursorrules`, `AGENTS.md`) existe-t-il à la racine ? Si oui, lister ses
  règles par thème (Git, sécurité, design, code). Ne jamais l'écraser.

### 1.2. Stack technique réelle
- [ ] Framework frontend et version (comparer à Next.js 14 App Router).
- [ ] Framework backend (Fastify, Express, autre).
- [ ] ORM et base de données réellement configurés (`schema.prisma` ou équivalent).
- [ ] Moteur de recherche (Meilisearch, Algolia, autre) déjà en place ?
- [ ] Cache / sessions (Redis, autre) déjà en place ?
- [ ] Système de paiement déjà intégré (Wave, Orange Money, PayDunya, Bizao) et sa forme.
- [ ] Authentification existante (OTP SMS, mot de passe) et fournisseur SMS.
- [ ] Tâches planifiées / files de jobs existantes (cron, queue) utilisables pour briefing,
  rappels et alertes.

### 1.3. WhatsApp, PWA et notifications
- [ ] L'API WhatsApp Business est-elle déjà connectée (numéro, webhook, templates approuvés) pour
  le comparateur ou la Caisse PRO ?
- [ ] Le site est-il déjà une PWA (manifest, service worker) ? Une infrastructure de notifications
  push web existe-t-elle ?
- [ ] La bulle "Assistant Nopalou" existe-t-elle en code (composant à réutiliser comme entrée
  vers Surga) ?

### 1.4. Modèle de données existant
- [ ] Un modèle `User` existe-t-il ? Lister ses champs.
- [ ] Des tables immobilières existent-elles (pôle immobilier) ? Noms et champs.
- [ ] Des tables de boutiques/commerçants existent-elles (Caisse PRO) ? Quel middleware
  multi-tenant est déjà utilisé (nom, fichier) ?

### 1.5. Design system existant
- [ ] Charte de couleurs, tokens CSS, config Tailwind existants ?
- [ ] Bibliothèque d'icônes utilisée (vectorielle, pas d'émojis) ?

### 1.6. Conventions et qualité
- [ ] Hooks de pré-commit, linter, CI existants et leur configuration ?
- [ ] Convention de taille/découpage des composants déjà en usage ?

---

## 2. Règles de Priorité en Cas de Conflit
| Sujet | Qui l'emporte | Pourquoi |
|---|---|---|
| Discipline Git | L'existant, sinon `CLAUDE_SURGA.md` | Ne pas perturber les habitudes en place |
| Design system | L'existant s'il est établi et cohérent | Une seule identité visuelle sur tout le site |
| Stack technique | L'existant, toujours | Ne pas réécrire une stack en production |
| Modèle `User` et auth | L'existant, étendu, jamais dupliqué | Un utilisateur Nopalou reste le même compte |
| Paiement Mobile Money | L'existant, réutilisé | Éviter deux intégrations parallèles |
| Règles de fiabilité de l'assistant (calcul déterministe, confirmation vocale, données personnelles) | `CLAUDE_SURGA.md` | Partie nouvelle, non couverte par l'existant |
| Canaux (app principale, WhatsApp à tâches précises) | `CLAUDE_SURGA.md` | Contrainte de politique Meta |
| Périmètre fonctionnel du noyau et des briques | `docs/surga/CAHIER_DES_CHARGES.md` | Partie réellement nouvelle |
| Sécurité anti-IDOR | Le plus strict des deux | La sécurité ne se négocie pas à la baisse |

---

## 3. Questions à Poser à l'Utilisateur (ne jamais supposer)
L'agent pose ces questions au fur et à mesure que l'audit les rend nécessaires, une par message.

**`CLAUDE.md` existant en conflit avec une règle Surga :**
> "Le dépôt a déjà une règle sur [sujet] qui dit [X], alors que les règles Surga disent [Y].
> Laquelle doit primer ?"

**Stack réelle différente de la stack cible :**
> "Le dépôt utilise [stack réelle] plutôt que [stack cible]. Je développe Surga avec la stack
> existante, ou voulez-vous migrer d'abord ?"

**Modèle `User` différent de celui attendu :**
> "Le modèle `User` a les champs [liste]. J'y ajoute le profil de personnalisation et les
> relations Surga directement, ou certains champs existent-ils sous un autre nom ?"

**Paiement déjà intégré :**
> "Un paiement [Wave/Orange Money/PayDunya] est déjà branché pour [usage]. Je le réutilise pour
> les abonnements et micro-paiements Surga, même compte marchand ou compte distinct ?"

**Charte graphique différente de `docs/surga/DESIGN.md` :**
> "Le design system en place utilise [palette/typo], différent de `docs/surga/DESIGN.md`. J'adopte le
> vôtre pour rester cohérent sur tout le site, confirmé ?"

**WhatsApp déjà utilisé ailleurs :**
> "Un webhook WhatsApp Business existe pour [usage]. Surga doit-il utiliser le même numéro avec
> routage par intention, ou un numéro dédié ? Quels templates sont déjà approuvés ?"

**Le site est déjà une PWA ou envoie déjà des notifications push :**
> "Une PWA / un service worker existe déjà ([détails]). Je l'étends pour Surga plutôt que d'en
> créer un second, confirmé ?"

**Bulle "Assistant Nopalou" présente en code :**
> "J'ai trouvé la bulle à [emplacement]. Je la fais pointer vers Surga, ou sert-elle déjà à
> autre chose à ne pas casser ?"

**Aucun élément existant sur un point :** l'agent applique directement la spécification de
`docs/surga/CAHIER_DES_CHARGES.md` / `docs/surga/DESIGN.md`, sans question.

---

## 4. Procédure de Fusion du `CLAUDE.md`
Si l'audit 1.1 confirme un `CLAUDE.md` existant :
1. Résumer ses règles par thème.
2. Comparer thème par thème avec le `CLAUDE_SURGA.md`.
3. Poser la question correspondante de la section 3 pour chaque conflit.
4. Écrire un seul fichier fusionné : une section commune en tête (règles transverses retenues)
   et une section `## Module Surga — Règles Spécifiques` ne contenant que ce qui est propre à
   Surga.
5. Le soumettre à l'utilisateur pour validation explicite avant usage.

---

## 5. Ce qu'il ne Faut Jamais Faire Sans Demander
- Écraser un `CLAUDE.md`, un `schema.prisma` ou un fichier de configuration existant.
- Créer un second modèle `User`, un second système d'auth ou une seconde intégration de
  paiement, même temporairement.
- Modifier le comparateur d'achats ou la Caisse PRO.
- Changer la palette de couleurs ou la bibliothèque d'icônes sans validation.
- Exposer un assistant conversationnel libre sur WhatsApp.
- Supposer qu'un silence vaut accord : sur un point bloquant, attendre la réponse (en avançant
  sur les tâches non bloquées).
