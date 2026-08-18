'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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

const TYPE_ICONS: Record<string, string> = {
  appartement: '🏢', villa: '🏡', maison: '🏠',
  studio: '🛏', terrain: '🌿', bureau: '🏢',
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
      } catch(e) {} 
    }
    if (!cached) setLoading(true)

    // Utilise le proxy Next.js authentifié (pas de token Bearer nécessaire)
    fetch('/api/immo/mine')
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        setAnnonces(data)
        localStorage.setItem(cacheKey, JSON.stringify(data))
      })
      .catch(err => {
        console.warn('[AnnoncesImmoClient] Mode hors-ligne ou erreur réseau lors du fetch :', err.message)
        if (!cached) setFetchError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mes-immo-header">
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          {annonces.length} {t('account.adsCount')}
        </p>
        <Link href="/deposer-immo" className="deposer-btn">
          + {t('account.navPublishRealEstate')}
        </Link>
      </div>

      {loading && annonces.length === 0 && <p style={{ padding: 20 }}>{t('common.loading')}</p>}

      {created && (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#065F46' }}>
          {t('account.immoSubmittedSuccess')}
        </div>
      )}

      {updated && (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#065F46' }}>
          {t('account.immoUpdatedSuccess')}
        </div>
      )}

      {fetchError && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#7F1D1D' }}>
          {t('account.immoErrorLoading')}
        </div>
      )}

      {annonces.length === 0 && !fetchError && !loading ? (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🏘</span>
          <p>{t('account.noRealEstate')}</p>
          <Link href="/deposer-immo" className="budget-pill active" style={{ marginTop: 12 }}>
            {t('account.publishFirstRealEstate')}
          </Link>
        </div>
      ) : (
        <div className="mes-immo-grid">
          {annonces.map(a => {
            const icon = TYPE_ICONS[a.type_bien ?? ''] ?? '🏠'
            const isActive = a.actif
            return (
              <div key={a.id} className={`mes-immo-card ${!isActive ? 'inactive' : ''}`}>
                <div className="mes-immo-img-wrapper">
                  {a.image_url ? (
                    <ExternalImg src={a.image_url} alt={a.titre} className="mes-immo-img" />
                  ) : (
                    <div className="mes-immo-img-placeholder">{icon}</div>
                  )}
                  {!isActive && <span className="mes-immo-badge pending">{t('account.adStatusPending')}</span>}
                </div>
                <div className="mes-immo-content">
                  <h3 className="mes-immo-title">{a.titre}</h3>
                  <p className="mes-immo-details">
                    {a.type_bien} {a.transaction === 'vente' ? t('account.immoTypeSale') : t('account.immoTypeRent')}
                  </p>
                  <p className="mes-immo-loc">{[a.quartier, a.ville].filter(Boolean).join(', ')}</p>
                  <p className="mes-immo-price">{fcfa(a.prix)}</p>
                  
                  <div className="mes-immo-actions">
                    <Link href={`/modifier-immo/${a.id}`} className="mes-immo-btn">{t('account.adActionEdit')}</Link>
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
