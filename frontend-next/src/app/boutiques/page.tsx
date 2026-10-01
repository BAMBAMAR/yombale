import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import BoutiquesSearch from './BoutiquesSearch'
import HeroCarousel from './HeroCarousel'
import BoutiqueCard, { BoutiqueItem } from './components/BoutiqueCard'
import DiscoverTrendingProducts, { TrendingProduct } from './components/DiscoverTrendingProducts'
import BoutiquesFilterBar from './components/BoutiquesFilterBar'
import BoutiquesDirectoryList from './components/BoutiquesDirectoryList'
import {
  Store, ShieldCheck, Sparkles, CheckCircle2,
  Smartphone, Laptop, Tv, Shirt, Home, Car,
  Gamepad2, Utensils, Watch, Hammer, Wrench, Layers,
  Clock, Camera, Award, Tag, Star, DollarSign, MessageCircle,
  ArrowDown, Truck
} from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Boutiques Partenaires & Vendeurs au Sénégal — Nopalou',
  description: `Découvrez les meilleures boutiques et vendeurs professionnels au Sénégal : smartphones, mode, électroménager, univers maison, contact direct et livraison.`,
  alternates: { canonical: `${BASE}/boutiques` },
}

function getCategoryIcon(slug: string) {
  switch (slug) {
    case 'smartphones': return <Smartphone size={14} />
    case 'informatique': return <Laptop size={14} />
    case 'tv-electro': return <Tv size={14} />
    case 'mode': return <Shirt size={14} />
    case 'maison': return <Home size={14} />
    case 'auto-moto': return <Car size={14} />
    case 'jeux': return <Gamepad2 size={14} />
    case 'alimentation': return <Utensils size={14} />
    case 'beaute': return <Sparkles size={14} />
    case 'bijouterie': return <Watch size={14} />
    case 'quincaillerie': return <Hammer size={14} />
    case 'services': return <Wrench size={14} />
    case 'mixte': return <Layers size={14} />
    default: return <Store size={14} />
  }
}

const CATEGORIES_BOUTIQUE = [
  { slug: '', label: 'Toutes les boutiques' },
  { slug: 'smartphones', label: 'Smartphones & Tech' },
  { slug: 'informatique', label: 'Informatique & PC' },
  { slug: 'tv-electro', label: 'TV & Électro' },
  { slug: 'mode', label: 'Mode & Beauté' },
  { slug: 'maison', label: 'Maison & Déco' },
  { slug: 'auto-moto', label: 'Auto-Moto' },
  { slug: 'jeux', label: 'Jeux & Consoles' },
  { slug: 'alimentation', label: 'Alimentation' },
  { slug: 'beaute', label: 'Beauté & Soins' },
  { slug: 'bijouterie', label: 'Bijouterie & Horlogerie' },
  { slug: 'quincaillerie', label: 'Quincaillerie & BTP' },
  { slug: 'services', label: 'Services & Pro' },
  { slug: 'mixte', label: 'Généraliste' },
]

const VILLES = ['Dakar', 'Thiès', 'Saint-Louis', 'Mbour', 'Kaolack', 'Ziguinchor']

const BUDGETS = [
  { val: '', label: 'Tous les prix' },
  { val: 'moins_5k', label: '< 5 000 F' },
  { val: '5k_15k', label: '5 000 - 15 000 F' },
  { val: '15k_50k', label: '15 000 - 50 000 F' },
  { val: 'plus_50k', label: '> 50 000 F' },
]

function estOuvertActuellement(horaires?: Record<string, string> | null): boolean {
  if (!horaires || Object.keys(horaires).length === 0) return true
  const joursKeys = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const now = new Date()
  const jourActuel = joursKeys[now.getDay()]
  const plage = horaires[jourActuel]
  if (!plage || plage.toLowerCase().includes('fermé')) return false
  const match = plage.match(/(\d{1,2})[:h](\d{2})?\s*-\s*(\d{1,2})[:h](\d{2})?/)
  if (match) {
    const startHour = parseInt(match[1], 10)
    const endHour = parseInt(match[3], 10)
    const currentHour = now.getHours()
    return currentHour >= startHour && currentHour < endHour
  }
  return true
}

