'use client'

import React, { useState } from 'react'
import { fcfa } from '@/lib/format'

interface PosRemiseModalProps {
  sousTotal: number
  remiseActuelle: number
  onApplyRemise: (pourcentage: number) => void
  onClose: () => void
}

export default function PosRemiseModal({
  sousTotal,
  remiseActuelle,
  onApplyRemise,
  onClose,
}: PosRemiseModalProps) {
  const [mode, setMode] = useState<'pourcentage' | 'montant'>('pourcentage')
  const [valeur, setValeur] = useState<string>(remiseActuelle > 0 ? String(remiseActuelle) : '10')

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(valeur) || 0
    if (mode === 'pourcentage') {
      const pct = Math.min(50, Math.max(0, num))
      onApplyRemise(pct)
    } else {
      if (sousTotal > 0) {
        const pct = Math.min(50, Math.max(0, Math.round((num / sousTotal) * 100)))
        onApplyRemise(pct)
      }
    }
    onClose()
  }

  const PRESETS_PCT = [5, 10, 15, 20, 30]

  const montantCalcule = mode === 'pourcentage'
    ? Math.round((sousTotal * (Number(valeur) || 0)) / 100)
    : Math.min(sousTotal, Number(valeur) || 0)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--pos-surface, #ffffff)',
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 420,
          border: '1.5px solid var(--pos-border, #fed7aa)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--pos-text, #0f172a)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🏷️</span> Remise Exceptionnelle
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'var(--pos-surface2, #f1f5f9)', border: 'none', color: 'var(--pos-text2, #64748b)', borderRadius: '50%', width: 32, height: 32, fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* Badge sécurité superviseur */}
        <div style={{ background: 'var(--pos-primary-bg, #fff7ed)', border: '1px solid var(--pos-border, #fed7aa)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--pos-primary, #c2410c)', fontWeight: 700 }}>
          <span>🔒</span>
          <span>Autorisation Superviseur / Gérant validée</span>
        </div>

        {/* Sélecteur de type : Pourcentage vs Montant Fixe */}
        <div style={{ display: 'flex', background: 'var(--pos-surface2, #f1f5f9)', padding: 4, borderRadius: 10, gap: 4 }}>
          <button
            type="button"
            onClick={() => { setMode('pourcentage'); setValeur('10'); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 8,
              border: 'none',
              background: mode === 'pourcentage' ? 'var(--pos-surface, #ffffff)' : 'transparent',
              color: mode === 'pourcentage' ? 'var(--pos-primary, #C75B00)' : 'var(--pos-text2, #64748b)',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: mode === 'pourcentage' ? 'var(--pos-shadow)' : 'none',
            }}
          >
            Pourcentage (%)
          </button>
          <button
            type="button"
            onClick={() => { setMode('montant'); setValeur(String(Math.round(sousTotal * 0.1))); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 8,
              border: 'none',
              background: mode === 'montant' ? 'var(--pos-surface, #ffffff)' : 'transparent',
              color: mode === 'montant' ? 'var(--pos-primary, #C75B00)' : 'var(--pos-text2, #64748b)',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: mode === 'montant' ? 'var(--pos-shadow)' : 'none',
            }}
          >
            Montant Fixe (FCFA)
          </button>
        </div>

        {/* Boutons rapides si pourcentage */}
        {mode === 'pourcentage' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {PRESETS_PCT.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setValeur(String(p))}
                style={{
                  padding: '8px 0',
                  borderRadius: 8,
                  border: Number(valeur) === p ? '2px solid var(--pos-primary, #C75B00)' : '1px solid var(--pos-border, #cbd5e1)',
                  background: Number(valeur) === p ? 'var(--pos-primary-bg, #fff7ed)' : 'var(--pos-surface2, #ffffff)',
                  color: Number(valeur) === p ? 'var(--pos-primary, #C75B00)' : 'var(--pos-text, #0f172a)',
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {p}%
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--pos-text2, #475569)', display: 'block', marginBottom: 4 }}>
              {mode === 'pourcentage' ? 'Saisir un pourcentage personnalisé (max 50%)' : 'Saisir le montant de la réduction (en FCFA)'}
            </label>
            <input
              type="number"
              min={0}
              max={mode === 'pourcentage' ? 50 : sousTotal}
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: '2px solid var(--pos-primary, #fed7aa)',
                background: 'var(--pos-surface2, #fff7ed)',
                color: 'var(--pos-text, #0f172a)',
                fontSize: 18,
                fontWeight: 900,
                textAlign: 'center',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Récapitulatif dynamique */}
          <div style={{ background: 'var(--pos-surface2, #f8fafc)', padding: 12, borderRadius: 10, border: '1px solid var(--pos-border, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--pos-text2, #64748b)', fontWeight: 600 }}>Déduction sur le panier :</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#f87171' }}>-{fcfa(montantCalcule)}</span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {remiseActuelle > 0 && (
              <button
                type="button"
                onClick={() => { onApplyRemise(0); onClose(); }}
                style={{ flex: 1, padding: '12px', background: 'rgba(239, 68, 68, 0.18)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}
              >
                Supprimer
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '12px', background: 'var(--pos-surface2, #f1f5f9)', color: 'var(--pos-text2, #475569)', border: '1px solid var(--pos-border, #cbd5e1)', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{ flex: 1.5, padding: '12px', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.35)' }}
            >
              ✓ Appliquer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
