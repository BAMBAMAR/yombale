'use client'

import React, { useState, useCallback } from 'react'
import { useTranslation } from '@/i18n/context'
import { fcfa } from '@/lib/format'

interface CommandeSuivie {
  id: string
  reference: string
  client_nom: string
  client_telephone: string
  statut: string
  montant_total: number
  methode_paiement: string
  created_at: string
  boutique_nom: string
  boutique_whatsapp?: string
}

export default function SuiviCommandeClient() {
  const [refInput, setRefInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [commandes, setCommandes] = useState<CommandeSuivie[]>([])
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  const executeSearch = useCallback(async (queryTerm: string) => {
    const term = queryTerm.trim()
    if (!term) return

    setLoading(true)
    setError(null)
    setCommandes([])

    try {
      const res = await fetch(`${backendUrl}/api/boutiques/commandes/suivi?q=${encodeURIComponent(term)}&ref=${encodeURIComponent(term)}&tel=${encodeURIComponent(term)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('account.trackOrderNotFound'))
      } else {
        setCommandes(data.commandes || [])
      }
    } catch {
      setError(t('errors.networkError'))
    } finally {
      setLoading(false)
    }
  }, [backendUrl, t])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    executeSearch(refInput)
  }

  function getStepIndex(statut: string) {
    const s = (statut || '').toLowerCase()
    if (s === 'livree' || s === 'payee') return 4
    if (s === 'en_livraison' || s === 'expediee') return 3
    if (s === 'en_preparation' || s === 'validee') return 2
    return 1
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1C2B4A', margin: '0 0 8px' }}>
          📦 {t('account.trackOrderTitle')}
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
          {t('account.trackOrderDesc')}
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
          <input
            type="text"
            value={refInput}
            onChange={e => setRefInput(e.target.value)}
            placeholder={t('account.trackOrderPlaceholder')}
            style={{
              flex: '1 1 220px',
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="npl-btn npl-btn-primary npl-btn-lg"
            style={{ flex: '0 0 auto', color: '#ffffff', whiteSpace: 'nowrap', padding: '0 22px' }}
          >
            <span>{loading ? '⏳' : '🔍'}</span>
            <span>{loading ? t('account.trackOrderSearching') : t('account.trackOrderSearch')}</span>
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {commandes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {commandes.map(cmd => {
            const currentStep = getStepIndex(cmd.statut)
            return (
              <div key={cmd.id} style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Boutique : {cmd.boutique_nom}</span>
                    <h3 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: '#1C2B4A' }}>Réf : {cmd.reference || cmd.id.slice(0, 8)}</h3>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#15803d' }}>{fcfa(cmd.montant_total)}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, margin: '20px 0', textAlign: 'center' }}>
                  {[
                    { step: 1, label: t('account.stepPending'), icon: '📋' },
                    { step: 2, label: t('account.stepPreparing'), icon: '📦' },
                    { step: 3, label: t('account.stepDelivering'), icon: '🚚' },
                    { step: 4, label: t('account.stepDelivered'), icon: '✅' },
                  ].map(st => {
                    const isActive = currentStep >= st.step
                    return (
                      <div key={st.step} style={{ opacity: isActive ? 1 : 0.4 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', margin: '0 auto 6px',
                          background: isActive ? '#C75B00' : '#e2e8f0', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700
                        }}>
                          {st.icon}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? '#1C2B4A' : '#94a3b8', display: 'block' }}>
                          {st.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span>Client : <strong>{cmd.client_nom}</strong> ({cmd.client_telephone})</span>
                  {cmd.boutique_whatsapp && (
                    <a
                      href={`https://wa.me/${cmd.boutique_whatsapp.replace(/[^0-9]/g, '')}?text=Bonjour,%20je%20suis%20le%20suivi%20de%20ma%20commande%20${cmd.reference}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {t('account.contactSeller')}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
