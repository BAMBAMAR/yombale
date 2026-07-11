# Chantier SEO site-wide « Qualité puis conquête » — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Débloquer l'indexation Google de nopalou.com (719 découvertes / 4 indexées) puis conquérir les requêtes locales avec 20 landing pages produits/immo/télécom.

**Architecture:** Next.js 14 App Router (frontend-next/, SSR force-dynamic) + Express backend (backend/). Les landing pages réutilisent les APIs existantes (`/api/produits?sousType=`, `/api/immo?transaction=&type_bien=`, `/api/telecom?operateur=`) avec des configs codées en dur dans des fichiers `*-data.ts`. La route cassée `moins-de-[budget]` est remplacée par un vrai segment dynamique `[sousCategorie]` qui gère budget + sous-catégories.

**Tech Stack:** Next.js 14 (Metadata API, JSON-LD), Express/pg, aucune nouvelle dépendance.

**Spec:** `docs/superpowers/specs/2026-07-11-seo-site-wide-design.md`

## Global Constraints

- **Avant de déclarer une tâche terminée** : `cd frontend-next && npx tsc --noEmit` → zéro erreur (règle projet depuis l'incident du 10 juillet). Pour les tâches backend : `node -c` n'existe pas — utiliser `node -e "require('./backend/routes/produits.js')"` ne marche pas hors contexte Express ; vérifier par `node --check backend/routes/produits.js`.
- **Apostrophes françaises dans les littéraux JS/TS** : jamais `'...l'offre...'` entre guillemets simples — utiliser des template literals (`` ` ``) ou `\'`. Dans le JSX : `&apos;`. (Bug réel du 10 juillet qui a cassé la compilation.)
- **Encodage** : tous les fichiers en UTF-8. Ne JAMAIS écrire de fichier source via PowerShell `Out-File` (UTF-16 par défaut). Le fichier `moins-de-[budget]/page.tsx` actuel contient du mojibake (`TÃ©lÃ©phones`) : ne copier AUCUNE chaîne depuis ce fichier.
- **Textes UI en français** ; marque : « Nopalou » ; devise : FCFA via l'helper `fcfa()` de `frontend-next/src/lib/format.ts`.
- Le template de titre `%s | Nopalou` est défini dans `frontend-next/src/app/layout.tsx:58` — **aucun `title:` de page ne doit contenir « Nopalou »** (le template l'ajoute). Les titres `openGraph.title` ne sont PAS templétés : ils peuvent garder « — Nopalou ».
- Pas de nouvelles dépendances npm.
- Un commit par tâche, messages en français, préfixes `feat(seo):` / `fix(seo):`.
- Le backend local se lance avec la vraie base de prod (`.env` racine) : requêtes en lecture uniquement, jamais d'écriture de test.

---

### Task 1: Backend — nouveaux sous-types produits

**Files:**
- Modify: `backend/routes/produits.js:36-43` (dictionnaire `SOUS_TYPE_MOTS`)

**Interfaces:**
- Produces: `GET /api/produits?categorie=<slug>&sousType=<st>` accepte 5 nouveaux `sousType` : `iphone`, `samsung`, `xiaomi`, `tecno`, `ordinateurs`. Les tâches 2-3 et 12 en dépendent.
- Aucun paramètre SQL ajouté (pas de renumérotation de placeholders — on étend seulement un dictionnaire JS).

- [ ] **Step 1: Étendre `SOUS_TYPE_MOTS`**

Dans `backend/routes/produits.js`, ajouter à la fin de l'objet `SOUS_TYPE_MOTS` (après la ligne `'tablette': [...]`) :

```js
      'iphone'      : ['iphone'],
      'samsung'     : ['samsung', 'galaxy'],
      'xiaomi'      : ['xiaomi', 'redmi', 'poco'],
      'tecno'       : ['tecno', 'spark', 'camon'],
      'ordinateurs' : ['laptop', 'ordinateur', 'macbook', 'notebook', 'pc portable', 'lenovo', 'dell', 'asus', 'acer', 'chromebook'],
```

- [ ] **Step 2: Vérifier la syntaxe**

Run: `node --check backend/routes/produits.js`
Expected: aucune sortie (exit 0)

- [ ] **Step 3: Vérifier contre la base réelle**

Démarrer le backend local : `SCRAPING_DISABLED=true node backend/app.js` (en tâche de fond), puis :

```bash
curl -s "http://localhost:3000/api/produits?categorie=smartphones&sousType=iphone&limit=1" | grep -o '"total":[0-9]*'
curl -s "http://localhost:3000/api/produits?categorie=informatique&sousType=ordinateurs&limit=1" | grep -o '"total":[0-9]*'
curl -s "http://localhost:3000/api/produits?categorie=smartphones&sousType=inexistant&limit=1"
```

Expected: iphone → total > 1000 ; ordinateurs → total > 50 ; inexistant → `{"error":"Sous-type invalide"}`. Arrêter le backend après.

- [ ] **Step 4: Commit**

```bash
git add backend/routes/produits.js
git commit -m "feat(seo): 5 nouveaux sous-types produits (iphone, samsung, xiaomi, tecno, ordinateurs)"
```

---

### Task 2: Route `[sousCategorie]` — remplace la route budget cassée

**Contexte :** le dossier `frontend-next/src/app/categorie/[slug]/moins-de-[budget]/` est triplement buggé : (1) Next.js le traite comme un segment dynamique complet qui capture N'IMPORTE QUEL slug de 3ᵉ niveau (vérifié en prod : `/categorie/smartphones/nimportequoi-xyz` rend la page budget), (2) `params.budget` reçoit le segment entier (`moins-de-50000`) donc `parseInt` échoue et le budget est TOUJOURS 100 000, (3) tout son texte est en mojibake.

**Files:**
- Create: `frontend-next/src/app/categorie/categories-data.ts` (extraction de `CATEGORIES` depuis la page)
- Create: `frontend-next/src/app/categorie/sous-categories-data.ts` (config des landing pages, 1 entrée pilote)
- Create: `frontend-next/src/app/categorie/[slug]/[sousCategorie]/page.tsx`
- Delete: `frontend-next/src/app/categorie/[slug]/moins-de-[budget]/page.tsx` (et son dossier)
- Modify: `frontend-next/src/app/categorie/[slug]/page.tsx` (importer `CATEGORIES` au lieu de le définir)

**Interfaces:**
- Consumes: `sousType=clim` (existant backend), Task 1 pour les autres.
- Produces: `CATEGORIES` exporté depuis `categories-data.ts` (même shape qu'actuellement : `Record<string, { label, h1, intro, description, keywords, emoji, exemples }>`) ; `SOUS_CATEGORIES: Record<string, SousCategorieConfig>` exporté depuis `sous-categories-data.ts` avec `interface SousCategorieConfig { categorie: string; label: string; h1: string; titre: string; description: string; intro: string; sousType: string; emoji: string; keywords: string[] }`, clé = `"<slugCategorie>/<slugSousCategorie>"`. Les tâches 3, 9, 10 et 12 importent ces deux exports.

- [ ] **Step 1: Extraire `CATEGORIES` dans `categories-data.ts`**

Créer `frontend-next/src/app/categorie/categories-data.ts` : déplacer TEL QUEL le bloc `const CATEGORIES: Record<string, {...}> = { ... }` de `categorie/[slug]/page.tsx` (lignes 14-108) et le préfixer par `export`. Dans `categorie/[slug]/page.tsx`, supprimer le bloc et ajouter :

```ts
import { CATEGORIES } from '../categories-data'
```

- [ ] **Step 2: Créer `sous-categories-data.ts` avec l'entrée pilote climatiseurs**

```ts
// frontend-next/src/app/categorie/sous-categories-data.ts
export interface SousCategorieConfig {
  categorie: string      // slug de la catégorie parente
  label: string          // libellé court (liens, fil d'Ariane)
  h1: string
  titre: string          // <title> — SANS suffixe Nopalou (le template l'ajoute)
  description: string
  intro: string          // paragraphe sous le H1
  sousType: string       // paramètre sousType de l'API /api/produits
  emoji: string
  keywords: string[]
}

// Clé = "<slugCategorie>/<slugSousCategorie>" — l'URL est /categorie/<clé>
export const SOUS_CATEGORIES: Record<string, SousCategorieConfig> = {
  'tv-electro/climatiseurs': {
    categorie: 'tv-electro',
    label: 'Climatiseurs',
    h1: 'Climatiseur prix Dakar — comparez tous les modèles au Sénégal',
    titre: 'Climatiseur prix Dakar — Split, mobile, inverter au meilleur prix',
    description: `Comparez plus de 2 000 climatiseurs au Sénégal : split, mobile, inverter. Astech, Samsung, Hisense, Roch — trouvez le meilleur prix climatiseur à Dakar, mis à jour toutes les 6h.`,
    intro: `Quel est le prix d'un climatiseur à Dakar ? Nopalou compare en continu les climatiseurs split, mobiles et inverter vendus au Sénégal chez tous les grands marchands en ligne. Comptez environ 100 000 à 160 000 FCFA pour un split 1 CV d'entrée de gamme (Astech, Roch, Enduro), 150 000 à 250 000 FCFA pour un 1.5 CV, et davantage pour les modèles inverter Samsung ou Hisense, plus économes en électricité. Les climatiseurs mobiles (sans installation) démarrent autour de 100 000 FCFA.`,
    sousType: 'clim',
    emoji: '❄️',
    keywords: ['climatiseur prix Dakar', 'climatiseur mobile Dakar', 'climatiseur mobile prix Dakar', 'split 1.5cv prix Sénégal', 'climatiseur inverter Dakar', 'climatiseur Astech prix', 'mini climatiseur Dakar', 'climatiseur sans évacuation Dakar'],
  },
}
```

- [ ] **Step 3: Créer la route `[sousCategorie]`**

Créer `frontend-next/src/app/categorie/[slug]/[sousCategorie]/page.tsx` :

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import CardActions from '@/app/CardActions'
import ExternalImg from '@/components/ExternalImg'
import JsonLd from '@/components/JsonLd'
import { breadcrumbSchema } from '@/lib/schema-org'
import { CATEGORIES } from '../../categories-data'
import { SOUS_CATEGORIES } from '../../sous-categories-data'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
const BUDGET_RE = /^moins-de-(\d{4,9})$/

interface PageParams { slug: string; sousCategorie: string }

interface Produit {
  id: string
  nom: string
  marque: string | null
  prix_min: number | null
  nb_offres: number | null
  image_url: string | null
}

interface ApiResponse { produits?: Produit[]; data?: Produit[]; total?: number }

// Résout le 3e segment : page budget, sous-catégorie connue, ou null (→ 404)
function resolve(params: PageParams) {
  const cat = CATEGORIES[params.slug]
  if (!cat) return null
  const budgetMatch = params.sousCategorie.match(BUDGET_RE)
  if (budgetMatch) return { kind: 'budget' as const, cat, budget: Number(budgetMatch[1]) }
  const sousCat = SOUS_CATEGORIES[`${params.slug}/${params.sousCategorie}`]
  if (sousCat) return { kind: 'souscat' as const, cat, sousCat }
  return null
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const r = resolve(params)
  if (!r) return { title: 'Page introuvable' }
  const canonical = `${BASE}/categorie/${params.slug}/${params.sousCategorie}`
  if (r.kind === 'budget') {
    return {
      title: `${r.cat.label} à moins de ${fcfa(r.budget)} au Sénégal`,
      description: `Découvrez les ${r.cat.label.toLowerCase()} à moins de ${fcfa(r.budget)} au Sénégal. Comparez les meilleurs prix à Dakar, mis à jour toutes les 6h.`,
      alternates: { canonical },
      openGraph: { title: `${r.cat.label} à moins de ${fcfa(r.budget)} — Nopalou`, type: 'website', url: canonical },
    }
  }
  return {
    title: r.sousCat.titre,
    description: r.sousCat.description,
    keywords: r.sousCat.keywords,
    alternates: { canonical },
    openGraph: { title: `${r.sousCat.h1} — Nopalou`, description: r.sousCat.description, type: 'website', url: canonical },
  }
}

export default async function SousCategoriePage({
  params, searchParams,
}: { params: PageParams; searchParams: { page?: string; tri?: string } }) {
  const r = resolve(params)
  if (!r) notFound()

  const page = searchParams.page ?? '1'
  const tri = searchParams.tri ?? ''

  const qs = new URLSearchParams({ limit: '24', page, categorie: params.slug })
  if (r.kind === 'budget') qs.set('prixMax', String(r.budget))
  else qs.set('sousType', r.sousCat.sousType)
  if (tri) qs.set('tri', tri)

  let produits: Produit[] = []
  let total = 0
  let pages = 1
  try {
    const res = await fetch(`${BACKEND}/api/produits?${qs}`, { cache: 'no-store' })
    if (res.ok) {
      const data: ApiResponse = await res.json()
      produits = data.produits ?? data.data ?? []
      total = data.total ?? produits.length
      pages = Math.ceil(total / 24) || 1
    }
  } catch { /* état vide */ }

  const currentPage = Number(page)
  const h1 = r.kind === 'budget' ? `${r.cat.label} à moins de ${fcfa(r.budget)}` : r.sousCat.h1
  const intro = r.kind === 'budget'
    ? `Tous les ${r.cat.label.toLowerCase()} à moins de ${fcfa(r.budget)} disponibles au Sénégal, comparés chez tous les marchands en ligne. Prix mis à jour toutes les 6 heures.`
    : r.sousCat.intro
  const emoji = r.kind === 'budget' ? r.cat.emoji : r.sousCat.emoji
  const crumbLabel = r.kind === 'budget' ? `Moins de ${fcfa(r.budget)}` : r.sousCat.label
  const self = `/categorie/${params.slug}/${params.sousCategorie}`

  const breadcrumbs = [
    { name: 'Accueil', url: '/' },
    { name: r.cat.label, url: `/categorie/${params.slug}` },
    { name: crumbLabel, url: self },
  ]

  const itemListJsonLd = produits.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: h1,
    numberOfItems: total,
    itemListElement: produits.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem', position: i + 1, url: `${BASE}/produit/${p.id}`, name: p.nom,
    })),
  } : null

  function pageLink(n: number) {
    const ps = new URLSearchParams()
    if (tri) ps.set('tri', tri)
    if (n > 1) ps.set('page', String(n))
    const s = ps.toString()
    return `${self}${s ? `?${s}` : ''}`
  }

  return (
    <>
      <JsonLd schema={breadcrumbSchema(breadcrumbs)} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}

      <div className="page-container" style={{ paddingTop: '1.5rem' }}>
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          <Link href="/" style={{ color: 'var(--text2)' }}>Accueil</Link>
          {' › '}
          <Link href={`/categorie/${params.slug}`} style={{ color: 'var(--text2)' }}>{r.cat.label}</Link>
          {' › '}
          <span style={{ color: 'var(--text1)' }}>{crumbLabel}</span>
        </nav>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2, marginBottom: 10 }}>
            {emoji} {h1}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 720 }}>{intro}</p>
          {total > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
              <strong style={{ color: 'var(--accent)' }}>{total.toLocaleString('fr-FR')} produit{total > 1 ? 's' : ''}</strong> comparés au Sénégal · Prix mis à jour toutes les 6h
            </p>
          )}
        </div>

        {produits.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 48 }}>{emoji}</span>
            <p>Aucun produit disponible pour l&apos;instant.</p>
            <Link href={`/categorie/${params.slug}`} className="budget-pill active" style={{ marginTop: 12 }}>
              Voir toute la catégorie {r.cat.label}
            </Link>
          </div>
        ) : (
          <div className="grid-produits">
            {produits.map(p => (
              <Link key={p.id} href={`/produit/${p.id}`} style={{ display: 'contents' }}>
                <article className="card-produit">
                  <div className="card-img">
                    <ExternalImg src={p.image_url} alt={p.nom} fallback={emoji} fallbackClassName="card-img-placeholder" />
                  </div>
                  {p.marque && <p className="marque">{p.marque}</p>}
                  <p className="nom">{p.nom}</p>
                  <p className="prix">{p.prix_min ? fcfa(p.prix_min) : 'Prix sur demande'}</p>
                  {p.nb_offres != null && p.nb_offres > 1 && (
                    <p style={{ fontSize: '12px', color: 'var(--text3)' }}>{p.nb_offres} offres</p>
                  )}
                  <CardActions id={p.id} nom={p.nom} />
                </article>
              </Link>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="pagination">
            {currentPage > 1 && <Link href={pageLink(currentPage - 1)} className="page-btn">← Précédent</Link>}
            <span className="page-info">Page {currentPage} / {pages}</span>
            {currentPage < pages && <Link href={pageLink(currentPage + 1)} className="page-btn">Suivant →</Link>}
          </div>
        )}

        <div style={{ marginTop: 32 }}>
          <Link href={`/categorie/${params.slug}`} className="budget-pill">← Toute la catégorie {r.cat.label}</Link>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Supprimer l'ancienne route**

```bash
rm -rf "frontend-next/src/app/categorie/[slug]/moins-de-[budget]"
```

(Sans cette suppression, deux segments dynamiques frères coexistent → erreur de build Next.js.)

- [ ] **Step 5: Vérifier la compilation**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: exit 0, aucune erreur

- [ ] **Step 6: Vérifier le rendu (backend + frontend dev)**

Démarrer le backend (`SCRAPING_DISABLED=true node backend/app.js`) et le frontend (`cd frontend-next && npm run dev`), puis :

```bash
curl -s "http://localhost:3001/categorie/tv-electro/climatiseurs" | grep -oE '<title>[^<]*</title>|<h1[^>]*>[^<]*</h1>' | head -2
curl -s "http://localhost:3001/categorie/smartphones/moins-de-50000" | grep -oE '<title>[^<]*</title>' | head -1
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/categorie/smartphones/nimportequoi-xyz"
```

Expected: (1) title « Climatiseur prix Dakar … | Nopalou » (un seul « Nopalou ») + H1 climatiseurs ; (2) title « Téléphones & Smartphones à moins de 50 000 FCFA … » (accents corrects, budget 50 000 et non 100 000) ; (3) `404`.

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/app/categorie
git commit -m "feat(seo): route [sousCategorie] (landing pilote climatiseurs) + repare les pages budget (mojibake, budget jamais parse, soft-404)"
```

---

### Task 3: Les 8 autres configs de sous-catégories produits

**Files:**
- Modify: `frontend-next/src/app/categorie/sous-categories-data.ts`

**Interfaces:**
- Consumes: `SousCategorieConfig` (Task 2), sous-types backend (Task 1).
- Produces: `SOUS_CATEGORIES` complet à 9 entrées — consommé par les tâches 9, 10 et 12.

- [ ] **Step 1: Ajouter les 8 entrées**

Ajouter dans `SOUS_CATEGORIES` (même structure que l'entrée pilote — textes complets ci-dessous, ne pas les tronquer) :

```ts
  'smartphones/iphone': {
    categorie: 'smartphones', label: 'iPhone', sousType: 'iphone', emoji: '🍎',
    h1: 'iPhone prix Dakar — tous les modèles au meilleur prix',
    titre: 'iPhone prix Dakar — Comparez tous les modèles au Sénégal',
    description: `iPhone 11, 12, 13, 14, 15 : comparez plus de 1 700 offres iPhone au Sénégal, neufs et occasion. Trouvez le meilleur prix iPhone à Dakar, mis à jour toutes les 6h.`,
    intro: `Combien coûte un iPhone à Dakar ? Nopalou compare en continu les iPhone vendus au Sénégal, du modèle d'occasion abordable au dernier modèle neuf scellé. Les iPhone 11 et 12 d'occasion se trouvent généralement entre 120 000 et 250 000 FCFA, les iPhone 13 et 14 entre 250 000 et 450 000 FCFA, et les modèles récents Pro/Pro Max au-delà. Vérifiez toujours l'état (neuf, occasion, reconditionné) affiché sur chaque offre avant d'acheter.`,
    keywords: ['iPhone prix Dakar', 'iPhone Sénégal', 'iPhone occasion Dakar', 'iPhone 13 prix Sénégal', 'iPhone 14 prix Dakar', 'iPhone pas cher Dakar'],
  },
  'smartphones/samsung': {
    categorie: 'smartphones', label: 'Samsung', sousType: 'samsung', emoji: '📱',
    h1: 'Samsung Galaxy prix Dakar — comparez tous les modèles',
    titre: 'Samsung Galaxy prix Dakar — Téléphones Samsung au Sénégal',
    description: `Galaxy A, S, Note : comparez plus de 800 offres de téléphones Samsung au Sénégal. Trouvez le meilleur prix Samsung Galaxy à Dakar, mis à jour toutes les 6h.`,
    intro: `Les téléphones Samsung Galaxy sont parmi les plus recherchés au Sénégal. La gamme Galaxy A (A05, A15, A25…) offre le meilleur rapport qualité/prix entre 60 000 et 200 000 FCFA ; la gamme S (S22, S23, S24) vise le haut de gamme au-delà de 300 000 FCFA. Nopalou compare chaque modèle chez tous les marchands en ligne du Sénégal pour vous éviter de payer trop cher à Dakar.`,
    keywords: ['Samsung prix Dakar', 'Samsung Galaxy Sénégal', 'Galaxy A prix Dakar', 'Samsung A15 prix Sénégal', 'téléphone Samsung pas cher Dakar'],
  },
  'smartphones/xiaomi-redmi': {
    categorie: 'smartphones', label: 'Xiaomi & Redmi', sousType: 'xiaomi', emoji: '📱',
    h1: 'Xiaomi et Redmi prix Dakar — le meilleur rapport qualité/prix',
    titre: 'Xiaomi Redmi prix Dakar — Comparez les modèles au Sénégal',
    description: `Redmi, Note, Poco : comparez plus de 200 offres Xiaomi au Sénégal. Trouvez le meilleur prix Xiaomi Redmi à Dakar, mis à jour toutes les 6h.`,
    intro: `Xiaomi s'est imposé au Sénégal grâce à ses gammes Redmi et Poco au rapport qualité/prix imbattable. Un Redmi d'entrée de gamme se trouve dès 50 000 à 90 000 FCFA, un Redmi Note entre 100 000 et 180 000 FCFA. Nopalou compare toutes les offres Xiaomi, Redmi et Poco disponibles chez les marchands en ligne du Sénégal pour trouver le prix le plus bas à Dakar.`,
    keywords: ['Xiaomi prix Dakar', 'Redmi prix Sénégal', 'Redmi Note prix Dakar', 'Poco prix Sénégal', 'Xiaomi pas cher Dakar'],
  },
  'smartphones/tecno': {
    categorie: 'smartphones', label: 'Tecno', sousType: 'tecno', emoji: '📱',
    h1: 'Tecno prix Dakar — Spark, Camon et tous les modèles',
    titre: 'Tecno prix Dakar — Téléphones Tecno au Sénégal',
    description: `Tecno Spark, Camon : comparez les offres de téléphones Tecno au Sénégal. Trouvez le meilleur prix Tecno à Dakar, mis à jour toutes les 6h.`,
    intro: `Tecno est l'une des marques les plus vendues au Sénégal, portée par les gammes Spark (entrée de gamme, souvent entre 45 000 et 100 000 FCFA) et Camon (photo, 100 000 à 180 000 FCFA). Nopalou compare les prix Tecno chez tous les marchands en ligne du pays pour vous garantir le meilleur prix à Dakar, que le téléphone soit neuf ou d'occasion.`,
    keywords: ['Tecno prix Dakar', 'Tecno Spark prix Sénégal', 'Tecno Camon prix Dakar', 'téléphone Tecno pas cher'],
  },
  'tv-electro/televiseurs': {
    categorie: 'tv-electro', label: 'Téléviseurs', sousType: 'tv', emoji: '📺',
    h1: 'TV prix Dakar — Smart TV 32, 43, 55 pouces au meilleur prix',
    titre: 'TV prix Dakar — Smart TV Samsung, LG, Hisense au Sénégal',
    description: `Smart TV 32, 43, 50, 55 pouces : comparez les téléviseurs Samsung, LG, Hisense, Astech au Sénégal. Le meilleur prix TV à Dakar, mis à jour toutes les 6h.`,
    intro: `Quel est le prix d'une télévision à Dakar ? Une Smart TV 32 pouces d'entrée de gamme (Astech, Bruhm, Skyworth) se trouve entre 60 000 et 100 000 FCFA, une 43 pouces entre 120 000 et 200 000 FCFA, et les 55 pouces 4K Samsung ou LG au-delà de 250 000 FCFA. Nopalou compare chaque modèle chez tous les marchands en ligne du Sénégal — vérifiez le prix avant d'acheter en boutique.`,
    keywords: ['TV prix Dakar', 'Smart TV 32 pouces prix Sénégal', 'TV 43 pouces prix Dakar', 'télévision Samsung prix Sénégal', 'TV LG Dakar', 'Smart TV pas cher Dakar'],
  },
  'tv-electro/refrigerateurs': {
    categorie: 'tv-electro', label: 'Réfrigérateurs & Congélateurs', sousType: 'froid', emoji: '🧊',
    h1: 'Frigo prix Dakar — réfrigérateurs et congélateurs au Sénégal',
    titre: 'Frigo prix Dakar — Réfrigérateurs et congélateurs au meilleur prix',
    description: `Frigo bar, combiné, congélateur coffre : comparez les prix de réfrigérateurs au Sénégal. Astech, Samsung, Hisense — le meilleur prix frigo à Dakar.`,
    intro: `Le prix d'un frigo à Dakar varie fortement selon le format : un frigo bar démarre autour de 80 000 à 120 000 FCFA, un réfrigérateur deux portes entre 150 000 et 300 000 FCFA, et un congélateur coffre entre 130 000 et 250 000 FCFA selon la capacité en litres. Nopalou compare les modèles Astech, Samsung, Hisense, Enduro et autres chez tous les marchands en ligne du Sénégal.`,
    keywords: ['frigo prix Dakar', 'prix frigo Sénégal', 'frigo Astech prix', 'congélateur prix Dakar', 'frigo bar prix Dakar', 'réfrigérateur Samsung Sénégal'],
  },
  'tv-electro/electromenager': {
    categorie: 'tv-electro', label: 'Électroménager', sousType: 'electro', emoji: '🔌',
    h1: 'Électroménager prix Dakar — machines à laver, micro-ondes, ventilateurs',
    titre: 'Électroménager prix Dakar — Machine à laver, micro-ondes au Sénégal',
    description: `Machine à laver, micro-ondes, ventilateur, air fryer : comparez les prix d'électroménager au Sénégal. Les meilleures offres à Dakar, mises à jour toutes les 6h.`,
    intro: `Nopalou compare tout le petit et gros électroménager vendu au Sénégal : machines à laver (à partir d'environ 130 000 FCFA), micro-ondes (40 000 à 80 000 FCFA), ventilateurs, aspirateurs, air fryers, chauffe-eau et plaques de cuisson. Chaque produit est comparé chez tous les marchands en ligne du pays pour trouver le prix le plus bas à Dakar.`,
    keywords: ['machine à laver prix Dakar', 'micro-ondes prix Sénégal', 'ventilateur prix Dakar', 'air fryer Sénégal', 'électroménager pas cher Dakar'],
  },
  'informatique/ordinateurs': {
    categorie: 'informatique', label: 'Ordinateurs portables', sousType: 'ordinateurs', emoji: '💻',
    h1: 'Ordinateur portable prix Dakar — laptops HP, Dell, Lenovo',
    titre: 'Ordinateur portable prix Dakar — Laptops au meilleur prix au Sénégal',
    description: `Laptops HP, Dell, Lenovo, MacBook : comparez les prix d'ordinateurs portables au Sénégal, neufs et occasion. Le meilleur prix laptop à Dakar.`,
    intro: `Combien coûte un ordinateur portable à Dakar ? Un laptop d'occasion (HP, Dell, Lenovo) pour la bureautique se trouve entre 100 000 et 200 000 FCFA, un modèle neuf milieu de gamme entre 250 000 et 450 000 FCFA, et les MacBook au-delà. Nopalou compare chaque offre chez tous les marchands en ligne du Sénégal — comparez la RAM, le stockage SSD et l'état avant d'acheter.`,
    keywords: ['ordinateur portable prix Dakar', 'laptop prix Sénégal', 'PC portable pas cher Dakar', 'HP prix Dakar', 'MacBook prix Sénégal', 'ordinateur occasion Dakar'],
  },
```

- [ ] **Step 2: Vérifier compilation + rendu de 3 pages**

Run: `cd frontend-next && npx tsc --noEmit` → exit 0. Puis (dev servers lancés) :

```bash
for p in smartphones/iphone tv-electro/televiseurs informatique/ordinateurs; do
  curl -s "http://localhost:3001/categorie/$p" | grep -oE '<h1[^>]*>[^<]*</h1>' | head -1
done
```

Expected: 3 H1 distincts, aucun mojibake, produits présents dans le HTML.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/app/categorie/sous-categories-data.ts
git commit -m "feat(seo): 8 landing pages sous-categories produits (iphone, samsung, xiaomi, tecno, tv, frigo, electromenager, ordinateurs)"
```

---

### Task 4: Titles dupliqués « | Nopalou | Nopalou »

**Contexte :** le template `%s | Nopalou` (`layout.tsx:58`) s'ajoute à tout `title` de page. ~40 pages incluent déjà « — Nopalou » ou « | Nopalou » dans leur title → doublon en prod (vérifié : `<title>… | Nopalou | Nopalou</title>`). Règle : retirer le suffixe des `title:` de pages ; **ne pas toucher** aux `openGraph.title` ni au `title.default` de `layout.tsx`.

**Files (Modify) — liste exhaustive issue d'un grep du 11 juillet :**

| Fichier | Ligne | Avant → Après |
|---|---|---|
| `app/page.tsx` | 14 | `'Nopalou — Comparateur de prix au Sénégal · Dakar'` → `'Comparateur de prix au Sénégal · Dakar'` |
| `app/categorie/[slug]/page.tsx` | 139 | `` `${cat.label} au Sénégal — Comparer les prix | Nopalou` `` → `` `${cat.label} au Sénégal — Comparer les prix` `` |
| `app/immo/page.tsx` | 12 | `'Immobilier au Sénégal — Nopalou'` → `'Immobilier au Sénégal — Location et vente à Dakar'` |
| `app/telecom/page.tsx` | 8 | `'Forfaits Télécom — Nopalou'` → `'Forfaits télécom au Sénégal — Orange, Yas, Expresso, Promobile'` |
| `app/telecom/[id]/page.tsx` | 68 | `` `${f.nom} — ${f.operateur} | Nopalou Télécom` `` → `` `${f.nom} — Forfait ${f.operateur}` `` |
| `app/telecom/[id]/page.tsx` | 72 | `'Forfait introuvable | Nopalou'` → `'Forfait introuvable'` |
| `app/telecom/comparaison/page.tsx` | 7 | `'Comparaison forfaits télécom — Nopalou'` → `'Comparaison forfaits télécom'` |
| `app/boutiques/page.tsx` | 7 | `'Boutiques partenaires — Nopalou'` → `'Boutiques partenaires au Sénégal'` |
| `app/boutiques/[id]/page.tsx` | 43 | `'Boutique — Nopalou'` → `'Boutique'` |
| `app/boutiques/[id]/produits/[produitId]/page.tsx` | 50 | `` `${produit.nom} — ${produit.boutique_nom} | Nopalou` `` → `` `${produit.nom} — ${produit.boutique_nom}` `` |
| `app/boutiques/[id]/produits/[produitId]/page.tsx` | 55 | `'Produit — Nopalou'` → `'Produit'` |
| `app/comparaison/page.tsx` | 8 | `'Comparaison produits — Nopalou'` → `'Comparaison produits'` |
| `app/comparer/[a]/[b]/page.tsx` | 18 | `` `…vs ${…} | Nopalou` `` → retirer `` | Nopalou`` |
| `app/immo/comparaison/page.tsx` | 7 | idem (retirer ` — Nopalou`) |
| `app/assistant-whatsapp/page.tsx` | 4 | `'Assistant WhatsApp — Nopalou'` → `'Assistant WhatsApp'` |
| `app/connexion/page.tsx` | 6, `app/inscription/page.tsx` | 6, `app/mot-de-passe-oublie/page.tsx` | 6 | retirer ` — Nopalou` |
| `app/mentions-legales/page.tsx` | 4, `app/confidentialite/page.tsx` | 4, `app/not-found.tsx` | 4 | retirer ` — Nopalou` |
| `app/retour-paiement/page.tsx` | 6, `app/paiement/succes/page.tsx` | 5, `app/paiement/erreur/page.tsx` | 5, `app/payer-annonce/[id]/page.tsx` | 9 | retirer ` — Nopalou` |
| `app/(account)/…` : `mes-annonces:6`, `mes-annonces-immo:9`, `mes-alertes:7` (`| Nopalou`), `favoris:5`, `deposer-annonce:8`, `deposer-immo:7`, `compte:4`, `compte/profil:6`, `compte/apporteur:5` | | retirer le suffixe |
| `app/boutique/page.tsx` | 6, `app/boutique/analytics/page.tsx` | 5, `app/boutique/abonnement/page.tsx` | 6 | retirer ` — Nopalou` |
| `app/admin/(protected)/layout.tsx` | 7, `app/admin/(auth)/login/page.tsx` | 5 | retirer ` — Nopalou` |

- [ ] **Step 1: Appliquer les remplacements du tableau** (uniquement les champs `title:` principaux — jamais `openGraph.title`)

- [ ] **Step 2: Vérifier qu'il ne reste aucun suffixe dans un title principal**

Run (Git Bash) :
```bash
cd frontend-next && grep -rnE "title: [\`'\"][^\`'\"]*(\| Nopalou|— Nopalou)" src/app --include='*.tsx' | grep -v openGraph
```
Expected: seules les occurrences DANS un bloc `openGraph:` subsistent (vérifier chaque ligne restante manuellement — le grep ne voit pas le contexte multi-lignes ; ouvrir chaque fichier restant pour confirmer que c'est bien un og.title).

- [ ] **Step 3: `npx tsc --noEmit`** → exit 0, puis vérifier en dev :

```bash
curl -s "http://localhost:3001/categorie/tv-electro" | grep -oE '<title>[^<]*</title>'
```
Expected: `<title>Télévisions &amp; Électroménager au Sénégal — Comparer les prix | Nopalou</title>` — un seul « Nopalou ».

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src
git commit -m "fix(seo): supprime le suffixe Nopalou duplique dans les titles (le template layout l'ajoute deja)"
```

---

### Task 5: Canonicals + descriptions manquantes

**Files:**
- Modify: `frontend-next/src/app/telecom/page.tsx` (metadata)
- Modify: `frontend-next/src/app/guide-prix/page.tsx`, `guide-achat/page.tsx`, `guide-immo/page.tsx`, `guide-forfait/page.tsx` (ajout canonical)
- Modify: `frontend-next/src/app/guide-emploi/page.tsx`, `assistant-whatsapp/page.tsx`, `boutiques/page.tsx` (description + canonical)

- [ ] **Step 1: Ajouter `alternates.canonical` partout**

Pattern à appliquer dans chaque `export const metadata` listé (adapter le chemin) :

```ts
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  // …champs existants…
  alternates: { canonical: `${BASE}/guide-prix` },
}
```

Chemins canoniques : `/telecom`, `/guide-prix`, `/guide-achat`, `/guide-immo`, `/guide-forfait`, `/guide-emploi`, `/assistant-whatsapp`, `/boutiques`.

- [ ] **Step 2: Compléter les metadata pauvres**

`guide-emploi/page.tsx` (avait seulement un title) :
```ts
export const metadata: Metadata = {
  title: 'Comment utiliser Nopalou — Guide complet',
  description: `Guide pas à pas pour utiliser Nopalou : comparer les prix au Sénégal, créer une alerte prix, publier une annonce, ouvrir une boutique et devenir apporteur d'affaires.`,
  alternates: { canonical: `${BASE}/guide-emploi` },
}
```

`assistant-whatsapp/page.tsx` :
```ts
export const metadata: Metadata = {
  title: 'Assistant WhatsApp — Comparez les prix par message',
  description: `L'assistant WhatsApp de Nopalou : recherchez un produit, recevez les meilleurs prix au Sénégal, créez des alertes et consultez l'immobilier, directement sur WhatsApp.`,
  alternates: { canonical: `${BASE}/assistant-whatsapp` },
}
```

`boutiques/page.tsx` :
```ts
export const metadata: Metadata = {
  title: 'Boutiques partenaires au Sénégal',
  description: `Découvrez les boutiques des vendeurs professionnels et particuliers sur Nopalou : produits, prix et contact direct, partout au Sénégal.`,
  alternates: { canonical: `${BASE}/boutiques` },
}
```

(Si la Task 4 a déjà modifié les titles de ces fichiers, conserver ses titles — cette tâche n'ajoute que `description`/`alternates`.)

- [ ] **Step 3: Vérifier**

`npx tsc --noEmit` → exit 0, puis :
```bash
for p in telecom guide-prix guide-emploi assistant-whatsapp boutiques; do
  curl -s "http://localhost:3001/$p" | grep -oE '<link rel="canonical"[^>]*>' | head -1
done
```
Expected: 5 balises canonical avec les bonnes URLs nopalou.com.

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/app
git commit -m "feat(seo): canonical + meta description sur telecom, guides, boutiques, assistant-whatsapp"
```

---

### Task 6: JSON-LD produit construit sur les offres filtrées

**Files:**
- Modify: `frontend-next/src/app/produit/[id]/page.tsx:346`

- [ ] **Step 1: Passer les offres validées au JSON-LD**

Le page component calcule déjà `valides` (offres sans suspects ni outliers, lignes 264-271) mais la ligne 346 passe `offres` (liste brute) :

```tsx
// AVANT
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildJsonLd(produit, offres) }} />
// APRÈS
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildJsonLd(produit, valides) }} />
```

- [ ] **Step 2: Vérifier**

`npx tsc --noEmit` → exit 0. Puis prendre un id produit réel (`curl -s "http://localhost:3000/api/produits?limit=1" | grep -o '"id":"[^"]*"' | head -1`) et :
```bash
curl -s "http://localhost:3001/produit/<id>" | grep -o '"@type":"Product"' | head -1
```
Expected: le JSON-LD Product est toujours présent.

- [ ] **Step 3: Commit**

```bash
git add "frontend-next/src/app/produit/[id]/page.tsx"
git commit -m "fix(seo): JSON-LD produit construit sur les offres filtrees (coherence avec les prix affiches)"
```

---

### Task 7: Landing pages immo (7 pages)

**Files:**
- Create: `frontend-next/src/app/immo/ImmoCard.tsx` (extraction depuis `immo/page.tsx`)
- Create: `frontend-next/src/app/immo/landing-data.ts`
- Create: `frontend-next/src/app/immo/ImmoLanding.tsx`
- Create: 7 dossiers `frontend-next/src/app/immo/<slug>/page.tsx` (slugs listés ci-dessous)
- Modify: `frontend-next/src/app/immo/page.tsx` (importer ImmoCard au lieu de le définir)

**Interfaces:**
- Consumes: API existante `GET /api/immo?transaction=&type_bien=&ville=&limit=&page=` (aucun changement backend).
- Produces: `IMMO_LANDINGS: Record<string, ImmoLandingConfig>` (consommé par les tâches 10 et 12) ; `ImmoCard` réutilisable ; `ImmoLanding({ slug, searchParams })` composant serveur ; `immoLandingMetadata(slug): Metadata`.
- **Précédence de routes** : les dossiers statiques (`location-appartement-dakar/`) priment sur `[id]/` — pas de collision avec les fiches immo UUID.

- [ ] **Step 1: Extraire `ImmoCard`**

Créer `frontend-next/src/app/immo/ImmoCard.tsx` : y déplacer TEL QUEL depuis `immo/page.tsx` : l'interface `AnnonceImmo` (exportée), les constantes `TYPE_ICONS` et `SOURCE_LABELS`, la fonction `ImmoCard` (en `export default`), et ses imports (`Link`, `fcfa`, `cloudinaryHQ`, `CardActions`). Dans `immo/page.tsx`, supprimer ces blocs et importer :

```tsx
import ImmoCard, { type AnnonceImmo } from './ImmoCard'
```

(`immo/page.tsx` référence aussi `TYPE_ICONS` dans sa barre de filtres, ligne 312 : exporter `TYPE_ICONS` depuis `ImmoCard.tsx` et l'importer aussi.)

- [ ] **Step 2: Créer `landing-data.ts`**

```ts
// frontend-next/src/app/immo/landing-data.ts
export interface ImmoLandingConfig {
  transaction: 'location' | 'vente'
  typeBien: string
  ville: string
  label: string
  h1: string
  titre: string          // SANS suffixe Nopalou
  description: string
  intro: string
  keywords: string[]
}

export const IMMO_LANDINGS: Record<string, ImmoLandingConfig> = {
  'location-appartement-dakar': {
    transaction: 'location', typeBien: 'appartement', ville: 'Dakar', label: 'Location appartement Dakar',
    h1: 'Location appartement à Dakar — toutes les annonces',
    titre: 'Location appartement Dakar — Annonces et prix',
    description: `Plus de 700 appartements à louer à Dakar : Plateau, Almadies, Sacré-Cœur, Ouakam. Comparez les loyers et trouvez votre appartement au meilleur prix.`,
    intro: `Trouvez un appartement à louer à Dakar parmi des centaines d'annonces mises à jour en continu. Les loyers varient selon le quartier : comptez 150 000 à 300 000 FCFA/mois pour un 2 pièces dans les quartiers populaires, 300 000 à 600 000 FCFA aux Almadies, Ngor ou Plateau. Filtrez par quartier, surface et budget pour cibler votre recherche.`,
    keywords: ['location appartement Dakar', 'appartement à louer Dakar', 'louer appartement Dakar prix', 'appartement Almadies location'],
  },
  'location-chambre-dakar': {
    transaction: 'location', typeBien: 'chambre', ville: 'Dakar', label: 'Location chambre Dakar',
    h1: 'Chambre à louer à Dakar — annonces par mois',
    titre: 'Location chambre Dakar par mois — Annonces et prix',
    description: `Des centaines de chambres à louer à Dakar au mois : Parcelles Assainies, Médina, Grand Yoff. Comparez les prix dès 25 000 FCFA/mois.`,
    intro: `Vous cherchez une chambre à louer à Dakar ? Nopalou regroupe les annonces de chambres au mois dans tous les quartiers : Parcelles Assainies, Médina, Grand Yoff, Pikine. Les prix vont d'environ 25 000 à 50 000 FCFA/mois pour une chambre simple, et 50 000 à 100 000 FCFA avec salle de bain privée.`,
    keywords: ['location chambre Dakar par mois', 'chambre à louer Dakar', 'chambre à louer 30000 par mois', 'chambre salle de bain à louer Dakar'],
  },
  'location-studio-dakar': {
    transaction: 'location', typeBien: 'studio', ville: 'Dakar', label: 'Location studio Dakar',
    h1: 'Studio à louer à Dakar — toutes les annonces',
    titre: 'Location studio Dakar — Annonces et prix par mois',
    description: `Studios à louer à Dakar : comparez plus de 100 annonces par quartier et budget. Studios meublés et non meublés dès 75 000 FCFA/mois.`,
    intro: `Le studio est le logement le plus demandé par les jeunes actifs et étudiants à Dakar. Comptez 75 000 à 150 000 FCFA/mois pour un studio simple selon le quartier, et 150 000 à 250 000 FCFA pour un studio meublé dans les zones prisées (Sacré-Cœur, Point E, Ouakam). Comparez les annonces avant de vous déplacer.`,
    keywords: ['location studio Dakar', 'studio à louer Dakar', 'studio meublé Dakar prix', 'studio pas cher Dakar'],
  },
  'location-maison-dakar': {
    transaction: 'location', typeBien: 'maison', ville: 'Dakar', label: 'Location maison Dakar',
    h1: 'Maison à louer à Dakar — toutes les annonces',
    titre: 'Location maison Dakar — Villas et maisons à louer',
    description: `Maisons et villas à louer à Dakar : comparez les annonces par quartier, surface et budget sur Nopalou.`,
    intro: `Louer une maison à Dakar pour votre famille : Nopalou regroupe les annonces de maisons et villas en location dans tous les quartiers de la capitale et sa banlieue. Les loyers démarrent autour de 200 000 FCFA/mois en périphérie et dépassent 800 000 FCFA/mois pour une villa aux Almadies ou à Fann.`,
    keywords: ['location maison Dakar', 'maison à louer Dakar', 'villa à louer Dakar prix'],
  },
  'vente-appartement-dakar': {
    transaction: 'vente', typeBien: 'appartement', ville: 'Dakar', label: 'Vente appartement Dakar',
    h1: 'Appartement à vendre à Dakar — toutes les annonces',
    titre: 'Appartement à vendre Dakar — Annonces et prix au m²',
    description: `Appartements à vendre à Dakar : comparez près de 100 annonces par quartier et budget. F2, F3, F4 du Plateau aux Almadies.`,
    intro: `Acheter un appartement à Dakar : les prix varient de 25 à 60 millions FCFA pour un F3 selon le quartier et l'état, et dépassent 100 millions dans les résidences neuves des Almadies ou du Plateau. Nopalou regroupe les annonces de vente pour comparer les prix au m² avant de négocier.`,
    keywords: ['appartement à vendre Dakar', 'vente appartement Dakar', 'prix appartement Dakar', 'acheter appartement Dakar'],
  },
  'vente-maison-dakar': {
    transaction: 'vente', typeBien: 'maison', ville: 'Dakar', label: 'Vente maison Dakar',
    h1: 'Maison à vendre à Dakar — toutes les annonces',
    titre: 'Maison à vendre Dakar — Villas et maisons, prix et annonces',
    description: `Maisons et villas à vendre à Dakar : comparez les annonces par quartier et budget sur Nopalou.`,
    intro: `Acheter une maison à Dakar est un investissement majeur : les prix s'étalent de 30 millions FCFA en banlieue (Keur Massar, Rufisque) à plusieurs centaines de millions pour une villa aux Almadies. Comparez les annonces disponibles, leur surface et leur titre de propriété avant tout engagement.`,
    keywords: ['maison à vendre Dakar', 'villa à vendre Dakar', 'vente maison Dakar prix'],
  },
  'vente-terrain-dakar': {
    transaction: 'vente', typeBien: 'terrain', ville: 'Dakar', label: 'Vente terrain Dakar',
    h1: 'Terrain à vendre à Dakar — toutes les annonces',
    titre: 'Terrain à vendre Dakar — Annonces et prix au m²',
    description: `Plus de 100 terrains à vendre à Dakar et sa région : comparez les prix au m², les surfaces et les localisations sur Nopalou.`,
    intro: `Le terrain reste le placement préféré des Sénégalais. À Dakar et dans sa région (Diamniadio, Lac Rose, Bambilor, Kounoune), les prix au m² varient de 15 000 FCFA en zone non viabilisée à plus de 300 000 FCFA dans les zones loties proches du centre. Vérifiez toujours le statut foncier (bail, titre foncier, délibération) avant d'acheter.`,
    keywords: ['terrain à vendre Dakar', 'vente terrain Dakar', 'prix terrain Dakar m2', 'terrain Diamniadio prix'],
  },
}
```

- [ ] **Step 3: Créer `ImmoLanding.tsx`**

```tsx
// frontend-next/src/app/immo/ImmoLanding.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import JsonLd from '@/components/JsonLd'
import { breadcrumbSchema } from '@/lib/schema-org'
import ImmoCard, { type AnnonceImmo } from './ImmoCard'
import { IMMO_LANDINGS } from './landing-data'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export function immoLandingMetadata(slug: string): Metadata {
  const cfg = IMMO_LANDINGS[slug]
  const canonical = `${BASE}/immo/${slug}`
  return {
    title: cfg.titre,
    description: cfg.description,
    keywords: cfg.keywords,
    alternates: { canonical },
    openGraph: { title: `${cfg.h1} — Nopalou`, description: cfg.description, type: 'website', url: canonical },
  }
}

interface ImmoResponse { annonces: AnnonceImmo[]; total: number; pages: number }

export default async function ImmoLanding({
  slug, searchParams,
}: { slug: string; searchParams: { page?: string } }) {
  const cfg = IMMO_LANDINGS[slug]
  const page = searchParams.page ?? '1'

  const qs = new URLSearchParams({
    limit: '24', page,
    transaction: cfg.transaction, type_bien: cfg.typeBien, ville: cfg.ville, tri: 'recent',
  })

  let data: ImmoResponse = { annonces: [], total: 0, pages: 1 }
  try {
    data = await apiFetch<ImmoResponse>(`/immo?${qs.toString()}`)
  } catch { /* état vide */ }

  const currentPage = Number(page)
  const self = `/immo/${slug}`

  const itemListJsonLd = data.annonces.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: cfg.h1,
    numberOfItems: data.total,
    itemListElement: data.annonces.slice(0, 10).map((a, i) => ({
      '@type': 'ListItem', position: i + 1, url: `${BASE}/immo/${a.id}`, name: a.titre,
    })),
  } : null

  return (
    <>
      <JsonLd schema={breadcrumbSchema([
        { name: 'Accueil', url: '/' },
        { name: 'Immobilier', url: '/immo' },
        { name: cfg.label, url: self },
      ])} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}

      <div className="page-container" style={{ paddingTop: '1.5rem' }}>
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          <Link href="/" style={{ color: 'var(--text2)' }}>Accueil</Link>
          {' › '}
          <Link href="/immo" style={{ color: 'var(--text2)' }}>Immobilier</Link>
          {' › '}
          <span style={{ color: 'var(--text1)' }}>{cfg.label}</span>
        </nav>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2, marginBottom: 10 }}>
            {cfg.h1}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 720 }}>{cfg.intro}</p>
          {data.total > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
              <strong style={{ color: 'var(--accent)' }}>{data.total.toLocaleString('fr-FR')} annonce{data.total > 1 ? 's' : ''}</strong> disponibles · mises à jour en continu
            </p>
          )}
        </div>

        {data.annonces.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 48 }}>🏘</span>
            <p>Aucune annonce disponible pour l&apos;instant.</p>
            <Link href="/immo" className="budget-pill active" style={{ marginTop: 8 }}>Voir tout l&apos;immobilier</Link>
          </div>
        ) : (
          <div className="immo-grid">
            {data.annonces.map(a => <ImmoCard key={a.id} a={a} />)}
          </div>
        )}

        {data.pages > 1 && (
          <div className="pagination">
            {currentPage > 1 && <Link href={`${self}?page=${currentPage - 1}`} className="page-btn">← Précédent</Link>}
            <span className="page-info">Page {currentPage} / {data.pages}</span>
            {currentPage < data.pages && <Link href={`${self}?page=${currentPage + 1}`} className="page-btn">Suivant →</Link>}
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href={`/immo?transaction=${cfg.transaction}&type_bien=${cfg.typeBien}&ville=${cfg.ville}`} className="budget-pill">
            Affiner avec tous les filtres →
          </Link>
          {Object.entries(IMMO_LANDINGS).filter(([s]) => s !== slug).slice(0, 4).map(([s, c]) => (
            <Link key={s} href={`/immo/${s}`} className="budget-pill">{c.label}</Link>
          ))}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Créer les 7 pages**

Pour CHACUN des 7 slugs — `location-appartement-dakar`, `location-chambre-dakar`, `location-studio-dakar`, `location-maison-dakar`, `vente-appartement-dakar`, `vente-maison-dakar`, `vente-terrain-dakar` — créer `frontend-next/src/app/immo/<slug>/page.tsx` avec ce contenu exact (remplacer `SLUG` par le slug, 2 occurrences) :

```tsx
import ImmoLanding, { immoLandingMetadata } from '../ImmoLanding'

export const dynamic = 'force-dynamic'
export const metadata = immoLandingMetadata('SLUG')

export default function Page({ searchParams }: { searchParams: { page?: string } }) {
  return <ImmoLanding slug="SLUG" searchParams={searchParams} />
}
```

Exemple complet pour le premier (`app/immo/location-appartement-dakar/page.tsx`) :

```tsx
import ImmoLanding, { immoLandingMetadata } from '../ImmoLanding'

export const dynamic = 'force-dynamic'
export const metadata = immoLandingMetadata('location-appartement-dakar')

export default function Page({ searchParams }: { searchParams: { page?: string } }) {
  return <ImmoLanding slug="location-appartement-dakar" searchParams={searchParams} />
}
```

- [ ] **Step 5: Vérifier**

`npx tsc --noEmit` → exit 0. Puis :
```bash
curl -s "http://localhost:3001/immo/location-appartement-dakar" | grep -oE '<title>[^<]*</title>|<h1[^>]*>[^<]*</h1>'
curl -s "http://localhost:3001/immo/vente-terrain-dakar" | grep -oE '<h1[^>]*>[^<]*</h1>'
curl -s "http://localhost:3001/immo" | grep -oE '<h1[^>]*>[^<]*</h1>' | head -1
```
Expected: les 2 landing pages rendent leur H1 avec annonces ; `/immo` (page filtres) fonctionne toujours (extraction ImmoCard non cassée). Vérifier aussi qu'une fiche `/immo/<uuid>` réelle répond encore (précédence des routes).

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/immo
git commit -m "feat(seo): 7 landing pages immo (location/vente x appartement/chambre/studio/maison/terrain a Dakar)"
```

---

### Task 8: Landing pages télécom (4 pages opérateur)

**Files:**
- Create: `frontend-next/src/app/telecom/landing-data.ts`
- Create: `frontend-next/src/app/telecom/OperateurLanding.tsx`
- Create: `frontend-next/src/app/telecom/orange/page.tsx`, `telecom/yas/page.tsx`, `telecom/promobile/page.tsx`, `telecom/expresso/page.tsx`

**Interfaces:**
- Consumes: API existante `GET /api/telecom?operateur=<nom>&limit=` — renvoie `{ success, forfaits: [{ id, operateur, nom, type, data_mo, minutes, sms, validite_jours, prix }] }`. Les fiches forfait existantes sont sur `/telecom/[id]` (les dossiers statiques priment).
- Produces: `TELECOM_LANDINGS` (consommé par les tâches 10 et 12).

- [ ] **Step 1: Créer `landing-data.ts`**

```ts
// frontend-next/src/app/telecom/landing-data.ts
export interface TelecomLandingConfig {
  operateur: string      // valeur du paramètre API
  label: string
  h1: string
  titre: string          // SANS suffixe Nopalou
  description: string
  intro: string
  keywords: string[]
}

export const TELECOM_LANDINGS: Record<string, TelecomLandingConfig> = {
  orange: {
    operateur: 'orange', label: 'Forfaits Orange',
    h1: 'Forfaits Orange Sénégal — internet, appels et illimix',
    titre: 'Forfait Orange Sénégal — Comparez internet, appels, illimix',
    description: `Tous les forfaits Orange Sénégal comparés : internet mobile, illimix, appels. Trouvez le forfait Orange au meilleur rapport data/prix, données ARTP.`,
    intro: `Orange (Sonatel) est le premier opérateur du Sénégal. Nopalou compare tous ses forfaits publiés au catalogue ARTP : internet mobile, illimix (appels + data), pass journaliers et mensuels. Comparez le prix par Go réel avant de recharger.`,
    keywords: ['forfait Orange Sénégal', 'forfait internet Orange Sénégal', 'forfait illimix Orange', 'pass internet Orange prix'],
  },
  yas: {
    operateur: 'yas', label: 'Forfaits Yas',
    h1: 'Forfaits Yas Sénégal (ex-Free) — internet et appels',
    titre: 'Forfait Yas Sénégal — Comparez les forfaits internet et appels',
    description: `Tous les forfaits Yas (ex-Free Sénégal) comparés : internet mobile, appels, pass data. Trouvez le forfait Yas au meilleur prix, données ARTP.`,
    intro: `Yas (anciennement Free, puis Tigo) est le deuxième opérateur du Sénégal. Nopalou compare tous ses forfaits internet et appels publiés au catalogue ARTP pour trouver le meilleur prix par Go et par minute.`,
    keywords: ['forfait Yas Sénégal', 'forfait Free Sénégal', 'pass internet Yas', 'forfait internet Yas prix'],
  },
  promobile: {
    operateur: 'promobile', label: 'Forfaits Promobile',
    h1: 'Forfaits Promobile Sénégal — internet et appels pas chers',
    titre: 'Forfait Promobile Sénégal — Comparez internet et appels',
    description: `Tous les forfaits Promobile comparés : internet mobile et appels à petits prix. Données du catalogue ARTP, mises à jour régulièrement.`,
    intro: `Promobile est l'opérateur alternatif du Sénégal, connu pour ses forfaits agressifs sur les prix. Nopalou compare ses forfaits internet et appels face à Orange, Yas et Expresso pour vérifier s'il est vraiment le moins cher pour votre usage.`,
    keywords: ['Promobile forfait internet', 'Promobile forfait appel', 'forfait Promobile prix', 'Promobile Sénégal'],
  },
  expresso: {
    operateur: 'expresso', label: 'Forfaits Expresso',
    h1: 'Forfaits Expresso Sénégal — internet et appels',
    titre: 'Forfait Expresso Sénégal — Comparez internet et appels',
    description: `Tous les forfaits Expresso Sénégal comparés : internet mobile et appels. Données du catalogue ARTP.`,
    intro: `Expresso est le troisième opérateur historique du Sénégal. Nopalou compare ses forfaits internet et appels publiés au catalogue ARTP face à Orange, Yas et Promobile, pour choisir le meilleur forfait selon votre budget.`,
    keywords: ['forfait Expresso Sénégal', 'Expresso internet forfait', 'pass Expresso prix'],
  },
}
```

- [ ] **Step 2: Créer `OperateurLanding.tsx`**

```tsx
// frontend-next/src/app/telecom/OperateurLanding.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'
import JsonLd from '@/components/JsonLd'
import { breadcrumbSchema } from '@/lib/schema-org'
import { TELECOM_LANDINGS } from './landing-data'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export function telecomLandingMetadata(slug: string): Metadata {
  const cfg = TELECOM_LANDINGS[slug]
  const canonical = `${BASE}/telecom/${slug}`
  return {
    title: cfg.titre,
    description: cfg.description,
    keywords: cfg.keywords,
    alternates: { canonical },
    openGraph: { title: `${cfg.h1} — Nopalou`, description: cfg.description, type: 'website', url: canonical },
  }
}

interface Forfait {
  id: string
  operateur: string
  nom: string
  type: string | null
  data_mo: number | null
  minutes: number | null
  sms: number | null
  validite_jours: number | null
  prix: number
}

function dataLabel(mo: number | null) {
  if (!mo) return '—'
  return mo >= 1000 ? `${(mo / 1000).toLocaleString('fr-FR')} Go` : `${mo} Mo`
}

export default async function OperateurLanding({ slug }: { slug: string }) {
  const cfg = TELECOM_LANDINGS[slug]

  let forfaits: Forfait[] = []
  try {
    const data = await apiFetch<{ forfaits?: Forfait[] }>(`/telecom?operateur=${cfg.operateur}&limit=60`)
    forfaits = (data.forfaits ?? []).sort((a, b) => Number(a.prix) - Number(b.prix))
  } catch { /* état vide */ }

  return (
    <>
      <JsonLd schema={breadcrumbSchema([
        { name: 'Accueil', url: '/' },
        { name: 'Télécom', url: '/telecom' },
        { name: cfg.label, url: `/telecom/${slug}` },
      ])} />

      <div className="page-container" style={{ paddingTop: '1.5rem' }}>
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          <Link href="/" style={{ color: 'var(--text2)' }}>Accueil</Link>
          {' › '}
          <Link href="/telecom" style={{ color: 'var(--text2)' }}>Télécom</Link>
          {' › '}
          <span style={{ color: 'var(--text1)' }}>{cfg.label}</span>
        </nav>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2, marginBottom: 10 }}>
            📡 {cfg.h1}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 720 }}>{cfg.intro}</p>
          {forfaits.length > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
              <strong style={{ color: 'var(--accent)' }}>{forfaits.length} forfaits</strong> comparés · source catalogue ARTP
            </p>
          )}
        </div>

        {forfaits.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 48 }}>📡</span>
            <p>Aucun forfait disponible pour l&apos;instant.</p>
            <Link href="/telecom" className="budget-pill active" style={{ marginTop: 8 }}>Voir tous les forfaits</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-forfaits" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '10px 8px' }}>Forfait</th>
                  <th style={{ padding: '10px 8px' }}>Data</th>
                  <th style={{ padding: '10px 8px' }}>Minutes</th>
                  <th style={{ padding: '10px 8px' }}>Validité</th>
                  <th style={{ padding: '10px 8px' }}>Prix</th>
                </tr>
              </thead>
              <tbody>
                {forfaits.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 8px' }}>
                      <Link href={`/telecom/${f.id}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>{f.nom}</Link>
                    </td>
                    <td style={{ padding: '10px 8px' }}>{dataLabel(f.data_mo)}</td>
                    <td style={{ padding: '10px 8px' }}>{f.minutes ?? '—'}</td>
                    <td style={{ padding: '10px 8px' }}>{f.validite_jours ? `${f.validite_jours} j` : '—'}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 700 }}>{fcfa(Number(f.prix))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/telecom" className="budget-pill">Comparer tous les opérateurs →</Link>
          {Object.entries(TELECOM_LANDINGS).filter(([s]) => s !== slug).map(([s, c]) => (
            <Link key={s} href={`/telecom/${s}`} className="budget-pill">{c.label}</Link>
          ))}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Créer les 4 pages**

Pour chaque slug `orange`, `yas`, `promobile`, `expresso`, créer `frontend-next/src/app/telecom/<slug>/page.tsx` (remplacer `SLUG`, 2 occurrences) :

```tsx
import OperateurLanding, { telecomLandingMetadata } from '../OperateurLanding'

export const dynamic = 'force-dynamic'
export const metadata = telecomLandingMetadata('SLUG')

export default function Page() {
  return <OperateurLanding slug="SLUG" />
}
```

- [ ] **Step 4: Vérifier**

`npx tsc --noEmit` → exit 0. Puis :
```bash
for op in orange yas promobile expresso; do
  curl -s "http://localhost:3001/telecom/$op" | grep -oE '<h1[^>]*>[^<]*</h1>' | head -1
done
```
Expected: 4 H1 distincts avec forfaits en tableau. Vérifier qu'une fiche `/telecom/<uuid>` réelle répond toujours.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/telecom
git commit -m "feat(seo): 4 landing pages operateurs telecom (orange, yas, promobile, expresso)"
```

---

### Task 9: Contenu éditorial unique par catégorie + liens croisés

**Files:**
- Modify: `frontend-next/src/app/categorie/categories-data.ts` (nouveau champ `contenu: string[]`)
- Modify: `frontend-next/src/app/categorie/[slug]/page.tsx` (rendu du contenu + liens sous-catégories/budget)

**Interfaces:**
- Consumes: `SOUS_CATEGORIES` (Task 3).
- Produces: champ `contenu: string[]` sur chaque entrée de `CATEGORIES` (2 paragraphes uniques).

- [ ] **Step 1: Ajouter `contenu: string[]` au type et aux 8 entrées de `categories-data.ts`**

Ajouter `contenu: string[]` dans le type, puis pour chaque catégorie (textes complets — écrits pour être uniques par catégorie, à insérer tels quels) :

```ts
  // smartphones
  contenu: [
    `Le marché du téléphone au Sénégal est dominé par cinq marques : Samsung et sa gamme Galaxy A, Tecno et Infinix très populaires pour leur rapport qualité/prix, Xiaomi/Redmi en forte progression, et l'iPhone qui reste la référence du haut de gamme, souvent acheté d'occasion. Les prix s'étalent de 40 000 FCFA pour un smartphone d'entrée de gamme neuf à plus de 800 000 FCFA pour un iPhone récent scellé.`,
    `Avant d'acheter un téléphone à Dakar, comparez toujours l'état (neuf, occasion, reconditionné — affiché sur chaque offre Nopalou), la RAM et le stockage réels, et le prix chez plusieurs marchands : pour un même modèle, l'écart entre vendeurs dépasse souvent 30 000 FCFA. Les alertes prix Nopalou vous préviennent dès qu'une offre passe sous votre budget.`,
  ],
  // informatique
  contenu: [
    `Ordinateurs portables HP, Dell et Lenovo dominent le marché sénégalais, en neuf comme en occasion — le marché de l'occasion (souvent importé d'Europe) offre d'excellentes affaires entre 100 000 et 200 000 FCFA pour de la bureautique. Pour du graphisme ou du développement, visez 8 à 16 Go de RAM et un SSD, entre 250 000 et 500 000 FCFA.`,
    `Nopalou compare aussi les imprimantes, écrans, routeurs et accessoires. Vérifiez le clavier (AZERTY/QWERTY) et la génération du processeur sur les offres d'occasion — deux modèles au même prix peuvent avoir 5 ans d'écart.`,
  ],
  // tv-electro
  contenu: [
    `TV, climatiseurs, réfrigérateurs et machines à laver : l'électroménager représente l'essentiel du budget équipement d'un foyer sénégalais. Les marques locales et régionales (Astech, Enduro, Finix, Bruhm) cassent les prix face à Samsung, LG et Hisense — souvent 30 à 50% moins cher à taille égale, avec des garanties locales de 12 mois.`,
    `Pour un climatiseur, comparez la puissance en CV/BTU et privilégiez l'inverter si vous l'utilisez chaque jour : il consomme jusqu'à 40% de moins. Pour une TV, le prix au pouce est le meilleur repère ; pour un frigo, la capacité en litres. Ces caractéristiques sont extraites automatiquement sur les offres Nopalou pour comparer à specs égales.`,
  ],
  // mode
  contenu: [
    `Vêtements, chaussures, sacs et parfums : la mode en ligne au Sénégal se partage entre les grandes plateformes et les vendeurs Instagram/WhatsApp. Nopalou regroupe les offres des marchands en ligne établis pour comparer les prix réels, notamment sur les sneakers et les parfums où les écarts sont les plus forts.`,
    `Attention aux contrefaçons sur les articles de marque : un prix anormalement bas (moins de 30% du prix boutique) est un signal d'alerte. Privilégiez les vendeurs notés et les boutiques vérifiées.`,
  ],
  // maison
  contenu: [
    `Meubles, canapés, matelas et équipement de cuisine : le mobilier au Sénégal combine production locale (menuiseries de Dakar, souvent sur commande) et importation. Les prix en ligne sont surtout intéressants sur les matelas, la literie et le petit équipement.`,
    `Comparez les dimensions exactes et les matériaux avant d'acheter : deux canapés au même prix peuvent aller du simple au double en qualité de mousse et de structure.`,
  ],
  // auto-moto
  contenu: [
    `Pièces détachées, pneus, batteries et accessoires : l'entretien automobile à Dakar passe de plus en plus par l'achat en ligne des pièces, montées ensuite par votre mécanicien. Les scooters et motos (très demandés pour la livraison) apparaissent aussi dans les annonces.`,
    `Pour les pièces, vérifiez toujours la compatibilité exacte avec votre modèle et l'origine (neuve, occasion, adaptable) — le prix seul ne suffit pas à comparer.`,
  ],
  // jeux
  contenu: [
    `PlayStation domine le gaming au Sénégal : PS4 d'occasion (autour de 120 000 à 180 000 FCFA) et PS5 (350 000 FCFA et plus selon l'édition) constituent l'essentiel du marché, complétées par les manettes, les jeux et les cartes PSN.`,
    `Sur les consoles d'occasion, vérifiez l'état du lecteur de disque et la version (Slim, Pro, édition digitale). Nopalou compare les offres de tous les vendeurs en ligne pour repérer le prix juste avant de négocier.`,
  ],
  // beaute
  contenu: [
    `Parfums, cosmétiques et soins : la beauté en ligne au Sénégal est en pleine croissance, portée par les parfums de marque et leurs déclinaisons (eau de parfum, musc, huiles).`,
    `Comparez la contenance (ml) et la concentration avant d'acheter : un « même » parfum peut exister en trois formats à des prix très différents.`,
  ],
