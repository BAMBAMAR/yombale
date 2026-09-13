'use client'

import React, { useState, useEffect } from 'react'
import { Copy, X, Check } from 'lucide-react'
import type { Produit } from '../boutiqueTypes'

interface ModalDupliquerProduitProps {
  produit: Produit | null
  onFermer: () => void
  onConfirmer: (nom: string, prix?: number, stock?: number) => Promise<void>
  isPending: boolean
}

export default function ModalDupliquerProduit({
  produit,
  onFermer,
  onConfirmer,
  isPending,
}: ModalDupliquerProduitProps) {
  const [dupNom, setDupNom] = useState('')
  const [dupPrix, setDupPrix] = useState('')
  const [dupStock, setDupStock] = useState('')

  useEffect(() => {
    if (produit) {
      setDupNom(`${produit.nom} (Copie)`)
      setDupPrix(produit.prix?.toString() || '')
      setDupStock(produit.stock_quantite?.toString() || '')
    }
  }, [produit])

  if (!produit) return null

  const handleConfirmer = async () => {
    if (!dupNom.trim()) {
      alert('Le nom est requis')
      return
    }
    await onConfirmer(
      dupNom.trim(),
      dupPrix !== '' ? Number(dupPrix) : undefined,
      dupStock !== '' ? Number(dupStock) : undefined
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 440,
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>
            Dupliquer le produit
          </h3>
          <button
            type="button"
            onClick={onFermer}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
          Personnalisez le nouveau produit avant de le créer.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Nom du produit *
            </label>
            <input
              type="text"
              value={dupNom}
              onChange={(e) => setDupNom(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                color: '#0f172a',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              placeholder="Ex: Sac de Ciment Sococim (Copie)"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Prix unitaire (FCFA)
              </label>
              <input
                type="number"
                value={dupPrix}
                onChange={(e) => setDupPrix(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                placeholder="Ex: 3500"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Stock initial
              </label>
              <input
                type="number"
                value={dupStock}
                onChange={(e) => setDupStock(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                placeholder="Ex: 10"
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onFermer}
            style={{
              flex: 1,
              padding: '10px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleConfirmer}
            style={{
              flex: 1.5,
              padding: '10px',
              background: 'var(--price, #0A5C36)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 800,
              cursor: isPending ? 'wait' : 'pointer',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: isPending ? 0.7 : 1,
            }}
          >
            <Check size={14} />
            <span>{isPending ? 'Création…' : 'Confirmer'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
