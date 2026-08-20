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
  const [guidesOpen, setGuidesOpen] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function close() { setOpen(false) }

  const displayName = nom?.trim() || 'Mon compte'
  const initiale = displayName.charAt(0).toUpperCase()

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
        {/* Header Drawer */}
        <div className="mobile-nav-header">
          <a href="/" className="mobile-nav-logo" onClick={close}>
            Nopa<span>lou</span>
          </a>
          <button className="mobile-nav-close" onClick={close} aria-label="Fermer">✕</button>
        </div>

        <nav style={{ paddingBottom: 24 }}>
          {/* ── 1. UTILISATEUR CONNECTÉ : CARTE EN HAUT AVEC DÉCONNEXION DIRECTE ── */}
          {isLoggedIn ? (
            <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <a
                  href="/compte"
                  onClick={close}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', minWidth: 0, flex: 1 }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, var(--accent, #C75B00) 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 900,
                      boxShadow: '0 2px 6px rgba(28,43,74,0.2)',
                      flexShrink: 0,
                    }}
                  >
                    {initiale}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 13.5, color: 'var(--navy, #1C2B4A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayName}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--accent, #C75B00)', fontWeight: 700 }}>
                      Gérer mon profil →
                    </p>
                  </div>
                </a>

                {/* Bouton Déconnexion Direct & Visible */}
                <form action={logout} style={{ margin: 0 }}>
                  <button
                    type="submit"
                    onClick={() => {
                      if (typeof document !== 'undefined') {
                        document.cookie = 'nopalou_locale=fr; path=/; max-age=31536000; SameSite=Lax'
                        document.documentElement.lang = 'fr'
                        document.documentElement.dir = 'ltr'
                      }
                    }}
                    title="Se déconnecter"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#DC2626',
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <span>🚪</span>
                    <span>Quitter</span>
                  </button>
                </form>
              </div>

              {/* Accès Rapide Espace Boutique */}
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <a
                  href="/boutique"
                  onClick={close}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'var(--accent, #C75B00)',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: 'none',
                    boxShadow: '0 2px 6px rgba(199,91,0,0.2)',
                  }}
                >
                  <span>🏪</span>
                  <span>Ma Boutique Pro</span>
                </a>
                <a
                  href="/boutique/caisse"
                  onClick={close}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: '#ffffff',
                    border: '1.5px solid #16a34a',
                    color: '#16a34a',
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: 'none',
                  }}
                >
                  <span>🛒</span>
                  <span>POS</span>
                </a>
              </div>
            </div>
          ) : (
            /* ── VISITEUR NON CONNECTÉ : BOUTONS CONNEXION / INSCRIPTION ── */
            <div style={{ padding: '14px 16px', background: '#F8FAFC', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
              <a
                href="/creer-boutique"
                onClick={close}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--navy, #1C2B4A)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: 'none',
                  marginBottom: 8,
                  boxShadow: '0 2px 6px rgba(28,43,74,0.15)',
                }}
              >
                <span>🏪</span>
                <span>Ouvrir une Boutique Pro</span>
              </a>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <a
                  href="/connexion"
                  onClick={close}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: 8,
                    background: '#ffffff',
                    border: '1.5px solid var(--border, #E8DDD2)',
                    color: 'var(--navy, #1C2B4A)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Connexion
                </a>
                <a
                  href="/inscription"
                  onClick={close}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: 8,
                    background: 'var(--accent, #C75B00)',
                    color: '#ffffff',
                    fontSize: 12.5,
                    fontWeight: 800,
                    textDecoration: 'none',
                  }}
                >
                  S&apos;inscrire
                </a>
              </div>
            </div>
          )}

          {/* ── 2. SERVICES PRINCIPAUX NOPALOU ── */}
          <div className="mobile-nav-section">Services</div>
          <a href="/" className="mobile-nav-link" onClick={close}>🛒 Produits &amp; Catalogue</a>
          <a href="/immo" className="mobile-nav-link" onClick={close}>🏠 Immobilier</a>
          <a href="/telecom" className="mobile-nav-link" onClick={close}>📱 Forfaits Télécom</a>
          <a href="/annonces" className="mobile-nav-link" onClick={close}>📋 Petites Annonces</a>
          <a href="/boutiques" className="mobile-nav-link" onClick={close}>🏪 Annuaire des Boutiques</a>

          {/* ── 3. ESPACE UTILISATEUR (Si connecté, regroupé & sans doublon) ── */}
          {isLoggedIn && (
            <>
              <div className="mobile-nav-section">Mon Espace</div>
              <a href="/compte?tab=suivi-commande" className="mobile-nav-link" onClick={close}>📦 Suivre ma commande</a>
              <a href="/compte?tab=mes-annonces" className="mobile-nav-link" onClick={close}>📋 Mes annonces &amp; Biens</a>
              <a href="/compte?tab=mes-alertes" className="mobile-nav-link" onClick={close}>🔔 Mes alertes prix</a>
              <a href="/favoris" className="mobile-nav-link" onClick={close}>❤ Mes favoris</a>
              <a href="/compte/apporteur" className="mobile-nav-link" onClick={close}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🤝 Parrainage &amp; Apporteur</span>
                  <span style={{ fontSize: 10, background: '#FFEDD5', color: '#9A3412', padding: '2px 6px', borderRadius: 6, fontWeight: 800 }}>20%</span>
                </span>
              </a>
            </>
          )}

          {/* ── 4. SECTION GUIDES EN ACCORDÉON COMPACT (1 seule ligne au lieu de 9) ── */}
          <div className="mobile-nav-section" style={{ marginTop: 6 }}>Aide &amp; Guides</div>
          <button
            type="button"
            onClick={() => setGuidesOpen(v => !v)}
            className="mobile-nav-link"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: guidesOpen ? '#FFF9F5' : 'transparent',
              fontWeight: 700,
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📖</span>
              <span>Guides &amp; Tutoriels ({GUIDES.length})</span>
            </span>
            <span style={{ fontSize: 12, transform: guidesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              ▼
            </span>
          </button>

          {guidesOpen && (
            <div style={{ background: '#FAF8F5', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
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
            </div>
          )}

          {/* ── 5. ACTION PRINCIPALE DE DÉPÔT ── */}
          <div style={{ padding: '16px 16px 8px' }}>
            <a
              href="/deposer-annonce"
              className="mobile-nav-link--cta"
              onClick={close}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, var(--accent, #C75B00) 0%, #a84c00 100%)',
                color: '#ffffff',
                fontSize: 13.5,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(199,91,0,0.25)',
              }}
            >
              <span>➕</span>
              <span>Publier une annonce</span>
            </a>
          </div>
        </nav>
      </div>
    </>
  )
}

