'use client'
import { useState, useEffect } from 'react'
import { logout } from '@/app/actions/auth'

interface Props {
  isLoggedIn: boolean
  nom?: string
}

const GUIDES = [
  { href: '/tarifs-boutique', emoji: '🛍️', label: 'Tarifs & Forfaits Vendeurs', highlight: true, badge: 'OFFRE', badgeColor: '#C75B00' },
  { href: '/guide-creer-boutique', emoji: '📦', label: 'Guide Vendeur & Sourcing' },
  { href: '/demo', emoji: '🚀', label: 'Démo Commerciale', highlight: true, badge: 'NOUVEAU', badgeColor: 'var(--accent)' },
  { href: '/guide-achat',   emoji: '🏆', label: 'Guide d\'achat intelligent' },
  { href: '/guide-forfait', emoji: '📡', label: 'Guide forfait télécom' },
  { href: '/guide-immo',   emoji: '🏡', label: 'Guide immobilier' },
  { href: '/guide-prix',   emoji: '💡', label: 'Guide des prix' },
  { href: '/guide-emploi', emoji: '📖', label: 'Comment utiliser Nopalou' },
  { href: '/assistant-whatsapp', emoji: '💬', label: 'Assistant WhatsApp' },
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
          <a href="/suivi-commande" className="mobile-nav-link" onClick={close}>📦 Suivre ma commande</a>
          <a href="/immo" className="mobile-nav-link" onClick={close}>🏠 Immobilier</a>
          <a href="/telecom" className="mobile-nav-link" onClick={close}>📱 Télécom</a>
          <a href="/annonces" className="mobile-nav-link" onClick={close}>📋 Annonces</a>
          <a href="/boutiques" className="mobile-nav-link" onClick={close}>🏪 Boutiques</a>

          <div className="mobile-nav-section">Guides</div>
          {GUIDES.map(g => (
            <a 
              key={g.href} 
              href={g.href} 
              className="mobile-nav-link mobile-nav-link--sub" 
              onClick={close}
              style={g.highlight ? { background: '#fff7ed', fontWeight: 700, color: 'var(--accent)' } : undefined}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: 8 }}>{g.emoji}</span> 
                {g.label}
                {g.badge && (
                  <span style={{ background: g.badgeColor, color: '#FFF', fontSize: 9, padding: '2px 6px', borderRadius: 10, marginLeft: 8, fontWeight: 800 }}>
                    {g.badge}
                  </span>
                )}
              </span>
            </a>
          ))}

          <div className="mobile-nav-sep" />

          <a href="/deposer-annonce" className="mobile-nav-link mobile-nav-link--cta" onClick={close}>
            + Publier une annonce
          </a>

          {isLoggedIn ? (
            <>
              <a href="/boutique" className="mobile-nav-link" style={{ fontWeight: 800, color: 'var(--accent)' }} onClick={close}>🏪 Ma boutique (Gestion)</a>
              <a href="/compte" className="mobile-nav-link" onClick={close}>👤 {nom ?? 'Mon compte'}</a>
              <a href="/compte?tab=suivi-commande" className="mobile-nav-link" onClick={close}>📦 Suivre ma commande</a>
              <a href="/compte?tab=mes-annonces" className="mobile-nav-link" onClick={close}>📋 Mes annonces</a>
              <a href="/compte?tab=mes-annonces-immo" className="mobile-nav-link" onClick={close}>🏠 Mes biens immo</a>
              <a href="/compte?tab=mes-alertes" className="mobile-nav-link" onClick={close}>🔔 Mes alertes prix</a>
              <a href="/favoris" className="mobile-nav-link" onClick={close}>❤ Mes favoris</a>
              <a href="/deposer-immo" className="mobile-nav-link" onClick={close}>🏡 Publier un bien immo</a>
              <a href="/compte/apporteur" className="mobile-nav-link" onClick={close}>💼 Apporteur d&apos;affaires</a>
              <a href="/compte/fonctionnalites" className="mobile-nav-link" onClick={close}>📖 Forfaits &amp; Fonctionnalités</a>
              <form action={logout} style={{ margin: 0 }}>
                <button type="submit" className="mobile-nav-link mobile-nav-link--logout">
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mobile-nav-sep" />
              <a href="/creer-boutique" className="mobile-nav-link" style={{ fontWeight: 800, color: '#fff', background: '#0f172a', padding: '12px 20px', borderRadius: '12px', margin: '0 20px 16px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={close}>
                🏪 Ouvrir une Boutique Pro
              </a>
              <a href="/connexion" className="mobile-nav-link" onClick={close}>Connexion</a>
              <a href="/inscription" className="mobile-nav-link mobile-nav-link--signup" onClick={close}>S&apos;inscrire</a>
            </>
          )}
        </nav>
      </div>
    </>
  )
}
