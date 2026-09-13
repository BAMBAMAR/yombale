'use client'

import React from 'react'
import { useFormStatus } from 'react-dom'

export function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      style={{
        padding: '10px 24px',
        background: pending ? '#94a3b8' : '#1d4ed8',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 700,
        cursor: pending ? 'not-allowed' : 'pointer',
      }}
    >
      {pending ? 'En cours…' : label}
    </button>
  )
}

interface ProduitFormSubmitBarProps {
  isEditing: boolean
  onCancel: () => void
  t: (key: string) => string
}

export function ProduitFormSubmitBar({ isEditing, onCancel, t }: ProduitFormSubmitBarProps) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 12,
        zIndex: 40,
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: 14,
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        border: '1.5px solid #cbd5e1',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 20,
      }}
    >
      <div style={{ flex: 1 }}>
        <SubmitButton label={isEditing ? `${t('shop.saveProductBtn')}` : 'Mettre en vente (10s)'} />
      </div>
      <button
        type="button"
        onClick={onCancel}
        style={{
          minHeight: 48,
          padding: '0 20px',
          background: '#f1f5f9',
          border: '1.5px solid #cbd5e1',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 700,
          color: '#475569',
          cursor: 'pointer',
        }}
      >
        {t('common.cancel')}
      </button>
    </div>
  )
}
