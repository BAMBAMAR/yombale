'use client'

import React from 'react'
import { reparerApostrophes } from '@/lib/surga-formatting'
import {
  MapPin,
  Star,
  MessageCircle,
  Phone,
  Heart,
  ChevronRight,
  Sparkles,
  Wifi,
  Waves,
  Coffee,
  Flame,
  UtensilsCrossed,
} from 'lucide-react'

export interface PlaceItem {
  id: string
  slug: string
  nom: string
  categorie: string
  quartier: string
  ville?: string
  adresse: string
  budget_moyen_xof: number
  fourchette_prix: string
  tags_ambiance: string[]
  specialite: string
  note_moyenne: number | string
  nb_avis: number
  resume_honnete: string
  contact_tel?: string
  contact_whatsapp?: string
  horaires?: string
  photos?: string[]
  verifie?: boolean
  actif?: boolean
  est_favori?: boolean
}

interface SurgaPlaceCardProps {
  place: PlaceItem
  onConsulter: (place: PlaceItem) => void
  onToggleFavori?: (place: PlaceItem) => void
}

export default function SurgaPlaceCard({
  place,
  onConsulter,
  onToggleFavori,
}: SurgaPlaceCardProps) {
  const getCategorieLabel = (cat: string) => {
    switch (cat) {
      case 'restaurant':
        return 'Restaurant'
      case 'dibiterie':
        return 'Dibiterie'
      case 'cafe_coworking':
        return 'Café & Coworking'
      case 'bord_de_mer':
        return 'Bord de Mer'
      case 'brunch_crepe':
        return 'Brunch & Pâtisserie'
      default:
        return 'Bonne Adresse'
    }
  }

  const getAmbianceIcon = (tag: string) => {
    switch (tag) {
      case 'wifi_rapide':
        return <Wifi size={11} style={{ marginRight: 3 }} />
      case 'vue_mer':
        return <Waves size={11} style={{ marginRight: 3 }} />
      case 'calme':
        return <Coffee size={11} style={{ marginRight: 3 }} />
      case 'authentique':
        return <Flame size={11} style={{ marginRight: 3 }} />
      default:
        return <Sparkles size={11} style={{ marginRight: 3 }} />
    }
  }

  const budgetFormate = new Intl.NumberFormat('fr-FR').format(place.budget_moyen_xof)

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!place.contact_whatsapp) return
    const numeroClean = place.contact_whatsapp.replace(/[^0-9]/g, '')
    const msg = encodeURIComponent(
      `Bonjour, je vous contacte suite à une recommandation sur Surga concernant : ${place.nom}.`
    )
    window.open(`https://wa.me/${numeroClean}?text=${msg}`, '_blank', 'noopener,noreferrer')
  }

  const handleAppel = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!place.contact_tel) return
    window.location.href = `tel:${place.contact_tel}`
  }

  const handleFavoriClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleFavori) {
      onToggleFavori(place)
    }
  }

  return (
    <article
      onClick={() => onConsulter(place)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid var(--border, #E8DDD2)',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        gap: 10,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {/* Ligne 1 : Catégorie, Note et Bouton Favori */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexWrap: 'wrap' }}>
          <span
            style={{
              backgroundColor: 'rgba(28, 43, 74, 0.08)',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 6,
              letterSpacing: 0.3,
              whiteSpace: 'nowrap',
            }}
          >
            {getCategorieLabel(place.categorie)}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--price, #0A5C36)',
              backgroundColor: 'rgba(10, 92, 54, 0.08)',
              padding: '2px 6px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
            }}
          >
            {place.fourchette_prix}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Note moyenne */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              backgroundColor: 'rgba(199, 91, 0, 0.08)',
              padding: '2px 6px',
              borderRadius: 6,
            }}
          >
            <Star size={12} fill="var(--accent, #C75B00)" color="var(--accent, #C75B00)" />
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--surga-accent-ink, #A64B08)' }}>
              {Number(place.note_moyenne || 4.5).toFixed(1)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
              ({place.nb_avis})
            </span>
          </div>

          {/* Bouton Favori */}
          <button
            type="button"
            onClick={handleFavoriClick}
            aria-label={place.est_favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: place.est_favori ? 'var(--surga-accent-ink, #A64B08)' : 'var(--text3, #73675E)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Heart size={16} fill={place.est_favori ? 'var(--accent, #C75B00)' : 'none'} />
          </button>
        </div>
      </div>

      {/* Ligne 2 : Nom & Localisation */}
      <div>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: 'var(--navy, #1C2B4A)',
            margin: '0 0 4px 0',
            lineHeight: 1.3,
          }}
        >
          {reparerApostrophes(place.nom)}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text2, #5A4E42)' }}>
          <MapPin size={13} color="var(--accent, #C75B00)" style={{ flexShrink: 0 }} />
          <span>{place.quartier}</span>
          <span>&bull;</span>
          <span style={{ fontWeight: 600 }}>~{budgetFormate} FCFA / pers.</span>
        </div>
      </div>

      {/* Ligne 3 : Résumé honnête d'avis en 3 lignes */}
      <p
        style={{
          fontSize: 12,
          color: 'var(--text2, #5A4E42)',
          lineHeight: 1.45,
          margin: 0,
          // Résumé de 3 lignes par construction (260 caractères au plus) : affiché en entier. Le clamp laissait voir le
          // haut d'une 4e ligne dans le remplissage.
          backgroundColor: 'var(--bg, #F8F5F0)',
          padding: '8px 10px',
          borderRadius: 8,
          borderLeft: '3px solid var(--accent, #C75B00)',
        }}
      >
        {reparerApostrophes(place.resume_honnete)}
      </p>

      {/* Ligne 4 : Spécialité & Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--price, #0A5C36)',
            backgroundColor: 'rgba(10, 92, 54, 0.08)',
            padding: '2px 7px',
            borderRadius: 12,
          }}
        >
          <UtensilsCrossed size={10} style={{ marginRight: 4 }} />
          {reparerApostrophes(place.specialite)}
        </span>
        {place.tags_ambiance?.slice(0, 3).map((tag) => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: 12,
              color: 'var(--text3, #73675E)',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              padding: '2px 6px',
              borderRadius: 12,
            }}
          >
            {getAmbianceIcon(tag)}
            {tag}
          </span>
        ))}
      </div>

      {/* Ligne 5 : Actions de contact et consultation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          rowGap: 6,
          columnGap: 8,
          borderTop: '1px solid var(--border, #E8DDD2)',
          paddingTop: 8,
          marginTop: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {place.contact_whatsapp && (
            <button
              type="button"
              onClick={handleWhatsApp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'rgba(10, 92, 54, 0.08)',
                color: 'var(--price, #0A5C36)',
                border: '1px solid rgba(10, 92, 54, 0.2)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <MessageCircle size={12} />
              <span>WhatsApp</span>
            </button>
          )}

          {place.contact_tel && (
            <button
              type="button"
              onClick={handleAppel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'transparent',
                color: 'var(--navy, #1C2B4A)',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Phone size={12} />
              <span>Appeler</span>
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--surga-accent-ink, #A64B08)',
            whiteSpace: 'nowrap',
            minHeight: 32,
          }}
        >
          <span>Détails &amp; avis</span>
          <ChevronRight size={13} />
        </div>
      </div>
    </article>
  )
}
