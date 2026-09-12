'use client'

import React, { useState } from 'react'
import { Calendar, Eye, PhoneCall } from 'lucide-react'

interface HistoriquePoint {
  jour: string
  vues: string
  clics_tel: string
}

interface AnalyticsActivityChartProps {
  historique: HistoriquePoint[]
}

export default function AnalyticsActivityChart({ historique }: AnalyticsActivityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // On prend les 14 à 30 derniers points et on les ordonne chronologiquement
  const points = [...historique]
    .slice(0, 30)
    .reverse()

  if (points.length === 0) return null

  const maxVues = Math.max(...points.map(p => Number(p.vues) || 0), 5)
  const chartWidth = 600
  const chartHeight = 160
  const paddingX = 24
  const paddingY = 24
  const usableWidth = chartWidth - paddingX * 2
  const usableHeight = chartHeight - paddingY * 2

  const stepX = points.length > 1 ? usableWidth / (points.length - 1) : usableWidth

  // Calcul des coordonnées pour chaque point
  const coords = points.map((p, i) => {
    const v = Number(p.vues) || 0
    const x = paddingX + i * stepX
    const y = paddingY + usableHeight - (v / maxVues) * usableHeight
    return { x, y, v, data: p }
  })

  // Chemin SVG de la courbe
  const pathD = coords.reduce((acc, c, i) => {
    return i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`
  }, '')

  // Zone fermée pour le gradient
  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${chartHeight - paddingY} L ${coords[0].x} ${chartHeight - paddingY} Z`

  const activePoint = hoveredIndex !== null ? coords[hoveredIndex] : null

  return (
    <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 14, padding: '18px 20px', marginBottom: 20, boxShadow: 'var(--shadow-xs)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} style={{ color: 'var(--accent, #C75B00)' }} />
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Courbe de Fréquentation & Engagement (30j)
          </h4>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent, #C75B00)', fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent, #C75B00)' }} />
            Vues de la boutique
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', height: 'auto', minWidth: 380, display: 'block' }}
        >
          <defs>
            <linearGradient id="chartGradientNopalou" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C75B00" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#C75B00" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Lignes repères horizontales */}
          {[0, 0.5, 1].map((pct, idx) => {
            const y = paddingY + usableHeight * (1 - pct)
            const val = Math.round(maxVues * pct)
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#F1EAE2"
                  strokeDasharray={pct > 0 && pct < 1 ? '4 4' : undefined}
                />
                <text
                  x={paddingX - 4}
                  y={y + 3}
                  fontSize="9"
                  fill="#9C8E84"
                  textAnchor="end"
                  fontFamily="system-ui, sans-serif"
                >
                  {val}
                </text>
              </g>
            )
          })}

          {/* Aire de gradient */}
          <path d={areaD} fill="url(#chartGradientNopalou)" />

          {/* Ligne de courbe */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--accent, #C75B00)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points interactifs */}
          {coords.map((c, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Zone de touch invisible plus large */}
              <circle cx={c.x} cy={c.y} r="12" fill="transparent" />
              
              {/* Point visible */}
              <circle
                cx={c.x}
                cy={c.y}
                r={hoveredIndex === i ? '5' : '3'}
                fill="#ffffff"
                stroke="var(--accent, #C75B00)"
                strokeWidth={hoveredIndex === i ? '3' : '2'}
                style={{ transition: 'all 0.15s ease' }}
              />
            </g>
          ))}
        </svg>

        {/* Infobulle de survol interactive */}
        {activePoint && (
          <div
            style={{
              position: 'absolute',
              left: `${(activePoint.x / chartWidth) * 100}%`,
              top: 0,
              transform: 'translate(-50%, -10px)',
              background: 'var(--navy, #1C2B4A)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
              whiteSpace: 'nowrap',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <div style={{ color: '#fed7aa', fontSize: 10 }}>
              {new Date(activePoint.data.jour).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={12} style={{ color: '#ffa94d' }} />
              <span>{activePoint.v} vues</span>
              {Number(activePoint.data.clics_tel) > 0 && (
                <>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <PhoneCall size={12} style={{ color: '#4ade80' }} />
                  <span>{activePoint.data.clics_tel} contacts</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dates repères sous le graphique */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: `0 ${paddingX}px`, marginTop: 6, fontSize: 10.5, color: 'var(--text3, #9C8E84)' }}>
        <span>{new Date(points[0].jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
        {points.length > 2 && (
          <span>{new Date(points[Math.floor(points.length / 2)].jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
        )}
        <span>{new Date(points[points.length - 1].jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  )
}
