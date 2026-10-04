'use client'

import React from 'react'
import { MapPin, Phone, MessageCircle, CheckCircle2, BedDouble, Maximize2 } from 'lucide-react'

export interface BienImmoItem {
  id: string
  titre: string
  description?: string
  prix: number
  surface_m2?: number | null
  nb_pieces?: number | null
  nb_chambres?: number | null
  type_bien: string
  transaction: 'location' | 'vente'
  ville: string
  quartier: string
  meuble: boolean
  verifie: boolean
  agence_nom?: string | null
  contact_tel?: string | null
  contact_whatsapp?: string | null
  photos?: string[]
}

interface SurgaImmoCardProps {
  bien: BienImmoItem
  onSelectionner?: (bien: BienImmoItem) => void
}

export default function SurgaImmoCard({ bien, onSelectionner }: SurgaImmoCardProps) {
  const photoUrl = bien.photos && bien.photos.length > 0
    ? bien.photos[0]
    : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=80'

  const formatPrix = (montant: number, transaction: string) => {
    const formatted = new Intl.NumberFormat('fr-FR').format(montant)
    return transaction === 'location' ? `${formatted} FCFA/mois` : `${formatted} FCFA`
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    const num = (bien.contact_whatsapp || bien.contact_tel || '221771234567').replace(/[^0-9]/g, '')
    const texte = encodeURIComponent(`Bonjour, je vous contacte via Nopalou concernant l'annonce : ${bien.titre}`)
    window.open(`https://wa.me/${num}?text=${texte}`, '_blank')
  }

  const handleAppel = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (bien.contact_tel) {
      window.open(`tel:${bien.contact_tel}`, '_self')
    }
  }

  return (
    <article
      onClick={() => onSelectionner && onSelectionner(bien)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid var(--border, #E8DDD2)',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        cursor: onSelectionner ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: 140, backgroundColor: '#E2E8F0' }}>
        <img
          src={photoUrl}
          alt={bien.titre}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
        <span
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: bien.transaction === 'location' ? 'var(--navy, #1C2B4A)' : 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: 6,
            letterSpacing: 0.5,
          }}
        >
          {bien.transaction === 'location' ? 'Location' : 'Vente'}
        </span>
        {bien.verifie && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(10, 92, 54, 0.92)',
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 7px',
              borderRadius: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <CheckCircle2 size={11} />
            <span>Vérifié</span>
          </span>
        )}
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--price, #0A5C36)' }}>
            {formatPrix(bien.prix, bien.transaction)}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text3, #73675E)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <MapPin size={12} />
            <span>{bien.quartier}</span>
          </span>
        </div>

        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--navy, #1C2B4A)',
            margin: 0,
            lineHeight: 1.35,
          }}
        >
          {bien.titre}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text2, #5A4E42)' }}>
          {bien.nb_chambres && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <BedDouble size={12} />
              <span>{bien.nb_chambres} ch.</span>
            </span>
          )}
          {bien.surface_m2 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Maximize2 size={12} />
              <span>{bien.surface_m2} m²</span>
            </span>
          )}
          {bien.meuble && (
            <span style={{ backgroundColor: 'var(--bg, #F8F5F0)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
              Meublé
            </span>
          )}
          {bien.agence_nom && (
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text3, #73675E)', fontWeight: 600 }}>
              {bien.agence_nom}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border, #E8DDD2)' }}>
          <button
            type="button"
            onClick={handleWhatsApp}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <MessageCircle size={13} />
            <span>WhatsApp</span>
          </button>
          {bien.contact_tel && (
            <button
              type="button"
              onClick={handleAppel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg, #F8F5F0)',
                color: 'var(--navy, #1C2B4A)',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Appeler l'agence"
            >
              <Phone size={13} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
