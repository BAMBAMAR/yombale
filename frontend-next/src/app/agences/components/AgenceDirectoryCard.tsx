'use client'

import React from 'react'
import Link from 'next/link'
import ExternalImg from '@/components/ExternalImg'
import {
  ShieldCheck,
  MapPin,
  ArrowRight,
  MessageCircle,
  Building2,
  Home,
  Award,
  Sparkles,
  Key
} from 'lucide-react'

export interface BienApercu {
  id: string
  titre: string
  type_bien: string
  prix_location?: number | string | null
  prix_vente?: number | string | null
  quartier?: string | null
  ville: string
  meuble?: boolean | null
  surface_m2?: number | string | null
  nb_chambres?: number | null
  photo_principale?: string | null
}

export interface AgenceItem {
  id: string
  nom: string
  slug: string
  description?: string
  logo_url?: string
  cover_url?: string
  ville: string
  quartier?: string
  telephone?: string
  whatsapp?: string
  site_web?: string
  numero_agrement?: string
  statut?: string
  abonnement_plan?: string
  sponsorise?: boolean
  total_biens?: number
  nb_biens_disponibles: number
  biens_apercu?: BienApercu[]
  parametres?: {
    reseaux_sociaux?: {
      instagram?: string
      tiktok?: string
      facebook?: string
      whatsapp?: string
      linkedin?: string
      youtube?: string
      twitter?: string
      site_web?: string
    }
  }
}

function formatPrixFCFA(val: number | string | undefined | null) {
  if (val === undefined || val === null || val === '') return ''
  const num = typeof val === 'number' ? val : parseFloat(val)
  if (isNaN(num)) return `${val} F`
  return new Intl.NumberFormat('fr-SN').format(num) + ' F'
}

interface Props {
  agence: AgenceItem
}

