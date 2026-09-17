'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Tag, PlusCircle, Store, Sparkles } from 'lucide-react'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'

interface AccountHubRecentAnnoncesProps {
  annonces: any[]
  annoncesActives: number
  hasBoutique: boolean
  onNavigateTab: (tabKey: string) => void
}

export default function AccountHubRecentAnnonces({
  annonces,
  annoncesActives,
  hasBoutique,
  onNavigateTab,
}: AccountHubRecentAnnoncesProps) {
  if (annonces.length === 0) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '16px 20px',
          border: '1px solid var(--border, #E8DDD2)',
          boxShadow: '0 2px 8px rgba(26,22,18,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#FFF3E8',
              color: 'var(--accent, #C75B00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Commencez à vendre sur Nopalou
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
              Déposez votre première annonce gratuite ou ouvrez votre boutique avec Caisse POS.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href="/deposer-annonce"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--accent, #C75B00)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 12,
              textDecoration: 'none',
            }}
          >
            <PlusCircle size={14} />
            <span>Publier</span>
          </Link>
          {!hasBoutique && (
            <Link
              href="/creer-boutique"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: '#FAF8F5',
                border: '1px solid #E8DDD2',
                color: 'var(--navy, #1C2B4A)',
                fontWeight: 750,
                fontSize: 12,
                textDecoration: 'none',
              }}
            >
              <Store size={14} />
              <span>Créer boutique</span>
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 14,
        padding: '16px 18px',
        border: '1px solid var(--border, #E8DDD2)',
        boxShadow: '0 2px 8px rgba(26,22,18,0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Vos dernières annonces
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
            {annoncesActives} en ligne sur {annonces.length} déposée(s)
          </p>
        </div>

        <Link
          href="/compte?tab=mes-annonces"
          onClick={e => {
            e.preventDefault()
            onNavigateTab('mes-annonces')
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 750,
            color: 'var(--accent, #C75B00)',
            textDecoration: 'none',
          }}
        >
          <span>Tout gérer ({annonces.length})</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
          gap: 10,
        }}
      >
        {annonces.slice(0, 3).map((a: any) => {
          const photo = a.photos?.[0] ?? null
          return (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 10,
                background: '#FAF8F5',
                border: '1px solid #E8DDD2',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: '#E2E8F0',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {photo ? (
                  <img
                    src={cloudinaryHQ(photo, { width: 120 })}
                    alt={a.titre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Tag size={18} style={{ color: '#94a3b8' }} />
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h4
                  style={{
                    margin: 0,
                    fontSize: 12.5,
                    fontWeight: 750,
                    color: 'var(--navy, #1C2B4A)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {a.titre}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--accent, #C75B00)', fontWeight: 800 }}>
                  {a.prix ? fcfa(a.prix) : 'Prix sur demande'}
                </p>
              </div>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  padding: '2px 5px',
                  borderRadius: 5,
                  background: a.actif ? '#DCFCE7' : '#FEF3C7',
                  color: a.actif ? '#166534' : '#92400E',
                  flexShrink: 0,
                }}
              >
                {a.actif ? 'Publiée' : 'En attente'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
