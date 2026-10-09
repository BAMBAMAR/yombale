'use client'

import React from 'react'
import { Newspaper } from 'lucide-react'
import { heureCourte } from '@/lib/surga-trafic'
import type { AlertePresseTrafic } from '@/lib/surga-trafic'

// D73 : ce que la presse a publié sur la circulation ces dernières heures. Chaque ligne porte sa source et son heure
// de publication, et mène à l'article. Ce sont des faits rapportés, pas une mesure du trafic.
// « 14 h 05 » pour un article du jour, « 7 oct. à 22 h 10 » sinon (heure de Dakar).
function quand(iso: string): string {
  const heure = heureCourte(iso)
  if (!heure) return ''
  const jour = (d: Date) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Africa/Dakar' }).format(d)
  const j = jour(new Date(iso))
  return j === jour(new Date()) ? heure : `${j} à ${heure}`
}

export default function SurgaTraficAlertesPresse({ alertes }: { alertes: AlertePresseTrafic[] }) {
  if (!alertes || alertes.length === 0) return null
  return (
    <div style={{ margin: '8px 14px 0', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--surga-border, #E2E8F0)', backgroundColor: 'var(--surga-bg, #F8FAFC)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--surga-primary, #0F172A)', marginBottom: 4 }}>
        <Newspaper size={13} />
        <span>Circulation : dans la presse</span>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alertes.map((a) => (
          <li key={a.url} style={{ minWidth: 0 }}>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--surga-text1, #0F172A)', textDecoration: 'none', wordBreak: 'break-word' }}
            >
              {a.titre}
            </a>
            <div style={{ fontSize: 12, color: 'var(--surga-text3, #64748B)', whiteSpace: 'nowrap' }}>
              {a.source}{quand(a.publie_le) ? ` · ${quand(a.publie_le)}` : ''}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
