'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { fmtDateHeure, fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'
import type { Commande } from './types'
import { getStatutLabel } from './types'
import CommandeCard from './CommandeCard'

interface CommandeGroupeCardProps {
  commandes: Commande[]
  boutiqueId: string
  boutiqueSlug?: string
  onUpdate: () => void
  onDispatch?: (c: Commande) => void
  onRetour?: (c: Commande) => void
}

export default function CommandeGroupeCard({
  commandes,
  boutiqueId,
  boutiqueSlug,
  onUpdate,
  onDispatch,
  onRetour,
}: CommandeGroupeCardProps) {
  const { t, formatNumber } = useTranslation()
  const [open, setOpen] = useState(false)
  const premiere = commandes[0]
  const total = commandes.reduce((s, c) => s + Number(c.montant_total), 0)
  const statuts = new Set(commandes.map((c) => c.statut))
  const statutAffiche = statuts.size === 1 ? premiere.statut : 'mixte'

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--accent, #C75B00)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          gap: 12,
          background: '#fff7f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <span
            style={{
              background: 'var(--accent, #C75B00)',
              color: '#fff',
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {t('shop.cartTitle')} · {formatNumber(commandes.length)} {t('common.details')}
          </span>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: 14,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {statutAffiche === 'mixte' ? t('common.status') : getStatutLabel(statutAffiche, t)}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
              {premiere.client_nom} · {premiere.client_telephone}
              {premiere.source === 'whatsapp' && (
                <span
                  style={{
                    marginLeft: 6,
                    background: '#dcfce7',
                    color: '#16a34a',
                    borderRadius: 10,
                    padding: '1px 6px',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  WhatsApp
                </span>
              )}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'var(--accent, #C75B00)' }}>
            {fcfa(total)}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{fmtDateHeure(premiere.created_at)}</p>
        </div>
        <span style={{ color: '#9ca3af', flexShrink: 0, fontSize: 12 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>
      {open && (
        <div
          style={{
            borderTop: '1px solid #f3f4f6',
            padding: '14px 18px',
            background: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {commandes.map((c) => (
            <CommandeCard
              key={c.id}
              commande={c}
              boutiqueId={boutiqueId}
              boutiqueSlug={boutiqueSlug}
              onUpdate={onUpdate}
              onDispatch={onDispatch}
              onRetour={onRetour}
            />
          ))}
        </div>
      )}
    </div>
  )
}
