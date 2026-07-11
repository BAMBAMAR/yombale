'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const GROUPES = [
  {
    label: 'Mes annonces',
    liens: [
      { href: '/mes-annonces',      label: 'Mes annonces',        emoji: '📋' },
      { href: '/mes-annonces-immo', label: 'Mes biens immo',      emoji: '🏠' },
      { href: '/mes-alertes',       label: 'Mes alertes prix',    emoji: '🔔' },
      { href: '/favoris',           label: 'Mes favoris',         emoji: '♥' },
      { href: '/deposer-annonce',   label: 'Publier une annonce', emoji: '➕' },
      { href: '/deposer-immo',      label: 'Publier un bien',     emoji: '🏡' },
    ],
  },
  {
    label: 'Ma boutique',
    liens: [
      { href: '/boutique', label: 'Ma boutique', emoji: '🏪' },
    ],
  },
  {
    label: 'Compte',
    liens: [
      { href: '/compte/profil',    label: 'Mon profil',           emoji: '✏️' },
      { href: '/compte/apporteur', label: 'Apporteur d\'affaires', emoji: '💼' },
    ],
  },
]

export default function AccountNavLinks() {
  const pathname = usePathname()

  return (
    <>
      {GROUPES.map(groupe => (
        <div key={groupe.label} className="account-nav-group">
          <p className="account-nav-group-label">{groupe.label}</p>
          <div>
            {groupe.liens.map(lien => {
              const actif = pathname === lien.href || pathname.startsWith(lien.href + '/')
              return (
                <Link
                  key={lien.href}
                  href={lien.href}
                  className={`account-nav-link${actif ? ' account-nav-link--active' : ''}`}
                >
                  <span>{lien.emoji}</span>
                  <span>{lien.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}
