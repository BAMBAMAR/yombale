'use client'

import React, { useState, useMemo } from 'react'
import { CheckCircle2, Copy, ArrowRight, MessageCircle, Sparkles, Check, Printer, QrCode } from 'lucide-react'
import QRCode from 'qrcode-svg'
import { useToast } from '@/context/ToastContext'

interface ModalBoutiqueCreeeSuccesProps {
  nom: string
  boutiqueId: string
  slug?: string | null
  telephone?: string
}

export default function ModalBoutiqueCreeeSucces({
  nom,
  boutiqueId,
  slug,
  telephone,
}: ModalBoutiqueCreeeSuccesProps) {
  const { toast } = useToast()
  const [copie, setCopie] = useState(false)

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com'
  const lienBoutique = `${siteUrl}/boutiques/${slug || boutiqueId}`

  const messageWhatsapp = `Bonjour à tous !\n\nDécouvrez notre nouvelle vitrine officielle en ligne chez *${nom}* !\n\nRetrouvez tous nos articles avec prix et stock à jour, et commandez directement sur WhatsApp ou par Wave :\n${lienBoutique}\n\nLivraison rapide partout au Sénégal !`

  const qrSvgString = useMemo(() => {
    try {
      const qr = new QRCode({
        content: lienBoutique,
        padding: 1,
        width: 130,
        height: 130,
        color: '#1C2B4A',
        background: '#ffffff',
        ecl: 'M',
      })
      return qr.svg()
    } catch {
      return ''
    }
  }, [lienBoutique])

  const handleCopierLien = async () => {
    try {
      await navigator.clipboard.writeText(lienBoutique)
      setCopie(true)
      toast.success('Lien de votre boutique copié dans le presse-papier !')
      setTimeout(() => setCopie(false), 2500)
    } catch {
      toast.error('Impossible de copier le lien.')
    }
  }

  const handlePartagerWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(messageWhatsapp)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleImprimerAffiche = () => {
    const posterUrl = `/assets/affiche-vitrine?boutique=${encodeURIComponent(nom)}&slug=${encodeURIComponent(slug || boutiqueId)}&phone=${encodeURIComponent(telephone || '')}`
    const printWin = window.open('', '_blank')
    if (!printWin) {
      window.open(posterUrl, '_blank')
      return
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Affiche Comptoir - ${nom}</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; background: #ffffff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            img { max-width: 100%; max-height: 100vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${posterUrl}" alt="Affiche Comptoir" onload="window.print()" />
        </body>
      </html>
    `)
    printWin.document.close()
  }

  const handleAllerDashboard = () => {
    window.location.href = `/boutique?manage=${boutiqueId}&bienvenue=true`
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: '#ffffff',
          borderRadius: 24,
          padding: '32px 28px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 16,
          animation: 'nplSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Badge d'accomplissement */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#ecfdf5',
            color: 'var(--price, #0A5C36)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(10, 92, 54, 0.15)',
            flexShrink: 0,
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#FFF3E8',
              color: 'var(--accent, #C75B00)',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}
          >
            <Sparkles size={13} />
            Votre boutique est en ligne
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: 'var(--navy, #1C2B4A)',
              margin: '0 0 6px',
              lineHeight: 1.25,
            }}
          >
            Félicitations pour {nom} !
          </h2>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text2, #5A4E42)',
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            Votre vitrine digitale est opérationnelle et prête à recevoir vos commandes et paiements Wave.
          </p>
        </div>

        {/* Aperçu QR Code de comptoir */}
        {qrSvgString && (
          <div
            style={{
              background: 'var(--bg, #F8F5F0)',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 16,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              width: '100%',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                padding: 8,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                display: 'inline-flex',
              }}
              dangerouslySetInnerHTML={{ __html: qrSvgString }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>
              <QrCode size={13} color="var(--accent, #C75B00)" />
              Scannez avec votre appareil photo pour tester
            </div>
          </div>
        )}

        {/* Encadré lien boutique */}
        <div
          style={{
            width: '100%',
            background: 'var(--bg, #F8F5F0)',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 14,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--navy, #1C2B4A)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'left',
            }}
          >
            {lienBoutique}
          </span>
          <button
            type="button"
            onClick={handleCopierLien}
            style={{
              background: copie ? 'var(--price, #0A5C36)' : '#ffffff',
              color: copie ? '#ffffff' : 'var(--navy, #1C2B4A)',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            {copie ? <Check size={13} /> : <Copy size={13} />}
            {copie ? 'Copié' : 'Copier'}
          </button>
        </div>

        {/* Actions principales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, width: '100%' }}>
          {/* Bouton Partager Statut WhatsApp */}
          <button
            type="button"
            onClick={handlePartagerWhatsApp}
            style={{
              width: '100%',
              minHeight: 48,
              borderRadius: 14,
              background: '#25D366',
              color: '#ffffff',
              border: 'none',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
              transition: 'transform 0.15s ease, background 0.15s ease',
            }}
          >
            <MessageCircle size={18} />
            Partager sur mon Statut WhatsApp
          </button>

          {/* Bouton Imprimer Affiche Comptoir A4 */}
          <button
            type="button"
            onClick={handleImprimerAffiche}
            style={{
              width: '100%',
              minHeight: 44,
              borderRadius: 14,
              background: '#ffffff',
              color: 'var(--navy, #1C2B4A)',
              border: '1.5px solid var(--border, #E8DDD2)',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.15s ease',
            }}
          >
            <Printer size={16} color="var(--accent, #C75B00)" />
            Imprimer l&apos;Affiche QR Code Comptoir (A4)
          </button>

          {/* Bouton Dashboard */}
          <button
            type="button"
            onClick={handleAllerDashboard}
            style={{
              width: '100%',
              minHeight: 46,
              borderRadius: 14,
              background: 'var(--navy, #1C2B4A)',
              color: '#ffffff',
              border: 'none',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.15s ease',
            }}
          >
            Accéder à mon Espace Marchand &amp; Caisse POS
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
