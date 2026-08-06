'use client'
import { logout } from '@/app/actions/auth'

interface Props {
  nom: string
}

export default function NavbarActions({ nom }: Props) {
  return (
    <div className="navbar-actions-compte">
      <a
        href="/compte"
        className="navbar-actions-user"
      >
        👤 {nom}
      </a>
      <form action={logout} style={{ margin: 0 }}>
        <button
          type="submit"
          className="navbar-actions-logout"
        >
          Déconnexion
        </button>
      </form>
    </div>
  )
}
