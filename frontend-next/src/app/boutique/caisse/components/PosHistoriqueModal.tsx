'use client'

import React from 'react'
import { Printer } from 'lucide-react'

export interface VenteHistoriqueItem {
  produit: {
    id: string
    nom: string
    prix: number
  }
  quantite: number
  prixUnitaire: number
}

export interface VenteHistorique {
  id: string
  date: string
  heure: string
  caissier: string
  modePaiement: string
  total: number
  statut: 'validee' | 'annulee'
  motifAnnulation?: string
  detailPaiementMixte?: { especes: number; autreMode: string; autreMontant: number }
  ticket: VenteHistoriqueItem[]
}

interface PosHistoriqueModalProps {
  historiqueVentes: VenteHistorique[]
  formatTicketThermique: '80mm' | '58mm'
  onChangeFormatTicket: (f: '80mm' | '58mm') => void
  btDeviceName: string | null
  onConnecterBluetooth: () => void
  onExporterCSV: () => void
  onExporterPDF: () => void
  onAnnulerRembourserVente: (id: string) => void
  onImprimerTicket: (v: VenteHistorique) => void
  onClose: () => void
  formatPrice: (p: number) => string
}

export default function PosHistoriqueModal({
  historiqueVentes,
  formatTicketThermique,
  onChangeFormatTicket,
  btDeviceName,
  onConnecterBluetooth,
  onExporterCSV,
  onExporterPDF,
  onAnnulerRembourserVente,
  onImprimerTicket,
  onClose,
  formatPrice,
}: PosHistoriqueModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 780, border: '1px solid #e2e8f0', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', position: 'relative' }}>
        
        {/* Bouton de Fermeture Top-Right Fixe */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: '#f1f5f9',
            border: 'none',
            color: '#0f172a',
            borderRadius: '50%',
            width: 36,
            height: 36,
            fontSize: 18,
            fontWeight: 900,
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Fermer la fenêtre"
        >
          ✕
        </button>

        {/* En-tête Modale */}
        <div style={{ marginBottom: 14, paddingRight: 40 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
            📜 Historique des Opérations &amp; Incidents de Caisse
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>Journal des encaissements, annulations et remboursements.</p>
        </div>

        {/* Barre d'outils et d'exports */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14, background: '#f8fafc', padding: 10, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <select
            value={formatTicketThermique}
            onChange={e => onChangeFormatTicket(e.target.value as any)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700, background: '#ffffff', color: '#0f172a' }}
          >
            <option value="80mm">🖨️ Format 80mm (Standard)</option>
            <option value="58mm">🖨️ Format 58mm (Poche)</option>
          </select>
          <button
            onClick={onConnecterBluetooth}
            style={{ background: btDeviceName ? '#f0fdf4' : '#f5f3ff', color: btDeviceName ? '#166534' : '#6d28d9', border: btDeviceName ? '1px solid #bbf7d0' : '1px solid #ddd6fe', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            title="Connecter une imprimante thermique Bluetooth direct ESC/POS"
          >
            📱 Bluetooth {btDeviceName ? `(${btDeviceName})` : ''}
          </button>
          <button
            onClick={onExporterCSV}
            style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            📥 Excel (CSV)
          </button>
          <button
            onClick={onExporterPDF}
            style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            📄 Imprimer PDF
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {historiqueVentes.map(v => (
            <div key={v.id} style={{ background: '#f8fafc', border: v.statut === 'annulee' ? '1px solid #fecaca' : '1px solid #e2e8f0', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{v.id}</span>
                  <span style={{ fontSize: 11, background: v.statut === 'annulee' ? '#fef2f2' : '#eff6ff', color: v.statut === 'annulee' ? '#991b1b' : '#1d4ed8', border: v.statut === 'annulee' ? '1px solid #fecaca' : '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                    {v.statut === 'annulee' ? '❌ ANNULÉ / REMBOURSÉ' : v.modePaiement.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                  📅 {v.date} à {v.heure} • {v.caissier}
                </p>
                {v.motifAnnulation && (
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#dc2626', fontStyle: 'italic' }}>
                    Motif: {v.motifAnnulation}
                  </p>
                )}
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#334155' }}>
                  Articles: {v.ticket.map(i => `${i.quantite}x ${i.produit.nom}`).join(', ')}
                </p>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: v.statut === 'annulee' ? '#dc2626' : '#16a34a' }}>
                  {v.statut === 'annulee' ? `-${formatPrice(v.total)}` : formatPrice(v.total)}
                </span>

                <div style={{ display: 'flex', gap: 6 }}>
                  {v.statut !== 'annulee' && (
                    <button
                      onClick={() => onAnnulerRembourserVente(v.id)}
                      style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      ❌ Annuler / Rembourser
                    </button>
                  )}
                  <button
                    onClick={() => onImprimerTicket(v)}
                    style={{ background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Printer size={12} /> Ticket Thermique
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pied de Modale avec Bouton Fermer */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
          >
            Fermer la fenêtre
          </button>
        </div>
      </div>
    </div>
  )
}
