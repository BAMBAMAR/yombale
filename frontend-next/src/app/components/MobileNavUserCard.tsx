'use client'

import React from 'react'
import { logout } from '@/app/actions/auth'
import { Store, ShoppingCart, LogOut } from 'lucide-react'

interface MobileNavUserCardProps {
  displayName: string
  initiale: string
  onClose: () => void
}

export default function MobileNavUserCard({ displayName, initiale, onClose }: MobileNavUserCardProps) {
  return (
    <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <a
          href="/compte"
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', minWidth: 0, flex: 1 }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, var(--accent, #C75B00) 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 900,
              boxShadow: '0 2px 6px rgba(28,43,74,0.2)',
              flexShrink: 0,
            }}
          >
            {initiale}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13.5, color: 'var(--navy, #1C2B4A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </p>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--accent, #C75B00)', fontWeight: 700 }}>
              Gérer mon profil →
            </p>
          </div>
        </a>

        {/* Bouton Déconnexion */}
        <form action={logout} style={{ margin: 0 }}>
          <button
            type="submit"
            onClick={() => {
              if (typeof document !== 'undefined') {
                document.cookie = 'nopalou_locale=fr; path=/; max-age=31536000; SameSite=Lax'
                document.documentElement.lang = 'fr'
                document.documentElement.dir = 'ltr'
              }
            }}
            title="Se déconnecter"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 8,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <LogOut size={13} />
            <span>Quitter</span>
          </button>
        </form>
      </div>

      {/* Accès Rapide Espace Boutique */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <a
          href="/boutique"
          onClick={onClose}
          style={{
            flex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 800,
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(199,91,0,0.2)',
          }}
        >
          <Store size={14} />
          <span>Ma Boutique Pro</span>
        </a>
        <a
          href="/boutique/caisse"
          onClick={onClose}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '8px 10px',
            borderRadius: 8,
            background: '#ffffff',
            border: '1.5px solid #0A5C36',
            color: '#0A5C36',
            fontSize: 12,
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          <ShoppingCart size={14} />
          <span>POS Caisse</span>
        </a>
      </div>
    </div>
  )
}
