# Pages protégées Next.js Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer les pages `/compte` (hub navigation), `/mes-annonces` (liste + suppression), et `/boutique` (CRUD complet avec upload logo) dans le frontend Next.js, branchées sur le backend Express existant via Server Actions.

**Architecture:** Server Components pour la lecture (fetch Express au render), Server Actions pour toutes les mutations. Un helper `backendFetch` signe un JWT 1min avec `JWT_SECRET` et l'envoie en Bearer à Express — aucune modification du backend. Les Client Components utilisent `useFormState` (Next.js 14 / `react-dom`).

**Tech Stack:** Next.js 14.2, TypeScript, `jose` (déjà installé), React `useFormState`/`useFormStatus` depuis `react-dom`, inline styles (pas Tailwind).

## Global Constraints

- Next.js 14.2.0 — utiliser `useFormState` et `useFormStatus` depuis `react-dom`, PAS `useActionState` depuis `react` (ça c'est Next.js 15+)
- Pas de Tailwind — inline styles uniquement, variables CSS depuis `globals.css`
- Variables CSS disponibles : `--blue`, `--blue2`, `--blue3`, `--green`, `--green2`, `--orange`, `--orange2`, `--red`, `--card`, `--border`, `--text1`, `--text2`, `--text3`, `--radius`, `--shadow`, `--shadow2`
- `JWT_SECRET` doit être dans `frontend-next/.env.local` (même valeur que le backend)
- `server-only` doit être importé en haut de tout fichier server-only
- `verifySession()` depuis `@/lib/dal` — redirige automatiquement vers `/connexion` si pas de session
- Ne jamais modifier `backend/` dans ce plan
- `revalidatePath` depuis `next/cache` après chaque mutation

---

### Task 1 : Helper `backendFetch` + type `ActionState`

**Files:**
- Create: `frontend-next/src/lib/backend-fetch.ts`

**Interfaces:**
- Produces:
  - `backendFetch(path: string, options?: RequestInit): Promise<Response>` — appelle Express avec JWT Bearer
  - `ActionState` interface: `{ error?: string; success?: boolean }`

- [ ] **Step 1: Créer `frontend-next/src/lib/backend-fetch.ts`**

```ts
import 'server-only'
import { SignJWT } from 'jose'
import { verifySession } from './dal'

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000'

export interface ActionState {
  error?: string
  success?: boolean
}

export async function backendFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await verifySession()
  const key = new TextEncoder().encode(process.env.JWT_SECRET)
  const token = await new SignJWT({ userId: session.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1m')
    .sign(key)

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  // Ne pas forcer Content-Type si body est FormData (le browser gère le boundary)
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${API}${path}`, { ...options, headers })
}
```

- [ ] **Step 2: Ajouter `JWT_SECRET` dans `frontend-next/.env.local`**

Ouvrir `frontend-next/.env.local` (créer s'il n'existe pas) et ajouter :
```
JWT_SECRET=<copier la valeur de JWT_SECRET depuis .env à la racine>
```

- [ ] **Step 3: Vérifier que `jose` est bien dans les dépendances**

```bash
cd frontend-next && grep '"jose"' package.json
```
Attendu : `"jose": "^6.2.3"` (déjà présent).

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/lib/backend-fetch.ts frontend-next/.env.local
git commit -m "feat: helper backendFetch — JWT 1min vers Express depuis Server Actions"
```

---

### Task 2 : Page `/compte` — Hub de navigation

**Files:**
- Create: `frontend-next/src/app/compte/page.tsx`

**Interfaces:**
- Consumes: `verifySession()` depuis `@/lib/dal` → `{ userId, nom, email }`
- Produces: page `/compte` accessible après connexion

