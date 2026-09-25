'use client'

import React from 'react'
import { FileText, Download, ShieldCheck } from 'lucide-react'

interface Props {
  echeanceId: string
  bienTitre: string
  pdfUrl?: string
}

export default function PayerLoyerContratCard({ echeanceId, bienTitre, pdfUrl }: Props) {
  const downloadUrl = pdfUrl || `/api/locatif-immo/public/echeance/${echeanceId}/bail.pdf`

  return (
    <div
      style={{
        background: 'rgba(28, 43, 74, 0.03)',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <FileText size={17} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Contrat de Bail d&apos;Habitation
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Document officiel sénégalais conforme COCC &bull; Décret 2023-442
          </div>
        </div>
      </div>

      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={`contrat-bail-${bienTitre.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)}.pdf`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#ffffff',
          color: 'var(--navy, #1C2B4A)',
          border: '1.5px solid var(--navy, #1C2B4A)',
          padding: '7px 12px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 800,
          textDecoration: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}
      >
        <Download size={13} />
        <span>Télécharger PDF</span>
      </a>
    </div>
  )
}
