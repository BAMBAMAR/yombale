'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Home, Heart, User, Store, Plus, Zap, Building2 } from 'lucide-react'
import CreateQuickActionsSheet from './CreateQuickActionsSheet'

interface Props {
  isLoggedIn?: boolean
  isMerchant?: boolean
}

function MobileBottomNavContent({ isLoggedIn = false, isMerchant = false }: Props) {
  const pathname = usePathname() || ''
  const searchParams = useSearchParams()
  const router = useRouter()

  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [effectiveIsMerchant, setEffectiveIsMerchant] = useState<boolean>(
    isMerchant || pathname.startsWith('/boutique')
  )
  const [effectiveIsLoggedIn, setEffectiveIsLoggedIn] = useState<boolean>(
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

  const isVitrine = pathname.includes('/vitrine')

  if (
    (pathname.startsWith('/agence') && !isVitrine) ||
    pathname.startsWith('/boutique') ||
    pathname.startsWith('/compte') ||
    pathname.startsWith('/admin')
  ) {
    return null
  }

  const currentTab = pathname === '/compte' ? searchParams.get('tab') : null
  const isHome = pathname === '/'
  const isImmoContext = pathname.startsWith('/immo') || pathname.startsWith('/agences') || pathname.startsWith('/payer-loyer') || isVitrine
  const isExplorer = pathname === '/boutiques' || pathname.startsWith('/boutiques/') || pathname.startsWith('/categorie')
  const isCreerBoutique = pathname === '/creer-boutique' || pathname.startsWith('/creer-boutique')
  const isFavorites = pathname === '/favoris' || (pathname === '/compte' && currentTab === 'favoris')
  const isBoutique = pathname.startsWith('/boutique')
  const isAccount = (pathname.startsWith('/compte') && currentTab !== 'favoris') || pathname === '/connexion' || pathname === '/inscription' || isBoutique

  const favHref = (effectiveIsLoggedIn || pathname.startsWith('/compte')) ? '/compte?tab=favoris' : '/favoris'


  return (
    <>
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

      {/* 2. Boutiques & Vendeurs OU Immo si contexte */}
      {isImmoContext ? (
        <Link
          href="/immo"
          className="mobile-bottom-nav-item active"
          aria-label="Immobilier et locations"
          aria-current="page"
        >
          <div className="mobile-bottom-nav-icon-wrap">
            <Building2 size={20} strokeWidth={2.5} />
          </div>
          <span>Immo</span>
        </Link>
      ) : (
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
      )}


      {/* 3. Bouton central FAB enrichi : Action Sheet Créer & Actions Rapides */}
      <button
        type="button"
        onClick={() => setIsCreateSheetOpen(true)}
        className={`mobile-bottom-nav-item mobile-bottom-nav-item--cta${isCreateSheetOpen ? ' active' : ''}`}
        aria-label="Actions rapides et création"
        title="Créer une annonce, boutique, bien immobilier ou ouvrir la caisse"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <div className="mobile-bottom-nav-icon-wrap">
          <div
            className="mobile-bottom-nav-cta-btn"
            style={{
              background: 'var(--accent, #C75B00)',
              boxShadow: '0 2px 8px rgba(199,91,0,0.4)',
            }}
          >
            <Plus size={16} strokeWidth={3} />
          </div>
        </div>
        <span
          style={{
            fontWeight: 800,
            color: isCreateSheetOpen ? 'var(--accent, #C75B00)' : 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          Créer
        </span>
      </button>

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

    {/* Action Sheet Mobile Globale "Créer sur Nopalou" */}
    <CreateQuickActionsSheet
      isOpen={isCreateSheetOpen}
      onClose={() => setIsCreateSheetOpen(false)}
      isMerchant={effectiveIsMerchant}
    />
    </>
  )
}

function MobileBottomNavFallback({ isLoggedIn = false, isMerchant = false }: Props) {
  const pathname = usePathname() || ''
  const isVitrine = pathname.includes('/vitrine')

  if (
    (pathname.startsWith('/agence') && !isVitrine) ||
    pathname.startsWith('/boutique') ||
    pathname.startsWith('/compte') ||
    pathname.startsWith('/admin')
  ) {
    return null
  }

  const isHome = pathname === '/'
  const isImmoContext = pathname.startsWith('/immo') || pathname.startsWith('/agences') || pathname.startsWith('/payer-loyer') || isVitrine
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
      {isImmoContext ? (
        <Link href="/immo" className="mobile-bottom-nav-item active" aria-label="Immo">
          <div className="mobile-bottom-nav-icon-wrap"><Building2 size={20} /></div>
          <span>Immo</span>
        </Link>
      ) : (
        <Link href="/boutiques" className={`mobile-bottom-nav-item${isExplorer ? ' active' : ''}`} aria-label="Boutiques">
          <div className="mobile-bottom-nav-icon-wrap"><Store size={20} /></div>
          <span>Boutiques</span>
        </Link>
      )}

      <Link href="/deposer-annonce" className="mobile-bottom-nav-item mobile-bottom-nav-item--cta" aria-label="Créer">
        <div className="mobile-bottom-nav-icon-wrap"><div className="mobile-bottom-nav-cta-btn"><Plus size={16} strokeWidth={3} /></div></div>
        <span style={{ fontWeight: 800 }}>Créer</span>
      </Link>
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
