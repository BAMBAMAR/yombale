# Directives et Règles Agentic AI (Nopalou)

## 🛑 Règle Absolue de Déploiement : Aucun Push Git sans Demande Explicite
- **Bannissement du Push Automatique** : L'assistant ne doit **JAMAIS** exécuter de `git push` de sa propre initiative.
- **Attente Ordre Utilisateur** : Les modifications de code peuvent être testées et préparées localement, mais un `git push` vers `origin main` ne doit être exécuté **QUE SI et SEULEMENT SI** l'utilisateur le demande explicitement (ex: *"push"*, *"pousse sur github"*, *"déploie"*).

## 📌 Règle Obligatoire de Documentation
- **Mise à Jour Systématique de `CLAUDE.md`** : À la fin de chaque session ou dès qu'un déploiement/push git (`origin main`) est validé et demandé par l'utilisateur, l'assistant DOIT **systématiquement mettre à jour le fichier `CLAUDE.md`** avec le résumé précis des nouveautés, fonctionnalités ajoutées, migrations SQL et corrections effectuées.

## 🚫 Interdiction Absolue : Chargement Dynamique & Fetch Externe de Polices (Global Site & Images)
- **Bannissement Strict du `fetch` / Téléchargement de Polices Externes sur Tout le Projet** : Il est STRICTEMENT INTERDIT de télécharger, `fetch`, `@import` ou injecter des polices d'écriture dynamiquement depuis des CDN externes (ex: fichiers TTF/WOFF/WOFF2 depuis `cdn.jsdelivr.net`, Google Fonts CDN, unpkg, fontsource CDN, ou tout autre serveur tiers) sur L'ENSEMBLE DU SITE et de l'application (`frontend-next`, routes d'images `ImageResponse` / `@vercel/og` / Satori, API, styles, scripts).
- **Raison** : Évite les ralentissements réseau, les échecs au runtime edge/SSR/build, la dépendance à des CDN externes, garantit des temps de réponse ultra-rapides et évite les blocages d'affichage.
- **Alternative Obligatoire** : Utiliser exclusivement la pile de polices système native haute lisibilité (`fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'`) ou les polices système `var(--font-inter)` avec une mise en page CSS propre et des couleurs à fort contraste.

## 🔑 Règle d'Authentification Git (GitHub Token)
- **Token Disponible** : Le jeton d'authentification GitHub (`GITHUB_TOKEN=<VOIR_DANS_.ENV>`) est disponible dans le fichier `.env` à la racine.
- **Utilisation pour les Push** : Lors d'une demande de `git push`, si l'environnement demande une authentification ou si vous devez configurer le remote URL pour pousser les modifications de manière automatisée, vous DEVEZ utiliser ce token.
- **Exemple de Remote** : `https://<TOKEN>@github.com/<utilisateur>/<repo>.git`

## 🛡️ Les 5 Règles d'Or Anti-IA-Slop & Standard Ingénieur Senior

1. **Bannissement des Béquilles Emojis dans l'UI** :
   - Les composants React / Next.js ne doivent pas utiliser d'émojis Unicode (`🏪`, `👑`, `⚡`, `💳`, `📦`, etc.) comme icônes d'interface ou de bouton.
   - Utiliser exclusivement les icônes vectorielles SVG de `lucide-react` avec un dimensionnement précis (14px, 16px, 18px).
   - *Linter* : `npm run lint:slop` dans `frontend-next`.

2. **Plafond de Taille des Composants & Modularisation** :
   - Aucun nouveau composant React ne doit dépasser 450 lignes.
   - Les blocs fonctionnels (modales, barres latérales de panier, claviers numériques, tableaux de données) doivent être extraits dans des sous-composants indépendants dans un sous-dossier `components/`.
   - Les styles globaux d'écrans majeurs doivent être logés dans des fichiers `.css` dédiés (ex: `caisse.css`), jamais dans des balises `<style jsx global>` monolithiques de 200 lignes.

3. **Respect Strict du Design System Nopalou (Zéro Couleurs Arbitraires)** :
   - Utiliser exclusivement les tokens CSS déclarés (`--navy: #1C2B4A`, `--accent: #C75B00`, `--price: #0A5C36`, `--bg: #F8F5F0`, `--border: #E8DDD2`) et les classes d'utilité globales (`.btn-npl`, `.badge-npl`).
   - Interdiction d'inventer des codes hex ad-hoc (`#0f172a`, `#ea580c`, `#22c55e`, etc.) en inline styles `style={{ color: '...' }}` qui bypassent les thèmes clair/sombre.

4. **Sécurité Multi-Tenant & Anti-IDOR Obligatoire (Backend & Actions)** :
   - Toute route d'API Express ou Server Action manipulant des données de boutique (`/api/boutiques/:id/...`) DOIT IMPÉRATIVEMENT valider l'appartenance avec le middleware `requireBoutiqueOwnership` ou `checkBoutiqueAccess` (`backend/middlewares/tenantSecurity.js`).
   - Ne jamais faire confiance aveuglément à un `boutiqueId` transmis dans l'URL ou dans le corps de requête sans vérifier qu'il appartient bien à l'utilisateur authentifié (`req.user.id`).
   - Toutes les routes 404 de l'API backend doivent retourner un payload JSON strict (`{ success: false, error: 'Not Found' }`) et ne JAMAIS servir une page HTML de fallback qui masque les erreurs côté client.

5. **Ergonomie Épurée, Zéro Redondance & Affichage Lié Uniquement au Contexte** :
   - **Zéro Encombrement de Boutons & Anti-Redondance** : Ne jamais surcharger l'écran avec une multitude de boutons d'actions statiques, lourds ou répétitifs. Pour les actions secondaires ou avancées, privilégier des tiroirs contextuels (Action Sheets légères) ou des menus fluides.
   - **Affichage Strictement Conditionnel au Contexte Réel** : Masquer tout panneau, formulaire ou bouton inutile ou vide (ex: masquer le formulaire/panier tant qu'il y a 0 article dans le panier, n'afficher que les contrôles pertinents pour l'étape en cours).
   - **Pleine Largeur & Zéro Espace Vide à Droite** : Toujours exploiter 100% de la largeur disponible (`width: 100%`). Privilégier les affichages en liste plutôt que des grilles de vignettes étroites qui laissent un vide blanc béant à droite.
   - **Alignement Monoligne Prioritaire** : Verrouiller les contrôles d'en-tête (vocal, scan, onglets) sur une seule et même ligne tant que l'espace le permet via `flexWrap: 'nowrap'` et `flexShrink: 0`.
   - **Lisibilité Produit sans Troncature Sauvage** : Pour les listes d'articles, découper en 2 sous-lignes calibrées (Ligne 1 : Nom complet lisible sans troncature agressive ; Ligne 2 : Prix FCFA et badge stock en `whiteSpace: 'nowrap'`), avec le bouton d'action calé à droite sans tronquer le texte ni déborder de la carte.