- [ ] **Step 1: Créer `frontend-next/src/app/compte/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'

export const metadata: Metadata = { title: 'Mon compte' }

export default async function ComptePage() {
  const session = await verifySession()
  const nom = session.nom ?? session.email ?? 'vous'

  const cartes = [
    { href: '/mes-annonces', label: 'Mes annonces', emoji: '📋', actif: true },
    { href: '/boutique',     label: 'Ma boutique',  emoji: '🏪', actif: true },
    { href: '/favoris',      label: 'Mes alertes',  emoji: '🔔', actif: false },
    { href: '/compte/profil',label: 'Mon profil',   emoji: '✏️', actif: false },
  ]

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', marginBottom: '4px' }}>
        Bonjour, {nom} 👋
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text3)', marginBottom: '32px' }}>
        {session.email}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
      }}>
        {cartes.map((c) =>
          c.actif ? (
            <Link
              key={c.href}
              href={c.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '24px 20px',
                boxShadow: 'var(--shadow)',
                transition: 'box-shadow 0.2s',
                textDecoration: 'none',
                color: 'var(--text1)',
              }}
            >
              <span style={{ fontSize: '28px' }}>{c.emoji}</span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '15px' }}>
                {c.label}
              </span>
            </Link>
          ) : (
            <div
              key={c.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '24px 20px',
                opacity: 0.5,
                cursor: 'not-allowed',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: '28px' }}>{c.emoji}</span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '15px' }}>
                {c.label}
              </span>
              <span style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '10px',
                fontWeight: 700,
                background: 'var(--blue3)',
                color: 'var(--blue2)',
                borderRadius: '20px',
                padding: '2px 8px',
              }}>
                Bientôt
              </span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Tester manuellement**

Démarrer le backend : `npm run dev` (racine)
Démarrer Next.js : `cd frontend-next && npm run dev`
- Se connecter sur `http://localhost:3001/connexion`
- Vérifier que `http://localhost:3001/compte` affiche la page hub
- Vérifier que `http://localhost:3001/compte` sans session redirige vers `/connexion`

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/app/compte/page.tsx
git commit -m "feat: page /compte — hub de navigation utilisateur"
```

---

### Task 3 : Server Action `deleteAnnonce`

**Files:**
- Create: `frontend-next/src/app/actions/annonces.ts`

**Interfaces:**
- Consumes: `backendFetch` depuis `@/lib/backend-fetch`
- Produces: `deleteAnnonce(id: string): Promise<ActionState>`

- [ ] **Step 1: Créer `frontend-next/src/app/actions/annonces.ts`**

```ts
'use server'
import { revalidatePath } from 'next/cache'
import { backendFetch, type ActionState } from '@/lib/backend-fetch'

export async function deleteAnnonce(id: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/annonces/mine/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible de supprimer cette annonce' }
    }
    revalidatePath('/mes-annonces')
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/app/actions/annonces.ts
git commit -m "feat: Server Action deleteAnnonce"
```

---

### Task 4 : Page `/mes-annonces`

**Files:**
- Create: `frontend-next/src/app/mes-annonces/page.tsx`
- Create: `frontend-next/src/app/mes-annonces/AnnoncesClient.tsx`

**Interfaces:**
- Consumes:
  - `backendFetch(path, options)` depuis `@/lib/backend-fetch`
  - `deleteAnnonce(id: string): Promise<ActionState>` depuis `@/app/actions/annonces`
  - `verifySession()` depuis `@/lib/dal`
- Produces: page `/mes-annonces`

Types locaux :
```ts
interface Annonce {
  id: string
  titre: string
  categorie_slug: string
  prix: number | null
  ville: string | null
  actif: boolean
  payee: boolean
  rejete: boolean
  photos: string[]
  created_at: string
}
```

- [ ] **Step 1: Créer `frontend-next/src/app/mes-annonces/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { backendFetch } from '@/lib/backend-fetch'
import AnnoncesClient from './AnnoncesClient'

export const metadata: Metadata = { title: 'Mes annonces' }

interface Annonce {
  id: string
  titre: string
  categorie_slug: string
  prix: number | null
  ville: string | null
  actif: boolean
  payee: boolean
  rejete: boolean
  photos: string[]
  created_at: string
}

export default async function MesAnnoncesPage() {
  let annonces: Annonce[] = []
  try {
    const res = await backendFetch('/api/annonces/mine')
    if (res.ok) {
      const data = await res.json()
      annonces = data.annonces ?? []
    }
  } catch {
    // afficher liste vide si erreur réseau
  }

  return <AnnoncesClient annonces={annonces} />
}
```

- [ ] **Step 2: Créer `frontend-next/src/app/mes-annonces/AnnoncesClient.tsx`**

```tsx
'use client'
import { deleteAnnonce } from '@/app/actions/annonces'

interface Annonce {
  id: string
  titre: string
  categorie_slug: string
  prix: number | null
  ville: string | null
  actif: boolean
  payee: boolean
  rejete: boolean
  photos: string[]
  created_at: string
}

