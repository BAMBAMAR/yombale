'use client'

import React, { useState, useEffect } from 'react'
import { X, CheckCircle2, Upload, FileText } from 'lucide-react'
import { fcfa } from '@/lib/format'
import type { CommandeFournisseur } from './types'

interface ModalRecevoirCommandeProps {
  cmd: CommandeFournisseur | null
  onFermer: () => void
  onConfirmerReception: (cmdId: string, justificatifUrl: string) => Promise<boolean>
  onUploadFile: (file: File) => Promise<string | null>
  isSubmitting: boolean
  uploadingFile: boolean
  t: (key: string) => string
}

export default function ModalRecevoirCommande({
  cmd,
  onFermer,
  onConfirmerReception,
  onUploadFile,
  isSubmitting,
  uploadingFile,
  t,
}: ModalRecevoirCommandeProps) {
  const [justificatifUrl, setJustificatifUrl] = useState('')

  useEffect(() => {
    if (cmd) {
      setJustificatifUrl(cmd.justificatif_url || '')
    } else {
      setJustificatifUrl('')
    }
  }, [cmd])

  if (!cmd) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await onUploadFile(file)
    if (url) {
      setJustificatifUrl(url)
    }
  }

  const handleConfirmer = async () => {
    const ok = await onConfirmerReception(cmd.id, justificatifUrl)
    if (ok) {
      onFermer()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: 24,
          width: '100%',
          maxWidth: 550,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>
            {t('shop.receiveOrderModalTitle')} {cmd.reference}
          </h3>
          <button
            type="button"
            onClick={onFermer}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#4b5563', margin: '0 0 16px', lineHeight: 1.5 }}>
          {t('shop.receiveOrderModalHelp')}{' '}
          <strong>{fcfa(cmd.montant_total ?? cmd.total_achat ?? 0)}</strong>.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#374151' }}>
            {t('shop.receptionReceiptLabel')}
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              style={{ fontSize: 13 }}
              disabled={uploadingFile}
            />
            {uploadingFile && (
              <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>
                {t('shop.uploadingFileProgress')}
              </span>
            )}
          </div>
          {justificatifUrl && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                fontSize: 12,
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <FileText size={14} />
              <span>{t('shop.receptionReceiptAttachedBadge')}</span>
              <a
                href={justificatifUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
              >
                {t('shop.consultLink')}
              </a>
              <button
                type="button"
                onClick={() => setJustificatifUrl('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontWeight: 700,
                  marginLeft: 'auto',
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            borderTop: '1px solid #e5e7eb',
            paddingTop: 16,
          }}
        >
          <button
            type="button"
            onClick={onFermer}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirmer}
            disabled={isSubmitting}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              background: 'var(--price, #0A5C36)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: isSubmitting ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            <CheckCircle2 size={14} />
            <span>
              {isSubmitting ? t('shop.receptionInProgressMsg') : t('shop.confirmReceptionSubmitBtn')}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
