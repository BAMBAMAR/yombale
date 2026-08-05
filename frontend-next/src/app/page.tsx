import type { Metadata } from 'next'
import Link from 'next/link'
import SearchBar from './SearchBar'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const SSR_SECRET = process.env.SSR_SECRET || ''
const SSR_HEADERS: Record<string, string> = SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}
import ProduitsListe from './ProduitsListe'
import RecentlyViewed from './RecentlyViewed'
import CompareFilterBanner from '@/components/CompareFilterBanner'
import ShowcaseTabs from './ShowcaseTabs'

export const metadata: Metadata = {
  title: 'Comparateur de prix au Sénégal · Dakar',
  description:
    'Nopalou est le comparateur de prix N°1 au Sénégal. Trouvez le prix le moins cher pour vos achats à Dakar : téléphones, TV, électroménager, informatique. Gratuit et mis à jour toutes les 6h.',
  keywords: [
    'comparateur de prix Sénégal', 'comparateur prix Dakar', 'prix moins cher Sénégal',
    'meilleur prix Dakar', 'comparer prix Sénégal', 'achat pas cher Dakar',
    'prix téléphone Sénégal', 'prix TV Dakar', 'Nopalou',
  ],
}

import { CATEGORIES as LIB_CATEGORIES } from '@/lib/categories'

const CATEGORIES = LIB_CATEGORIES.map(c => ({
  slug: c.value,
  label: c.label.replace(/^.*? /, ''), // Remove emoji
  emoji: c.label.split(' ')[0]
}))
CATEGORIES.push({ slug: 'telecom', label: 'Télécom & Forfaits', emoji: '📡' })

const BUDGETS = [
  { label: '< 5 000',    prixMax: '5000'   },
  { label: '5k – 15k',   prixMax: '15000'  },
  { label: '15k – 50k',  prixMax: '50000'  },
  { label: '50k – 100k', prixMax: '100000' },
  { label: '+ 100 000',  prixMax: ''       },
]

const TRIS = [
  { val: '',          label: '⭐ Pertinence' },
  { val: 'prix_asc',  label: '💰 Prix ↑' },
  { val: 'prix_desc', label: 'Prix ↓' },
  { val: 'populaire', label: '🔥 Populaires' },
  { val: 'nom_asc',   label: 'Nom A-Z' },
]

interface Produit {
  id: number
  nom: string
  marque: string | null
  categorie: string | null
  prix_min: number | null
  prix_max: number | null
  nb_offres: number | null
  image_url: string | null
}

