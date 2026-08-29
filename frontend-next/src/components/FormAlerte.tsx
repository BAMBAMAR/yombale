'use client'

import React, { useState } from 'react'
import { createAlerte } from '@/app/actions/alertes'
import { useTranslation } from '@/i18n/context'
import { Bell, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface FormAlerteProps {
  userId: string
}

export default function FormAlerte({ userId }: FormAlerteProps) {
  const [produitInput, setProduitInput] = useState('')
  const [prixCible, setPrixCible]       = useState('')
  const [canal, setCanal]               = useState<'whatsapp' | 'email' | 'les_deux'>('whatsapp')
  const [email, setEmail]               = useState('')
  const [telephone, setTelephone]       = useState('')
  const [loading, setLoading]           = useState(false)
  const [status, setStatus]             = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage]           = useState('')
  const { t } = useTranslation()

  // Extraire l'ID si l'utilisateur colle une URL complète (ex: https://nopalou.com/produit/123)
  function extraireId(val: string): string {
    const clean = val.trim()
    if (clean.includes('/produit/')) {
      const parts = clean.split('/produit/')
      return parts[1].split('?')[0].split('/')[0].trim()
    }
    return clean
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const rawId = extraireId(produitInput)
    const pCible = parseFloat(prixCible)

    if (!rawId || !pCible || pCible <= 0) {
      setStatus('error')
      setMessage(t('errors.fieldRequired') || 'Veuillez renseigner le produit et un prix cible valide.')
      return
    }

    const needEmail = canal === 'email' || canal === 'les_deux'
    const needTel   = canal === 'whatsapp' || canal === 'les_deux'

    if (needTel && (!telephone || telephone.trim().length < 6)) {
      setStatus('error')
      setMessage(t('auth.waInvalidPhone') || 'Veuillez saisir un numéro WhatsApp valide (ex: 77 123 45 67).')
      return
    }
    if (needEmail && (!email || !email.includes('@'))) {
      setStatus('error')
      setMessage(t('errors.invalidEmail') || 'Veuillez saisir une adresse email valide.')
      return
    }

    setLoading(true)
    try {
      const result = await createAlerte(
        rawId,
        pCible,
        needEmail ? email.trim() : undefined,
        needTel ? telephone.trim() : undefined
      )

      if (!result.ok) {
        throw new Error(result.error || t('errors.serverError') || 'Erreur lors de la création de l\'alerte.')
      }

      setStatus('success')
      setMessage(t('account.alertCreatedSuccess') || 'Alerte créée avec succès ! Vous recevrez une notification dès que le prix baisse.')
      setProduitInput('')
      setPrixCible('')
      setEmail('')
      setTelephone('')
      setTimeout(() => setStatus('idle'), 6000)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : (t('errors.serverError') || 'Erreur serveur.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Champ Produit */}
      <div>
        <label htmlFor="produit_input" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1C2B4A', marginBottom: 6 }}>
          {t('account.productId') || 'Produit concerné (ID ou Lien produit)'}
        </label>
        <input
          id="produit_input"
          type="text"
          placeholder="Ex: 8527a2... ou https://nopalou.com/produit/..."
          value={produitInput}
          onChange={(e) => setProduitInput(e.target.value)}
          disabled={loading}
          required
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 14px',
            border: '1.5px solid #CBD5E1',
            borderRadius: 10,
            fontSize: 13.5,
            color: '#1E293B',
            outline: 'none',
            background: '#ffffff',
          }}
        />
        <small style={{ display: 'block', marginTop: 4, color: '#64748B', fontSize: 11.5 }}>
          Collez le lien de la page produit ou l&apos;identifiant situé dans l&apos;URL.
        </small>
      </div>

      {/* Champ Prix Cible */}
      <div>
        <label htmlFor="prix_cible" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1C2B4A', marginBottom: 6 }}>
          {t('account.targetPrice') || 'Votre prix cible souhaité (FCFA)'}
        </label>
        <input
          id="prix_cible"
          type="number"
          placeholder="Ex: 45000"
          value={prixCible}
          onChange={(e) => setPrixCible(e.target.value)}
          disabled={loading}
          min="100"
          step="100"
          required
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 14px',
            border: '1.5px solid #CBD5E1',
            borderRadius: 10,
            fontSize: 13.5,
            color: '#1E293B',
            outline: 'none',
            background: '#ffffff',
          }}
        />
      </div>

      {/* Sélecteur de canal */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1C2B4A', marginBottom: 6 }}>
          {t('account.notificationChannel') || 'Canal de notification'}
        </label>
        <div style={{ display: 'flex', gap: 6, background: '#F1F5F9', padding: 4, borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <button
            type="button"
            onClick={() => setCanal('whatsapp')}
            style={{
              flex: 1,
              padding: '8px 6px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              background: canal === 'whatsapp' ? '#25D366' : 'transparent',
              color: canal === 'whatsapp' ? '#ffffff' : '#475569',
              boxShadow: canal === 'whatsapp' ? '0 2px 6px rgba(37,211,102,0.3)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            💬 WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setCanal('email')}
            style={{
              flex: 1,
              padding: '8px 6px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              background: canal === 'email' ? 'var(--navy, #1C2B4A)' : 'transparent',
              color: canal === 'email' ? '#ffffff' : '#475569',
              boxShadow: canal === 'email' ? '0 2px 6px rgba(28,43,74,0.3)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            📧 Email
          </button>
          <button
            type="button"
            onClick={() => setCanal('les_deux')}
            style={{
              flex: 1,
              padding: '8px 6px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              background: canal === 'les_deux' ? '#7C3AED' : 'transparent',
              color: canal === 'les_deux' ? '#ffffff' : '#475569',
              boxShadow: canal === 'les_deux' ? '0 2px 6px rgba(124,58,237,0.3)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {t('account.bothChannels') || '🔔 Les deux'}
          </button>
        </div>
      </div>

      {/* Téléphone WhatsApp */}
      {(canal === 'whatsapp' || canal === 'les_deux') && (
        <div>
          <label htmlFor="wa_telephone" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1C2B4A', marginBottom: 6 }}>
            {t('account.phoneForWa') || 'Numéro WhatsApp'}
          </label>
          <input
            id="wa_telephone"
            type="tel"
            placeholder="Ex: 77 123 45 67"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            disabled={loading}
            required={canal === 'whatsapp'}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px',
              border: '1.5px solid #CBD5E1',
              borderRadius: 10,
              fontSize: 13.5,
              color: '#1E293B',
              outline: 'none',
              background: '#ffffff',
            }}
          />
        </div>
      )}

      {/* Email */}
      {(canal === 'email' || canal === 'les_deux') && (
        <div>
          <label htmlFor="user_email" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1C2B4A', marginBottom: 6 }}>
            {t('account.emailForConfirmation') || 'Adresse Email'}
          </label>
          <input
            id="user_email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required={canal === 'email'}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px',
              border: '1.5px solid #CBD5E1',
              borderRadius: 10,
              fontSize: 13.5,
              color: '#1E293B',
              outline: 'none',
              background: '#ffffff',
            }}
          />
        </div>
      )}

      {/* Bouton de soumission */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 12,
          border: 'none',
          background: 'linear-gradient(135deg, #C75B00 0%, #EA580C 100%)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: '0 4px 12px rgba(199,91,0,0.25)',
          transition: 'transform 0.15s ease',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>{t('account.submitting') || 'Création en cours…'}</span>
          </>
        ) : (
          <>
            <Bell size={16} />
            <span>{t('account.createAlertBtn') || 'Activer l’alerte prix'}</span>
          </>
        )}
      </button>

      {/* Statut retour */}
      {status === 'success' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: 10,
          padding: '10px 14px',
          color: '#15803D',
          fontSize: 13,
          fontWeight: 600,
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{message}</span>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 10,
          padding: '10px 14px',
          color: '#DC2626',
          fontSize: 13,
          fontWeight: 600,
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{message}</span>
        </div>
      )}
    </form>
  )
}
