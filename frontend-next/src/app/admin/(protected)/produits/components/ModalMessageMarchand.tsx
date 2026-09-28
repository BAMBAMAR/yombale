'use client'

import React, { useState } from 'react'
import {
  X,
  Send,
  MessageSquare,
  ExternalLink,
  Phone,
  Mail,
  Store,
} from 'lucide-react'
import { adminEnvoyerMessageMarchandProduit } from '@/app/actions/admin'
import { showToast } from '@/context/ToastContext'

interface ModalMessageMarchandProps {
  produit: any
  onClose: () => void
}

const MODELES_MESSAGES = [
  {
    titre: 'Photos de meilleure qualité',
    texte: 'Bonjour, nous avons remarqué que les photos de votre article manquent un peu de netteté ou de luminosité. Pour maximiser vos ventes, nous vous conseillons d\'ajouter une photo claire prise sous un bon éclairage.',
  },
  {
    titre: 'Vérification du stock',
    texte: 'Bonjour, plusieurs clients se sont intéressés à votre article. Pouvez-vous nous confirmer qu\'il est bien disponible et que votre stock est à jour ?',
  },
  {
    titre: 'Ajustement de prix',
    texte: 'Bonjour, le tarif indiqué sur votre article semble inhabituel ou manifestement erroné. Merci de vérifier le montant pour éviter tout désagrément lors des commandes.',
  },
  {
    titre: 'Précision description',
    texte: 'Bonjour, nous vous suggérons de détailler un peu plus la description de votre article (dimensions, matière, garantie) afin de rassurer vos futurs acheteurs.',
  },
]

export default function ModalMessageMarchand({ produit, onClose }: ModalMessageMarchandProps) {
  const [message, setMessage] = useState('')
  const [canal, setCanal] = useState<'whatsapp_et_email' | 'whatsapp' | 'email'>('whatsapp_et_email')
  const [submitting, setSubmitting] = useState(false)
  const [whatsappDirectUrl, setWhatsappDirectUrl] = useState<string | null>(null)

  const telMarchand = produit.proprietaire_tel || produit.boutique_tel || ''
  const emailMarchand = produit.proprietaire_email || ''
  const nomMarchand = produit.proprietaire_nom || produit.boutique_nom || 'Marchand'

  const handleSelectModele = (texte: string) => {
    setMessage(texte)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setSubmitting(true)
    try {
      const res = await adminEnvoyerMessageMarchandProduit(produit.id, {
        message: message.trim(),
        canal,
        objet: `Message Nopalou concernant votre article "${produit.nom}"`,
      })

      if (res.success) {
        showToast('Message transmis avec succès au marchand.', 'success', 'Communication Marchand')
        if (res.whatsapp_direct_url) {
          setWhatsappDirectUrl(res.whatsapp_direct_url)
        } else {
          onClose()
        }
      } else {
        showToast(res.error || 'Erreur lors de l\'envoi du message', 'error', 'Communication Marchand')
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur serveur inattendue', 'error', 'Communication Marchand')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal"
        style={{ maxWidth: 520 }}
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
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7',
              }}
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
                Contacter le marchand
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                Article : {produit.nom}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Fiche coordonnées marchand */}
        <div
          style={{
            background: 'var(--bg, #f8f5f0)',
            padding: '12px 14px',
            borderRadius: 8,
            border: '1px solid var(--border, #e8ddd2)',
            marginBottom: 16,
            fontSize: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Store size={14} style={{ color: 'var(--accent, #C75B00)' }} />
            <strong style={{ color: 'var(--navy)' }}>{produit.boutique_nom}</strong>
            {nomMarchand !== produit.boutique_nom && (
              <span style={{ color: 'var(--text2)' }}>— {nomMarchand}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {telMarchand && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text1)' }}>
                <Phone size={12} style={{ color: '#10b981' }} />
                <span>{telMarchand}</span>
              </div>
            )}
            {emailMarchand && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text1)' }}>
                <Mail size={12} style={{ color: '#0284c7' }} />
                <span>{emailMarchand}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modèles rapides */}
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Modèles rapides :
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {MODELES_MESSAGES.map((m) => (
              <button
                key={m.titre}
                type="button"
                onClick={() => handleSelectModele(m.texte)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 14,
                  fontSize: 11,
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  background: '#ffffff',
                  color: 'var(--navy)',
                  cursor: 'pointer',
                }}
              >
                {m.titre}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Zone de texte */}
          <div className="admin-form-field">
            <label>Votre message au marchand</label>
            <textarea
              required
              rows={4}
              placeholder="Rédigez votre message ici..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
            />
          </div>

          {/* Sélecteur de canal */}
          <div
            style={{
              background: '#f8fafc',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>
              Canal de transmission :
            </span>
            <select
              value={canal}
              onChange={(e) => setCanal(e.target.value as any)}
              style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)' }}
            >
              <option value="whatsapp_et_email">WhatsApp + Email</option>
              <option value="whatsapp">WhatsApp direct</option>
              <option value="email">Email</option>
            </select>
          </div>

          {/* Lien WhatsApp direct si généré */}
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
              <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>
                Message transmis ! Vous pouvez continuer la discussion sur WhatsApp :
              </span>
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
              Fermer
            </button>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="btn-npl"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--navy)',
                color: '#ffffff',
                border: 'none',
                opacity: !message.trim() ? 0.6 : 1,
              }}
            >
              <Send size={14} />
              <span>{submitting ? 'Envoi...' : 'Envoyer le message'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
