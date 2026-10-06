'use client'

import React from 'react'
import { GraduationCap, Plus, Trash2 } from 'lucide-react'
import type { ProfilFormation } from './SurgaProfilProTab'

interface SurgaProfilProFormationsProps {
  formations: ProfilFormation[]
  onAjouter: () => void
  onMaj: (index: number, champ: keyof ProfilFormation, valeur: any) => void
  onSupprimer: (index: number) => void
}

export default function SurgaProfilProFormations({
  formations,
  onAjouter,
  onMaj,
  onSupprimer,
}: SurgaProfilProFormationsProps) {
  return (
    <div className="surga-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GraduationCap size={18} color="var(--surga-accent, #D97706)" />
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--surga-primary, #0F172A)', margin: 0 }}>
            Formations &amp; Diplômes
          </h3>
        </div>
        <button
          type="button"
          onClick={onAjouter}
          className="surga-btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: 12, fontWeight: 700, minHeight: 34 }}
        >
          <Plus size={14} />
          <span>Ajouter</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {formations?.map((form, idx) => (
          <div
            key={idx}
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: 'var(--surga-bg, #F8FAFC)',
              border: '1px solid var(--surga-border, #E2E8F0)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-primary, #0F172A)' }}>Diplôme #{idx + 1}</span>
              <button
                type="button"
                onClick={() => onSupprimer(idx)}
                style={{ padding: '4px 8px', color: 'var(--surga-danger, #DC2626)', border: 'none', background: 'none', cursor: 'pointer' }}
                aria-label={`Supprimer diplôme ${idx + 1}`}
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
              <input
                type="text"
                placeholder="Intitulé du diplôme *"
                value={form.diplome}
                onChange={(e) => onMaj(idx, 'diplome', e.target.value)}
                style={{
                  padding: '8px 10px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid var(--surga-border, #E2E8F0)',
                  backgroundColor: '#FFFFFF',
                  boxSizing: 'border-box',
                }}
              />
              <input
                type="text"
                placeholder="Établissement / Université *"
                value={form.etablissement}
                onChange={(e) => onMaj(idx, 'etablissement', e.target.value)}
                style={{
                  padding: '8px 10px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid var(--surga-border, #E2E8F0)',
                  backgroundColor: '#FFFFFF',
                  boxSizing: 'border-box',
                }}
              />
              <input
                type="text"
                placeholder="Année d'obtention (ex: 2020)"
                value={form.annee}
                onChange={(e) => onMaj(idx, 'annee', e.target.value)}
                style={{
                  padding: '8px 10px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid var(--surga-border, #E2E8F0)',
                  backgroundColor: '#FFFFFF',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        ))}
        {(!formations || formations.length === 0) && (
          <p style={{ fontSize: 13, color: 'var(--surga-text3, #94A3B8)', margin: 0, fontStyle: 'italic' }}>
            Aucune formation renseignée. Cliquez sur &quot;Ajouter&quot;.
          </p>
        )}
      </div>
    </div>
  )
}
