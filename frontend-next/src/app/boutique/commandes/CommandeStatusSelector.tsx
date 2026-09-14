'use client'

import React, { useState } from 'react'
import { Edit3 } from 'lucide-react'
import type { Commande } from './types'
import { STATUTS_META, TRANSITIONS, getStatutLabel } from './types'

interface CommandeStatusSelectorProps {
  commande: Commande
  loading: boolean
  changeStatut: (statut: string) => void
  t: (key: string) => string
}

export default function CommandeStatusSelector({
  commande,
  loading,
  changeStatut,
  t,
}: CommandeStatusSelectorProps) {
  const [correcting, setCorrecting] = useState(false)
  const [correctStatut, setCorrectStatut] = useState(commande.statut)
  const next = TRANSITIONS[commande.statut] ?? []

  function applyCorrection() {
    if (correctStatut === commande.statut) {
      setCorrecting(false)
      return
    }
    changeStatut(correctStatut)
    setCorrecting(false)
  }

  return (
    <>
      {next.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>{t('shop.advanceStatus')} :</span>
          {next.map((s) => {
            const info = STATUTS_META.find((x) => x.key === s)!
            return (
              <button
                key={s}
                onClick={() => changeStatut(s)}
                disabled={loading}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '5px 12px',
                  borderRadius: 8,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  border: 'none',
                  background: info.bg,
                  color: info.color,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {getStatutLabel(s, t)} →
              </button>
            )
          })}
        </div>
      )}
      {next.length === 0 && (
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>✓ {t('shop.orderUpdatedSuccess')}</p>
      )}

      {/* Correction de statut */}
      {!correcting ? (
        <button
          onClick={() => {
            setCorrecting(true)
            setCorrectStatut(commande.statut)
          }}
          style={{
            fontSize: 11,
            color: '#6b7280',
            background: 'none',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Edit3 size={11} />
          <span>
            {t('common.edit')} {t('common.status')}
          </span>
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>{t('common.edit')} :</span>
          <select
            value={correctStatut}
            onChange={(e) => setCorrectStatut(e.target.value)}
            style={{
              fontSize: 12,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              padding: '4px 8px',
              background: '#fff',
            }}
          >
            {STATUTS_META.map((s) => (
              <option key={s.key} value={s.key}>
                {getStatutLabel(s.key, t)}
              </option>
            ))}
          </select>
          <button
            onClick={applyCorrection}
            disabled={loading}
            style={{
              fontSize: 12,
              fontWeight: 700,
              background: '#374151',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            {t('common.confirm')}
          </button>
          <button
            onClick={() => setCorrecting(false)}
            style={{
              fontSize: 12,
              background: 'none',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              padding: '4px 10px',
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            {t('common.cancel')}
          </button>
        </div>
      )}
    </>
  )
}
