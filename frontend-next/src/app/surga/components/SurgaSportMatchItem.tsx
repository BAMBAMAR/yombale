'use client'

import React from 'react'
import { Calendar, Radio, Bell, BellCheck, Wallet, Star } from 'lucide-react'
import SurgaShareButton from './SurgaShareButton'
import { formaterPartageSport } from '@/lib/surga-share'
import type { SportEventItem } from './SurgaSportCard'

interface SurgaSportMatchItemProps {
  match: SportEventItem
  idx: number
  estFavori: boolean
  isRappele: boolean
  isBudgete: boolean
  raisonPresence?: string
  onToggleRappel: (match: SportEventItem, e: React.MouseEvent) => void
  onToggleBudget: (match: SportEventItem, e: React.MouseEvent) => void
}

function formatMatchHeureSeule(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return 'À venir'
  }
}

// sansHeure : la source connaît le jour de la rencontre, pas son heure.
function formatMatchDate(dateStr: string, sansHeure = false): string {
  try {
    const d = new Date(dateStr)
    const isThisYear = d.getFullYear() === new Date().getFullYear()
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      ...(isThisYear ? {} : { year: 'numeric' }),
      ...(sansHeure ? {} : { hour: '2-digit' as const, minute: '2-digit' as const }),
    }).format(d)
  } catch {
    return 'Prochainement'
  }
}

