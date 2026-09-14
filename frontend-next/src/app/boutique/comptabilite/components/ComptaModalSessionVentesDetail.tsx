'use client'

import React from 'react'
import { PosSessionItem } from '../types'
import { fcfa } from '../utils'

interface ComptaModalSessionVentesDetailProps {
  modalSessionVentes: { session: PosSessionItem; ventes: any[] } | null
  loadingVentes: boolean
  onClose: () => void
  onExportCSV: (session: PosSessionItem) => void
  onPrintRapportZ: (session: PosSessionItem) => void
}

export function ComptaModalSessionVentesDetail({
  modalSessionVentes,
  loadingVentes,
  onClose,
  onExportCSV,
  onPrintRapportZ,
}: ComptaModalSessionVentesDetailProps) {
  if (!modalSessionVentes) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
      <div style={{ background: '#ffffff', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header Modal */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
              Ventes de la Session #{modalSessionVentes.session.id.slice(0, 8)}
            </h4>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
              Caissier : <strong>{modalSessionVentes.session.caissier_nom}</strong> · {modalSessionVentes.ventes.length} ticket(s) réalisé(s)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, color: '#64748b', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Contenu Modal */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loadingVentes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 45, borderRadius: 8 }} />
              ))}
            </div>
          ) : modalSessionVentes.ventes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: 13.5 }}>
              Aucune vente enregistrée dans l'intervalle de cette session.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Heure</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Référence</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Article</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qté</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Montant</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Règlement</th>
                </tr>
              </thead>
              <tbody>
                {modalSessionVentes.ventes.map((v: any, idx: number) => (
                  <tr key={v.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 10px', color: '#64748b' }}>
                      {v.created_at ? new Date(v.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0f172a' }}>{v.reference || '—'}</td>
                    <td style={{ padding: '10px 10px' }}>{v.nom_produit || 'Article'}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 600 }}>{v.quantite || 1}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 800, color: '#1e3a8a' }}>{fcfa(v.montant_total)}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                      <span style={{ padding: '2px 6px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', background: '#f1f5f9', color: '#334155' }}>
                        {v.methode_paiement || 'cash'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Modal */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => onExportCSV(modalSessionVentes.session)}
            style={{ padding: '8px 14px', borderRadius: 8, background: '#fff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            Exporter en CSV
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => onPrintRapportZ(modalSessionVentes.session)}
              style={{ padding: '8px 16px', borderRadius: 8, background: '#C75B00', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
            >
              Imprimer Rapport Z
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 14px', borderRadius: 8, background: '#e2e8f0', color: '#334155', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