```

- [ ] **Step 2: Rendre le contenu + liens dans `categorie/[slug]/page.tsx`**

Dans le « Bloc texte SEO en bas » (après le paragraphe existant, avant la rangée de liens), ajouter :

```tsx
          {cat.contenu.map((para, i) => (
            <p key={i} style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginTop: 10 }}>{para}</p>
          ))}
```

Et remplacer la rangée de liens croisés existante (`<div style={{ display: 'flex', gap: 12, marginTop: 16, ... }}>…</div>`) par :

```tsx
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {Object.entries(SOUS_CATEGORIES)
              .filter(([, sc]) => sc.categorie === params.slug)
              .map(([key, sc]) => (
                <Link key={key} href={`/categorie/${key}`} className="budget-pill">
                  {sc.emoji} {sc.label}
                </Link>
              ))}
            <Link href={`/categorie/${params.slug}/moins-de-50000`} className="budget-pill">Moins de 50 000 FCFA</Link>
            <Link href={`/categorie/${params.slug}/moins-de-100000`} className="budget-pill">Moins de 100 000 FCFA</Link>
            <Link href="/" className="budget-pill active">Tous les produits</Link>
            {Object.entries(CATEGORIES)
              .filter(([s]) => s !== params.slug)
              .slice(0, 4)
              .map(([s, c]) => (
                <Link key={s} href={`/categorie/${s}`} className="budget-pill">
                  {c.emoji} {c.label}
                </Link>
              ))}
          </div>
