'use client'
import React, { useState, useEffect } from 'react'
import {
  Package,
  Share2,
  Receipt,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react'

interface ProductTourModalProps {
  isOpen: boolean
  onClose: () => void
  onAjouterProduitDirect?: () => void
}

export default function ProductTourModal({
  isOpen,
  onClose,
  onAjouterProduitDirect
}: ProductTourModalProps) {
  const [step, setStep] = useState<number>(1)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
    }
  }, [isOpen])

  if (!isOpen) return null

  const totalSteps = 3

  function handleTerminer() {
    try {
      localStorage.setItem('nopalou_merchant_tour_done', 'true')
    } catch (e) { console.warn('[Nopalou:ProductTourModal:L30]', e); }
    onClose()
  }

  function handleSuivant() {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      handleTerminer()
    }
  }

  function handlePrecedent() {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        className="npl-card-airy"
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          position: 'relative',
          animation: 'fadeIn 0.25s ease'
        }}
      >
        {/* En-tête : Étape et Fermer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#C75B00',
                background: '#FFF7ED',
                padding: '4px 10px',
                borderRadius: 20,
                border: '1px solid #FFEDD5'
              }}
            >
              Étape {step} sur {totalSteps}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
              Guide Démarrage Express
            </span>
          </div>
          <button
            type="button"
            onClick={handleTerminer}
            aria-label="Fermer le guide"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4
            }}
          >
            ✕
          </button>
        </div>

        {/* Barre de progression */}
        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', width: '100%' }}>
          <div
            style={{
              height: '100%',
              width: `${(step / totalSteps) * 100}%`,
              background: 'linear-gradient(90deg, #C75B00, #ea580c)',
              borderRadius: 4,
              transition: 'width 0.3s ease'
            }}
          />
        </div>

        {/* Contenu de chaque étape */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: '#FFF7ED',
                color: '#C75B00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #FFEDD5'
              }}
            >
              <Package size={28} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                1. Mettez en vente en 10 secondes chrono
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                Prenez une photo de votre article, saisissez son nom (ou scannez son étiquette code-barres par caméra) et indiquez votre prix de vente en FCFA.
              </p>
            </div>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <Sparkles size={18} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>
                Importez automatiquement vos fiches articles depuis AliExpress, SHEIN, Shopify ou Excel en 1 clic grâce à notre moteur intelligent.
              </span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bbf7d0'
              }}
            >
              <Share2 size={28} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                2. Partagez votre vitrine sur WhatsApp & TikTok
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                Chaque produit et votre catalogue complet disposent d&apos;un lien court direct et d&apos;un QR Code téléchargeable pour vos flyers, emballages et stories.
              </p>
            </div>
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <Zap size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#166534', fontWeight: 600 }}>
                Vos clients parcourent votre vitrine et vous envoient leurs commandes pré-remplies directement sur WhatsApp.
              </span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: '#f0f9ff',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bae6fd'
              }}
            >
              <Receipt size={28} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                3. Encaissez par Wave, OM & Caisse POS
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                Utilisez votre caisse tactile hors-ligne, tenez votre carnet de dettes client avec relances Wave 1-clic et générez des factures PDF professionnelles.
              </p>
            </div>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <ShieldCheck size={18} style={{ color: '#0284c7', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>
                Encaissements directs à 0% de commission et sécurisation des livraisons avec le paiement séquestre Pay Safe.
              </span>
            </div>
          </div>
        )}

        {/* Actions en bas */}
        <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center' }}>
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrecedent}
              className="npl-btn npl-btn-secondary"
              style={{ minHeight: 48, padding: '0 18px', borderRadius: 12, fontWeight: 700 }}
            >
              Précédent
            </button>
          )}

          <button
            type="button"
            onClick={handleSuivant}
            className="npl-btn npl-btn-primary"
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 15,
              background: 'linear-gradient(135deg, #C75B00 0%, #A34900 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {step < totalSteps ? 'Continuer ➜' : 'C&apos;est parti !'}
          </button>

          {step === totalSteps && onAjouterProduitDirect && (
            <button
              type="button"
              onClick={() => {
                handleTerminer()
                onAjouterProduitDirect()
              }}
              style={{
                minHeight: 48,
                padding: '0 16px',
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13.5,
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Ajouter 1er produit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
