'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Home, Heart, User, Store, Plus, Zap } from 'lucide-react'

interface Props {
  isLoggedIn?: boolean
  isMerchant?: boolean
}

function MobileBottomNavContent({ isLoggedIn = false, isMerchant = false }: Props) {
  const pathname = usePathname() || ''
  const searchParams = useSearchParams()
  const router = useRouter()

  const [effectiveIsMerchant, setEffectiveIsMerchant] = React.useState<boolean>(
    isMerchant || pathname.startsWith('/boutique')
  )
  const [effectiveIsLoggedIn, setEffectiveIsLoggedIn] = React.useState<boolean>(
    isLoggedIn || pathname.startsWith('/boutique') || pathname.startsWith('/compte')
  )

  React.useEffect(() => {
    if (pathname.startsWith('/boutique')) {
      setEffectiveIsMerchant(true)
      setEffectiveIsLoggedIn(true)
    } else if (pathname.startsWith('/compte')) {
      setEffectiveIsLoggedIn(true)
    }
    try {
      const storedMerchant = localStorage.getItem('nopalou_is_merchant')
      const storedBoutique = localStorage.getItem('nopalou_boutique_active') || localStorage.getItem('nopalou_user_boutiques')
      if (storedMerchant === 'true' || (storedBoutique && storedBoutique !== '[]' && storedBoutique !== 'null')) {
        setEffectiveIsMerchant(true)
        setEffectiveIsLoggedIn(true)
      }
    } catch (err) { console.warn('[Nopalou:MobileBottomNav:L39]', err); }
  }, [pathname])

  if (
    pathname.startsWith('/agence') ||
    pathname.startsWith('/boutique') ||
    pathname.startsWith('/compte') ||
    pathname.startsWith('/admin')
  ) {
    return null
  }

  const currentTab = pathname === '/compte' ? searchParams.get('tab') : null
  const isHome = pathname === '/'
  const isExplorer = pathname === '/boutiques' || pathname.startsWith('/boutiques/') || pathname.startsWith('/categorie')
  const isCreerBoutique = pathname === '/creer-boutique' || pathname.startsWith('/creer-boutique')
  const isFavorites = pathname === '/favoris' || (pathname === '/compte' && currentTab === 'favoris')
  const isBoutique = pathname.startsWith('/boutique')
  const isAccount = (pathname.startsWith('/compte') && currentTab !== 'favoris') || pathname === '/connexion' || pathname === '/inscription' || isBoutique

  const favHref = (effectiveIsLoggedIn || pathname.startsWith('/compte')) ? '/compte?tab=favoris' : '/favoris'

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation principale mobile">
      {/* 1. Accueil */}
      <Link
        href="/"
        className={`mobile-bottom-nav-item${isHome ? ' active' : ''}`}
        aria-label="Accueil"
        aria-current={isHome ? 'page' : undefined}
      >
        <div className="mobile-bottom-nav-icon-wrap">
          <Home size={20} strokeWidth={isHome ? 2.5 : 2} />
        </div>
        <span>Accueil</span>
      </Link>

      {/* 2. Boutiques & Vendeurs */}
      <Link
        href="/boutiques"
        className={`mobile-bottom-nav-item${isExplorer ? ' active' : ''}`}
        aria-label="Boutiques et Catalogues Partenaires"
        aria-current={isExplorer ? 'page' : undefined}
      >
        <div className="mobile-bottom-nav-icon-wrap">
          <Store size={20} strokeWidth={isExplorer ? 2.5 : 2} />
        </div>
        <span>Boutiques</span>
      </Link>

      {/* 3. Bouton central adaptatif : Caisse POS si commerçant, Créer si visiteur */}
      {effectiveIsMerchant ? (
        <Link
          href="/boutique/caisse"
          className={`mobile-bottom-nav-item mobile-bottom-nav-item--cta${pathname.startsWith('/boutique/caisse') ? ' active' : ''}`}
          aria-label="Caisse POS rapide"
          title="Caisse POS"
          aria-current={pathname.startsWith('/boutique/caisse') ? 'page' : undefined}
        >
          <div className="mobile-bottom-nav-icon-wrap">
            <div className="mobile-bottom-nav-cta-btn" style={{ background: 'var(--accent, #C75B00)', boxShadow: '0 2px 8px rgba(199,91,0,0.4)' }}>
              <Zap size={15} strokeWidth={2.8} fill="#ffffff" color="#ffffff" />
            </div>
          </div>
          <span style={{ fontWeight: 800, color: 'var(--accent, #C75B00)', whiteSpace: 'nowrap' }}>
            Caisse
          </span>
        </Link>
      ) : (
        <Link
          href="/creer-boutique"
          className={`mobile-bottom-nav-item mobile-bottom-nav-item--cta${isCreerBoutique ? ' active' : ''}`}
          aria-label="Créer une boutique"
          title="Créer une boutique"
          aria-current={isCreerBoutique ? 'page' : undefined}
        >
          <div className="mobile-bottom-nav-icon-wrap">
            <div className="mobile-bottom-nav-cta-btn">
              <Plus size={14} strokeWidth={3} />
            </div>
          </div>
          <span style={{ fontWeight: 700, color: isCreerBoutique ? 'var(--accent, #C75B00)' : 'inherit', whiteSpace: 'nowrap' }}>
            Créer
          </span>
        </Link>
      )}

      {/* 4. Favoris */}
      <Link
        href={favHref}
        className={`mobile-bottom-nav-item${isFavorites ? ' active' : ''}`}
        aria-label="Mes favoris"
        aria-current={isFavorites ? 'page' : undefined}
        onClick={(e) => {
          if (pathname === '/compte') {
            e.preventDefault()
            router.push('/compte?tab=favoris')
          }
        }}
      >
        <div className="mobile-bottom-nav-icon-wrap">
          <Heart size={20} strokeWidth={isFavorites ? 2.5 : 2} fill={isFavorites ? 'currentColor' : 'none'} />
        </div>
        <span>Favoris</span>
      </Link>

      {/* 5. Mon Compte */}
      <Link
        href={effectiveIsLoggedIn ? '/compte' : '/connexion'}
        className={`mobile-bottom-nav-item${isAccount ? ' active' : ''}`}
        aria-label={effectiveIsLoggedIn ? 'Mon Compte' : 'Se connecter'}
        aria-current={isAccount ? 'page' : undefined}
        onClick={(e) => {
          if (pathname === '/compte' && currentTab) {
            e.preventDefault()
            router.push('/compte')
          }
        }}
      >
        <div className="mobile-bottom-nav-icon-wrap">
          <User size={20} strokeWidth={isAccount ? 2.5 : 2} />
        </div>
        <span>{effectiveIsLoggedIn ? 'Compte' : 'Connexion'}</span>
      </Link>
    </nav>
  )
}

