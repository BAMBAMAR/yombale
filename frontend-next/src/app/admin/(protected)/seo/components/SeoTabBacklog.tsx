// frontend-next/src/app/admin/(protected)/seo/components/SeoTabBacklog.tsx
'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCode,
  ShieldCheck,
  Filter,
  Check
} from 'lucide-react'
import { AuditCorrectionItem, StatutCorrection } from '../types'
import { AUDIT_BACKLOG_ITEMS } from '../data/audit-backlog'

export default function SeoTabBacklog() {
  const [items] = useState<AuditCorrectionItem[]>(AUDIT_BACKLOG_ITEMS)
  const [filtreStatut, setFiltreStatut] = useState<string>('TOUS')
  const [filtreGravite, setFiltreGravite] = useState<string>('TOUTES')

  const itemsFiltres = items.filter((item) => {
    if (filtreStatut !== 'TOUS' && item.statut !== filtreStatut) return false
    if (filtreGravite !== 'TOUTES' && item.priorite !== filtreGravite) return false
    return true
  })

  const countValides = items.filter((i) => i.statut === 'VALIDÉ').length
  const countBloques = items.filter((i) => i.statut === 'BLOQUÉ').length
  const countTotal = items.length

  const badgeStatut = (statut: StatutCorrection) => {
    switch (statut) {
      case 'VALIDÉ':
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' }
      case 'CORRIGÉ':
      case 'À REVALIDER':
        return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' }
      case 'EN COURS':
        return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' }
      case 'BLOQUÉ':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' }
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* En-tête KPI Backlog */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16
      }}>
        <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Anomalies Traitées</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginTop: 4 }}>
            {countTotal}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Exigences & Fautes de l'Audit 0-11</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Résolues & Validées</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {countValides} / {countTotal}
          </div>
          <div style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={13} /> {Math.round((countValides / countTotal) * 100)}% de succès testé
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bloquées / Tranche 2</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent, #C75B00)', marginTop: 4 }}>
            {countBloques}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Sous-hub Climatiseurs (BLOQ-03)</div>
        </div>
      </div>

      {/* Barre de filtre */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: '#ffffff',
        padding: '12px 16px',
        borderRadius: 10,
        border: '1px solid var(--border, #E8DDD2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>Cycle de vie :</span>
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#ffffff',
              outline: 'none'
            }}
          >
            <option value="TOUS">Tous les statuts de correction</option>
            <option value="VALIDÉ">VALIDÉ (Preuve fournie)</option>
            <option value="À REVALIDER">À REVALIDER</option>
            <option value="EN COURS">EN COURS</option>
            <option value="BLOQUÉ">BLOQUÉ</option>
          </select>

          <select
            value={filtreGravite}
            onChange={(e) => setFiltreGravite(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#ffffff',
              outline: 'none'
            }}
          >
            <option value="TOUTES">Toutes les gravités</option>
            <option value="P0">P0 (Critique)</option>
            <option value="P1">P1 (Majeure)</option>
            <option value="P2">P2 (Mineure)</option>
          </select>
        </div>

        <div style={{ fontSize: 12, color: '#64748b' }}>
          Affichage de {itemsFiltres.length} action(s)
        </div>
      </div>

      {/* Liste détaillée du registre */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {itemsFiltres.map((item) => {
          const b = badgeStatut(item.statut)
          return (
            <div
              key={item.id}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 10,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: 13,
                    color: 'var(--navy, #1C2B4A)',
                    background: '#f1f5f9',
                    padding: '3px 8px',
                    borderRadius: 6
                  }}>
                    {item.id}
                  </span>
                  <span className={`admin-badge ${item.priorite === 'P0' ? 'admin-badge--orange' : item.priorite === 'P1' ? 'admin-badge--blue' : 'admin-badge--gray'}`}>
                    {item.priorite}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                    {item.titre}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 12,
                    background: b.bg,
                    color: b.text,
                    border: `1px solid ${b.border}`
                  }}>
                    {item.statut}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: item.resultatTest === 'PASS' ? '#ecfdf5' : '#fee2e2',
                    color: item.resultatTest === 'PASS' ? '#065f46' : '#991b1b'
                  }}>
                    Test: {item.resultatTest}
                  </span>
                </div>
              </div>

              {/* Grille explicative Cause / Action */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 12,
                fontSize: 13,
                background: '#f8fafc',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <strong style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                    Preuve Initiale & Cause Démontrée
                  </strong>
                  <div style={{ color: '#334155' }}>{item.preuveInitiale}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Cause : {item.causeDemontree}</div>
                </div>

                <div>
                  <strong style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                    Action Corrective Réalisée
                  </strong>
                  <div style={{ color: '#065f46', fontWeight: 600 }}>{item.actionCorrective}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                    Fichiers : <code>{item.fichiers.join(', ')}</code>
                  </div>
                </div>
              </div>

              {/* Risque résiduel */}
              <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Risque résiduel / Revalidation :</span>
                <span>{item.risqueResiduel}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
