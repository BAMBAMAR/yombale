'use client'
import { useState, useEffect } from 'react'
import { logout } from '@/app/actions/auth'

interface Props {
  isLoggedIn: boolean
  nom?: string
}

const GUIDES = [
  { href: '/guide-achat',   emoji: '🏆', label: 'Guide d\'achat intelligent' },
  { href: '/guide-forfait', emoji: '📡', label: 'Guide forfait télécom' },
  { href: '/guide-immo',   emoji: '🏡', label: 'Guide immobilier' },
  { href: '/guide-prix',   emoji: '💡', label: 'Guide des prix' },
  { href: '/guide-emploi', emoji: '📖', label: 'Comment utiliser Nopalou' },
]

export default function MobileNav({ isLoggedIn, nom }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function close() { setOpen(false) }

  return (
    <>
      <button
        className="mobile-nav-btn"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={open}
      >
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <div className="mobile-nav-overlay" onClick={close} aria-hidden="true" />
      )}

      <div className={`mobile-nav-drawer${open ? ' mobile-nav-drawer--open' : ''}`} aria-hidden={!open}>
        <div className="mobile-nav-header">
          <a href="/" className="mobile-nav-logo" onClick={close}>
            Nopa<span>lou</span>
          </a>
          <button className="mobile-nav-close" onClick={close} aria-label="Fermer">✕</button>
        </div>

        <nav>
          <a href="/" className="mobile-nav-link" onClick={close}>🛒 Produits</a>
          <a href="/immo" className="mobile-nav-link" onClick={close}>🏠 Immobilier</a>
          <a href="/telecom" className="mobile-nav-link" onClick={close}>📱 Télécom</a>
          <a href="/annonces" className="mobile-nav-link" onClick={close}>📋 Annonces</a>
          <a href="/boutiques" className="mobile-nav-link" onClick={close}>🏪 Boutiques</a>

          <div className="mobile-nav-section">Guides</div>
          {GUIDES.map(g => (
            <a key={g.href} href={g.href} className="mobile-nav-link mobile-nav-link--sub" onClick={close}>
              {g.emoji} {g.label}
            </a>
          ))}

          <div className="mobile-nav-sep" />

          <a href="/deposer-annonce" className="mobile-nav-link mobile-nav-link--cta" onClick={close}>
            + Publier une annonce
          </a>

          {isLoggedIn ? (
            <>
              <a href="/compte" className="mobile-nav-link" onClick={close}>👤 {nom ?? 'Mon compte'}</a>
              <a href="/mes-annonces" className="mobile-nav-link" onClick={close}>📋 Mes annonces</a>
              <a href="/mes-annonces-immo" className="mobile-nav-link" onClick={close}>🏠 Mes biens immo</a>
              <a href="/favoris" className="mobile-nav-link" onClick={close}>❤ Mes favoris</a>
              <form action={logout} style={{ margin: 0 }}>
                <button type="submit" className="mobile-nav-link mobile-nav-link--logout">
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <a href="/connexion" className="mobile-nav-link" onClick={close}>Connexion</a>
              <a href="/inscription" className="mobile-nav-link mobile-nav-link--signup" onClick={close}>S&apos;inscrire</a>
            </>
          )}
        </nav>
      </div>
    </>
  )
}
