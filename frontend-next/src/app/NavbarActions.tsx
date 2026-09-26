'use client'
import { logout } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'
import { purgerCacheUtilisateur } from '@/lib/db-offline'

interface Props {
  nom: string
  userId?: string
}

export default function NavbarActions({ nom, userId }: Props) {
  return (
    <div className="navbar-actions-compte" style={{ alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <a
        href="/compte"
        title={`Connecté : ${nom}`}
        style={{
          padding: '6px 10px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--navy)',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'none',
          maxWidth: '160px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <span style={{ flexShrink: 0 }}></span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{nom}</span>
      </a>
      <form action={logout} style={{ margin: 0 }}>
        <button
          type="submit"
          title="Se déconnecter"
          aria-label="Se déconnecter"
          onClick={() => {
            if (userId) {
              purgerCacheUtilisateur(userId).catch(() => {})
            }
            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem('nopalou_pos_active_boutique_id')
                localStorage.removeItem('nopalou_plan_actif')
                const toRemove: string[] = []
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i)
                  if (key && (key.includes(userId || '') || key.startsWith('nopalou_offline_immo_mine'))) {
                    toRemove.push(key)
                  }
                }
                toRemove.forEach((k) => localStorage.removeItem(k))
              } catch (e) {
                console.warn('[Logout purge]', e)
              }
            }
            if (typeof document !== 'undefined') {
              document.cookie = 'nopalou_locale=fr; path=/; max-age=31536000; SameSite=Lax'
              document.documentElement.lang = 'fr'
              document.documentElement.dir = 'ltr'
            }
          }}
          style={{
            padding: '6px 9px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#dc2626',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'background 0.15s, color 0.15s'
          }}
        >
          <LogOut size={14} />
          <span className="hidden-mobile navbar-logout-text">Quitter</span>
        </button>
      </form>
    </div>
  )
}
