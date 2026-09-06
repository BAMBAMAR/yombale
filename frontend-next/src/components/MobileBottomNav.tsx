'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, ShoppingCart, Heart, User, Store } from 'lucide-react'
import { useCart } from '@/context/CartContext'

interface Props {
  isLoggedIn?: boolean
  isMerchant?: boolean
}

export default function MobileBottomNav({ isLoggedIn = false, isMerchant = false }: Props) {
  const pathname = usePathname() || ''
  const { totalItemCount, openCart } = useCart()

  const isHome = pathname === '/'
  const isExplorer = pathname === '/boutiques' || pathname.startsWith('/boutiques/') || pathname.startsWith('/categorie')
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

      {/* 2. Explorer / Boutiques */}
      <Link
        href="/boutiques"
        className={`mobile-bottom-nav-item${isExplorer ? ' active' : ''}`}
        aria-label="Boutiques et Catalogues"
        aria-current={isExplorer ? 'page' : undefined}
      >
        <div className="mobile-bottom-nav-icon-wrap">
          <Compass size={20} strokeWidth={isExplorer ? 2.5 : 2} />
        </div>
        <span>Explorer</span>
      </Link>

      {/* 3. Panier Interactif */}
      <button
        type="button"
        onClick={() => openCart()}
        className="mobile-bottom-nav-item"
        aria-label={`Panier (${totalItemCount} article${totalItemCount > 1 ? 's' : ''})`}
      >
        <div className="mobile-bottom-nav-icon-wrap">
          <ShoppingCart size={20} strokeWidth={2} />
          {totalItemCount > 0 && (
            <span className="mobile-bottom-nav-badge">
              {totalItemCount > 99 ? '99+' : totalItemCount}
            </span>
          )}
        </div>
        <span>Panier</span>
      </button>

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
