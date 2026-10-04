'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Radio, X, Copy, Check, RotateCcw, ExternalLink } from 'lucide-react'

interface SurgaPodcastModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SurgaPodcastModal({ isOpen, onClose }: SurgaPodcastModalProps) {
  const [feedUrl, setFeedUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)

  const chargerToken = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/surga/podcast/token')
      const data = await res.json()
      if (data.success && data.feed_url) {
        setFeedUrl(data.feed_url)
      }
    } catch {
      setMessage('Impossible de charger le lien de podcast pour le moment.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      chargerToken()
    }
  }, [isOpen, chargerToken])

  const handleCopier = async () => {
    if (!feedUrl) return
    try {
      await navigator.clipboard.writeText(feedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setMessage('Veuillez sélectionner et copier le lien manuellement.')
    }
  }

  const handleRegenerer = async () => {
    if (!confirm('Voulez-vous révoquer l’ancien lien et en créer un nouveau ? Vos applications de podcasts devront être mises à jour.')) {
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/surga/podcast/regenerer-token', { method: 'POST' })
      const data = await res.json()
      if (data.success && data.feed_url) {
        setFeedUrl(data.feed_url)
        setMessage('Nouveau lien généré avec succès.')
      } else {
        setMessage('Connexion requise pour régénérer le jeton.')
      }
    } catch {
      setMessage('Erreur réseau lors de la régénération.')
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Flux podcast privé Surga"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="surga-card"
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#FFFFFF',
          padding: 20,
          borderRadius: 14,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: 'rgba(199, 91, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, #C75B00)',
              }}
            >
              <Radio size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Flux Podcast Privé
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                Écoutez votre briefing matinal dans votre application favorite
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text2, #5A4E42)',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', lineHeight: 1.45, margin: '0 0 12px 0' }}>
          Ce lien RSS sécurisé vous permet d’ajouter automatiquement chaque matin le briefing Surga dans <strong>Apple Podcasts</strong>, <strong>AntennaPod</strong>, <strong>Pocket Casts</strong> ou toute application de podcasts par URL.
        </p>

        {/* Champ de l'URL du flux avec copie */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            readOnly
            value={loading ? 'Génération du lien...' : feedUrl || 'Chargement...'}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid var(--border, #E8DDD2)',
              backgroundColor: 'var(--bg, #F8F5F0)',
              color: 'var(--text1, #1A1612)',
              fontFamily: 'monospace',
            }}
          />
          <button
            type="button"
            onClick={handleCopier}
            disabled={!feedUrl}
            className="surga-btn-primary"
            style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copié' : 'Copier'}</span>
          </button>
        </div>

        {message && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 10px',
              borderRadius: 6,
              backgroundColor: 'rgba(10, 92, 54, 0.08)',
              color: 'var(--price, #0A5C36)',
              marginBottom: 12,
            }}
          >
            {message}
          </div>
        )}

        {/* Instructions et Régénération */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--bg, #F8F5F0)',
            borderRadius: 8,
            fontSize: 11,
            color: 'var(--text2, #5A4E42)',
            lineHeight: 1.4,
            marginBottom: 14,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--navy, #1C2B4A)' }}>
            Comment l’utiliser ?
          </div>
          <div>1. Ouvrez votre application de podcasts habituelle.</div>
          <div>2. Cliquez sur « Ajouter par URL » ou « S’abonner par flux RSS ».</div>
          <div>3. Collez ce lien privé. Votre briefing apparaîtra chaque matin.</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border, #E8DDD2)' }}>
          <button
            type="button"
            onClick={handleRegenerer}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent, #C75B00)',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <RotateCcw size={12} />
            <span>Régénérer le lien</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="surga-btn-secondary"
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
