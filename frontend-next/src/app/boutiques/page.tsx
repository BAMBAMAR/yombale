import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import BoutiquesSearch from './BoutiquesSearch'
import { Store, ShieldCheck, MapPin, Sparkles, Star, MessageCircle, ArrowRight, Building2 } from 'lucide-react'
import { getCategoryCoverPhoto } from '@/lib/boutique-covers'
import HeroCarousel from './HeroCarousel'
import ExternalImg from '@/components/ExternalImg'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Boutiques Partenaires & Vendeurs Vérifiés au Sénégal — Nopalou',
  description: `Découvrez les meilleures boutiques et vendeurs professionnels au Sénégal : smartphones, mode, électroménager, univers maison, contact direct et livraison.`,
  alternates: { canonical: `${BASE}/boutiques` },
}

interface Boutique {
  id: string
  slug: string | null
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  whatsapp: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  cover_url: string | null
  horaires: Record<string, string> | null
  sponsorise: boolean
  sponsor_jusqu_au: string | null
  plan_actif: 'pro' | 'business' | null
  note_moyenne?: number | string
  total_avis?: number
  created_at: string
}

const CATEGORIES_BOUTIQUE = [
  { slug: '', label: 'Toutes les boutiques', icon: '🏪' },
  { slug: 'smartphones', label: 'Smartphones & Tech', icon: '📱' },
  { slug: 'informatique', label: 'Informatique & PC', icon: '💻' },
  { slug: 'tv-electro', label: 'TV & Électro', icon: '📺' },
  { slug: 'mode', label: 'Mode & Beauté', icon: '👗' },
  { slug: 'maison', label: 'Maison & Déco', icon: '🏠' },
  { slug: 'auto-moto', label: 'Auto-Moto', icon: '🚗' },
  { slug: 'jeux', label: 'Jeux & Consoles', icon: '🎮' },
  { slug: 'alimentation', label: 'Alimentation', icon: '🥗' },
  { slug: 'beaute', label: 'Beauté & Soins', icon: '💄' },
  { slug: 'bijouterie', label: 'Bijouterie & Horlogerie', icon: '💎' },
  { slug: 'quincaillerie', label: 'Quincaillerie & BTP', icon: '🧱' },
  { slug: 'services', label: 'Services & Pro', icon: '🛠' },
  { slug: 'mixte', label: 'Généraliste', icon: '🛍️' },
]

const VILLES = ['Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Mbour']

const TRIS = [
  { val: '', label: 'Recommandé' },
  { val: 'recent', label: 'Plus récents' },
  { val: 'nom_asc', label: 'Nom A-Z' },
]

function estOuvertActuellement(horaires?: Record<string, string> | null): { ouverte: boolean; label: string } {
  if (!horaires || Object.keys(horaires).length === 0) {
    return { ouverte: true, label: 'Ouvert 7j/7' }
  }
  const joursKeys = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const now = new Date()
  const jourActuel = joursKeys[now.getDay()]
  const plage = horaires[jourActuel]

  if (!plage || plage.toLowerCase().includes('fermé')) {
    return { ouverte: false, label: 'Fermé' }
  }

  const match = plage.match(/(\d{1,2})[:h](\d{2})?\s*-\s*(\d{1,2})[:h](\d{2})?/)
  if (match) {
    const startHour = parseInt(match[1], 10)
    const endHour = parseInt(match[3], 10)
    const currentHour = now.getHours()
    if (currentHour >= startHour && currentHour < endHour) {
      return { ouverte: true, label: `Ouvert jusqu'à ${endHour}h` }
    } else {
      return { ouverte: false, label: `Fermé (Ouvre à ${startHour}h)` }
    }
  }
  return { ouverte: true, label: 'Ouvert' }
}

