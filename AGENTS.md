# Directives et Règles Agentic AI (Nopalou)

## 📌 Règle Obligatoire de Documentation & Déploiement
- **Mise à Jour Systématique de `CLAUDE.md`** : À la fin de chaque session ou dès qu'un déploiement/push git (`origin main`) est effectué avec succès et sans aucune erreur remontée, l'assistant DOIT **systématiquement mettre à jour le fichier `CLAUDE.md`** avec le résumé précis des nouveautés, fonctionnalités ajoutées, migrations SQL et corrections effectuées.

## 🚫 Interdiction Absolue : Chargement Dynamique de Polices dans Satori (`next/og`)
- **Bannissement Strict du `fetch` de Polices Externes** : Il est STRICTEMENT INTERDIT de télécharger/fetch des polices d'écriture dynamiques (ex: fichiers TTF/WOFF depuis `cdn.jsdelivr.net`, Google Fonts, ou tout autre CDN réseau) dans les routes de génération d'images `ImageResponse` / `@vercel/og` / Satori (`frontend-next/src/app/assets/...`).
- **Raison** : Évite les ralentissements réseau, les échecs au runtime edge/build, la dépendance à des CDN externes et garantit des temps de réponse instantanés.
- **Alternative Obligatoire** : Utiliser exclusivement la pile de polices système native haute lisibilité (`fontFamily: 'system-ui, -apple-system, sans-serif'`) avec une mise en page CSS propre et des couleurs à fort contraste.