export default function AgenceDirectoryCard({ agence: ag }: Props) {
  const waNum = (ag.whatsapp || ag.telephone || '').replace(/[^0-9]/g, '')
  const words = ag.nom.trim().split(/\s+/)
  const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : ag.nom.slice(0, 2).toUpperCase()
  const biens = ag.biens_apercu || []
  const hasBiens = biens.length > 0
  const estAgree = Boolean(ag.numero_agrement)
  const estPartenairePro = ag.abonnement_plan === 'pro' || ag.abonnement_plan === 'business' || ag.sponsorise

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: estPartenairePro ? '1.5px solid #fed7aa' : '1px solid var(--border, #E8DDD2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: estPartenairePro
          ? '0 6px 20px rgba(199, 91, 0, 0.08)'
          : '0 2px 10px rgba(28, 43, 74, 0.04)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div>
        {/* Bandeau d'en-tête Agence */}
        <div
          style={{
            height: 70,
            background: 'linear-gradient(135deg, #1C2B4A 0%, #24365d 60%, #152037 100%)',
            position: 'relative',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          {/* Badge Agréée État ou Partenaire */}
          {estAgree ? (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                color: 'var(--navy, #1C2B4A)',
                borderRadius: 14,
                padding: '3px 9px',
                fontSize: 10.5,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            >
              <ShieldCheck size={13} style={{ color: '#16a34a' }} />
              <span>Agrément N° {ag.numero_agrement}</span>
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                color: 'var(--navy, #1C2B4A)',
                borderRadius: 14,
                padding: '3px 9px',
                fontSize: 10.5,
                fontWeight: 750,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ShieldCheck size={12} style={{ color: '#16a34a' }} />
              <span>Agence Vérifiée</span>
            </div>
          )}

          {estPartenairePro && (
            <div
              style={{
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                borderRadius: 14,
                padding: '3px 8px',
                fontSize: 10.5,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Sparkles size={11} />
              <span>Partenaire Pro</span>
            </div>
          )}
        </div>

        {/* Corps Agence & Logo */}
        <div style={{ padding: '0 16px 14px', position: 'relative', zIndex: 5 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginTop: -28,
              marginBottom: 10,
              position: 'relative',
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
                border: '3px solid #FFFFFF',
                boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 18,
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative',
                zIndex: 11,
              }}
            >
              {ag.logo_url ? (
                <ExternalImg
                  src={ag.logo_url}
                  alt={ag.nom}
                  fallback={initials}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>

            <div
              style={{
                background: ag.nb_biens_disponibles > 0 ? '#ecfdf5' : '#f8fafc',
                border: ag.nb_biens_disponibles > 0 ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                color: ag.nb_biens_disponibles > 0 ? '#047857' : '#64748b',
                padding: '4px 10px',
                borderRadius: 14,
                fontSize: 11.5,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Home size={12} />
              <span>
                {ag.nb_biens_disponibles > 0
                  ? `${ag.nb_biens_disponibles} bien${ag.nb_biens_disponibles > 1 ? 's' : ''} disponible${ag.nb_biens_disponibles > 1 ? 's' : ''}`
                  : '0 bien en ligne'}
              </span>
            </div>
          </div>

          {/* Titre & Localisation */}
          <h3
            title={ag.nom}
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: 'var(--navy, #1C2B4A)',
              margin: '0 0 4px',
              lineHeight: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            <Link
              href={`/agences/${ag.slug}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {ag.nom}
            </Link>
          </h3>

          <div
            style={{
              fontSize: 12,
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginBottom: 10,
            }}
          >
            <MapPin size={12} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ag.quartier ? `${ag.quartier}, ${ag.ville}` : ag.ville}
            </span>
          </div>

          {/* Description */}
          {ag.description && (
            <p
              style={{
                fontSize: 12,
                color: '#475569',
                lineHeight: 1.4,
                margin: '0 0 12px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {ag.description}
            </p>
          )}

          {/* ── APERÇU DU PORTEFEUILLE DE BIENS (MINI GALERIE) ── */}
          {hasBiens ? (
            <div style={{ marginTop: 8, marginBottom: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                }}
              >
                <span>Aperçu des mandats :</span>
                <Link
                  href={`/agences/${ag.slug}`}
                  style={{ color: 'var(--navy, #1C2B4A)', textDecoration: 'none', fontWeight: 800 }}
                >
                  Tout voir →
                </Link>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 6,
                }}
              >
                {biens.slice(0, 3).map((bien, idx) => {
                  const prixBien = bien.prix_location
                    ? formatPrixFCFA(bien.prix_location)
                    : bien.prix_vente
                    ? formatPrixFCFA(bien.prix_vente)
                    : null
                  const typeLabel = bien.type_bien
                    ? bien.type_bien.charAt(0).toUpperCase() + bien.type_bien.slice(1, 6)
                    : 'Bien'

                  return (
                    <div
                      key={bien.id || idx}
                      style={{
                        background: '#FAF8F5',
                        border: '1px solid var(--border, #E8DDD2)',
                        borderRadius: 8,
                        padding: '6px 7px',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 52,
                        justifyContent: 'space-between',
                        overflow: 'hidden',
                      }}
                      title={`${bien.titre} - ${prixBien || 'Disponible'}`}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: 'var(--navy, #1C2B4A)',
                          textTransform: 'capitalize',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {typeLabel}
                      </div>

                      {prixBien ? (
                        <div
                          style={{
                            fontSize: 10.5,
                            fontWeight: 900,
                            color: 'var(--price, #0A5C36)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {prixBien}
                        </div>
                      ) : (
                        <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 600 }}>
                          Sur demande
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#FAF8F5',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 11,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 6,
                marginBottom: 12,
              }}
            >
              <Key size={13} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
              <span>Contacter l'agence pour nouvelles rentrées de mandats</span>
            </div>
          )}
        </div>
      </div>

      {/* ── ACTIONS : VITRINE & WHATSAPP DIRECT ── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 16px',
          borderTop: '1px solid var(--border, #E8DDD2)',
          background: '#ffffff',
        }}
      >
        <Link
          href={`/agences/${ag.slug}`}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '9px 12px',
            borderRadius: 10,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            fontSize: 12.5,
            fontWeight: 800,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'background 0.15s ease',
          }}
        >
          <span>Visiter la vitrine</span>
          <ArrowRight size={13} />
        </Link>

        {waNum && (
          <a
            href={`https://wa.me/${waNum}?text=${encodeURIComponent(
              `Bonjour ${ag.nom}, je vous contacte via votre vitrine officielle Nopalou Immobilier.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '9px 12px',
              borderRadius: 10,
              background: '#16a34a',
              color: '#FFFFFF',
              textDecoration: 'none',
              flexShrink: 0,
            }}
            title="Discuter sur WhatsApp"
          >
            <MessageCircle size={15} />
          </a>
        )}
      </div>
    </div>
  )
}
