# Spec : Pages protégées Next.js — /compte, /mes-annonces, /boutique

**Date :** 2026-06-23
**Projet :** Nopalou — migration Next.js (suite v44)
**Scope :** Création des 3 pages protégées utilisant `verifySession()` du DAL

---

## Contexte

La migration Next.js dispose depuis v44 d'une base sécurité solide (httpOnly cookies, CSP nonce, DAL, Server Actions auth). Les routes `/compte`, `/mes-annonces`, `/boutique` sont déjà listées dans `PROTECTED_ROUTES` dans `middleware.ts` — elles redirigent vers `/connexion` si non connecté, mais n'existent pas encore.

Le backend Express expose déjà :
- `GET /api/annonces/mine` — annonces de l'utilisateur connecté
- `DELETE /api/annonces/mine/:id` — suppression soft
- `GET /api/boutiques/mine` — boutiques de l'utilisateur
- `POST /api/boutiques` — créer (multipart, logo Cloudinary)
- `PUT /api/boutiques/:id` — modifier (multipart)
- `DELETE /api/boutiques/:id` — supprimer

---

## Architecture générale

**Pattern :** Server Components pour la lecture, Server Actions pour toutes les mutations.

**Auth cross-système :** Le backend Express attend `Authorization: Bearer <token>` signé avec `JWT_SECRET`. Les Server Actions lisent la session via `verifySession()` (DAL), signent un JWT court (1 minute) avec `JWT_SECRET`, et l'envoient en Bearer à chaque appel Express. Zéro modification du backend.

**Helper partagé :** `src/lib/backend-fetch.ts` — signe le JWT et appelle Express. Toutes les Server Actions passent par ce helper pour éviter la duplication.

```ts
// src/lib/backend-fetch.ts
import 'server-only'
import { SignJWT } from 'jose'
import { verifySession } from './dal'

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000'

export async function backendFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await verifySession()
  const token = await new SignJWT({ userId: session.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1m')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET))

  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })
}
```

**Variable d'env à ajouter dans `frontend-next` :**
```
JWT_SECRET=<même valeur que le backend>
```
`JWT_SECRET` est server-only (pas de préfixe `NEXT_PUBLIC_`).

---

## Fichiers à créer

```
frontend-next/src/
├── lib/
│   └── backend-fetch.ts             ← helper JWT + fetch
├── app/
│   ├── compte/
│   │   └── page.tsx                 ← Server Component, hub navigation
│   ├── mes-annonces/
│   │   ├── page.tsx                 ← Server Component, fetch liste
│   │   └── AnnoncesClient.tsx       ← Client Component, liste + suppression
│   ├── boutique/
│   │   ├── page.tsx                 ← Server Component, fetch liste
│   │   ├── BoutiqueClient.tsx       ← Client Component, CRUD + formulaire
│   │   └── actions.ts               ← Server Actions boutique
│   └── actions/
│       └── annonces.ts              ← Server Action deleteAnnonce
```

---

## Page `/compte` — Hub de navigation

**Type :** Server Component pur (pas de fetch backend).

**Auth :** `verifySession()` → `{ userId, nom, email }`. Pas de fetch backend — la session contient tout ce qui est nécessaire.

**Contenu :**
- Salutation : "Bonjour, {nom}"  + email en sous-titre
- 4 cartes cliquables sur 2 colonnes :

| Carte | Lien | État |
|---|---|---|
| Mes annonces | `/mes-annonces` | Actif |
| Ma boutique | `/boutique` | Actif |
| Mes alertes prix | `/favoris` | Grisé + badge "Bientôt" |
| Mon profil | `/compte/profil` | Grisé + badge "Bientôt" |

**`generateMetadata` :** `title: 'Mon compte'`

---

## Page `/mes-annonces` — Liste + suppression

**`page.tsx` (Server Component) :**
- `verifySession()` → `userId`
- `backendFetch('/api/annonces/mine')` → liste des annonces
- Passe `annonces[]` à `AnnoncesClient`

**`AnnoncesClient.tsx` ('use client') :**

