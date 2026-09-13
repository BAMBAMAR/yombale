'use client'

import React from 'react'
import { Printer, Eye, Download } from 'lucide-react'
import { PosSessionItem } from '../types'
import { fcfa } from '../utils'

interface ComptaRapportsZTableProps {
  loading: boolean
  sessions: PosSessionItem[]
  printingId: string | null
  onPrintRapportZ: (session: PosSessionItem) => void
  onOpenVentesModal: (session: PosSessionItem) => void
  onExportSessionCSV: (session: PosSessionItem) => void
}

export function ComptaRapportsZTable({
  loading,
  sessions,
  printingId,
  onPrintRapportZ,
  onOpenVentesModal,
  onExportSessionCSV,
}: ComptaRapportsZTableProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: 16, border: '1px dashed #cbd5e1', color: '#64748b' }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Aucune session de caisse trouvée</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
          Ajustez vos filtres de dates ou effectuez des encaissements sur la caisse POS pour générer des sessions.
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 16px' }}>Session & Caissier</th>
              <th style={{ padding: '12px 12px' }}>Horaires</th>
              <th style={{ padding: '12px 12px', textAlign: 'right' }}>Fond Initial</th>
              <th style={{ padding: '12px 12px', textAlign: 'right' }}>CA Encaissé</th>
              <th style={{ padding: '12px 12px', textAlign: 'right' }}>Espèces Comptées</th>
              <th style={{ padding: '12px 12px', textAlign: 'right' }}>Écart Caisse</th>
              <th style={{ padding: '12px 12px', textAlign: 'center' }}>Statut</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => {
              const ecart = Number(s.ecart_caisse || 0)
              const isCloturee = s.statut === 'cloturee'
              const isPrinting = printingId === s.id

              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{s.caissier_nom || 'Caissier Principal'}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>#{s.id.slice(0, 8)}</div>
                  </td>
                  <td style={{ padding: '14px 12px', fontSize: 12, color: '#475569' }}>
                    <div>{s.date_ouverture ? new Date(s.date_ouverture).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                    <div style={{ color: isCloturee ? '#64748b' : '#C75B00', fontWeight: isCloturee ? 400 : 700 }}>
                      {isCloturee ? `Clôture : ${new Date(s.date_cloture!).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : 'En cours'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                    {fcfa(s.fond_caisse_initial)}
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, color: '#1e3a8a' }}>{fcfa(s.ventes_total)}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{s.nb_ventes} tickets</div>
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {isCloturee ? fcfa(s.especes_comptees) : '—'}
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                    {isCloturee ? (
                      <span style={{
                        display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 800,
                        background: ecart === 0 ? '#f0fdf4' : ecart > 0 ? '#eff6ff' : '#fef2f2',
                        color: ecart === 0 ? '#15803d' : ecart > 0 ? '#1d4ed8' : '#dc2626'
                      }}>
                        {ecart >= 0 ? '+' : ''}{fcfa(ecart)}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                      background: isCloturee ? '#f0fdf4' : '#fff7ed',
                      color: isCloturee ? '#15803d' : '#C75B00',
                      border: `1px solid ${isCloturee ? '#bbf7d0' : '#fed7aa'}`
                    }}>
                      {isCloturee ? 'Clôturée Z' : 'En cours'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onPrintRapportZ(s)}
                        disabled={isPrinting}
                        style={{
                          padding: '6px 10px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa',
                          color: '#C75B00', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                        }}
                        title="Imprimer / Télécharger le Rapport Z en PDF"
                      >
                        <Printer size={13} /> Rapport Z
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenVentesModal(s)}
                        style={{
                          padding: '6px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #cbd5e1',
                          color: '#334155', fontWeight: 700, fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                        }}
                        title="Voir les tickets de la session"
                      >
                        <Eye size={13} /> Ventes
                      </button>
                      <button
                        type="button"
                        onClick={() => onExportSessionCSV(s)}
                        style={{
                          padding: '6px 8px', borderRadius: 8, background: '#f1f5f9', border: '1px solid #cbd5e1',
                          color: '#0f172a', fontWeight: 700, fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                        }}
                        title="Exporter les ventes de cette session en CSV"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
