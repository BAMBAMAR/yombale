# Outils de partage et marketing boutique Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à chaque vendeur boutique des visuels prêts-à-partager (story 1080×1920, par produit et par boutique) et un bouton "Partager" à 3 actions (copier le lien / partager sur WhatsApp / télécharger le visuel), sur la fiche produit publique, dans le dashboard vendeur, et dans une nouvelle section "Marketing" du dashboard.

**Architecture:** Deux nouvelles routes Next.js `ImageResponse` (edge runtime) génèrent les visuels dynamiques en réutilisant le style de `frontend-next/src/app/assets/story-instagram/route.tsx` et le pattern de fetch de données de `frontend-next/src/app/produit/[id]/opengraph-image.tsx` (`apiFetch()` vers le backend Express existant — aucune nouvelle route API backend nécessaire, les endpoints publics `GET /api/boutiques/:id/produits/:prodId` et `GET /api/boutiques/:id` exposent déjà tous les champs requis). Un composant `BoutonPartager` réutilisable encapsule les 3 actions, sur le modèle déjà implémenté dans `frontend-next/src/app/compte/apporteur/ApporteurClient.tsx:83-130`.

**Tech Stack:** Next.js 14 (`next/og` `ImageResponse`, edge runtime), React, aucune dépendance nouvelle.

## Global Constraints

- Pas de format post carré (1080×1080) dans ce chantier — story uniquement (voir spec `docs/superpowers/specs/2026-07-07-partage-marketing-boutique-design.md`).
- Pas d'intégration Meta Ads Manager / Marketing API — partage organique uniquement.
- Pas de partage automatisé/programmé — action manuelle du vendeur à chaque fois.
- Les deux routes de visuel (`assets/produit-boutique/[id]/story`, `assets/boutique/[id]/story`) doivent fonctionner même si le produit/la boutique n'a pas de photo/logo — toujours prévoir un état de repli visuel (pas de crash si `images`/`logo_url` est vide).

---

### Task 1: Composant réutilisable `BoutonPartager`

**Files:**
- Create: `frontend-next/src/components/BoutonPartager.tsx`
- Create: `frontend-next/src/components/__tests__/BoutonPartager.test.tsx`

**Interfaces:**
- Produces: composant `BoutonPartager({ lien, message, lienVisuel }: { lien: string; message: string; lienVisuel: string })` — consommé par Tasks 3 et 5. `lien` est l'URL à copier/partager, `message` le texte pré-rempli pour WhatsApp, `lienVisuel` l'URL de l'image téléchargeable (une des deux routes créées en Task 2).

