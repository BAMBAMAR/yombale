'use client'

import React from 'react'
import {
  X,
  MapPin,
  Star,
  Clock,
  Phone,
  MessageCircle,
  Share2,
  Heart,
  Navigation,
  UtensilsCrossed,
  Sparkles,
  Wifi,
  Waves,
  Coffee,
  Flame,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { type PlaceItem } from './SurgaPlaceCard'

interface SurgaPlaceDetailModalProps {
  place: PlaceItem | null
  isOpen: boolean
  onClose: () => void
  onToggleFavori?: (place: PlaceItem) => void
}

export default function SurgaPlaceDetailModal({
  place,
  isOpen,
  onClose,
  onToggleFavori,
}: SurgaPlaceDetailModalProps) {
  if (!isOpen || !place) return null

  const budgetFormate = new Intl.NumberFormat('fr-FR').format(place.budget_moyen_xof)

  const handleWhatsApp = () => {
    if (!place.contact_whatsapp) return
    const numeroClean = place.contact_whatsapp.replace(/[^0-9]/g, '')
    const msg = encodeURIComponent(
      `Bonjour, je vous contacte suite à une recommandation sur Surga Nopalou concernant votre établissement : ${place.nom}.`
    )
    window.open(`https://wa.me/${numeroClean}?text=${msg}`, '_blank', 'noopener,noreferrer')
  }

  const handleAppel = () => {
    if (!place.contact_tel) return
    window.location.href = `tel:${place.contact_tel}`
  }

  const handleItineraire = () => {
    const query = encodeURIComponent(`${place.nom}, ${place.adresse}, Dakar`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer')
  }

  const handlePartager = async () => {
    const texte = `Découvrez "${place.nom}" à ${place.quartier} sur Surga Nopalou : ${place.specialite} (~${budgetFormate} FCFA). ${place.resume_honnete}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: place.nom,
          text: texte,
          url: window.location.href,
        })
      } catch {}
    } else {
      navigator.clipboard?.writeText?.(texte)
      alert('Lien et résumé de l adresse copiés dans votre presse-papiers.')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête de la modale */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                backgroundColor: 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 6,
              }}
            >
              {place.categorie.toUpperCase()}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>
              {place.quartier}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => onToggleFavori?.(place)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                color: place.est_favori ? 'var(--accent, #C75B00)' : 'var(--text3, #73675E)',
              }}
              aria-label="Favori"
            >
              <Heart size={20} fill={place.est_favori ? 'var(--accent, #C75B00)' : 'none'} />
            </button>
            <button
              type="button"
              onClick={handlePartager}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                color: 'var(--navy, #1C2B4A)',
              }}
              aria-label="Partager"
            >
              <Share2 size={19} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                color: 'var(--text3, #73675E)',
              }}
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Corps défilable */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Titre & Évaluation */}
          <div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
                margin: '0 0 6px 0',
              }}
            >
              {place.nom}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: 'rgba(199, 91, 0, 0.1)',
                  padding: '3px 8px',
                  borderRadius: 6,
                }}
              >
                <Star size={14} fill="var(--accent, #C75B00)" color="var(--accent, #C75B00)" />
                <strong style={{ fontSize: 13, color: 'var(--accent, #C75B00)' }}>
                  {place.note_moyenne.toFixed(1)} / 5
                </strong>
                <span style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                  ({place.nb_avis} avis certifiés)
                </span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', fontWeight: 600 }}>
                Budget : ~{budgetFormate} FCFA ({place.fourchette_prix})
              </span>
            </div>
          </div>

          {/* Résumé Honnête en 3 lignes */}
          <div
            style={{
              backgroundColor: 'var(--bg, #F8F5F0)',
              borderRadius: 10,
              padding: '12px 14px',
              borderLeft: '4px solid var(--accent, #C75B00)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--accent, #C75B00)',
              }}
            >
              <Info size={14} />
              <span>L AVIS HONNÊTE SURGA (SYNTHÈSE EN 3 LIGNES)</span>
            </div>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--navy, #1C2B4A)',
                margin: 0,
              }}
            >
              {place.resume_honnete}
            </p>
          </div>

          {/* Spécialité culinaire */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              backgroundColor: 'rgba(10, 92, 54, 0.05)',
              borderRadius: 8,
              padding: '10px 12px',
              border: '1px solid rgba(10, 92, 54, 0.15)',
            }}
          >
            <UtensilsCrossed size={16} color="var(--price, #0A5C36)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--price, #0A5C36)', textTransform: 'uppercase' }}>
                Spécialité incontournable
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy, #1C2B4A)', marginTop: 2 }}>
                {place.specialite}
              </div>
            </div>
          </div>

          {/* Localisation & Horaires */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <MapPin size={16} color="var(--accent, #C75B00)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong>Adresse :</strong> {place.adresse}
              </div>
            </div>

            {place.horaires && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Clock size={16} color="var(--navy, #1C2B4A)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong>Horaires :</strong> {place.horaires}
                </div>
              </div>
            )}
          </div>

          {/* Tags d'ambiance */}
          {place.tags_ambiance && place.tags_ambiance.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                Ambiance &amp; Caractéristiques
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {place.tags_ambiance.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: 11,
                      color: 'var(--navy, #1C2B4A)',
                      backgroundColor: 'var(--bg, #F8F5F0)',
                      border: '1px solid var(--border, #E8DDD2)',
                      padding: '4px 8px',
                      borderRadius: 14,
                      fontWeight: 500,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Boutons d'action directes */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: place.contact_whatsapp && place.contact_tel ? '1fr 1fr' : '1fr',
              gap: 10,
              paddingTop: 8,
              borderTop: '1px solid var(--border, #E8DDD2)',
            }}
          >
            {place.contact_whatsapp && (
              <button
                type="button"
                onClick={handleWhatsApp}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: 'var(--price, #0A5C36)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <MessageCircle size={16} />
                <span>WhatsApp</span>
              </button>
            )}

            {place.contact_tel && (
              <button
                type="button"
                onClick={handleAppel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: 'var(--navy, #1C2B4A)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Phone size={16} />
                <span>Appeler</span>
              </button>
            )}
          </div>

          {/* Bouton Itinéraire Google Maps */}
          <button
            type="button"
            onClick={handleItineraire}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: '#FFFFFF',
              color: 'var(--accent, #C75B00)',
              border: '1px solid var(--accent, #C75B00)',
              borderRadius: 10,
              padding: '10px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Navigation size={14} />
            <span>Ouvrir l itinéraire dans Google Maps</span>
          </button>
        </div>
      </div>
    </div>
  )
}
