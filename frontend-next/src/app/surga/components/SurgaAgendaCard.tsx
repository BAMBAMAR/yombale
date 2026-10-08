'use client'

import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Repeat,
  AlertTriangle,
  Share2,
  Trash2,
  MoreVertical,
  Briefcase,
  User,
  HeartPulse,
  Landmark,
  RotateCcw,
  Pencil,
  type LucideIcon,
} from 'lucide-react'
import {
  type SurgaEvenement,
  type SurgaEvenementPriorite,
  type SurgaEvenementCategorie,
} from '@/lib/surga-offline-sync'
import { decalerDUneHeure } from '@/lib/surga-agenda-dates'

interface SurgaAgendaCardProps {
  evenement: SurgaEvenement
  onToggle: (id: string) => void
  onSupprimer: (id: string) => void
  onReporter: (id: string, nouvelleDate: string, nouvelleHeure?: string) => void
  onModifier?: (evenement: SurgaEvenement) => void
}

const PRIORITE_META: Record<SurgaEvenementPriorite, { label: string; color: string; bg: string }> = {
  normale: { label: 'Normale', color: 'var(--price, #0A5C36)', bg: 'rgba(10, 92, 54, 0.08)' },
  importante: { label: 'Importante', color: 'var(--accent, #C75B00)', bg: 'rgba(199, 91, 0, 0.1)' },
  urgente: { label: 'Urgente', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },
}

const CATEGORIE_META: Record<SurgaEvenementCategorie, { label: string; icon: LucideIcon }> = {
  rdv: { label: 'RDV', icon: Calendar },
  travail: { label: 'Travail', icon: Briefcase },
  sante: { label: 'Santé', icon: HeartPulse },
  demarche: { label: 'Démarche', icon: Landmark },
  famille: { label: 'Famille', icon: User },
  perso: { label: 'Perso', icon: User },
}

