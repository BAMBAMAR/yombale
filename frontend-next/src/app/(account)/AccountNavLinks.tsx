'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/context'

export default function AccountNavLinks({ overrideTab }: { overrideTab?: string }) {
  const pathname = usePathname()
  const { t } = useTranslation()

  const groupes = [
    {
      label: t('account.groupAdsPurchases'),
      liens: [
        { href: '/compte?tab=suivi-commande',    label: t('account.navTrackOrder'),     emoji: '📦', tab: 'suivi-commande' },
        { href: '/compte?tab=mes-annonces',      label: t('account.navMyAds'),          emoji: '📋', tab: 'mes-annonces' },
        { href: '/compte?tab=mes-annonces-immo', label: t('account.navMyRealEstate'),   emoji: '🏠', tab: 'mes-annonces-immo' },
        { href: '/compte?tab=mes-alertes',       label: t('account.navPriceAlerts'),    emoji: '🔔', tab: 'mes-alertes' },
        { href: '/compte?tab=favoris',           label: t('account.navFavorites'),      emoji: '♥',  tab: 'favoris' },
        { href: '/deposer-annonce',              label: t('account.navPublishAd'),      emoji: '➕' },
        { href: '/deposer-immo',                 label: t('account.navPublishRealEstate'), emoji: '🏡' },
      ],
    },
    {
      label: t('account.groupShop'),
      liens: [
        { href: '/boutique', label: t('account.navMyShop'), emoji: '🏪' },
      ],
    },
    {
      label: t('account.groupAccount'),
      liens: [
        { href: '/compte?tab=profil',         label: t('account.navMyProfile'),      emoji: '✏️', tab: 'profil' },
        { href: '/compte?tab=apporteur',      label: t('account.navBusinessPartner'), emoji: '💼', tab: 'apporteur' },
        { href: '/compte?tab=fonctionnalites', label: t('account.navFeaturesPlans'), emoji: '📖', tab: 'fonctionnalites' },
      ],
    },
  ]

  return (
    <nav className="account-nav-container" aria-label={t('account.navTitle')}>
      {groupes.map(groupe => (
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