function MobileBottomNavFallback({ isLoggedIn = false, isMerchant = false }: Props) {
  const pathname = usePathname() || ''
  const isHome = pathname === '/'
  const isExplorer = pathname === '/boutiques' || pathname.startsWith('/boutiques/') || pathname.startsWith('/categorie')
  const isCreerBoutique = pathname === '/creer-boutique' || pathname.startsWith('/creer-boutique')
  const isFavorites = pathname === '/favoris'
  const isBoutique = pathname.startsWith('/boutique')
  const isAccount = pathname.startsWith('/compte') || pathname === '/connexion' || pathname === '/inscription' || isBoutique
  const effectiveIsLoggedIn = isLoggedIn || pathname.startsWith('/boutique') || pathname.startsWith('/compte')
  const favHref = effectiveIsLoggedIn ? '/compte?tab=favoris' : '/favoris'

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation principale mobile">
      <Link href="/" className={`mobile-bottom-nav-item${isHome ? ' active' : ''}`} aria-label="Accueil">
        <div className="mobile-bottom-nav-icon-wrap"><Home size={20} /></div>
        <span>Accueil</span>
      </Link>
      <Link href="/boutiques" className={`mobile-bottom-nav-item${isExplorer ? ' active' : ''}`} aria-label="Boutiques">
        <div className="mobile-bottom-nav-icon-wrap"><Store size={20} /></div>
        <span>Boutiques</span>
      </Link>
      {isMerchant ? (
        <Link href="/boutique/caisse" className="mobile-bottom-nav-item mobile-bottom-nav-item--cta" aria-label="Caisse POS">
          <div className="mobile-bottom-nav-icon-wrap"><div className="mobile-bottom-nav-cta-btn" style={{ background: 'var(--accent, #C75B00)' }}><Zap size={15} strokeWidth={2.8} fill="#ffffff" color="#ffffff" /></div></div>
          <span style={{ fontWeight: 800, color: 'var(--accent, #C75B00)' }}>Caisse</span>
        </Link>
      ) : (
        <Link href="/creer-boutique" className={`mobile-bottom-nav-item mobile-bottom-nav-item--cta${isCreerBoutique ? ' active' : ''}`} aria-label="Créer">
          <div className="mobile-bottom-nav-icon-wrap"><div className="mobile-bottom-nav-cta-btn"><Plus size={14} strokeWidth={3} /></div></div>
          <span>Créer</span>
        </Link>
      )}
      <Link href={favHref} className={`mobile-bottom-nav-item${isFavorites ? ' active' : ''}`} aria-label="Mes favoris">
        <div className="mobile-bottom-nav-icon-wrap"><Heart size={20} /></div>
        <span>Favoris</span>
      </Link>
      <Link href={effectiveIsLoggedIn ? '/compte' : '/connexion'} className={`mobile-bottom-nav-item${isAccount ? ' active' : ''}`} aria-label="Mon Compte">
        <div className="mobile-bottom-nav-icon-wrap"><User size={20} /></div>
        <span>{effectiveIsLoggedIn ? 'Compte' : 'Connexion'}</span>
      </Link>
    </nav>
  )
}

export default function MobileBottomNav(props: Props) {
  return (
    <Suspense fallback={<MobileBottomNavFallback {...props} />}>
      <MobileBottomNavContent {...props} />
    </Suspense>
  )
}
