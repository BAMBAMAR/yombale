'use client'

import React, { useMemo } from 'react'
import QRCode from 'qrcode-svg'
import { Share2 } from 'lucide-react'

interface CarnetClientQrPassCardProps {
  nom: string
  telephone: string
  id: string
  isMobile: boolean
}

export default function CarnetClientQrPassCard({
  nom,
  telephone,
  id,
  isMobile,
}: CarnetClientQrPassCardProps) {
  const qrSvgPass = useMemo(() => {
    if (!telephone && !id) return ''
    try {
      const qrcode = new QRCode({
        content: `nopalou:fidelite:${telephone || id}`,
        padding: 1,
        width: 130,
        height: 130,
        color: '#1C2B4A',
        background: '#ffffff',
        ecl: 'M',
      })
      return qrcode.svg()
    } catch {
      return ''
    }
  }, [telephone, id])

  return (
    <div
      style={{
        background: '#F8F5F0',
        border: '1.5px solid var(--border, #E8DDD2)',
        borderRadius: 14,
        padding: 14,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          padding: 8,
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        dangerouslySetInnerHTML={{ __html: qrSvgPass }}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          textAlign: isMobile ? 'center' : 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
          Pass QR Fidélité & Identifiant Comptoir
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.4 }}>
          Ce QR code identifie instantanément <strong>{nom}</strong> lors du scan à la caisse POS pour
          accumuler ou utiliser ses points et vérifier son carnet.
        </span>
        {telephone && (
          <a
            href={`https://wa.me/${telephone.replace(/\D/g, '')}?text=${encodeURIComponent(
              `Bonjour ${nom}, voici votre carte fidélité Nopalou chez nous !\nIdentifiant : ${telephone}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              alignSelf: isMobile ? 'center' : 'flex-start',
              marginTop: 4,
              background: '#25D366',
              color: '#ffffff',
              padding: '7px 12px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            <Share2 size={13} />
            <span>Envoyer le Pass au client via WhatsApp</span>
          </a>
        )}
      </div>
    </div>
  )
}
