import type { Metadata } from 'next'
import Link from 'next/link'
import '@/styles/homepage.css'
import SearchBar from './SearchBar'

export const revalidate = 300 // ISR 5 minutes — TTFB instantané via cache avec rafraîchissement en arrière-plan

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const SSR_SECRET = process.env.SSR_SECRET || ''
const SSR_HEADERS: Record<string, string> = SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}
import ProduitsListe from './ProduitsListe'
import RecentlyViewed from './RecentlyViewed'
import CompareFilterBanner from '@/components/CompareFilterBanner'
import { apiFetch } from '@/lib/api'

import HeroWhatsAppCarousel from './HeroWhatsAppCarousel'
import HomeDualTrackContainer from './HomeDualTrackContainer'
import FacettesDynamiques from '@/components/FacettesDynamiques'
import HomeImmoShowcase from './components/HomeImmoShowcase'
import WorkflowsShowcaseSection from './components/WorkflowsShowcaseSection'
import {
  Search, X, Building2, Tag, Store, ShoppingBag, MessageCircle,
  Smartphone, Laptop, Tv, Shirt, Home, Car, Gamepad2, Sparkles,
  Dumbbell, BookOpen, Radio
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Nopalou · Acheter au meilleur prix, Vendre & Développer son commerce au Sénégal',
  description:
    'Nopalou est la plateforme de commerce digital au Sénégal. Comparez les prix à Dakar, commandez directement auprès de boutiques vérifiées, ou lancez votre propre boutique avec caisse POS tactile.',
  keywords: [
    'commerce digital Sénégal', 'comparateur de prix Sénégal', 'comparateur prix Dakar',
    'boutique en ligne Sénégal', 'caisse pos Sénégal', 'prix moins cher Sénégal',
    'meilleur prix Dakar', 'achat pas cher Dakar', 'vendre en ligne Dakar', 'Nopalou',
  ],
}

import { CATEGORIES as LIB_CATEGORIES } from '@/lib/categories'

function getCategoryIcon(slug: string, size = 12) {
  switch (slug) {
    case 'smartphones': return <Smartphone size={size} />
    case 'informatique': return <Laptop size={size} />
    case 'tv-electro': return <Tv size={size} />
    case 'mode': return <Shirt size={size} />
    case 'maison': return <Home size={size} />
    case 'auto-moto': return <Car size={size} />
    case 'jeux': return <Gamepad2 size={size} />
    case 'sport': return <Dumbbell size={size} />
    case 'fournitures': return <BookOpen size={size} />
    case 'immo': return <Building2 size={size} />
    case 'annonces': return <Tag size={size} />
    case 'telecom': return <Radio size={size} />
    case 'beaute':
    case 'parfum': return <Sparkles size={size} />
    default: return <ShoppingBag size={size} />
  }
}