Badge statut (priorité d'évaluation dans cet ordre) :
1. `rejete=true` → rouge "Rejetée"
2. `actif=true` → vert "Publiée"
3. `payee=true, actif=false` → bleu "En modération"
4. sinon → orange "En attente"

Actions par annonce :
- Bouton "Supprimer" → `confirm('Supprimer cette annonce ?')` → `useActionState(deleteAnnonce, id)` → `revalidatePath('/mes-annonces')`

CTA page :
- Bouton "Déposer une annonce" → lien `<a href="/annonces.html">` (page legacy)

**`actions/annonces.ts` ('use server') :**
```ts
export async function deleteAnnonce(id: string): Promise<ActionState>
// → backendFetch(`/api/annonces/mine/${id}`, { method: 'DELETE' })
// → revalidatePath('/mes-annonces')
```

**`generateMetadata` :** `title: 'Mes annonces'`

---

## Page `/boutique` — CRUD complet

**`page.tsx` (Server Component) :**
- `verifySession()`
- `backendFetch('/api/boutiques/mine')` → `boutiques[]`
- Calcule `canCreate = boutiques.length < 3`
- Passe `{ boutiques, canCreate }` à `BoutiqueClient`

**`BoutiqueClient.tsx` ('use client') :**

États de l'UI :
- `mode: 'list' | 'create' | 'edit'`
- En mode `list` : liste des cartes boutique + bouton "Créer ma boutique" (si `canCreate`)
- En mode `create` / `edit` : formulaire inline (pas de modal)

Chaque carte boutique affiche : logo (ou placeholder), nom, catégorie, ville, badge actif/inactif. Boutons : "Modifier" → `mode='edit'`, "Supprimer" → `confirm()` → `deleteBoutique(id)`.

**Formulaire boutique** (champs) :
- `nom` — requis, max 200 chars
- `description` — optionnel, textarea
- `categorie` — select parmi : smartphones, informatique, tv-electro, mode, maison, auto-moto, jeux, services, alimentation, beaute, autre
- `telephone` — optionnel
- `adresse` — optionnel
- `ville` — optionnel, défaut "Dakar"
- `logo` — file input, image/*, max 5Mo

Soumis via `useActionState(createBoutique | updateBoutique, formData)`. Après succès → `revalidatePath('/boutique')` + retour mode `list`.

**`boutique/actions.ts` ('use server') :**

```ts
export async function createBoutique(prevState: ActionState, formData: FormData): Promise<ActionState>
// → backendFetch('/api/boutiques', { method: 'POST', body: formData })
// → revalidatePath('/boutique')

export async function updateBoutique(id: string, prevState: ActionState, formData: FormData): Promise<ActionState>
// → backendFetch(`/api/boutiques/${id}`, { method: 'PUT', body: formData })
// → revalidatePath('/boutique')

export async function deleteBoutique(id: string): Promise<ActionState>
// → backendFetch(`/api/boutiques/${id}`, { method: 'DELETE' })
// → revalidatePath('/boutique')
```

**Note multipart :** Quand `body` est un `FormData`, ne pas setter `Content-Type` — le navigateur/fetch le fait automatiquement avec le boundary correct. `backendFetch` ne doit pas forcer `Content-Type: application/json` quand `body` est un `FormData`.

**`generateMetadata` :** `title: 'Ma boutique'`

---

## Type partagé

```ts
// à définir dans chaque actions.ts ou dans src/lib/types.ts
export interface ActionState {
  error?: string
  success?: boolean
}
```

---

## Styles

Suivre le design system existant (`globals.css`) :
- Variables CSS : `--blue2`, `--green`, `--orange`, `--red`, `--card`, `--border`, `--radius`, `--shadow`
- Cartes : classe `.card-produit` comme référence pour l'espacement/ombre
- Inline styles cohérents avec `layout.tsx` et `NavbarActions.tsx` (pas de classes utilitaires Tailwind — le projet n'utilise pas Tailwind)

---

## Ce qui est hors scope

- Page `/compte/profil` (modifier nom/email/téléphone) — sprint suivant
- Page `/favoris` (alertes prix) — sprint suivant
- Formulaire de création d'annonce migré en Next.js — sprint suivant
- Pagination sur `/mes-annonces` (le backend retourne toutes les annonces de l'utilisateur, volume faible)
