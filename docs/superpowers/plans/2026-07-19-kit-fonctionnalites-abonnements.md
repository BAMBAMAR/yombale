# Kit fonctionnalités & abonnements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner aux marchands et apporteurs d'affaires une vue d'ensemble des fonctionnalités Nopalou et des paliers d'abonnement boutique — une page `/compte/fonctionnalites`, 6 visuels commerciaux (3 paliers × 2 formats), et leur diffusion depuis l'admin, l'espace apporteur et l'onglet Marketing boutique.

**Architecture:** Un fichier de données partagé (`frontend-next/src/lib/fonctionnalites-data.ts`) devient la source unique pour la page compte, les 6 routes `ImageResponse`, et remplace la liste locale `PLANS_INFO` de `AbonnementClient.tsx`. Les visuels suivent le pattern déjà en place (`/assets/boutique/[id]/story`, `/assets/chatbot-whatsapp`) : routes `ImageResponse` en `runtime = 'edge'`, contenu tiré du fichier de données, jamais de prix codé en dur (toujours lu depuis `settings`).

**Tech Stack:** Next.js 14 (App Router, Server Components), `next/og` `ImageResponse`, TypeScript.

## Global Constraints

- Aucun prix Pro/Business codé en dur nulle part (page compte, visuels, admin) — toujours lu depuis `settings.plan_pro_prix`/`settings.plan_business_prix`, avec repli `15000`/`35000` si le fetch échoue (pattern déjà en place dans `AbonnementClient.tsx` et `admin/communication/page.tsx`).
- `PALIERS_BOUTIQUE` et `FONCTIONNALITES_PLATEFORME` (le fichier de données) sont la seule source de vérité — aucune duplication de ces listes ailleurs après ce chantier.
- Les 6 routes `ImageResponse` utilisent `export const runtime = 'edge'` (obligatoire) et `system-ui, sans-serif` uniquement comme police (jamais de police custom — bug documenté `@vercel/og` sous Windows).
- Chaque élément JSX dans une route `ImageResponse` a un `display: 'flex'` explicite (contrainte Satori).
- Palette de marque obligatoire sur les 6 visuels : `#1C2B4A` (navy), `#C75B00` (accent Pro), `#1e3a5f` (accent Business — déjà utilisé ailleurs dans le projet pour Business), une couleur neutre à définir pour Gratuit (ex. `#64748B`).
- `AbonnementClient.tsx` : la migration vers `PALIERS_BOUTIQUE` ne doit produire aucun changement de comportement visuel ou fonctionnel — seule la source de la liste change (`prix` reste calculé dans le composant via `settings`, pas dans le fichier de données).
- `/compte/fonctionnalites` est protégée automatiquement par le middleware existant (préfixe `/compte` déjà dans `PROTECTED_ROUTES`) — aucun changement au middleware nécessaire.
- Vérification finale : `npx tsc --noEmit` propre dans `frontend-next/`.

---

### Task 1: Fichier de données partagé `fonctionnalites-data.ts`

**Files:**
- Create: `frontend-next/src/lib/fonctionnalites-data.ts`

**Interfaces:**
- Consumes: rien (première tâche du plan).
- Produces:
```ts
export interface FonctionnalitePlateforme {
  id: string
  emoji: string
  label: string
  description: string
}

export interface PalierBoutique {
  id: 'gratuit' | 'pro' | 'business'
  label: string
  couleur: string
  avantages: string[]
}

export const FONCTIONNALITES_PLATEFORME: FonctionnalitePlateforme[]
export const PALIERS_BOUTIQUE: PalierBoutique[]
```
Consommé par : Task 2 (page compte), Task 3 (`AbonnementClient.tsx`), Task 4/5 (routes visuels), Task 6 (admin).

**Contexte** — la liste `PLANS_INFO` actuelle dans `frontend-next/src/app/boutique/abonnement/AbonnementClient.tsx` (lignes 11-36) :

```ts
const PLANS_INFO = [
  {
    id: 'pro' as const,
    label: 'Boutique Pro',
    couleur: '#C75B00',
    avantages: [
      'Placement prioritaire dans /boutiques',
      'Badge "Vendeur Pro" sur toutes vos annonces',
      '5 annonces classées incluses/mois',
      'Tableau de bord analytics (vues, clics)',
      'Statistiques des prix concurrents',
    ],
  },
  {
    id: 'business' as const,
    label: 'Boutique Business',
    couleur: '#1e3a5f',
    avantages: [
      'Tout ce qui est inclus dans Pro',
      'URL dédiée /boutiques/[votre-nom]',
      '15 annonces classées incluses/mois',
      'Bannière dans 1 page catégorie',
      'Support prioritaire WhatsApp',
    ],
  },
]
```

Le palier Gratuit n'existe dans aucune liste actuelle. D'après `frontend-next/src/app/boutique/BoutiqueClient.tsx` ligne 1112-1128 (composant `CatalogueProduits`), une boutique sans abonnement actif (`planActif === null`) n'a PAS accès au catalogue produits du tout (message « Catalogue disponible en Boutique Pro » affiché à la place) — donc le palier Gratuit se limite à la présence de base (page boutique publique, sans catalogue produits synchronisable, sans badge, sans analytics).

- [ ] **Step 1: Créer le fichier de données**

Créer `frontend-next/src/lib/fonctionnalites-data.ts` avec ce contenu exact :

```ts
export interface FonctionnalitePlateforme {
  id: string
  emoji: string
  label: string
  description: string
}

export interface PalierBoutique {
  id: 'gratuit' | 'pro' | 'business'
  label: string
  couleur: string
  avantages: string[]
}

export const FONCTIONNALITES_PLATEFORME: FonctionnalitePlateforme[] = [
  {
    id: 'comparateur',
    emoji: '🔍',
    label: 'Comparateur de prix',
    description: 'Comparez les prix de milliers de produits chez plusieurs marchands sénégalais en un seul endroit.',
  },
  {
    id: 'immo',
    emoji: '🏠',
    label: 'Annonces immobilières',
    description: 'Trouvez ou publiez des annonces de location et de vente — appartements, maisons, terrains.',
  },
  {
    id: 'telecom',
    emoji: '📱',
    label: 'Forfaits télécom',
    description: 'Comparez les forfaits des opérateurs sénégalais et trouvez le meilleur pour votre usage.',
  },
  {
    id: 'alertes',
    emoji: '🔔',
    label: 'Alertes de prix',
    description: 'Soyez notifié dès qu\'un produit que vous suivez baisse de prix.',
  },
  {
    id: 'whatsapp',
    emoji: '🤖',
    label: 'Assistant WhatsApp',
    description: 'Recherchez, commandez et suivez vos commandes directement sur WhatsApp, sans app à installer.',
  },
  {
    id: 'apporteur',
    emoji: '💼',
    label: 'Programme apporteur d\'affaires',
    description: 'Recommandez Nopalou à des commerçants de votre réseau et touchez une commission sur leurs abonnements.',
  },
]

export const PALIERS_BOUTIQUE: PalierBoutique[] = [
  {
    id: 'gratuit',
    label: 'Boutique Gratuite',
    couleur: '#64748B',
    avantages: [
      'Page boutique visible sur /boutiques',
      'Coordonnées et lien WhatsApp affichés',
      'Jusqu\'à 2 annonces classées incluses',
    ],
  },
  {
    id: 'pro',
    label: 'Boutique Pro',
    couleur: '#C75B00',
    avantages: [
      'Placement prioritaire dans /boutiques',
      'Badge "Vendeur Pro" sur toutes vos annonces',
      'Catalogue produits avec photos et prix',
      '5 annonces classées incluses/mois',
      'Tableau de bord analytics (vues, clics)',
      'Statistiques des prix concurrents',
    ],
  },
  {
    id: 'business',
    label: 'Boutique Business',
    couleur: '#1e3a5f',
    avantages: [
      'Tout ce qui est inclus dans Pro',
      'URL dédiée /boutiques/[votre-nom]',
      '15 annonces classées incluses/mois',
      'Bannière dans 1 page catégorie',
      'Support prioritaire WhatsApp',
    ],
  },
]
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/lib/fonctionnalites-data.ts
git commit -m "feat: ajoute la source de donnees partagee fonctionnalites-data"
```

