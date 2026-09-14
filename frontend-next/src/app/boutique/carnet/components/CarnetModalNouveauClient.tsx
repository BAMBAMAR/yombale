'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '@/i18n/context'

interface CarnetModalNouveauClientProps {
  isOpen: boolean
  onClose: () => void
  isMobile: boolean
  onCreerClient: (data: {
    nom: string
    telephone: string
    adresse?: string
    plafond_max?: number
    note_client?: string
  }) => Promise<{ ok: boolean; error?: string }>
}

export default function CarnetModalNouveauClient({
  isOpen,
  onClose,
  isMobile,
  onCreerClient,
}: CarnetModalNouveauClientProps) {
  const { t } = useTranslation()
  const [nomClient, setNomClient] = useState('')
  const [telClient, setTelClient] = useState('')
  const [adresseClient, setAdresseClient] = useState('')
  const [plafondClient, setPlafondClient] = useState('200000')
  const [noteClient, setNoteClient] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomClient.trim() || !telClient.trim()) {
      alert(t('shop.nameAndPhoneRequired' as any) || 'Le nom et le téléphone sont obligatoires.')
      return
    }

    setSubmitting(true)
    try {
      const res = await onCreerClient({
        nom: nomClient.trim(),
        telephone: telClient.trim(),
        adresse: adresseClient.trim() || undefined,
        plafond_max: Number(plafondClient || 200000),
        note_client: noteClient.trim() || undefined,
      })
      if (res.ok) {
        setNomClient('')
        setTelClient('')
        setAdresseClient('')
        setNoteClient('')
        onClose()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          maxWidth: 480,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: isMobile ? 18 : 24,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
            {t('shop.createCustomerModalTitle')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              color: '#0f172a',
              borderRadius: '50%',
              width: 34,
              height: 34,
              fontSize: 18,
              fontWeight: 900,
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={t('common.close')}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              {t('shop.customerFullNameLabel')}
            </label>
            <input
              type="text"
              required
              placeholder={t('shop.customerFullNamePlaceholder')}
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 16,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              {t('shop.customerPhoneLabel')}
            </label>
            <input
              type="tel"
              required
              placeholder={t('shop.customerPhonePlaceholder')}
              value={telClient}
              onChange={(e) => setTelClient(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 16,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                {t('shop.customerAddressLabel')}
              </label>
              <input
                type="text"
                placeholder={t('shop.customerAddressPlaceholder')}
                value={adresseClient}
                onChange={(e) => setAdresseClient(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 16,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                {t('shop.customerCreditLimitLabel')}
              </label>
              <input
                type="number"
                placeholder={t('shop.customerCreditLimitPlaceholder')}
                value={plafondClient}
                onChange={(e) => setPlafondClient(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 16,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              {t('shop.customerNotesLabel')}
            </label>
            <input
              type="text"
              placeholder={t('shop.customerNotesPlaceholder')}
              value={noteClient}
              onChange={(e) => setNoteClient(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 16,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 6,
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '12px',
              fontWeight: 900,
              fontSize: 14,
              cursor: submitting ? 'not-allowed' : 'pointer',
              minHeight: 44,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? t('shop.savingProgress') : t('shop.saveCustomerBtn')}
          </button>
        </form>
      </div>
    </div>
  )
}
