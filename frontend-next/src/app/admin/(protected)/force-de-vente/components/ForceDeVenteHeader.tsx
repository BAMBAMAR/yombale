import React from 'react'
import { Sparkles } from 'lucide-react'

export default function ForceDeVenteHeader() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #0B132B 100%)',
        borderRadius: 20,
        padding: '32px 36px',
        color: '#fff',
        marginBottom: 28,
        border: '2px solid rgba(199,91,0,0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: -30,
          top: -30,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(199,91,0,0.15)',
        }}
      />

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(199,91,0,0.2)',
          padding: '6px 14px',
          borderRadius: 20,
          marginBottom: 12,
        }}
      >
        <Sparkles size={16} color="var(--accent, #C75B00)" />
        <span style={{ fontSize: 13, fontWeight: 800, color: '#FFEDD5', letterSpacing: '0.05em' }}>
          ESPACE STRATÉGIQUE ADMINISTRATION
        </span>
      </div>

      <h1 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 8px' }}>
        Force de Vente Terrain &amp; Déploiement Commercial
      </h1>
      <p style={{ fontSize: 15, color: '#CBD5E1', maxWidth: 840, lineHeight: 1.5, margin: 0 }}>
        Pilotez la prospection des commerces au Sénégal, formez vos commerciaux, accédez à la matrice décisionnelle par
        catégorie, générez des kits personnalisés et téléchargez tous les supports imprimables haute définition.
      </p>
    </div>
  )
}
