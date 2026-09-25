'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, Calendar, Download, CreditCard } from 'lucide-react'
import { fcfa } from '@/lib/format'
import { EcheanceLocataireItem } from './BailLocataireCard'

interface Props {
  ech: EcheanceLocataireItem
}

export default function BailLocataireEcheanceItem({ ech }: Props) {
  const isPaye = ech.statut === 'paye'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 10,
        background: isPaye ? '#F0FDF4' : '#ffffff',
        border: isPaye ? '1px solid #BBF7D0' : '1px solid var(--border, #E8DDD2)',
        fontSize: 13,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isPaye ? (
          <CheckCircle2 size={16} color="#16a34a" />
        ) : (
          <Calendar size={16} color="#64748b" />
        )}
        <div>
          <span style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Période {ech.periode}
          </span>
          <span style={{ fontSize: 11.5, color: '#64748b', marginLeft: 8 }}>
            {fcfa(ech.montant_du)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isPaye ? (
          <a
            href={ech.quittance_url || `/api/locatif-immo/public/quittance/${ech.id}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            download={`quittance-${ech.periode}.pdf`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--price, #0A5C36)',
              background: '#DCFCE7',
              padding: '4px 10px',
              borderRadius: 6,
              textDecoration: 'none',
              border: '1px solid #86EFAC',
            }}
          >
            <Download size={13} />
            <span>Quittance PDF</span>
          </a>
        ) : (
          <Link
            href={ech.lien_paiement}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 800,
              color: '#0284C7',
              background: '#EFF6FF',
              padding: '4px 10px',
              borderRadius: 6,
              textDecoration: 'none',
              border: '1px solid #BFDBFE',
            }}
          >
            <CreditCard size={13} />
            <span>Régler</span>
          </Link>
        )}
      </div>
    </div>
  )
}
