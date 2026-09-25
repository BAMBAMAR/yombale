'use client'

import React from 'react'
import { CheckCircle2, Download } from 'lucide-react'

interface Props {
  periode: string
  echeanceId: string
  quittancePdfUrl: string | null
}

export default function PayerLoyerSuccesCard({ periode, echeanceId, quittancePdfUrl }: Props) {
  const downloadUrl = quittancePdfUrl || `/api/locatif-immo/public/quittance/${echeanceId}.pdf`

  return (
    <div
      style={{
        background: '#F0FDF4',
        border: '1.5px solid #A7F3D0',
        borderRadius: 14,
        padding: 18,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#0A5C36' }}>
        <CheckCircle2 size={24} />
        <strong style={{ fontSize: 15 }}>Ce loyer est officiellement acquitté !</strong>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>
        Votre quittance certifiée conforme est générée et consultable à tout moment.
      </p>

      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={`quittance-${periode}.pdf`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: '#0A5C36',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: 10,
          fontSize: 13.5,
          fontWeight: 800,
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(10, 92, 54, 0.25)'
        }}
      >
        <Download size={16} />
        <span>Télécharger ma Quittance PDF</span>
      </a>
    </div>
  )
}
