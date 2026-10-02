'use client'

import React from 'react'
import type { KalpeDette } from '../types'

interface KalpeModalRemboursementProps {
  detteToRembourser: KalpeDette | null
  montantRemboursement: string
  setMontantRemboursement: (v: string) => void
  setDetteToRembourser: (d: KalpeDette | null) => void
  handleValiderRemboursement: (e: React.FormEvent) => void
}

export function KalpeModalRemboursement({ detteToRembourser, montantRemboursement, setMontantRemboursement, setDetteToRembourser, handleValiderRemboursement }: KalpeModalRemboursementProps) {
  return (
    <>
      {detteToRembourser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(10, 20, 35, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setDetteToRembourser(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1C2B4A', margin: '0 0 8px 0' }}>
              Remboursement : {detteToRembourser.tiers_nom}
            </h3>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 16px 0' }}>
              Reste à régler : <strong>{detteToRembourser.montant_restant.toLocaleString('fr-FR')} FCFA</strong>
            </p>
            <form onSubmit={handleValiderRemboursement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A' }}>Montant réglé (FCFA)</label>
              <input
                type="number"
                required
                value={montantRemboursement}
                onChange={(e) => setMontantRemboursement(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1.5px solid #E8DDD2',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 800,
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setDetteToRembourser(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #E8DDD2',
                    background: '#F8F5F0',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0A5C36',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
