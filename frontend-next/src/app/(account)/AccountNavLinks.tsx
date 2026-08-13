'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const GROUPES = [
  {
    label: 'Mes annonces',
    liens: [
      { href: '/compte?tab=mes-annonces',      label: 'Mes annonces',        emoji: '📋', tab: 'mes-annonces' },
      { href: '/compte?tab=mes-annonces-immo', label: 'Mes biens immo',      emoji: '🏠', tab: 'mes-annonces-immo' },
      { href: '/compte?tab=mes-alertes',       label: 'Mes alertes prix',    emoji: '🔔', tab: 'mes-alertes' },
      { href: '/compte?tab=favoris',           label: 'Mes favoris',         emoji: '♥',  tab: 'favoris' },
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
      { href: '/compte?tab=profil',         label: 'Mon profil',                   emoji: '✏️', tab: 'profil' },
      { href: '/compte?tab=apporteur',      label: 'Apporteur d\'affaires',        emoji: '💼', tab: 'apporteur' },
      { href: '/compte?tab=fonctionnalites', label: 'Fonctionnalités & abonnements', emoji: '📖', tab: 'fonctionnalites' },
    ],
  },
]

export default function AccountNavLinks({ overrideTab }: { overrideTab?: string }) {
  const pathname = usePathname()

  return (
    <nav className="account-nav-container" aria-label="Navigation de l'espace compte utilisateur">
      {GROUPES.map(groupe => (
        <div key={groupe.label} className="account-nav-group">
          <p className="account-nav-group-label">{groupe.label}</p>
          <div className="account-nav-links-list">
            {groupe.liens.map(lien => {
              const actif = overrideTab && lien.tab === overrideTab 
                ? true 
                : (!overrideTab && (pathname === lien.href || pathname.startsWith(lien.href + '/')))
              return (
                <Link
                  key={lien.href}
                  href={lien.href}
                  className={`account-nav-link${actif ? ' account-nav-link--active' : ''}`}
                  aria-current={actif ? 'page' : undefined}
                >
                  <span aria-hidden="true">{lien.emoji}</span>
                  <span>{lien.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
