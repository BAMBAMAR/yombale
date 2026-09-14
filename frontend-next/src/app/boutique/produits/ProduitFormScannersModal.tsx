'use client'

import React from 'react'

interface ProduitFormScannersModalProps {
  modalFormScanner: boolean
  scannerTarget: 'nom' | 'ean'
  scannerStatus: string
  imageFligeeNom: string | null
  setImageFligeeNom: (img: string | null) => void
  videoFormRef: React.RefObject<HTMLVideoElement>
  ocrLoading: boolean
  capturerEtLireNomTexte: () => Promise<void>
  nomForm: string
  setNomForm: (nom: string) => void
  arreterFormScanner: () => void
  ocrDetections: string[]
}

export function ProduitFormScannersModal({
  modalFormScanner,
  scannerTarget,
  scannerStatus,
  imageFligeeNom,
  setImageFligeeNom,
  videoFormRef,
  ocrLoading,
  capturerEtLireNomTexte,
  nomForm,
  setNomForm,
  arreterFormScanner,
  ocrDetections,
}: ProduitFormScannersModalProps) {
  if (!modalFormScanner) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 20,
          width: '100%',
          maxWidth: 460,
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
            {scannerTarget === 'nom' ? 'Scan Nom Produit (Face avant emballage)' : 'Scanner Code-Barres EAN'}
          </h4>
          <button
            onClick={arreterFormScanner}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{scannerStatus}</p>

        {scannerTarget === 'nom' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                width: '100%',
                height: 260,
                borderRadius: 14,
                overflow: 'hidden',
                background: '#000',
                position: 'relative',
                border: '1px solid #1e293b',
              }}
            >
              {imageFligeeNom ? (
                <img
                  src={imageFligeeNom}
                  alt="Capture"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0f172a' }}
                />
              ) : (
                <>
                  <video
                    ref={videoFormRef}
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
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
                    }}
                  >
                    <span
                      style={{
                        background: 'rgba(15,23,42,0.75)',
                        color: '#fff',
                        fontSize: 11,
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontWeight: 700,
                      }}
                    >
                      Placez l&apos;écriture du produit ici
                    </span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={capturerEtLireNomTexte}
                disabled={ocrLoading}
                style={{
                  flex: 1,
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: ocrLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {ocrLoading
                  ? 'Analyse OCR en cours...'
                  : imageFligeeNom
                  ? 'Reprendre la photo'
                  : 'Capturer le nom du produit'}
              </button>
              {imageFligeeNom && (
                <button
                  type="button"
                  onClick={() => setImageFligeeNom(null)}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Caméra active
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>Nom extrait à enregistrer :</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={nomForm}
                  onChange={e => setNomForm(e.target.value)}
                  placeholder="Nom du produit..."
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #0284c7',
                    fontSize: 13,
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={arreterFormScanner}
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0 14px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Valider
                </button>
              </div>
            </div>

            {ocrDetections.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  textAlign: 'left',
                  background: '#f8fafc',
                  padding: 8,
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>
                  Suggestions détectées (cliquez pour choisir) :
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ocrDetections.map((txt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNomForm(txt)}
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {txt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              height: 260,
              borderRadius: 14,
              overflow: 'hidden',
              background: '#000',
              border: '1px solid #1e293b',
            }}
          >
            <div id="produit-form-scanner-reader" style={{ width: '100%', height: '100%' }} />
          </div>
        )}

        <button
          onClick={arreterFormScanner}
          style={{
            background: '#e2e8f0',
            color: '#0f172a',
            border: 'none',
            borderRadius: 10,
            padding: '9px',
            fontWeight: 800,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
