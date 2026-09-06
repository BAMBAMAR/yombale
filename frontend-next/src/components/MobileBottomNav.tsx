'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, User, Store, Plus } from 'lucide-react'

interface Props {
  isLoggedIn?: boolean
  isMerchant?: boolean
}

export default function MobileBottomNav({ isLoggedIn = false, isMerchant = false }: Props) {
  const pathname = usePathname() || ''

  const isHome = pathname === '/'
  const isExplorer = pathname === '/boutiques' || pathname.startsWith('/boutiques/') || pathname.startsWith('/categorie')
  const isCreerBoutique = pathname === '/creer-boutique' || pathname.startsWith('/creer-boutique')
  const isFavorites = pathname === '/favoris'
  const isAccount = pathname.startsWith('/compte') || pathname === '/connexion' || pathname === '/inscription' || pathname === '/boutique' || pathname.startsWith('/boutique/')

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

      {/* 3. Créer Boutique (Bouton central parfaitement aligné) */}
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

      {/* 4. Favoris */}
      <Link
        href="/favoris"
        className={`mobile-bottom-nav-item${isFavorites ? ' active' : ''}`}
        aria-label="Mes favoris"
        aria-current={isFavorites ? 'page' : undefined}
      >
        <div className="mobile-bottom-nav-icon-wrap">
          <Heart size={20} strokeWidth={isFavorites ? 2.5 : 2} fill={isFavorites ? 'currentColor' : 'none'} />
        </div>
        <span>Favoris</span>
      </Link>

      {/* 5. Mon Compte / Espace Vendeur */}
      <Link
        href={isLoggedIn ? (isMerchant ? '/boutique' : '/compte') : '/connexion'}
        className={`mobile-bottom-nav-item${isAccount ? ' active' : ''}`}
        aria-label={isLoggedIn ? (isMerchant ? 'Ma Boutique' : 'Mon Compte') : 'Se connecter'}
        aria-current={isAccount ? 'page' : undefined}
      >
        <div className="mobile-bottom-nav-icon-wrap">
          {isMerchant ? (
            <Store size={20} strokeWidth={isAccount ? 2.5 : 2} />
          ) : (
            <User size={20} strokeWidth={isAccount ? 2.5 : 2} />
          )}
        </div>
        <span>{isLoggedIn ? (isMerchant ? 'Boutique' : 'Compte') : 'Connexion'}</span>
      </Link>
    </nav>
  )
}