function statutBadge(a: Annonce) {
  if (a.rejete)                  return { label: 'Rejetée',        color: 'var(--red)',    bg: '#fef2f2' }
  if (a.actif)                   return { label: 'Publiée',        color: 'var(--green)',  bg: 'var(--green2)' }
  if (a.payee && !a.actif)       return { label: 'En modération',  color: 'var(--blue2)',  bg: 'var(--blue3)' }
  return                                { label: 'En attente',     color: 'var(--orange)', bg: 'var(--orange2)' }
}

function fcfa(n: number | null) {
  if (!n) return '—'
  return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n)
}

function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const badge = statutBadge(annonce)

  async function handleDelete() {
    if (!confirm('Supprimer cette annonce définitivement ?')) return
    await deleteAnnonce(annonce.id)
  }

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      boxShadow: 'var(--shadow)',
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
    }}>
      {annonce.photos?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={annonce.photos[0]}
          alt={annonce.titre}
          style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: '72px', height: '72px', borderRadius: '8px', background: 'var(--bg)', flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '14px', margin: 0 }}>
            {annonce.titre}
          </p>
          <span style={{
            fontSize: '11px', fontWeight: 700, padding: '2px 8px',
            borderRadius: '20px', whiteSpace: 'nowrap', flexShrink: 0,
            color: badge.color, background: badge.bg,
          }}>
            {badge.label}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text3)', margin: '4px 0' }}>
          {annonce.categorie_slug} · {annonce.ville ?? 'Dakar'} · {fcfa(annonce.prix)}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '4px 0 8px' }}>
          {new Date(annonce.created_at).toLocaleDateString('fr-FR')}
        </p>
        <button
          onClick={handleDelete}
          style={{
            fontSize: '13px', color: 'var(--red)', background: 'none',
            border: '1px solid #fecaca', borderRadius: '6px',
            padding: '4px 12px', cursor: 'pointer',
          }}
        >
          Supprimer
        </button>
      </div>
    </div>
  )
}

