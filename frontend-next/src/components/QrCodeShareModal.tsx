'use client'

import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode-svg'

interface QrCodeShareModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title?: string
  boutiqueNom?: string
}

export default function QrCodeShareModal({
  isOpen,
  onClose,
  url,
  title = '📱 QR Code & Lien de ma Boutique',
  boutiqueNom = 'Ma Boutique'
}: QrCodeShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [qrSvg, setQrSvg] = useState<string>('')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    if (url && isOpen) {
      try {
        const qr = new QRCode({
          content: url,
          padding: 2,
          width: 240,
          height: 240,
          color: '#0f172a',
          background: '#ffffff',
          ecl: 'M'
        })
        const svg = qr.svg()
        setQrSvg(svg)
        setQrDataUrl(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
      } catch (err) {
        console.error('Erreur génération QR Code:', err)
      }
    }
  }, [url, isOpen])

  if (!isOpen) return null

  const handleCopierLien = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePartagerWa = () => {
    const textMsg = `Bonjour ! Voici le catalogue officiel et la vitrine en ligne de *${boutiqueNom}*. Vous pouvez passer votre commande directement sur ce lien :\n\n👉 ${url}`
    const waUrl = `https://wa.me/?text=${encodeURIComponent(textMsg)}`
    window.open(waUrl, '_blank')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25)',
          maxWidth: 440,
          width: '100%',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          position: 'relative'
        }}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: 16,
            top: 16,
            background: '#f1f5f9',
            border: 'none',
            borderRadius: 20,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontWeight: 800,
            color: '#64748b'
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
            {title}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Scannez ce QR Code pour accéder à la vitrine et commander directement.
          </p>
        </div>

        {/* Cadre du QR Code */}
        <div
          style={{
            padding: 16,
            background: '#ffffff',
            borderRadius: 16,
            border: '2px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {qrSvg ? (
            <div
              dangerouslySetInnerHTML={{ __html: qrSvg }}
              style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          ) : (
            <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
              Génération du QR Code...
            </div>
          )}
        </div>

        {/* Champ Lien URL */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>Lien direct de votre vitrine :</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              readOnly
              value={url}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 12.5,
                background: '#f8fafc',
                color: '#0f172a',
                fontWeight: 600,
                outline: 'none'
              }}
            />
            <button
              onClick={handleCopierLien}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: copied ? '#10b981' : '#0284c7',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 12.5,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background 0.15s ease'
              }}
            >
              {copied ? '✓ Copié !' : '📋 Copier'}
            </button>
          </div>
        </div>

        {/* Boutons de Partage & Téléchargement */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={handlePartagerWa}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#25D366',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
            }}
          >
            📲 Partager sur WhatsApp
          </button>

          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`qr-code-${boutiqueNom.toLowerCase().replace(/\s+/g, '-')}.svg`}
              style={{
                width: '100%',
                padding: '9px 16px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                textAlign: 'center',
                boxSizing: 'border-box',
                display: 'block'
              }}
            >
              ⬇️ Télécharger le QR Code (Image SVG)
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
