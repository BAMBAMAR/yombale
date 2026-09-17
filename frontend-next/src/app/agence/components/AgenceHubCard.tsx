'use client'

import React from 'react'
import Link from 'next/link'
import { MapPin, ArrowRight, Sparkles, CreditCard } from 'lucide-react'

export interface AgenceItem {
  id: string
  nom: string
  slug: string
  description?: string
  ville: string
  quartier?: string
  telephone?: string
  statut: string
  mon_role: string
  is_owner: boolean
  nb_biens: number
  nb_prospects_actifs: number
  sponsorise?: boolean
  sponsor_jusqu_au?: string
  est_sponsorise_actif?: boolean
}

interface AgenceHubCardProps {
  agence: AgenceItem
}

export function AgenceHubCard({ agence }: AgenceHubCardProps) {
  const isSponsored =
    agence.est_sponsorise_actif ||
    (agence.sponsorise && agence.sponsor_jusqu_au && new Date(agence.sponsor_jusqu_au) > new Date())

  return (
    <div
      className="agence-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 24,
        position: 'relative',
        border: isSponsored ? '1.5px solid #D97706' : '1px solid var(--border, #E8DDD2)',
        background: isSponsored
          ? 'linear-gradient(180deg, rgba(254, 243, 199, 0.15) 0%, #FFFFFF 100%)'
          : '#FFFFFF',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: isSponsored
                  ? 'linear-gradient(135deg, #B45309 0%, #D97706 100%)'
                  : 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              {agence.nom.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                {agence.nom}
              </h3>
              <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <MapPin size={13} />
                {agence.quartier ? `${agence.quartier}, ${agence.ville}` : agence.ville}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isSponsored && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FCD34D',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Sparkles size={11} />
                En Vedette
              </span>
            )}
            <span className={`status-badge ${agence.statut}`}>
              {agence.statut === 'actif' ? 'Active' : agence.statut}
            </span>
          </div>
        </div>

        {agence.description && (
          <p
            style={{
              fontSize: 13,
              color: '#475569',
              lineHeight: 1.5,
              marginBottom: 16,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {agence.description}
          </p>
        )}

        {/* Badges compteurs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              flex: 1,
              padding: '10px 12px',
              background: '#FAF8F5',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Biens</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{agence.nb_biens}</div>
          </div>
          <div
            style={{
              flex: 1,
              padding: '10px 12px',
              background: '#FAF8F5',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Prospects</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{agence.nb_prospects_actifs}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Link
          href={`/agence/${agence.slug}`}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13.5,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            textDecoration: 'none',
          }}
        >
          <span>Gérer l'agence</span>
          <ArrowRight size={15} />
        </Link>

        <Link
          href={`/agence/${agence.slug}/abonnement`}
          className="agence-btn-outline"
          style={{
            padding: '10px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Abonnement & Sponsoring"
        >
          <CreditCard size={16} />
        </Link>
      </div>
    </div>
  )
}
