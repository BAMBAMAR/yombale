'use client'
import { useState, useEffect } from 'react'
import { logout } from '@/app/actions/auth'
import {
  Store, ShoppingCart, ShoppingBag, Home, Radio, FileText, Package,
  Bell, Heart, Users, BookOpen, Sparkles, Plus, LogOut, ChevronDown,
  MessageCircle, Tag, Trophy, TrendingDown, HelpCircle, LucideIcon
} from 'lucide-react'

interface Props {
  isLoggedIn: boolean
  nom?: string
}

interface GuideItem {
  href: string
  icon: LucideIcon
  label: string
  highlight?: boolean
  badge?: string
  badgeColor?: string
}

const GUIDES: GuideItem[] = [
  { href: '/tarifs-boutique', icon: Tag, label: 'Tarifs & Forfaits Vendeurs', highlight: true, badge: 'OFFRE', badgeColor: '#C75B00' },
  { href: '/guide-creer-boutique', icon: Package, label: 'Guide Vendeur & Sourcing' },
  { href: '/demo', icon: Sparkles, label: 'Démo Commerciale', highlight: true, badge: 'NOUVEAU', badgeColor: 'var(--accent)' },
  { href: '/guide-achat',   icon: Trophy, label: 'Guide d\'achat intelligent' },
  { href: '/guide-forfait', icon: Radio, label: 'Guide forfait télécom' },
  { href: '/guide-immo',   icon: Home, label: 'Guide immobilier' },
  { href: '/guide-prix',   icon: TrendingDown, label: 'Guide des prix' },
  { href: '/guide-emploi', icon: BookOpen, label: 'Comment utiliser Nopalou' },
  { href: '/assistant-whatsapp', icon: MessageCircle, label: 'Assistant WhatsApp' },
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
                    <p style={{ margin: 0, fontSize: 11.5, color: 'var(--accent, #C75B00)', fontWeight: 700 }}>
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
                    <LogOut size={13} />
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
                  <Store size={14} />
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
                    border: '1.5px solid #0A5C36',
                    color: '#0A5C36',
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: 'none',
                  }}
                >
                  <ShoppingCart size={14} />
                  <span>POS Caisse</span>
                </a>
              </div>
            </div>
          ) : (
            /* ── VISITEUR NON CONNECTÉ : BOUTONS CONNEXION / INSCRIPTION ── */
            <div style={{ padding: '14px 16px', background: '#FAF8F5', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
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
                <Store size={15} />
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
          <a href="/" className="mobile-nav-link" onClick={close}>
            <ShoppingBag size={15} style={{ color: 'var(--accent)', marginRight: 8 }} />
            <span>Produits &amp; Catalogue</span>
          </a>
          <a href="/immo" className="mobile-nav-link" onClick={close}>
            <Home size={15} style={{ color: 'var(--navy)', marginRight: 8 }} />
            <span>Immobilier &amp; Terrains</span>
          </a>
          <a href="/telecom" className="mobile-nav-link" onClick={close}>
            <Radio size={15} style={{ color: '#2563EB', marginRight: 8 }} />
            <span>Forfaits Télécom</span>
          </a>
          <a href="/annonces" className="mobile-nav-link" onClick={close}>
            <FileText size={15} style={{ color: '#0A5C36', marginRight: 8 }} />
            <span>Petites Annonces</span>
          </a>
          <a href="/boutiques" className="mobile-nav-link" onClick={close}>
            <Store size={15} style={{ color: 'var(--accent)', marginRight: 8 }} />
            <span>Annuaire des Boutiques</span>
          </a>

          {/* ── 3. ESPACE UTILISATEUR (Si connecté, regroupé & sans doublon) ── */}
          {isLoggedIn && (
            <>
              <div className="mobile-nav-section">Mon Espace</div>
              <a href="/compte?tab=suivi-commande" className="mobile-nav-link" onClick={close}>
                <Package size={15} style={{ color: 'var(--navy)', marginRight: 8 }} />
                <span>Suivre ma commande</span>
              </a>
              <a href="/compte?tab=mes-annonces" className="mobile-nav-link" onClick={close}>
                <FileText size={15} style={{ color: '#0A5C36', marginRight: 8 }} />
                <span>Mes annonces &amp; Biens</span>
              </a>
              <a href="/compte?tab=mes-alertes" className="mobile-nav-link" onClick={close}>
                <Bell size={15} style={{ color: 'var(--accent)', marginRight: 8 }} />
                <span>Mes alertes prix</span>
              </a>
              <a href="/favoris" className="mobile-nav-link" onClick={close}>
                <Heart size={15} style={{ color: '#DC2626', marginRight: 8 }} />
                <span>Mes favoris</span>
              </a>
              <a href="/compte/apporteur" className="mobile-nav-link" onClick={close}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <Users size={15} style={{ color: 'var(--navy)', marginRight: 8 }} />
                    <span>Parrainage &amp; Apporteur</span>
                  </span>
                  <span style={{ fontSize: 10.5, background: '#FFEDD5', color: '#9A3412', padding: '2px 6px', borderRadius: 6, fontWeight: 800 }}>20%</span>
                </span>
              </a>
            </>
          )}

          {/* ── 4. SECTION GUIDES EN ACCORDÉON COMPACT ── */}
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
              <BookOpen size={15} style={{ color: 'var(--accent)' }} />
              <span>Guides &amp; Tutoriels ({GUIDES.length})</span>
            </span>
            <ChevronDown size={14} style={{ transform: guidesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text2)' }} />
          </button>

          {guidesOpen && (
            <div style={{ background: '#FAF8F5', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
              {GUIDES.map(g => {
                const GuideIcon = g.icon
                return (
                  <a
                    key={g.href}
                    href={g.href}
                    className="mobile-nav-link mobile-nav-link--sub"
                    onClick={close}
                    style={g.highlight ? { background: '#fff7ed', fontWeight: 700, color: 'var(--accent)' } : undefined}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <GuideIcon size={14} style={{ marginRight: 8, color: g.highlight ? 'var(--accent)' : 'var(--text2)' }} />
                      <span>{g.label}</span>
                      {g.badge && (
                        <span style={{ background: g.badgeColor, color: '#FFF', fontSize: 9.5, padding: '2px 6px', borderRadius: 10, marginLeft: 8, fontWeight: 800 }}>
                          {g.badge}
                        </span>
                      )}
                    </span>
                  </a>
                )
              })}
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
              <Plus size={16} strokeWidth={3} />
              <span>Publier une annonce</span>
            </a>
          </div>
        </nav>
      </div>
    </>
  )
}

