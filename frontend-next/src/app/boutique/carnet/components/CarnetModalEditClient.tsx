'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '@/i18n/context'
import { showToast } from '@/context/ToastContext'
import type { ClientCredit } from '../types'

interface CarnetModalEditClientProps {
  isOpen: boolean
  client: ClientCredit | null
  onClose: () => void
  isMobile: boolean
  onEnregistrerEditClient: (
    clientId: string,
    data: {
      nom: string
      telephone: string
      adresse?: string
      plafond_max?: number
      note_client?: string
    }
  ) => Promise<{ ok: boolean; error?: string }>
}

export default function CarnetModalEditClient({
  isOpen,
  client,
  onClose,
  isMobile,
  onEnregistrerEditClient,
}: CarnetModalEditClientProps) {
  const { t } = useTranslation()
  const [editNom, setEditNom] = useState('')
  const [editTel, setEditTel] = useState('')
  const [editAdresse, setEditAdresse] = useState('')
  const [editPlafond, setEditPlafond] = useState('200000')
  const [editNote, setEditNote] = useState('')
  const [submittingEdit, setSubmittingEdit] = useState(false)

  useEffect(() => {
    if (client) {
      setEditNom(client.nom || '')
      setEditTel(client.telephone || '')
      setEditAdresse(client.adresse || '')
      setEditPlafond(String(client.plafond_max || 200000))
      setEditNote(client.note_client || '')
    }
  }, [client])

  if (!isOpen || !client) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editNom.trim() || !editTel.trim()) {
      showToast(t('shop.nameAndPhoneRequired' as any) || 'Le nom et le téléphone sont obligatoires.', 'warning', 'Champs Requis')
      return
    }

    setSubmittingEdit(true)
    try {
      const res = await onEnregistrerEditClient(client.id, {
        nom: editNom.trim(),
        telephone: editTel.trim(),
        adresse: editAdresse.trim() || undefined,
        plafond_max: Number(editPlafond || 200000),
        note_client: editNote.trim() || undefined,
      })
      if (res.ok) {
        onClose()
      }
    } finally {
      setSubmittingEdit(false)
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
            {t('shop.editCustomerModalTitle')}
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
              value={editNom}
              onChange={(e) => setEditNom(e.target.value)}
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
              value={editTel}
              onChange={(e) => setEditTel(e.target.value)}
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
                value={editAdresse}
                onChange={(e) => setEditAdresse(e.target.value)}
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
                value={editPlafond}
                onChange={(e) => setEditPlafond(e.target.value)}
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
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
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
            disabled={submittingEdit}
            style={{
              marginTop: 6,
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '12px',
              fontWeight: 900,
              fontSize: 14,
              cursor: submittingEdit ? 'not-allowed' : 'pointer',
              minHeight: 44,
              opacity: submittingEdit ? 0.7 : 1,
            }}
          >
            {submittingEdit ? t('shop.savingProgress') : t('shop.saveChangesBtn')}
          </button>
        </form>
      </div>
    </div>
  )
}
