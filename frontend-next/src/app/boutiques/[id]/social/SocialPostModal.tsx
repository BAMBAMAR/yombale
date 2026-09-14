'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { SocialPost, SocialProduct } from './types'
import SocialPostMediaViewer from './SocialPostMediaViewer'
import SocialShoppablePanel from './SocialShoppablePanel'

interface SocialPostModalProps {
  selectedPost: SocialPost | null
  onClose: () => void
  boutiqueNom: string
  boutiqueKey: string
  boutiqueId: string
  whatsappNumber?: string | null
  addedProductId: string | null
  onAddToCart: (prod: SocialProduct) => void
  onOpenCart: () => void
  getWhatsAppUrl: (post: SocialPost, prod?: SocialProduct) => string | null
}

export default function SocialPostModal({
  selectedPost,
  onClose,
  boutiqueNom,
  boutiqueKey,
  boutiqueId,
  whatsappNumber,
  addedProductId,
  onAddToCart,
  onOpenCart,
  getWhatsAppUrl,
}: SocialPostModalProps) {
  // Hydratation dynamique du script officiel TikTok Falcon Embed lors de l'ouverture du modal
  useEffect(() => {
    if (selectedPost?.plateforme === 'tiktok') {
      const existingScript = document.getElementById('tiktok-embed-script')
      if (existingScript) existingScript.remove()

      const script = document.createElement('script')
      script.id = 'tiktok-embed-script'
      script.src = 'https://www.tiktok.com/embed.js'
      script.async = true
      document.body.appendChild(script)

      return () => {
        const s = document.getElementById('tiktok-embed-script')
        if (s) s.remove()
      }
    }
  }, [selectedPost])

  if (!selectedPost) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 920,
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Bouton Fermer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.75)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* COLONNE GAUCHE : LECTEUR / EMBED VIDÉO */}
        <SocialPostMediaViewer post={selectedPost} boutiqueNom={boutiqueNom} />

        {/* COLONNE DROITE : PRODUITS & COMMANDES */}
        <SocialShoppablePanel
          selectedPost={selectedPost}
          boutiqueNom={boutiqueNom}
          boutiqueKey={boutiqueKey}
          boutiqueId={boutiqueId}
          whatsappNumber={whatsappNumber}
          addedProductId={addedProductId}
          onAddToCart={onAddToCart}
          onOpenCart={onOpenCart}
          getWhatsAppUrl={getWhatsAppUrl}
        />
      </div>
    </div>
  )
}
