'use client'

import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode-svg'
import { useTranslation } from '@/i18n/context'

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
  title,
  boutiqueNom = 'Ma Boutique'
}: QrCodeShareModalProps) {
  const { t } = useTranslation()
  const [activeMode, setActiveMode] = useState<'vitrine' | 'credit'>('vitrine')
  const [copied, setCopied] = useState(false)
  const [qrSvg, setQrSvg] = useState<string>('')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [telClientInShop, setTelClientInShop] = useState('')
  const [isGrandEcran, setIsGrandEcran] = useState(false)

  const modalTitle = title || `📱 ${t('common.qrCode')} & ${t('account.groupShop')}`

  const finalUrl = activeMode === 'credit' 
    ? (url.includes('?') ? `${url}&mode=credit` : `${url}?mode=credit`)
    : url

  useEffect(() => {
    if (finalUrl && isOpen) {
      try {
        const qrSize = isGrandEcran ? 320 : 220
        const qr = new QRCode({
          content: finalUrl,
          padding: 2,
          width: qrSize,
          height: qrSize,
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
  }, [finalUrl, isOpen, isGrandEcran])

  if (!isOpen) return null

  const handleCopierLien = () => {
    navigator.clipboard.writeText(finalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePartagerWa = () => {
    const textMsg = activeMode === 'credit'
      ? `Bonjour ! Voici le lien de demande d'achat à crédit en ligne pour *${boutiqueNom}*. Vous pouvez passer votre demande sur ce lien :\n\n👉 ${finalUrl}`
      : `Bonjour ! Voici le catalogue officiel et la vitrine en ligne de *${boutiqueNom}*. Vous pouvez passer votre commande directement sur ce lien :\n\n👉 ${finalUrl}`
    const waUrl = `https://wa.me/?text=${encodeURIComponent(textMsg)}`
    window.open(waUrl, '_blank')
  }

  const handleEnvoyerAuClientDirect = (e: React.FormEvent) => {
    e.preventDefault()
    if (!telClientInShop.trim()) return
    const cleanTel = telClientInShop.replace(/\D/g, '')
    const targetTel = cleanTel.length === 9 ? '221' + cleanTel : cleanTel
    const textMsg = activeMode === 'credit'
      ? `Bonjour ! Voici votre lien de demande d'achat à crédit auprès de la boutique *${boutiqueNom}* :\n\n👉 ${finalUrl}`
      : `Bonjour ! Voici le catalogue officiel et la vitrine de la boutique *${boutiqueNom}* :\n\n👉 ${finalUrl}`
    window.open(`https://wa.me/${targetTel}?text=${encodeURIComponent(textMsg)}`, '_blank')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
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
          borderRadius: 24,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
          maxWidth: isGrandEcran ? 520 : 460,
          width: '100%',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
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
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontWeight: 800,
            color: '#64748b'
          }}
          title={t('common.close')}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', width: '100%' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
            {modalTitle}
          </h3>
          <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
            {t('shop.qrScanHelp')}
          </p>
        </div>

        {/* Choix du type de QR Code (Vitrine vs Crédit Comptoir) */}
        <div style={{ width: '100%', display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 12, gap: 4 }}>
          <button
            type="button"
            onClick={() => setActiveMode('vitrine')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 8,
              border: 'none',
              background: activeMode === 'vitrine' ? '#ffffff' : 'transparent',
              color: activeMode === 'vitrine' ? '#0f172a' : '#64748b',
              fontWeight: activeMode === 'vitrine' ? 800 : 600,
              fontSize: 12,
              cursor: 'pointer',
              boxShadow: activeMode === 'vitrine' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            {t('shop.qrVitrineOption')}
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('credit')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 8,
              border: 'none',
              background: activeMode === 'credit' ? '#0284c7' : 'transparent',
              color: activeMode === 'credit' ? '#ffffff' : '#64748b',
              fontWeight: activeMode === 'credit' ? 800 : 600,
              fontSize: 12,
              cursor: 'pointer',
              boxShadow: activeMode === 'credit' ? '0 2px 6px rgba(2,132,199,0.3)' : 'none'
            }}
          >
            {t('shop.qrCreditOption')}
          </button>
        </div>

        {/* Cadre du QR Code (Scannable en Boutique) */}
        <div
          style={{
            padding: 16,
            background: '#ffffff',
            borderRadius: 20,
            border: '2px solid #e2e8f0',
            boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {qrSvg ? (
            <div
              dangerouslySetInnerHTML={{ __html: qrSvg }}
              style={{ width: isGrandEcran ? 300 : 210, height: isGrandEcran ? 300 : 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          ) : (
            <div style={{ width: 210, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
              {t('shop.qrGenerating')}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsGrandEcran(!isGrandEcran)}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            {isGrandEcran ? t('shop.qrNormalScreenBtn') : t('shop.qrFullScreenBtn')}
          </button>
        </div>

        {/* Partage direct vers le WhatsApp du client présent en boutique */}
        <form onSubmit={handleEnvoyerAuClientDirect} style={{ width: '100%', background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 11.5, fontWeight: 800, color: '#334155', margin: 0 }}>
            {t('shop.sendDirectToClientWaLabel')}
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="tel"
              placeholder={t('shop.clientWaPlaceholder')}
              value={telClientInShop}
              onChange={e => setTelClientInShop(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 12.5,
                fontWeight: 600,
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!telClientInShop.trim()}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: telClientInShop.trim() ? '#25D366' : '#cbd5e1',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 12,
                cursor: telClientInShop.trim() ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap'
              }}
            >
              {t('shop.sendToClientBtn')}
            </button>
          </div>
        </form>

        {/* Champ Lien URL & Boutons généraux */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              readOnly
              value={finalUrl}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                background: '#f8fafc',
                color: '#0f172a',
                fontWeight: 600,
                outline: 'none'
              }}
            />
            <button
              type="button"
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
              {copied ? `✓ ${t('common.copied')}` : `📋 ${t('common.copy')}`}
            </button>
          </div>
        </div>

        {/* Boutons de Partage Global & Téléchargement SVG */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
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
            {t('shop.shareGeneralWaBtn')}
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
              {t('shop.downloadPrintableQrSvg')}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
