'use client'
import { logout } from '@/app/actions/auth'

interface Props {
  nom: string
}

export default function NavbarActions({ nom }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <a
        href="/compte"
        style={{
          padding: '7px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text2)',
        }}
      >
        {nom}
      </a>
      <form action={logout}>
        <button
          type="submit"
          style={{
            padding: '7px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--red)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Déconnexion
        </button>
      </form>
    </div>
  )
}