export default function AnnoncesClient({ annonces }: { annonces: Annonce[] }) {
  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', margin: 0 }}>
          Mes annonces
        </h1>
        <a
          href="/annonces.html"
          style={{
            padding: '9px 18px', background: 'var(--blue2)', color: '#fff',
            borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
          }}
        >
          + Déposer une annonce
        </a>
      </div>

      {annonces.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>📋</p>
          <p style={{ fontSize: '15px' }}>Vous n&apos;avez pas encore d&apos;annonces.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {annonces.map((a) => <AnnonceCard key={a.id} annonce={a} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Tester manuellement**

- Connecté → `http://localhost:3001/mes-annonces` affiche la liste (ou état vide)
- Cliquer "Supprimer" → `confirm()` → annonce disparaît de la liste
- Non connecté → redirection vers `/connexion`

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/app/mes-annonces/
git commit -m "feat: page /mes-annonces — liste + suppression annonces"
```

---

### Task 5 : Server Actions boutique

**Files:**
- Create: `frontend-next/src/app/boutique/actions.ts`

**Interfaces:**
- Consumes: `backendFetch` depuis `@/lib/backend-fetch`
- Produces:
  - `createBoutique(prevState: ActionState, formData: FormData): Promise<ActionState>`
  - `updateBoutique(id: string, prevState: ActionState, formData: FormData): Promise<ActionState>`
  - `deleteBoutique(id: string): Promise<ActionState>`

- [ ] **Step 1: Créer `frontend-next/src/app/boutique/actions.ts`**

```ts
'use server'
import { revalidatePath } from 'next/cache'
import { backendFetch, type ActionState } from '@/lib/backend-fetch'

export async function createBoutique(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const res = await backendFetch('/api/boutiques', { method: 'POST', body: formData })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible de créer la boutique' }
    }
    revalidatePath('/boutique')
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function updateBoutique(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${id}`, { method: 'PUT', body: formData })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible de modifier la boutique' }
    }
    revalidatePath('/boutique')
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function deleteBoutique(id: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible de supprimer la boutique' }
    }
    revalidatePath('/boutique')
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/app/boutique/actions.ts
git commit -m "feat: Server Actions boutique — create/update/delete"
```

---

### Task 6 : Page `/boutique` — CRUD complet

**Files:**
- Create: `frontend-next/src/app/boutique/page.tsx`
- Create: `frontend-next/src/app/boutique/BoutiqueClient.tsx`

**Interfaces:**
- Consumes:
  - `backendFetch` depuis `@/lib/backend-fetch`
  - `createBoutique`, `updateBoutique`, `deleteBoutique` depuis `./actions`
  - `useFormState`, `useFormStatus` depuis `react-dom`
- Produces: page `/boutique`

Types locaux :
```ts
interface Boutique {
  id: string
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  actif: boolean
  created_at: string
}
```

- [ ] **Step 1: Créer `frontend-next/src/app/boutique/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { backendFetch } from '@/lib/backend-fetch'
import BoutiqueClient from './BoutiqueClient'

export const metadata: Metadata = { title: 'Ma boutique' }

interface Boutique {
  id: string
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  actif: boolean
  created_at: string
}

export default async function BoutiquePage() {
  let boutiques: Boutique[] = []
  try {
    const res = await backendFetch('/api/boutiques/mine')
    if (res.ok) {
      const data = await res.json()
      boutiques = data.boutiques ?? []
    }
  } catch {
    // afficher liste vide si erreur réseau
  }

  const canCreate = boutiques.length < 3

  return <BoutiqueClient boutiques={boutiques} canCreate={canCreate} />
}
```

- [ ] **Step 2: Créer `frontend-next/src/app/boutique/BoutiqueClient.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { createBoutique, updateBoutique, deleteBoutique } from './actions'
import type { ActionState } from '@/lib/backend-fetch'

const CATEGORIES = [
  { value: 'smartphones',  label: 'Smartphones' },
  { value: 'informatique', label: 'Informatique' },
  { value: 'tv-electro',   label: 'TV & Électro' },
  { value: 'mode',         label: 'Mode' },
  { value: 'maison',       label: 'Maison' },
  { value: 'auto-moto',    label: 'Auto & Moto' },
  { value: 'jeux',         label: 'Jeux' },
  { value: 'services',     label: 'Services' },
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'beaute',       label: 'Beauté' },
  { value: 'autre',        label: 'Autre' },
]

interface Boutique {
  id: string
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  actif: boolean
  created_at: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: '10px 24px', background: pending ? '#94a3b8' : 'var(--blue2)',
        color: '#fff', border: 'none', borderRadius: '8px',
        fontSize: '14px', fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer',
      }}
    >
      {pending ? 'En cours…' : label}
    </button>
  )
}

function BoutiqueForm({
  boutique,
  onCancel,
}: {
  boutique?: Boutique
  onCancel: () => void
}) {
  const action = boutique
    ? updateBoutique.bind(null, boutique.id)
    : createBoutique

  const [state, formAction] = useFormState<ActionState, FormData>(action, {})

  const inputStyle = {
    padding: '10px 14px', border: '1px solid var(--border)',
    borderRadius: '8px', fontSize: '14px', width: '100%',
    background: '#fff', boxSizing: 'border-box' as const,
  }
  const labelStyle = { fontSize: '13px', fontWeight: 600 as const, color: 'var(--text2)', display: 'block' as const, marginBottom: '4px' }

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '18px', margin: 0 }}>
        {boutique ? 'Modifier la boutique' : 'Créer une boutique'}
      </h2>

      {state.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: 'var(--red)', fontSize: '14px' }}>
          {state.error}
        </div>
      )}

      <div>
        <label style={labelStyle} htmlFor="nom">Nom de la boutique *</label>
        <input id="nom" name="nom" required maxLength={200} defaultValue={boutique?.nom} style={inputStyle} placeholder="Ex: Tech Dakar" />
      </div>

      <div>
        <label style={labelStyle} htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} defaultValue={boutique?.description ?? ''} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Décrivez votre boutique…" />
      </div>

      <div>
        <label style={labelStyle} htmlFor="categorie">Catégorie</label>
        <select id="categorie" name="categorie" defaultValue={boutique?.categorie ?? ''} style={inputStyle}>
          <option value="">— Sélectionner —</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle} htmlFor="telephone">Téléphone</label>
          <input id="telephone" name="telephone" type="tel" defaultValue={boutique?.telephone ?? ''} style={inputStyle} placeholder="77 000 00 00" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ville">Ville</label>
          <input id="ville" name="ville" defaultValue={boutique?.ville ?? 'Dakar'} style={inputStyle} placeholder="Dakar" />
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="adresse">Adresse</label>
        <input id="adresse" name="adresse" defaultValue={boutique?.adresse ?? ''} style={inputStyle} placeholder="Ex: Avenue Cheikh Anta Diop" />
      </div>

      <div>
        <label style={labelStyle} htmlFor="logo">Logo (image, max 5 Mo)</label>
        <input id="logo" name="logo" type="file" accept="image/*" style={{ fontSize: '14px' }} />
        {boutique?.logo_url && (
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
            Logo actuel conservé si aucun nouveau fichier sélectionné.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <SubmitButton label={boutique ? 'Enregistrer' : 'Créer la boutique'} />
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '10px 20px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

function BoutiqueCard({
  boutique,
  onEdit,
  onDelete,
}: {
  boutique: Boutique
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px',
      boxShadow: 'var(--shadow)', display: 'flex', gap: '16px', alignItems: 'flex-start',
    }}>
      {boutique.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={boutique.logo_url}
          alt={boutique.nom}
          style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
          🏪
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '15px', margin: 0 }}>
            {boutique.nom}
          </p>
          <span style={{
            fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
            color: boutique.actif ? 'var(--green)' : 'var(--text3)',
            background: boutique.actif ? 'var(--green2)' : '#f1f5f9',
          }}>
            {boutique.actif ? 'Active' : 'Inactive'}
          </span>
        </div>
        {boutique.description && (
          <p style={{ fontSize: '13px', color: 'var(--text2)', margin: '4px 0' }}>{boutique.description}</p>
        )}
        <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '4px 0 12px' }}>
          {[boutique.categorie, boutique.ville, boutique.telephone].filter(Boolean).join(' · ')}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onEdit}
            style={{ fontSize: '13px', color: 'var(--blue2)', background: 'var(--blue3)', border: 'none', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer', fontWeight: 600 }}
          >
            Modifier
          </button>
          <button
            onClick={onDelete}
            style={{ fontSize: '13px', color: 'var(--red)', background: 'none', border: '1px solid #fecaca', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer' }}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BoutiqueClient({
  boutiques,
  canCreate,
}: {
  boutiques: Boutique[]
  canCreate: boolean
}) {
  // mode: 'list' | 'create' | { editing: Boutique }
  type Mode = 'list' | 'create' | { editing: Boutique }
  const [mode, setMode] = useState<Mode>('list')

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette boutique définitivement ?')) return
    await deleteBoutique(id)
  }

  if (mode === 'create' || (typeof mode === 'object' && 'editing' in mode)) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
        <BoutiqueForm
          boutique={typeof mode === 'object' ? mode.editing : undefined}
          onCancel={() => setMode('list')}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', margin: 0 }}>Ma boutique</h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px' }}>
            {boutiques.length}/3 boutiques
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setMode('create')}
            style={{ padding: '9px 18px', background: 'var(--blue2)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            + Créer une boutique
          </button>
        )}
      </div>

      {boutiques.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>🏪</p>
          <p style={{ fontSize: '15px', marginBottom: '16px' }}>Vous n&apos;avez pas encore de boutique.</p>
          <button
            onClick={() => setMode('create')}
            style={{ padding: '10px 24px', background: 'var(--blue2)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            Créer ma boutique
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {boutiques.map((b) => (
            <BoutiqueCard
              key={b.id}
              boutique={b}
              onEdit={() => setMode({ editing: b })}
              onDelete={() => handleDelete(b.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Tester manuellement**

- `http://localhost:3001/boutique` → liste vide → bouton "Créer ma boutique"
- Remplir le formulaire → soumettre → boutique apparaît dans la liste
- "Modifier" → formulaire pré-rempli → enregistrer → liste mise à jour
- "Supprimer" → `confirm()` → boutique disparaît
- Avec 3 boutiques → bouton "Créer" masqué

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/app/boutique/
git commit -m "feat: page /boutique — CRUD complet avec upload logo"
```

---

### Task 7 : Commit de version et vérification finale

- [ ] **Step 1: Vérifier le lint**

```bash
cd frontend-next && npm run lint
```
Corriger toute erreur avant de continuer.

- [ ] **Step 2: Vérifier le build**

```bash
cd frontend-next && npm run build
```
Attendu : build sans erreur. Si erreur TypeScript, corriger.

- [ ] **Step 3: Vérifier les redirections middleware**

- `/compte` sans cookie → redirige `/connexion` ✓
- `/mes-annonces` sans cookie → redirige `/connexion` ✓
- `/boutique` sans cookie → redirige `/connexion` ✓
- Connecté → accès direct ✓

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat: pages protégées /compte /mes-annonces /boutique (v45)"
```