---

### Task 2: Page `/compte/fonctionnalites`

**Files:**
- Create: `frontend-next/src/app/(account)/compte/fonctionnalites/page.tsx`
- Modify: `frontend-next/src/app/(account)/compte/page.tsx` (ajout d'une carte dans `MENU`)
- Modify: `frontend-next/src/app/(account)/AccountNavLinks.tsx` (ajout d'un lien dans le groupe « Compte »)

**Interfaces:**
- Consumes: `FONCTIONNALITES_PLATEFORME`, `PALIERS_BOUTIQUE` (Task 1) ; pattern de lecture de `planActif` identique à `frontend-next/src/app/boutique/abonnement/page.tsx`.
- Produces: route `/compte/fonctionnalites`, consommée par aucune tâche suivante (page terminale).

**Contexte — pattern exact de lecture du plan actif** (`frontend-next/src/app/boutique/abonnement/page.tsx`, fichier complet) :

```tsx
import type { Metadata } from 'next'
import { backendFetch } from '@/lib/backend-fetch'
import { verifySession } from '@/lib/dal'
import AbonnementClient from './AbonnementClient'

export const metadata: Metadata = { title: 'Abonnement Boutique' }

export default async function AbonnementPage() {
  const session = await verifySession()

  let planActif: { plan: string; fin: string } | null = null
  try {
    const res = await backendFetch('/api/abonnements/mon-plan')
    if (res.ok) {
      const data = await res.json()
      planActif = data.abonnement
    }
  } catch { /* afficher page normale si erreur */ }

  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let settings: Record<string, string> = {}
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
    if (r.ok) settings = await r.json()
  } catch {
    // valeurs par défaut gérées dans AbonnementClient
  }

  return <AbonnementClient planActif={planActif} userId={session.userId} settings={settings} />
}
```

**Contexte — `MENU` actuel de `compte/page.tsx`** (fichier complet) :

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Mon compte' }

const MENU = [
  { href: '/mes-annonces',       label: 'Mes annonces',      emoji: '📋', desc: 'Gérer vos annonces classifiées',   actif: true },
  { href: '/mes-annonces-immo',  label: 'Mes biens immo',    emoji: '🏠', desc: 'Gérer vos annonces immobilières',  actif: true },
  { href: '/boutique',           label: 'Ma boutique',       emoji: '🏪', desc: 'Votre vitrine commerçante',        actif: true },
  { href: '/boutique/abonnement', label: 'Abonnement Pro',   emoji: '⭐', desc: 'Boostez votre visibilité',         actif: true },
  { href: '/boutique/analytics',  label: 'Analytics',        emoji: '📊', desc: 'Vues et clics de votre boutique',   actif: true },
  { href: '/favoris',            label: 'Mes favoris',       emoji: '♥',  desc: 'Produits sauvegardés',            actif: true },
  { href: '/deposer-annonce',    label: 'Publier une annonce',emoji: '➕', desc: 'Publier une annonce classifiée',  actif: true },
  { href: '/deposer-immo',       label: 'Publier un bien',   emoji: '🏡', desc: 'Publier une annonce immobilière', actif: true },
  { href: '/compte/apporteur',   label: 'Apporteur d\'affaires', emoji: '💼', desc: 'Recommandez Nopalou et touchez une commission', actif: true },
  { href: '/compte/profil',      label: 'Mon profil',        emoji: '✏️', desc: 'Modifier mes informations',       actif: true },
]

export default function ComptePage() {
  return (
    <div className="compte-grid">
      {MENU.map(item => (
        item.actif ? (
          <Link key={item.href} href={item.href} className="compte-card">
            <span className="compte-card-emoji">{item.emoji}</span>
            <div>
              <p className="compte-card-label">{item.label}</p>
              <p className="compte-card-desc">{item.desc}</p>
            </div>
            <span className="compte-card-arrow">→</span>
          </Link>
        ) : (
          <div key={item.href} className="compte-card compte-card--disabled">
            <span className="compte-card-emoji">{item.emoji}</span>
            <div>
              <p className="compte-card-label">{item.label}</p>
              <p className="compte-card-desc">{item.desc}</p>
            </div>
            <span className="compte-soon-badge">Bientôt</span>
          </div>
        )
      ))}
    </div>
  )
}
```

**Contexte — `AccountNavLinks.tsx` actuel** (fichier complet) :

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const GROUPES = [
  {
    label: 'Mes annonces',
    liens: [
      { href: '/mes-annonces',      label: 'Mes annonces',        emoji: '📋' },
      { href: '/mes-annonces-immo', label: 'Mes biens immo',      emoji: '🏠' },
      { href: '/mes-alertes',       label: 'Mes alertes prix',    emoji: '🔔' },
      { href: '/favoris',           label: 'Mes favoris',         emoji: '♥' },
      { href: '/deposer-annonce',   label: 'Publier une annonce', emoji: '➕' },
      { href: '/deposer-immo',      label: 'Publier un bien',     emoji: '🏡' },
    ],
  },
  {
    label: 'Ma boutique',
    liens: [
      { href: '/boutique', label: 'Ma boutique', emoji: '🏪' },
    ],
  },
  {
    label: 'Compte',
    liens: [
      { href: '/compte/profil',    label: 'Mon profil',           emoji: '✏️' },
      { href: '/compte/apporteur', label: 'Apporteur d\'affaires', emoji: '💼' },
    ],
  },
]

export default function AccountNavLinks() {
  const pathname = usePathname()

  return (
    <>
      {GROUPES.map(groupe => (
        <div key={groupe.label} className="account-nav-group">
          <p className="account-nav-group-label">{groupe.label}</p>
          <div>
            {groupe.liens.map(lien => {
              const actif = pathname === lien.href || pathname.startsWith(lien.href + '/')
              return (
                <Link
                  key={lien.href}
                  href={lien.href}
                  className={`account-nav-link${actif ? ' account-nav-link--active' : ''}`}
                >
                  <span>{lien.emoji}</span>
                  <span>{lien.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}
```

- [ ] **Step 1: Créer la page `/compte/fonctionnalites`**

Créer `frontend-next/src/app/(account)/compte/fonctionnalites/page.tsx` :

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { backendFetch } from '@/lib/backend-fetch'
import { verifySession } from '@/lib/dal'
import { FONCTIONNALITES_PLATEFORME, PALIERS_BOUTIQUE } from '@/lib/fonctionnalites-data'

export const metadata: Metadata = { title: 'Fonctionnalités & abonnements' }

export default async function FonctionnalitesPage() {
  await verifySession()

  let planActif: { plan: string; fin: string } | null = null
  try {
    const res = await backendFetch('/api/abonnements/mon-plan')
    if (res.ok) {
      const data = await res.json()
      planActif = data.abonnement
    }
  } catch { /* page neutre si erreur */ }

  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let settings: Record<string, string> = {}
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
    if (r.ok) settings = await r.json()
  } catch {
    // valeurs par défaut ci-dessous
  }
  const prixPro = Number(settings.plan_pro_prix) || 15000
  const prixBusiness = Number(settings.plan_business_prix) || 35000
  const PRIX_PAR_PALIER: Record<string, number | null> = { gratuit: null, pro: prixPro, business: prixBusiness }

  const palierActuelId = planActif ? planActif.plan : 'gratuit'

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1C2B4A', marginBottom: 8 }}>
        Fonctionnalités & abonnements
      </h1>
      <p style={{ color: '#64748b', marginBottom: 40 }}>
        Tout ce que propose Nopalou, et ce qui change selon votre abonnement boutique.
      </p>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          Ce que Nopalou propose
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {FONCTIONNALITES_PLATEFORME.map(f => (
            <div key={f.id} style={{
              border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, background: '#fff',
            }}>
              <span style={{ fontSize: 26, display: 'block', marginBottom: 10 }}>{f.emoji}</span>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1C2B4A', margin: '0 0 6px' }}>{f.label}</p>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          Boutique — choisissez votre palier
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {PALIERS_BOUTIQUE.map(palier => {
            const estActuel = palierActuelId === palier.id
            const prix = PRIX_PAR_PALIER[palier.id]
            return (
              <div key={palier.id} style={{
                border: `2px solid ${estActuel ? palier.couleur : '#e2e8f0'}`,
                borderRadius: 16, padding: 24, background: estActuel ? '#fffbf5' : '#fff',
                position: 'relative',
              }}>
                {estActuel && (
                  <span style={{
                    position: 'absolute', top: -12, left: 20,
                    background: palier.couleur, color: '#fff',
                    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                  }}>
                    VOTRE PALIER ACTUEL
                  </span>
                )}
                <h3 style={{ fontSize: 17, fontWeight: 700, color: palier.couleur, marginBottom: 4 }}>
                  {palier.label}
                </h3>
                <p style={{ fontSize: 20, fontWeight: 800, margin: '6px 0 16px' }}>
                  {prix ? `${prix.toLocaleString('fr-FR')} FCFA/mois` : 'Gratuit'}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {palier.avantages.map(a => (
                    <li key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                      <span style={{ color: palier.couleur, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {a}
                    </li>
                  ))}
                </ul>
                {!estActuel && palier.id !== 'gratuit' && (
                  <Link href="/boutique/abonnement" style={{
                    display: 'block', textAlign: 'center', background: palier.couleur, color: '#fff',
                    padding: '10px 0', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14,
                  }}>
                    Passer à {palier.label.replace('Boutique ', '')}
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Ajouter la carte dans `compte/page.tsx`**

Dans `frontend-next/src/app/(account)/compte/page.tsx`, remplacer le tableau `MENU` (lignes 6-17) :

```tsx
const MENU = [
  { href: '/mes-annonces',       label: 'Mes annonces',      emoji: '📋', desc: 'Gérer vos annonces classifiées',   actif: true },
  { href: '/mes-annonces-immo',  label: 'Mes biens immo',    emoji: '🏠', desc: 'Gérer vos annonces immobilières',  actif: true },
  { href: '/boutique',           label: 'Ma boutique',       emoji: '🏪', desc: 'Votre vitrine commerçante',        actif: true },
  { href: '/boutique/abonnement', label: 'Abonnement Pro',   emoji: '⭐', desc: 'Boostez votre visibilité',         actif: true },
  { href: '/boutique/analytics',  label: 'Analytics',        emoji: '📊', desc: 'Vues et clics de votre boutique',   actif: true },
  { href: '/favoris',            label: 'Mes favoris',       emoji: '♥',  desc: 'Produits sauvegardés',            actif: true },
  { href: '/deposer-annonce',    label: 'Publier une annonce',emoji: '➕', desc: 'Publier une annonce classifiée',  actif: true },
  { href: '/deposer-immo',       label: 'Publier un bien',   emoji: '🏡', desc: 'Publier une annonce immobilière', actif: true },
  { href: '/compte/apporteur',   label: 'Apporteur d\'affaires', emoji: '💼', desc: 'Recommandez Nopalou et touchez une commission', actif: true },
  { href: '/compte/profil',      label: 'Mon profil',        emoji: '✏️', desc: 'Modifier mes informations',       actif: true },
]
```

par :

```tsx
const MENU = [
  { href: '/mes-annonces',       label: 'Mes annonces',      emoji: '📋', desc: 'Gérer vos annonces classifiées',   actif: true },
  { href: '/mes-annonces-immo',  label: 'Mes biens immo',    emoji: '🏠', desc: 'Gérer vos annonces immobilières',  actif: true },
  { href: '/boutique',           label: 'Ma boutique',       emoji: '🏪', desc: 'Votre vitrine commerçante',        actif: true },
  { href: '/boutique/abonnement', label: 'Abonnement Pro',   emoji: '⭐', desc: 'Boostez votre visibilité',         actif: true },
  { href: '/boutique/analytics',  label: 'Analytics',        emoji: '📊', desc: 'Vues et clics de votre boutique',   actif: true },
  { href: '/favoris',            label: 'Mes favoris',       emoji: '♥',  desc: 'Produits sauvegardés',            actif: true },
  { href: '/deposer-annonce',    label: 'Publier une annonce',emoji: '➕', desc: 'Publier une annonce classifiée',  actif: true },
  { href: '/deposer-immo',       label: 'Publier un bien',   emoji: '🏡', desc: 'Publier une annonce immobilière', actif: true },
  { href: '/compte/apporteur',   label: 'Apporteur d\'affaires', emoji: '💼', desc: 'Recommandez Nopalou et touchez une commission', actif: true },
  { href: '/compte/fonctionnalites', label: 'Fonctionnalités & abonnements', emoji: '📖', desc: 'Découvrez tout ce que Nopalou propose', actif: true },
  { href: '/compte/profil',      label: 'Mon profil',        emoji: '✏️', desc: 'Modifier mes informations',       actif: true },
]
```

- [ ] **Step 3: Ajouter le lien dans `AccountNavLinks.tsx`**

Dans `frontend-next/src/app/(account)/AccountNavLinks.tsx`, remplacer le groupe « Compte » (lignes 23-29) :

```tsx
  {
    label: 'Compte',
    liens: [
      { href: '/compte/profil',    label: 'Mon profil',           emoji: '✏️' },
      { href: '/compte/apporteur', label: 'Apporteur d\'affaires', emoji: '💼' },
    ],
  },
```

par :

```tsx
  {
    label: 'Compte',
    liens: [
      { href: '/compte/profil',         label: 'Mon profil',                   emoji: '✏️' },
      { href: '/compte/apporteur',      label: 'Apporteur d\'affaires',        emoji: '💼' },
      { href: '/compte/fonctionnalites', label: 'Fonctionnalités & abonnements', emoji: '📖' },
    ],
  },
```

- [ ] **Step 4: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5: Vérification manuelle locale**

Avec le dev server actif (`npm run dev` dans `frontend-next/`) et un compte de test connecté :
1. Aller sur `/compte` — vérifier que la carte « 📖 Fonctionnalités & abonnements » est visible.
2. Cliquer dessus — vérifier que `/compte/fonctionnalites` charge sans erreur, affiche les 6 cartes de fonctionnalités plateforme et les 3 colonnes de paliers boutique.
3. Avec un compte sans boutique ou avec une boutique sans abonnement actif : vérifier que le palier « Gratuit » est marqué « VOTRE PALIER ACTUEL ».
4. Avec un compte ayant une boutique en abonnement Pro ou Business actif (si disponible en local) : vérifier que le palier correspondant est mis en surbrillance et que le CTA n'apparaît que sur les paliers supérieurs.

- [ ] **Step 6: Commit**

```bash
git add "frontend-next/src/app/(account)/compte/fonctionnalites/page.tsx" "frontend-next/src/app/(account)/compte/page.tsx" "frontend-next/src/app/(account)/AccountNavLinks.tsx"
git commit -m "feat(compte): ajoute la page fonctionnalites et abonnements"
```

---

### Task 3: Migration de `AbonnementClient.tsx` vers `PALIERS_BOUTIQUE`

**Files:**
- Modify: `frontend-next/src/app/boutique/abonnement/AbonnementClient.tsx`

**Interfaces:**
- Consumes: `PALIERS_BOUTIQUE` (Task 1).
- Produces: rien consommé par une tâche suivante (non-régression pure).

**Contexte** : `AbonnementClient.tsx` définit actuellement sa propre liste `PLANS_INFO` (lignes 11-36, reproduite dans Task 1) avec seulement `pro` et `business`. Cette page affiche un plan pour chaque entrée de la liste — si `PALIERS_BOUTIQUE` (Task 1) contenait le palier `gratuit`, cette page afficherait 3 colonnes au lieu de 2, ce qui casserait son comportement actuel (elle ne propose que Pro/Business à la souscription, la page n'a pas de bouton pour un plan gratuit puisqu'il est implicite). Il faut donc filtrer `gratuit` en consommant `PALIERS_BOUTIQUE`.

- [ ] **Step 1: Remplacer `PLANS_INFO` par un import filtré de `PALIERS_BOUTIQUE`**

Dans `frontend-next/src/app/boutique/abonnement/AbonnementClient.tsx`, remplacer (lignes 1-9) :

```tsx
'use client'
import { useState, useTransition } from 'react'
import { initierWaveAbonnement } from '@/app/actions/paiement'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'

const PLANS_DEFAUT = {
  pro: 15000,
  business: 35000,
}
```

par :

```tsx
'use client'
import { useState, useTransition } from 'react'
import { initierWaveAbonnement } from '@/app/actions/paiement'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'
import { PALIERS_BOUTIQUE } from '@/lib/fonctionnalites-data'

const PLANS_DEFAUT = {
  pro: 15000,
  business: 35000,
}
```

Puis remplacer la définition locale `PLANS_INFO` (lignes 11-36, incluses dans le bloc ci-dessus déjà retiré au step précédent si contigu — sinon bloc séparé juste après) :

```tsx
const PLANS_INFO = [
  {
    id: 'pro' as const,
    label: 'Boutique Pro',
    couleur: '#C75B00',
    avantages: [
      'Placement prioritaire dans /boutiques',
      'Badge "Vendeur Pro" sur toutes vos annonces',
      '5 annonces classées incluses/mois',
      'Tableau de bord analytics (vues, clics)',
      'Statistiques des prix concurrents',
    ],
  },
  {
    id: 'business' as const,
    label: 'Boutique Business',
    couleur: '#1e3a5f',
    avantages: [
      'Tout ce qui est inclus dans Pro',
      'URL dédiée /boutiques/[votre-nom]',
      '15 annonces classées incluses/mois',
      'Bannière dans 1 page catégorie',
      'Support prioritaire WhatsApp',
    ],
  },
]
```

par :

```tsx
const PLANS_INFO = PALIERS_BOUTIQUE.filter((p): p is typeof PALIERS_BOUTIQUE[number] & { id: 'pro' | 'business' } =>
  p.id === 'pro' || p.id === 'business'
)
```

- [ ] **Step 2: Vérifier que le reste du fichier compile sans changement**

Le reste du composant (`handleSouscrire`, le rendu des cartes, `plan.id`/`plan.label`/`plan.couleur`/`plan.avantages`) référence les mêmes champs que `PALIERS_BOUTIQUE` expose — aucune autre modification n'est nécessaire dans ce fichier. Relire les lignes 38-192 du fichier pour confirmer qu'aucun accès à un champ absent de `PalierBoutique` n'existe (il n'y en a pas, les deux structures sont identiques sur les champs `id`/`label`/`couleur`/`avantages`).

- [ ] **Step 3: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Vérification manuelle locale — non-régression**

Avec le dev server actif, aller sur `/boutique/abonnement` (compte de test avec boutique) :
1. Vérifier que les 2 colonnes Pro/Business s'affichent exactement comme avant (mêmes avantages, mêmes couleurs, mêmes prix).
2. Vérifier qu'aucune 3ᵉ colonne « Gratuit » n'apparaît sur cette page.
3. Si un plan est actif, vérifier que le badge « VOTRE PLAN » et le bouton désactivé fonctionnent comme avant.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/boutique/abonnement/AbonnementClient.tsx
git commit -m "refactor(abonnement): consomme PALIERS_BOUTIQUE au lieu d'une liste locale dupliquee"
```

---

### Task 4: Routes visuels format carré (1080×1080)

**Files:**
- Create: `frontend-next/src/app/assets/palier/[plan]/carre/route.tsx`

**Interfaces:**
- Consumes: `PALIERS_BOUTIQUE` (Task 1).
- Produces: routes `GET /assets/palier/{gratuit|pro|business}/carre` — chacune une image PNG 1080×1080. Consommées par Task 6 (admin), Task 7 (apporteur), Task 8 (marketing boutique).

**Contexte — référence de style à égaler** (`frontend-next/src/app/assets/chatbot-whatsapp/route.tsx`, déjà dans le repo, fichier complet lu en amont de ce plan — composition asymétrique avec halos décoratifs `radial-gradient`, bande d'accent, badges à bordure, mockup encadré). Ne pas copier ce fichier tel quel (c'est un mockup de conversation, contenu différent) — s'en inspirer pour le niveau de qualité (halos, badges, palette, pas de simple liste centrée sur fond plat).

**Contexte — accès aux `settings` pour le prix, pattern à suivre** (`frontend-next/src/app/admin/(protected)/communication/page.tsx`, lignes 340-358) :

```tsx
const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
let prixPro = 15000
let prixBusiness = 35000
try {
  const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
  if (r.ok) {
    const s = await r.json()
    prixPro = Number(s.plan_pro_prix) || 15000
    prixBusiness = Number(s.plan_business_prix) || 35000
  }
} catch {
  // valeurs par défaut
}
```

Note : la route `/api/settings/public` (pas `/api/settings`, qui exige `X-Admin-Secret`) est celle utilisée par les pages publiques/utilisateur (`AbonnementClient.tsx` via son `page.tsx` server component) — c'est celle-ci qu'il faut utiliser ici puisque ces routes visuelles ne sont pas protégées par un secret admin.

- [ ] **Step 1: Créer la route carrée**

Créer `frontend-next/src/app/assets/palier/[plan]/carre/route.tsx` :

```tsx
import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { PALIERS_BOUTIQUE } from '@/lib/fonctionnalites-data'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: { plan: string } }
) {
  const palier = PALIERS_BOUTIQUE.find(p => p.id === params.plan)
  if (!palier) notFound()

  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let prix: number | null = null
  if (palier.id !== 'gratuit') {
    let prixPro = 15000
    let prixBusiness = 35000
    try {
      const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
      if (r.ok) {
        const s = await r.json()
        prixPro = Number(s.plan_pro_prix) || 15000
        prixBusiness = Number(s.plan_business_prix) || 35000
      }
    } catch { /* valeurs par défaut ci-dessus */ }
    prix = palier.id === 'pro' ? prixPro : prixBusiness
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(160deg, #1C2B4A 0%, #132038 55%, ${palier.couleur}22 100%)`,
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Halo décoratif */}
        <div
          style={{
            position: 'absolute',
            right: -140,
            top: -140,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${palier.couleur}48 0%, transparent 70%)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -120,
            bottom: -60,
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(199,91,0,0.18) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        <div style={{ height: 8, background: palier.couleur, display: 'flex' }} />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '40px 60px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 54, height: 54, borderRadius: 13, background: '#C75B00',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, fontWeight: 900, color: '#fff',
              }}
            >
              N
            </div>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', display: 'flex' }}>
              Nopa<span style={{ color: '#C75B00', display: 'flex' }}>lou</span>
            </span>
          </div>
          <div
            style={{
              background: `${palier.couleur}30`, border: `1.5px solid ${palier.couleur}`,
              borderRadius: 40, padding: '9px 22px', fontSize: 16, color: '#fff',
              fontWeight: 700, display: 'flex',
            }}
          >
            {palier.label.toUpperCase()}
          </div>
        </div>

        {/* Prix */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 60px 0' }}>
          <span style={{ fontSize: 56, fontWeight: 900, color: '#fff', display: 'flex' }}>
            {prix ? `${prix.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}
          </span>
          {prix && (
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', display: 'flex', marginTop: 6 }}>
              par mois
            </span>
          )}
        </div>

        {/* Liste avantages */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, padding: '48px 80px 0' }}>
          {palier.avantages.slice(0, 6).map(a => (
            <div key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span
                style={{
                  width: 32, height: 32, borderRadius: '50%', background: palier.couleur,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: '#fff', flexShrink: 0,
                }}
              >
                ✓
              </span>
              <span style={{ fontSize: 24, color: '#fff', display: 'flex', lineHeight: 1.3 }}>
                {a}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 60px 48px' }}>
          <span style={{ fontSize: 18, color: '#94A3B8', fontWeight: 700, display: 'flex' }}>
            nopalou.com
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
```

- [ ] **Step 2: Vérifier le rendu des 3 paliers**

Démarrer `cd frontend-next && npm run dev` si pas déjà lancé, puis :

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3001/assets/palier/gratuit/carre
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3001/assets/palier/pro/carre
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3001/assets/palier/business/carre
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/assets/palier/inexistant/carre
```

Expected : `200 image/png` pour les 3 premiers, `404` pour le dernier (palier invalide). Ouvrir au moins une des 3 URLs dans un navigateur pour confirmer visuellement l'absence de chevauchement/troncature de texte, en particulier si un palier a 6 avantages (vérifier que la liste ne déborde pas de la zone `flex: 1`).

- [ ] **Step 3: Commit**

```bash
git add "frontend-next/src/app/assets/palier/[plan]/carre/route.tsx"
git commit -m "feat(visuels): ajoute le visuel carre par palier d'abonnement"
```

---

### Task 5: Route visuel format story (1080×1920)

**Files:**
- Create: `frontend-next/src/app/assets/palier/[plan]/story/route.tsx`

**Interfaces:**
- Consumes: `PALIERS_BOUTIQUE` (Task 1). Structure et logique de récupération des `settings` identiques à Task 4.
- Produces: routes `GET /assets/palier/{gratuit|pro|business}/story` — chacune une image PNG 1080×1920. Consommées par Task 6, 7, 8 au même titre que les routes carrées.

**Contexte — référence de style à égaler pour le format vertical** (`frontend-next/src/app/assets/boutique/[id]/story/route.tsx`, déjà dans le repo — composition asymétrique, bloc titre dominant aligné à gauche, carte « vitrine » tiltée avec élément débordant, bande diagonale d'accent). S'en inspirer pour la structure verticale (en-tête → titre dominant → bloc central → CTA bas), pas pour le contenu (celui-ci présente une boutique, celui-ci présente un palier).

- [ ] **Step 1: Créer la route story**

Créer `frontend-next/src/app/assets/palier/[plan]/story/route.tsx` :

```tsx
import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { PALIERS_BOUTIQUE } from '@/lib/fonctionnalites-data'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: { plan: string } }
) {
  const palier = PALIERS_BOUTIQUE.find(p => p.id === params.plan)
  if (!palier) notFound()

  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let prix: number | null = null
  if (palier.id !== 'gratuit') {
    let prixPro = 15000
    let prixBusiness = 35000
    try {
      const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
      if (r.ok) {
        const s = await r.json()
        prixPro = Number(s.plan_pro_prix) || 15000
        prixBusiness = Number(s.plan_business_prix) || 35000
      }
    } catch { /* valeurs par défaut ci-dessus */ }
    prix = palier.id === 'pro' ? prixPro : prixBusiness
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(165deg, #1C2B4A 0%, #16223B 48%, #0F1D35 100%)`,
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Halos décoratifs */}
        <div
          style={{
            position: 'absolute', right: -260, top: -220, width: 760, height: 760,
            borderRadius: '50%', background: `radial-gradient(circle, ${palier.couleur}55 0%, transparent 68%)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute', left: -300, bottom: 120, width: 720, height: 720,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,185,138,0.14) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Bande d'accent diagonale */}
        <div
          style={{
            position: 'absolute', right: -160, top: 780, width: 900, height: 260,
            background: `linear-gradient(90deg, transparent 0%, ${palier.couleur}80 100%)`,
            transform: 'rotate(-14deg)', display: 'flex',
          }}
        />

        {/* En-tête Nopalou */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '78px 80px 0' }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 16, background: '#C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, fontWeight: 900, color: '#fff',
            }}
          >
            N
          </div>
          <span style={{ fontSize: 42, fontWeight: 900, color: '#fff', display: 'flex' }}>
            Nopa<span style={{ color: '#C75B00', display: 'flex' }}>lou</span>
          </span>
        </div>

        {/* Bloc titre — nom du palier dominant */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '110px 80px 0' }}>
          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: 8, color: palier.couleur, display: 'flex' }}>
            BOUTIQUE
          </span>
          <span
            style={{
              fontSize: 96, fontWeight: 900, color: '#fff', lineHeight: 1.05, marginTop: 14, display: 'flex',
            }}
          >
            {palier.label.replace('Boutique ', '')}
          </span>
          <span style={{ fontSize: 44, fontWeight: 900, color: '#fff', marginTop: 24, display: 'flex' }}>
            {prix ? `${prix.toLocaleString('fr-FR')} FCFA/mois` : 'Gratuit, sans engagement'}
          </span>
        </div>

        {/* Carte avantages */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 80px 40px' }}>
          <div
            style={{
              display: 'flex', flexDirection: 'column', gap: 22, width: 720,
              background: '#FFF7EF', borderRadius: 44, padding: '56px 56px',
              boxShadow: '0 40px 90px rgba(0,0,0,0.5)',
            }}
          >
            {palier.avantages.slice(0, 6).map(a => (
              <div key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <span
                  style={{
                    width: 36, height: 36, borderRadius: '50%', background: palier.couleur,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, color: '#fff', flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span style={{ fontSize: 26, color: '#1C2B4A', fontWeight: 600, display: 'flex', lineHeight: 1.3 }}>
                  {a}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA bas */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 80px 110px' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 18, background: palier.couleur,
              borderRadius: 24, padding: '30px 66px', boxShadow: `0 20px 50px ${palier.couleur}70`,
            }}
          >
            <span style={{ fontSize: 40, display: 'flex' }}>🏪</span>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', display: 'flex' }}>
              Créez votre boutique sur Nopalou
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
```

- [ ] **Step 2: Vérifier le rendu des 3 paliers**

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3001/assets/palier/gratuit/story
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3001/assets/palier/pro/story
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3001/assets/palier/business/story
```

Expected : `200 image/png` pour les 3. Ouvrir au moins le palier avec le plus d'avantages (`pro`, 6 avantages) dans un navigateur pour confirmer que la carte ne déborde pas verticalement et que le texte ne se chevauche pas avec la bande diagonale d'accent.

- [ ] **Step 3: Commit**

```bash
git add "frontend-next/src/app/assets/palier/[plan]/story/route.tsx"
git commit -m "feat(visuels): ajoute le visuel story par palier d'abonnement"
```

---

### Task 6: Section admin « Kit fonctionnalités & abonnements »

**Files:**
- Modify: `frontend-next/src/app/admin/(protected)/communication/page.tsx`

**Interfaces:**
- Consumes: `PALIERS_BOUTIQUE` (Task 1), routes `/assets/palier/[plan]/carre` et `/assets/palier/[plan]/story` (Task 4, 5). `prixPro`/`prixBusiness` déjà chargés en haut du fichier (lignes 345-358, existant, pas de nouveau fetch nécessaire).
- Produces: rien consommé par une tâche suivante (dernière section du kit admin).

**Contexte — fin actuelle du fichier, section « Kit assistant WhatsApp »** (lignes 613-686, dernière section du fichier) :

```tsx
      <section>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          📢 Texte de recrutement (à partager par WhatsApp/réseaux)
        </h2>
        <pre style={{
          fontSize: 13, color: '#1C2B4A', whiteSpace: 'pre-wrap',
          background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: 8, padding: '20px', margin: 0, lineHeight: 1.8,
          fontFamily: 'system-ui, sans-serif',
        }}>
          {apporteurTexte}
        </pre>
      </section>

      <hr style={{ border: 'none', borderTop: '2px solid #E2E8F0', margin: '48px 0' }} />

      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C2B4A', marginBottom: 6 }}>
        💬 Kit assistant WhatsApp
      </h1>
      <p style={{ color: '#64748B', marginBottom: 32, fontSize: 14 }}>
        Visuel, texte et argumentaire pour annoncer le chatbot WhatsApp sur les réseaux et auprès des utilisateurs.
        Page publique de présentation : <a href="/assistant-whatsapp" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 700 }}>nopalou.com/assistant-whatsapp</a>
      </p>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          ⚙️ Ce que le chatbot sait faire
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {CHATBOT_FONCTIONS.map(groupe => (
            <div key={groupe.groupe}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#25D366', margin: '0 0 12px' }}>
                {groupe.groupe}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {groupe.items.map((f, i) => (
                  <div key={f.titre} style={{
                    border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px',
                    background: '#fff', display: 'flex', gap: 14,
                  }}>
                    <span style={{
                      fontSize: 13, fontWeight: 800, color: '#25D366', background: '#f0fdf4',
                      borderRadius: '50%', width: 26, height: 26, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{i + 1}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1C2B4A', margin: '0 0 4px' }}>{f.titre}</p>
                      <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          📢 Texte d&apos;annonce (à partager par WhatsApp/réseaux)
        </h2>
        <pre style={{
          fontSize: 13, color: '#1C2B4A', whiteSpace: 'pre-wrap',
          background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: 8, padding: '20px', margin: 0, lineHeight: 1.8,
          fontFamily: 'system-ui, sans-serif',
        }}>
          {CHATBOT_TEXTE}
        </pre>
      </section>
    </div>
  )
}
```

- [ ] **Step 1: Ajouter l'import de `PALIERS_BOUTIQUE`**

En haut de `frontend-next/src/app/admin/(protected)/communication/page.tsx`, ligne 1, remplacer :

```tsx
import { cookies } from 'next/headers'
```

par :

```tsx
import { cookies } from 'next/headers'
import { PALIERS_BOUTIQUE } from '@/lib/fonctionnalites-data'
```

- [ ] **Step 2: Ajouter la nouvelle section après le Kit assistant WhatsApp**

Remplacer les 3 dernières lignes du fichier (fermeture du composant) :

```tsx
        </pre>
      </section>
    </div>
  )
}
```

par (nouvelle section insérée avant la fermeture) :

```tsx
        </pre>
      </section>

      <hr style={{ border: 'none', borderTop: '2px solid #E2E8F0', margin: '48px 0' }} />

      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C2B4A', marginBottom: 6 }}>
        🎯 Kit fonctionnalités & abonnements
      </h1>
      <p style={{ color: '#64748B', marginBottom: 32, fontSize: 14 }}>
        Visuels par palier d&apos;abonnement boutique, pour démarcher un marchand ou l&apos;aider à comparer les paliers.
        Page de référence pour les utilisateurs connectés : <code>/compte/fonctionnalites</code>
      </p>

      <section>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          🖼 Visuels par palier
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {PALIERS_BOUTIQUE.map(palier => (
            <div key={palier.id} style={{
              border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px', background: '#fff',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: palier.couleur, margin: '0 0 14px' }}>
                {palier.label}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  <a href={`/assets/palier/${palier.id}/carre`} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/assets/palier/${palier.id}/carre`} alt={`${palier.label} — carré`} style={{ width: '100%', display: 'block', aspectRatio: '1/1', objectFit: 'cover' }} />
                  </a>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '8px 12px 12px' }}>Format carré (1080×1080)</p>
                </div>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  <a href={`/assets/palier/${palier.id}/story`} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/assets/palier/${palier.id}/story`} alt={`${palier.label} — story`} style={{ width: '100%', display: 'block', aspectRatio: '9/16', objectFit: 'cover' }} />
                  </a>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '8px 12px 12px' }}>Format story (1080×1920)</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Vérification manuelle locale**

Avec le dev server actif et une session admin (`X-Admin-Secret` valide, connexion via `/admin/login`), aller sur `/admin/communication` :
1. Défiler jusqu'à la nouvelle section « 🎯 Kit fonctionnalités & abonnements ».
2. Vérifier que les 3 blocs (Gratuit/Pro/Business) affichent chacun 2 miniatures (carré + story) qui se chargent sans erreur.
3. Cliquer sur une miniature — vérifier l'ouverture de l'image en plein format dans un nouvel onglet.

- [ ] **Step 5: Commit**

```bash
git add "frontend-next/src/app/admin/(protected)/communication/page.tsx"
git commit -m "feat(admin): ajoute la section kit fonctionnalites et abonnements"
```

---

### Task 7: Lien vers les visuels depuis `/compte/apporteur`

**Files:**
- Modify: `frontend-next/src/app/(account)/compte/apporteur/ApporteurClient.tsx`

**Interfaces:**
- Consumes: routes `/assets/palier/[plan]/carre` (Task 4) — uniquement le format carré, pour rester simple (décision de la spec).
- Produces: rien consommé par une tâche suivante.

**Contexte — bloc actions de partage actuel** (`ApporteurClient.tsx`, lignes 106-134) :

```tsx
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={copierLien}
            style={{ padding: '10px 18px', background: copie ? '#16a34a' : '#1C2B4A', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {copie ? '✓ Copié' : '📋 Copier le lien'}
          </button>
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#25D366', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            💬 Partager sur WhatsApp
          </a>
          <a
            href="/assets/apporteur-affaires"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#fff', color: '#C75B00',
              border: '1px solid #C75B00', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            🖼 Télécharger le visuel
          </a>
        </div>
      </div>
```

- [ ] **Step 1: Ajouter une sous-section « Visuels par palier » sous le bloc de partage**

Dans `ApporteurClient.tsx`, remplacer le bloc ci-dessus (lignes 106-135, incluant la fermeture `</div>` du conteneur parent) :

```tsx
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={copierLien}
            style={{ padding: '10px 18px', background: copie ? '#16a34a' : '#1C2B4A', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {copie ? '✓ Copié' : '📋 Copier le lien'}
          </button>
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#25D366', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            💬 Partager sur WhatsApp
          </a>
          <a
            href="/assets/apporteur-affaires"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#fff', color: '#C75B00',
              border: '1px solid #C75B00', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            🖼 Télécharger le visuel
          </a>
        </div>
      </div>
```

par :

```tsx
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={copierLien}
            style={{ padding: '10px 18px', background: copie ? '#16a34a' : '#1C2B4A', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {copie ? '✓ Copié' : '📋 Copier le lien'}
          </button>
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#25D366', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            💬 Partager sur WhatsApp
          </a>
          <a
            href="/assets/apporteur-affaires"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#fff', color: '#C75B00',
              border: '1px solid #C75B00', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            🖼 Télécharger le visuel
          </a>
        </div>

        <p style={{ fontSize: 12, color: '#64748B', margin: '16px 0 8px' }}>
          Visuels par palier d&apos;abonnement, à partager avec le commerçant que vous démarchez :
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/assets/palier/gratuit/carre" target="_blank" rel="noopener noreferrer" style={{
            padding: '8px 14px', background: '#fff', color: '#64748B', border: '1px solid #E2E8F0',
            borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}>
            Gratuit →
          </a>
          <a href="/assets/palier/pro/carre" target="_blank" rel="noopener noreferrer" style={{
            padding: '8px 14px', background: '#fff', color: '#C75B00', border: '1px solid #C75B00',
            borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}>
            Pro →
          </a>
          <a href="/assets/palier/business/carre" target="_blank" rel="noopener noreferrer" style={{
            padding: '8px 14px', background: '#fff', color: '#1e3a5f', border: '1px solid #1e3a5f',
            borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}>
            Business →
          </a>
        </div>
      </div>
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Vérification manuelle locale**

Avec le dev server actif et un compte apporteur activé (ou en activer un via le bouton « Devenir apporteur d'affaires »), aller sur `/compte/apporteur` :
1. Vérifier l'affichage des 3 liens « Gratuit / Pro / Business » sous le bloc de partage existant.
2. Cliquer sur chacun — vérifier l'ouverture de l'image correspondante dans un nouvel onglet.

- [ ] **Step 4: Commit**

```bash
git add "frontend-next/src/app/(account)/compte/apporteur/ApporteurClient.tsx"
git commit -m "feat(apporteur): ajoute les liens vers les visuels par palier"
```

---

### Task 8: Lien vers le visuel du palier actuel depuis l'onglet Marketing boutique

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx`

**Interfaces:**
- Consumes: routes `/assets/palier/[plan]/carre` (Task 4). `planActif` — déjà disponible dans `BoutiqueManage` (`'pro' | 'business' | null`), doit être transmis à `MarketingBoutique` qui ne le reçoit pas actuellement.
- Produces: rien consommé par une tâche suivante (dernière tâche fonctionnelle avant vérification finale).

**Contexte — signature actuelle de `MarketingBoutique`** (`BoutiqueClient.tsx`, ligne 983) :

```tsx
function MarketingBoutique({ boutique, onVoirJamaisPartages }: { boutique: Boutique; onVoirJamaisPartages: () => void }) {
```

**Contexte — signature actuelle de `BoutiqueManage` et son état `planActif`** (lignes 1451-1457) :

```tsx
function BoutiqueManage({ boutique, planActif, onBack, onEdit, prixPro }: {
  boutique: Boutique
  planActif: 'pro' | 'business' | null
  onBack: () => void
  onEdit: () => void
  prixPro: number
}) {
```

**Contexte — appel actuel de `MarketingBoutique` dans `BoutiqueManage`** (ligne ~1541, à localiser par contenu — le fichier a pu légèrement bouger depuis la lecture de ce plan) :

```tsx
        {tab === 'marketing' && <MarketingBoutique boutique={boutique} onVoirJamaisPartages={() => { setFiltreProduitsMarketing('jamais_partage'); setTab('produits') }} />}
```

- [ ] **Step 1: Ajouter la prop `planActif` à `MarketingBoutique`**

Remplacer la signature (ligne 983) :

```tsx
function MarketingBoutique({ boutique, onVoirJamaisPartages }: { boutique: Boutique; onVoirJamaisPartages: () => void }) {
```

par :

```tsx
function MarketingBoutique({ boutique, onVoirJamaisPartages, planActif }: { boutique: Boutique; onVoirJamaisPartages: () => void; planActif: 'pro' | 'business' | null }) {
```

- [ ] **Step 2: Passer `planActif` depuis `BoutiqueManage`**

Chercher dans le fichier l'appel `<MarketingBoutique boutique={boutique} onVoirJamaisPartages={...} />` (à l'intérieur de `BoutiqueManage`, où `planActif` est déjà disponible comme prop du composant) et ajouter `planActif={planActif}` :

```tsx
        {tab === 'marketing' && <MarketingBoutique boutique={boutique} onVoirJamaisPartages={() => { setFiltreProduitsMarketing('jamais_partage'); setTab('produits') }} planActif={planActif} />}
```

- [ ] **Step 3: Ajouter le lien vers le visuel du palier actuel dans le rendu de `MarketingBoutique`**

Dans le corps de `MarketingBoutique`, juste après la fermeture du bloc « Assistant WhatsApp de la boutique » (2ᵉ carte, avant la fermeture `</div>` finale du composant), ajouter une nouvelle section. Localiser la fin du rendu (structure : bandeau conseils → carte boutique → carte assistant WhatsApp → fermeture) et insérer avant le `</div>` de fermeture final :

```tsx
      <div style={{
        marginTop: 16, padding: '16px 20px', background: '#f8fafc',
        border: '1px solid #e2e8f0', borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Un visuel prêt à partager pour votre palier actuel ({planActif === 'business' ? 'Business' : planActif === 'pro' ? 'Pro' : 'Gratuit'}) :
        </p>
        <a
          href={`/assets/palier/${planActif ?? 'gratuit'}/carre`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '8px 16px', background: '#1C2B4A', color: '#fff', borderRadius: 8,
            fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          🖼 Voir le visuel →
        </a>
      </div>
```

- [ ] **Step 4: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5: Vérification manuelle locale**

Avec le dev server actif et une boutique de test (idéalement testée avec un compte sans abonnement ET un compte avec abonnement Pro/Business si possible en local) :
1. Aller dans `/boutique` → onglet Marketing.
2. Vérifier la présence du nouveau bloc « Un visuel prêt à partager pour votre palier actuel » avec le bon libellé de palier.
3. Cliquer sur « 🖼 Voir le visuel → » — vérifier l'ouverture du visuel carré correspondant au palier réel de la boutique testée.

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): lien vers le visuel du palier actuel dans l'onglet Marketing"
```

---

### Task 9: Vérification finale de branche

**Files:** aucun fichier modifié — vérification uniquement.

**Interfaces:** aucune (tâche de vérification transverse).

- [ ] **Step 1: Compilation TypeScript complète**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: exit code 0, aucune erreur.

- [ ] **Step 2: Grep — aucun prix codé en dur dans les nouveaux fichiers**

```bash
grep -n "15000\|35000" frontend-next/src/lib/fonctionnalites-data.ts
```

Expected : aucune occurrence (ces valeurs ne doivent apparaître que comme repli dans les routes/pages qui lisent `settings`, jamais dans le fichier de données lui-même).

- [ ] **Step 3: Revue de cohérence contre la spec**

Relire `docs/superpowers/specs/2026-07-19-kit-fonctionnalites-abonnements-design.md` et confirmer pour chacun des 4 volets :
1. Source de données partagée sans duplication — Task 1, 3.
2. Page `/compte/fonctionnalites` personnalisée selon le palier actuel — Task 2.
3. 6 visuels (3 paliers × 2 formats), même niveau d'exigence que `/assets/chatbot-whatsapp` — Task 4, 5.
4. Diffusion (admin, apporteur, marketing boutique), mêmes routes réutilisées sans duplication de génération d'image — Task 6, 7, 8.

- [ ] **Step 4: Parcours manuel complet en local**

Avec le dev server actif :
1. `/compte` → clic sur « Fonctionnalités & abonnements » → page complète, palier actuel en surbrillance.
2. `/boutique/abonnement` → confirmer 2 colonnes Pro/Business identiques à avant (non-régression Task 3).
3. Les 6 URLs `/assets/palier/{gratuit,pro,business}/{carre,story}` chargent toutes en `200 image/png`.
4. `/admin/communication` → nouvelle section visible, 6 miniatures cliquables.
5. `/compte/apporteur` → 3 liens de visuels visibles et fonctionnels.
6. `/boutique` → onglet Marketing → lien vers le visuel du palier actuel visible et fonctionnel.

- [ ] **Step 5: Commit final si des ajustements ont été faits pendant la vérification**

```bash
git add -A
git commit -m "fix: ajustements suite a la verification finale kit fonctionnalites abonnements"
```

(Ne committer que s'il y a effectivement des changements — `git status` doit montrer des fichiers modifiés avant ce commit.)
