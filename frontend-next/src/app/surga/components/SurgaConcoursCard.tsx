'use client'

import React from 'react'
import { GraduationCap, Calendar, Clock, CheckCircle2, Bell, ChevronRight, FileText } from 'lucide-react'
import { reparerApostrophes } from '@/lib/surga-formatting'

export interface ConcoursItem {
  id: string
  slug: string
  titre: string
  sigle?: string
  organisme: string
  categorie: string
  niveau_requis: string
  age_max?: number | null
  frais_dossier_xof: number
  statut: 'ouvert' | 'a_venir' | 'cloture' | 'epreuves_en_cours' | 'resultats' | 'termine'
  date_ouverture?: string
  date_cloture: string
  date_epreuves?: string
  date_resultats?: string
  pieces_a_fournir?: string[]
  description?: string
  lien_officiel?: string
  centres_prepa?: Array<{ nom: string; quartier: string; tel?: string }>
  echeances?: {
    joursRestantsCloture: number | null
    phaseAlerte: string | null
    messageDelai: string
    estCloture: boolean
  }
}

interface SurgaConcoursCardProps {
  concours: ConcoursItem
  estSuivi?: boolean
  onConsulter: (concours: ConcoursItem) => void
  onToggleSuivi?: (concours: ConcoursItem) => void
}

export default function SurgaConcoursCard({
  concours,
  estSuivi = false,
  onConsulter,
  onToggleSuivi,
}: SurgaConcoursCardProps) {
  const echeances = concours.echeances || {
    joursRestantsCloture: null,
    phaseAlerte: null,
    messageDelai: '',
    estCloture: false,
  }

  const getCouleurStatut = () => {
    if (echeances.estCloture) return { bg: '#F3F4F6', text: 'var(--text3, #73675E)', border: '#E5E7EB' }
    if (echeances.phaseAlerte === 'j-1' || echeances.phaseAlerte === 'j-7') {
      return { bg: 'rgba(199, 91, 0, 0.1)', text: 'var(--accent, #C75B00)', border: 'rgba(199, 91, 0, 0.3)' }
    }
    return { bg: 'rgba(10, 92, 54, 0.1)', text: 'var(--price, #0A5C36)', border: 'rgba(10, 92, 54, 0.25)' }
  }

  const badgeStyle = getCouleurStatut()

  const dateClotureFormattee = new Date(concours.date_cloture).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <article
      onClick={() => onConsulter(concours)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid var(--border, #E8DDD2)',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        gap: 8,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {/* Ligne 1 : sigle et délai. Le délai passe à la ligne plutôt que de sortir de la carte. */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        {concours.sigle && (
          <span
            style={{
              backgroundColor: 'var(--navy, #1C2B4A)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 5,
              letterSpacing: 0.5,
              flexShrink: 0,
            }}
          >
            {concours.sigle}
          </span>
        )}
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
            backgroundColor: badgeStyle.bg,
            color: badgeStyle.text,
            border: `1px solid ${badgeStyle.border}`,
            maxWidth: '100%',
            overflowWrap: 'anywhere',
          }}
        >
          {echeances.messageDelai || (echeances.estCloture ? 'Clôturé' : 'En cours')}
        </span>
      </div>
      {/* Ligne 2 : Titre complet */}
      <h3
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--navy, #1C2B4A)',
          margin: 0,
          lineHeight: 1.35,
        }}
      >
        {reparerApostrophes(concours.titre)}
      </h3>

      {/* Ligne 3 : Organisme officiel */}
      <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', lineHeight: 1.3 }}>
        {reparerApostrophes(concours.organisme)}
      </div>

      {/* Niveau requis sur sa propre ligne : le texte est long (« Licence ou Master selon la filière ») */}
      {concours.niveau_requis && (
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3, #536175)', lineHeight: 1.35 }}>
          Niveau : {reparerApostrophes(concours.niveau_requis)}
        </div>
      )}

      {/* Ligne 4 : Métadonnées (Date limite, Frais de dossier) & Bouton d'action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          rowGap: 6,
          paddingTop: 8,
          marginTop: 2,
          borderTop: '1px solid var(--border, #E8DDD2)',
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 12, rowGap: 2, color: 'var(--text3, #536175)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} />
            <span>Clôture : {dateClotureFormattee}</span>
          </span>
          {concours.frais_dossier_xof > 0 && (
            <span>
              Frais : {new Intl.NumberFormat('fr-FR').format(concours.frais_dossier_xof)} FCFA
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onToggleSuivi && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleSuivi(concours)
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: estSuivi ? 'rgba(10, 92, 54, 0.1)' : 'var(--bg, #F8F5F0)',
                color: estSuivi ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)',
                border: '1px solid',
                borderColor: estSuivi ? 'rgba(10, 92, 54, 0.3)' : 'var(--border, #E8DDD2)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {estSuivi ? <CheckCircle2 size={12} /> : <Bell size={12} />}
              <span>{estSuivi ? 'Suivi actif' : 'Suivre'}</span>
            </button>
          )}

          <ChevronRight size={15} style={{ color: 'var(--text3, #73675E)' }} />
        </div>
      </div>
    </article>
  )
}
