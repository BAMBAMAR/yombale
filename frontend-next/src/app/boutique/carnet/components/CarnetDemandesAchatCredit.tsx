'use client'

import React from 'react'
import { ShoppingBag, Check, X } from 'lucide-react'
import { fcfa } from '@/lib/format'

interface CarnetDemandesAchatCreditProps {
  commandesCreditEnAttente: any[]
  t: (key: string) => string
  onApprouver: (cmd: any) => Promise<void>
  onRefuser: (cmd: any) => Promise<void>
}

export default function CarnetDemandesAchatCredit({
  commandesCreditEnAttente,
  t,
  onApprouver,
  onRefuser,
}: CarnetDemandesAchatCreditProps) {
  if (commandesCreditEnAttente.length === 0) return null

  return (
    <div
      style={{
        background: '#f0f9ff',
        border: '1.5px solid #0284c7',
        borderRadius: 16,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingBag size={18} color="#0369a1" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0369a1' }}>
            {t('shop.onlineCreditPurchasesTitle')} ({commandesCreditEnAttente.length})
          </h3>
        </div>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: '#0284c7',
            background: '#e0f2fe',
            padding: '2px 8px',
            borderRadius: 12,
          }}
        >
          {t('shop.statusPending')}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {commandesCreditEnAttente.map((cmd: any) => (
          <div
            key={cmd.id}
            style={{
              background: '#ffffff',
              border: '1px solid #bae6fd',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 13.5, color: '#0f172a' }}>
                {cmd.client_nom}{' '}
                <span style={{ color: '#0284c7', fontWeight: 600, fontSize: 12 }}>
                  ({cmd.client_telephone})
                </span>
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#475569' }}>
                {cmd.nom_produit} × {cmd.quantite} —{' '}
                <strong style={{ color: '#dc2626' }}>{fcfa(cmd.montant_total)}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => onApprouver(cmd)}
                style={{
                  padding: '8px 14px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Check size={14} />
                <span>{t('common.confirm')}</span>
              </button>

              <button
                type="button"
                onClick={() => onRefuser(cmd)}
                style={{
                  padding: '8px 12px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <X size={14} />
                <span>{t('shop.cancelOrder')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
