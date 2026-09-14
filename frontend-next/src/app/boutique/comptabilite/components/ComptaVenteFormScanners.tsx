'use client'

import React from 'react'
import { useTranslation } from '@/i18n/context'

interface ComptaVenteFormScannersProps {
  modalScannerEan: boolean
  scannerEanStatus: string
  onCloseEan: () => void
  modalScannerNom: boolean
  statusScannerNom: string
  ocrLoading: boolean
  videoNomRef: React.RefObject<any>
  onCloseNom: () => void
  onCaptureNomOCR: () => void
}

export function ComptaVenteFormScanners({
  modalScannerEan,
  scannerEanStatus,
  onCloseEan,
  modalScannerNom,
  statusScannerNom,
  ocrLoading,
  videoNomRef,
  onCloseNom,
  onCaptureNomOCR,
}: ComptaVenteFormScannersProps) {
  const { t } = useTranslation()

  return (
    <>
      {/* Modal Scanner EAN VenteForm */}
      {modalScannerEan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{t('shop.scanBarcodeModalTitle')}</h4>
              <button type="button" onClick={onCloseEan} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{scannerEanStatus}</p>
            <div style={{ width: '100%', height: 240, background: '#000', borderRadius: 12, overflow: 'hidden' }}>
              <div id="vente-ean-scanner-reader" style={{ width: '100%', height: '100%' }} />
            </div>
            <button type="button" onClick={onCloseEan} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 8, padding: '8px', fontWeight: 800, cursor: 'pointer' }}>
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {/* Modal Scanner Nom OCR VenteForm */}
      {modalScannerNom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{t('shop.scanProductNameModalTitle')}</h4>
              <button type="button" onClick={onCloseNom} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{statusScannerNom}</p>
            <div style={{ width: '100%', height: 240, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <video ref={videoNomRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '20%', left: '7.5%', width: '85%', height: '60%', border: '2px dashed #38bdf8', borderRadius: 8, pointerEvents: 'none' }} />
            </div>
            <button
              type="button"
              disabled={ocrLoading}
              onClick={onCaptureNomOCR}
              style={{ width: '100%', padding: '10px', background: ocrLoading ? '#94a3b8' : '#0284c7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: ocrLoading ? 'not-allowed' : 'pointer' }}
            >
              {ocrLoading ? t('common.loading') : t('shop.captureAndExtractNameBtn')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