```

avec l'import : `import { SOUS_CATEGORIES } from '../sous-categories-data'`

- [ ] **Step 3: Vérifier**

`npx tsc --noEmit` → exit 0. Puis :
```bash
curl -s "http://localhost:3001/categorie/tv-electro" | grep -c "Astech"
curl -s "http://localhost:3001/categorie/tv-electro" | grep -o 'href="/categorie/tv-electro/climatiseurs"' | head -1
```
Expected: contenu éditorial présent dans le HTML + lien vers la sous-catégorie climatiseurs.

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/app/categorie
git commit -m "feat(seo): contenu editorial unique par categorie + maillage vers sous-categories et pages budget"
```

---

### Task 10: Maillage footer + homepage

**Files:**
- Modify: `frontend-next/src/app/layout.tsx` (footer, ~ligne 240 avant `.footer-trust`)
- Modify: `frontend-next/src/app/page.tsx` (Bloc SEO, lignes 462-468)

- [ ] **Step 1: Bloc « Recherches populaires » dans le footer**

Dans `layout.tsx`, juste APRÈS la fermeture de `<div className="footer-inner">…</div>` (ligne ~239) et AVANT `<div className="footer-trust">`, insérer :

```tsx
          {/* Recherches populaires — maillage SEO */}
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Recherches populaires</p>
            <div style={{ display: 'flex', gap: '8px 18px', flexWrap: 'wrap', fontSize: 13 }}>
              <a href="/categorie/tv-electro/climatiseurs">Climatiseur prix Dakar</a>
              <a href="/categorie/smartphones/iphone">iPhone prix Dakar</a>
              <a href="/categorie/smartphones/samsung">Samsung prix Dakar</a>
              <a href="/categorie/tv-electro/televiseurs">TV prix Dakar</a>
              <a href="/categorie/tv-electro/refrigerateurs">Frigo prix Dakar</a>
              <a href="/categorie/informatique/ordinateurs">Ordinateur portable Dakar</a>
              <a href="/immo/location-appartement-dakar">Location appartement Dakar</a>
              <a href="/immo/location-chambre-dakar">Chambre à louer Dakar</a>
              <a href="/immo/vente-terrain-dakar">Terrain à vendre Dakar</a>
              <a href="/telecom/orange">Forfaits Orange</a>
              <a href="/telecom/yas">Forfaits Yas</a>
            </div>
          </div>
```

