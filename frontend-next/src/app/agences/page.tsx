import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Building2,
  MapPin,
  Search,
  MessageCircle,
  Home,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Plus,
  Phone,
  ExternalLink
} from 'lucide-react'
import { apiFetch } from '@/lib/api'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Agences Immobilières Partenaires au Sénégal — Nopalou Immo',
  description: 'Découvrez les meilleures agences immobilières vérifiées au Sénégal : villas, appartements, terrains à louer et à vendre à Dakar, Saly et Thiès.',
  alternates: { canonical: `${BASE}/agences` },
}

interface AgenceItem {
  id: string
  nom: string
  slug: string
  description?: string
  logo_url?: string
  ville: string
  quartier?: string
  telephone?: string
  whatsapp?: string
  site_web?: string
  numero_agrement?: string
  nb_biens_disponibles: number
  parametres?: {
    reseaux_sociaux?: {
      instagram?: string
      tiktok?: string
      facebook?: string
      whatsapp?: string
      linkedin?: string
      youtube?: string
      twitter?: string
      site_web?: string
    }
  }
}

const VILLES = ['Toutes', 'Dakar', 'Thiès', 'Saly / Mbour', 'Saint-Louis', 'Ziguinchor']

export default async function PublicAgencesDirectoryPage({
  searchParams,
}: {
  searchParams: { ville?: string; recherche?: string }
}) {
  const ville = searchParams?.ville === 'Toutes' ? '' : searchParams?.ville || ''
  const recherche = searchParams?.recherche || ''

  let agences: AgenceItem[] = []
  try {
    const query = new URLSearchParams()
    if (ville) query.set('ville', ville)
    if (recherche) query.set('recherche', recherche)

    const data = await apiFetch<{ success: boolean; agences: AgenceItem[] }>(`/agences/public?${query.toString()}`)
    if (data && data.success) {
      agences = data.agences || []
    }
  } catch (err) {
    console.error('[LOAD_PUBLIC_AGENCES_ERR]', err)
  }

  return (
    <div style={{ background: 'var(--bg, #F8F5F0)', minHeight: '100vh', paddingBottom: 60 }}>
      {/* ── Hero Banner ── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1C2B4A 0%, #152037 100%)',
          color: '#FFFFFF',
          padding: '48px 16px 36px',
        }}
      >
        <div style={{ maxWidth: 1140, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(199, 91, 0, 0.2)',
              border: '1px solid rgba(199, 91, 0, 0.4)',
              color: '#FDBA74',
              padding: '4px 14px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 750,
              marginBottom: 16,
            }}
          >
            <ShieldCheck size={14} />
            Agences Vérifiées & Professionnelles au Sénégal
          </div>

          <h1
            style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 900,
              margin: '0 0 12px',
              letterSpacing: '-0.02em',
            }}
          >
            Agences Immobilières & Gestionnaires Locatifs
          </h1>

          <p
            style={{
              fontSize: 'clamp(14px, 2vw, 16px)',
              color: '#CBD5E1',
              maxWidth: 680,
              margin: '0 auto 24px',
              lineHeight: 1.5,
            }}
          >
            Consultez les vitrines officielles des agences partenaires Nopalou, parcourez leurs visites vidéo et trouvez votre futur logement en toute confiance.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href="/immo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                fontWeight: 750,
                fontSize: 13.5,
                textDecoration: 'none',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Home size={16} />
              Rechercher un bien immobilier
            </Link>

            <Link
              href="/agence"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 13.5,
                textDecoration: 'none',
              }}
            >
              <Plus size={16} />
              Espace Professionnel Agence
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contenu Principal & Filtres ── */}
      <main style={{ maxWidth: 1140, margin: '0 auto', padding: '24px 16px 0' }}>
        {/* Barre de Recherche et Villes */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid var(--border, #E8DDD2)',
            padding: 16,
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}
              />
              <form method="GET" action="/agences">
                <input
                  type="text"
                  name="recherche"
                  defaultValue={recherche}
                  placeholder="Rechercher une agence par nom, quartier..."
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: 8,
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 13.5,
                    outline: 'none',
                  }}
                />
              </form>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {VILLES.map(v => {
                const isSelected = (v === 'Toutes' && !ville) || ville === v
                return (
                  <Link
                    key={v}
                    href={v === 'Toutes' ? '/agences' : `/agences?ville=${encodeURIComponent(v)}`}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      textDecoration: 'none',
                      background: isSelected ? 'var(--navy, #1C2B4A)' : '#FAF8F5',
                      color: isSelected ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                      border: '1px solid var(--border, #E8DDD2)',
                    }}
                  >
                    {v}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Grille des Agences ── */}
        {agences.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <Building2 size={36} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>
              Aucune agence trouvée
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', maxWidth: 460, margin: '0 auto 16px' }}>
              Aucune agence ne correspond à vos critères de recherche. Essayez de réinitialiser vos filtres.
            </p>
            <Link
              href="/agences"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 6,
                background: 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              Voir toutes les agences
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 18,
            }}
          >
            {agences.map(ag => {
              const waNum = (ag.whatsapp || ag.telephone || '').replace(/[^0-9]/g, '')

              return (
                <div
                  key={ag.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 14,
                    border: '1px solid var(--border, #E8DDD2)',
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(28, 43, 74, 0.04)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  <div>
                    {/* Header Carte Agence */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 12,
                          background: 'var(--navy, #1C2B4A)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: 20,
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {ag.logo_url ? (
                          <img src={ag.logo_url} alt={ag.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          ag.nom.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <h3
                            style={{
                              fontSize: 16,
                              fontWeight: 800,
                              color: 'var(--navy, #1C2B4A)',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {ag.nom}
                          </h3>
                          <ShieldCheck size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                        </div>

                        <div style={{ fontSize: 12.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <MapPin size={13} />
                          {ag.quartier ? `${ag.quartier}, ${ag.ville}` : ag.ville}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {ag.description && (
                      <p
                        style={{
                          fontSize: 12.5,
                          color: '#475569',
                          lineHeight: 1.45,
                          margin: '0 0 14px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {ag.description}
                      </p>
                    )}

                    {/* Badge Biens Actifs */}
                    <div
                      style={{
                        background: '#FAF8F5',
                        border: '1px solid var(--border, #E8DDD2)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 16,
                      }}
                    >
                      <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Biens disponibles :</span>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: ag.nb_biens_disponibles > 0 ? 'var(--accent, #C75B00)' : '#64748B',
                        }}
                      >
                        {ag.nb_biens_disponibles} bien(s) en ligne
                      </span>
                    </div>
                  </div>

                  {/* Actions : Visiter la vitrine & Contact WhatsApp */}
                  <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border, #E8DDD2)' }}>
                    <Link
                      href={`/agences/${ag.slug}`}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '9px 12px',
                        borderRadius: 8,
                        background: 'var(--navy, #1C2B4A)',
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: 750,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <span>Visiter la vitrine</span>
                      <ArrowRight size={14} />
                    </Link>

                    {waNum && (
                      <a
                        href={`https://wa.me/${waNum}?text=${encodeURIComponent(
                          `Bonjour ${ag.nom}, je vous contacte via votre vitrine Nopalou Immobilier.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '9px 12px',
                          borderRadius: 8,
                          background: '#16a34a',
                          color: '#FFFFFF',
                          textDecoration: 'none',
                        }}
                        title="Discuter sur WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
