'use client'

import React from 'react'
import { MessageCircle } from 'lucide-react'

interface Props {
  sessionScannerId: string
  boutiqueActiveId: string
  onClose: () => void
}

export default function PosPairageModal({ sessionScannerId, boutiqueActiveId, onClose }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 480, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            Douchette Smartphone Distante (WiFi)
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
          Transformez votre téléphone portable en scanner sans fil pour votre ordinateur !
        </p>

        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 14, padding: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '.05em' }}>Code de Session Scanner</span>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#0284c7', fontFamily: 'monospace', letterSpacing: '0.15em' }}>{sessionScannerId}</span>
          
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                const url = `${window.location.origin}/boutique/caisse?remoteSession=${sessionScannerId}&b=${boutiqueActiveId}`
                window.open(`https://wa.me/?text=${encodeURIComponent(`Lien Scanner Nopalou POS : ${url}`)}`, '_blank')
              }
            }}
            style={{ background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <MessageCircle size={15} /> Envoyer le lien par WhatsApp sur le téléphone
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 4px rgba(34,197,94,0.2)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>
            Écoute active : Tout produit scanné sur le téléphone s&apos;ajoute ici instantanément !
          </span>
        </div>

        <button type="button" onClick={onClose} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 10, padding: 12, fontWeight: 800, cursor: 'pointer' }}>
          Fermer la fenêtre
        </button>
      </div>
    </div>
  )
}
