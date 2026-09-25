'use client'

import React, { useRef, useState, useEffect } from 'react'
import { PenTool, X, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react'
import SignatureCanvas, { SignatureCanvasHandle } from './SignatureCanvas'

interface SignaturePadModalProps {
  isOpen: boolean
  title?: string
  subtitle?: string
  signerRole: 'locataire' | 'bailleur' | 'agence'
  defaultSignerName?: string
  onClose: () => void
  onSaveSignature: (signatureDataUrl: string, signerName: string) => Promise<void>
}

export default function SignaturePadModal({
  isOpen,
  title = 'Signature Électronique du Bail',
  subtitle = 'Signez directement sur votre écran tactile (au doigt) ou à l\'aide de votre souris.',
  signerRole,
  defaultSignerName = '',
  onClose,
  onSaveSignature,
}: SignaturePadModalProps) {
  const canvasHandleRef = useRef<SignatureCanvasHandle | null>(null)
  const [signerName, setSignerName] = useState(defaultSignerName)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSignerName(defaultSignerName)
      setErrorMsg(null)
      setHasDrawn(false)
    }
  }, [isOpen, defaultSignerName])

  if (!isOpen) return null

  async function handleSubmit() {
    if (!canvasHandleRef.current?.hasDrawn()) {
      setErrorMsg('Veuillez apposer votre signature sur le cadre ci-dessus.')
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

    const dataUrl = canvasHandleRef.current.getDataUrl()
    if (!dataUrl) {
      setErrorMsg('Erreur lors de la capture du tracé de signature.')
      return
    }

    try {
      setSubmitting(true)
      setErrorMsg(null)
      await onSaveSignature(dataUrl, signerName.trim())
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
          maxWidth: 540,
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
            padding: '18px 22px',
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
        <div style={{ padding: '20px 22px', overflowY: 'auto' }}>
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

          {/* Canvas de signature */}
          <div style={{ marginBottom: 14 }}>
            <SignatureCanvas
              ref={canvasHandleRef}
              onStrokeChange={(drawn) => setHasDrawn(drawn)}
            />
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
            padding: '16px 22px',
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
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid var(--border, #E8DDD2)',
              background: '#ffffff',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !hasDrawn || !signerName.trim() || !acceptTerms}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: submitting || !hasDrawn || !signerName.trim() || !acceptTerms
                ? '#CBD5E1'
                : 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #2A3F6D 100%)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 800,
              cursor: submitting || !hasDrawn || !signerName.trim() || !acceptTerms ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: hasDrawn ? '0 4px 14px rgba(28, 43, 74, 0.25)' : 'none',
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
