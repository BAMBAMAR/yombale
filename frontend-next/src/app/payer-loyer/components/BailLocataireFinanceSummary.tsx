'use client'

import React from 'react'
import { Building2, Phone, MessageCircle } from 'lucide-react'
import { fcfa } from '@/lib/format'
import { BailLocataireItem } from './BailLocataireCard'

interface Props {
  bail: BailLocataireItem
  echeancesEnAttenteCount: number
}

export default function BailLocataireFinanceSummary({ bail, echeancesEnAttenteCount }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        gap: 10,
        background: 'var(--bg, #F8F5F0)',
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
          Loyer Mensuel
        </div>
        <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
          {fcfa(bail.loyer_mensuel)}
          {bail.charges > 0 && (
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b' }}>
              {' '}+ {fcfa(bail.charges)} ch.
            </span>
          )}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
          Agence Mandataire
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Building2 size={14} color="var(--accent, #C75B00)" />
          <span>{bail.agence.nom}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
          {bail.agence.telephone && (
            <a
              href={`tel:${bail.agence.telephone}`}
              style={{ fontSize: 11.5, color: '#2563EB', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700 }}
            >
              <Phone size={12} />
              <span>{bail.agence.telephone}</span>
            </a>
          )}
          {bail.agence.whatsapp && (
            <a
              href={`https://wa.me/${bail.agence.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11.5, color: '#16a34a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700 }}
            >
              <MessageCircle size={12} />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
          Statut Global
        </div>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: echeancesEnAttenteCount > 0 ? 'var(--accent, #C75B00)' : 'var(--price, #0A5C36)',
            marginTop: 2,
          }}
        >
          {echeancesEnAttenteCount > 0
            ? `${echeancesEnAttenteCount} loyer(s) en attente`
            : 'À jour de paiement'}
        </div>
      </div>
    </div>
  )
}
