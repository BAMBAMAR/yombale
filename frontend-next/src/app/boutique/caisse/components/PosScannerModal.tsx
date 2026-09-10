'use client'

import React from 'react'
import { Camera } from 'lucide-react'

interface PosScannerModalProps {
  scannerTorcheActive: boolean
  onToggleTorche: () => void
  onClose: () => void
  scannerFlashActif: boolean
  scannerCameraStatus: string
  scannerDernierItem: { nom: string; prix: number } | null
  panierArticlesCount: number
  panierTotal: number
  formatPrice: (p: number) => string
}

export default function PosScannerModal({
  scannerTorcheActive,
  onToggleTorche,
  onClose,
  scannerFlashActif,
  scannerCameraStatus,
  scannerDernierItem,
  panierArticlesCount,
  panierTotal,
  formatPrice,
}: PosScannerModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px 20px 16px', width: '100%', maxWidth: 460, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={18} style={{ color: '#C75B00' }} /> Scanner Caisse (Mode Rafale)
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={onToggleTorche}
              style={{ background: scannerTorcheActive ? '#fef08a' : '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 8px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              title="Allumer la lampe torche"
            >
              <span>🔦</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{scannerTorcheActive ? 'ON' : 'OFF'}</span>
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>✕</button>
          </div>
        </div>

        {/* Viseur Caméra avec Laser et Flash de confirmation */}
        <div style={{ position: 'relative', width: '100%', minHeight: 250, height: 260, borderRadius: 14, overflow: 'hidden', background: '#000', border: scannerFlashActif ? '3px solid #22c55e' : '1px solid #1e293b', transition: 'border 0.15s ease' }}>
          <div id="nopalou-reader-scanner" style={{ width: '100%', height: '100%' }} />
          {scannerFlashActif && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(34, 197, 94, 0.18)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ background: '#15803d', color: '#fff', padding: '6px 14px', borderRadius: 20, fontWeight: 900, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                ✓ BIP VALIDÉ
              </span>
            </div>
          )}
        </div>

        {/* Statut & Dernier article scanné */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: scannerFlashActif ? '#16a34a' : '#0f172a' }}>
            {scannerCameraStatus}
          </span>
          {scannerDernierItem && (
            <span style={{ fontSize: 11.5, color: '#475569', fontWeight: 600 }}>
              Dernier ajout : <strong>{scannerDernierItem.nom}</strong> ({formatPrice(scannerDernierItem.prix)})
            </span>
          )}
        </div>

        {/* Résumé Panier en direct */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '8px 14px' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Panier actuel</span>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#047857' }}>
              {panierArticlesCount} article(s) • {formatPrice(panierTotal)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
          >
            Valider le panier →
          </button>
        </div>
      </div>
    </div>
  )
}