export default function SurgaAgendaCard({
  evenement,
  onToggle,
  onSupprimer,
  onReporter,
  onModifier,
}: SurgaAgendaCardProps) {
  const [showReporterMenu, setShowReporterMenu] = useState<boolean>(false)

  const priorite = evenement.priorite || 'normale'
  const pMeta = PRIORITE_META[priorite] || PRIORITE_META.normale

  const categorie = evenement.categorie || 'rdv'
  const cMeta = CATEGORIE_META[categorie] || CATEGORIE_META.rdv
  const CatIcon = cMeta.icon

  // Détection du statut temporel
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const isToday = evenement.date_evenement === todayStr

  const isEnRetard = (() => {
    if (evenement.termine) return false
    if (evenement.date_evenement < todayStr) return true
    if (evenement.date_evenement === todayStr && evenement.heure_evenement) {
      const [h, m] = evenement.heure_evenement.split(':').map(Number)
      const dateHeureEvt = new Date()
      dateHeureEvt.setHours(h, m, 0, 0)
      return now > dateHeureEvt
    }
    return false
  })()

  const handlePartagerWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    let texte = `*Rappel : ${evenement.titre}*\n`
    texte += `Date : ${evenement.date_evenement}`
    if (evenement.heure_evenement) texte += ` à ${evenement.heure_evenement}`
    if (evenement.lieu) texte += `\nLieu : ${evenement.lieu}`
    if (evenement.description) texte += `\nNote : ${evenement.description}`
    texte += `\n\n_Programmé via Surga_`
    const url = `https://wa.me/?text=${encodeURIComponent(texte)}`
    window.open(url, '_blank')
  }

  const handleReporterPlus1h = (e: React.MouseEvent) => {
    e.stopPropagation()
    const report = decalerDUneHeure(evenement.date_evenement, evenement.heure_evenement)
    onReporter(evenement.id, report.date, report.heure)
    setShowReporterMenu(false)
  }

  const handleReporterDemainMatin = (e: React.MouseEvent) => {
    e.stopPropagation()
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const newDate = d.toISOString().slice(0, 10)
    onReporter(evenement.id, newDate, '09:00')
    setShowReporterMenu(false)
  }

  return (
    <article
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: '12px 14px',
        border: '1px solid',
        borderColor: evenement.termine
          ? 'var(--border, #E8DDD2)'
          : isEnRetard
          ? '#FCA5A5'
          : isToday
          ? 'var(--navy, #1C2B4A)'
          : 'var(--border, #E8DDD2)',
        boxShadow: isToday && !evenement.termine ? '0 2px 8px rgba(28, 43, 74, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        opacity: evenement.termine ? 0.6 : 1,
        position: 'relative',
      }}
    >
      {/* Ligne 1 : Statut / Checkbox + Titre + Badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Bouton pour cocher */}
        <button
          type="button"
          onClick={() => onToggle(evenement.id)}
          aria-label={evenement.termine ? 'Marquer comme non fait' : 'Marquer comme terminé'}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            marginTop: 2,
            color: evenement.termine ? 'var(--price, #0A5C36)' : 'var(--text3, #73675E)',
            flexShrink: 0,
          }}
        >
          {evenement.termine ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </button>

        {/* Détails du titre */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            {/* Badge Catégorie */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 7px',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: 'rgba(28, 43, 74, 0.06)',
                color: 'var(--navy, #1C2B4A)',
              }}
            >
              <CatIcon size={11} />
              <span>{cMeta.label}</span>
            </span>

            {/* Badge Priorité */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 6px',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 800,
                backgroundColor: pMeta.bg,
                color: pMeta.color,
              }}
            >
              {pMeta.label}
            </span>

            {/* Badge Statut Retard ou Aujourd'hui */}
            {isEnRetard && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 6px',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 800,
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                }}
              >
                <AlertTriangle size={10} />
                <span>En retard</span>
              </span>
            )}

            {isToday && !evenement.termine && !isEnRetard && (
              <span
                style={{
                  padding: '2px 6px',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 800,
                  backgroundColor: 'rgba(28, 43, 74, 0.1)',
                  color: 'var(--navy, #1C2B4A)',
                }}
              >
                Aujourd’hui
              </span>
            )}
          </div>

          <h4
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--navy, #1C2B4A)',
              margin: 0,
              textDecoration: evenement.termine ? 'line-through' : 'none',
            }}
          >
            {evenement.titre}
          </h4>

          {evenement.description && (
            <p style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', margin: '4px 0 0', lineHeight: 1.4 }}>
              {evenement.description}
            </p>
          )}

          {evenement.lieu && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3, #73675E)', marginTop: 4 }}>
              <MapPin size={11} color="var(--accent, #C75B00)" />
              <span>{evenement.lieu}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ligne 2 : Date, Heure, Répétition et Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(0,0,0,0.05)',
          paddingTop: 8,
          marginTop: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text2, #5A4E42)', fontWeight: 600 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={13} color="var(--text3, #73675E)" />
            <span>{evenement.date_evenement}</span>
          </span>

          {evenement.heure_evenement && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: isEnRetard ? '#DC2626' : 'var(--navy, #1C2B4A)',
                fontWeight: 700,
              }}
            >
              <Clock size={13} />
              <span>{evenement.heure_evenement}</span>
            </span>
          )}

          {evenement.repetition !== 'AUCUNE' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--accent, #C75B00)' }}>
              <Repeat size={12} />
              <span>{evenement.repetition.toLowerCase()}</span>
            </span>
          )}
        </div>

        {/* Boutons d'actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
          {/* SRG-A2-017 : un rappel s'ouvre pour être modifié (titre, date, heure) */}
          {onModifier && !evenement.termine && (
            <button
              type="button"
              onClick={() => onModifier(evenement)}
              title="Modifier ce rappel"
              style={{ background: 'transparent', border: '1px solid var(--border, #E8DDD2)', borderRadius: 6, padding: '3px 6px', fontSize: 11, fontWeight: 600, color: 'var(--text2, #5A4E42)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
            >
              <Pencil size={11} />
              <span>Modifier</span>
            </button>
          )}
          {/* Menu Reporter */}
          {!evenement.termine && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowReporterMenu(!showReporterMenu)}
                title="Reporter l'événement"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border, #E8DDD2)',
                  borderRadius: 6,
                  padding: '3px 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text2, #5A4E42)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <RotateCcw size={11} />
                <span>Reporter</span>
              </button>

              {showReporterMenu && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 0,
                    marginBottom: 6,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    border: '1px solid var(--border, #E8DDD2)',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    padding: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    zIndex: 10,
                    minWidth: 130,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleReporterPlus1h}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px 8px',
                      fontSize: 11,
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: 4,
                      color: 'var(--navy, #1C2B4A)',
                    }}
                  >
                    + 1 heure
                  </button>
                  <button
                    type="button"
                    onClick={handleReporterDemainMatin}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px 8px',
                      fontSize: 11,
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: 4,
                      color: 'var(--navy, #1C2B4A)',
                    }}
                  >
                    Demain à 09:00
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Partage WhatsApp */}
          <button
            type="button"
            onClick={handlePartagerWhatsApp}
            title="Partager sur WhatsApp"
            aria-label="Partager sur WhatsApp"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: 'var(--text3, #73675E)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Share2 size={13} />
          </button>

          {/* Supprimer */}
          <button
            type="button"
            onClick={() => onSupprimer(evenement.id)}
            title="Supprimer le rappel"
            aria-label="Supprimer le rappel"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </article>
  )
}
