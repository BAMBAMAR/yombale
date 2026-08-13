'use client'

import { useState } from 'react'

interface MaskedContactPhoneProps {
  phone: string
  titre?: string
  prix?: number
  annonceId?: string | number
  baseUrl?: string
}

function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 9) {
    const prefix = digits.slice(0, 3)
    const suffix = digits.slice(-2)
    return `+${prefix.slice(0, 3)} *** ** ${suffix}`
  }
  return 'Voir le numéro'
}

export default function MaskedContactPhone({
  phone,
  titre = '',
  prix,
  annonceId,
  baseUrl = 'https://nopalou.com',
}: MaskedContactPhoneProps) {
  const [revealed, setRevealed] = useState(false)

  const cleanDigits = phone.replace(/\D/g, '')
  const maskedDisplay = maskPhoneNumber(phone)
  const formatPrix = (p?: number) => (p ? `${p.toLocaleString('fr-FR')} FCFA` : '')

  const handleReveal = () => {
    setRevealed(true)
    // Traçage d'intention de contact (Lead tracking)
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        ;(window as any).gtag('event', 'show_phone_number', {
          event_category: 'Contact',
          event_label: titre,
        })
      }
    } catch {}
  }

  if (!revealed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        <button
          type="button"
          onClick={handleReveal}
          className="annonce-contact-tel"
          style={{
            cursor: 'pointer',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontWeight: 700,
          }}
          title="Cliquez pour afficher le numéro de téléphone complet"
        >
          📞 {maskedDisplay}
          <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 500, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12 }}>
            👁️ Afficher
          </span>
        </button>
      </div>
    )
  }

  return (
    <>
      <a href={`tel:${phone}`} className="annonce-contact-tel">
        📞 {phone}
      </a>
      <a
        href={`https://wa.me/${cleanDigits}?text=${encodeURIComponent(
          `Bonjour, je suis intéressé(e) par votre annonce :\n\n*${titre}*${prix ? ` — ${formatPrix(prix)}` : ''}\n\n${baseUrl}/annonces/${annonceId || ''}`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="annonce-contact-whatsapp"
      >
        WhatsApp
      </a>
    </>
  )
}
