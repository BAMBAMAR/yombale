'use client'

import React from 'react'
import { X, Link as LinkIcon, Camera, QrCode, Check, Copy } from 'lucide-react'
import { StickerProduct, RelanceClient } from './types'

interface DemoModalsProps {
  showStickerModal: boolean
  stickerProd: StickerProduct | null
  onCloseSticker: () => void

  showWaRelanceModal: boolean
  relanceClient: RelanceClient | null
  onCloseWaRelance: () => void

  showScanModal: boolean
  onCloseScan: () => void

  showCloudScannerModal: boolean
  onCloseCloudScanner: () => void

  showShareModal: boolean
  onCloseShare: () => void
  referralCode: string
  onReferralCodeChange: (code: string) => void
  shareableUrl: string
  copiedLink: boolean
  onCopyLink: () => void
  onShareWhatsApp: () => void
}

export default function DemoModals({
  showStickerModal,
  stickerProd,
  onCloseSticker,
  showWaRelanceModal,
  relanceClient,
  onCloseWaRelance,
  showScanModal,
  onCloseScan,
  showCloudScannerModal,
  onCloseCloudScanner,
  showShareModal,
  onCloseShare,
  referralCode,
  onReferralCodeChange,
  shareableUrl,
  copiedLink,
  onCopyLink,
  onShareWhatsApp
}: DemoModalsProps) {
  return (
    <>
      {/* 1. STICKER EAN-13 MODAL */}
      {showStickerModal && stickerProd && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div style={{ background: '#FFF', padding: 20, borderRadius: 12, maxWidth: 360, width: '100%', textAlign: 'center', color: '#111' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 10px' }}>Sticker Thermique 50x30mm</h3>
            <div style={{ border: '2px dashed #000', padding: 12, background: '#FFF', borderRadius: 6, display: 'inline-block', width: '100%' }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Boutique Touba Express</div>
              <div style={{ fontSize: 13, fontWeight: 700, margin: '4px 0' }}>{stickerProd.nom}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#059669' }}>{stickerProd.prix.toLocaleString()} FCFA</div>
              <div style={{ fontSize: 24, letterSpacing: 4, fontFamily: 'monospace', margin: '8px 0 2px' }}>|||||||||||||||</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace' }}>{stickerProd.ean}</div>
            </div>
            <button
              type="button"
              onClick={onCloseSticker}
              style={{ marginTop: 14, background: '#111', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
            >
              Fermer l&apos;Aperçu
            </button>
          </div>
        </div>
      )}

      {/* 2. WHATSAPP RELANCE MODAL */}
      {showWaRelanceModal && relanceClient && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div style={{ background: '#DCF8C6', padding: 20, borderRadius: 12, maxWidth: 400, width: '100%', color: '#111' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 8px', color: '#075E54' }}>
              Aperçu Message WhatsApp Relance Client
            </h3>
            <div style={{ background: '#FFF', padding: 12, borderRadius: 8, fontSize: 12, lineHeight: 1.6, color: '#111' }}>
              Bonjour *{relanceClient.nom}*,<br /><br />
              Nous espérons que vous allez bien. Votre solde du carnet chez *Boutique Touba Express* est de *{relanceClient.solde.toLocaleString()} FCFA*.<br /><br />
              Promesse d&apos;échéance : *{relanceClient.echeance}*<br />
              Quartier : {relanceClient.quartier}<br /><br />
              Merci de régler par Wave/OM au 77 123 45 67. Excellente journée !
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button
                type="button"
                onClick={onCloseWaRelance}
                style={{ flex: 1, background: '#075E54', color: '#FFF', border: 'none', padding: '8px 12px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
              >
                Envoyer (Simulation)
              </button>
              <button
                type="button"
                onClick={onCloseWaRelance}
                style={{ background: '#FFF', color: '#333', border: '1px solid #ccc', padding: '8px 12px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SCAN CAMERA MODAL */}
      {showScanModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div style={{ background: '#1E293B', padding: 20, borderRadius: 12, maxWidth: 360, width: '100%', textAlign: 'center', color: '#FFF' }}>
            <Camera size={36} color="#10B981" style={{ margin: '0 auto 10px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>Scan Caméra Smartphone en Cours...</h3>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>Pointez le code-barres EAN-13 du produit avec votre caméra.</p>
            <div style={{ border: '2px dashed #10B981', height: 100, margin: '14px 0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontWeight: 800 }}>
              DÉTECTION EAN-13 EN COURS
            </div>
            <button
              type="button"
              onClick={onCloseScan}
              style={{ background: '#EF4444', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* 4. CLOUD SCANNER MODAL */}
      {showCloudScannerModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div style={{ background: '#1E293B', padding: 20, borderRadius: 12, maxWidth: 380, width: '100%', color: '#FFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <QrCode size={20} color="#0284C7" />
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Douchette Smartphone Distante (Cloud Sync)</h3>
            </div>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 10px' }}>
              Scannez ce QR Code avec le smartphone de votre caissier pour transformer le téléphone en douchette sans fil connectée au PC (&lt;100ms).
            </p>
            <div style={{ background: '#FFF', padding: 12, borderRadius: 8, display: 'inline-block', color: '#000', fontWeight: 900, fontSize: 14 }}>
              CODE SESSION : <code>NOPALOU-POS-8492</code>
            </div>
            <button
              type="button"
              onClick={onCloseCloudScanner}
              style={{ display: 'block', width: '100%', marginTop: 14, background: '#0284C7', color: '#FFF', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* 5. SHARE MODAL */}
      {showShareModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(28, 43, 74, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 22,
              maxWidth: 460,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              position: 'relative',
              color: 'var(--text1)'
            }}
          >
            <button
              type="button"
              onClick={onCloseShare}
              style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 4 }}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <LinkIcon size={17} color="var(--navy)" />
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                  Lien Commercial Partageable
                </h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                Saisissez votre code apporteur pour que les visites soient rattachées à votre profil.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text1)', display: 'block', marginBottom: 4 }}>
                  VOTRE CODE APPORTEUR / VENDEUR :
                </label>
                <input
                  type="text"
                  placeholder="Ex: APPORT-77"
                  value={referralCode}
                  onChange={e => onReferralCodeChange(e.target.value.toUpperCase())}
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text1)', fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text1)', display: 'block', marginBottom: 4 }}>
                  LIEN GÉNÉRÉ :
                </label>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: 10, borderRadius: 8, fontFamily: 'monospace', fontSize: 11, color: '#0D9488', wordBreak: 'break-all' }}>
                  {shareableUrl}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onCopyLink}
                style={{
                  flex: 1,
                  background: 'var(--bg)',
                  color: 'var(--text1)',
                  border: '1px solid var(--border)',
                  padding: 11,
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                {copiedLink ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                <span>{copiedLink ? 'Lien Copié !' : 'Copier le Lien'}</span>
              </button>
              <button
                type="button"
                onClick={onShareWhatsApp}
                style={{ flex: 1, background: '#059669', color: '#FFF', border: 'none', padding: 11, borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Partager WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
