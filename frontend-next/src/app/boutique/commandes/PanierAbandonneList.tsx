'use client'

import React from 'react'
import { ShoppingCart, MessageCircle, Check } from 'lucide-react'
import { fcfa } from '@/lib/format'

interface PanierAbandonneListProps {
  paniers: any[]
  onRelancerWhatsApp: (id: string) => void
  t: any
}

export default function PanierAbandonneList({
  paniers,
  onRelancerWhatsApp,
  t,
}: PanierAbandonneListProps) {
  if (paniers.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '48px 20px',
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px dashed #d1d5db',
        }}
      >
        <ShoppingCart size={32} style={{ color: '#9ca3af', margin: '0 auto 12px', display: 'block' }} />
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>{t('common.noData')}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {paniers.map((p) => (
        <div
          key={p.id}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                {p.client_nom || t('shop.orderClient')}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>({p.client_tel})</span>
              {p.relance_envoyee && (
                <span
                  style={{
                    fontSize: 10,
                    background: '#dcfce7',
                    color: '#166534',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Check size={11} />
                  <span>{t('common.success')}</span>
                </span>
              )}
            </div>

            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#4b5563' }}>
              {t('shop.orderItems')} : {(p.articles || []).map((a: any) => `${a.quantite}x ${a.nom}`).join(', ')}
            </p>

            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              {new Date(p.created_at).toLocaleString('fr-FR')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#dc2626' }}>
              {fcfa(p.total)}
            </span>

            <button
              onClick={() => onRelancerWhatsApp(p.id)}
              style={{
                background: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(37,211,102,.25)',
              }}
            >
              <MessageCircle size={14} />
              <span>WhatsApp (-5%) →</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
