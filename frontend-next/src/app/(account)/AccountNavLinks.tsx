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
      icon: '📦',
      liens: [
        { href: '/compte?tab=suivi-commande',    label: t('account.navTrackOrder'),     emoji: '📦', tab: 'suivi-commande' },
        { href: '/compte?tab=mes-annonces',      label: t('account.navMyAds'),          emoji: '📋', tab: 'mes-annonces' },
        { href: '/compte?tab=mes-annonces-immo', label: t('account.navMyRealEstate'),   emoji: '🏠', tab: 'mes-annonces-immo' },
        { href: '/compte?tab=mes-alertes',       label: t('account.navPriceAlerts'),    emoji: '🔔', tab: 'mes-alertes' },
        { href: '/compte?tab=favoris',           label: t('account.navFavorites'),      emoji: '♥',  tab: 'favoris' },
        { href: '/deposer-annonce',              label: t('account.navPublishAd'),      emoji: '➕', isCta: true },
        { href: '/deposer-immo',                 label: t('account.navPublishRealEstate'), emoji: '🏡', isCta: true },
      ],
    },
    {
      label: t('account.groupShop'),
      icon: '🏪',
      isShopGroup: true,
      liens: [
        { href: '/boutique', label: t('account.navMyShop'), emoji: '🏪', isShop: true },
      ],
    },
    {
      label: t('account.groupAccount'),
      icon: '⚙️',
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
        <div key={groupe.label} className={`account-nav-group${groupe.isShopGroup ? ' account-nav-group--shop' : ''}`}>
          <div className="account-nav-group-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>{groupe.icon}</span>
            <span>{groupe.label}</span>
          </div>
          <div className="account-nav-links-list">
            {groupe.liens.map(lien => {
              const actif = overrideTab && lien.tab === overrideTab 
                ? true 
                : (!overrideTab && (pathname === lien.href || pathname.startsWith(lien.href + '/')))

              if (lien.isShop) {
                return (
                  <Link
                    key={lien.href}
                    href={lien.href}
                    className="account-nav-link-shop"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #FFF9F5 0%, #FFF3E8 100%)',
                      border: '1.5px solid #FED7AA',
                      color: 'var(--navy, #1C2B4A)',
                      textDecoration: 'none',
                      fontWeight: 800,
                      fontSize: 13.5,
                      boxShadow: '0 2px 6px rgba(199, 91, 0, 0.08)',
                      transition: 'all 0.15s ease',
                      marginTop: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🏪</span>
                      <span>{lien.label}</span>
                    </div>
                    <span style={{
                      fontSize: 10,
                      background: 'var(--accent, #C75B00)',
                      color: '#ffffff',
                      padding: '2px 7px',
                      borderRadius: 10,
                      fontWeight: 800,
                    }}>
                      GÉRER ↗
                    </span>
                  </Link>
                )
              }

              return (
                <Link
                  key={lien.href}
                  href={lien.href}
                  className={`account-nav-link${actif ? ' account-nav-link--active' : ''}${lien.isCta ? ' account-nav-link--cta' : ''}`}
                  aria-current={actif ? 'page' : undefined}
                >
                  <span aria-hidden="true" style={{ fontSize: 14 }}>{lien.emoji}</span>
                  <span style={{ flex: 1 }}>{lien.label}</span>
                  {lien.isCta && (
                    <span style={{ fontSize: 10, fontWeight: 750, color: 'var(--accent)', background: '#FFF3E8', padding: '1px 6px', borderRadius: 6 }}>
                      Nouveau
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