(Les liens du footer utilisent `<a href>` comme le reste du footer existant — pas de `<Link>` dans ce fichier.)

- [ ] **Step 2: Étendre la rangée de liens du Bloc SEO homepage**

Dans `page.tsx`, après la rangée existante `{CATEGORIES.filter(...).map(...)}` (lignes 462-468), ajouter une seconde rangée :

```tsx
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            {[
              { href: '/categorie/tv-electro/climatiseurs', label: 'Climatiseur prix Dakar' },
              { href: '/categorie/smartphones/iphone', label: 'iPhone prix Dakar' },
              { href: '/categorie/smartphones/samsung', label: 'Samsung Galaxy prix Dakar' },
              { href: '/categorie/tv-electro/televiseurs', label: 'TV prix Dakar' },
              { href: '/categorie/tv-electro/refrigerateurs', label: 'Frigo prix Dakar' },
              { href: '/categorie/informatique/ordinateurs', label: 'Ordinateur portable prix Dakar' },
              { href: '/immo/location-appartement-dakar', label: 'Location appartement Dakar' },
              { href: '/immo/location-chambre-dakar', label: 'Chambre à louer Dakar' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'underline' }}>
                {l.label}
              </Link>
            ))}
          </div>
```

- [ ] **Step 3: Vérifier**

