'use client'

import React from 'react'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import type { MouvementCaisse } from './PosTiroirCaisseModal'

interface PosTiroirHistoriqueListProps {
  loadingMouvements: boolean
  mouvements: MouvementCaisse[]
  fcfa: (val: number) => string
}

export default function PosTiroirHistoriqueList({
  loadingMouvements,
  mouvements,
  fcfa,
}: PosTiroirHistoriqueListProps) {
  if (loadingMouvements) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        Chargement des mouvements...
      </div>
    )
  }

  if (mouvements.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        Aucun mouvement d&apos;espèces enregistré pour cette session.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
      {mouvements.map((m) => {
        const isSortie = m.type === 'sortie'
        return (
          <div
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isSortie ? '#fef2f2' : '#f0fdf4',
                  color: isSortie ? '#dc2626' : '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isSortie ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{m.motif}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {m.beneficiaire ? `Bénéficiaire : ${m.beneficiaire} • ` : ''}
                  Par {m.caissier_nom}
                  {m.created_at
                    ? ` • ${new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                    : ''}
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: isSortie ? '#dc2626' : '#16a34a',
              }}
            >
              {isSortie ? '-' : '+'}{fcfa(Number(m.montant))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
