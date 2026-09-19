'use client'

import React, { useState, useEffect } from 'react'
import { logout } from '@/app/actions/auth'
import { Store, ShoppingCart, LogOut, Building2, Wallet } from 'lucide-react'

interface MobileNavUserCardProps {
  displayName: string
  initiale: string
  onClose: () => void
}

export default function MobileNavUserCard({ displayName, initiale, onClose }: MobileNavUserCardProps) {
  const [hasAgence, setHasAgence] = useState(false)
  const [agenceSlug, setAgenceSlug] = useState<string | null>(null)
  const [hasBoutique, setHasBoutique] = useState(false)

  useEffect(() => {
    let isMounted = true
    Promise.allSettled([
      fetch('/api/boutiques/mine', { priority: 'low' } as any),
      fetch('/api/agences/mine', { priority: 'low' } as any),
    ]).then(([resBq, resAg]) => {
      if (!isMounted) return
      if (resBq.status === 'fulfilled' && resBq.value.ok) {
        resBq.value.json().then((data) => {
          if (isMounted && data?.boutiques && data.boutiques.length > 0) {
            setHasBoutique(true)
          }
        }).catch(() => {})
      }
      if (resAg.status === 'fulfilled' && resAg.value.ok) {
        resAg.value.json().then((data) => {
          if (isMounted && data?.agences && data.agences.length > 0) {
            setHasAgence(true)
            setAgenceSlug(data.agences[0]?.slug || null)
          }
        }).catch(() => {})
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

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

      {/* Accès Rapide Espaces Pro */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {hasAgence ? (
          <>
            <a
              href={agenceSlug ? `/agence/${agenceSlug}` : '/agence'}
              onClick={onClose}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 10px',
                borderRadius: 8,
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(28,43,74,0.2)',
              }}
            >
              <Building2 size={14} style={{ color: 'var(--accent, #C75B00)' }} />
              <span>Mon Agence Pro</span>
            </a>

            {hasBoutique ? (
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
                <span>Ma Boutique</span>
              </a>
            ) : (
              <a
                href={agenceSlug ? `/agence/${agenceSlug}/biens` : '/agence'}
                onClick={onClose}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: '#ffffff',
                  border: '1.5px solid var(--navy, #1C2B4A)',
                  color: 'var(--navy, #1C2B4A)',
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                <span>Mes Biens</span>
              </a>
            )}
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Raccourci Sama Xaalis */}
      <a
        href="/compte?tab=kalpe"
        onClick={onClose}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 10,
          padding: '8px 12px',
          borderRadius: 8,
          background: 'rgba(28, 43, 74, 0.05)',
          border: '1px solid rgba(28, 43, 74, 0.1)',
          textDecoration: 'none',
          color: 'var(--navy, #1C2B4A)',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Wallet size={15} color="#C75B00" />
          <span>Sama Xaalis (Mon argent & dettes)</span>
        </span>
        <span style={{ fontSize: 11, color: '#C75B00', fontWeight: 800 }}>Ouvrir →</span>
      </a>
    </div>
  )
}
