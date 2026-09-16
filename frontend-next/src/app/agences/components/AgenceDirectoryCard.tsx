import React from 'react'
import Link from 'next/link'
import { ShieldCheck, MapPin, ArrowRight, MessageCircle } from 'lucide-react'

export interface AgenceItem {
  id: string
  nom: string
  slug: string
  description?: string
  logo_url?: string
  ville: string
  quartier?: string
  telephone?: string
  whatsapp?: string
  site_web?: string
  numero_agrement?: string
  nb_biens_disponibles: number
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

interface Props {
  agence: AgenceItem
}

export default function AgenceDirectoryCard({ agence: ag }: Props) {
  const waNum = (ag.whatsapp || ag.telephone || '').replace(/[^0-9]/g, '')

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid var(--border, #E8DDD2)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 2px 6px rgba(28, 43, 74, 0.04)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div>
        {/* Header Carte Agence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'var(--navy, #1C2B4A)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 20,
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {ag.logo_url ? (
              <img src={ag.logo_url} alt={ag.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              ag.nom.charAt(0).toUpperCase()
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: 'var(--navy, #1C2B4A)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {ag.nom}
              </h3>
              <ShieldCheck size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
            </div>

            <div style={{ fontSize: 12.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <MapPin size={13} />
              {ag.quartier ? `${ag.quartier}, ${ag.ville}` : ag.ville}
            </div>
          </div>
        </div>

        {/* Description */}
        {ag.description && (
          <p
            style={{
              fontSize: 12.5,
              color: '#475569',
              lineHeight: 1.45,
              margin: '0 0 14px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {ag.description}
          </p>
        )}

        {/* Badge Biens Actifs */}
        <div
          style={{
            background: '#FAF8F5',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Biens disponibles :</span>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: ag.nb_biens_disponibles > 0 ? 'var(--accent, #C75B00)' : '#64748B',
            }}
          >
            {ag.nb_biens_disponibles} bien(s) en ligne
          </span>
        </div>
      </div>

      {/* Actions : Visiter la vitrine & Contact WhatsApp */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border, #E8DDD2)' }}>
        <Link
          href={`/agences/${ag.slug}`}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '9px 12px',
            borderRadius: 8,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 750,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>Visiter la vitrine</span>
          <ArrowRight size={14} />
        </Link>

        {waNum && (
          <a
            href={`https://wa.me/${waNum}?text=${encodeURIComponent(
              `Bonjour ${ag.nom}, je vous contacte via votre vitrine Nopalou Immobilier.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '9px 12px',
              borderRadius: 8,
              background: '#16a34a',
              color: '#FFFFFF',
              textDecoration: 'none',
            }}
            title="Discuter sur WhatsApp"
          >
            <MessageCircle size={16} />
          </a>
        )}
      </div>
    </div>
  )
}
