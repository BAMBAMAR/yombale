import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { pluriel } from '@/lib/format'
import AgencesSearch from './components/AgencesSearch'
import ImmoHeroCarousel from './components/ImmoHeroCarousel'
import AgenceDirectoryCard, { AgenceItem } from './components/AgenceDirectoryCard'
import DiscoverTrendingBiens, { TrendingBien } from './components/DiscoverTrendingBiens'
import AgenceFilterBar from './components/AgenceFilterBar'
import AgencesDirectoryList from './components/AgencesDirectoryList'
import {
  Building2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Home,
  CreditCard,
  Plus,
  Key,
  X,
  ArrowDown,
  FileCheck2,
  FileText
} from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Agences Immobilières Partenaires au Sénégal',
  description: 'Découvrez les meilleures agences immobilières vérifiées et agréées au Sénégal : villas, appartements, studios, terrains à louer et à vendre à Dakar, Saly et Thiès.',
  alternates: { canonical: `${BASE}/agences` },
}

const VILLES_DEFAUT = ['Dakar', 'Thiès', 'Saly / Mbour', 'Saint-Louis', 'Somone', 'Ziguinchor']

const BUDGETS_IMMO = [
  { val: '', label: 'Tous les budgets' },
  { val: 'moins_200k', label: '< 200 000 F' },
  { val: '200k_500k', label: '200 000 - 500 000 F' },
  { val: '500k_1m', label: '500 000 - 1 500 000 F' },
  { val: 'plus_1m', label: '> 1 500 000 F' },
]

