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
  try {
    const [stg, catAct] = await Promise.all([
      apiFetch<Record<string, string>>('/settings/public').catch(() => ({})),
      apiFetch<string[]>('/produits/categories-actives').catch(() => null),
    ])
    if (stg) settings = stg
    if (catAct) categoriesActives = catAct
  } catch {
    // valeurs par défaut ci-dessous
  }
  const prixPro = Number(settings.plan_pro_prix) || 5000;
  const prixBusiness = Number(settings.plan_business_prix) || 10000;
  const prixTafTaf = Number(settings.plan_decouverte_prix || settings.plan_taftaf_prix) || 2500;

  return (
    <>
      {/* ── HERO HOME ÉPURÉ & MODERNE (NOPALOU BRAND SYSTEM) ────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fffdfa 50%, #fff7ed 100%)',
        borderBottom: '1px solid #fed7aa',
        padding: '24px 20px 16px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Layout en 3 colonnes pour utiliser l'espace Desktop (Gauche, Centre, Droite) */}
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, position: 'relative', zIndex: 2 }}>
          
          {/* COLONNE GAUCHE (Desktop seulement : Carrousel dynamique WhatsApp & Parrainage) */}
          <div className="hero-side-card" style={{ flex: '1 1 250px', maxWidth: 300, display: 'flex' }}>
            <HeroWhatsAppCarousel />
          </div>

          {/* COLONNE CENTRALE */}
          <div style={{ flex: '1 1 auto', width: '100%', maxWidth: 900, minWidth: 0 }}>
          
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#fff7ed', color: '#c75b00', padding: '4px 14px', borderRadius: 30,
            fontSize: 11, fontWeight: 800, marginBottom: 8, border: '1px solid #ffedd5',
          }}>
            <span>✨ Comparateur N°1 de prix & vendeurs au Sénégal</span>
          </div>

          <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: '#0f172a', margin: '0 0 10px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Comparez les prix & trouvez les meilleurs vendeurs au <span style={{ color: '#C75B00' }}>Sénégal</span>
          </h1>

          <p style={{ fontSize: 15, color: '#475569', margin: '0 auto 16px', maxWidth: 640, lineHeight: 1.5 }}>
            Accédez instantanément à des milliers de produits, téléphones, électroménager et boutiques vérifiées à Dakar et dans toutes les régions.
          </p>

          {/* BARRE DE RECHERCHE PRINCIPALE */}
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <SearchBar defaultValue={q} />
          </div>

          {/* CATÉGORIES EN PILULES FLUIDES (Défilement horizontal sur mobile) */}
          <div className="hero-categories-scroll" style={{ maxWidth: 840, margin: '14px auto 0', position: 'relative', zIndex: 2 }}>
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
                  <Link key={c.slug} href="/immo" className="categ-pill" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    background: '#fff', color: '#334155', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    whiteSpace: 'nowrap', flexShrink: 0
                  }}>
                    <span>🏢</span> <span>Immobilier & Terrains</span>
                  </Link>
                )
              }

              if (c.slug === 'annonces') {
                return (
                  <Link key={c.slug} href="/annonces" className="categ-pill" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    background: '#fff', color: '#334155', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    whiteSpace: 'nowrap', flexShrink: 0
                  }}>
                    <span>📢</span> <span>Petites Annonces</span>
                  </Link>
                )
              }

              if (c.slug === 'telecom') {
                return (
                  <Link key={c.slug} href="/telecom" className={`categ-pill${isSelected ? ' active' : ''}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    background: '#fff', color: '#334155', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
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
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, fontSize: 13,
                    fontWeight: isSelected ? 800 : 600, textDecoration: 'none',
                    background: isSelected ? '#C75B00' : '#fff',
                    color: isSelected ? '#fff' : '#334155',
                    border: isSelected ? '1px solid #C75B00' : '1px solid #e2e8f0',
                    boxShadow: isSelected ? '0 4px 12px rgba(199,91,0,0.22)' : '0 2px 4px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap', flexShrink: 0
                  }}
                >
                  <span>{c.emoji}</span> <span>{c.label}</span>
                </Link>
              )
            })}
          </div>

          </div>

          {/* COLONNE DROITE (Desktop seulement : Boutique Taf Taf compacte) */}
          <div className="hero-side-card" style={{ flex: '1 1 250px', maxWidth: 290, textAlign: 'left', background: '#0f172a', padding: '14px 16px', borderRadius: 16, color: '#f8fafc', border: '1px solid #1e293b', boxShadow: '0 4px 16px rgba(15,23,42,0.12)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ display: 'inline-block', background: 'rgba(199,91,0,0.2)', color: '#fed7aa', padding: '2px 8px', borderRadius: 10, fontSize: 9.5, fontWeight: 800, border: '1px solid rgba(199,91,0,0.3)' }}>🚀 NOUVEAU</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#fed7aa' }}>{prixTafTaf} F/mois</span>
            </div>
            <h3 style={{ fontSize: 13.5, fontWeight: 900, marginBottom: 3, color: '#fff', lineHeight: 1.25 }}>Boutique Taf Taf</h3>
            <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '0 0 8px', lineHeight: 1.35 }}>Créez votre boutique complète en 30s chrono !</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <li style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
                <span style={{ color: '#C75B00', fontWeight: 900 }}>✓</span> Lien personnalisé (nopalou.com/shop)
              </li>
              <li style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
                <span style={{ color: '#C75B00', fontWeight: 900 }}>✓</span> Gestionnaire de commandes Web
              </li>
            </ul>

            <Link href="/creer-boutique" style={{ display: 'block', textAlign: 'center', background: '#C75B00', color: '#fff', fontWeight: 800, fontSize: 12, padding: '7px 12px', borderRadius: 8, textDecoration: 'none', marginTop: 10, boxShadow: '0 2px 8px rgba(199,91,0,0.2)', transition: 'background 0.2s' }}>Créer ma vitrine →</Link>
          </div>

        </div>
      </section>

      {/* ── CONTENU PRINCIPAL & RÉSULTATS DIRECTS ──────────────────── */}
      <main id="resultats" className="page-container" style={{ maxWidth: 1440, paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
        
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
          
          {/* LIGNE 1 STRICTE : Budget + État (Gauche) | Bouton Boutique (Droite) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', flexWrap: 'nowrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap', marginRight: 2 }}>Budget :</span>
              {BUDGETS.map((b) => {
                const isActive = (b.prixMin === prixMin && b.prixMax === prixMax) || (b.label === 'Tout' && !prixMin && !prixMax);
                return (
                  <Link
                    key={b.label}
                    href={buildFilterUrl({ prixMin: b.prixMin, prixMax: b.prixMax })}
                    className={`budget-pill${isActive ? ' active' : ''}`}
                    style={{ padding: '3px 9px', fontSize: 11.5, borderRadius: 14, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {b.label}
                  </Link>
                )
              })}

              <div style={{ width: 1, height: 16, background: '#cbd5e1', margin: '0 4px', flexShrink: 0 }} className="hidden-mobile" />

              <span className="hidden-mobile" style={{ fontSize: 12, fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap', marginLeft: 2 }}>État :</span>
              {ETATS.map((e) => {
                const isActive = etat === e.val;
                return (
                  <Link
                    key={e.label}
                    href={buildFilterUrl({ etat: e.val })}
                    className={`budget-pill hidden-mobile${isActive ? ' active' : ''}`}
                    style={{ padding: '3px 9px', fontSize: 11.5, borderRadius: 14, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {e.label}
                  </Link>
                )
              })}
            </div>

            <Link
              href="/creer-boutique"
              className="hidden-mobile"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f172a', color: '#fff',
                padding: '5px 12px', borderRadius: 18, fontSize: 11.5, fontWeight: 800, textDecoration: 'none',
                whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 2px 6px rgba(15,23,42,0.12)'
              }}
            >
              <span style={{ color: '#C75B00', fontSize: 12 }}>⚡</span>
              Ouvrir une Boutique Pro
            </Link>
          </div>

          {/* LIGNE 2 STRICTE : Trier + Tendances (Gauche) | Effacer (Droite) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', flexWrap: 'nowrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap', marginRight: 2 }}>Trier :</span>
              {TRIS.map((t) => {
                const isActive = tri === t.val;
                return (
                  <Link
                    key={t.val || 'defaut'}
                    href={buildFilterUrl({ tri: t.val })}
                    className={`budget-pill${isActive ? ' active' : ''}`}
                    style={{ padding: '3px 9px', fontSize: 11.5, borderRadius: 14, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {t.label}
                  </Link>
                )
              })}

              <div style={{ width: 1, height: 16, background: '#cbd5e1', margin: '0 4px', flexShrink: 0 }} className="hidden-mobile" />

              <span className="hidden-mobile" style={{ fontSize: 12, fontWeight: 800, color: '#C75B00', whiteSpace: 'nowrap', marginLeft: 2 }}>🔥 Tendances :</span>
              <Link href={buildFilterUrl({ q: 'iphone' })} className="budget-pill hidden-mobile" style={{ padding: '3px 9px', fontSize: 11.5, borderRadius: 14, whiteSpace: 'nowrap', flexShrink: 0 }}>iPhone 15</Link>
              <Link href={buildFilterUrl({ q: 'climatiseur' })} className="budget-pill hidden-mobile" style={{ padding: '3px 9px', fontSize: 11.5, borderRadius: 14, whiteSpace: 'nowrap', flexShrink: 0 }}>Climatiseurs</Link>
              <Link href={buildFilterUrl({ q: 'samsung' })} className="budget-pill hidden-mobile" style={{ padding: '3px 9px', fontSize: 11.5, borderRadius: 14, whiteSpace: 'nowrap', flexShrink: 0 }}>Samsung S24</Link>
            </div>

            {hasFiltre ? (
              <Link
                href="/#resultats"
                className="budget-pill hidden-mobile"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ef4444', borderColor: '#fee2e2',
                  background: '#fef2f2', fontWeight: 700, padding: '3px 9px', fontSize: 11.5, borderRadius: 14,
                  whiteSpace: 'nowrap', flexShrink: 0
                }}
              >
                <span>✖</span> Effacer
              </Link>
            ) : null}
          </div>

          {/* BARRE ACTION MOBILE ONLY */}
          <div className="visible-mobile-flex" style={{ display: 'none', gap: 8, width: '100%', paddingTop: 2 }}>
            {hasFiltre ? (
              <Link href="/#resultats" className="budget-pill" style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2', margin: 0, padding: '5px 10px', fontSize: 11.5 }}>
                <span>✖</span> Effacer
              </Link>
            ) : null}
            <Link href="/creer-boutique" style={{ flex: 2, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6, background: '#0f172a', color: '#fff', padding: '5px 12px', borderRadius: 18, fontSize: 11.5, fontWeight: 800, textDecoration: 'none', boxShadow: '0 2px 6px rgba(15,23,42,0.12)' }}>
              <span style={{ fontSize: 12 }}>🏪</span> Boutique Pro
            </Link>
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
        <section style={{ maxWidth: 1280, margin: '0 auto 32px', padding: '0 20px' }}>
          
          {/* En-tête de section épuré */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{ display: 'inline-block', background: '#fff7ed', color: '#C75B00', padding: '6px 16px', borderRadius: 30, fontSize: 12, fontWeight: 800, marginBottom: 12, border: '1px solid #fed7aa' }}>
              6800+ produits · mis à jour toutes les 6h
            </span>
            <h2 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              Le comparateur de prix N°1 au <span style={{ color: '#C75B00' }}>Sénégal</span>
            </h2>
          </div>

          {/* Grille de texte moderne */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, marginBottom: 48 }}>
            <div style={{ background: '#ffffff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15,23,42,0.03)' }}>
              <span style={{ fontSize: 32, marginBottom: 16, display: 'block' }}>📊</span>
              <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.7 }}>
                <strong>Nopalou</strong> est le premier comparateur de prix dédié au marché sénégalais. Vous cherchez le <strong>prix le moins cher</strong> pour un téléphone, une télévision, un réfrigérateur ou un ordinateur ? Nopalou compare en temps réel les prix de milliers de produits chez tous les grands marchands en ligne au Sénégal.
              </p>
            </div>
            
            <div style={{ background: '#ffffff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15,23,42,0.03)' }}>
              <span style={{ fontSize: 32, marginBottom: 16, display: 'block' }}>📍</span>
              <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.7 }}>
                Que vous soyez à <strong>Dakar</strong>, Thiès, Saint-Louis, Ziguinchor ou Kaolack — trouvez le meilleur prix avant d&apos;acheter. Nos prix sont mis à jour automatiquement toutes les 6 heures depuis Jumia, Expat-Dakar, CoinAfrique et d&apos;autres. <strong>Gratuit, sans inscription, sans pub.</strong>
              </p>
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

            <p className="chip-row-label">Solutions Vendeurs, Business &amp; Commerce au Sénégal</p>
            <div className="chip-row" style={{ marginBottom: 24 }}>
              {[
                { href: '/creer-boutique', label: 'Créer sa boutique en ligne (1m offert)', emoji: '🚀' },
                { href: '/compte/apporteur', label: 'Programme Apporteur (20% récurrent à vie)', emoji: '💼' },
                { href: '/guide-utilisation', label: 'Guide d\'utilisation complet (Site & Boutique)', emoji: '📖' },
                { href: '/tarifs-boutique', label: 'Tarifs & Forfaits Vendeurs Sénégal', emoji: '🏷️' },
                { href: '/guide-creer-boutique', label: 'Alternative Shopify & Sourcing Alibaba', emoji: '📦' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="chip chip-small" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <span className="chip-em">{l.emoji}</span>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* ── BANDEAU RÉSEAUX SOCIAUX OFFICIELS NOPALOU ──────────────────── */}
            <div style={{ marginTop: 40, padding: '24px 20px', background: 'linear-gradient(135deg, #1C2B4A 0%, #0f172a 100%)', borderRadius: 16, color: '#ffffff', textAlign: 'center', boxShadow: '0 8px 24px rgba(15,27,74,0.15)' }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#fed7aa', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(199,91,0,0.2)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(199,91,0,0.3)' }}>
                📢 Communauté &amp; Bons Plans
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', margin: '10px 0 6px' }}>
                Rejoignez Nopalou sur vos Réseaux Préférés
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 auto 20px', maxWidth: 540, lineHeight: 1.5 }}>
                Suivez nos vidéos TikTok, recevez les baisses de prix en direct sur notre Canal WhatsApp et profitez des ventes flash exclusives à Dakar.
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href="https://www.tiktok.com/@nopalou.com?_r=1&_t=ZS-98f75NgDJNS"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#000000', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 24, fontSize: 13, fontWeight: 800, textDecoration: 'none', transition: 'transform 0.15s' }}
                >
                  <span>🎵</span> <span>TikTok (@nopalou.com)</span>
                </a>
                <a
                  href="https://whatsapp.com/channel/0029Vb8fc4bBadmW40AFKx33"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#25D366', color: '#ffffff', border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 800, textDecoration: 'none', transition: 'transform 0.15s' }}
                >
                  <span>📢</span> <span>Canal WhatsApp</span>
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61591675701726"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#1877F2', color: '#ffffff', border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}
                >
                  <span>📘</span> <span>Facebook</span>
                </a>
                <a
                  href="https://www.instagram.com/nopalousn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: '#ffffff', border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}
                >
                  <span>📸</span> <span>Instagram</span>
                </a>
                <a
                  href="https://twitter.com/nopalou_sn"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 24, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}
                >
                  <span>𝕏</span> <span>Twitter</span>
                </a>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 30, padding: 16, background: '#f8fafc', borderRadius: 12, color: '#64748b', fontSize: 13, border: '1px solid #e2e8f0' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, background: '#10b981', borderRadius: '50%', marginRight: 8 }} />
              Prix vérifiés automatiquement toutes les 6 heures sur tous les grands marchands sénégalais
            </div>
        </section>
      )}
    </>
  )
}
