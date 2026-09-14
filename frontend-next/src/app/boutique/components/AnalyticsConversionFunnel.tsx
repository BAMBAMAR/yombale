'use client'

import React, { useState, useEffect } from 'react'
import {
  Eye,
  PackageSearch,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  Percent,
  ArrowDown,
  Loader2,
} from 'lucide-react'
import { fcfa } from '@/lib/format'

interface EtapeFunnel {
  etape: string
  label: string
  count: number
  taux_suivant: number
}

interface FunnelData {
  success: boolean
  periode: string
  etapes: EtapeFunnel[]
  kpis: {
    taux_conversion_global: number
    taux_abandon_panier: number
    ca_total: number
  }
}

interface Props {
  boutiqueId: string
}

export default function AnalyticsConversionFunnel({ boutiqueId }: Props) {
  const [periode, setPeriode] = useState<'7j' | '30j' | '90j'>('30j')
  const [data, setData] = useState<FunnelData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!boutiqueId) return
    setLoading(true)
    fetch(`/api/analytics/boutique/${boutiqueId}/funnel?periode=${periode}`)
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (json?.success) setData(json)
      })
      .catch(err => console.warn('[FUNNEL FETCH ERR]', err))
      .finally(() => setLoading(false))
  }, [boutiqueId, periode])

  const iconsByStep: Record<string, React.ReactNode> = {
    visites_boutique: <Eye size={18} strokeWidth={2} />,
    vues_produit: <PackageSearch size={18} strokeWidth={2} />,
    ajouts_panier: <ShoppingCart size={18} strokeWidth={2} />,
    checkouts_inities: <CreditCard size={18} strokeWidth={2} />,
    commandes_payees: <CheckCircle2 size={18} strokeWidth={2} />,
  }

  const maxCount = data?.etapes?.[0]?.count || 1

  return (
    <div className="card-npl" style={{ padding: '24px', marginTop: '24px' }}>
      {/* Entête avec Sélecteur de Période */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--accent, #C75B00)" />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
              Entonnoir de Conversion
            </h3>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text3, #888)' }}>
            Suivi étape par étape du parcours d'achat de vos visiteurs
          </p>
        </div>

        <div style={{ display: 'inline-flex', background: 'var(--bg, #F8F5F0)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border, #E8DDD2)' }}>
          {(['7j', '30j', '90j'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriode(p)}
              style={{
                border: 'none',
                background: periode === p ? 'var(--card, #ffffff)' : 'transparent',
                color: periode === p ? 'var(--navy, #1C2B4A)' : 'var(--text2, #555)',
                fontWeight: periode === p ? 700 : 500,
                fontSize: '12.5px',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: periode === p ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {p === '7j' ? '7 jours' : p === '30j' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent, #C75B00)' }}>
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : !data || data.etapes.length === 0 ? (
        <p style={{ color: 'var(--text3, #888)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
          Aucune donnée disponible pour cette période.
        </p>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--bg, #F8F5F0)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border, #E8DDD2)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text3, #888)', fontWeight: 600 }}>Taux de Conversion Global</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--price, #0A5C36)', marginTop: '4px' }}>
                {data.kpis.taux_conversion_global}%
              </div>
            </div>

            <div style={{ background: 'var(--bg, #F8F5F0)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border, #E8DDD2)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text3, #888)', fontWeight: 600 }}>Taux d'Abandon Panier</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: data.kpis.taux_abandon_panier > 60 ? '#B91C1C' : 'var(--navy, #1C2B4A)', marginTop: '4px' }}>
                {data.kpis.taux_abandon_panier}%
              </div>
            </div>

            <div style={{ background: 'var(--bg, #F8F5F0)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border, #E8DDD2)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text3, #888)', fontWeight: 600 }}>Chiffre d'Affaires Période</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent, #C75B00)', marginTop: '4px' }}>
                {fcfa(data.kpis.ca_total)}
              </div>
            </div>
          </div>

          {/* Étapes du Funnel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.etapes.map((etape, index) => {
              const widthPct = Math.max(12, Math.round((etape.count / Math.max(maxCount, 1)) * 100))
              const isLast = index === data.etapes.length - 1

              return (
                <div key={etape.etape}>
                  <div
                    style={{
                      background: 'var(--card, #ffffff)',
                      border: '1px solid var(--border, #E8DDD2)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Barre de progression proportionnelle */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${widthPct}%`,
                        backgroundColor: index === data.etapes.length - 1 ? 'rgba(10, 92, 54, 0.12)' : 'rgba(199, 91, 0, 0.08)',
                        zIndex: 0,
                        transition: 'width 0.4s ease',
                      }}
                    />

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg, #F8F5F0)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isLast ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)',
                          }}
                        >
                          {iconsByStep[etape.etape] || <Percent size={16} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                            {etape.label}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text3, #888)' }}>
                            Étape {index + 1} sur {data.etapes.length}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                          {etape.count.toLocaleString('fr-FR')}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text3, #888)' }}>
                          {Math.round((etape.count / Math.max(maxCount, 1)) * 100)}% du total
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connecteur de conversion vers étape suivante */}
                  {!isLast && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: 'var(--price, #0A5C36)',
                          background: 'rgba(10, 92, 54, 0.08)',
                          padding: '2px 10px',
                          borderRadius: '12px',
                        }}
                      >
                        <ArrowDown size={12} strokeWidth={2.5} />
                        <span>{etape.taux_suivant}% poursuivent</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
