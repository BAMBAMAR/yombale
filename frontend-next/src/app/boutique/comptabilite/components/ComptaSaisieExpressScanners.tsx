'use client'

import React from 'react'
import { useTranslation } from '@/i18n/context'

interface ComptaSaisieExpressScannersProps {
  modalScannerEan: boolean
  scannerEanStatus: string
  scanContinu: boolean
  onScanContinuChange: (checked: boolean) => void
  onCloseScannerEan: () => void
  modalScannerNom: boolean
  statusScannerNom: string
  imageFligeeComptaNom: string | null
  ocrLoading: boolean
  videoNomRef: React.RefObject<any>
  onCloseScannerNom: () => void
  onCapturerNomOCR: () => void
}

export function ComptaSaisieExpressScanners({
  modalScannerEan,
  scannerEanStatus,
  scanContinu,
  onScanContinuChange,
  onCloseScannerEan,
  modalScannerNom,
  statusScannerNom,
  imageFligeeComptaNom,
  ocrLoading,
  videoNomRef,
  onCloseScannerNom,
  onCapturerNomOCR,
}: ComptaSaisieExpressScannersProps) {
  const { t } = useTranslation()

  return (
    <>
      {/* ── Modal Scanner EAN Caméra Compta ── */}
      {modalScannerEan && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>{t('shop.scanBarcodeModalTitle')}</h4>
              <button type="button" onClick={onCloseScannerEan} style={{ background: 'none', border: 'none', color: 'var(--text3, #8C7E74)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text2, #5A4E42)', fontWeight: 600 }}>{scannerEanStatus}</p>
            <div style={{ width: '100%', height: 260, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <div id="compta-ean-scanner-reader" style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text2, #5A4E42)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700 }}>
                <input type="checkbox" checked={scanContinu} onChange={e => onScanContinuChange(e.target.checked)} />
                {t('shop.continuousScanCheckbox')}
              </label>
              <button type="button" onClick={onCloseScannerEan} style={{ background: 'var(--bg, #F8F5F0)', color: 'var(--navy, #1C2B4A)', border: '1px solid var(--border, #E8DDD2)', borderRadius: 8, padding: '6px 12px', fontWeight: 800, cursor: 'pointer' }}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Scanner Nom OCR Caméra Compta ── */}
      {modalScannerNom && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>{t('shop.scanProductNameModalTitle')}</h4>
              <button type="button" onClick={onCloseScannerNom} style={{ background: 'none', border: 'none', color: 'var(--text3, #8C7E74)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text2, #5A4E42)', fontWeight: 600 }}>{statusScannerNom}</p>
            <div style={{ width: '100%', height: 260, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              {imageFligeeComptaNom ? (
                <img src={imageFligeeComptaNom} alt="Capture" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0f172a' }} />
              ) : (
                <>
                  <video ref={videoNomRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '15%', left: '5%', width: '90%', height: '70%', border: '2px dashed var(--accent, #C75B00)', borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ background: 'rgba(28,43,74,0.85)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                      {t('shop.centerNamePrompt')}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={ocrLoading}
                onClick={onCapturerNomOCR}
                style={{ flex: 1, padding: '11px', background: ocrLoading ? 'var(--border, #E8DDD2)' : 'var(--navy, #1C2B4A)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: ocrLoading ? 'not-allowed' : 'pointer' }}
              >
                {ocrLoading ? t('common.loading') : (imageFligeeComptaNom ? 'Reprendre la photo' : t('shop.captureAndExtractNameBtn'))}
              </button>
              {imageFligeeComptaNom && (
                <button
                  type="button"
                  onClick={onCloseScannerNom}
                  style={{ background: 'var(--price, #0A5C36)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                >
                  Valider
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
