'use client'

import { SURGA_PODCAST_ACTIF } from '@/lib/surga-fonctions'
import React, { useEffect } from 'react'
import {
  X,
  Radio,
  GraduationCap,
  ShieldCheck,
  Briefcase,
  Tv,
  Headphones,
  Calculator,
  LayoutGrid,
  ChevronRight,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react'

interface ServiceItem {
  id: string
  titre: string
  description: string
  badge?: string
  badgeType?: 'live' | 'promo' | 'neutre'
  icon: LucideIcon
  action: () => void
}

interface SurgaPlusServicesModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenRadios?: () => void
  onOpenConcours?: () => void
  onOpenDemarches?: () => void
  onOpenEmploi?: () => void
  onOpenVideos?: () => void
  onOpenPodcast?: () => void
  onOpenCalc?: () => void
}

export default function SurgaPlusServicesModal({
  isOpen,
  onClose,
  onOpenRadios,
  onOpenConcours,
  onOpenDemarches,
  onOpenEmploi,
  onOpenVideos,
  onOpenPodcast,
  onOpenCalc,
}: SurgaPlusServicesModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleLaunch = (action?: () => void) => {
    onClose()
    if (action) {
      setTimeout(() => {
        action()
      }, 50)
    }
  }

  const services: ServiceItem[] = [
    {
      id: 'radios',
      titre: 'Radios FM direct',
      description: 'Écoutez RTS, RFM, Zik FM, Sud FM, Al Fayda en direct',
      badge: 'Live',
      badgeType: 'live',
      icon: Radio,
      action: () => onOpenRadios?.(),
    },
    {
      id: 'concours',
      titre: 'Concours & ENA',
      description: 'Calendrier des concours de la fonction publique, dates limites et dossiers',
      badge: 'J-7',
      badgeType: 'promo',
      icon: GraduationCap,
      action: () => onOpenConcours?.(),
    },
    {
      id: 'demarches',
      titre: 'Démarches État',
      description: 'Guides officiels : Passeport, CNI biométrique, permis et casier judiciaire',
      badge: 'Guide',
      badgeType: 'neutre',
      icon: ShieldCheck,
      action: () => onOpenDemarches?.(),
    },
    {
      id: 'emploi',
      titre: 'Emploi & Stages',
      description: 'Offres d’emploi vérifiées, recrutements et opportunités de stages à Dakar',
      badge: 'Dakar',
      badgeType: 'neutre',
      icon: Briefcase,
      action: () => onOpenEmploi?.(),
    },
    {
      id: 'videos',
      titre: 'Séries & Vidéos',
      description: 'Derniers épisodes des productions sénégalaises phares et divertissement',
      badge: 'Sénégal',
      badgeType: 'neutre',
      icon: Tv,
      action: () => onOpenVideos?.(),
    },
    {
      id: 'podcast',
      titre: 'Podcast Privé',
      description: 'Votre briefing matinal complet et flashs d’information en audio MP3',
      badge: 'Audio',
      badgeType: 'neutre',
      icon: Headphones,
      action: () => onOpenPodcast?.(),
    },
    {
      id: 'calc',
      titre: 'Calculatrice FCFA',
      description: 'Calculatrice de poche déterministe pour opérations rapides en FCFA',
      badge: 'Outil',
      badgeType: 'neutre',
      icon: Calculator,
      action: () => onOpenCalc?.(),
    },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plus-services-modal-title"
      data-surga-echap="propre" style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.65)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 18,
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid #ECE4DA',
          overflow: 'hidden',
          animation: 'surgaFadeIn 0.18s ease-out',
        }}
      >
        {/* Header Modale */}
        <div
          style={{
            padding: '18px 22px 14px 22px',
            borderBottom: '1px solid #ECE4DA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAFAF8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(199, 91, 0, 0.12)',
                color: '#C75B00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <LayoutGrid size={20} />
            </div>
            <div>
              <h2
                id="plus-services-modal-title"
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#1C2B4A',
                  letterSpacing: '-0.01em',
                }}
              >
                Tous les Services &amp; Outils
              </h2>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: 12.5,
                  color: '#64748B',
                }}
              >
                Accédez aux autres services sénégalais du quotidien
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: '#F1ECE6',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Grille des services */}
        <div
          style={{
            padding: '16px 20px 20px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {services.filter((s) => s.id !== 'podcast' || SURGA_PODCAST_ACTIF).map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleLaunch(s.action)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid #ECE4DA',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                  gap: 12,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#C75B00'
                  e.currentTarget.style.backgroundColor = '#FCFBF9'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#ECE4DA'
                  e.currentTarget.style.backgroundColor = '#FFFFFF'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: '#F8F5F0',
                      border: '1px solid #ECE4DA',
                      color: '#1C2B4A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={19} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#1C2B4A',
                        }}
                      >
                        {s.titre}
                      </span>
                      {s.badge && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 6,
                            backgroundColor:
                              s.badgeType === 'live'
                                ? '#E6F4EA'
                                : s.badgeType === 'promo'
                                ? 'rgba(199, 91, 0, 0.12)'
                                : '#F1E9DF',
                            color:
                              s.badgeType === 'live'
                                ? '#0A5C36'
                                : s.badgeType === 'promo'
                                ? '#C75B00'
                                : '#64748B',
                          }}
                        >
                          {s.badge}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#64748B',
                        lineHeight: 1.35,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.description}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    color: '#C75B00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ChevronRight size={18} />
                </div>
              </button>
            )
          })}
        </div>

        {/* Pied de Modale */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#FAFAF8',
            borderTop: '1px solid #ECE4DA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#64748B',
          }}
        >
          <span>7 services complémentaires actifs</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              backgroundColor: '#1C2B4A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
