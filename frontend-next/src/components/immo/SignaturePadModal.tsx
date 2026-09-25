'use client'

import React, { useRef, useState, useEffect } from 'react'
import { PenTool, X, ShieldCheck, AlertCircle, Loader2, Camera, Stamp, ChevronDown, ChevronUp } from 'lucide-react'
import SignatureCanvas, { SignatureCanvasHandle } from './SignatureCanvas'
import SignaturePhotoUpload from './SignaturePhotoUpload'

interface SignaturePadModalProps {
  isOpen: boolean
  title?: string
  subtitle?: string
  signerRole: 'locataire' | 'bailleur' | 'agence'
  defaultSignerName?: string
  onClose: () => void
  onSaveSignature: (signatureDataUrl: string, signerName: string, cachetDataUrl?: string | null) => Promise<void>
}

type SignatureMode = 'draw' | 'photo'

export default function SignaturePadModal({
  isOpen,
  title = 'Signature Électronique du Bail',
  subtitle = 'Signez directement sur votre écran ou importez une photo de votre signature.',
  signerRole,
  defaultSignerName = '',
  onClose,
  onSaveSignature,
}: SignaturePadModalProps) {
  const canvasHandleRef = useRef<SignatureCanvasHandle | null>(null)
  const [signerName, setSignerName] = useState(defaultSignerName)
  const [sigMode, setSigMode] = useState<SignatureMode>('draw')
  const [hasDrawn, setHasDrawn] = useState(false)
  const [signaturePhoto, setSignaturePhoto] = useState<string | null>(null)
  const [cachetPhoto, setCachetPhoto] = useState<string | null>(null)
  const [showCachetSection, setShowCachetSection] = useState(signerRole === 'agence' || signerRole === 'bailleur')
  const [acceptTerms, setAcceptTerms] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSignerName(defaultSignerName)
      setErrorMsg(null)
      setHasDrawn(false)
      setSignaturePhoto(null)
      setCachetPhoto(null)
      setSigMode('draw')
      setShowCachetSection(signerRole === 'agence' || signerRole === 'bailleur')
    }
  }, [isOpen, defaultSignerName, signerRole])

  if (!isOpen) return null

  const isSignatureReady = sigMode === 'draw' ? hasDrawn : Boolean(signaturePhoto)

  async function handleSubmit() {
    let finalSignatureUrl: string | null = null

    if (sigMode === 'draw') {
      if (!canvasHandleRef.current?.hasDrawn()) {
        setErrorMsg('Veuillez apposer votre signature sur le cadre de tracé.')
        return
      }
      finalSignatureUrl = canvasHandleRef.current.getDataUrl()
    } else {
      if (!signaturePhoto) {
        setErrorMsg('Veuillez importer une photo de votre signature manuscrite.')
        return
      }
      finalSignatureUrl = signaturePhoto
    }

    if (!finalSignatureUrl) {
      setErrorMsg('Erreur lors de la capture de la signature.')
      return
    }

    if (!signerName.trim()) {
      setErrorMsg('Veuillez renseigner votre prénom et nom complets.')
      return
    }

    if (!acceptTerms) {
      setErrorMsg('Veuillez accepter l\'engagement de signature légale.')
      return
    }

    try {
      setSubmitting(true)
      setErrorMsg(null)
      await onSaveSignature(finalSignatureUrl, signerName.trim(), cachetPhoto || null)
      onClose()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement de la signature.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 560,
          boxShadow: '0 20px 50px rgba(28, 43, 74, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PenTool size={18} style={{ color: 'var(--accent, #C75B00)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontSize: 11.5, color: '#64748B' }}>
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: '18px 20px', overflowY: 'auto' }}>
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: 12.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nom du signataire */}
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
                marginBottom: 5,
              }}
            >
              Nom & Prénom du Signataire ({signerRole === 'locataire' ? 'Le Preneur' : 'Le Bailleur / Mandataire'})
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Ex : Ousmane Ba"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1.5px solid var(--border, #E8DDD2)',
                fontSize: 13.5,
                fontWeight: 700,
                color: 'var(--navy, #1C2B4A)',
                background: '#FAF8F5',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Choix du mode de signature : Manuscrit ou Photo */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Format de la signature
              </span>

              {/* Boutons d'onglets segmented */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  background: '#F1F5F9',
                  padding: 3,
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSigMode('draw')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: 750,
                    cursor: 'pointer',
                    background: sigMode === 'draw' ? '#ffffff' : 'transparent',
                    color: sigMode === 'draw' ? 'var(--navy, #1C2B4A)' : '#64748B',
                    boxShadow: sigMode === 'draw' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <PenTool size={12} />
                  <span>Tracer à l&apos;écran</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSigMode('photo')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: 750,
                    cursor: 'pointer',
                    background: sigMode === 'photo' ? '#ffffff' : 'transparent',
                    color: sigMode === 'photo' ? 'var(--navy, #1C2B4A)' : '#64748B',
                    boxShadow: sigMode === 'photo' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <Camera size={12} />
                  <span>Photo / Scan</span>
                </button>
              </div>
            </div>

            {/* Zone de signature selon le mode sélectionné */}
            {sigMode === 'draw' ? (
              <SignatureCanvas
                ref={canvasHandleRef}
                onStrokeChange={(drawn) => setHasDrawn(drawn)}
              />
            ) : (
              <SignaturePhotoUpload
                label="Photo de la signature manuscrite"
                subtitle="Téléversez ou prenez en photo votre signature écrite sur une feuille blanche."
                imageDataUrl={signaturePhoto}
                onChange={setSignaturePhoto}
                isStamp={false}
                signerRole={signerRole}
              />
            )}
          </div>

          {/* Section Cachet Officiel / Tampon (Photo) */}
          <div
            style={{
              marginTop: 14,
              marginBottom: 14,
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 12,
              background: '#FFFFFF',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setShowCachetSection(!showCachetSection)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#FAF8F5',
                border: 'none',
                borderBottom: showCachetSection ? '1px solid var(--border, #E8DDD2)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Stamp size={15} style={{ color: 'var(--accent, #C75B00)' }} />
                <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                  Cachet officiel / Sceau d&apos;entreprise
                </span>
                {cachetPhoto && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#166534',
                      background: '#DCFCE7',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    Joint
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 11.5 }}>
                <span>{showCachetSection ? 'Réduire' : 'Ajouter une photo'}</span>
                {showCachetSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {showCachetSection && (
              <div style={{ padding: '12px 14px' }}>
                <SignaturePhotoUpload
                  label="Photo du Cachet / Tampon d'agence"
                  subtitle="Téléversez ou photographiez le tampon encreur officiel de l'agence ou de la société."
                  imageDataUrl={cachetPhoto}
                  onChange={setCachetPhoto}
                  isStamp={true}
                  signerRole={signerRole}
                />
              </div>
            )}
          </div>

          {/* Engagement légal */}
          <div
            style={{
              padding: '12px',
              borderRadius: 10,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              style={{ marginTop: 2, cursor: 'pointer' }}
            />
            <label
              htmlFor="acceptTerms"
              style={{
                fontSize: 11,
                color: '#475569',
                lineHeight: 1.45,
                cursor: 'pointer',
              }}
            >
              <strong style={{ color: 'var(--navy, #1C2B4A)' }}>Valeur Probante COCC : </strong>
              Je certifie l&apos;exactitude des informations et consens à la signature électronique de ce contrat de bail conformément aux dispositions du Code des Obligations Civiles et Commerciales du Sénégal.
            </label>
          </div>
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            background: '#ffffff',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              border: '1px solid var(--border, #E8DDD2)',
              background: '#ffffff',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !isSignatureReady || !signerName.trim() || !acceptTerms}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              border: 'none',
              background: submitting || !isSignatureReady || !signerName.trim() || !acceptTerms
                ? '#CBD5E1'
                : 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #2A3F6D 100%)',
              color: '#ffffff',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: submitting || !isSignatureReady || !signerName.trim() || !acceptTerms ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: isSignatureReady ? '0 4px 14px rgba(28, 43, 74, 0.25)' : 'none',
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} style={{ color: 'var(--accent, #C75B00)' }} />
                <span>Confirmer & Signer le Bail</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
