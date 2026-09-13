'use client'

import React from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'

interface AccountHubHeroProps {
  nom: string
  email: string | null
  initiale: string
  hasBoutique: boolean
  onNavigateTab: (tabKey: string) => void
}

export default function AccountHubHero({
  nom,
  email,
  initiale,
  hasBoutique,
  onNavigateTab,
}: AccountHubHeroProps) {
  return (
    <div className="account-hub-hero-card">
      <div
        style={{
          background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)',
          borderRadius: 14,
          padding: '16px 20px',
          border: '1.5px solid #E8DDD2',
          boxShadow: '0 2px 10px rgba(26,22,18,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, var(--accent, #C75B00) 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 900,
              boxShadow: '0 3px 10px rgba(28,43,74,0.2)',
              flexShrink: 0,
            }}
          >
            {initiale}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(17px, 3.5vw, 20px)',
                  fontWeight: 900,
                  color: 'var(--navy, #1C2B4A)',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Bonjour, {nom}
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 10,
                  background: '#DCFCE7',
                  color: '#166534',
                  border: '1px solid #BBF7D0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                Actif
              </span>
              {hasBoutique && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 10,
                    background: 'var(--orange2, #FFF3E8)',
                    color: 'var(--accent, #C75B00)',
                    border: '1px solid rgba(199,91,0,0.2)',
                  }}
                >
                  Commerçant
                </span>
              )}
            </div>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 12.5,
                color: '#64748B',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {email || 'Centre de contrôle de votre compte Nopalou'}
            </p>
          </div>
        </div>

        <Link
          href="/compte?tab=profil"
          onClick={e => {
            e.preventDefault()
            onNavigateTab('profil')
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 750,
            color: 'var(--navy, #1C2B4A)',
            background: '#ffffff',
            border: '1.5px solid var(--border, #E8DDD2)',
            padding: '7px 14px',
            borderRadius: 8,
            textDecoration: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease',
          }}
        >
          <User size={14} style={{ color: 'var(--accent, #C75B00)' }} />
          <span>Profil</span>
        </Link>
      </div>
    </div>
  )
}