`npx tsc --noEmit` → exit 0. Puis :
```bash
curl -s "http://localhost:3001/" | grep -c 'href="/categorie/tv-electro/climatiseurs"'
```
Expected: ≥ 2 (footer + bloc SEO).

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/app/layout.tsx frontend-next/src/app/page.tsx
git commit -m "feat(seo): maillage interne footer (recherches populaires) + bloc SEO homepage vers les landing pages"
```

---

### Task 11: Fil d'Ariane cliquable sur la fiche produit

**Files:**
- Modify: `frontend-next/src/app/produit/[id]/page.tsx`

- [ ] **Step 1: Ajouter le mapping et le fil d'Ariane**

En haut du fichier (près des constantes), ajouter :

```tsx
// Libellés categorie_nom réels en base → slugs des pages catégories
const CAT_SLUGS: Record<string, string> = {
  'Telephones': 'smartphones',
  'Informatique': 'informatique',
  'TV & Electro': 'tv-electro',
  'Mode': 'mode',
  'Maison': 'maison',
  'Auto & Moto': 'auto-moto',
  'Jeux': 'jeux',
}
```

Dans le JSX du composant page, tout en haut du conteneur principal (avant l'en-tête produit existant), insérer :

```tsx
      {(() => {
        const catNom = produit.categorie_nom ?? produit.categorie
        const catSlug = catNom ? CAT_SLUGS[catNom] : undefined
        return (
          <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
            <Link href="/" style={{ color: 'var(--text2)' }}>Accueil</Link>
            {catNom && (
              <>
                {' › '}
                {catSlug
                  ? <Link href={`/categorie/${catSlug}`} style={{ color: 'var(--text2)' }}>{catNom}</Link>
                  : <span>{catNom}</span>}
              </>
            )}
            {' › '}
            <span style={{ color: 'var(--text1)' }}>{produit.nom}</span>
          </nav>
        )
      })()}
