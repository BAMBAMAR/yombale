# OpenSpec Design — Architecture i18n & Stratégie Technique

## 1. Architecture Globale

```
frontend-next/src/
├── i18n/
│   ├── config.ts              # Définition des locales ('fr', 'en', 'ar'), helpers RTL, constantes
│   ├── types.ts               # Typage strict TS dérivé du schéma FR
│   ├── server.ts              # Helpers pour React Server Components (RSC) via cookies()
│   ├── context.tsx            # I18nProvider, useTranslation, useLocale pour Client Components
│   └── locales/
│       ├── fr/                # Dictionnaires modulaires (auth, account, boutique, caisse, common, errors)
│       ├── en/
│       └── ar/
├── components/
│   ├── LanguageSelector.tsx   # Sélecteur de langue UI multi-position
│   └── I18nClientProvider.tsx # Wrapper Client Provider pour l'arbre React
```

## 2. Gestion de l'état et Persistance

### 2.1 Cookie `nopalou_locale`
- **Nom** : `nopalou_locale`
- **Valeurs valides** : `'fr'` | `'en'` | `'ar'` (défaut : `'fr'`)
- **Attributs** : `path=/`, `max-age=31536000` (1 an), `SameSite=Lax`
- **Accessibilité** :
  - Côté serveur : `cookies().get('nopalou_locale')` dans `layout.tsx` et `middleware.ts`.
  - Côté client : `document.cookie` avec dispatch d'événement pour synchronisation immédiate sans rechargement forcé.

### 2.2 Middleware
- Intercepte les requêtes.
- Valide la présence du cookie `nopalou_locale`. S'il est manquant ou invalide, applique `'fr'`.
- Passe l'en-tête `x-locale` pour les Server Components.

## 3. Stratégie RTL & Typographie Arabe

### 3.1 Détection et injection HTML
Dans `src/app/layout.tsx` :
```tsx
const locale = getLocaleFromServer()
const dir = locale === 'ar' ? 'rtl' : 'ltr'

<html lang={locale} dir={dir}>
```

### 3.2 Typographie Native (Règle Anti-CDN)
Aucune police externe n'est téléchargée. Nous utilisons la pile système native arabophone :
```css
html[lang="ar"] {
  font-family: system-ui, -apple-system, "Segoe UI", Tahoma, "Geeza Pro", Arial, sans-serif;
}
```

### 3.3 CSS Logique
Remplacement des marges et positionnements absolus directionnels :
- `margin-left` / `margin-right` ➔ `margin-inline-start` / `margin-inline-end`
- `padding-left` / `padding-right` ➔ `padding-inline-start` / `padding-inline-end`
- `left` / `right` ➔ `inset-inline-start` / `inset-inline-end`

## 4. Typage strict TypeScript
Le schéma de clés est dérivé du dictionnaire français :
```ts
export type TranslationSchema = typeof fr
```
Toute omission dans `en` ou `ar` provoque une erreur de compilation TypeScript (`tsc`), garantissant une couverture de traduction à 100%.