Ce composant est un menu à 3 actions (Copier le lien / Partager sur WhatsApp / Télécharger le visuel), sur le modèle de `ApporteurClient.tsx:83-130` mais généralisé (paramétrable par `lien`/`message`/`lienVisuel` au lieu d'être câblé au lien apporteur).

Vérifier d'abord la présence d'un test runner frontend (voir Task 1 du plan `2026-07-07-ajout-produit-simplifie.md` si déjà exécuté — `vitest` ou `jest` devrait déjà être installé). Ce composant nécessite aussi `@testing-library/react` pour le test d'interaction utilisateur — vérifier sa présence dans `frontend-next/package.json`, sinon `cd frontend-next && npm install --save-dev @testing-library/react @testing-library/jest-dom jsdom`.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `frontend-next/src/components/__tests__/BoutonPartager.test.tsx` :

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BoutonPartager from '../BoutonPartager'

describe('BoutonPartager', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  })

  it('ouvre le menu et affiche les 3 actions au clic sur le bouton principal', () => {
    render(
      <BoutonPartager
        lien="https://nopalou.com/boutiques/techdakar/produits/p1"
        message="iPhone 13 — 250 000 FCFA"
        lienVisuel="/assets/produit-boutique/p1/story"
      />
    )
    fireEvent.click(screen.getByText('📤 Partager'))
    expect(screen.getByText('📋 Copier le lien')).toBeInTheDocument()
    expect(screen.getByText('💬 Partager sur WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('🖼 Télécharger le visuel')).toBeInTheDocument()
  })

  it('copie le lien dans le presse-papier au clic sur "Copier le lien"', async () => {
    render(
      <BoutonPartager
        lien="https://nopalou.com/boutiques/techdakar/produits/p1"
        message="iPhone 13 — 250 000 FCFA"
        lienVisuel="/assets/produit-boutique/p1/story"
      />
    )
    fireEvent.click(screen.getByText('📤 Partager'))
    fireEvent.click(screen.getByText('📋 Copier le lien'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://nopalou.com/boutiques/techdakar/produits/p1')
  })

  it('le lien WhatsApp inclut le message encodé', () => {
    render(
      <BoutonPartager
        lien="https://nopalou.com/boutiques/techdakar/produits/p1"
        message="iPhone 13 — 250 000 FCFA"
        lienVisuel="/assets/produit-boutique/p1/story"
      />
    )
    fireEvent.click(screen.getByText('📤 Partager'))
    const lienWa = screen.getByText('💬 Partager sur WhatsApp').closest('a')
    expect(lienWa?.getAttribute('href')).toBe(`https://wa.me/?text=${encodeURIComponent('iPhone 13 — 250 000 FCFA')}`)
  })

  it('le lien de téléchargement pointe vers lienVisuel', () => {
    render(
      <BoutonPartager
        lien="https://nopalou.com/boutiques/techdakar/produits/p1"
        message="iPhone 13 — 250 000 FCFA"
        lienVisuel="/assets/produit-boutique/p1/story"
      />
    )
    fireEvent.click(screen.getByText('📤 Partager'))
    const lienVisuelEl = screen.getByText('🖼 Télécharger le visuel').closest('a')
    expect(lienVisuelEl?.getAttribute('href')).toBe('/assets/produit-boutique/p1/story')
  })
})
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `cd frontend-next && npx vitest run src/components/__tests__/BoutonPartager.test.tsx`
Expected: FAIL — `BoutonPartager` n'existe pas encore.

- [ ] **Step 3: Créer le composant**

Créer `frontend-next/src/components/BoutonPartager.tsx` :

```tsx
'use client'
import { useState } from 'react'

interface Props {
  lien: string
  message: string
  lienVisuel: string
}

export default function BoutonPartager({ lien, message, lienVisuel }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const [copie, setCopie] = useState(false)

  function copierLien() {
    navigator.clipboard.writeText(lien).then(() => {
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    })
  }

  const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(message)}`

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOuvert(o => !o)}
        style={{
          padding: '8px 16px', background: '#fff', color: '#374151',
          border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        📤 Partager
      </button>
      {ouvert && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 10,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: 8, minWidth: 220,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <button
            onClick={copierLien}
            style={{ padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 6 }}
          >
            {copie ? '✓ Copié' : '📋 Copier le lien'}
          </button>
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '8px 12px', textDecoration: 'none', color: '#111827', fontSize: 13, fontWeight: 600, borderRadius: 6 }}
          >
            💬 Partager sur WhatsApp
          </a>
          <a
            href={lienVisuel}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '8px 12px', textDecoration: 'none', color: '#111827', fontSize: 13, fontWeight: 600, borderRadius: 6 }}
          >
            🖼 Télécharger le visuel
          </a>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `cd frontend-next && npx vitest run src/components/__tests__/BoutonPartager.test.tsx`
Expected: PASS — les 4 tests réussissent.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/components/BoutonPartager.tsx frontend-next/src/components/__tests__/BoutonPartager.test.tsx
git commit -m "feat(boutique): ajoute le composant réutilisable BoutonPartager"
```

---

### Task 2: Route de visuel Story pour un produit boutique

**Files:**
- Create: `frontend-next/src/app/assets/produit-boutique/[id]/story/route.tsx`

**Interfaces:**
- Consumes: `apiFetch<T>(path)` depuis `@/lib/api` ; endpoint public existant `GET /api/boutiques/:id/produits/:prodId` (nécessite l'UUID de la **boutique** en premier segment et l'UUID du **produit** en second — cette route Next.js reçoit uniquement l'UUID du produit en paramètre `[id]`, il faut donc d'abord résoudre la boutique).
- Produces: image PNG 1080×1920 accessible à `/assets/produit-boutique/{produitId}/story` — consommée par Task 3 (lien `lienVisuel`).

Point d'attention découvert en explorant le code : l'endpoint `GET /api/boutiques/:id/produits/:prodId` attend l'identifiant de la **boutique** comme premier segment (`:id`), pas seulement l'id du produit — il n'existe pas de route "chercher un produit boutique par son seul id" côté backend. Cette tâche introduit donc un nouvel endpoint minimal côté backend pour permettre la génération du visuel à partir du seul id produit (le composant appelant, en Task 3, ne connaît que l'id du produit dans le contexte du dashboard boutique — il connaît aussi `boutique.id` en réalité, donc une alternative sans changement backend est possible : voir Step 1 ci-dessous, l'option retenue évite tout changement backend).

- [ ] **Step 1: Décider du chemin de données — construire l'URL avec les deux ids, pas de nouvel endpoint backend**

Plutôt que d'ajouter un endpoint backend, cette route Next.js accepte les deux ids nécessaires via des paramètres de requête (`?boutiqueId=...`), puisque tous les appelants (fiche produit publique, dashboard vendeur) connaissent déjà `boutique.id` en plus de `produit.id`. Le chemin de fichier reste `frontend-next/src/app/assets/produit-boutique/[id]/story/route.tsx` où `[id]` est l'id du **produit**, et `boutiqueId` est lu depuis les search params de la requête.

- [ ] **Step 2: Créer la route**

Créer `frontend-next/src/app/assets/produit-boutique/[id]/story/route.tsx` :

```tsx
import { ImageResponse } from 'next/og'
import { apiFetch } from '@/lib/api'