const CATEGORIES = LIB_CATEGORIES.map(c => ({
  slug: c.value,
  label: c.label.replace(/^.*? /, ''), // Clean text
}))
CATEGORIES.push({ slug: 'telecom', label: 'Télécom & Forfaits' })

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
  { val: '',          label: 'Pertinence' },
  { val: 'prix_asc',  label: 'Prix ↑' },
  { val: 'prix_desc', label: 'Prix ↓' },
  { val: 'populaire', label: 'Populaires' },
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
  const prixTafTaf = Number(settings.plan_decouverte_prix || settings.plan_taftaf_prix) || 2500;

  // Catégories avec produits réels pour la section "Comparer par catégorie"
  const DEFAULT_ACTIVE_CATEGORIES = [
    'smartphones', 'tv-electro', 'mode', 'informatique', 'maison',
    'beaute', 'alimentation', 'jeux', 'auto-moto', 'sport'
  ];
  const categoriesAffichees = CATEGORIES.filter(c => {
    if (c.slug === 'telecom' || c.slug === 'immo' || c.slug === 'annonces') return false;
    if (categoriesActives && categoriesActives.length > 0) {
      return categoriesActives.includes(c.slug);
    }
    return DEFAULT_ACTIVE_CATEGORIES.includes(c.slug);
  });

  return (
    <HomeDualTrackContainer
      prixTafTaf={prixTafTaf}
      searchBarSlot={<SearchBar defaultValue={q} />}
      categoriesSlot={
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
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3.5px 9px', borderRadius: 14, fontSize: 11, fontWeight: 600, textDecoration: 'none',
                  background: '#fff', color: 'var(--text-strong, #2A231E)', border: '1px solid var(--border-light, #DDD5CB)', boxShadow: '0 1px 2px rgba(26,22,18,0.03)',
                  whiteSpace: 'nowrap', flexShrink: 0
                }}>
                  <Building2 size={12} color="var(--price, #0A5C36)" /> <span>Immobilier</span>
                </Link>
              )
            }

            if (c.slug === 'annonces') {
              return (
                <Link key={c.slug} href="/annonces" prefetch={false} aria-label="Petites Annonces" className="categ-pill" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3.5px 9px', borderRadius: 14, fontSize: 11, fontWeight: 600, textDecoration: 'none',
                  background: '#fff', color: 'var(--text-strong, #2A231E)', border: '1px solid var(--border-light, #DDD5CB)', boxShadow: '0 1px 2px rgba(26,22,18,0.03)',
                  whiteSpace: 'nowrap', flexShrink: 0
                }}>
                  <Tag size={12} color="var(--accent, #C75B00)" /> <span>Annonces</span>
                </Link>
              )
            }

            if (c.slug === 'telecom') {
              return (
                <Link key={c.slug} href="/telecom" prefetch={false} aria-label="Télécom & Forfaits" className={`categ-pill${isSelected ? ' active' : ''}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3.5px 9px', borderRadius: 14, fontSize: 11, fontWeight: 600, textDecoration: 'none',
                  background: '#fff', color: 'var(--text-strong, #2A231E)', border: '1px solid var(--border-light, #DDD5CB)', boxShadow: '0 1px 2px rgba(26,22,18,0.03)',
                  whiteSpace: 'nowrap', flexShrink: 0
                }}>
                  <Radio size={12} color="var(--accent, #C75B00)" /> <span>{c.label}</span>
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
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3.5px 9px', borderRadius: 14, fontSize: 11,
                  fontWeight: isSelected ? 800 : 600, textDecoration: 'none',
                  background: isSelected ? 'var(--accent, #C75B00)' : '#fff',
                  color: isSelected ? '#fff' : 'var(--text-strong, #2A231E)',
                  border: isSelected ? '1px solid var(--accent, #C75B00)' : '1px solid var(--border-light, #DDD5CB)',
                  boxShadow: isSelected ? '0 2px 5px rgba(199,91,0,0.2)' : '0 1px 2px rgba(26,22,18,0.03)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap', flexShrink: 0
                }}
              >
                {getCategoryIcon(c.slug, 12)} <span>{c.label}</span>
              </Link>
            )
          })}
          <Link
            href="/boutiques"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3.5px 9px', borderRadius: 14, fontSize: 11,
              fontWeight: 700, textDecoration: 'none', background: 'var(--bg, #F8F5F0)', color: 'var(--accent, #C75B00)',
              border: '1px solid var(--border, #E8DDD2)', whiteSpace: 'nowrap', flexShrink: 0
            }}
          >
            <Store size={12} color="var(--accent, #C75B00)" /> <span>Boutiques →</span>
          </Link>
        </div>
      }
      buyerContentSlot={
        <>
          {/* BANDEAU FEEDBACK RECHERCHE & CONFIRMATION DES RÉSULTATS */}
          {hasFiltre && (
            <div style={{
              background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16,
              padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap', boxShadow: '0 4px 12px rgba(199,91,0,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Search size={20} color="var(--accent, #C75B00)" />
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
                <X size={14} />
              </Link>
            </div>
          )}

          {/* FACETTES DYNAMIQUES PAR CATÉGORIE (TECH / MODE / IMMO) */}
          {categorie && <FacettesDynamiques categorie={categorie} />}

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
                  <X size={12} strokeWidth={2.5} />
                  <span>Réinitialiser</span>
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

                <span className="hidden-mobile" style={{ fontSize: 12, fontWeight: 800, color: '#9a3412', whiteSpace: 'nowrap', marginLeft: 2 }}>Tendances :</span>
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

          {/* PRODUITS RÉCEMMENT CONSULTÉS */}
          <RecentlyViewed />

          {/* VITRINE IMMOBILIÈRE SIGNATURE & AGENCES PRO */}
          <HomeImmoShowcase />

          {/* DÉMONSTRATION VISUELLE DES WORKFLOWS RÉELS (POS, DETTE WAVE, BAUX & QUITTANCES) */}
          <WorkflowsShowcaseSection />

          {/* ── Bloc SEO (MODERNISÉ, SANS BOÎTE) ─────────────────────────────────────────────── */}
          {!hasFiltre && (
            <section style={{ maxWidth: 'var(--max-w-narrow, 1280px)', margin: '0 auto 32px', padding: '0 20px' }}>
              
              {/* En-tête de section épuré */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <span style={{ display: 'inline-block', background: '#fff7ed', color: '#9a3412', padding: '6px 16px', borderRadius: 30, fontSize: 12, fontWeight: 800, marginBottom: 12, border: '1px solid #fed7aa' }}>
                  6800+ produits · mis à jour toutes les 6h
                </span>
                <h2 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 32, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: 0, lineHeight: 1.2 }}>
                  L&apos;écosystème de commerce digital N°1 au <span style={{ color: 'var(--accent, #C75B00)' }}>Sénégal</span>
                </h2>
              </div>

              {/* Grille de texte moderne */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, marginBottom: 48 }}>
                <div style={{ background: '#ffffff', padding: 24, borderRadius: 16, border: '1px solid var(--border-light, #DDD5CB)', boxShadow: '0 4px 20px rgba(26,22,18,0.03)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(28,43,74,0.08)', color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <ShoppingBag size={22} />
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-body, #4A3F36)', fontSize: 14, lineHeight: 1.7 }}>
                    <strong>Nopalou</strong> réunit acheteurs et commerçants sur une plateforme unique au Sénégal. Pour les <strong>acheteurs</strong>, Nopalou compare en temps réel les prix de milliers de produits chez tous les grands marchands et boutiques locales à Dakar, Thiès, Saint-Louis et dans tout le pays. Trouvez le <strong>meilleur prix vérifié</strong> et commandez en direct en toute confiance.
                  </p>
                </div>
                
                <div style={{ background: '#ffffff', padding: 24, borderRadius: 16, border: '1px solid var(--border-light, #DDD5CB)', boxShadow: '0 4px 20px rgba(26,22,18,0.03)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(199,91,0,0.1)', color: 'var(--accent, #C75B00)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Store size={22} />
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-body, #4A3F36)', fontSize: 14, lineHeight: 1.7 }}>
                    Pour les <strong>commerçants</strong>, Nopalou offre une suite complète pour réussir : création de boutique en ligne en 2 minutes, <strong>caisse tactile POS 100% hors-ligne</strong> pour votre magasin, synchronisation de stocks, carnet de crédits/dettes avec relances Wave, et visibilité automatique de vos produits sur le comparateur de prix le plus consulté du Sénégal.
                  </p>
                </div>
              </div>

              <p className="chip-row-label">Comparer par catégorie</p>
                <div className="chip-row">
                  {categoriesAffichees.map(c => (
                    <Link key={c.slug} href={`/categorie/${c.slug}`} aria-label={`Catalogue complet de la catégorie ${c.label}`} className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {getCategoryIcon(c.slug, 13)}
                      <span>{c.label}</span>
                    </Link>
                  ))}
                </div>

                <p className="chip-row-label">Solutions Vendeurs, Business &amp; Commerce au Sénégal</p>
                <div className="chip-row" style={{ marginBottom: 24 }}>
                  {[
                    { href: '/creer-boutique', label: 'Créer sa boutique en ligne (1m offert)', icon: Store },
                    { href: '/guide-sourcing-revente', label: 'Sourcing Alibaba, AliExpress & Shein', icon: ShoppingBag },
                    { href: '/compte/apporteur', label: 'Programme Apporteur (20% récurrent à vie)', icon: Sparkles },
                    { href: '/tarifs-boutique', label: 'Tarifs & Forfaits Vendeurs Sénégal', icon: Tag },
                    { href: '/marchands', label: 'Plateforme Marchands & POS Caisse', icon: Building2 },
                  ].map(l => {
                    const IconComp = l.icon
                    return (
                      <Link key={l.href} href={l.href} className="chip chip-small" style={{ background: '#fff7ed', border: '1px solid #fed7aa', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <IconComp size={13} color="var(--accent, #C75B00)" />
                        <span>{l.label}</span>
                      </Link>
                    )
                  })}
                </div>

                {/* ── BANDEAU RÉSEAUX SOCIAUX OFFICIELS NOPALOU ──────────────────── */}
                <div style={{ marginTop: 40, padding: '24px 20px', background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #0d1728 100%)', borderRadius: 16, color: '#ffffff', textAlign: 'center', boxShadow: '0 8px 24px rgba(28,43,74,0.15)' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#fed7aa', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(199,91,0,0.2)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(199,91,0,0.3)' }}>
                    Communauté &amp; Bons Plans
                  </span>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', margin: '10px 0 6px' }}>
                    Rejoignez Nopalou sur vos Réseaux Préférés
                  </h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 auto 20px', maxWidth: 540, lineHeight: 1.5 }}>
                    Suivez nos vidéos TikTok, recevez les baisses de prix en direct sur notre Canal WhatsApp et profitez des ventes flash exclusives à Dakar.
                  </p>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a
                      href="https://www.tiktok.com/@nopalou.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s ease' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.85V7.6a6.34 6.34 0 0 0-5.1 6.2 6.34 6.34 0 1 0 10.9-4.38v-3.7a8.16 8.16 0 0 0 4.31 1.25v-3.28a4.85 4.85 0 0 1-.03-.01z"/></svg>
                      <span>TikTok (@nopalou.com)</span>
                    </a>
                    <a
                      href="https://whatsapp.com/channel/0029Vb8fc4bBadmW40AFKx33"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'rgba(37, 211, 102, 0.15)', color: '#86efac', border: '1px solid rgba(37, 211, 102, 0.35)', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s ease' }}
                    >
                      <MessageCircle size={15} color="#86efac" />
                      <span>Canal WhatsApp</span>
                    </a>
                    <a
                      href="https://www.facebook.com/profile.php?id=61591675701726"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s ease' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      <span>Facebook</span>
                    </a>
                    <a
                      href="https://www.instagram.com/nopalousn/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s ease' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      <span>Instagram</span>
                    </a>
                    <a
                      href="https://twitter.com/nopalou_sn"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s ease' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      <span>Twitter / X</span>
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
      }
    />
  )
}
