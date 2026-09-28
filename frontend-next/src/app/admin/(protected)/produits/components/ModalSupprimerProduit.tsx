'use client'

import React, { useState } from 'react'
import { X, Trash2, AlertTriangle } from 'lucide-react'
import { adminSupprimerProduit } from '@/app/actions/admin'
import { showToast } from '@/context/ToastContext'

interface ModalSupprimerProduitProps {
  produit: any
  onClose: () => void
  onSuccess: (deletedId: string) => void
}

export default function ModalSupprimerProduit({
  produit,
  onClose,
  onSuccess,
}: ModalSupprimerProduitProps) {
  const [motif, setMotif] = useState('Non-respect des règles de la plateforme / Contrefaçon')
  const [messagePerso, setMessagePerso] = useState('')
  const [notifier, setNotifier] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await adminSupprimerProduit(produit.id, {
        motif,
        message_personnalise: messagePerso.trim() || undefined,
        notifier_marchand: notifier,
      })

      if (res.success) {
        showToast(`Article "${produit.nom}" supprimé définitivement.`, 'info', 'Suppression Produit')
        onSuccess(produit.id)
      } else {
        showToast(res.error || 'Erreur lors de la suppression', 'error', 'Suppression Produit')
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur serveur inattendue', 'error', 'Suppression Produit')
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
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#b91c1c',
              }}
            >
              <Trash2 size={16} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#b91c1c' }}>
              Suppression définitive de l&apos;article
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

        <div
          style={{
            background: '#fff1f2',
            padding: '12px 14px',
            borderRadius: 8,
            border: '1px solid #fecdd3',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <AlertTriangle size={18} style={{ color: '#e11d48', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12, color: '#9f1239', lineHeight: 1.5 }}>
            Cette action est <strong>irréversible</strong>. L&apos;article <strong>&ldquo;{produit.nom}&rdquo;</strong> de la boutique <strong>{produit.boutique_nom}</strong> sera définitivement retiré de la base de données.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-form-field">
            <label>Motif de suppression</label>
            <input
              type="text"
              required
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              style={{ width: '100%', fontSize: 13 }}
            />
          </div>

          <div className="admin-form-field">
            <label>Commentaire additionnel (facultatif)</label>
            <textarea
              rows={2}
              placeholder="Explication pour l'audit et le marchand..."
              value={messagePerso}
              onChange={(e) => setMessagePerso(e.target.value)}
              style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
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
                checked={notifier}
                onChange={(e) => setNotifier(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#b91c1c' }}
              />
              <span>Avertir le marchand de ce retrait (WhatsApp & Email)</span>
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
                background: '#b91c1c',
                color: '#ffffff',
                border: 'none',
              }}
            >
              <Trash2 size={14} />
              <span>{submitting ? 'Suppression...' : 'Confirmer la suppression'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
