'use client'

import { useState, useEffect } from 'react'
import { Download, X, Share, Smartphone, Sparkles } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Ne rien faire si déjà exécuté en mode PWA standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isStandalone) return

    // Vérifier si l'utilisateur a déjà masqué la bannière récemment (14 jours)
    const dismissedTime = localStorage.getItem('nopalou_pwa_dismissed')
    if (dismissedTime) {
      const daysPassed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24)
      if (daysPassed < 14) return
    }

    // Détection iOS Safari
    const ua = window.navigator.userAgent
    const isIOSDevice = /iPhone|iPad|iPod/i.test(ua) && !(window as any).MSStream
    if (isIOSDevice) {
      setIsIOS(true)
      setShowBanner(true)
      return
    }

    // Écoute de l'événement natif Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Cacher la bannière après installation réussie
    const handleAppInstalled = () => {
      setShowBanner(false)
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }

    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowIOSGuide(false)
    localStorage.setItem('nopalou_pwa_dismissed', Date.now().toString())
  }

  if (!showBanner) return null

  return (
    <>
      {/* 🚀 BANNIÈRE FLOTTANTE DE PROMOTION PWA */}
      <div style={{
        position: 'fixed',
        bottom: 74, // Au-dessus de la barre de navigation mobile
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: 460,
        zIndex: 999,
        background: 'var(--navy)',
        color: '#fff',
        borderRadius: 16,
        padding: '12px 14px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Icône Nopalou */}
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #C75B00 0%, #ea580c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(199, 91, 0, 0.4)',
        }}>
          <Smartphone size={24} style={{ color: '#fff' }} />
        </div>

        {/* Texte promotionnel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              Installer l'App Nopalou
            </h4>
            <span style={{ background: 'rgba(255,255,255,0.18)', color: '#fdba74', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
              Gratuit
            </span>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Accès ultra-rapide & mode Caisse POS hors-ligne ⚡
          </p>
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            onClick={handleInstallClick}
            style={{
              background: 'linear-gradient(135deg, #C75B00 0%, #ea580c 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.4)',
            }}
          >
            <Download size={14} /> Installer
          </button>

          <button
            onClick={handleDismiss}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#94a3b8',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 📲 MODALE D'INSTRUCTION SPÉCIFIQUE IPHONE / IOS */}
      {showIOSGuide && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1050,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: 16,
        }} onClick={() => setShowIOSGuide(false)}>
          <div style={{
            width: '100%', maxWidth: 400, background: '#fff', borderRadius: 20,
            padding: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.25s ease-out', color: '#0f172a',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} style={{ color: '#C75B00' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Installer sur iPhone / iPad</h3>
              </div>
              <button onClick={() => setShowIOSGuide(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <ol style={{ margin: '0 0 16px', paddingLeft: 20, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
              <li style={{ marginBottom: 8 }}>
                Appuyez sur le bouton <strong>Partager</strong> <Share size={14} style={{ display: 'inline', margin: '0 2px', color: '#0284c7' }} /> en bas de votre navigateur Safari.
              </li>
              <li style={{ marginBottom: 8 }}>
                Faites défiler vers le bas et sélectionnez <strong>Sur l'écran d'accueil</strong> 📲.
              </li>
              <li>
                Appuyez sur <strong>Ajouter</strong> en haut à droite pour finaliser l'installation.
              </li>
            </ol>

            <button
              onClick={handleDismiss}
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--navy)', color: '#fff',
                border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer'
              }}
            >
              C'est compris !
            </button>
          </div>
        </div>
      )}
    </>
  )
}
