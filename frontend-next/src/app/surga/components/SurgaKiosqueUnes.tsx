'use client'

import React, { useState } from 'react'
import { Eye, BookOpen } from 'lucide-react'
import SurgaKiosqueLightbox, { type UneItem } from './SurgaKiosqueLightbox'

export type { UneItem }

interface SurgaKiosqueUnesProps {
  unes: UneItem[]
  loading?: boolean
}

function formatDateParution(dateStr?: string): string {
  if (!dateStr) return 'Aujourd’hui'
  try {
    const d = new Date(dateStr)
    const today = new Date().toISOString().slice(0, 10)
    const itemDate = d.toISOString().slice(0, 10)
    if (itemDate === today) return 'Aujourd’hui'
    return d.toLocaleDateString('fr-SN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return 'Aujourd’hui'
  }
}

export default function SurgaKiosqueUnes({ unes, loading = false }: SurgaKiosqueUnesProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [imagesEnEchec, setImagesEnEchec] = useState<Set<string | number>>(new Set())

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text3, #73675E)' }}>
        <BookOpen size={24} style={{ opacity: 0.6, animation: 'pulse 1.5s infinite' }} />
        <div style={{ marginTop: 8, fontSize: 13 }}>Chargement des Unes de la presse...</div>
      </div>
    )
  }

  if (!unes || unes.length === 0) {
    return (
      <div
        className="surga-card"
        style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text2, #5A4E42)' }}
      >
        <BookOpen size={24} style={{ opacity: 0.4, marginBottom: 8 }} />
        <div style={{ fontSize: 14, fontWeight: 700 }}>Aucune Une disponible aujourd’hui</div>
        <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', marginTop: 4 }}>
          Les parutions des quotidiens seront affichées dès leur mise en kiosque.
        </div>
      </div>
    )
  }

  const aucuneDuJour = unes.every((u) => formatDateParution(u.date_parution) !== 'Aujourd’hui')

  return (
    <>
      {aucuneDuJour && (
        <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 12, background: 'var(--surga-surface, #FFFFFF)', border: '1px solid var(--surga-border, #E2E8F0)', fontSize: 13, lineHeight: 1.4, color: 'var(--surga-text2, #334155)' }}>
          Les Unes d’aujourd’hui ne sont pas encore parues : voici les dernières éditions.
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
          gap: 12,
        }}
      >
        {unes.map((une, index) => (
          <div
            key={une.id}
            className="surga-card"
            style={{
              padding: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onClick={() => setSelectedIndex(index)}
          >
            {/* Image de la Une */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '3/4',
                backgroundColor: '#EDE8E1',
                overflow: 'hidden',
              }}
            >
              {imagesEnEchec.has(une.id) ? (
                // Image introuvable : le nom du journal remplace le texte de remplacement du navigateur.
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, textAlign: 'center', color: 'var(--surga-text3, #536175)' }}>
                  <BookOpen size={22} aria-hidden="true" />
                  <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{une.nom_journal}</span>
                  <span style={{ fontSize: 12, lineHeight: 1.3 }}>Image indisponible</span>
                </div>
              ) : (
                <img
                  src={une.image_url}
                  alt={`Une du quotidien ${une.nom_journal}`}
                  loading="lazy"
                  onError={() => setImagesEnEchec((prev) => new Set(prev).add(une.id))}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top center',
                    display: 'block',
                  }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(28, 43, 74, 0.25)',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
                className="hover-overlay"
              >
                <Eye size={22} />
              </div>
            </div>

            {/* Légende & Nom du Quotidien */}
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'var(--navy, #1C2B4A)',
                  lineHeight: 1.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {une.nom_journal}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
                {formatDateParution(une.date_parution)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox modulaire avec défilement des Unes */}
      <SurgaKiosqueLightbox
        unes={unes}
        selectedIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onSelectIndex={(idx) => setSelectedIndex(idx)}
      />
    </>
  )
}
