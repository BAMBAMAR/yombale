'use client'

import React, { useState, useEffect } from 'react'
import { X, UserPlus, Check } from 'lucide-react'
import type { Fournisseur } from './types'

interface ModalFournisseurFormProps {
  ouvert: boolean
  onFermer: () => void
  fournisseurAEditer: Fournisseur | null
  onSoumettre: (
    fouEditId: string | null,
    payload: { nom: string; telephone?: string; email?: string; adresse?: string }
  ) => Promise<boolean>
  isSubmitting: boolean
  t: (key: string) => string
}

export default function ModalFournisseurForm({
  ouvert,
  onFermer,
  fournisseurAEditer,
  onSoumettre,
  isSubmitting,
  t,
}: ModalFournisseurFormProps) {
  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')
  const [email, setEmail] = useState('')
  const [adr, setAdr] = useState('')

  useEffect(() => {
    if (fournisseurAEditer) {
      setNom(fournisseurAEditer.nom || '')
      setTel(fournisseurAEditer.telephone || '')
      setEmail(fournisseurAEditer.email || '')
      setAdr(fournisseurAEditer.adresse || '')
    } else {
      setNom('')
      setTel('')
      setEmail('')
      setAdr('')
    }
  }, [fournisseurAEditer, ouvert])

  if (!ouvert) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim()) return
    const ok = await onSoumettre(fournisseurAEditer ? fournisseurAEditer.id : null, {
      nom: nom.trim(),
      telephone: tel.trim() || undefined,
      email: email.trim() || undefined,
      adresse: adr.trim() || undefined,
    })
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
          maxWidth: 480,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
            {fournisseurAEditer ? t('shop.editSupplierModalTitle') : t('shop.addSupplierModalTitle')}
          </h3>
          <button
            type="button"
            onClick={onFermer}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
              {t('shop.nameOrCompanyNameLabel')} *
            </label>
            <input
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 13,
                outline: 'none',
              }}
              placeholder={t('shop.nameOrCompanyPlaceholder')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
              {t('shop.phoneLabel')}
            </label>
            <input
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 13,
                outline: 'none',
              }}
              placeholder={t('shop.phoneSupplierPlaceholder')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
              {t('shop.emailLabel')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 13,
                outline: 'none',
              }}
              placeholder={t('shop.emailSupplierPlaceholder')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
              {t('shop.addressLabel')}
            </label>
            <input
              value={adr}
              onChange={(e) => setAdr(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 13,
                outline: 'none',
              }}
              placeholder={t('shop.addressSupplierPlaceholder')}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              borderTop: '1px solid #e5e7eb',
              paddingTop: 16,
              marginTop: 4,
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
                color: '#334155',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
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
              <Check size={14} />
              <span>
                {isSubmitting
                  ? fournisseurAEditer
                    ? t('shop.editingInProgress')
                    : t('shop.addingInProgress')
                  : fournisseurAEditer
                    ? t('shop.saveBtn')
                    : t('shop.addBtn')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