interface ApiResponse {
  produits?: Produit[]
  data?: Produit[]
  total?: number
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categorie?: string; prixMax?: string; page?: string; tri?: string; sousType?: string }> | { q?: string; categorie?: string; prixMax?: string; page?: string; tri?: string; sousType?: string }
}) {
  const sp        = await Promise.resolve(searchParams)
  const q         = sp?.q         ?? ''
  const categorie = sp?.categorie ?? ''
  const prixMax   = sp?.prixMax   ?? ''
  const page      = sp?.page      ?? '1'
  const tri       = sp?.tri       ?? ''
  const sousType  = sp?.sousType  ?? ''

  let produits: Produit[] = []
  let total               = 0
  let erreur: string | null = null

  try {
    const params = new URLSearchParams({ limit: '24', page })
    if (q)         params.set('q',         q)
    if (categorie) params.set('categorie', categorie)
    if (prixMax)   params.set('prixMax',   prixMax)
    if (tri)       params.set('tri',       tri)
    if (sousType)  params.set('sousType',  sousType)

    const url = `${BACKEND}/api/produits?${params}`
    let r: Response
    try {
      r = await fetch(url, { cache: 'no-store', headers: SSR_HEADERS })
    } catch {
      const fallbackUrl = url.includes('127.0.0.1')
        ? url.replace('127.0.0.1', 'localhost')
        : url.replace('localhost', '127.0.0.1')
      r = await fetch(fallbackUrl, { cache: 'no-store', headers: SSR_HEADERS })
    }
    if (!r.ok) throw new Error(`API produits → ${r.status}`)
    const data: ApiResponse | Produit[] = await r.json()
    if (Array.isArray(data)) {
      produits = data
      total    = data.length
    } else {
      produits = data.produits ?? data.data ?? []
      total    = data.total ?? produits.length
    }
  } catch (e) {
    erreur = e instanceof Error ? e.message : 'Erreur inconnue'
  }

  const hasFiltre = q || categorie || prixMax || sousType

  let settings: Record<string, string> = {}
  let categoriesActives: string[] | null = null
  try {
    const [rSettings, rCat] = await Promise.all([
      fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store', headers: SSR_HEADERS }).catch(() => null),
      fetch(`${BACKEND}/api/produits/categories-actives`, { cache: 'no-store', headers: SSR_HEADERS }).catch(() => null)
    ])
    if (rSettings && rSettings.ok) settings = await rSettings.json()
    if (rCat && rCat.ok) {
      categoriesActives = await rCat.json()
      // Always include 'mixte' if it's not present, or maybe it's not needed if we filter by slug
    }
  } catch {
    // valeurs par défaut ci-dessous
  }
  const prixPro      = Number(settings.plan_pro_prix) || 5000
  const prixBusiness = Number(settings.plan_business_prix) || 10000
  const waveActif    = settings.paiement_wave !== 'false'
  const manuelActif  = settings.paiement_manuel_actif !== 'false'
  const modePaiementLabel = waveActif && manuelActif
    ? 'Paiement via Wave ou manuel'
    : waveActif
    ? 'Paiement via Wave'
    : 'Paiement manuel disponible';

  return (
    <>
      {/* ── HERO HOME ÉPURÉ & MODERNE (NOPALOU BRAND SYSTEM) ────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fffdfa 50%, #fff7ed 100%)',
        borderBottom: '1px solid #fed7aa',
        padding: '48px 20px 36px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#fff7ed', color: '#c75b00', padding: '6px 16px', borderRadius: 30,
            fontSize: 12, fontWeight: 800, marginBottom: 16, border: '1px solid #ffedd5',
          }}>
            <span>✨ Comparateur N°1 de prix & vendeurs au Sénégal</span>
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 900, color: '#0f172a', margin: '0 0 14px', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
            Comparez les prix & trouvez les meilleurs vendeurs au <span style={{ color: '#C75B00' }}>Sénégal</span>
          </h1>

          <p style={{ fontSize: 16, color: '#475569', margin: '0 auto 28px', maxWidth: 640, lineHeight: 1.6 }}>
            Accédez instantanément à des milliers de produits, téléphones, électroménager et boutiques vérifiées à Dakar et dans toutes les régions.
          </p>

          {/* BARRE DE RECHERCHE PRINCIPALE */}
          <div style={{ maxWidth: 640, margin: '0 auto 24px' }}>
            <SearchBar defaultValue={q} />
          </div>

          {/* CATÉGORIES EN PILULES FLUIDES DIRECTEMENT INCLUSES */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 960, margin: '0 auto' }}>
            {CATEGORIES.map((c) => {
              if (categoriesActives !== null && !categoriesActives.includes(c.slug) && c.slug !== 'telecom') {
                return null;
              }
              const isSelected = categorie === c.slug
              if (c.slug === 'telecom') {
                return (
                  <Link key={c.slug} href="/telecom" className={`categ-pill${isSelected ? ' active' : ''}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    background: '#fff', color: '#334155', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                  }}>
                    <span>{c.emoji}</span> <span>{c.label}</span>
                  </Link>
                )
              }
              return (
                <Link
                  key={c.slug}
                  href={isSelected ? '/' : `/?categorie=${c.slug}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, fontSize: 13,
                    fontWeight: isSelected ? 800 : 600, textDecoration: 'none',
                    background: isSelected ? '#C75B00' : '#fff',
                    color: isSelected ? '#fff' : '#334155',
                    border: isSelected ? '1px solid #C75B00' : '1px solid #e2e8f0',
                    boxShadow: isSelected ? '0 4px 12px rgba(199,91,0,0.22)' : '0 2px 4px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{c.emoji}</span> <span>{c.label}</span>
                </Link>
              )
            })}
          </div>

          {/* RACCOURCI DIRECT BOUTIQUE TAF TAF POUR LES VENDEURS */}
          <div style={{
            marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', padding: '10px 22px', borderRadius: 30,
            boxShadow: '0 4px 16px rgba(15,23,42,0.15)', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              ⚡ Vous êtes commerçant ? Vendez en ligne en 30 sec <strong style={{ color: '#25D366' }}>(1er mois 100% offert)</strong>
            </span>
            <Link
              href="/creer-boutique"
              style={{
                background: '#C75B00', color: '#fff', padding: '6px 16px', borderRadius: 20, fontSize: 12,
                fontWeight: 900, textDecoration: 'none', boxShadow: '0 2px 8px rgba(199,91,0,0.3)', whiteSpace: 'nowrap'
              }}
            >
              Créer ma Boutique Taf Taf 🚀
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTENU PRINCIPAL & RÉSULTATS DIRECTS ──────────────────── */}
      <main className="page-container" style={{ maxWidth: 1440, paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        {/* BANDEAU FEEDBACK RECHERCHE & CONFIRMATION DES RÉSULTATS */}
        {hasFiltre && (
          <div style={{
            background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16,
            padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap', boxShadow: '0 4px 12px rgba(199,91,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20 }}>🔎</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                  {total > 0 ? `${total} produit${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}` : 'Aucun produit trouvé'}
                  {q ? ` pour "${q}"` : ''}
                  {categorie ? ` — Catégorie : ${CATEGORIES.find(c => c.slug === categorie)?.label || categorie}` : ''}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  Résultats actualisés en temps réel.
                </p>
              </div>
            </div>

            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', color: '#dc2626',
                border: '1px solid #fca5a5', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 800,
                textDecoration: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}
            >
              <span>Réinitialiser les filtres</span>
              <span>✕</span>
            </Link>
          </div>
        )}

        {/* ── BARRE DE FILTRES (BUDGET & TRI) ────────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div className="filtres-bar" style={{ margin: 0 }}>
            <span className="filtres-label">Budget :</span>
            {BUDGETS.map((b) => {
              const ps = new URLSearchParams()
              if (q)         ps.set('q',         q)
              if (categorie) ps.set('categorie', categorie)
              if (b.prixMax) ps.set('prixMax',   b.prixMax)
              return (
                <Link
                  key={b.label}
                  href={`/?${ps}`}
                  className={`budget-pill${prixMax === b.prixMax && b.prixMax ? ' active' : ''}`}
                >
                  {b.label}
                </Link>
              )
            })}
          </div>

          <div className="filtres-bar" style={{ margin: 0 }}>
            <span className="filtres-label">Trier :</span>
            {TRIS.map((t) => {
              const ps = new URLSearchParams()
              if (q)         ps.set('q',         q)
              if (categorie) ps.set('categorie', categorie)
              if (prixMax)   ps.set('prixMax',   prixMax)
              if (t.val)     ps.set('tri',       t.val)
              return (
                <Link
                  key={t.val || 'defaut'}
                  href={`/?${ps}`}
                  className={`budget-pill${tri === t.val ? ' active' : ''}`}
                >
                  {t.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* GRILLE DES PRODUITS IMMÉDIATE */}
        <CompareFilterBanner />
        <ProduitsListe
          key={`${q}-${categorie}-${prixMax}-${tri}-${sousType}`}
          initialProduits={produits}
          total={total}
          q={q}
          categorie={categorie}
          prixMax={prixMax}
          tri={tri}
          sousType={sousType}
        />
        {/* SECTION DES 3 FORMULES & TARIFS DE MARQUE */}
        <ShowcaseTabs />

        {/* PRODUITS RÉCEMMENT CONSULTÉS */}
        <RecentlyViewed />
      </main>

            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
            Pas de débit automatique · Renouvellement manuel · {modePaiementLabel}
          </p>
        </section>
      )}

      {/* ── Bloc SEO ─────────────────────────────────────────────── */}
      {!hasFiltre && (
        <section style={{ maxWidth: 1200, margin: '24px auto 24px', padding: '0 20px' }}>
          <div className="seo-card">
            <div className="seo-head">
              <h2>Le comparateur de prix N°1 au Sénégal</h2>
              <span className="seo-tag">6800+ produits · maj / 6h</span>
            </div>

            <div className="seo-cols-wrap">
              <div className="seo-cols-grid">
                <div className="seo-blurb">
                  <span className="seo-icon">📊</span>
                  <p>
                    <strong>Nopalou</strong> est le premier comparateur de prix dédié au marché sénégalais.
                    Vous cherchez le <strong>prix le moins cher</strong> pour un téléphone, une télévision, un réfrigérateur ou un ordinateur ?
                    Nopalou compare en temps réel les prix de milliers de produits chez tous les grands marchands en ligne au Sénégal.
                  </p>
                </div>
                <div className="seo-blurb">
                  <span className="seo-icon">📍</span>
                  <p>
                    Que vous soyez à <strong>Dakar</strong>, Thiès, Saint-Louis, Ziguinchor ou Kaolack — trouvez le meilleur prix avant d&apos;acheter.
                    Nos prix sont mis à jour automatiquement toutes les 6 heures depuis Jumia, Expat-Dakar, CoinAfrique et d&apos;autres marchands.
                    Comparer les prix au Sénégal n&apos;a jamais été aussi simple : recherchez votre produit, voyez toutes les offres côte à côte, et choisissez le vendeur le moins cher. <strong>Gratuit, sans inscription, sans pub intrusive.</strong>
                  </p>
                </div>
              </div>
            </div>

            <p className="chip-row-label">Comparer par catégorie</p>
            <div className="chip-row">
              {CATEGORIES.filter(c => c.slug !== 'telecom').map(c => (
                <Link key={c.slug} href={`/categorie/${c.slug}`} className="chip">
                  <span className="chip-em">{c.emoji}</span>
                  {c.label}
                </Link>
              ))}
            </div>

            <p className="chip-row-label">Recherches populaires à Dakar</p>
            <div className="chip-row">
              {[
                { href: '/categorie/tv-electro/climatiseurs', label: 'Climatiseur prix Dakar', emoji: '❄️' },
                { href: '/categorie/smartphones/iphone', label: 'iPhone prix Dakar', emoji: '📱' },
                { href: '/categorie/smartphones/samsung', label: 'Samsung Galaxy prix Dakar', emoji: '📱' },
                { href: '/categorie/tv-electro/televiseurs', label: 'TV prix Dakar', emoji: '📺' },
                { href: '/categorie/tv-electro/refrigerateurs', label: 'Frigo prix Dakar', emoji: '🧊' },
                { href: '/categorie/informatique/ordinateurs', label: 'Ordinateur portable prix Dakar', emoji: '💻' },
                { href: '/immo/location-appartement-dakar', label: 'Location appartement Dakar', emoji: '🏢' },
                { href: '/immo/location-chambre-dakar', label: 'Chambre à louer Dakar', emoji: '🛏️' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="chip chip-small">
                  <span className="chip-em">{l.emoji}</span>
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="seo-foot">
              <span className="seo-dot" />
              Prix vérifiés automatiquement toutes les 6 heures sur tous les grands marchands sénégalais
            </div>
          </div>
        </section>
      )}
    </>
  )
}
