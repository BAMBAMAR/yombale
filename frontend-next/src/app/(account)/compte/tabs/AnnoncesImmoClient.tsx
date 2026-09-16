'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2,
  Home,
  Landmark,
  MapPin,
  Pencil,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Maximize2
} from 'lucide-react'
import { fcfa } from '@/lib/format'
import DeleteImmoButton from '../../mes-annonces-immo/DeleteImmoButton'
import ExternalImg from '@/components/ExternalImg'
import { useTranslation } from '@/i18n/context'

interface AnnonceImmo {
  id: string
  titre: string
  type_bien: string | null
  transaction: string | null
  prix: number | null
  ville: string | null
  quartier: string | null
  surface_m2: number | null
  nb_pieces: number | null
  image_url: string | null
  actif: boolean
  created_at: string
}

function getPropertyIcon(type: string | null) {
  const t = (type || '').toLowerCase()
  if (t.includes('villa') || t.includes('maison')) return <Home size={32} color="#FFFFFF" opacity={0.85} />
  if (t.includes('terrain')) return <Landmark size={32} color="#FFFFFF" opacity={0.85} />
  return <Building2 size={32} color="#FFFFFF" opacity={0.85} />
}

export default function AnnoncesImmoClient({ created, updated }: { created?: boolean; updated?: boolean }) {
  const [annonces, setAnnonces] = useState<AnnonceImmo[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const cacheKey = 'nopalou_offline_immo_mine'
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setAnnonces(parsed)
      } catch (e) {
        console.warn('[Nopalou:AnnoncesImmoClient]', e)
      }
    }
    if (!cached) setLoading(true)

    fetch('/api/immo/mine')
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        setAnnonces(data)
        localStorage.setItem(cacheKey, JSON.stringify(data))
      })
      .catch(err => {
        console.warn('[AnnoncesImmoClient] Mode hors-ligne ou erreur réseau :', err.message)
        if (!cached) setFetchError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* ── En-tête avec compteur et bouton d'action ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Mes Biens &amp; Annonces Immobilières
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
            {annonces.length} {t('account.adsCount')}
          </p>
        </div>

        <Link
          href="/deposer-immo"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            borderRadius: 8,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 2px 4px rgba(28, 43, 74, 0.1)',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus size={16} />
          <span>{t('account.navPublishRealEstate')}</span>
        </Link>
      </div>

      {loading && annonces.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>{t('common.loading')}</p>
        </div>
      )}

      {created && (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: '#065F46', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={18} />
          <span>{t('account.immoSubmittedSuccess')}</span>
        </div>
      )}

      {updated && (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: '#065F46', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={18} />
          <span>{t('account.immoUpdatedSuccess')}</span>
        </div>
      )}

      {fetchError && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: '#7F1D1D' }}>
          {t('account.immoErrorLoading')}
        </div>
      )}

      {annonces.length === 0 && !fetchError && !loading ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 14,
            padding: '50px 24px',
            textAlign: 'center',
            color: '#64748B',
          }}
        >
          <Building2 size={44} style={{ margin: '0 auto 12px', opacity: 0.4, color: 'var(--navy, #1C2B4A)' }} />
          <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>{t('account.noRealEstate')}</p>
          <p style={{ fontSize: 13, maxWidth: 420, margin: '6px auto 16px' }}>
            Publiez vos appartements, villas, studios ou terrains pour les rendre visibles aux locataires et acquéreurs qualifiés.
          </p>
          <Link
            href="/deposer-immo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              borderRadius: 8,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <Plus size={16} />
            <span>{t('account.publishFirstRealEstate')}</span>
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: 18,
          }}
        >
          {annonces.map(a => {
            const isActive = a.actif
            const isVente = a.transaction === 'vente'
            const typeLabel = a.type_bien ? (a.type_bien.charAt(0).toUpperCase() + a.type_bien.slice(1)) : 'Bien immobilier'
            const locationStr = [a.quartier, a.ville].filter(Boolean).join(', ')

            return (
              <div
                key={a.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border, #E8DDD2)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(28, 43, 74, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* ── Zone Image / Couverture ── */}
                <div
                  style={{
                    position: 'relative',
                    height: 175,
                    background: a.image_url
                      ? '#000000'
                      : 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {a.image_url ? (
                    <ExternalImg
                      src={a.image_url}
                      alt={a.titre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#FFFFFF' }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 26,
                          background: 'rgba(255, 255, 255, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getPropertyIcon(a.type_bien)}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 650, color: 'rgba(255, 255, 255, 0.75)' }}>
                        {typeLabel}
                      </span>
                    </div>
                  )}

                  {/* Badge Transaction (Location / Vente) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      padding: '4px 9px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      background: isVente ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {isVente ? t('account.immoTypeSale') : t('account.immoTypeRent')}
                  </div>

                  {/* Badge Statut (En ligne / Modération) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 10.5,
                      fontWeight: 700,
                      background: isActive ? '#DCFCE7' : '#FEF3C7',
                      color: isActive ? '#166534' : '#92400E',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {isActive ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    <span>{isActive ? 'Actif' : t('account.adStatusPending')}</span>
                  </div>
                </div>

                {/* ── Corps de la carte ── */}
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent, #C75B00)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2 }}>
                    {typeLabel}
                  </div>

                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: 'var(--navy, #1C2B4A)',
                      margin: '0 0 6px',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={a.titre}
                  >
                    {a.titre}
                  </h3>

                  {locationStr && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748B', fontSize: 12.5, marginBottom: 10 }}>
                      <MapPin size={14} style={{ flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {locationStr}
                      </span>
                    </div>
                  )}

                  {/* Surface & Pièces */}
                  {(a.surface_m2 || a.nb_pieces) && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      {a.surface_m2 && (
                        <span style={{ fontSize: 11.5, fontWeight: 700, background: '#FAF8F5', border: '1px solid var(--border, #E8DDD2)', padding: '2px 7px', borderRadius: 4, color: 'var(--navy, #1C2B4A)' }}>
                          {a.surface_m2} m²
                        </span>
                      )}
                      {a.nb_pieces && (
                        <span style={{ fontSize: 11.5, fontWeight: 700, background: '#FAF8F5', border: '1px solid var(--border, #E8DDD2)', padding: '2px 7px', borderRadius: 4, color: 'var(--navy, #1C2B4A)' }}>
                          {a.nb_pieces} {a.nb_pieces > 1 ? 'pièces' : 'pièce'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Prix en grand */}
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0A5C36' }}>
                      {fcfa(a.prix)}
                      {!isVente && <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginLeft: 4 }}>/ mois</span>}
                    </div>
                  </div>

                  {/* ── Actions (Modifier / Supprimer sans collision) ── */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      borderTop: '1px solid var(--border, #E8DDD2)',
                      paddingTop: 12,
                      marginTop: 14,
                    }}
                  >
                    <Link
                      href={`/mes-annonces-immo/${a.id}/modifier`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 14px',
                        borderRadius: 8,
                        background: '#FAF8F5',
                        border: '1px solid var(--border, #E8DDD2)',
                        color: 'var(--navy, #1C2B4A)',
                        fontSize: 12.5,
                        fontWeight: 700,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Pencil size={13} />
                      <span>{t('account.adActionEdit')}</span>
                    </Link>

                    <DeleteImmoButton id={a.id} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
