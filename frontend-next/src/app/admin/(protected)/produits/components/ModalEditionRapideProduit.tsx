'use client'

import React, { useState } from 'react'
import { X, Check, Edit } from 'lucide-react'
import { adminModererProduit } from '@/app/actions/admin'
import { showToast } from '@/context/ToastContext'

interface ModalEditionRapideProduitProps {
  produit: any
  onClose: () => void
  onSuccess: (updatedProduit: any) => void
}

export default function ModalEditionRapideProduit({
  produit,
  onClose,
  onSuccess,
}: ModalEditionRapideProduitProps) {
  const [nom, setNom] = useState(produit.nom || '')
  const [categorie, setCategorie] = useState(produit.categorie || '')
  const [prix, setPrix] = useState(produit.prix || '')
  const [prixBarre, setPrixBarre] = useState(produit.prix_barre || '')
  const [stockQuantite, setStockQuantite] = useState(
    produit.stock_quantite !== null && produit.stock_quantite !== undefined ? produit.stock_quantite : ''
  )
  const [enStock, setEnStock] = useState(produit.en_stock !== false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await adminModererProduit(produit.id, {
        action: 'modifier',
        nom: nom.trim(),
        categorie: categorie.trim() || undefined,
        prix: Number(prix),
        prix_barre: prixBarre ? Number(prixBarre) : undefined,
        stock_quantite: stockQuantite !== '' ? Number(stockQuantite) : undefined,
        en_stock: enStock,
      })

      if (res.success && res.produit) {
        showToast(`Article "${nom}" mis à jour avec succès.`, 'success', 'Édition Rapide')
        onSuccess(res.produit)
      } else {
        showToast(res.error || 'Erreur lors de la mise à jour', 'error', 'Édition Rapide')
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur serveur inattendue', 'error', 'Édition Rapide')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--navy)',
              }}
            >
              <Edit size={16} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
              Édition Rapide Admin
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-form-field">
            <label>Nom de l&apos;article</label>
            <input
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={{ width: '100%', fontSize: 13 }}
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label>Prix marchand (FCFA)</label>
              <input
                type="number"
                required
                min="0"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                style={{ width: '100%', fontSize: 13 }}
              />
            </div>
            <div className="admin-form-field">
              <label>Prix barré (optionnel)</label>
              <input
                type="number"
                min="0"
                placeholder="Ex: 15000"
                value={prixBarre}
                onChange={(e) => setPrixBarre(e.target.value)}
                style={{ width: '100%', fontSize: 13 }}
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label>Stock disponible (unités)</label>
              <input
                type="number"
                min="0"
                placeholder="Laisser vide si illimité"
                value={stockQuantite}
                onChange={(e) => setStockQuantite(e.target.value)}
                style={{ width: '100%', fontSize: 13 }}
              />
            </div>
            <div className="admin-form-field">
              <label>Catégorie</label>
              <input
                type="text"
                placeholder="Ex: Mode, High-Tech..."
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                style={{ width: '100%', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ marginTop: 6, marginBottom: 16 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--navy)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={enStock}
                onChange={(e) => setEnStock(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#10b981' }}
              />
              <span>Article actif et visible à la vente</span>
            </label>
          </div>

          <div className="admin-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-npl"
              style={{ background: '#f1f5f9', color: 'var(--text1)', border: '1px solid var(--border)' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-npl"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--navy)',
                color: '#ffffff',
                border: 'none',
              }}
            >
              <Check size={14} />
              <span>{submitting ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
