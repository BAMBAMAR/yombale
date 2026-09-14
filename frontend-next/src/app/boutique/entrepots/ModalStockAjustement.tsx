'use client'

import React from 'react'
import { X } from 'lucide-react'
import type { Entrepot } from '../GestionEntrepots'

interface ProduitSimple {
  id: string
  nom: string
  stock_quantite: number
}

interface ModalStockAjustementProps {
  isOpen: boolean
  onClose: () => void
  produits: ProduitSimple[]
  entrepots: Entrepot[]
  selectedProduitId: string
  setSelectedProduitId: (id: string) => void
  selectedEntrepotId: string
  setSelectedEntrepotId: (id: string) => void
  quantiteStock: number
  setQuantiteStock: (qty: number) => void
  savingStock: boolean
  handleSubmit: (e: React.FormEvent) => void
}

export default function ModalStockAjustement({
  isOpen,
  onClose,
  produits,
  entrepots,
  selectedProduitId,
  setSelectedProduitId,
  selectedEntrepotId,
  setSelectedEntrepotId,
  quantiteStock,
  setQuantiteStock,
  savingStock,
  handleSubmit,
}: ModalStockAjustementProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          maxWidth: 440,
          width: '100%',
          padding: 24,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Ajuster le stock dans un dépôt
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Produit
            </label>
            <select
              value={selectedProduitId}
              onChange={(e) => setSelectedProduitId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                background: '#fff',
              }}
            >
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} (Stock global : {p.stock_quantite})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Dépôt / Entrepôt cible
            </label>
            <select
              value={selectedEntrepotId}
              onChange={(e) => setSelectedEntrepotId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                background: '#fff',
              }}
            >
              {entrepots.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom} ({e.ville}) {e.est_defaut ? '— Principal' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Quantité en stock sur ce site
            </label>
            <input
              type="number"
              min="0"
              value={quantiteStock}
              onChange={(e) => setQuantiteStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                fontWeight: 700,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: '#f1f5f9',
                border: 'none',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={savingStock}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#fff',
                border: 'none',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: savingStock ? 'not-allowed' : 'pointer',
              }}
            >
              {savingStock ? 'Mise à jour...' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
