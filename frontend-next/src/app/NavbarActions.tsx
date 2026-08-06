'use client'
import { logout } from '@/app/actions/auth'

interface Props {
  nom: string
}

export default function NavbarActions({ nom }: Props) {
  return (
    <div className="navbar-actions-compte" style={{ alignItems: 'center', gap: '8px', flexShrink: 0 }}>
      <a
        href="/compte"
        style={{
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--navy)',
          background: '#f1f5f9',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'none'
        }}
      >
        👤 {nom}
      </a>
      <form action={logout} style={{ margin: 0 }}>
        <button
          type="submit"
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#dc2626',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Déconnexion
        </button>
      </form>
    </div>
  )
}
