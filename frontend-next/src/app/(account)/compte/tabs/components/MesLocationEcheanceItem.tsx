'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, Clock, Download, CreditCard } from 'lucide-react'
import { Echeance } from './MesLocationCard'

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR')

interface Props {
  ech: Echeance
  isBailleur: boolean
  payingId: string | null
  contratPdfUrl: string
  getAuthPdfUrl: (url: string | null | undefined) => string
  onPayLoyer: (echeanceId: string) => void
}

export default function MesLocationEcheanceItem({
  ech,
  isBailleur,
  payingId,
  getAuthPdfUrl,
  onPayLoyer,
}: Props) {
  const isPaye = ech.statut === 'paye'
  const isEnRetard = ech.statut === 'retard' || ech.statut === 'impaye'
  const quittancePdfUrl = getAuthPdfUrl(ech.quittance_url)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderRadius: 10,
        background: isPaye ? '#F8FAFC' : isEnRetard ? '#FEF2F2' : '#FFFBEB',
        border: `1px solid ${isPaye ? '#E2E8F0' : isEnRetard ? '#FECACA' : '#FDE68A'}`,
        flexWrap: 'wrap',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: isPaye ? '#DCFCE7' : isEnRetard ? '#FEE2E2' : '#FEF3C7',
            color: isPaye ? '#166534' : isEnRetard ? '#991B1B' : '#92400E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isPaye ? <CheckCircle2 size={16} /> : isEnRetard ? <AlertCircle size={16} /> : <Clock size={16} />}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Période : {ech.periode}
          </div>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            Échéance : {new Date(ech.date_echeance).toLocaleDateString('fr-FR')} &bull; Montant :{' '}
            {fmt(ech.montant_du)} FCFA
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isPaye && quittancePdfUrl ? (
          <a
            href={quittancePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={`quittance_${ech.periode}.pdf`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'var(--navy, #1C2B4A)',
              color: '#ffffff',
              fontSize: 11.5,
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            <Download size={13} />
            <span>Quittance PDF</span>
          </a>
        ) : isBailleur ? (
          <span
            style={{
              padding: '5px 10px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700,
              background: isEnRetard ? '#FEE2E2' : '#FEF3C7',
              color: isEnRetard ? '#991B1B' : '#92400E',
            }}
          >
            {isEnRetard ? 'Loyer Impayé' : 'En attente d\'encaissement'}
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => onPayLoyer(ech.id)}
              disabled={payingId === ech.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: '#1D4ED8',
                color: '#ffffff',
                border: 'none',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <CreditCard size={13} />
              <span>{payingId === ech.id ? 'Redirection Wave...' : 'Payer par Wave'}</span>
            </button>
            <Link
              href={`/payer-loyer/${ech.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 8,
                background: '#F1F5F9',
                color: 'var(--navy, #1C2B4A)',
                border: '1px solid #CBD5E1',
                fontSize: 11.5,
                fontWeight: 700,
                textDecoration: 'none',
              }}
              title="Plus d'options de paiement (Orange Money, virement...)"
            >
              <span>Options</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