export const runtime = 'edge'

interface ProduitDetail {
  id: string
  nom: string
  prix: number | null
  prix_barre: number | null
  images: string[]
  boutique_nom: string
  boutique_logo: string | null
}

function fcfa(n: number | null) {
  if (!n) return 'Prix à négocier'
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const boutiqueId = searchParams.get('boutiqueId')

  let produit: ProduitDetail | null = null
  if (boutiqueId) {
    try {
      const data = await apiFetch<{ produit: ProduitDetail }>(
        `/boutiques/${boutiqueId}/produits/${params.id}`
      )
      produit = data.produit
    } catch { /* fallback générique ci-dessous */ }
  }

  const nom = produit?.nom ?? 'Produit'
  const prix = fcfa(produit?.prix ?? null)
  const prixBarre = produit?.prix_barre ? fcfa(produit.prix_barre) : null
  const boutiqueNom = produit?.boutique_nom ?? 'Nopalou'
  const image = produit?.images?.[0] ?? null

  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1920,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #1C2B4A 0%, #0f1d35 60%, #C75B00 100%)',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Logo Nopalou */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '70px 70px 0' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 14, background: '#C75B00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, fontWeight: 900, color: '#fff',
          }}>N</div>
          <span style={{ fontSize: 38, fontWeight: 900, color: '#fff' }}>
            Nopa<span style={{ color: '#C75B00' }}>lou</span>
          </span>
        </div>

        {/* Photo produit */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '50px 70px', minHeight: 0,
        }}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={nom} style={{ maxWidth: '100%', maxHeight: 760, objectFit: 'contain', borderRadius: 20 }} />
          ) : (
            <div style={{
              width: 500, height: 500, borderRadius: 24, background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 140,
            }}>📦</div>
          )}
        </div>

        {/* Infos produit */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 70px 60px', gap: 16 }}>
          <p style={{
            fontSize: 46, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {nom}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontSize: 52, fontWeight: 900, color: '#fff' }}>{prix}</span>
            {prixBarre && (
              <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>{prixBarre}</span>
            )}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
            background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 20px', width: 'fit-content',
          }}>
            <span style={{ fontSize: 24 }}>🏪</span>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>{boutiqueNom}</span>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
```

- [ ] **Step 3: Vérifier manuellement dans le navigateur**

Run: `cd backend && npm run dev` (dans un terminal) puis `cd frontend-next && npm run dev` (dans un autre).

Avec un produit boutique existant en base locale, ouvrir dans le navigateur :
`http://localhost:3001/assets/produit-boutique/{produitId}/story?boutiqueId={boutiqueId}`

Expected: une image PNG verticale 1080×1920 s'affiche, avec la photo du produit (ou le repli 📦 si aucune photo), son nom, son prix (et prix barré si présent), et le nom de la boutique.

Vérifier aussi sans le paramètre `boutiqueId` (`http://localhost:3001/assets/produit-boutique/{produitId}/story`) : l'image doit s'afficher avec les valeurs génériques ("Produit", "Prix à négocier", "Nopalou"), sans planter.

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/app/assets/produit-boutique/
git commit -m "feat(boutique): ajoute la route de visuel story par produit boutique"
```

---

### Task 3: Bouton Partager sur la fiche produit publique et dans le dashboard vendeur

**Files:**
- Modify: `frontend-next/src/app/boutiques/[id]/produits/[produitId]/page.tsx:186-215` (juste avant ou après `ProduitCTA`)
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx` (bloc "Actions" de la carte produit dans `CatalogueProduits`)

