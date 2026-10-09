'use client'

import React, { useState, useEffect } from 'react'
import { GraduationCap, ChevronRight, Bell, Calendar } from 'lucide-react'

interface ConcoursApercu {
  id: string
  sigle?: string
  titre: string
  date_cloture: string
  echeances?: {
    joursRestantsCloture: number | null
    messageDelai: string
    estCloture: boolean
  }
}

interface SurgaConcoursDashboardCardProps {
  onOuvrirModal: () => void
}

export default function SurgaConcoursDashboardCard({ onOuvrirModal }: SurgaConcoursDashboardCardProps) {
  const [synthese, setSynthese] = useState<string>('')
  const [prochainsConcours, setProchainsConcours] = useState<ConcoursApercu[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    async function charger() {
      try {
        const [resSynthese, resConcours] = await Promise.all([
          fetch('/api/surga/concours/synthese'),
          fetch('/api/surga/concours?limit=2'),
        ])

        const [dataSynthese, dataConcours] = await Promise.all([
          resSynthese.json(),
          resConcours.json(),
        ])

        if (isMounted) {
          if (dataSynthese.success) {
            setSynthese(dataSynthese.synthese)
          }
          if (dataConcours.success && Array.isArray(dataConcours.concours)) {
            setProchainsConcours(dataConcours.concours.slice(0, 2))
          }
        }
      } catch (err) {
        console.error('Erreur chargement concours dashboard card:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    charger()
    return () => {
      isMounted = false
    }
  }, [])

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
            <GraduationCap size={16} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Concours &amp; Examens
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
              Fonction publique &bull; Alertes J-30 / J-7 / J-1
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
        {synthese || 'Suivez les concours nationaux et recevez vos alertes de pièces et dates de clôture directement dans votre agenda.'}
      </p>

      {/* Aperçu des 2 prochains concours */}
      {prochainsConcours.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
          {prochainsConcours.map((c) => (
            <div
              key={c.id}
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
              <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {c.sigle && (
                  <span
                    style={{
                      backgroundColor: 'var(--navy, #1C2B4A)',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: 4,
                    }}
                  >
                    {c.sigle}
                  </span>
                )}
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
                  {c.titre}
                </div>
              </div>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--surga-accent-ink, #A64B08)',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.echeances?.messageDelai || 'En cours'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bouton d'action */}
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
        <span>Consulter le calendrier des concours</span>
      </button>
    </div>
  )
}
