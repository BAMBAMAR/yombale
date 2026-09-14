'use client'

import React from 'react'
import Link from 'next/link'
import {
  PlusCircle,
  Store,
  Package,
  Users,
  Monitor,
  Heart,
  Home,
  ShoppingBag,
  Zap,
} from 'lucide-react'

interface AccountHubQuickActionsProps {
  hasBoutique: boolean
  onNavigateTab: (tabKey: string) => void
}

export default function AccountHubQuickActions({
  hasBoutique,
  onNavigateTab,
}: AccountHubQuickActionsProps) {
  return (
    <>
      {/* ── 3. Hub d'Actions Rapides 1-Tap ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--navy, #1C2B4A)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Zap size={16} style={{ color: 'var(--accent, #C75B00)' }} />
            <span>Actions Rapides</span>
          </h2>
          <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
            Accès direct en 1-tap
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(145px, 100%), 1fr))',
            gap: 10,
          }}
        >
          {/* Tuile 1 : Publier une Annonce */}
          <Link
            href="/deposer-annonce"
            style={{
              background: 'linear-gradient(135deg, #C75B00 0%, #EA580C 100%)',
              borderRadius: 12,
              padding: '14px 12px',
              color: '#ffffff',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 8,
              boxShadow: '0 3px 10px rgba(199,91,0,0.22)',
              minHeight: 85,
            }}
          >
            <PlusCircle size={24} />
            <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
              Vendre un article
            </span>
          </Link>

          {/* Tuile 2 : Ma Boutique / POS */}
          <Link
            href={hasBoutique ? '/boutique' : '/creer-boutique'}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: '14px 12px',
              color: 'var(--navy, #1C2B4A)',
              border: '1.5px solid #E8DDD2',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(26,22,18,0.03)',
              minHeight: 85,
            }}
          >
            <Store size={22} style={{ color: 'var(--accent, #C75B00)' }} />
            <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
              {hasBoutique ? 'Ma Boutique' : 'Créer Boutique'}
            </span>
          </Link>

          {/* Tuile 3 : Suivi Commandes */}
          <Link
            href="/compte?tab=suivi-commande"
            onClick={e => {
              e.preventDefault()
              onNavigateTab('suivi-commande')
            }}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: '14px 12px',
              color: 'var(--navy, #1C2B4A)',
              border: '1.5px solid #E8DDD2',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(26,22,18,0.03)',
              minHeight: 85,
            }}
          >
            <Package size={22} style={{ color: '#2563EB' }} />
            <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
              Mes Commandes
            </span>
          </Link>

          {/* Tuile 4 : Commissions / Affiliation */}
          <Link
            href="/compte?tab=apporteur"
            onClick={e => {
              e.preventDefault()
              onNavigateTab('apporteur')
            }}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: '14px 12px',
              color: 'var(--navy, #1C2B4A)',
              border: '1.5px solid #E8DDD2',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(26,22,18,0.03)',
              minHeight: 85,
            }}
          >
            <Users size={22} style={{ color: '#D97706' }} />
            <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
              Mes Commissions
            </span>
          </Link>
        </div>
      </div>

      {/* ── 4. Raccourcis Horizontaux (Pills) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {hasBoutique && (
          <Link
            href="/boutique/caisse"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 20,
              background: '#ffffff',
              border: '1px solid #E8DDD2',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 750,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            }}
          >
            <Monitor size={14} style={{ color: 'var(--accent, #C75B00)' }} />
            <span>Caisse POS</span>
          </Link>
        )}

        <Link
          href="/compte?tab=favoris"
          onClick={e => {
            e.preventDefault()
            onNavigateTab('favoris')
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 20,
            background: '#ffffff',
            border: '1px solid #E8DDD2',
            color: 'var(--navy, #1C2B4A)',
            fontSize: 12,
            fontWeight: 750,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
          }}
        >
          <Heart size={14} style={{ color: '#DB2777' }} />
          <span>Favoris</span>
        </Link>

        <Link
          href="/compte?tab=mes-annonces-immo"
          onClick={e => {
            e.preventDefault()
            onNavigateTab('mes-annonces-immo')
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 20,
            background: '#ffffff',
            border: '1px solid #E8DDD2',
            color: 'var(--navy, #1C2B4A)',
            fontSize: 12,
            fontWeight: 750,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
          }}
        >
          <Home size={14} style={{ color: '#7C3AED' }} />
          <span>Immobilier</span>
        </Link>

        <Link
          href="/boutiques"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 20,
            background: '#ffffff',
            border: '1px solid #E8DDD2',
            color: 'var(--navy, #1C2B4A)',
            fontSize: 12,
            fontWeight: 750,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
          }}
        >
          <ShoppingBag size={14} style={{ color: '#059669' }} />
          <span>Explorer boutiques</span>
        </Link>
      </div>
    </>
  )
}
