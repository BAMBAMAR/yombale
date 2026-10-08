'use client'

import React, { useState, useEffect } from 'react'
import {
  X, Calendar, Clock, FileCheck, Building, Bell, CheckCircle2,
  ExternalLink, GraduationCap, MapPin, Phone, CheckSquare, Wallet,
} from 'lucide-react'
import { ConcoursItem } from './SurgaConcoursCard'
import {
  estChecklistConcoursEnNote,
  toggleChecklistConcours,
  estFraisConcoursEnregistre,
  toggleFraisConcours,
} from '@/lib/surga-cross-actions'

interface SurgaConcoursDetailModalProps {
  concours: ConcoursItem | null
  isOpen: boolean
  estSuivi: boolean
  onClose: () => void
  onToggleSuivi: (concours: ConcoursItem) => void
}

export default function SurgaConcoursDetailModal({
  concours,
  isOpen,
  estSuivi,
  onClose,
  onToggleSuivi,
}: SurgaConcoursDetailModalProps) {
  const [piecesCochees, setPiecesCochees] = useState<Record<number, boolean>>({})
  const [checklistEnNote, setChecklistEnNote] = useState<boolean>(false)
  const [fraisEnregistres, setFraisEnregistres] = useState<boolean>(false)

  useEffect(() => {
    if (!concours) return
    const synchroniser = () => {
      setChecklistEnNote(estChecklistConcoursEnNote(concours))
      setFraisEnregistres(estFraisConcoursEnregistre(concours))
    }
    synchroniser()
    if (typeof window !== 'undefined') {
      window.addEventListener('surga-data-change', synchroniser)
      return () => window.removeEventListener('surga-data-change', synchroniser)
    }
  }, [concours])

  if (!isOpen || !concours) return null

  const handleToggleChecklist = () => {
    const actif = toggleChecklistConcours(concours)
    setChecklistEnNote(actif)
  }

  const handleToggleFrais = () => {
    const actif = toggleFraisConcours(concours)
    setFraisEnregistres(actif)
  }

  const togglePiece = (index: number) => {
    setPiecesCochees((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const pieces = concours.pieces_a_fournir || []
  const nbPiecesCochees = Object.values(piecesCochees).filter(Boolean).length
  const pourcentageDossier = pieces.length > 0 ? Math.round((nbPiecesCochees / pieces.length) * 100) : 0

  const formaterDate = (dateIso?: string) => {
    if (!dateIso) return 'À préciser'
    return new Date(dateIso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid var(--border, #E8DDD2)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--bg, #F8F5F0)',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              {concours.sigle && (
                <span
                  style={{
                    backgroundColor: 'var(--navy, #1C2B4A)',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 5,
                  }}
                >
                  {concours.sigle}
                </span>
              )}
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3, #73675E)' }}>
                Niveau requis : {concours.niveau_requis}
              </span>
            </div>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
                margin: 0,
                lineHeight: 1.35,
              }}
            >
              {concours.titre}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', marginTop: 2 }}>
              {concours.organisme}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text3, #73675E)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps défilable */}
        <div style={{ padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Calendrier officiel */}
          <div
            style={{
              backgroundColor: 'var(--bg, #F8F5F0)',
              borderRadius: 10,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
              Calendrier officiel des étapes
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--text3, #73675E)', display: 'block' }}>Date limite de dépôt :</span>
                <strong style={{ color: 'var(--surga-accent-ink, #A64B08)' }}>{formaterDate(concours.date_cloture)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text3, #73675E)', display: 'block' }}>Épreuves prévues :</span>
                <strong style={{ color: 'var(--navy, #1C2B4A)' }}>{formaterDate(concours.date_epreuves)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text3, #73675E)', display: 'block' }}>Frais d inscription :</span>
                <strong style={{ color: 'var(--price, #0A5C36)' }}>
                  {concours.frais_dossier_xof > 0
                    ? `${new Intl.NumberFormat('fr-FR').format(concours.frais_dossier_xof)} FCFA`
                    : 'Gratuit'}
                </strong>
              </div>
              {concours.age_max && (
                <div>
                  <span style={{ color: 'var(--text3, #73675E)', display: 'block' }}>Âge maximum :</span>
                  <strong>{concours.age_max} ans au 31 décembre</strong>
                </div>
              )}
            </div>
          </div>

          {/* Description succincte */}
          {concours.description && (
            <p style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', margin: 0, lineHeight: 1.45 }}>
              {concours.description}
            </p>
          )}

          {/* Checklist des pièces à fournir */}
          {pieces.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                  Pièces du dossier ({nbPiecesCochees}/{pieces.length})
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--price, #0A5C36)' }}>
                  {pourcentageDossier}% réuni
                </span>
              </div>

              {/* Barre de progression */}
              <div style={{ width: '100%', height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pourcentageDossier}%`,
                    height: '100%',
                    backgroundColor: 'var(--price, #0A5C36)',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pieces.map((piece, idx) => {
                  const coche = Boolean(piecesCochees[idx])
                  return (
                    <label
                      key={idx}
                      onClick={() => togglePiece(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '7px 10px',
                        borderRadius: 6,
                        backgroundColor: coche ? 'rgba(10, 92, 54, 0.05)' : '#FFFFFF',
                        border: '1px solid',
                        borderColor: coche ? 'rgba(10, 92, 54, 0.25)' : 'var(--border, #E8DDD2)',
                        cursor: 'pointer',
                        fontSize: 12,
                        color: coche ? 'var(--price, #0A5C36)' : 'var(--text2, #5A4E42)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={coche}
                        onChange={() => {}}
                        style={{ marginTop: 2 }}
                      />
                      <span style={{ textDecoration: coche ? 'line-through' : 'none', flex: 1, lineHeight: 1.35 }}>
                        {piece}
                      </span>
                    </label>
                  )
                })}
              </div>

              {/* Passerelles transversales Surga */}
              <div style={{ display: 'grid', gridTemplateColumns: concours.frais_dossier_xof > 0 ? '1fr 1fr' : '1fr', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={handleToggleChecklist}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: checklistEnNote ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
                    backgroundColor: checklistEnNote ? 'rgba(199, 91, 0, 0.12)' : 'var(--bg, #F8F5F0)',
                    color: checklistEnNote ? 'var(--surga-accent-ink, #A64B08)' : 'var(--navy, #1C2B4A)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={checklistEnNote ? "Checklist présente dans vos Notes — Cliquer pour retirer" : "Créer une note avec les cases à cocher de chaque pièce"}
                >
                  <CheckSquare size={14} color="var(--accent, #C75B00)" />
                  <span>{checklistEnNote ? 'Checklist en Note ✓' : 'Checklist dans Notes'}</span>
                </button>

                {concours.frais_dossier_xof > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleFrais}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid',
                      borderColor: fraisEnregistres ? 'var(--price, #0A5C36)' : 'var(--border, #E8DDD2)',
                      backgroundColor: fraisEnregistres ? 'rgba(10, 92, 54, 0.12)' : 'var(--bg, #F8F5F0)',
                      color: fraisEnregistres ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title={fraisEnregistres ? "Quittance inscrite dans Sama Xaalis — Cliquer pour retirer" : `Noter ${concours.frais_dossier_xof.toLocaleString()} FCFA dans Sama Xaalis`}
                  >
                    <Wallet size={14} color="var(--price, #0A5C36)" />
                    <span>{fraisEnregistres ? 'Quittance notée ✓' : 'Quittance Trésor'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Centres de préparation associés */}
          {concours.centres_prepa && concours.centres_prepa.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                Centres de préparation recommandés
              </div>
              {concours.centres_prepa.map((centre, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 6,
                    backgroundColor: 'var(--bg, #F8F5F0)',
                    fontSize: 12,
                  }}
                >
                  <div>
                    <strong>{centre.nom}</strong>
                    <div style={{ color: 'var(--text3, #73675E)' }}>{centre.quartier}</div>
                  </div>
                  {centre.tel && (
                    <a
                      href={`tel:${centre.tel}`}
                      style={{
                        color: 'var(--navy, #1C2B4A)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      <Phone size={11} />
                      <span>{centre.tel}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pied de page d'action */}
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'var(--bg, #F8F5F0)',
            borderTop: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {concours.lien_officiel && (
            <a
              href={concours.lien_officiel}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '9px 12px',
                borderRadius: 8,
                backgroundColor: '#FFFFFF',
                color: 'var(--navy, #1C2B4A)',
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>Site officiel</span>
              <ExternalLink size={12} />
            </a>
          )}

          <button
            type="button"
            onClick={() => onToggleSuivi(concours)}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 14px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: estSuivi ? 'var(--navy, #1C2B4A)' : 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {estSuivi ? <CheckCircle2 size={14} /> : <Bell size={14} />}
            <span>{estSuivi ? 'Suivi actif (Rappels J-30, J-7, J-1)' : 'Suivre ce concours'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
