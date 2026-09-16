'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  MapPin,
  Building2,
  ExternalLink,
  Compass,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react'
import type { AnnonceImmo } from './ImmoCard'
import { DAKAR_ZONES, formatPrixCompact, resolveCoordinates } from './ImmoMapConfig'

export default function ImmoInteractiveMap({ annonces }: { annonces: AnnonceImmo[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeZone, setActiveZone] = useState<string>('all')
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  const mappedBiens = useMemo(() => {
    return annonces.map(a => {
      const coords = resolveCoordinates(a)
      return {
        annonce: a,
        ...coords,
      }
    })
  }, [annonces])

  const filteredBiens = useMemo(() => {
    if (activeZone === 'all') return mappedBiens
    const zone = DAKAR_ZONES.find(z => z.id === activeZone)
    if (!zone) return mappedBiens
    return mappedBiens.filter(b => zone.aliases.some(alias => b.zoneName.toLowerCase().includes(alias)))
  }, [mappedBiens, activeZone])

  const selectedBien = useMemo(() => {
    return mappedBiens.find(b => b.annonce.id === selectedId) || null
  }, [mappedBiens, selectedId])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: '#FFFFFF',
        border: '1.5px solid var(--border, #E8DDD2)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 28,
        boxShadow: '0 4px 20px rgba(28,43,74,0.06)',
      }}
    >
      {/* Barre de contrôle carte */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border, #E8DDD2)',
          paddingBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--navy, #1C2B4A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <Compass size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy, #1C2B4A)' }}>
              Carte Interactive PropTech
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>
              {filteredBiens.length} bien{filteredBiens.length > 1 ? 's' : ''} géolocalisé{filteredBiens.length > 1 ? 's' : ''} à Dakar & Régions
            </div>
          </div>
        </div>

        {/* Sélecteur de zones rapides */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => { setActiveZone('all'); setSelectedId(null) }}
            style={{
              padding: '5px 10px',
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              border: activeZone === 'all' ? '1.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
              background: activeZone === 'all' ? 'var(--accent, #C75B00)' : '#FAF8F5',
              color: activeZone === 'all' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
              transition: 'all 0.15s ease',
            }}
          >
            Tous ({mappedBiens.length})
          </button>
          {['almadies', 'mermoz', 'plateau', 'saly'].map(zid => {
            const z = DAKAR_ZONES.find(item => item.id === zid)
            if (!z) return null
            const count = mappedBiens.filter(b => z.aliases.some(al => b.zoneName.toLowerCase().includes(al))).length
            return (
              <button
                key={zid}
                type="button"
                onClick={() => { setActiveZone(zid); setSelectedId(null) }}
                style={{
                  padding: '5px 10px',
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: activeZone === zid ? '1.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                  background: activeZone === zid ? 'var(--accent, #C75B00)' : '#FAF8F5',
                  color: activeZone === zid ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                  transition: 'all 0.15s ease',
                }}
              >
                {z.label} {count > 0 ? `(${count})` : ''}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteneur Vue Cartographique SVG Responsive */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 440,
          background: 'radial-gradient(ellipse at center, #F4F7FB 0%, #E8EEF5 100%)',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        {/* Fond cartographique vectoriel stylisé de la presqu'île du Cap-Vert */}
        <svg
          viewBox="0 0 1000 600"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            transform: `scale(${zoomLevel})`,
            transformOrigin: '45% 45%',
            transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <defs>
            <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2EAF2" />
              <stop offset="100%" stopColor="#D5E1ED" />
            </linearGradient>
            <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F9F8F5" />
            </linearGradient>
          </defs>

          {/* Océan Atlantique */}
          <rect width="1000" height="600" fill="url(#oceanGrad)" />

          {/* Silhouette stylisée de la Presqu'île de Dakar et littoral Petite Côte */}
          <path
            d="M 120,130 C 150,110 240,90 350,110 C 450,130 550,140 650,180 C 750,220 850,270 950,320 L 1000,600 L 750,600 C 700,520 620,480 550,450 C 480,420 400,380 320,330 C 260,290 190,260 140,220 C 100,190 90,150 120,130 Z"
            fill="url(#landGrad)"
            stroke="#D0D9E4"
            strokeWidth="3"
          />

          {/* Côtes et baie de Hann */}
          <path
            d="M 350,110 Q 420,200 490,260 T 560,340"
            fill="none"
            stroke="#BCCCDA"
            strokeWidth="2"
            strokeDasharray="4,4"
          />

          {/* Principaux axes routiers (Autoroute de l'Avenir / VDN) */}
          <path d="M 150,140 Q 280,240 450,280 T 800,380" fill="none" stroke="#E2DDD4" strokeWidth="6" />
          <path d="M 280,240 Q 400,340 520,440" fill="none" stroke="#E2DDD4" strokeWidth="4" />

          {/* Repères des principaux quartiers */}
          {DAKAR_ZONES.map(z => (
            <g key={z.id} transform={`translate(${z.x * 10}, ${z.y * 6})`}>
              <circle r="4" fill="#94A3B8" opacity="0.6" />
              <text
                x="8"
                y="4"
                fill="#64748B"
                fontSize="11"
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
              >
                {z.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Pins des Biens Immobiliers */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: `scale(${zoomLevel})`,
            transformOrigin: '45% 45%',
            transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {filteredBiens.map(({ annonce, x, y }) => {
            const isSelected = selectedId === annonce.id
            const isPro = !!annonce.agence_nom

            return (
              <button
                key={annonce.id}
                type="button"
                onClick={() => setSelectedId(annonce.id)}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  background: isSelected
                    ? 'var(--accent, #C75B00)'
                    : isPro
                    ? 'var(--navy, #1C2B4A)'
                    : '#FFFFFF',
                  color: isSelected || isPro ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                  border: isSelected
                    ? '2px solid #FFFFFF'
                    : isPro
                    ? '1.5px solid #FFFFFF'
                    : '1.5px solid var(--border, #E8DDD2)',
                  borderRadius: 20,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: isSelected
                    ? '0 4px 14px rgba(199,91,0,0.45)'
                    : '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: isSelected ? 30 : 10,
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  whiteSpace: 'nowrap',
                }}
                aria-label={`${annonce.titre} — ${annonce.prix} FCFA`}
              >
                <MapPin size={11} />
                <span>{formatPrixCompact(annonce.prix)}</span>
              </button>
            )
          })}
        </div>

        {/* Boutons Zoom Controls */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            zIndex: 40,
          }}
        >
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.2))}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--navy, #1C2B4A)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
            aria-label="Zoom avant"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.2))}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--navy, #1C2B4A)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
            aria-label="Zoom arrière"
          >
            <ZoomOut size={16} />
          </button>
        </div>

        {/* Carte Pop-up Preview quand un bien est sélectionné */}
        {selectedBien && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              maxWidth: 320,
              background: '#FFFFFF',
              borderRadius: 12,
              padding: 12,
              boxShadow: '0 8px 24px rgba(28,43,74,0.18)',
              border: '1.5px solid var(--border, #E8DDD2)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)', lineHeight: 1.3 }}>
                {selectedBien.annonce.titre}
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  color: '#9CA3AF',
                }}
                aria-label="Fermer la prévisualisation"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--price, #0A5C36)' }}>
                {selectedBien.annonce.prix
                  ? `${new Intl.NumberFormat('fr-FR').format(selectedBien.annonce.prix)} FCFA`
                  : 'Prix sur demande'}
              </span>
              {selectedBien.annonce.transaction === 'location' && (
                <span style={{ fontSize: 11, color: '#6B7280' }}>/mois</span>
              )}
            </div>

            <div style={{ fontSize: 11.5, color: '#4B5563', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={12} style={{ color: 'var(--accent, #C75B00)' }} />
                {selectedBien.annonce.quartier || selectedBien.annonce.ville || 'Dakar'}
              </span>
              {selectedBien.annonce.surface_m2 && (
                <span>· {Math.round(selectedBien.annonce.surface_m2)} m²</span>
              )}
              {selectedBien.annonce.nb_chambres && (
                <span>· {selectedBien.annonce.nb_chambres} ch</span>
              )}
            </div>

            {selectedBien.annonce.agence_nom && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--navy, #1C2B4A)',
                  background: '#F1F5F9',
                  padding: '3px 7px',
                  borderRadius: 6,
                }}
              >
                <Building2 size={12} style={{ color: 'var(--accent, #C75B00)' }} />
                <span>{selectedBien.annonce.agence_nom}</span>
              </div>
            )}

            <Link
              href={`/immo/${selectedBien.annonce.id}`}
              style={{
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 8,
                background: 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 750,
                textDecoration: 'none',
              }}
            >
              <span>Consulter la fiche complète</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
