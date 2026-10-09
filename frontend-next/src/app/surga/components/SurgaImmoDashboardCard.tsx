'use client'

import React, { useState, useEffect } from 'react'
import { Building, ChevronRight, ShieldCheck, Bell } from 'lucide-react'

interface BienApercu {
  id: string
  titre: string
  prix: number
  transaction: 'location' | 'vente'
  quartier: string
  photos?: string[]
}

interface SurgaImmoDashboardCardProps {
  onOuvrirModal: () => void
}

export default function SurgaImmoDashboardCard({ onOuvrirModal }: SurgaImmoDashboardCardProps) {
  const [synthese, setSynthese] = useState<string>('')
  const [derniersBiens, setDerniersBiens] = useState<BienApercu[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    async function charger() {
      try {
        const [resSynthese, resBiens] = await Promise.all([
          fetch('/api/surga/immo/synthese'),
          fetch('/api/surga/immo/biens?limit=2'),
        ])
        const [dataSynthese, dataBiens] = await Promise.all([
          resSynthese.json(),
          resBiens.json(),
        ])

        if (isMounted) {
          if (dataSynthese.success) {
            setSynthese(dataSynthese.synthese)
          }
          if (dataBiens.success && Array.isArray(dataBiens.biens)) {
            setDerniersBiens(dataBiens.biens.slice(0, 2))
          }
        }
      } catch (err) {
        console.error('Erreur chargement immo dashboard:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    charger()
    return () => {
      isMounted = false
    }
  }, [])

  const formatPrix = (montant: number, transaction: string) => {
    const formatted = new Intl.NumberFormat('fr-FR').format(montant)
    return transaction === 'location' ? `${formatted} F/mois` : `${formatted} F`
  }

  return (
    <div className="surga-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: 'rgba(28, 43, 74, 0.08)',
              color: 'var(--navy, #1C2B4A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building size={16} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Immobilier &amp; Logement
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
              Offres vérifiées &bull; Alertes immédiates
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOuvrirModal}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--surga-accent-ink, #A64B08)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '2px 6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span>Gérer</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Synthèse textuelle D19 */}
      <p style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', margin: 0, lineHeight: 1.45 }}>
        {synthese || 'Le pôle immobilier Surga centralise les annonces certifiées et alerte votre WhatsApp dès qu un bien correspond à vos critères.'}
      </p>

      {/* Mini-liste des 2 dernières parutions */}
      {derniersBiens.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
          {derniersBiens.map((b) => (
            <div
              key={b.id}
              onClick={onOuvrirModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                backgroundColor: 'var(--bg, #F8F5F0)',
                borderRadius: 8,
                cursor: 'pointer',
                gap: 8,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--navy, #1C2B4A)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {b.titre}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>{b.quartier}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--price, #0A5C36)', whiteSpace: 'nowrap' }}>
                {formatPrix(b.prix, b.transaction)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Raccourci vers création d'alerte */}
      <button
        type="button"
        onClick={onOuvrirModal}
        style={{
          width: '100%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          backgroundColor: '#FFFFFF',
          color: 'var(--navy, #1C2B4A)',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 8,
          padding: '7px 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: 2,
        }}
      >
        <Bell size={13} style={{ color: 'var(--surga-accent-ink, #A64B08)' }} />
        <span>Créer une veille immobilière</span>
      </button>
    </div>
  )
}
