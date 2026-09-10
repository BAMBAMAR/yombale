'use client'

import React from 'react'

interface PosSessionModalProps {
  caissierNom: string
  fondDeCaisseSaisi: string
  onChangeFondDeCaisse: (val: string) => void
  onDemarrerSession: () => void
  onClose: () => void
  formatPrice: (p: number) => string
}

export default function PosSessionModal({
  caissierNom,
  fondDeCaisseSaisi,
  onChangeFondDeCaisse,
  onDemarrerSession,
  onClose,
  formatPrice,
}: PosSessionModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 440, border: '2px solid #16a34a', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
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
            width: 32,
            height: 32,
            fontSize: 16,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, paddingRight: 34 }}>
          <span style={{ fontSize: 24 }}>🔑</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>Ouverture de Session POS</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Identifiez-vous et saisissez le fond de caisse initial.</p>
          </div>
        </div>

        <div style={{ marginBottom: 14, marginTop: 14 }}>
          <label style={{ fontSize: 12, color: '#334155', display: 'block', marginBottom: 4, fontWeight: 700 }}>Caissier Connecté</label>
          <div style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>👤</span> {caissierNom}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#334155', display: 'block', marginBottom: 6, fontWeight: 700 }}>Fond de Caisse de Départ (en FCFA)</label>
          <input
            type="number"
            value={fondDeCaisseSaisi}
            onChange={e => onChangeFondDeCaisse(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #16a34a', background: '#f0fdf4', color: '#166534', fontSize: 18, fontWeight: 800, boxSizing: 'border-box', textAlign: 'center' }}
          />

          {/* Présélections Rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8 }}>
            {['10000', '25000', '50000', '100000'].map(montant => (
              <button
                key={montant}
                onClick={() => onChangeFondDeCaisse(montant)}
                style={{
                  padding: '6px 4px', fontSize: 11, fontWeight: 800, borderRadius: 6, border: '1px solid #cbd5e1',
                  background: fondDeCaisseSaisi === montant ? '#16a34a' : '#f8fafc',
                  color: fondDeCaisseSaisi === montant ? '#fff' : '#334155',
                  cursor: 'pointer',
                }}
              >
                {formatPrice(Number(montant))}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={onDemarrerSession} style={{ flex: 1.5, padding: '12px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
            🚀 Démarrer la Session →
          </button>
        </div>
      </div>
    </div>
  )
}
