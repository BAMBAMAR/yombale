import React from 'react'
import { fcfa } from '@/lib/format'
import { HistoriquePoint } from './types'

interface HistoriqueChartProps {
  data: HistoriquePoint[]
}

export default function HistoriqueChart({ data }: HistoriqueChartProps) {
  if (data.length < 2) return null

  const W = 600
  const H = 160
  const PAD = { t: 16, r: 16, b: 32, l: 64 }
  const pts = data
    .map(d => ({
      jour: d.jour,
      min: parseFloat(d.prix_min),
      max: parseFloat(d.prix_max),
    }))
    .filter(p => p.min > 0)

  if (pts.length < 2) return null

  const allPrix = pts.flatMap(p => [p.min, p.max])
  const yMin = Math.min(...allPrix)
  const yMax = Math.max(...allPrix)
  const yRange = yMax - yMin || 1

  const xScale = (i: number) => PAD.l + (i / (pts.length - 1)) * (W - PAD.l - PAD.r)
  const yScale = (v: number) => PAD.t + (1 - (v - yMin) / yRange) * (H - PAD.t - PAD.b)

  const minLine = pts.map((p, i) => `${xScale(i)},${yScale(p.min)}`).join(' ')
  const areaPath = [
    ...pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.min)}`),
    ...pts.map((p, i) => `${i === 0 ? 'L' : 'L'}${xScale(pts.length - 1 - i)},${yScale(pts[pts.length - 1 - i].min)}`).reverse(),
    'Z',
  ].join(' ')

  const labelsX: { x: number; label: string }[] = []
  const step = Math.max(1, Math.floor(pts.length / 4))
  for (let i = 0; i < pts.length; i += step) {
    const d = new Date(pts[i].jour)
    labelsX.push({ x: xScale(i), label: `${d.getDate()}/${d.getMonth() + 1}` })
  }

  const labelsY = [yMin, yMin + yRange / 2, yMax].map(v => ({
    y: yScale(v),
    label: fcfa(Math.round(v)),
  }))

  const currentMin = pts[pts.length - 1].min
  const startMin = pts[0].min
  const variation = startMin > 0 ? ((currentMin - startMin) / startMin) * 100 : 0

  return (
    <div className="historique-section">
      <div className="historique-header">
        <h2 className="offres-titre">
          Historique des prix <span>{pts.length} jours</span>
        </h2>
        <span className={`historique-variation ${variation <= 0 ? 'historique-variation--good' : 'historique-variation--bad'}`}>
          {variation <= 0 ? '↓' : '↑'} {Math.abs(variation).toFixed(1)}%
        </span>
      </div>
      <div className="historique-stats-row">
        <div className="historique-stat">
          <span>Prix actuel</span>
          <strong>{fcfa(currentMin)}</strong>
        </div>
        <div className="historique-stat">
          <span>Plus bas ({pts.length}j)</span>
          <strong className="historique-stat--green">{fcfa(Math.min(...pts.map(p => p.min)))}</strong>
        </div>
        <div className="historique-stat">
          <span>Plus haut ({pts.length}j)</span>
          <strong>{fcfa(Math.max(...pts.map(p => p.min)))}</strong>
        </div>
      </div>
      <div className="historique-chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="historique-svg">
          {/* Grille horizontale */}
          {labelsY.map((l, i) => (
            <line key={i} x1={PAD.l} y1={l.y} x2={W - PAD.r} y2={l.y} stroke="#E8DDD2" strokeWidth="1" strokeDasharray="4 4" />
          ))}
          {/* Zone sous la courbe */}
          <path d={areaPath} fill="rgba(10,92,54,0.08)" />
          {/* Ligne prix min */}
          <polyline points={minLine} fill="none" stroke="#0A5C36" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {/* Labels Y */}
          {labelsY.map((l, i) => (
            <text key={i} x={PAD.l - 6} y={l.y + 4} textAnchor="end" fontSize="10" fill="#9C8E84">
              {l.label}
            </text>
          ))}
          {/* Labels X */}
          {labelsX.map((l, i) => (
            <text key={i} x={l.x} y={H - 4} textAnchor="middle" fontSize="10" fill="#9C8E84">
              {l.label}
            </text>
          ))}
          {/* Point actuel */}
          <circle cx={xScale(pts.length - 1)} cy={yScale(currentMin)} r="4" fill="#0A5C36" />
        </svg>
      </div>
    </div>
  )
}