```

(Si `Link` n'est pas déjà importé dans ce fichier, ajouter `import Link from 'next/link'`.)

- [ ] **Step 2: Vérifier**

`npx tsc --noEmit` → exit 0, puis sur un produit réel :
```bash
curl -s "http://localhost:3001/produit/<id>" | grep -o 'aria-label="Fil d'"'"'Ariane"' | head -1
```
Expected: le fil d'Ariane est rendu, avec lien vers la catégorie.

- [ ] **Step 3: Commit**

```bash
git add "frontend-next/src/app/produit/[id]/page.tsx"
git commit -m "feat(seo): fil d'Ariane cliquable fiche produit vers la page categorie"
```

---

### Task 12: Sitemap assaini et complété

**Files:**
- Modify: `frontend-next/src/app/sitemap.ts`

**Interfaces:**
- Consumes: `SOUS_CATEGORIES` (Task 3), `IMMO_LANDINGS` (Task 7), `TELECOM_LANDINGS` (Task 8).

- [ ] **Step 1: Remplacer le bloc statique**

Remplacer les lignes 5-26 de `sitemap.ts` (constantes `CATEGORY_SLUGS` et `STATIC_ROUTES`) par :

```ts
import { SOUS_CATEGORIES } from './categorie/sous-categories-data'
import { IMMO_LANDINGS } from './immo/landing-data'
import { TELECOM_LANDINGS } from './telecom/landing-data'

