'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Download, X, Share, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const STORAGE_KEY_DISMISSED = 'surga_pwa_dismissed_at'
const DISMISS_DURATION_DAYS = 7

/**
 * Invite d'installation PWA officielle et premium pour Surga.
 * Affiche l'icône officielle de Surga à l'ouverture pour inciter l'utilisateur
 * à installer l'assistant sur son écran d'accueil (Android, Chrome, iOS Safari).
 */
export default function SurgaPwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [estInstalle, setEstInstalle] = useState(false)

  // Vérification de l'état PWA au montage
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Détection du mode PWA standalone (déjà installé)
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')

    if (checkStandalone) {
      setIsStandalone(true)
      return
    }

    // 2. Détection iOS Safari
    const ua = window.navigator.userAgent
    const isIOSDevice = /iPhone|iPad|iPod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(isIOSDevice)

    // 3. Vérifier si l'utilisateur a masqué récemment
    const dismissedTime = localStorage.getItem(STORAGE_KEY_DISMISSED)
    let doitAfficher = true
    if (dismissedTime) {
      const daysPassed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24)
      if (daysPassed < DISMISS_DURATION_DAYS) {
        doitAfficher = false
      }
    }

    // Si iOS et pas encore masqué, afficher la proposition après un léger délai de démarrage (800ms)
    if (isIOSDevice && doitAfficher) {
      const timer = setTimeout(() => setShowBanner(true), 800)
      return () => clearTimeout(timer)
    }

    // 4. Écoute de l'événement natif Chrome / Android / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (doitAfficher) {
        setShowBanner(true)
      }
    }

    // 5. Écoute de l'événement d'installation réussie
    const handleAppInstalled = () => {
      setShowBanner(false)
      setShowIOSModal(false)
      setDeferredPrompt(null)
      setEstInstalle(true)
      localStorage.removeItem(STORAGE_KEY_DISMISSED)
    }

    // 6. Écoute de la demande d'ouverture forcée (ex: depuis l'onglet Réglages)
    const handleDemandeManuelle = () => {
      setShowBanner(true)
      if (isIOSDevice) {
        setShowIOSModal(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('surga-demande-installation-pwa', handleDemandeManuelle)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('surga-demande-installation-pwa', handleDemandeManuelle)
    }
  }, [])

  // Action principale de clic sur « Installer »
  const handleInstallClick = useCallback(async () => {
    if (isIOS) {
      setShowIOSModal(true)
      return
    }

    if (!deferredPrompt) {
      setShowIOSModal(true)
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
        setEstInstalle(true)
      }
    } catch (err) {
      console.warn('[SURGA PWA] Échec invite installation:', err)
    } finally {
      setDeferredPrompt(null)
    }
  }, [isIOS, deferredPrompt])

  // Masquer l'invite et mémoriser pour 7 jours
  const handleDismiss = useCallback(() => {
    setShowBanner(false)
    setShowIOSModal(false)
    try {
      localStorage.setItem(STORAGE_KEY_DISMISSED, Date.now().toString())
    } catch {}
  }, [])

  // Ne rien afficher si déjà en mode PWA autonome
  if (isStandalone || estInstalle) return null

  return (
    <>
      {/* BANNIÈRE D'INVITATION PREMIUM À L'OUVERTURE */}
      {showBanner && (
        <aside role="region" aria-label="Installer Surga" className="surga-pwa-banner">
          {/* L'icône officielle et premium de Surga */}
          <div className="surga-pwa-banner-icon">
            <img
              src="/surga/surga-symbol.png"
              alt="Surga"
              width={48}
              height={48}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div className="surga-pwa-banner-sparkle">
              <Sparkles size={9} color="#F59E0B" />
            </div>
          </div>

          {/* Textes valorisants */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Installer Surga
              </span>
              <span style={{ background: 'rgba(217, 119, 6, 0.22)', color: '#FCD34D', border: '1px solid rgba(217, 119, 6, 0.4)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                PWA
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#CBD5E1', lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Accès 1-clic &amp; disponible hors-ligne
            </p>
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleInstallClick}
              className="surga-pwa-banner-btn-install"
              title="Installer l'application sur cet appareil"
            >
              {isIOS ? <Smartphone size={13} strokeWidth={2.5} /> : <Download size={13} strokeWidth={2.5} />}
              <span>Installer</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="surga-pwa-banner-btn-close"
              aria-label="Fermer l'invitation d'installation"
              title="Plus tard"
            >
              <X size={14} />
            </button>
          </div>
        </aside>
      )}

      {/* MODALE GUIDE D'INSTALLATION (Pour iPhone / iPad et navigateurs guidés) */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Guide d'installation de Surga"
          className="surga-pwa-modal-backdrop"
          onClick={() => setShowIOSModal(false)}
        >
          <div className="surga-pwa-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* En-tête de la modale avec icône premium Surga */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#0F172A', border: '1px solid rgba(217, 119, 6, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src="/surga/surga-symbol.png" alt="Surga" width={38} height={38} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--surga-primary, #0F172A)' }}>
                    Installer Surga
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--surga-text3, #536175)' }}>
                    {isIOS ? 'Sur votre iPhone / iPad' : 'Sur votre écran d\'accueil'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                style={{ background: 'rgba(15, 23, 42, 0.06)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--surga-primary, #0F172A)' }}
                aria-label="Fermer le guide"
              >
                <X size={15} />
              </button>
            </div>

            {/* Étapes illustrées sans aucun émoji */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'rgba(15, 23, 42, 0.03)', border: '1px solid var(--surga-border, #E2E8F0)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(2, 132, 199, 0.12)', color: 'var(--surga-info, #0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                  1
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--surga-text1, #0F172A)' }}>
                  Touchez le bouton <strong>Partager</strong>{' '}
                  <span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', color: 'var(--surga-info, #0284C7)', margin: '0 2px' }}>
                    <Share size={14} />
                  </span>{' '}
                  dans la barre Safari en bas.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'rgba(15, 23, 42, 0.03)', border: '1px solid var(--surga-border, #E2E8F0)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(217, 119, 6, 0.12)', color: 'var(--surga-accent-ink, #A64B08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                  2
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--surga-text1, #0F172A)' }}>
                  Faites défiler et sélectionnez{' '}
                  <strong>« Sur l&apos;écran d&apos;accueil »</strong>{' '}
                  <span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', color: 'var(--surga-accent-ink, #A64B08)', margin: '0 2px' }}>
                    <Smartphone size={14} />
                  </span>.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'rgba(5, 150, 105, 0.05)', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(5, 150, 105, 0.12)', color: 'var(--surga-emerald-ink, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={15} />
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--surga-text1, #0F172A)' }}>
                  Appuyez sur <strong>Ajouter</strong> en haut à droite. Surga apparaîtra avec sa propre icône comme une vraie application !
                </div>
              </div>
            </div>

            {/* Bouton de confirmation */}
            <button
              type="button"
              onClick={handleDismiss}
              className="surga-btn-primary"
              style={{ width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 700, borderRadius: 12, cursor: 'pointer' }}
            >
              C&apos;est compris
            </button>
          </div>
        </div>
      )}
    </>
  )
}