export default async function BoutiquesPage({
  searchParams,
}: {
  searchParams: Promise<{ ville?: string; q?: string; cat?: string; page?: string; tri?: string; plan?: string }> | { ville?: string; q?: string; cat?: string; page?: string; tri?: string; plan?: string }
}) {
  const sp = await Promise.resolve(searchParams)
  const ville = sp?.ville ?? ''
  const q = sp?.q ?? ''
  const cat = sp?.cat ?? ''
  const page = sp?.page ?? '1'
  const tri = sp?.tri ?? ''
  const plan = sp?.plan ?? ''

  const qs = new URLSearchParams({ limit: '24', page })
  if (ville) qs.set('ville', ville)
  if (q) qs.set('q', q)
  if (cat) qs.set('categorie', cat)
  if (tri) qs.set('tri', tri)

  let boutiques: Boutique[] = []
  let total = 0
  let villesDisponibles: string[] = []
  let categoriesActivesSlugs: string[] = []

  try {
    const data = await apiFetch<{ boutiques: Boutique[]; total: number; villes?: string[]; categories?: string[] }>(`/boutiques?${qs}`)
    boutiques = data?.boutiques ?? []
    total = data?.total ?? 0
    villesDisponibles = data?.villes ?? []
    categoriesActivesSlugs = data?.categories ?? []
  } catch {}

  const villesAffichage = villesDisponibles.length > 0 ? villesDisponibles : VILLES

  // Conserver les pilules de catégories actives et principales pour un filtrage fluide
  const categoriesAffichage = CATEGORIES_BOUTIQUE

  let boutiquesFiltrees = boutiques
  if (plan === 'business') {
    boutiquesFiltrees = boutiquesFiltrees.filter(b => b.plan_actif === 'business')
  } else if (plan === 'pro') {
    boutiquesFiltrees = boutiquesFiltrees.filter(b => b.plan_actif === 'pro')
  }

  const totalPages = Math.ceil(total / 24)
  const currentPage = Number(page)

  function buildLink(params: Record<string, string>) {
    const p = new URLSearchParams()
    if (ville) p.set('ville', ville)
    if (q) p.set('q', q)
    if (cat) p.set('cat', cat)
    if (tri) p.set('tri', tri)
    if (plan) p.set('plan', plan)

    Object.entries(params).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
    const s = p.toString()
    return `/boutiques${s ? `?${s}` : ''}`
  }

  return (
    <div className="page-container" style={{ maxWidth: 1440, paddingTop: '1.5rem', paddingBottom: '4rem' }}>
      {/* HERO BANNER BOUTIQUES — HARMONIE NOPALOU (ORANGE AMBRE & ARDOISE) */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fffdfa 50%, #fff7ed 100%)',
        borderRadius: 24,
        padding: '24px 28px',
        color: '#0f172a',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #fed7aa',
        boxShadow: '0 8px 24px rgba(199, 91, 0, 0.05)',
      }}>
        <div style={{
          position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(199,91,0,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <style>{`
          .hero-bento-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 380px;
            gap: 24px;
            align-items: stretch;
          }
          .hero-text-block { grid-column: 1; grid-row: 1; }
          .hero-search-block { grid-column: 1; grid-row: 2; align-self: end; }
          .hero-right-block { grid-column: 2; grid-row: 1 / span 2; }

          @media (max-width: 1023px) {
            .hero-bento-grid {
              display: flex;
              flex-direction: column;
              gap: 24px;
            }
            .hero-text-block { order: 1; }
            .hero-right-block { order: 2; }
            .hero-search-block { order: 3; }
          }
        `}</style>
        <div className="hero-bento-grid" style={{ position: 'relative', zIndex: 2 }}>
          
          {/* TEXT BLOCK */}
          <div className="hero-text-block" style={{ maxWidth: 680 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff7ed', color: '#c75b00', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, marginBottom: 10, border: '1px solid #ffedd5', width: 'fit-content' }}>
                <Sparkles size={13} style={{ color: '#C75B00' }} />
                <span>Hub officiel des vendeurs vérifiés Nopalou</span>
              </div>

              <h1 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 26, fontWeight: 900, margin: '0 0 10px', lineHeight: 1.15, color: '#0f172a' }}>
                Boutiques & Vendeurs Pro au <span style={{ color: '#C75B00' }}>Sénégal</span>
              </h1>

              <p style={{ fontSize: 14, color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>
                L'annuaire de référence pour trouver des commerçants de confiance, grossistes et artisans. Parcourez leurs catalogues interactifs et contactez-les directement sans intermédiaire.
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 6, color: '#475569', fontSize: 13 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#10b981', fontWeight: 900 }}>✔</span> 
                  <span><span style={{ fontWeight: 700, color: '#334155' }}>0% de commission</span> sur vos achats</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#10b981', fontWeight: 900 }}>✔</span> 
                  <span><span style={{ fontWeight: 700, color: '#334155' }}>100% Vendeurs vérifiés</span> et certifiés</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#10b981', fontWeight: 900 }}>✔</span> 
                  <span><span style={{ fontWeight: 700, color: '#334155' }}>Contact direct WhatsApp</span> avec les marchands</span>
                </li>
              </ul>
            </div>

            {/* SEARCH BLOCK */}
            <div className="hero-search-block" style={{ background: '#ffffff', borderRadius: 20, padding: '16px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <BoutiquesSearch currentQ={q} currentVille={ville} currentCat={cat} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Row 1: Villes & Badges */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ville :</span>
                  {villesAffichage.slice(0, 5).map(v => (
                    <Link
                      key={v}
                      href={buildLink({ ville: ville === v ? '' : v, page: '1' })}
                      style={{
                        padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                        background: ville === v ? '#fff7f0' : '#f8fafc',
                        color: ville === v ? '#C75B00' : '#4b5563',
                        border: ville === v ? '1.5px solid #C75B00' : '1px solid #e2e8f0',
                      }}
                    >
                      📍 {v}
                    </Link>
                  ))}

                  <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px' }} />

                  <Link
                    href={buildLink({ plan: plan === 'business' ? '' : 'business', page: '1' })}
                    style={{
                      padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                      background: plan === 'business' ? '#1e3a5f' : '#f1f5f9',
                      color: plan === 'business' ? '#fff' : '#1e3a5f',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    💼 Business
                  </Link>
                  <Link
                    href={buildLink({ plan: plan === 'pro' ? '' : 'pro', page: '1' })}
                    style={{
                      padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                      background: plan === 'pro' ? '#C75B00' : '#f1f5f9',
                      color: plan === 'pro' ? '#fff' : '#C75B00',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    ⭐ Vendeur Pro
                  </Link>
                </div>

                {/* Row 2: Trier par */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', paddingTop: 8, borderTop: '1px dashed #f1f5f9' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trier :</span>
                  <Link href={buildLink({ tri: 'recommande', page: '1' })} style={{ padding: '3px 10px', borderRadius: 14, fontSize: 11, fontWeight: 700, textDecoration: 'none', background: tri === 'recommande' || !tri ? '#1e293b' : '#f8fafc', color: tri === 'recommande' || !tri ? '#fff' : '#4b5563', border: tri === 'recommande' || !tri ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>Recommandé</Link>
                  <Link href={buildLink({ tri: 'recent', page: '1' })} style={{ padding: '3px 10px', borderRadius: 14, fontSize: 11, fontWeight: 700, textDecoration: 'none', background: tri === 'recent' ? '#1e293b' : '#f8fafc', color: tri === 'recent' ? '#fff' : '#4b5563', border: tri === 'recent' ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>Plus récents</Link>
                  <Link href={buildLink({ tri: 'nom', page: '1' })} style={{ padding: '3px 10px', borderRadius: 14, fontSize: 11, fontWeight: 700, textDecoration: 'none', background: tri === 'nom' ? '#1e293b' : '#f8fafc', color: tri === 'nom' ? '#fff' : '#4b5563', border: tri === 'nom' ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>Nom A-Z</Link>
                </div>
              </div>
            </div>

          {/* RIGHT BLOCK (Carousel + Stats) */}
          <div className="hero-right-block" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            
            {/* Widget Carrousel */}
            <div style={{ width: '100%' }}>
              <HeroCarousel />
            </div>

            {/* Widgets Statistiques */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#fff7ed', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 }}>
                  <Store size={18} style={{ color: '#C75B00' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{total > 0 ? total : '100+'}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b', fontWeight: 600 }}>Boutiques actives</p>
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#f0fdf4', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 }}>
                  <ShieldCheck size={18} style={{ color: '#16a34a' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>100%</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b', fontWeight: 600 }}>Vendeurs vérifiés</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <div id="resultats" style={{ marginBottom: 32 }}>
        <div className="hero-categories-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none', justifyContent: 'center' }}>
          {categoriesAffichage.map(c => {
            const isSelected = (cat === c.slug) || (!cat && c.slug === '')
            return (
              <Link
                key={c.slug || 'toutes'}
                href={buildLink({ cat: c.slug, page: '1' })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 30, fontSize: 13, fontWeight: isSelected ? 800 : 600,
                  whiteSpace: 'nowrap', textDecoration: 'none',
                  background: isSelected ? '#C75B00' : '#fff',
                  color: isSelected ? '#fff' : '#374151',
                  border: isSelected ? '1px solid #C75B00' : '1px solid #e5e7eb',
                  boxShadow: isSelected ? '0 4px 12px rgba(199,91,0,0.22)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* GRILLE DES BOUTIQUES */}
      {boutiquesFiltrees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: 52, display: 'block', marginBottom: 12 }}>🏪</span>
          <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#111827' }}>Aucune boutique ne correspond à votre recherche</h3>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>Essayez de modifier votre recherche ou vos filtres de ville/catégorie.</p>
          <Link href="/boutiques" style={{ display: 'inline-block', background: '#C75B00', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
            Voir toutes les boutiques
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: 22,
        }}>
          {boutiquesFiltrees.map(b => {
            const sponsorActif = b.sponsorise && (!b.sponsor_jusqu_au || new Date(b.sponsor_jusqu_au) > new Date())
            const estPro = b.plan_actif === 'pro'
            const estBusiness = b.plan_actif === 'business'
            const statutOuverture = estOuvertActuellement(b.horaires)
            const whatsappNumber = b.whatsapp || b.telephone
            const estMisEnAvant = estBusiness || estPro || sponsorActif

            // Photo de couverture HD par défaut sélectionnée selon la catégorie & hash déterministe
            const coverImageSrc = b.cover_url || getCategoryCoverPhoto(b.nom, b.categorie)

            // Initiales pour le logo par défaut
            const words = b.nom.trim().split(/\s+/)
            const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : b.nom.slice(0, 2).toUpperCase()

            return (
              <div
                key={b.id}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: estMisEnAvant ? '1px solid #fde68a' : '1px solid #e5e7eb',
                  boxShadow: estMisEnAvant ? '0 10px 25px -4px rgba(245, 158, 11, 0.15)' : '0 4px 16px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, boxShadow 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Couverture Header HD */}
                <div style={{
                  width: '100%', height: 110, background: '#f1f5f9',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <ExternalImg src={coverImageSrc} alt={b.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.4) 100%)' }} />

                  <div style={{
                    position: 'absolute', top: 10, right: 10, zIndex: 2,
                    background: 'rgba(255, 255, 255, 0.92)',
                    color: '#0f172a', backdropFilter: 'blur(8px)',
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 6,
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: statutOuverture.ouverte ? '#16a34a' : '#94a3b8',
                      boxShadow: statutOuverture.ouverte ? '0 0 6px rgba(22,163,74,0.5)' : 'none'
                    }} />
                    <span>{statutOuverture.label}</span>
                  </div>

                  {estBusiness && (
                    <div style={{ position: 'absolute', top: 10, left: 10, background: '#0f172a', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                      💼 Business
                    </div>
                  )}
                  {estPro && !estBusiness && (
                    <div style={{ position: 'absolute', top: 10, left: 10, background: '#C75B00', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                      ⭐ Vendeur Pro
                    </div>
                  )}
                </div>

                {/* Logo & Corps */}
                <div style={{ padding: '0 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -32, marginBottom: 10, position: 'relative', zIndex: 3 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 14, overflow: 'hidden',
                      border: '3px solid #fff', background: b.logo_url ? '#fff' : '#fff7ed',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ExternalImg src={b.logo_url} alt={b.nom} fallback={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fffbeb', padding: '3px 9px', borderRadius: 12, border: '1px solid #fef3c7' }}>
                      <Star size={12} style={{ color: '#d97706', fill: '#d97706' }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#92400e' }}>
                        {Number(b.note_moyenne || 5.0).toFixed(1)} / 5 {b.total_avis && b.total_avis > 0 ? `(${b.total_avis})` : ''}
                      </span>
                    </div>
                  </div>

                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>
                    <Link href={`/boutiques/${b.slug || b.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {b.nom}
                    </Link>
                  </h3>

                  {b.description && (
                    <p style={{
                      margin: '0 0 12px', fontSize: 12, color: '#6b7280', lineHeight: 1.4,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {b.description}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: '#4b5563', paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
                    {b.ville && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f8fafc', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                        <MapPin size={12} style={{ color: '#C75B00' }} /> {b.ville}
                      </span>
                    )}
                    {b.categorie && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f8fafc', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                        <Building2 size={12} style={{ color: '#475569' }} /> {b.categorie}
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: whatsappNumber ? '1fr auto' : '1fr', gap: 8 }}>
                    <Link
                      href={`/boutiques/${b.slug || b.id}`}
                      style={{
                        textAlign: 'center', background: '#C75B00', color: '#fff',
                        padding: '9px 14px', borderRadius: 10, textDecoration: 'none',
                        fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        boxShadow: '0 2px 8px rgba(199,91,0,0.22)',
                      }}
                    >
                      <span>Visiter la boutique</span>
                      <ArrowRight size={14} />
                    </Link>

                    {whatsappNumber && (
                      <a
                        href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${b.nom}, j'ai vu votre boutique sur Nopalou !`)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          background: '#25d366', color: '#fff', padding: '9px 12px',
                          borderRadius: 10, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(37,211,102,0.2)',
                        }}
                        title="Contacter sur WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32 }}>
          {currentPage > 1 && (
            <Link href={buildLink({ page: String(currentPage - 1) })} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, color: '#374151' }}>
              ← Précédent
            </Link>
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>Page {currentPage} / {totalPages}</span>
          {currentPage < totalPages && (
            <Link href={buildLink({ page: String(currentPage + 1) })} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, color: '#374151' }}>
              Suivant →
            </Link>
          )}
        </div>
      )}

    </div>
  )
}
