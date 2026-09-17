'use client'

import React from 'react'
import Link from 'next/link'
import {
  PlusCircle,
  Home,
  Monitor,
  Store,
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

      <div className="account-actions-grid">
        {/* Action 1 : Vendre un article (Annonce Classifiée) */}
        <Link
          href="/deposer-annonce"
          style={{
            background: 'linear-gradient(135deg, #C75B00 0%, #EA580C 100%)',
            borderRadius: 14,
            padding: '16px 14px',
            color: '#ffffff',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 6,
            minHeight: 100,
            boxShadow: '0 3px 10px rgba(199,91,0,0.22)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <PlusCircle size={22} />
          <span style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.2 }}>
            Vendre un article
          </span>
          <span style={{ fontSize: 11, opacity: 0.9, fontWeight: 600 }}>
            Petite annonce gratuite
          </span>
        </Link>

        {/* Action 2 : Publier un bien immobilier */}
        <Link
          href="/deposer-immo"
          style={{
            background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #2A3F6D 100%)',
            borderRadius: 14,
            padding: '16px 14px',
            color: '#ffffff',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 6,
            minHeight: 100,
            boxShadow: '0 3px 10px rgba(28,43,74,0.2)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <Home size={22} />
          <span style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.2 }}>
            Publier un bien immo
          </span>
          <span style={{ fontSize: 11, opacity: 0.9, fontWeight: 600 }}>
            Location ou vente directe
          </span>
        </Link>

        {/* Action 3 : Caisse POS Tactile (si marchand) OU Créer Boutique (si visiteur) */}
        <Link
          href={hasBoutique ? '/boutique/caisse' : '/creer-boutique'}
          style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '16px 14px',
            color: 'var(--navy, #1C2B4A)',
            border: '1px solid var(--border, #E8DDD2)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 6,
            minHeight: 100,
            boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
          }}
        >
          {hasBoutique ? (
            <>
              <Monitor size={22} style={{ color: '#16A34A' }} />
              <span style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.2 }}>
                Caisse POS Tactile
              </span>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                Ventes physiques comptoir
              </span>
            </>
          ) : (
            <>
              <Store size={22} style={{ color: 'var(--accent, #C75B00)' }} />
              <span style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.2 }}>
                Créer ma boutique
              </span>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                Vitrine & Caisse gratuites
              </span>
            </>
          )}
        </Link>

        {/* Action 4 : Explorer les boutiques et marchands */}
        <Link
          href="/boutiques"
          style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '16px 14px',
            color: 'var(--navy, #1C2B4A)',
            border: '1px solid var(--border, #E8DDD2)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 6,
            minHeight: 100,
            boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
          }}
        >
          <ShoppingBag size={22} style={{ color: 'var(--accent, #C75B00)' }} />
          <span style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.2 }}>
            Explorer boutiques
          </span>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
            Marchands & vitrines vérifiés
          </span>
        </Link>
      </div>
    </div>
  )
}
