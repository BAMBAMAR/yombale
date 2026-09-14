'use client'

import React, { useState, useTransition } from 'react'
import { Depense } from '../types'
import { updateDepense } from '../../actions'
import { fcfa, inputStyle, labelStyle, CAT_DEPENSES } from '../utils'
import { fmtDate } from '@/lib/format'
import { useTranslation } from '@/i18n/context'

interface ComptaDepenseCardProps {
  depense: Depense
  boutiqueId: string
  onDelete: (id: string) => void
  onUpdated: () => void
}

export function ComptaDepenseCard({ depense: d, boutiqueId, onDelete, onUpdated }: ComptaDepenseCardProps) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [eMontant, setEMontant] = useState(String(d.montant))
  const [eCategorie, setECategorie] = useState(d.categorie)
  const [eDesc, setEDesc] = useState(d.description ?? '')
  const [eDate, setEDate] = useState(d.date_depense.slice(0, 10))
  const [eError, setEError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const fileRef = { current: null as HTMLInputElement | null }

  function saveEdit() {
    if (!eMontant || Number(eMontant) <= 0) {
      setEError(t('errors.invalidAmount') || 'Montant invalide')
      return
    }
    setEError(null)
    startTransition(async () => {
      const res = await updateDepense(boutiqueId, d.id, {
        montant: Number(eMontant),
        categorie: eCategorie,
        description: eDesc || undefined,
        date_depense: eDate,
      })
      if (res.error) {
        setEError(res.error)
        return
      }
      setEditing(false)
      onUpdated()
    })
  }

  async function uploadJustificatif(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('justificatif', file)
      const res = await fetch(`/api/compta-proxy/${boutiqueId}/depenses/${d.id}/justificatif`, {
        method: 'POST',
        body: form,
      })
      if (res.ok) onUpdated()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px' }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {eError && <div style={{ background: '#fef2f2', borderRadius: 6, padding: '6px 10px', color: '#dc2626', fontSize: 12 }}>{eError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>{t('shop.expenseAmountLabel')}</label><input type="number" min={1} value={eMontant} onChange={e => setEMontant(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('common.date') || 'Date'}</label><input type="date" value={eDate} onChange={e => setEDate(e.target.value)} style={inputStyle} /></div>
          </div>
          <div><label style={labelStyle}>{t('shop.productCategory')}</label>
            <select value={eCategorie} onChange={e => setECategorie(e.target.value)} style={inputStyle}>
              {CAT_DEPENSES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>{t('shop.descriptionLabel')}</label><input value={eDesc} onChange={e => setEDesc(e.target.value)} style={inputStyle} placeholder={t('common.optional')} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveEdit} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>{t('common.save')}</button>
            <button onClick={() => setEditing(false)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 7, padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}>{t('common.cancel')}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>
                {d.categorie}
              </span>
              {d.description && <span style={{ fontSize: 13, color: '#374151' }}>{d.description}</span>}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>{fmtDate(d.date_depense)}</p>
            {/* Justificatif */}
            <div style={{ marginTop: 6 }}>
              {d.justificatif_url ? (
                <a href={d.justificatif_url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>
                  📎 {t('shop.attachReceiptLabel')} ↗
                </a>
              ) : (
                <>
                  <input
                    ref={el => { fileRef.current = el }}
                    type="file" accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadJustificatif(f) }}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    {uploading ? t('common.loading') : `+ ${t('shop.attachReceiptLabel')}`}
                  </button>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#dc2626' }}>{fcfa(d.montant)}</span>
            <button onClick={() => setEditing(true)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', fontSize: 12 }} title={t('common.edit')}>✎</button>
            <button onClick={() => onDelete(d.id)} style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }} title={t('common.delete')}>✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
