import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Building2,
  MapPin,
  Search,
  Home,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Plus,
  Phone,
  ExternalLink,
  CreditCard
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import AgenceDirectoryCard, { AgenceItem } from './components/AgenceDirectoryCard'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Agences Immobilières Partenaires au Sénégal — Nopalou Immo',
  description: 'Découvrez les meilleures agences immobilières vérifiées au Sénégal : villas, appartements, terrains à louer et à vendre à Dakar, Saly et Thiès.',
  alternates: { canonical: `${BASE}/agences` },
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

            <Link
              href="/payer-loyer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#86efac',
                fontWeight: 800,
                fontSize: 13.5,
                textDecoration: 'none',
              }}
            >
              <CreditCard size={16} />
              Payer mon loyer (Wave &amp; OM)
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
            {agences.map(ag => (
              <AgenceDirectoryCard key={ag.id} agence={ag} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
