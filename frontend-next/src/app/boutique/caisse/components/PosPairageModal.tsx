'use client'

import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode-svg'
import { Smartphone, QrCode, MessageCircle, Copy, Check, Radio, X } from 'lucide-react'

interface Props {
  sessionScannerId: string
  boutiqueActiveId: string
  onClose: () => void
}

export default function PosPairageModal({ sessionScannerId, boutiqueActiveId, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [qrSvg, setQrSvg] = useState<string>('')
  const [scannerUrl, setScannerUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/boutique/caisse?remoteSession=${sessionScannerId}&b=${boutiqueActiveId}`
      setScannerUrl(url)

      try {
        const qr = new QRCode({
          content: url,
          padding: 2,
          width: 210,
          height: 210,
          color: '#1C2B4A',
          background: '#ffffff',
          ecl: 'M'
        })
        setQrSvg(qr.svg())
      } catch (err) {
        console.error('[Nopalou:PosPairageModal] Erreur QR code:', err)
      }
    }
  }, [sessionScannerId, boutiqueActiveId])

  const handleCopier = () => {
    if (!scannerUrl) return
    navigator.clipboard.writeText(scannerUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOuvrirWa = () => {
    if (!scannerUrl) return
    const text = `Scanner Nopalou POS (Douchette sans fil) : ${scannerUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 480,
          border: '1px solid #E8DDD2',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(199, 91, 0, 0.1)',
                color: '#C75B00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Smartphone size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#1C2B4A' }}>
                Douchette Smartphone Sans Fil
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                Appairage instantané par QR Code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* QR Code Scannable */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F8F5F0',
            border: '1.5px dashed #E8DDD2',
            borderRadius: 16,
            padding: 16,
            gap: 10
          }}
        >
          {qrSvg ? (
            <div
              dangerouslySetInnerHTML={{ __html: qrSvg }}
              style={{
                background: '#ffffff',
                padding: 10,
                borderRadius: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
            />
          ) : (
            <div
              style={{
                width: 210,
                height: 210,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8'
              }}
            >
              <QrCode size={36} />
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#1C2B4A' }}>
              Pointez l&apos;appareil photo de votre smartphone ici
            </span>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
              Aucune application à installer — fonctionne sur Safari, Chrome &amp; navigateurs mobiles
            </p>
          </div>
        </div>

        {/* Info Session */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '8px 12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={14} color="#0A5C36" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Code de session :</span>
            <code style={{ fontSize: 12, fontWeight: 900, color: '#1C2B4A', letterSpacing: '0.05em' }}>
              {sessionScannerId}
            </code>
          </div>

          <button
            type="button"
            onClick={handleCopier}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: copied ? '#0A5C36' : '#ffffff',
              color: copied ? '#ffffff' : '#1C2B4A',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>

        {/* Action alternative WhatsApp */}
        <button
          type="button"
          onClick={handleOuvrirWa}
          style={{
            background: '#25d366',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)'
          }}
        >
          <MessageCircle size={16} />
          Envoyer le lien par WhatsApp sur le téléphone
        </button>

        {/* Indicateur de synchro */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(10, 92, 54, 0.08)',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(10, 92, 54, 0.2)'
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#0A5C36',
              boxShadow: '0 0 0 3px rgba(10, 92, 54, 0.25)'
            }}
          />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0A5C36' }}>
            Synchronisation en temps réel : tout article scanné sur le mobile arrive directement ici.
          </span>
        </div>
      </div>
    </div>
  )
}
