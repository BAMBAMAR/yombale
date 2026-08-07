'use client'

import React from 'react'

export default function GarantiesAcheteurBadge() {
  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      padding: '12px 14px',
      marginTop: 16,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 10,
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 18 }}>🛡️</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B' }}>Garantie Acheteur</span>
        <span style={{ fontSize: 10, color: '#64748b' }}>Satisfait ou Échangé 48h</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: 18 }}>🔒</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B' }}>Paiement Sécurisé</span>
        <span style={{ fontSize: 10, color: '#64748b' }}>Wave, OM, Carte, Cash</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 18 }}>🚚</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B' }}>Livraison Rapide</span>
        <span style={{ fontSize: 10, color: '#64748b' }}>Dakar & Régions</span>
      </div>
    </div>
  )
}