export default function SurgaSportMatchItem({
  match,
  idx,
  estFavori,
  isRappele,
  isBudgete,
  raisonPresence,
  onToggleRappel,
  onToggleBudget,
}: SurgaSportMatchItemProps) {
  const isDirect = match.statut === 'EN_DIRECT'
  const isTermine = match.statut === 'TERMINE'
  const hasScore = match.score_domicile !== null && match.score_exterieur !== null

  const getBtnStyle = (actif: boolean, accentColor = 'var(--surga-accent, #D97706)'): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid',
    borderColor: actif ? accentColor : 'var(--surga-border, #E2E8F0)',
    backgroundColor: actif ? 'rgba(217, 119, 6, 0.12)' : 'var(--surga-surface, #FFFFFF)',
    color: actif ? accentColor : 'var(--surga-primary, #0F172A)',
    cursor: 'pointer',
    padding: 0,
  })

  return (
    <div
      key={match.id || idx}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 14px',
        borderRadius: 12,
        backgroundColor: isDirect
          ? 'rgba(217, 119, 6, 0.04)'
          : estFavori
          ? 'rgba(217, 119, 6, 0.02)'
          : 'var(--surga-surface, #FFFFFF)',
        border: isDirect
          ? '1px solid var(--surga-accent, #D97706)'
          : estFavori
          ? '1px solid rgba(217, 119, 6, 0.35)'
          : '1px solid var(--surga-border, #E2E8F0)',
        gap: 8,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      }}
    >
      {/* Étage 1 : Compétition & Badge Favori & Statut ou Score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--surga-accent-ink, #A64B08)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {match.competition}
          </span>

          {raisonPresence && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 12,
                fontWeight: 700,
                color: '#92400E',
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                border: '1px solid rgba(217, 119, 6, 0.25)',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              Vous suivez {raisonPresence}
            </span>
          )}

          {estFavori && !raisonPresence && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--surga-accent-ink, #A64B08)',
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                border: '1px solid rgba(217, 119, 6, 0.25)',
                padding: '1px 6px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              <Star size={10} fill="currentColor" />
              Favori
            </span>
          )}

          {isDirect && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 12,
                fontWeight: 900,
                color: '#FFFFFF',
                backgroundColor: '#DC2626',
                padding: '1px 6px',
                borderRadius: 4,
                textTransform: 'uppercase',
              }}
            >
              <Radio size={10} />
              DIRECT {match.minute_jeu || ''}
            </span>
          )}
        </div>

        {hasScore ? (
          <div
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: isDirect ? '#DC2626' : 'var(--surga-primary, #0F172A)',
              padding: '2px 8px',
              borderRadius: 6,
              backgroundColor: 'var(--surga-bg, #F8FAFC)',
              border: isDirect ? '1px solid #DC2626' : '1px solid var(--surga-border, #E2E8F0)',
              flexShrink: 0,
            }}
          >
            {match.score_domicile} - {match.score_exterieur}
          </div>
        ) : isTermine ? (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              backgroundColor: 'rgba(5, 150, 105, 0.08)',
              color: 'var(--surga-emerald-ink, #047857)',
              flexShrink: 0,
            }}
          >
            Terminé
          </span>
        ) : (
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 6,
              backgroundColor: 'rgba(15, 23, 42, 0.06)',
              color: 'var(--surga-primary, #0F172A)',
              flexShrink: 0,
            }}
          >
            {match.heure_inconnue ? 'Heure à confirmer' : formatMatchHeureSeule(match.date_debut)}
          </span>
        )}
      </div>

      {/* Étage 2 : Noms complets des équipes (Pleine largeur, zéro troncature sauvage) */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--surga-primary, #0F172A)',
          lineHeight: 1.35,
          wordBreak: 'break-word',
        }}
      >
        {match.equipe_domicile} — {match.equipe_exterieur}
      </div>

      {match.buteurs && (
        <div style={{ fontSize: 12, color: 'var(--surga-emerald-ink, #047857)', fontStyle: 'italic' }}>
          {match.buteurs}
        </div>
      )}

      {/* Étage 3 : Date/Heure/Diffuseur à gauche, Actions rapides à droite */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          paddingTop: 4,
          borderTop: '1px solid var(--surga-border, #F1F5F9)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: 'var(--surga-text2, #475569)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            flexWrap: 'wrap',
          }}
        >
          <Calendar size={12} color="var(--surga-text3, #94A3B8)" />
          <span style={{ fontWeight: 600 }}>{formatMatchDate(match.date_debut, match.heure_inconnue)}</span>
          {match.diffuseur && (
            <span style={{ color: 'var(--surga-text3, #94A3B8)' }}>• {match.diffuseur}</span>
          )}
          {match.source === 'TheSportsDB' && (
            <span style={{ color: 'var(--surga-text3, #94A3B8)' }}>• Source : TheSportsDB{match.calendrier_partiel ? ', calendrier partiel' : ''}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {!isTermine && (
            <>
              <button
                type="button"
                onClick={(e) => onToggleRappel(match, e)}
                title={isRappele ? 'Rappel actif — Cliquer pour désactiver' : "Programmer un rappel dans l'Agenda"}
                aria-label="Rappel match"
                style={getBtnStyle(isRappele)}
              >
                {isRappele ? <BellCheck size={14} color="var(--surga-accent, #D97706)" /> : <Bell size={14} />}
              </button>

              <button
                type="button"
                onClick={(e) => onToggleBudget(match, e)}
                title={isBudgete ? 'Budget noté — Cliquer pour retirer' : 'Prévoir un budget sortie match'}
                aria-label="Budget match"
                style={getBtnStyle(isBudgete, 'var(--surga-emerald, #059669)')}
              >
                <Wallet size={14} color={isBudgete ? 'var(--surga-emerald, #059669)' : undefined} />
              </button>
            </>
          )}

          <SurgaShareButton
            payload={{
              titre: `Surga Sport : ${match.equipe_domicile} vs ${match.equipe_exterieur}`,
              texte: formaterPartageSport({
                competition: match.competition,
                equipeDomicile: match.equipe_domicile,
                equipeExterieur: match.equipe_exterieur,
                score: hasScore ? `${match.score_domicile} - ${match.score_exterieur}` : undefined,
                heure: !isTermine ? formatMatchDate(match.date_debut, match.heure_inconnue) : undefined,
                statut: match.statut,
              }),
            }}
            taille="sm"
          />
        </div>
      </div>
    </div>
  )
}
