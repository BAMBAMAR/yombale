'use client'

import React, { useState } from 'react'
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Send,
  MessageSquare,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { adminModererProduit } from '@/app/actions/admin'
import { showToast } from '@/context/ToastContext'

interface ModalModererProduitProps {
  produit: any
  onClose: () => void
  onSuccess: (updatedProduit: any) => void
}

const MOTIFS_PREDEFINIS = [
  'Photos floues ou non conformes',
  'Prix manifestement erroné ou abusif',
  'Description incomplète ou trompeuse',
  'Rupture de stock prolongée constatée',
  'Article interdit ou contrefaçon présumée',
  'Non-respect des conditions d\'utilisation Nopalou',
  'Autre motif personnalisé',
]

export default function ModalModererProduit({
  produit,
  onClose,
  onSuccess,
}: ModalModererProduitProps) {
  const isCurrentlyActive = produit.en_stock !== false && produit.statut_moderation !== 'suspendu'

  const [modeAction, setModeAction] = useState<'desactiver' | 'reactiver'>(
    isCurrentlyActive ? 'desactiver' : 'reactiver'
  )
  const [motifSelectionne, setMotifSelectionne] = useState(
    produit.motif_moderation || MOTIFS_PREDEFINIS[0]
  )
  const [motifPerso, setMotifPerso] = useState('')
  const [messagePerso, setMessagePerso] = useState('')
  const [notifierMarchand, setNotifierMarchand] = useState(true)
  const [canal, setCanal] = useState<'whatsapp_et_email' | 'whatsapp' | 'email' | 'aucun'>(
    'whatsapp_et_email'
  )
  const [submitting, setSubmitting] = useState(false)
  const [whatsappDirectUrl, setWhatsappDirectUrl] = useState<string | null>(null)

  const finalMotif =
    motifSelectionne === 'Autre motif personnalisé'
      ? motifPerso.trim() || 'Non précisé'
      : motifSelectionne

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await adminModererProduit(produit.id, {
        action: modeAction,
        motif: modeAction === 'desactiver' ? finalMotif : undefined,
        message_personnalise: messagePerso.trim() || undefined,
        notifier_marchand: notifierMarchand,
        canal: notifierMarchand ? canal : 'aucun',
      })

      if (res.success && res.produit) {
        showToast(
          modeAction === 'desactiver'
            ? `Article "${produit.nom}" suspendu avec notification transmise.`
            : `Article "${produit.nom}" réactivé avec succès.`,
          'success',
          'Modération Produit'
        )

        if (res.notification?.whatsapp_direct_url) {
          setWhatsappDirectUrl(res.notification.whatsapp_direct_url)
        }
        onSuccess(res.produit)
      } else {
        showToast(res.error || 'Erreur lors de la modération', 'error', 'Modération Produit')
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur serveur inattendue', 'error', 'Modération Produit')
    } finally {
      setSubmitting(false)
    }
  }

  const telMarchand = produit.proprietaire_tel || produit.boutique_tel || ''
  const nomMarchand = produit.proprietaire_nom || produit.boutique_nom || 'Marchand'

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal"
        style={{ maxWidth: 540 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: modeAction === 'desactiver' ? '#fef2f2' : '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: modeAction === 'desactiver' ? '#b91c1c' : '#047857',
              }}
            >
              {modeAction === 'desactiver' ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
            </div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--navy)' }}>
              Modération : {produit.nom}
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

        {/* Détails rapides de l'article */}
        <div
          style={{
            background: 'var(--bg, #f8f5f0)',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--border, #e8ddd2)',
            marginBottom: 16,
            fontSize: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div>
            <span style={{ color: 'var(--text3)' }}>Boutique : </span>
            <strong style={{ color: 'var(--navy)' }}>{produit.boutique_nom}</strong>
            {nomMarchand !== produit.boutique_nom && (
              <span style={{ color: 'var(--text2)', marginLeft: 6 }}>({nomMarchand})</span>
            )}
          </div>
          <div>
            <span style={{ color: 'var(--text3)' }}>Contact : </span>
            <strong style={{ color: 'var(--navy)' }}>{telMarchand || 'Non renseigné'}</strong>
          </div>
        </div>

        {/* Sélecteur d'action */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setModeAction('desactiver')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              border: modeAction === 'desactiver' ? '2px solid #b91c1c' : '1px solid var(--border)',
              background: modeAction === 'desactiver' ? '#fef2f2' : '#ffffff',
              color: modeAction === 'desactiver' ? '#b91c1c' : 'var(--text2)',
            }}
          >
            <AlertTriangle size={14} />
            <span>Suspendre / Désactiver</span>
          </button>
          <button
            type="button"
            onClick={() => setModeAction('reactiver')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              border: modeAction === 'reactiver' ? '2px solid #047857' : '1px solid var(--border)',
              background: modeAction === 'reactiver' ? '#ecfdf5' : '#ffffff',
              color: modeAction === 'reactiver' ? '#047857' : 'var(--text2)',
            }}
          >
            <CheckCircle2 size={14} />
            <span>Approuver / Réactiver</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {modeAction === 'desactiver' ? (
            <>
              {/* Choix du motif */}
              <div className="admin-form-field">
                <label>Motif de la suspension (obligatoire)</label>
                <select
                  value={motifSelectionne}
                  onChange={(e) => setMotifSelectionne(e.target.value)}
                  style={{ width: '100%', fontSize: 13 }}
                >
                  {MOTIFS_PREDEFINIS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {motifSelectionne === 'Autre motif personnalisé' && (
                <div className="admin-form-field">
                  <label>Précisez le motif personnalisé</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Image protégée par le droit d'auteur..."
                    value={motifPerso}
                    onChange={(e) => setMotifPerso(e.target.value)}
                    style={{ width: '100%', fontSize: 13 }}
                  />
                </div>
              )}

              {/* Message complémentaire */}
              <div className="admin-form-field">
                <label>Instructions ou note pour le marchand (recommandé)</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Merci de remplacer la photo floue par une photo nette sur fond clair. Le prix semble également manquer d'un zéro."
                  value={messagePerso}
                  onChange={(e) => setMessagePerso(e.target.value)}
                  style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
                />
              </div>
            </>
          ) : (
            <div
              style={{
                background: '#ecfdf5',
                padding: '14px',
                borderRadius: 8,
                border: '1px solid #a7f3d0',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 600, fontSize: 13 }}>
                <CheckCircle2 size={16} />
                <span>Confirmation de réactivation</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#065f46' }}>
                L&apos;article sera immédiatement remis en vente sur la boutique publique. Le motif de modération sera levé.
              </p>
            </div>
          )}

          {/* Options de notification */}
          <div
            style={{
              background: '#f8fafc',
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              marginBottom: 16,
            }}
          >
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
                checked={notifierMarchand}
                onChange={(e) => setNotifierMarchand(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent, #C75B00)' }}
              />
              <span>Notifier le marchand par message automatique</span>
            </label>

            {notifierMarchand && (
              <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Canal d&apos;envoi :
                </span>
                <select
                  value={canal}
                  onChange={(e) => setCanal(e.target.value as any)}
                  style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)' }}
                >
                  <option value="whatsapp_et_email">WhatsApp + Email (Recommandé)</option>
                  <option value="whatsapp">WhatsApp uniquement</option>
                  <option value="email">Email uniquement</option>
                </select>
              </div>
            )}
          </div>

          {/* Bouton direct WhatsApp si généré */}
          {whatsappDirectUrl && (
            <div
              style={{
                background: '#f0fdf4',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #bbf7d0',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={14} />
                <span>Message préparé pour WhatsApp direct</span>
              </div>
              <a
                href={whatsappDirectUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#ffffff',
                  background: '#16a34a',
                  padding: '5px 10px',
                  borderRadius: 6,
                  textDecoration: 'none',
                }}
              >
                <span>Ouvrir WhatsApp</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Actions */}
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
                background: modeAction === 'desactiver' ? '#b91c1c' : '#047857',
                color: '#ffffff',
                border: 'none',
              }}
            >
              <Send size={14} />
              <span>
                {submitting
                  ? 'Traitement en cours...'
                  : modeAction === 'desactiver'
                  ? 'Suspendre et notifier'
                  : 'Réactiver l\'article'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