**Interfaces:**
- Consumes: `BoutonPartager` de Task 1, route de Task 2.
- Produces: rien de consommé par une tâche suivante.

- [ ] **Step 1: Ajouter le bouton sur la fiche produit publique**

Dans `frontend-next/src/app/boutiques/[id]/produits/[produitId]/page.tsx`, juste après le bloc `{/* CTA */}` (après la fermeture de `<ProduitCTA ... />`, ligne 215, avant `</div>` ligne 217), ajouter :

```tsx
          <BoutonPartager
            lien={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${params.id}/produits/${params.produitId}`}
            message={`${p.nom}${p.prix ? ` — ${fcfa(p.prix)}` : ''}\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${params.id}/produits/${params.produitId}`}
            lienVisuel={`/assets/produit-boutique/${params.produitId}/story?boutiqueId=${params.id}`}
          />
```

Et ajouter l'import en haut du fichier, à la suite des imports existants (après `import ProduitCTA from './ProduitCTA'`, ligne 8) :

```tsx
import BoutonPartager from '@/components/BoutonPartager'
```

- [ ] **Step 2: Vérifier manuellement la fiche produit publique**

Run: `cd frontend-next && npm run dev` (backend déjà lancé)

Ouvrir une fiche produit boutique existante (`/boutiques/{id}/produits/{produitId}`). Expected: le bouton "📤 Partager" apparaît sous les CTA existants (Commander/WhatsApp/Appeler) ; cliquer dessus ouvre le menu à 3 actions ; "Copier le lien" copie bien l'URL de cette fiche précise ; "Partager sur WhatsApp" ouvre WhatsApp Web avec un message pré-rempli contenant le nom et le prix du produit ; "Télécharger le visuel" ouvre l'image story générée en Task 2.

- [ ] **Step 3: Ajouter le bouton dans le dashboard vendeur**

Dans `frontend-next/src/app/boutique/BoutiqueClient.tsx`, localiser le bloc "Actions" de chaque carte produit dans `CatalogueProduits` (le `<div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>` contenant les boutons "Modifier" et "✕", visible autour de la ligne 676-697 dans la version du fichier avant les modifications des Chantiers 1/2 — si ces chantiers ont déjà été implémentés, ce bloc peut contenir des badges supplémentaires ailleurs dans la carte mais ce bloc Actions spécifique reste identifiable par ses boutons "Modifier"/"✕"). Ajouter `BoutonPartager` avant le bouton "Modifier" :

```tsx
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                <BoutonPartager
                  lien={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${boutique.id}/produits/${p.id}`}
                  message={`${p.nom}${p.prix ? ` — ${fcfa(p.prix)}` : ''}\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${boutique.id}/produits/${p.id}`}
                  lienVisuel={`/assets/produit-boutique/${p.id}/story?boutiqueId=${boutique.id}`}
                />
                <button
                  onClick={() => setMode({ editing: p })}
                  style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Modifier
                </button>
```

(Conserver le reste du bloc Actions — bouton "✕" de suppression — inchangé après ce bouton "Modifier".)

Ajouter l'import en haut du fichier `BoutiqueClient.tsx`, à la suite des imports existants :

```tsx
import BoutonPartager from '@/components/BoutonPartager'
```

Vérifier également qu'une fonction `fcfa` de formatage FCFA est déjà importée/disponible dans ce fichier (utilisée ailleurs dans `CatalogueProduits` pour afficher les prix, ligne 664 de la version originale) — si oui, la réutiliser telle quelle sans réimporter.

- [ ] **Step 4: Vérifier manuellement dans le dashboard vendeur**

Run: `cd frontend-next && npm run dev`

Aller sur `/boutique` → gérer une boutique → onglet Catalogue. Expected: chaque carte produit affiche désormais un bouton "📤 Partager" à côté de "Modifier" et "✕" ; son comportement est identique à celui vérifié sur la fiche publique (Step 2).

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/boutiques/[id]/produits/[produitId]/page.tsx frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): ajoute le bouton Partager sur la fiche produit et le dashboard vendeur"
```

---

### Task 4: Route de visuel Story pour une boutique

**Files:**
- Create: `frontend-next/src/app/assets/boutique/[id]/story/route.tsx`

**Interfaces:**
- Consumes: `apiFetch<T>(path)` depuis `@/lib/api` ; endpoint public existant `GET /api/boutiques/:id`.
- Produces: image PNG 1080×1920 accessible à `/assets/boutique/{boutiqueId}/story` — consommée par Task 5.

- [ ] **Step 1: Créer la route**

Créer `frontend-next/src/app/assets/boutique/[id]/story/route.tsx` :

```tsx
import { ImageResponse } from 'next/og'
import { apiFetch } from '@/lib/api'

