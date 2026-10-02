'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import ExternalImg from '@/components/ExternalImg'
import { pluriel } from '@/lib/format'
import {
  Sparkles,
  MessageCircle,
  MapPin,
  Building2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Bed
} from 'lucide-react'

export interface TrendingBien {
  id: string
  titre: string
  type_bien: string
  prix_location?: number | string | null
  prix_vente?: number | string | null
  ville: string
  quartier?: string | null
  surface_m2?: number | string | null
  nb_chambres?: number | null
  nb_sdb?: number | null
  meuble?: boolean | null
  photos?: string[] | null
  agence_id: string
  agence_nom: string
  agence_slug: string | null
  agence_logo?: string | null
  agence_tel?: string | null
  agence_whatsapp?: string | null
  numero_agrement?: string | null
}

function formatPrixFCFA(val: number | string | undefined | null) {
  if (val === undefined || val === null || val === '') return ''
  const num = typeof val === 'number' ? val : parseFloat(val)
  if (isNaN(num)) return `${val} F`
  return new Intl.NumberFormat('fr-SN').format(num) + ' F'
}

export default function DiscoverTrendingBiens({
  biens,
}: {
  biens: TrendingBien[]
}) {
  const trackRef = useRef<HTMLDivElement>(null)

  if (!biens || biens.length === 0) return null

  const items = biens.slice(0, 12)

  const scrollLeft = () => {
    trackRef.current?.scrollBy({ left: -360, behavior: 'smooth' })
  }

  const scrollRight = () => {
    trackRef.current?.scrollBy({ left: 360, behavior: 'smooth' })
  }

  return (
    <div
      style={{
        marginBottom: 24,
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 16,
        padding: '14px 16px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}
    >
      <style>{`
        .pepites-track {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding-bottom: 4px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          width: 100%;
        }
        .pepites-track::-webkit-scrollbar {
          display: none;
        }
        .pepite-compact-card {
          flex: 0 0 180px;
          scroll-snap-align: start;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .pepite-compact-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
          border-color: #cbd5e1;
        }
        .pepite-img-box {
          height: 85px;
          position: relative;
          background: linear-gradient(135deg, #1C2B4A 0%, #152037 100%);
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .pepite-compact-card {
            flex: 0 0 155px !important;
          }
          .pepite-img-box {
            height: 75px !important;
          }
        }
      `}</style>

      {/* Header Carrousel avec flèches */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              background: '#fff7ed',
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={15} style={{ color: 'var(--accent, #C75B00)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 14.5,
                  fontWeight: 900,
                  color: '#0f172a',
                  lineHeight: 1.2,
                }}
              >
                Pépites Immobilières à la Une
              </h2>
              <span
                style={{
                  background: 'rgba(199, 91, 0, 0.1)',
                  color: 'var(--accent, #C75B00)',
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                {pluriel(items.length, 'bien')}
              </span>
            </div>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11,
                color: '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Glissez pour parcourir les mandats phares sans allonger la page
            </p>
          </div>
        </div>

        {/* Boutons Flèches Navigation */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Faire défiler vers la gauche"
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Faire défiler vers la droite"
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Track Horizontal Carrousel */}
      <div ref={trackRef} className="pepites-track">
        {items.map(bien => {
          const aSlug = bien.agence_slug || bien.agence_id
          const whatsappNum = (bien.agence_whatsapp || bien.agence_tel || '').replace(/[^0-9]/g, '')
          const words = (bien.agence_nom || 'Agence').trim().split(/\s+/)
          const aInitials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : (bien.agence_nom || 'AG').slice(0, 2).toUpperCase()
          const firstPhoto = Array.isArray(bien.photos) && bien.photos.length > 0 ? bien.photos[0] : null
          const isLocation = Boolean(bien.prix_location)
          const prixAffiche = isLocation ? formatPrixFCFA(bien.prix_location) : formatPrixFCFA(bien.prix_vente)
          const typeCapitalized = bien.type_bien ? bien.type_bien.charAt(0).toUpperCase() + bien.type_bien.slice(1) : 'Bien'

          return (
            <div key={bien.id} className="pepite-compact-card">
              {/* Photo compacte */}
              <div className="pepite-img-box">
                {firstPhoto ? (
                  <ExternalImg
                    src={firstPhoto}
                    alt={bien.titre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      padding: 6,
                      textAlign: 'center',
                    }}
                  >
                    <Building2 size={22} style={{ color: '#fed7aa', marginBottom: 2 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#f8fafc' }}>
                      {typeCapitalized}
                    </span>
                  </div>
                )}

                {/* Badge Type Transaction */}
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    background: isLocation ? 'rgba(199, 91, 0, 0.92)' : 'rgba(147, 51, 234, 0.92)',
                    color: '#fff',
                    fontSize: 8,
                    fontWeight: 800,
                    padding: '1.5px 5px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  {isLocation ? 'Location' : 'Vente'}
                </div>

                {/* Badge Meublé */}
                {bien.meuble && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(28, 43, 74, 0.88)',
                      color: '#fff',
                      fontSize: 8,
                      fontWeight: 700,
                      padding: '1.5px 5px',
                      borderRadius: 4,
                    }}
                  >
                    Meublé
                  </div>
                )}

                {/* Badge Quartier */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    left: 4,
                    background: 'rgba(15, 23, 42, 0.82)',
                    backdropFilter: 'blur(3px)',
                    color: '#ffffff',
                    padding: '2px 5px',
                    borderRadius: 4,
                    fontSize: 8.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    maxWidth: '90%',
                  }}
                >
                  <MapPin size={9} style={{ color: '#fed7aa', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bien.quartier || bien.ville}
                  </span>
                </div>
              </div>

              {/* Contenu compact */}
              <div
                style={{
                  padding: '7px 8px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: '0 0 3px',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#0f172a',
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={bien.titre}
                  >
                    {bien.titre}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 3 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        color: 'var(--price, #0A5C36)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {prixAffiche}
                    </span>
                    {isLocation && (
                      <span style={{ fontSize: 9.5, color: '#64748b', fontWeight: 600 }}>
                        /m
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 9.5,
                      color: '#64748b',
                      marginBottom: 6,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {bien.surface_m2 ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Maximize2 size={9} />
                        <b>{Math.round(Number(bien.surface_m2))} m²</b>
                      </span>
                    ) : null}
                    {bien.nb_chambres ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Bed size={10} />
                        <b>{bien.nb_chambres} ch.</b>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Footer compact : Agence + WhatsApp */}
                <div
                  style={{
                    paddingTop: 5,
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                  }}
                >
                  <Link
                    href={`/agences/${aSlug}`}
                    prefetch={false}
                    title={bien.agence_nom}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      textDecoration: 'none',
                      color: '#475569',
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 17,
                        height: 17,
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: 'var(--navy, #1C2B4A)',
                        color: '#fff',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        fontWeight: 800,
                      }}
                    >
                      <ExternalImg
                        src={bien.agence_logo}
                        alt={bien.agence_nom}
                        fallback={aInitials}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: '#1e293b',
                      }}
                    >
                      {bien.agence_nom}
                    </span>
                  </Link>

                  {whatsappNum && (
                    <a
                      href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent(
                        `Bonjour ${bien.agence_nom}, je vous contacte au sujet du bien : "${bien.titre}" (${prixAffiche}) vu sur Nopalou Immo.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: '#16a34a',
                        color: '#fff',
                        textDecoration: 'none',
                        flexShrink: 0,
                      }}
                      title="Contacter sur WhatsApp"
                    >
                      <MessageCircle size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

