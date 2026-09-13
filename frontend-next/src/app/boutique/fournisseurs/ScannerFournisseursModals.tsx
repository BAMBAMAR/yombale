'use client'

import React from 'react'
import { X } from 'lucide-react'

interface ScannerFournisseursModalsProps {
  modalScannerEanCmd: boolean
  scannerEanStatusCmd: string
  arreterScannerEanCmd: () => void
  modalScannerNomCmd: boolean
  statusScannerNomCmd: string
  imageFligeeFournisseurNom: string | null
  videoNomCmdRef: React.RefObject<any>
  ocrLoadingCmd: boolean
  capturerNomOCRCmd: () => void
  arreterScannerNomCmd: () => void
  t: (key: string) => string
}

export default function ScannerFournisseursModals({
  modalScannerEanCmd,
  scannerEanStatusCmd,
  arreterScannerEanCmd,
  modalScannerNomCmd,
  statusScannerNomCmd,
  imageFligeeFournisseurNom,
  videoNomCmdRef,
  ocrLoadingCmd,
  capturerNomOCRCmd,
  arreterScannerNomCmd,
  t,
}: ScannerFournisseursModalsProps) {
  return (
    <>
      {/* Modal Scanner EAN Fournisseur */}
      {modalScannerEanCmd && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 20,
              width: '100%',
              maxWidth: 440,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                {t('shop.scanBarcodeModalTitle')}
              </h4>
              <button
                type="button"
                onClick={arreterScannerEanCmd}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>
              {scannerEanStatusCmd}
            </p>
            <div
              style={{
                width: '100%',
                height: 260,
                background: '#000',
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div id="fou-ean-scanner-reader" style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={arreterScannerEanCmd}
                style={{
                  background: '#e2e8f0',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Scanner Nom OCR Fournisseur */}
      {modalScannerNomCmd && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 20,
              width: '100%',
              maxWidth: 440,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                {t('shop.scanProductNameModalTitle')}
              </h4>
              <button
                type="button"
                onClick={arreterScannerNomCmd}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>
              {statusScannerNomCmd}
            </p>
            <div
              style={{
                width: '100%',
                height: 260,
                background: '#000',
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {imageFligeeFournisseurNom ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageFligeeFournisseurNom}
                  alt="Capture"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0f172a' }}
                />
              ) : (
                <>
                  <video
                    ref={videoNomCmdRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '15%',
                      left: '5%',
                      width: '90%',
                      height: '70%',
                      border: '2px dashed #38bdf8',
                      borderRadius: 12,
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        background: 'rgba(15,23,42,0.75)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 20,
                      }}
                    >
                      {t('shop.frameNameCenterDoc')}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={ocrLoadingCmd}
                onClick={capturerNomOCRCmd}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: ocrLoadingCmd ? '#94a3b8' : '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: ocrLoadingCmd ? 'not-allowed' : 'pointer',
                }}
              >
                {ocrLoadingCmd
                  ? t('shop.ocrAnalyzingDoc')
                  : imageFligeeFournisseurNom
                    ? 'Reprendre la photo'
                    : t('shop.extractNameDocBtn')}
              </button>
              {imageFligeeFournisseurNom && (
                <button
                  type="button"
                  onClick={arreterScannerNomCmd}
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '11px 16px',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
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