// beaute exclue : 0 produit en base — page vide contre-productive pour Google
const CATEGORY_SLUGS = [
  'smartphones', 'informatique', 'tv-electro', 'mode',
  'maison', 'auto-moto', 'jeux',
]

const BUDGETS_SITEMAP = [50000, 100000]

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${BASE}/`,              changeFrequency: 'daily',   priority: 1.0 },
  { url: `${BASE}/immo`,          changeFrequency: 'hourly',  priority: 0.9 },
  { url: `${BASE}/telecom`,       changeFrequency: 'weekly',  priority: 0.8 },
  { url: `${BASE}/annonces`,      changeFrequency: 'daily',   priority: 0.8 },
  ...CATEGORY_SLUGS.map(slug => ({
    url: `${BASE}/categorie/${slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  })),
  // Landing pages sous-catégories produits
  ...Object.keys(SOUS_CATEGORIES).map(key => ({
    url: `${BASE}/categorie/${key}`,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  })),
  // Pages budget (route [sousCategorie], segment moins-de-<n>)
  ...CATEGORY_SLUGS.flatMap(slug =>
    BUDGETS_SITEMAP.map(b => ({
      url: `${BASE}/categorie/${slug}/moins-de-${b}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ),
  // Landing pages immo
  ...Object.keys(IMMO_LANDINGS).map(slug => ({
    url: `${BASE}/immo/${slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  })),
  // Landing pages télécom
  ...Object.keys(TELECOM_LANDINGS).map(slug => ({
    url: `${BASE}/telecom/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })),
  // Guides
  { url: `${BASE}/guide-prix`,    changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/guide-achat`,   changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/guide-immo`,    changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/guide-forfait`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/guide-emploi`,  changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/assistant-whatsapp`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/deposer-annonce`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/deposer-immo`,  changeFrequency: 'monthly', priority: 0.5 },
]
```

(URLs supprimées volontairement : `/connexion`, `/inscription`, `/favoris`, `/comparaison`, `/categorie/beaute` — pages utilitaires ou vides. Le reste du fichier — fetch produits/immo/annonces/boutiques — ne change pas.)

- [ ] **Step 2: Vérifier**

`npx tsc --noEmit` → exit 0. Puis :
```bash
curl -s "http://localhost:3001/sitemap.xml" | grep -c "<loc>"
curl -s "http://localhost:3001/sitemap.xml" | grep -oE "climatiseurs|location-appartement-dakar|telecom/orange|guide-prix|moins-de-50000" | sort -u
curl -s "http://localhost:3001/sitemap.xml" | grep -cE "connexion|favoris|/categorie/beaute"
```
Expected: (1) plusieurs centaines d'URLs ; (2) les 5 motifs présents ; (3) `0`.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/app/sitemap.ts
git commit -m "feat(seo): sitemap assaini (retrait pages utilitaires et beaute) + ajout guides, budget et 20 landing pages"
```

---

### Task 13: Vérification finale + documentation post-déploiement

**Files:**
- Create: `docs/SEO-POST-DEPLOIEMENT.md`

- [ ] **Step 1: Build de production complet**

Run: `cd frontend-next && npm run build`
Expected: build réussi, zéro erreur. (Le build échoue si deux segments dynamiques frères subsistent — vérifie de fait la suppression de `moins-de-[budget]`.)

- [ ] **Step 2: Suite curl complète (dev servers relancés)**

```bash
for u in "categorie/tv-electro/climatiseurs" "categorie/smartphones/iphone" "categorie/smartphones/moins-de-50000" "immo/location-appartement-dakar" "immo/location-chambre-dakar" "telecom/orange" "telecom/yas" "guide-prix" "categorie/tv-electro"; do
  echo "── $u"; curl -s "http://localhost:3001/$u" | grep -oE '<title>[^<]*</title>' | head -1
done
```
Expected: 9 titles distincts, corrects, un seul « Nopalou » chacun, zéro mojibake. Test « JS désactivé » du cahier des charges : le HTML curl contient produits/annonces/prix (déjà validé si les greps précédents ont trouvé les H1 et contenus).

- [ ] **Step 3: Écrire `docs/SEO-POST-DEPLOIEMENT.md`**

```markdown
# SEO — Actions après déploiement (à faire par le fondateur)

## 1. Search Console (dès que le déploiement est en ligne)
1. Vérifier 3 pages avec « Inspection de l'URL » → « Tester l'URL en direct » (ex: /categorie/tv-electro/climatiseurs) : le HTML rendu doit contenir le H1 et les produits.
2. Sitemaps → re-soumettre `https://nopalou.com/sitemap.xml`.
3. « Demander une indexation » (Inspection de l'URL, bouton après le test) pour chacune des pages stratégiques :
   - Les 7 catégories : /categorie/{smartphones, informatique, tv-electro, mode, maison, auto-moto, jeux}
   - Les 9 sous-catégories : /categorie/tv-electro/{climatiseurs, televiseurs, refrigerateurs, electromenager}, /categorie/smartphones/{iphone, samsung, xiaomi-redmi, tecno}, /categorie/informatique/ordinateurs
   - Les 7 pages immo : /immo/{location-appartement-dakar, location-chambre-dakar, location-studio-dakar, location-maison-dakar, vente-appartement-dakar, vente-maison-dakar, vente-terrain-dakar}
   - Les 4 pages télécom : /telecom/{orange, yas, promobile, expresso}
   - Les 5 guides : /guide-prix, /guide-achat, /guide-immo, /guide-forfait, /guide-emploi
   (Quota Google ≈ 10-12 demandes/jour : étaler sur 3-4 jours, commencer par les sous-catégories.)

## 2. Cloudflare (si le domaine passe par Cloudflare)
- Rules → Redirect Rules : forcer une seule version canonique — rediriger `www.nopalou.com/*` vers `nopalou.com/$1` en 301 (ou l'inverse selon la config DNS actuelle).
- Caching → Cache Rules : « Eligible for cache » sur les chemins publics HTML (`/categorie/*`, `/immo/*`, `/telecom/*`, `/guide-*`), Edge TTL 1h — améliore le TTFB mesuré par Google. NE PAS mettre en cache `/compte*`, `/mes-*`, `/admin*`, `/api/*`.
- « Auto Minify » n'existe plus (retiré par Cloudflare en 2024) — rien à faire, Next.js minifie déjà.

## 3. Suivi (2 à 6 semaines)
- Search Console → Indexation → Pages : la courbe « indexées » doit monter au fil des semaines.
- `site:nopalou.com` sur Google : le nombre de résultats doit croître.
- Performances → Requêtes : surveiller l'apparition de « climatiseur prix dakar », « iphone prix dakar », « location appartement dakar »…
- Rappel : domaine jeune ⇒ l'indexation prend des semaines. Ne pas re-demander l'indexation des mêmes pages plus d'une fois par semaine.
```

- [ ] **Step 4: Commit**

```bash
git add docs/SEO-POST-DEPLOIEMENT.md
git commit -m "docs(seo): checklist post-deploiement (Search Console, Cloudflare, suivi)"
```

---

## Self-Review (fait à l'écriture du plan)

- **Couverture spec** : 1.1 correctifs → Tasks 4, 5, 6 + mojibake/budget dans Task 2 ✓ ; 1.2 sitemap → Task 12 ✓ ; 1.3 contenu catégories → Task 9 ✓ ; 1.4 maillage → Tasks 9, 10, 11 ✓ ; vague 2 produits → Tasks 1-3 ✓ ; immo → Task 7 ✓ ; télécom → Task 8 ✓ ; infra/tests/Search Console → Task 13 ✓.
- **Découverte post-spec intégrée** : la route budget était en réalité un catch-all cassé (budget jamais parsé, soft-404 sur tout slug) — le remplacement par `[sousCategorie]` (Task 2) corrige les trois bugs et évite le conflit de segments dynamiques frères qu'aurait créé l'ajout d'un dossier `[sousCategorie]` à côté de `moins-de-[budget]`.
- **Cohérence des types** : `SousCategorieConfig`/`SOUS_CATEGORIES` (Tasks 2, 3, 9, 12), `IMMO_LANDINGS` (Tasks 7, 10, 12), `TELECOM_LANDINGS` (Tasks 8, 10, 12), `immoLandingMetadata`/`telecomLandingMetadata` — noms identiques partout.
- **Pas de tests unitaires** : le projet n'a pas d'infra de test frontend ; la vérification suit la convention projet (tsc --noEmit + build + curl contre les serveurs dev, backend local branché sur la base réelle en lecture seule).
