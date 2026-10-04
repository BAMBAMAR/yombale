'use client'

import React, { useState } from 'react'
import { Eye, X, BookOpen } from 'lucide-react'
import SurgaShareButton from './SurgaShareButton'

export interface UneItem {
  id: string
  nom_journal: string
  image_url: string
  description?: string
  date_parution?: string
}

interface SurgaKiosqueUnesProps {
  unes: UneItem[]
  loading?: boolean
}

export default function SurgaKiosqueUnes({ unes, loading = false }: SurgaKiosqueUnesProps) {
  const [selectedUne, setSelectedUne] = useState<UneItem | null>(null)

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

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
          gap: 12,
        }}
      >
        {unes.map((une) => (
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
            onClick={() => setSelectedUne(une)}
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
              <img
                src={une.image_url}
                alt={`Une du quotidien ${une.nom_journal}`}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  display: 'block',
                }}
              />
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
              <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                {une.date_parution || 'Aujourd’hui'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox / Zoom sur la Une sélectionnée */}
      {selectedUne && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Une de ${selectedUne.nom_journal}`}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 25, 38, 0.85)',
            backdropFilter: 'blur(5px)',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setSelectedUne(null)}
        >
          {/* Carte modale */}
          <div
            style={{
              position: 'relative',
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du visualiseur */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border, #E8DDD2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                  {selectedUne.nom_journal}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                  {selectedUne.description || 'Quotidien national d information'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SurgaShareButton
                  payload={{
                    titre: `Une de ${selectedUne.nom_journal}`,
                    texte: `*Surga — Kiosque de la Presse Sénégalaise*\n• Journal : ${selectedUne.nom_journal}\n• Date : ${selectedUne.date_parution || 'Aujourd’hui'}\nConsulter la revue de presse sur Surga : https://nopalou.com/surga`,
                    url: 'https://nopalou.com/surga',
                  }}
                  libelle="Partager"
                  taille="sm"
                />
                <button
                  type="button"
                  onClick={() => setSelectedUne(null)}
                  aria-label="Fermer la vue"
                  style={{
                    background: 'none',
                    border: 'none',
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text2, #5A4E42)',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Image zoomée */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                backgroundColor: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
              }}
            >
              <img
                src={selectedUne.image_url}
                alt={`Une complète de ${selectedUne.nom_journal}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '72vh',
                  objectFit: 'contain',
                  borderRadius: 4,
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
