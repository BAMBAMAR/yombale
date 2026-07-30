# Directives et Règles Agentic AI (Nopalou)

## 📌 Règle Obligatoire de Documentation & Déploiement
- **Mise à Jour Systématique de `CLAUDE.md`** : À la fin de chaque session ou dès qu'un déploiement/push git (`origin main`) est effectué avec succès et sans aucune erreur remontée, l'assistant DOIT **systématiquement mettre à jour le fichier `CLAUDE.md`** avec le résumé précis des nouveautés, fonctionnalités ajoutées, migrations SQL et corrections effectuées.

## 🚫 Interdiction Absolue : Chargement Dynamique & Fetch Externe de Polices (Global Site & Images)
- **Bannissement Strict du `fetch` / Téléchargement de Polices Externes sur Tout le Projet** : Il est STRICTEMENT INTERDIT de télécharger, `fetch`, `@import` ou injecter des polices d'écriture dynamiquement depuis des CDN externes (ex: fichiers TTF/WOFF/WOFF2 depuis `cdn.jsdelivr.net`, Google Fonts CDN, unpkg, fontsource CDN, ou tout autre serveur tiers) sur L'ENSEMBLE DU SITE et de l'application (`frontend-next`, routes d'images `ImageResponse` / `@vercel/og` / Satori, API, styles, scripts).
- **Raison** : Évite les ralentissements réseau, les échecs au runtime edge/SSR/build, la dépendance à des CDN externes, garantit des temps de réponse ultra-rapides et évite les blocages d'affichage.
- **Alternative Obligatoire** : Utiliser exclusivement la pile de polices système native haute lisibilité (`fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'`) ou les polices système `var(--font-inter)` avec une mise en page CSS propre et des couleurs à fort contraste.