export const runtime = 'edge'

interface BoutiqueDetail {
  id: string
  nom: string
  categorie: string | null
  ville: string
  logo_url: string | null
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let boutique: BoutiqueDetail | null = null
  try {
    const data = await apiFetch<{ id: string; nom: string; categorie: string | null; ville: string; logo_url: string | null }>(
      `/boutiques/${params.id}`
    )
    boutique = data as BoutiqueDetail
  } catch { /* fallback générique ci-dessous */ }

  const nom = boutique?.nom ?? 'Boutique'
  const categorie = boutique?.categorie ?? ''
  const ville = boutique?.ville ?? 'Sénégal'
  const logo = boutique?.logo_url ?? null

  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1920,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #1C2B4A 0%, #0f1d35 60%, #C75B00 100%)',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Logo Nopalou */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '70px 70px 0' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 14, background: '#C75B00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, fontWeight: 900, color: '#fff',
          }}>N</div>
          <span style={{ fontSize: 38, fontWeight: 900, color: '#fff' }}>
            Nopa<span style={{ color: '#C75B00' }}>lou</span>
          </span>
        </div>

        {/* Logo boutique */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '50px 70px', gap: 40,
        }}>
          <div style={{
            width: 320, height: 320, borderRadius: '50%', overflow: 'hidden',
            background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '6px solid rgba(255,255,255,0.25)',
          }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 120 }}>🏪</span>
            )}
          </div>

          <p style={{ fontSize: 26, color: 'rgba(255,255,255,0.7)', margin: 0, textAlign: 'center' }}>
            Découvrez
          </p>
          <p style={{
            fontSize: 56, fontWeight: 900, color: '#fff', margin: 0, textAlign: 'center', lineHeight: 1.2,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {nom}
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {categorie && (
              <span style={{ fontSize: 22, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '8px 20px', borderRadius: 999 }}>
                {categorie}
              </span>
            )}
            <span style={{ fontSize: 22, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '8px 20px', borderRadius: 999 }}>
              📍 {ville}
            </span>
          </div>
        </div>

        {/* CTA bas */}
        <div style={{ padding: '0 70px 100px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px 60px', fontSize: 32, fontWeight: 900, color: '#C75B00' }}>
            sur Nopalou
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
```

- [ ] **Step 2: Vérifier manuellement dans le navigateur**

Run: `cd backend && npm run dev` puis `cd frontend-next && npm run dev`

Avec une boutique existante en base locale, ouvrir `http://localhost:3001/assets/boutique/{boutiqueId}/story`.

Expected: une image PNG verticale 1080×1920 s'affiche, avec le logo de la boutique (ou le repli 🏪 si aucun logo), son nom, sa catégorie et sa ville.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/app/assets/boutique/
git commit -m "feat(boutique): ajoute la route de visuel story par boutique"
```

---

### Task 5: Section "Marketing" dans le dashboard boutique

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx` (ajout d'un nouvel onglet dans la navigation du composant `BoutiqueManage`, et un nouveau composant `MarketingBoutique`)

**Interfaces:**
- Consumes: `BoutonPartager` de Task 1, route de Task 4.
- Produces: rien de consommé par une tâche suivante — dernière tâche du plan.

- [ ] **Step 1: Localiser la navigation à onglets de `BoutiqueManage`**

Ouvrir `frontend-next/src/app/boutique/BoutiqueClient.tsx` et chercher le composant `BoutiqueManage` (référencé dans l'exploration initiale comme contenant les onglets Catalogue / Commandes / Comptabilité / Analytics / Paramètres — chercher un tableau ou une liste de définitions d'onglets, par exemple une structure du type `const ONGLETS = [...]` ou un rendu conditionnel par état `activeTab`). Repérer exactement comment un onglet existant (le plus simple à copier est probablement "Paramètres", qui réutilise le formulaire d'édition de boutique) est déclaré et rendu, pour reproduire fidèlement le même pattern.

- [ ] **Step 2: Ajouter l'onglet "Marketing" à la liste des onglets**

Ajouter une entrée `{ id: 'marketing', label: '📣 Marketing' }` (ou le format exact utilisé par les entrées existantes trouvées à l'étape précédente — adapter la syntaxe à ce qui est réellement présent, ex. si c'est un tableau de chaînes plutôt que d'objets, adapter en conséquence) à la suite de l'onglet "Paramètres" existant, dans le même tableau/la même liste.

- [ ] **Step 3: Créer le composant `MarketingBoutique`**

Juste avant la fonction `CatalogueProduits` (ligne 541 dans la version originale du fichier), ajouter :

```tsx
function MarketingBoutique({ boutique }: { boutique: Boutique }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
  const lienBoutique = `${siteUrl}/boutiques/${boutique.slug || boutique.id}`
  const messageBoutique = `Découvrez ${boutique.nom} sur Nopalou !\n\n${lienBoutique}`

  return (
    <div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
        Partagez votre boutique sur WhatsApp, Instagram ou Facebook pour attirer plus de clients.
      </p>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px',
      }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {boutique.logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={boutique.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 28 }}>🏪</span>
          }
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{boutique.nom}</p>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{lienBoutique}</p>
        </div>
        <BoutonPartager
          lien={lienBoutique}
          message={messageBoutique}
          lienVisuel={`/assets/boutique/${boutique.id}/story`}
        />
      </div>
    </div>
  )
}
```

Note : cette signature suppose que le type `Boutique` (défini plus haut dans le fichier) porte déjà les champs `id`, `nom`, `slug`, `logo_url` — vérifier leur présence dans l'interface `Boutique` existante avant d'implémenter ; ils sont déjà utilisés ailleurs dans le fichier (`BoutiqueCard`, formulaire d'édition) donc doivent déjà être déclarés.

- [ ] **Step 4: Rendre `MarketingBoutique` dans le nouvel onglet**

Dans le bloc de rendu conditionnel par onglet actif de `BoutiqueManage` (identifié au Step 1), ajouter la branche correspondant à l'onglet `marketing` :

```tsx
{activeTab === 'marketing' && <MarketingBoutique boutique={boutique} />}
```

(Adapter le nom de la variable d'état d'onglet actif si elle diffère de `activeTab` — reprendre exactement celle utilisée par les branches voisines déjà présentes pour Catalogue/Commandes/etc.)

Ajouter l'import en haut du fichier si `BoutonPartager` n'a pas déjà été importé par la Task 3 dans ce même fichier :

```tsx
import BoutonPartager from '@/components/BoutonPartager'
```

- [ ] **Step 5: Vérifier manuellement dans le navigateur**

Run: `cd frontend-next && npm run dev`

Aller sur `/boutique` → gérer une boutique → cliquer sur le nouvel onglet "📣 Marketing".

Expected: la section affiche le logo, nom et lien de la boutique, avec un bouton "📤 Partager" ; cliquer dessus ouvre le menu à 3 actions ; "Télécharger le visuel" ouvre l'image générée en Task 4 avec le bon logo/nom/catégorie/ville ; "Copier le lien" et "Partager sur WhatsApp" utilisent le lien de la boutique entière (`/boutiques/{slug}`), pas un lien de produit.

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): ajoute la section Marketing avec visuel et partage de la boutique"
```

---

## Vérification finale (bout en bout)

1. `cd frontend-next && npx vitest run` — tous les tests (`BoutonPartager` inclus) passent.
2. `cd backend && npm run dev` puis `cd frontend-next && npm run dev` — les deux serveurs démarrent sans erreur.
3. Ouvrir directement dans le navigateur les deux routes de visuel (`/assets/produit-boutique/{id}/story?boutiqueId={id}` et `/assets/boutique/{id}/story`) pour un produit/une boutique réels et confirmer visuellement le rendu.
4. Sur la fiche produit publique, le dashboard vendeur (Catalogue), et le nouvel onglet Marketing : vérifier que chaque bouton "Partager" propose bien les 3 actions et que chacune fonctionne (lien copié correct, message WhatsApp pré-rempli correct, visuel téléchargé correct et correspondant à l'entité — produit ou boutique — depuis laquelle le bouton a été ouvert).
