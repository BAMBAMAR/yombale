import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import BoutiquesSearch from './BoutiquesSearch'
import { Store, ShieldCheck, MapPin, Sparkles, Star, MessageCircle, ArrowRight, Building2 } from 'lucide-react'

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
  { slug: 'alimentation', label: 'Alimentation', icon: '🥗' },
  { slug: 'services', label: 'Services & Pro', icon: '🛠' },
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

  // Filtrer les catégories pour afficher uniquement celles avec des boutiques actives (garder 'Toutes les boutiques')
  const categoriesAffichage = CATEGORIES_BOUTIQUE.filter(c => {
    if (!c.slug) return true
    if (categoriesActivesSlugs.length === 0) return true
    return categoriesActivesSlugs.includes(c.slug)
  })

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
      
      {/* HERO BANNER BOUTIQUES */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e3a5f 100%)',
        borderRadius: 20,
        padding: '36px 32px',
        color: '#fff',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(15,23,42,0.25)',
      }}>
        <div style={{
          position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(199,91,0,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 820 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: 30, fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
            <Sparkles size={14} style={{ color: '#fb923c' }} />
            <span>Hub officiel des vendeurs vérifiés Nopalou</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 32, fontWeight: 900, margin: '0 0 10px', lineHeight: 1.2 }}>
            Boutiques & Vendeurs Pro au <span style={{ color: '#fb923c' }}>Sénégal</span>
          </h1>

          <p style={{ fontSize: 15, color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.6, maxWidth: 680 }}>
            Découvrez des commerçants de confiance, parcourez leurs catalogues en ligne, comparez les prix et contactez-les directement par WhatsApp ou téléphone.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/demo?role=marchand" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fb923c', color: '#fff',
              padding: '10px 18px', borderRadius: 10, fontWeight: 800, fontSize: 13, textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(251,146,60,0.3)',
            }}>
              🏪 Vous êtes commerçant ? Tester la Démo POS →
            </Link>
            <Link href="/boutique" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', color: '#fff',
              padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)'
            }}>
              ✨ Ouvrir ma Boutique Pro
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.06)', padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Store size={22} style={{ color: '#fb923c' }} />
              <div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{total > 0 ? total : '100+'}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Boutiques actives</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.06)', padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
              <ShieldCheck size={22} style={{ color: '#22c55e' }} />
              <div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>100%</p>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Vendeurs Vérifiés</p>
              </div>
            </div>

            <Link href="/boutique" style={{
              marginLeft: 'auto',
              background: '#C75B00', color: '#fff', padding: '12px 22px', borderRadius: 12,
              textDecoration: 'none', fontWeight: 800, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(199,91,0,0.4)', transition: 'transform 0.2s',
            }}>
              <span>🏪 Créer ma boutique</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* RECHERCHE & CATEGORIES */}
      <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <BoutiquesSearch currentQ={q} currentVille={ville} currentCat={cat} />
        </div>

        {/* Catégories Scrollables Dynamiques */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none' }}>
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
                  background: isSelected ? '#1e3a5f' : '#fff',
                  color: isSelected ? '#fff' : '#374151',
                  border: isSelected ? '1px solid #1e3a5f' : '1px solid #e5e7eb',
                  boxShadow: isSelected ? '0 4px 12px rgba(30,58,95,0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Filtres par Ville Dynamique, Formule & Tri */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', background: '#fff', padding: '14px 18px', borderRadius: 14, border: '1px solid #e5e7eb' }}>
          
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ville :</span>
            {villesAffichage.map(v => (
              <Link
                key={v}
                href={buildLink({ ville: ville === v ? '' : v, page: '1' })}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  background: ville === v ? '#fff7f0' : '#f8fafc',
                  color: ville === v ? '#C75B00' : '#4b5563',
                  border: ville === v ? '1.5px solid #C75B00' : '1px solid #e2e8f0',
                }}
              >
                📍 {v}
              </Link>
            ))}
          </div>

          <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' }} />

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Link
              href={buildLink({ plan: plan === 'business' ? '' : 'business', page: '1' })}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: 'none',
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
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                background: plan === 'pro' ? '#C75B00' : '#f1f5f9',
                color: plan === 'pro' ? '#fff' : '#C75B00',
                border: '1px solid #cbd5e1',
              }}
            >
              ⭐ Vendeur Pro
            </Link>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>Trier :</span>
            {TRIS.map(t => (
              <Link
                key={t.val || 'defaut'}
                href={buildLink({ tri: t.val, page: '1' })}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  background: tri === t.val ? '#1e293b' : '#f8fafc',
                  color: tri === t.val ? '#fff' : '#4b5563',
                  border: tri === t.val ? '1px solid #1e293b' : '1px solid #e2e8f0',
                }}
              >
                {t.label}
              </Link>
            ))}
          </div>
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

            return (
              <div
                key={b.id}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: (estBusiness || estPro || sponsorActif) ? '2px solid #fdba74' : '1px solid #e5e7eb',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, boxShadow 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Couverture Header */}
                <div style={{
                  width: '100%', height: 100, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {b.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.2, background: 'radial-gradient(circle, #fff 10%, transparent 10%)', backgroundSize: '12px 12px' }} />
                  )}

                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.4) 100%)' }} />

                  <div style={{
                    position: 'absolute', top: 10, right: 10, zIndex: 2,
                    background: statutOuverture.ouverte ? 'rgba(22,163,74,0.9)' : 'rgba(220,38,38,0.9)',
                    color: '#fff', backdropFilter: 'blur(4px)',
                    padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                    <span>{statutOuverture.label}</span>
                  </div>

                  {estBusiness && (
                    <div style={{ position: 'absolute', top: 10, left: 10, background: '#1e3a5f', color: '#fff', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                      💼 Business
                    </div>
                  )}
                  {estPro && !estBusiness && (
                    <div style={{ position: 'absolute', top: 10, left: 10, background: '#C75B00', color: '#fff', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                      ⭐ Vendeur Pro
                    </div>
                  )}
                </div>

                {/* Logo & Corps */}
                <div style={{ padding: '0 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -32, marginBottom: 10, position: 'relative', zIndex: 3 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 12, overflow: 'hidden',
                      border: '3px solid #fff', background: '#f8fafc',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {b.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.logo_url} alt={b.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Store size={28} style={{ color: '#1e3a5f' }} />
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', padding: '3px 8px', borderRadius: 12, border: '1px solid #fde68a' }}>
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
                        <Building2 size={12} style={{ color: '#2563eb' }} /> {b.categorie}
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: whatsappNumber ? '1fr auto' : '1fr', gap: 8 }}>
                    <Link
                      href={`/boutiques/${b.slug || b.id}`}
                      style={{
                        textAlign: 'center', background: '#1e3a5f', color: '#fff',
                        padding: '9px 14px', borderRadius: 10, textDecoration: 'none',
                        fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
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