export default async function BoutiquesPage({
  searchParams,
}: {
  searchParams: Promise<{
    ville?: string
    q?: string
    cat?: string
    page?: string
    tri?: string
    plan?: string
    avec_prods?: string
    ouvert?: string
    vedette?: string
    budget?: string
    promo?: string
    note_min?: string
    whatsapp?: string
    certifie?: string
    prix_min?: string
    prix_max?: string
  }> | {
    ville?: string
    q?: string
    cat?: string
    page?: string
    tri?: string
    plan?: string
    avec_prods?: string
    ouvert?: string
    vedette?: string
    budget?: string
    promo?: string
    note_min?: string
    whatsapp?: string
    certifie?: string
    prix_min?: string
    prix_max?: string
  }
}) {
  const sp = await Promise.resolve(searchParams)
  const ville = sp?.ville ?? ''
  const q = sp?.q ?? ''
  const cat = sp?.cat ?? ''
  const page = sp?.page ?? '1'
  const tri = sp?.tri ?? ''
  const plan = sp?.plan ?? ''
  const avecProds = sp?.avec_prods ?? ''
  const ouvert = sp?.ouvert ?? ''
  const vedette = sp?.vedette ?? ''
  const budget = sp?.budget ?? ''
  const promo = sp?.promo ?? ''
  const noteMin = sp?.note_min ?? ''
  const whatsapp = sp?.whatsapp ?? ''
  const certifie = sp?.certifie ?? ''
  const prixMin = sp?.prix_min ?? ''
  const prixMax = sp?.prix_max ?? ''

  const qs = new URLSearchParams({ limit: '24', page })
  if (ville) qs.set('ville', ville)
  if (q) qs.set('q', q)
  if (cat) qs.set('categorie', cat)
  if (tri) qs.set('tri', tri)
  if (avecProds) qs.set('avec_prods', '1')
  if (vedette) qs.set('vedette', '1')
  if (budget) qs.set('budget', budget)
  if (promo) qs.set('promo', '1')
  if (noteMin) qs.set('note_min', noteMin)
  if (whatsapp) qs.set('whatsapp', '1')
  if (certifie) qs.set('certifie', '1')
  if (prixMin) qs.set('prix_min', prixMin)
  if (prixMax) qs.set('prix_max', prixMax)

  let boutiques: BoutiqueItem[] = []
  let total = 0
  let villesDisponibles: string[] = []
  let topProduits: TrendingProduct[] = []

  try {
    const [dataBoutiques, dataTop] = await Promise.all([
      apiFetch<{ boutiques: BoutiqueItem[]; total: number; villes?: string[]; categories?: string[] }>(`/boutiques?${qs}`),
      apiFetch<{ success: boolean; produits: TrendingProduct[] }>(`/boutiques/top-produits?limit=12${cat ? `&categorie=${encodeURIComponent(cat)}` : ''}`).catch(() => ({ success: false, produits: [] }))
    ])
    boutiques = dataBoutiques?.boutiques ?? []
    total = dataBoutiques?.total ?? 0
    villesDisponibles = dataBoutiques?.villes ?? []
    topProduits = dataTop?.produits ?? []
  } catch (err) {
    console.warn('[Nopalou:boutiques:page]', err)
  }

  const villesAffichage = villesDisponibles.length > 0 ? villesDisponibles : VILLES
  const categoriesAffichage = CATEGORIES_BOUTIQUE

  // Filtres côté client / SSR pour plans & ouverture
  let boutiquesFiltrees = boutiques
  if (plan === 'business') {
    boutiquesFiltrees = boutiquesFiltrees.filter(b => b.plan_actif === 'business')
  } else if (plan === 'pro') {
    boutiquesFiltrees = boutiquesFiltrees.filter(b => b.plan_actif === 'pro')
  }
  if (ouvert === '1') {
    boutiquesFiltrees = boutiquesFiltrees.filter(b => estOuvertActuellement(b.horaires))
  }

  const totalPages = Math.ceil(total / 24)
  const currentPage = Number(page)
  const estEnModeRecherche = Boolean(q.trim())

  function buildLink(params: Record<string, string>) {
    const p = new URLSearchParams()
    if (ville) p.set('ville', ville)
    if (q) p.set('q', q)
    if (cat) p.set('cat', cat)
    if (tri) p.set('tri', tri)
    if (plan) p.set('plan', plan)
    if (avecProds) p.set('avec_prods', avecProds)
    if (ouvert) p.set('ouvert', ouvert)
    if (vedette) p.set('vedette', vedette)
    if (budget) p.set('budget', budget)
    if (promo) p.set('promo', promo)
    if (noteMin) p.set('note_min', noteMin)
    if (whatsapp) p.set('whatsapp', whatsapp)
    if (certifie) p.set('certifie', certifie)
    if (prixMin) p.set('prix_min', prixMin)
    if (prixMax) p.set('prix_max', prixMax)

    Object.entries(params).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
    const s = p.toString()
    return `/boutiques${s ? `?${s}` : ''}`
  }

  const aDesFiltresActifs = Boolean(estEnModeRecherche || avecProds || ouvert || vedette || budget || promo || noteMin || plan || ville || whatsapp || certifie || (tri && tri !== 'recommande'))

  return (
    <div className="page-container" style={{ maxWidth: 1440, paddingTop: '1.5rem', paddingBottom: '4rem' }}>
      
      {/* ── HERO BANNER BENTO (COMPACT, MONOLIGNE & SANS ÉTIREMENT) ── */}
      <div 
        className="hero-banner-container"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fffdfa 50%, #fff7ed 100%)',
          borderRadius: 20,
          padding: '18px 22px',
          color: '#0f172a',
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #fed7aa',
          boxShadow: '0 4px 18px rgba(199, 91, 0, 0.04)',
        }}
      >
        <div style={{
          position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(199,91,0,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <style>{`
          .hero-banner-container {
            width: 100%;
            box-sizing: border-box;
          }
          .hero-bento-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 350px;
            gap: 24px;
            align-items: center;
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }
          .hero-left-column {
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }
          .hero-trust-bento {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 2px;
          }
          .hero-trust-item {
            background: rgba(255, 255, 255, 0.88);
            border: 1px solid rgba(226, 232, 240, 0.95);
            border-radius: 12px;
            padding: 9px 11px;
            display: flex;
            flex-direction: column;
            gap: 3px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
            transition: all 0.22s ease;
          }
          .hero-trust-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 14px rgba(199, 91, 0, 0.08);
            border-color: #fdba74;
          }
          .hero-actions-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 2px;
            flex-wrap: wrap;
            width: 100%;
            box-sizing: border-box;
          }
          .hero-btn-explore {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #1C2B4A;
            color: #ffffff !important;
            font-size: 12px;
            font-weight: 800;
            padding: 8px 15px;
            border-radius: 20px;
            text-decoration: none;
            transition: all 0.2s ease;
            box-shadow: 0 2px 6px rgba(28, 43, 74, 0.16);
          }
          .hero-btn-explore:hover {
            background: #283d66;
            transform: translateY(-1px);
          }
          .hero-btn-create {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #ffffff;
            color: #C75B00 !important;
            border: 1.5px solid #fed7aa;
            font-size: 12px;
            font-weight: 800;
            padding: 7px 14px;
            border-radius: 20px;
            text-decoration: none;
            transition: all 0.2s ease;
          }
          .hero-btn-create:hover {
            background: #fff7ed;
            border-color: #C75B00;
            transform: translateY(-1px);
          }
          @media (max-width: 1023px) {
            .hero-bento-grid {
              display: flex;
              flex-direction: column;
              gap: 14px;
            }
          }
          @media (max-width: 768px) {
            .hero-banner-container {
              border-radius: 14px !important;
              padding: 12px 14px !important;
              margin-bottom: 14px !important;
            }
            .hero-bento-grid {
              display: flex !important;
              flex-direction: column !important;
              gap: 8px !important;
            }
            .hero-left-column {
              gap: 8px !important;
            }
            .hero-right-block {
              display: none !important;
            }
            .hero-trust-bento {
              display: none !important;
            }
            .hero-badge-pill {
              font-size: 10px !important;
              padding: 2.5px 8px !important;
              margin-bottom: 4px !important;
            }
            .hero-main-title {
              font-size: 17px !important;
              line-height: 1.25 !important;
              margin: 0 0 3px !important;
            }
            .hero-subtitle {
              font-size: 11.5px !important;
              line-height: 1.35 !important;
              margin: 0 0 6px !important;
            }
            .hero-values-strip {
              display: flex !important;
              flex-wrap: wrap !important;
              gap: 5px !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            .hero-values-chip {
              background: rgba(255, 255, 255, 0.85) !important;
              padding: 2.5px 7px !important;
              border-radius: 6px !important;
              border: 1px solid rgba(226, 232, 240, 0.9) !important;
              font-size: 10.5px !important;
              font-weight: 700 !important;
              color: #334155 !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 4px !important;
            }
            .hero-actions-row {
              gap: 8px !important;
              margin-top: 2px !important;
              padding-top: 6px !important;
              border-top: 1px solid rgba(254, 215, 170, 0.4) !important;
              justify-content: flex-start !important;
            }
            .hero-btn-explore,
            .hero-btn-create {
              font-size: 11px !important;
              padding: 5px 11px !important;
              border-radius: 14px !important;
            }
            .hero-hint-text {
              display: none !important;
            }
          }
        `}</style>

        <div className="hero-bento-grid" style={{ position: 'relative', zIndex: 2 }}>
          
          {/* COLONNE GAUCHE (Textes + Mini-Bento Confiance + Actions Directes) */}
          <div className="hero-left-column">
            
            {/* Accroche & Valeurs */}
            <div>
              <div className="hero-badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff7ed', color: '#c75b00', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, marginBottom: 8, border: '1px solid #ffedd5', width: 'fit-content' }}>
                <Sparkles size={13} style={{ color: '#C75B00' }} />
                <span>Annuaire des commerçants du Sénégal</span>
              </div>

              <h1 className="hero-main-title" style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 23, fontWeight: 900, margin: '0 0 5px', lineHeight: 1.15, color: '#0f172a' }}>
                Boutiques & Vendeurs Pro au <span style={{ color: '#C75B00' }}>Sénégal</span>
              </h1>

              <p className="hero-subtitle" style={{ fontSize: 13, color: '#475569', margin: '0 0 8px', lineHeight: 1.4 }}>
                L'annuaire de référence pour trouver des commerçants de confiance. Parcourez les catalogues en direct et commandez sans intermédiaire.
              </p>

              <div className="hero-values-strip" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11.5, color: '#334155' }}>
                <span className="hero-values-chip" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={12} style={{ color: '#10b981' }} /> <b>0% commission</b>
                </span>
                <span className="hero-values-chip" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={12} style={{ color: '#10b981' }} /> <b>Catalogues directs</b>
                </span>
                <span className="hero-values-chip" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={12} style={{ color: '#10b981' }} /> <b>WhatsApp direct</b>
                </span>
                <span className="hero-values-chip" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Store size={12} style={{ color: '#C75B00' }} /> <b>{total > 0 ? total : '70+'} boutiques</b>
                </span>
                <span className="hero-values-chip" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ShieldCheck size={12} style={{ color: '#16a34a' }} /> <b>Badge sur critères réels</b>
                </span>
              </div>
            </div>

            {/* ── 3 PILIERS CONFIANCE BENTO (VERSION DESKTOP) ── */}
            <div className="hero-trust-bento">
              <div className="hero-trust-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a' }}>Badge Vendeur vérifié</span>
                </div>
                <span style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.25 }}>Boutique physique & identité validée</span>
              </div>

              <div className="hero-trust-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageCircle size={14} style={{ color: '#C75B00', flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a' }}>WhatsApp Direct</span>
                </div>
                <span style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.25 }}>Commandes & négociation en direct</span>
              </div>

              <div className="hero-trust-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Truck size={14} style={{ color: '#1C2B4A', flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a' }}>Livraison Express</span>
                </div>
                <span style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.25 }}>Expédition Dakar & 14 régions</span>
              </div>
            </div>

            {/* ── ACTIONS & NAVIGATION RAPIDE ── */}
            <div className="hero-actions-row">
              <a href="#resultats" className="hero-btn-explore">
                <span>Explorer les boutiques</span>
                <ArrowDown size={13} />
              </a>
              <Link href="/creer-boutique" className="hero-btn-create">
                <Store size={13} />
                <span>Ouvrir ma boutique</span>
              </Link>
              <span className="hero-hint-text" style={{ fontSize: 11, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                Sélectionnez vos critères ci-dessous ↓
              </span>
            </div>

          </div>

          {/* COLONNE DROITE (CARROUSEL ANIMÉ + COMPTEURS STATS) - DESKTOP ONLY */}
          <div className="hero-right-block" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            
            {/* Widget Carrousel Animé (Auto-slide 4.5s) */}
            <div style={{ width: '100%' }}>
              <HeroCarousel />
            </div>

            {/* Widgets Statistiques */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#ffffff', padding: '9px 12px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ background: '#fff7ed', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, flexShrink: 0 }}>
                  <Store size={16} style={{ color: '#C75B00' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{total > 0 ? total : '70+'}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Boutiques actives</p>
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '9px 12px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ background: '#f0fdf4', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, flexShrink: 0 }}>
                  <ShieldCheck size={16} style={{ color: '#16a34a' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>100%</p>
                  <p style={{ margin: '1px 0 0', fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Vendeurs partenaires</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ── SÉLECTION DISCOVER : PÉPITES & PRODUITS DU MOMENT (12 ARTICLES EN CARROUSEL COMPACT) ── */}
      {!estEnModeRecherche && topProduits.length > 0 && (
        <DiscoverTrendingProducts produits={topProduits} />
      )}

      {/* ── SECTION RÉSULTATS DE L'ANNUAIRE DES BOUTIQUES ── */}
      <div id="resultats" style={{ marginBottom: 24 }}>
        
        {/* ── BLOC RECHERCHE & FILTRES DIRECTEMENT COLLÉ À L'ANNUAIRE ── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 18,
          padding: '12px 16px',
          boxShadow: '0 2px 10px rgba(199, 91, 0, 0.03)',
          border: '1px solid #fed7aa',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginBottom: 16,
        }}>
          <BoutiquesSearch
            currentQ={q}
            currentVille={ville}
            currentCat={cat}
            extraParams={{
              tri,
              budget,
              promo,
              avec_prods: avecProds,
              whatsapp,
              certifie,
              ouvert,
              note_min: noteMin,
              vedette,
              plan,
            }}
          />

          <BoutiquesFilterBar
            ville={ville}
            villes={villesAffichage}
            budget={budget}
            budgets={BUDGETS}
            tri={tri}
            promo={promo}
            avecProds={avecProds}
            whatsapp={whatsapp}
            certifie={certifie}
            ouvert={ouvert}
            noteMin={noteMin}
            vedette={vedette}
            plan={plan}
            q={q}
            cat={cat}
          />
        </div>

        {/* Barre de catégories défilante */}
        <div
          className="hero-categories-scroll"
          style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, paddingLeft: 4, paddingRight: 16,
            scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', justifyContent: 'flex-start',
            marginBottom: 16,
          }}
        >
          {categoriesAffichage.map(c => {
            const isSelected = (cat === c.slug) || (!cat && c.slug === '')
            return (
              <Link
                key={c.slug || 'toutes'}
                href={buildLink({ cat: c.slug, page: '1' })}
                prefetch={false}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 24, fontSize: 12.5, fontWeight: isSelected ? 800 : 600,
                  whiteSpace: 'nowrap', textDecoration: 'none',
                  background: isSelected ? 'var(--accent, #C75B00)' : '#fff',
                  color: isSelected ? '#fff' : '#374151',
                  border: isSelected ? '1px solid var(--accent, #C75B00)' : '1px solid #e5e7eb',
                  boxShadow: isSelected ? '0 4px 12px rgba(199,91,0,0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {getCategoryIcon(c.slug)}
                <span>{c.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Résumé de recherche ou de filtre actif */}
        {aDesFiltresActifs && (
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '10px 16px', borderRadius: 12, border: '1px solid #fed7aa' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#334155' }}>
              {estEnModeRecherche ? (
                <>Résultats pour <b>« {q} »</b> ({boutiquesFiltrees.length} boutique{boutiquesFiltrees.length > 1 ? 's' : ''} correspondante{boutiquesFiltrees.length > 1 ? 's' : ''})</>
              ) : (
                <>Filtres appliqués : <b>{boutiquesFiltrees.length}</b> boutique{boutiquesFiltrees.length > 1 ? 's' : ''} trouvée{boutiquesFiltrees.length > 1 ? 's' : ''}</>
              )}
            </p>
            <Link href="/boutiques" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent, #C75B00)', textDecoration: 'none' }}>
              Tout réinitialiser
            </Link>
          </div>
        )}

        {/* ── LISTE / CARROUSEL DES BOUTIQUES PARTENAIRES ── */}
        <BoutiquesDirectoryList boutiques={boutiquesFiltrees} searchQuery={q} />
      </div>

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32 }}>
          {currentPage > 1 && (
            <Link href={buildLink({ page: String(currentPage - 1) })} prefetch={false} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, color: '#374151' }}>
              ← Précédent
            </Link>
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>Page {currentPage} / {totalPages}</span>
          {currentPage < totalPages && (
            <Link href={buildLink({ page: String(currentPage + 1) })} prefetch={false} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, color: '#374151' }}>
              Suivant →
            </Link>
          )}
        </div>
      )}

    </div>
  )
}
