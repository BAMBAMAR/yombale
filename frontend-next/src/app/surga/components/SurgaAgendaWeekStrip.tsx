'use client'

import React, { useMemo } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { type SurgaEvenement } from '@/lib/surga-offline-sync'

interface SurgaAgendaWeekStripProps {
  dateSelectionnee: string // YYYY-MM-DD
  onSelectionnerDate: (dateStr: string) => void
  evenements: SurgaEvenement[]
}

const JOURS_ABREV = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default function SurgaAgendaWeekStrip({
  dateSelectionnee,
  onSelectionnerDate,
  evenements,
}: SurgaAgendaWeekStripProps) {
  const aujourdhuiStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // Calcul des 7 jours de la semaine courante (du Lundi au Dimanche)
  const joursSemaine = useMemo(() => {
    const d = new Date(dateSelectionnee || aujourdhuiStr)
    const jourSemaine = d.getDay() // 0 = Dimanche, 1 = Lundi
    const diffToMonday = (jourSemaine + 6) % 7 // distance par rapport au Lundi
    const lundi = new Date(d)
    lundi.setDate(d.getDate() - diffToMonday)

    const result = []
    for (let i = 0; i < 7; i++) {
      const cur = new Date(lundi)
      cur.setDate(lundi.getDate() + i)
      const isoStr = cur.toISOString().slice(0, 10)
      const dayNum = cur.getDate()
      const dayName = JOURS_ABREV[cur.getDay()]
      const count = evenements.filter((e) => e.date_evenement === isoStr && !e.termine).length
      result.push({ isoStr, dayNum, dayName, count, isToday: isoStr === aujourdhuiStr })
    }
    return result
  }, [dateSelectionnee, aujourdhuiStr, evenements])

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: '10px 12px',
        border: '1px solid var(--border, #E8DDD2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
          <Calendar size={14} color="var(--accent, #C75B00)" />
          <span>Semaine en cours</span>
        </div>

        {dateSelectionnee !== aujourdhuiStr && (
          <button
            type="button"
            onClick={() => onSelectionnerDate(aujourdhuiStr)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--surga-accent-ink, #A64B08)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '2px 6px',
            }}
          >
            Aujourd’hui
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {joursSemaine.map((j) => {
          const estSelectionne = dateSelectionnee === j.isoStr
          return (
            <button
              key={j.isoStr}
              type="button"
              onClick={() => onSelectionnerDate(j.isoStr)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 2px',
                borderRadius: 10,
                border: '1px solid',
                borderColor: estSelectionne
                  ? 'var(--navy, #1C2B4A)'
                  : j.isToday
                  ? 'var(--accent, #C75B00)'
                  : 'transparent',
                backgroundColor: estSelectionne
                  ? 'var(--navy, #1C2B4A)'
                  : j.isToday
                  ? 'rgba(199, 91, 0, 0.08)'
                  : '#F8F5F0',
                color: estSelectionne
                  ? '#FFFFFF'
                  : j.isToday
                  ? 'var(--accent, #C75B00)'
                  : 'var(--navy, #1C2B4A)',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, opacity: estSelectionne ? 0.85 : 0.65 }}>
                {j.dayName}
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>
                {j.dayNum}
              </span>

              {/* Point indicateur si événement prévu */}
              {j.count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 3,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: estSelectionne ? '#FFFFFF' : 'var(--accent, #C75B00)',
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