export default async function PublicAgencesDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    ville?: string
    recherche?: string
    q?: string
    page?: string
    tri?: string
    budget?: string
    transaction?: string
    avec_biens?: string
    agree?: string
    whatsapp?: string
    meuble?: string
    plan?: string
  }> | {
    ville?: string
    recherche?: string
    q?: string
    page?: string
    tri?: string
    budget?: string
    transaction?: string
    avec_biens?: string
    agree?: string
    whatsapp?: string
    meuble?: string
    plan?: string
  }
}) {
  const sp = await Promise.resolve(searchParams)
  const ville = sp?.ville ?? ''
  const recherche = sp?.recherche || sp?.q || ''
  const page = sp?.page ?? '1'
  const tri = sp?.tri ?? ''
  const budget = sp?.budget ?? ''
  const transaction = sp?.transaction ?? ''
  const avecBiens = sp?.avec_biens ?? ''
  const agree = sp?.agree ?? ''
  const whatsapp = sp?.whatsapp ?? ''
  const meuble = sp?.meuble ?? ''
  const plan = sp?.plan ?? ''

  const qs = new URLSearchParams({ limit: '24', page })
  if (ville) qs.set('ville', ville)
  if (recherche) qs.set('recherche', recherche)
  if (tri) qs.set('tri', tri)
  if (budget) qs.set('budget', budget)
  if (transaction) qs.set('transaction', transaction)
  if (avecBiens) qs.set('avec_biens', '1')
  if (agree) qs.set('agree', '1')
  if (whatsapp) qs.set('whatsapp', '1')
  if (meuble) qs.set('meuble', '1')
  if (plan) qs.set('plan', plan)

  let agences: AgenceItem[] = []
  let total = 0
  let villesDisponibles: string[] = []
  let topBiens: TrendingBien[] = []

  try {
    const [dataAgences, dataTop] = await Promise.all([
      apiFetch<{ success: boolean; agences: AgenceItem[]; total: number; villes?: string[] }>(`/agences/public?${qs}`),
      apiFetch<{ success: boolean; biens: TrendingBien[] }>(`/agences/top-biens?limit=12${ville ? `&ville=${encodeURIComponent(ville)}` : ''}`).catch(() => ({ success: false, biens: [] }))
    ])
    if (dataAgences && dataAgences.success) {
      agences = dataAgences.agences || []
      total = dataAgences.total || agences.length
      villesDisponibles = dataAgences.villes || []
    }
    if (dataTop && dataTop.success) {
      topBiens = dataTop.biens || []
    }
  } catch (err) {
    console.error('[LOAD_PUBLIC_AGENCES_ERR]', err)
  }

  const villesAffichage = villesDisponibles.length > 0 ? villesDisponibles : VILLES_DEFAUT
  const totalPages = Math.ceil(total / 24)
  const currentPage = Number(page)
  const aDesFiltresActifs = Boolean(recherche || ville || budget || transaction || avecBiens || agree || whatsapp || meuble || plan || (tri && tri !== 'recommande'))

  return (
    <div className="page-container" style={{ maxWidth: 1440, paddingTop: '1.5rem', paddingBottom: '4rem', margin: '0 auto', paddingLeft: 16, paddingRight: 16 }}>
      
      {/* ── HERO BANNER BENTO IMMOBILIER (COMPACT, MONOLIGNE & ÉQUILIBRÉ) ── */}
      <div
        className="hero-immo-card"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fdfbf7 50%, #f7f3ec 100%)',
          borderRadius: 20,
          padding: '18px 22px',
          color: '#0f172a',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--border, #E8DDD2)',
          boxShadow: '0 4px 18px rgba(28, 43, 74, 0.04)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -60,
            top: -60,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(28,43,74,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <style>{`
          .hero-immo-card {
            width: 100%;
            box-sizing: border-box;
          }
          .hero-immo-grid {
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
            box-shadow: 0 6px 14px rgba(28, 43, 74, 0.08);
            border-color: #94a3b8;
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
          .hero-btn-rent {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #ffffff;
            color: #1C2B4A !important;
            border: 1.5px solid #cbd5e1;
            font-size: 12px;
            font-weight: 800;
            padding: 7px 14px;
            border-radius: 20px;
            text-decoration: none;
            transition: all 0.2s ease;
          }
          .hero-btn-rent:hover {
            background: #f8fafc;
            border-color: #1C2B4A;
            transform: translateY(-1px);
          }
          @media (max-width: 1023px) {
            .hero-immo-grid {
              display: flex;
              flex-direction: column;
              gap: 14px;
            }
          }
          @media (max-width: 768px) {
            .hero-immo-card {
              border-radius: 14px !important;
              padding: 12px 14px !important;
              margin-bottom: 14px !important;
            }
            .hero-immo-grid {
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
            .hero-title {
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
              border-top: 1px solid rgba(28, 43, 74, 0.08) !important;
              justify-content: flex-start !important;
            }
            .hero-btn-explore,
            .hero-btn-rent {
              font-size: 11px !important;
              padding: 5px 11px !important;
              border-radius: 14px !important;
            }
            .hero-hint-text {
              display: none !important;
            }
          }
        `}</style>

        <div className="hero-immo-grid" style={{ position: 'relative', zIndex: 2 }}>
          
          {/* COLONNE GAUCHE (Textes + Mini-Bento Confiance + Actions Directes) */}
          <div className="hero-left-column">
            
            {/* Accroche & Titre */}
            <div>
              <div
                className="hero-badge-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(28, 43, 74, 0.08)',
                  color: 'var(--navy, #1C2B4A)',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800,
                  marginBottom: 8,
                  border: '1px solid rgba(28, 43, 74, 0.15)',
                  width: 'fit-content',
                }}
              >
                <ShieldCheck size={13} style={{ color: '#16a34a' }} />
                <span>Annuaire officiel des professionnels agréés</span>
              </div>

              <h1
                className="hero-title"
                style={{
                  fontFamily: 'var(--font-archivo), sans-serif',
                  fontSize: 23,
                  fontWeight: 900,
                  margin: '0 0 5px',
                  lineHeight: 1.15,
                  color: 'var(--navy, #1C2B4A)',
                }}
              >
                Agences Immobilières & Gestionnaires au <span style={{ color: 'var(--accent, #C75B00)' }}>Sénégal</span>
              </h1>

              <p className="hero-subtitle" style={{ fontSize: 13, color: '#475569', margin: '0 0 8px', lineHeight: 1.4 }}>
                Consultez les vitrines officielles, vérifiez les agréments ministériels et accédez aux mandats vérifiés sans faux intermédiaire.
              </p>

              <div className="hero-values-strip" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11.5, color: '#334155' }}>
                <span className="hero-values-chip" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={12} style={{ color: '#10b981' }} /> <b>Agréments vérifiés</b>
                </span>
                <span className="hero-values-chip" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={12} style={{ color: '#10b981' }} /> <b>Recherche multi-critères</b>
                </span>
                <span className="hero-values-chip" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={12} style={{ color: '#10b981' }} /> <b>Baux & Quittances Wave</b>
                </span>
                <span className="hero-values-chip" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Building2 size={12} style={{ color: 'var(--navy, #1C2B4A)' }} /> <b>{total > 0 ? pluriel(total, 'agence') : '50+ agences'}</b>
                </span>
                <span className="hero-values-chip" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ShieldCheck size={12} style={{ color: '#16a34a' }} /> <b>100% agréées</b>
                </span>
              </div>
            </div>

            {/* ── 3 PILIERS CONFIANCE IMMO BENTO (VERSION DESKTOP) ── */}
            <div className="hero-trust-bento">
              <div className="hero-trust-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a' }}>Numéro d'agrément affiché</span>
                </div>
                <span style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.25 }}>Agences & cartes pro certifiées</span>
              </div>

              <div className="hero-trust-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileCheck2 size={14} style={{ color: '#1C2B4A', flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a' }}>Quittances Wave / OM</span>
                </div>
                <span style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.25 }}>Reçus certifiés & zéro litige</span>
              </div>

              <div className="hero-trust-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={14} style={{ color: '#C75B00', flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a' }}>Mandats Exclusifs</span>
                </div>
                <span style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.25 }}>Biens réels, zéro faux démarcheur</span>
              </div>
            </div>

            {/* ── ACTIONS & NAVIGATION RAPIDE ── */}
            <div className="hero-actions-row">
              <a href="#resultats" className="hero-btn-explore">
                <span>Explorer les agences</span>
                <ArrowDown size={13} />
              </a>
              <Link href="/payer-loyer" className="hero-btn-rent">
                <FileText size={13} />
                <span>Payer mon loyer</span>
              </Link>
              <span className="hero-hint-text" style={{ fontSize: 11, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                Sélectionnez vos critères ci-dessous ↓
              </span>
            </div>

          </div>

          {/* COLONNE DROITE (CARROUSEL IMMOBILIER + WIDGETS STATISTIQUES) - DESKTOP ONLY */}
          <div className="hero-right-block" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            
            {/* Widget Carrousel Animé (Auto-slide 4.5s) */}
            <div style={{ width: '100%' }}>
              <ImmoHeroCarousel />
            </div>

            {/* Widgets Statistiques */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div
                style={{
                  background: '#ffffff',
                  padding: '9px 12px',
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                }}
              >
                <div
                  style={{
                    background: 'rgba(28, 43, 74, 0.08)',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 7,
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={16} style={{ color: 'var(--navy, #1C2B4A)' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                    {total > 0 ? total : '50+'}
                  </p>
                  <p style={{ margin: '1px 0 0', fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>
                    Agences partenaires
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  padding: '9px 12px',
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                }}
              >
                <div
                  style={{
                    background: '#f0fdf4',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 7,
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={16} style={{ color: '#16a34a' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                    100%
                  </p>
                  <p style={{ margin: '1px 0 0', fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>
                    Cabinets agréés & pro
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ── SECTION DÉCOUVRIR LES PÉPITES IMMOBILIÈRES (12 BIENS EN CARROUSEL COMPACT) ── */}
      <DiscoverTrendingBiens biens={topBiens} />

      {/* ── RÉSULTATS DE L'ANNUAIRE DES AGENCES ── */}
      <div id="resultats" style={{ scrollMarginTop: '20px', marginBottom: 20 }}>
        
        {/* En-tête de section avec raccourcis */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              {aDesFiltresActifs ? 'Agences filtrées' : 'Toutes les agences partenaires'}
            </h2>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: '2px 0 0' }}>
              {total} agence{total > 1 ? 's' : ''} répertoriée{total > 1 ? 's' : ''} au Sénégal
              {ville ? ` à ${ville}` : ''}
            </p>
          </div>

          <div className="hero-shortcuts" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              href="/immo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 8,
                background: '#FAF8F5',
                border: '1px solid var(--border, #E8DDD2)',
                color: 'var(--navy, #1C2B4A)',
                fontSize: 12,
                fontWeight: 750,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <Home size={13} />
              <span>Rechercher un bien</span>
            </Link>

            <Link
              href="/payer-loyer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 8,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <CreditCard size={13} />
              <span>Payer mon loyer</span>
            </Link>

            <Link
              href="/agence"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <Plus size={13} />
              <span>Espace Agence Pro</span>
            </Link>
          </div>
        </div>

        {/* ── BLOC RECHERCHE & FILTRES DIRECTEMENT COLLÉ À L'ANNUAIRE ── */}
        <div
          className="directory-filter-box"
          style={{
            background: '#ffffff',
            borderRadius: 18,
            padding: '12px 16px',
            boxShadow: '0 2px 10px rgba(28, 43, 74, 0.03)',
            border: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <AgencesSearch
            currentQ={recherche}
            currentVille={ville}
            extraParams={{
              tri,
              budget,
              transaction,
              avec_biens: avecBiens,
              agree,
              whatsapp,
              meuble,
              plan,
            }}
          />

          <AgenceFilterBar
            ville={ville}
            villes={villesAffichage}
            budget={budget}
            budgets={BUDGETS_IMMO}
            tri={tri}
            transaction={transaction}
            avecBiens={avecBiens}
            agree={agree}
            whatsapp={whatsapp}
            meuble={meuble}
            plan={plan}
            recherche={recherche}
          />
        </div>

        {/* ── LISTE / CARROUSEL DES AGENCES PARTENAIRES ── */}
        <AgencesDirectoryList agences={agences} />

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 32 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
              const isActive = p === currentPage
              const nextQs = new URLSearchParams(qs.toString())
              nextQs.set('page', String(p))

              return (
                <Link
                  key={p}
                  href={`/agences?${nextQs.toString()}#resultats`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 800,
                    textDecoration: 'none',
                    background: isActive ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#334155',
                    border: '1px solid var(--border, #E8DDD2)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p}
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
