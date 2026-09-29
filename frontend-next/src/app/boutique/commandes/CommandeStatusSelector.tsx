'use client'

import React, { useState } from 'react'
import { Edit3, Check, X } from 'lucide-react'
import type { Commande } from './types'
import { STATUTS_META, getStatutLabel } from './types'

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

  function applyCorrection() {
    if (correctStatut === commande.statut) {
      setCorrecting(false)
      return
    }
    changeStatut(correctStatut)
    setCorrecting(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
      {!correcting ? (
        <button
          type="button"
          onClick={() => {
            setCorrecting(true)
            setCorrectStatut(commande.statut)
          }}
          style={{
            fontSize: 11.5,
            color: '#64748b',
            background: 'none',
            border: '1px dashed #cbd5e1',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
          title="Modifier manuellement le statut de la commande en cas d'erreur"
        >
          <Edit3 size={12} />
          <span>{t('common.edit') || 'Modifier'} {t('common.status') || 'statut'}</span>
        </button>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
            background: '#f1f5f9',
            padding: '6px 10px',
            borderRadius: 8,
            width: '100%',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
            {t('common.edit') || 'Modifier'} :
          </span>
          <select
            value={correctStatut}
            onChange={(e) => setCorrectStatut(e.target.value)}
            style={{
              fontSize: 12,
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '4px 8px',
              background: '#fff',
              color: '#0f172a',
            }}
          >
            {STATUTS_META.map((s) => (
              <option key={s.key} value={s.key}>
                {getStatutLabel(s.key, t)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyCorrection}
            disabled={loading}
            style={{
              fontSize: 12,
              fontWeight: 700,
              background: 'var(--navy, #1C2B4A)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '4px 10px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Check size={13} />
            <span>{t('common.confirm') || 'Valider'}</span>
          </button>
          <button
            type="button"
            onClick={() => setCorrecting(false)}
            style={{
              fontSize: 12,
              background: 'none',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '4px 8px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <X size={13} />
            <span>{t('common.cancel') || 'Annuler'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
