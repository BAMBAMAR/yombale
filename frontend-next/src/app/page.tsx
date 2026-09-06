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
import { apiFetch } from '@/lib/api'

import HeroWhatsAppCarousel from './HeroWhatsAppCarousel'

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
  { label: 'Tout',        prixMin: '',       prixMax: ''       },
  { label: '< 5 000',    prixMin: '',       prixMax: '5000'   },
  { label: '5k – 15k',   prixMin: '5000',   prixMax: '15000'  },
  { label: '15k – 50k',  prixMin: '15000',  prixMax: '50000'  },
  { label: '50k – 100k', prixMin: '50000',  prixMax: '100000' },
  { label: '+ 100 000',  prixMin: '100000', prixMax: ''       },
]

const ETATS = [
  { val: '',         label: 'Tout' },
  { val: 'Neuf',     label: 'Neuf' },
  { val: 'Occasion', label: 'Occasion' },
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

interface TendanceItem {
  label: string
  q: string
}

const DEFAULT_TENDANCES: TendanceItem[] = [
  { label: 'iPhone 15', q: 'iphone' },
  { label: 'Climatiseurs', q: 'climatiseur' },
  { label: 'Samsung S24', q: 'samsung' },
]

interface ApiResponse {
  produits?: Produit[]
  data?: Produit[]
  total?: number
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categorie?: string; prixMin?: string; prixMax?: string; etat?: string; page?: string; tri?: string; sousType?: string }> | { q?: string; categorie?: string; prixMin?: string; prixMax?: string; etat?: string; page?: string; tri?: string; sousType?: string }
}) {
  const sp        = await Promise.resolve(searchParams)
  const q         = sp?.q         ?? ''
  const categorie = sp?.categorie ?? ''
  const prixMin   = sp?.prixMin   ?? ''
  const prixMax   = sp?.prixMax   ?? ''
  const etat      = sp?.etat      ?? ''
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
    if (prixMin)   params.set('prixMin',   prixMin)
    if (prixMax)   params.set('prixMax',   prixMax)
    if (etat)      params.set('etat',      etat)
    if (tri)       params.set('tri',       tri)
    if (sousType)  params.set('sousType',  sousType)

    const data = await apiFetch<ApiResponse | Produit[]>(`/produits?${params}`)
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

  function buildFilterUrl(changes: Record<string, string | null>) {
    const state: Record<string, string> = {
      q, categorie, prixMin, prixMax, etat, tri, sousType
    }
    for (const key in changes) {
      const val = changes[key]
      if (val === null || val === '') {
        delete state[key]
      } else {
        state[key] = val!
      }
    }
    const ps = new URLSearchParams()
    for (const k in state) {
      if (state[k]) ps.set(k, state[k])
    }
    const str = ps.toString()
    return str ? `/?${str}#resultats` : '/#resultats'
  }

  const hasFiltre = q || categorie || prixMin || prixMax || etat || sousType

  let settings: Record<string, string> = {}
  let categoriesActives: string[] | null = null
  let tendances: TendanceItem[] = DEFAULT_TENDANCES
  try {
    const [stg, catAct, tendRes] = await Promise.all([
      apiFetch<Record<string, string>>('/settings/public').catch(() => ({})),
      apiFetch<string[]>('/produits/categories-actives').catch(() => null),
      apiFetch<TendanceItem[]>('/produits/tendances?limit=4').catch(() => null),
    ])
    if (stg && typeof stg === 'object') settings = stg as Record<string, string>
    if (catAct && Array.isArray(catAct)) categoriesActives = catAct
    if (tendRes && Array.isArray(tendRes) && tendRes.length > 0) {
      tendances = tendRes
    }
  } catch {
    // valeurs par défaut ci-dessous
  }
  const prixPro = Number(settings.plan_pro_prix) || 5000;
  const prixBusiness = Number(settings.plan_business_prix) || 10000;
  const prixTafTaf = Number(settings.plan_decouverte_prix || settings.plan_taftaf_prix) || 2500;

  return (
    <>
      {/* ── HERO HOME COMPACT & ÉPURÉ (NOPALOU BRAND SYSTEM) ────────── */}
      <section style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 60%, var(--bg, #F8F5F0) 100%)',
        borderBottom: '1px solid var(--border, #E8DDD2)',
        padding: '6px 14px 6px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="hero-split-grid">
            
            {/* ── COLONNE GAUCHE : RECHERCHE & ACCÈS RAPIDE COMPACT ──────── */}
            <div className="hero-split-left">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  background: 'var(--orange2, #FFF3E8)', color: 'var(--accent, #C75B00)', padding: '1px 7px', borderRadius: 10,
                  fontSize: 10, fontWeight: 800, border: '1px solid #FFEDD5', letterSpacing: '0.01em',
                  whiteSpace: 'nowrap', flexShrink: 0
                }}>
                  ✨ N°1 au Sénégal
                </span>
                <h1 style={{
                  fontSize: 'clamp(15px, 1.7vw, 19px)',
                  fontWeight: 900,
                  color: 'var(--navy, #1C2B4A)',
                  margin: 0,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap'
                }}>
                  Achetez au meilleur prix à Dakar &amp; au <span style={{ color: 'var(--accent, #C75B00)' }}>Sénégal</span>
                </h1>
              </div>

              {/* BARRE DE RECHERCHE COMPACTE */}
              <div style={{ width: '100%', maxWidth: 540, marginBottom: 5 }}>
                <SearchBar defaultValue={q} />
              </div>

              {/* RUBAN UNIQUE FLUIDE & ULTRA-PLAT */}
              <div style={{ width: '100%', maxWidth: 540 }}>
                <div className="hero-split-categories">
                  {CATEGORIES.map((c) => {
                    if (
                      categoriesActives !== null &&
                      !categoriesActives.includes(c.slug) &&
                      c.slug !== 'telecom' &&
                      c.slug !== 'immo' &&
                      c.slug !== 'annonces'
                    ) {
                      return null;
                    }
                    const isSelected = categorie === c.slug

                    if (c.slug === 'immo') {
                      return (
                        <Link key={c.slug} href="/immo" prefetch={false} aria-label="Immobilier et Terrains" className="categ-pill" style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 10, fontSize: 10.5, fontWeight: 600, textDecoration: 'none',
                          background: '#fff', color: 'var(--text-strong, #2A231E)', border: '1px solid var(--border-light, #DDD5CB)', boxShadow: '0 1px 2px rgba(26,22,18,0.03)',
                          whiteSpace: 'nowrap', flexShrink: 0
                        }}>
                          <span>🏢</span> <span>Immobilier</span>
                        </Link>
                      )
                    }

                    if (c.slug === 'annonces') {
                      return (
                        <Link key={c.slug} href="/annonces" prefetch={false} aria-label="Petites Annonces" className="categ-pill" style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 10, fontSize: 10.5, fontWeight: 600, textDecoration: 'none',
                          background: '#fff', color: 'var(--text-strong, #2A231E)', border: '1px solid var(--border-light, #DDD5CB)', boxShadow: '0 1px 2px rgba(26,22,18,0.03)',
                          whiteSpace: 'nowrap', flexShrink: 0
                        }}>
                          <span>📢</span> <span>Annonces</span>
                        </Link>
                      )
                    }

                    if (c.slug === 'telecom') {
                      return (
                        <Link key={c.slug} href="/telecom" prefetch={false} aria-label="Télécom & Forfaits" className={`categ-pill${isSelected ? ' active' : ''}`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 10, fontSize: 10.5, fontWeight: 600, textDecoration: 'none',
                          background: '#fff', color: 'var(--text-strong, #2A231E)', border: '1px solid var(--border-light, #DDD5CB)', boxShadow: '0 1px 2px rgba(26,22,18,0.03)',
                          whiteSpace: 'nowrap', flexShrink: 0
                        }}>
                          <span>{c.emoji}</span> <span>{c.label}</span>
                        </Link>
                      )
                    }

                    return (
                      <Link
                        key={c.slug}
                        href={isSelected ? '/#resultats' : `/?categorie=${c.slug}#resultats`}
                        prefetch={false}
                        aria-label={`Filtrer par catégorie ${c.label}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 10, fontSize: 10.5,
                          fontWeight: isSelected ? 800 : 600, textDecoration: 'none',
                          background: isSelected ? 'var(--accent, #C75B00)' : '#fff',
                          color: isSelected ? '#fff' : 'var(--text-strong, #2A231E)',
                          border: isSelected ? '1px solid var(--accent, #C75B00)' : '1px solid var(--border-light, #DDD5CB)',
                          boxShadow: isSelected ? '0 2px 5px rgba(199,91,0,0.2)' : '0 1px 2px rgba(26,22,18,0.03)',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap', flexShrink: 0
                        }}
                      >
                        <span>{c.emoji}</span> <span>{c.label}</span>
                      </Link>
                    )
                  })}
                  <Link
                    href="/boutiques"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 10, fontSize: 10.5,
                      fontWeight: 700, textDecoration: 'none', background: 'var(--bg, #F8F5F0)', color: 'var(--accent, #C75B00)',
                      border: '1px solid var(--border, #E8DDD2)', whiteSpace: 'nowrap', flexShrink: 0
                    }}
                  >
                    <span>🏪</span> <span>Boutiques →</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* ── COLONNE DROITE : SOLUTIONS MARCHANDS COMPACTE & APPLATIE ── */}
            <div className="hero-split-right">
              <div style={{
                background: 'linear-gradient(145deg, #1C2B4A 0%, #17243E 60%, #101B30 100%)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '8px 12px',
                boxShadow: '0 4px 14px rgba(28, 43, 74, 0.10)',
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'left',
                height: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 4
              }}>
                {/* Lueur décorative discrète */}
                <div style={{
                  position: 'absolute',
                  top: -25,
                  right: -25,
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(199,91,0,0.25) 0%, rgba(199,91,0,0) 70%)',
                  pointerEvents: 'none'
                }} />

                {/* En-tête commerçants */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      background: 'rgba(199, 91, 0, 0.22)', color: '#FED7AA',
                      fontSize: 9, fontWeight: 800, padding: '1px 6px',
                      borderRadius: 10, border: '1px solid rgba(199, 91, 0, 0.4)'
                    }}>
                      🏪 COMMERÇANTS
                    </span>
                    <strong style={{ fontSize: 12.5, color: '#FFFFFF', fontWeight: 800 }}>
                      Caisse POS &amp; Vitrine Web
                    </strong>
                  </div>
                  <span style={{
                    background: '#16A34A', color: '#ffffff',
                    fontSize: 8.5, padding: '1px 5px', borderRadius: 10,
                    fontWeight: 900, letterSpacing: '0.02em', flexShrink: 0
                  }}>
                    30J OFFERTS
                  </span>
                </div>

                {/* Points forts en ligne compacte */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5,
                  color: '#E2E8F0', flexWrap: 'wrap'
                }}>
                  <span>⚡ Caisse hors-ligne &amp; scan</span>
                  <span>•</span>
                  <span>📲 Relances WhatsApp</span>
                  <span>•</span>
                  <span>🪄 0% com.</span>
                </div>

                {/* Ligne Tarif & Actions combinées */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                    Dès <strong style={{ color: '#FED7AA', fontSize: 11 }}>2 500 F/mois</strong>
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Link
                      href="/creer-boutique"
                      style={{
                        padding: '4px 9px',
                        borderRadius: 6,
                        background: 'var(--accent, #C75B00)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: 11,
                        textDecoration: 'none',
                        boxShadow: '0 2px 5px rgba(199, 91, 0, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>Créer Boutique</span>
                      <span>→</span>
                    </Link>

                    <a
                      href="#forfaits-vendeurs"
                      style={{
                        padding: '4px 7px',
                        borderRadius: 6,
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        color: '#F1F5F9',
                        fontWeight: 700,
                        fontSize: 10.5,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Forfaits ↓
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CONTENU PRINCIPAL & RÉSULTATS DIRECTS ──────────────────── */}
      <main id="resultats" className="page-container" style={{ maxWidth: 'var(--max-w, 1380px)', paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
        
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
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                  {total > 0 ? `${total} produit${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}` : 'Aucun produit trouvé'}
                  {q ? ` pour "${q}"` : ''}
                  {categorie ? ` — Catégorie : ${CATEGORIES.find(c => c.slug === categorie)?.label || categorie}` : ''}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-subtle, #5A4E42)' }}>
                  Résultats actualisés en temps réel.
                </p>
              </div>
            </div>

            <Link
              href="/#resultats"
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

        {/* ── BARRE DE FILTRES EN 2 LIGNES STRICTES SANS AUCUN RETOUR À LA LIGNE ────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          
          {/* LIGNE 1 : Budget + État */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', flexWrap: 'nowrap' }}>
            <div className="horizontal-scroll-fade" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-subtle, #5A4E42)', whiteSpace: 'nowrap', marginRight: 2 }}>Budget :</span>
              {BUDGETS.map((b) => {
                const isActive = (b.prixMin === prixMin && b.prixMax === prixMax) || (b.label === 'Tout' && !prixMin && !prixMax);
                return (
                  <Link
                    key={b.label}
                    href={buildFilterUrl({ prixMin: b.prixMin, prixMax: b.prixMax })}
                    prefetch={false}
                    className={`budget-pill${isActive ? ' active' : ''}`}
                    style={{ padding: '4px 10px', fontSize: 12, borderRadius: 14, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {b.label}
                  </Link>
                )
              })}

              <div style={{ width: 1, height: 16, background: 'var(--border-medium, #C8BDB2)', margin: '0 4px', flexShrink: 0 }} className="hidden-mobile" />

              <span className="hidden-mobile" style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-subtle, #5A4E42)', whiteSpace: 'nowrap', marginLeft: 2 }}>État :</span>
              {ETATS.map((e) => {
                const isActive = etat === e.val;
                return (
                  <Link
                    key={e.label}
                    href={buildFilterUrl({ etat: e.val })}
                    prefetch={false}
                    className={`budget-pill hidden-mobile${isActive ? ' active' : ''}`}
                    style={{ padding: '4px 10px', fontSize: 12, borderRadius: 14, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {e.label}
                  </Link>
                )
              })}
            </div>

            {hasFiltre ? (
              <Link
                href="/#resultats"
                prefetch={false}
                className="budget-pill hidden-mobile"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ef4444', borderColor: '#fee2e2',
                  background: '#fef2f2', fontWeight: 700, padding: '4px 10px', fontSize: 12, borderRadius: 14,
                  whiteSpace: 'nowrap', flexShrink: 0
                }}
              >
                <span>✖</span> Réinitialiser
              </Link>
            ) : null}
          </div>

          {/* LIGNE 2 : Trier + Tendances */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', flexWrap: 'nowrap' }}>
            <div className="horizontal-scroll-fade" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-subtle, #5A4E42)', whiteSpace: 'nowrap', marginRight: 2 }}>Trier :</span>
              {TRIS.map((t) => {
                const isActive = tri === t.val;
                return (
                  <Link
                    key={t.val || 'defaut'}
                    href={buildFilterUrl({ tri: t.val })}
                    prefetch={false}
                    className={`budget-pill${isActive ? ' active' : ''}`}
                    style={{ padding: '4px 10px', fontSize: 12, borderRadius: 14, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {t.label}
                  </Link>
                )
              })}

              <div style={{ width: 1, height: 16, background: 'var(--border-medium, #C8BDB2)', margin: '0 4px', flexShrink: 0 }} className="hidden-mobile" />

              <span className="hidden-mobile" style={{ fontSize: 12, fontWeight: 800, color: '#9a3412', whiteSpace: 'nowrap', marginLeft: 2 }}>🔥 Tendances :</span>
              {tendances.map((item, idx) => (
                <Link
                  key={`${item.q}-${idx}`}
                  href={buildFilterUrl({ q: item.q })}
                  prefetch={false}
                  className="budget-pill hidden-mobile"
                  style={{ padding: '4px 10px', fontSize: 12, borderRadius: 14, whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* GRILLE DES PRODUITS IMMÉDIATE */}
        <CompareFilterBanner />
        <ProduitsListe
          key={`${q}-${categorie}-${prixMin}-${prixMax}-${etat}-${tri}-${sousType}`}
          initialProduits={produits}
          total={total}
          q={q}
          categorie={categorie}
          prixMin={prixMin}
          prixMax={prixMax}
          etat={etat}
          tri={tri}
          sousType={sousType}
        />
        {/* SECTION DES 3 FORMULES & TARIFS DE MARQUE */}
        <ShowcaseTabs prixTafTaf={prixTafTaf} prixPro={prixPro} prixBusiness={prixBusiness} />

        {/* PRODUITS RÉCEMMENT CONSULTÉS */}
        <RecentlyViewed />
      </main>

      {/* ── Bloc SEO (MODERNISÉ, SANS BOÎTE) ─────────────────────────────────────────────── */}
      {!hasFiltre && (
        <section style={{ maxWidth: 'var(--max-w-narrow, 1280px)', margin: '0 auto 32px', padding: '0 20px' }}>
          
          {/* En-tête de section épuré */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{ display: 'inline-block', background: '#fff7ed', color: '#9a3412', padding: '6px 16px', borderRadius: 30, fontSize: 12, fontWeight: 800, marginBottom: 12, border: '1px solid #fed7aa' }}>
              6800+ produits · mis à jour toutes les 6h
            </span>
            <h2 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 32, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: 0, lineHeight: 1.2 }}>
              Le comparateur de prix N°1 au <span style={{ color: 'var(--accent, #C75B00)' }}>Sénégal</span>
            </h2>
          </div>

          {/* Grille de texte moderne */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, marginBottom: 48 }}>
            <div style={{ background: '#ffffff', padding: 24, borderRadius: 16, border: '1px solid var(--border-light, #DDD5CB)', boxShadow: '0 4px 20px rgba(26,22,18,0.03)' }}>
              <span style={{ fontSize: 32, marginBottom: 16, display: 'block' }}>📊</span>
              <p style={{ margin: 0, color: 'var(--text-body, #4A3F36)', fontSize: 14, lineHeight: 1.7 }}>
                <strong>Nopalou</strong> est le premier comparateur de prix dédié au marché sénégalais. Vous cherchez le <strong>prix le moins cher</strong> pour un téléphone, une télévision, un réfrigérateur ou un ordinateur ? Nopalou compare en temps réel les prix de milliers de produits chez tous les grands marchands en ligne au Sénégal.
              </p>
            </div>
            
            <div style={{ background: '#ffffff', padding: 24, borderRadius: 16, border: '1px solid var(--border-light, #DDD5CB)', boxShadow: '0 4px 20px rgba(26,22,18,0.03)' }}>
              <span style={{ fontSize: 32, marginBottom: 16, display: 'block' }}>📍</span>
              <p style={{ margin: 0, color: 'var(--text-body, #4A3F36)', fontSize: 14, lineHeight: 1.7 }}>
                Que vous soyez à <strong>Dakar</strong>, Thiès, Saint-Louis, Ziguinchor ou Kaolack — trouvez le meilleur prix avant d&apos;acheter. Nos prix sont mis à jour automatiquement toutes les 6 heures depuis Jumia, Expat-Dakar, CoinAfrique et d&apos;autres. <strong>Gratuit, sans inscription, sans pub.</strong>
              </p>
            </div>
          </div>

          <p className="chip-row-label">Comparer par catégorie</p>
            <div className="chip-row">
              {CATEGORIES.filter(c => c.slug !== 'telecom').map(c => (
                <Link key={c.slug} href={`/categorie/${c.slug}`} aria-label={`Catalogue complet de la catégorie ${c.label}`} className="chip">
                  <span className="chip-em">{c.emoji}</span>
                  {c.label}
                </Link>
              ))}
            </div>

            <p className="chip-row-label">Solutions Vendeurs, Business &amp; Commerce au Sénégal</p>
            <div className="chip-row" style={{ marginBottom: 24 }}>
              {[
                { href: '/creer-boutique', label: 'Créer sa boutique en ligne (1m offert)', emoji: '🚀' },
                { href: '/guide-sourcing-revente', label: 'Sourcing Alibaba, AliExpress & Shein', emoji: '📦' },
                { href: '/compte/apporteur', label: 'Programme Apporteur (20% récurrent à vie)', emoji: '💼' },
                { href: '/tarifs-boutique', label: 'Tarifs & Forfaits Vendeurs Sénégal', emoji: '🏷️' },
                { href: '/marchands', label: 'Plateforme Marchands & POS Caisse', emoji: '🏪' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="chip chip-small" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <span className="chip-em">{l.emoji}</span>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* ── BANDEAU RÉSEAUX SOCIAUX OFFICIELS NOPALOU ──────────────────── */}
            <div style={{ marginTop: 40, padding: '24px 20px', background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #0d1728 100%)', borderRadius: 16, color: '#ffffff', textAlign: 'center', boxShadow: '0 8px 24px rgba(28,43,74,0.15)' }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#fed7aa', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(199,91,0,0.2)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(199,91,0,0.3)' }}>
                📢 Communauté &amp; Bons Plans
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', margin: '10px 0 6px' }}>
                Rejoignez Nopalou sur vos Réseaux Préférés
              </h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 auto 20px', maxWidth: 540, lineHeight: 1.5 }}>
                Suivez nos vidéos TikTok, recevez les baisses de prix en direct sur notre Canal WhatsApp et profitez des ventes flash exclusives à Dakar.
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href="https://www.tiktok.com/@nopalou.com?_r=1&_t=ZS-98f75NgDJNS"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s ease' }}
                >
                  <span>🎵</span> <span>TikTok (@nopalou.com)</span>
                </a>
                <a
                  href="https://whatsapp.com/channel/0029Vb8fc4bBadmW40AFKx33"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'rgba(37, 211, 102, 0.15)', color: '#86efac', border: '1px solid rgba(37, 211, 102, 0.35)', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s ease' }}
                >
                  <span>💬</span> <span>Canal WhatsApp</span>
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61591675701726"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s ease' }}
                >
                  <span>📘</span> <span>Facebook</span>
                </a>
                <a
                  href="https://www.instagram.com/nopalousn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s ease' }}
                >
                  <span>📸</span> <span>Instagram</span>
                </a>
                <a
                  href="https://twitter.com/nopalou_sn"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s ease' }}
                >
                  <span>𝕏</span> <span>Twitter</span>
                </a>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 30, padding: 16, background: 'var(--surface-muted, #FAF8F5)', borderRadius: 12, color: 'var(--text-subtle, #5A4E42)', fontSize: 13, border: '1px solid var(--border-light, #DDD5CB)' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, background: '#10b981', borderRadius: '50%', marginRight: 8 }} />
              Prix vérifiés automatiquement toutes les 6 heures sur tous les grands marchands sénégalais
            </div>
        </section>
      )}
    </>
  )
}
