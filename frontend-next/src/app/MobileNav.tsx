'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { logout } from '@/app/actions/auth'
import {
  Store, ShoppingCart, ShoppingBag, Home, Radio, FileText, Package,
  Bell, Heart, Users, BookOpen, Sparkles, Plus, LogOut, ChevronDown,
  MessageCircle, Tag, Trophy, TrendingDown, HelpCircle, LucideIcon, Zap,
  Menu, X, Building2, CreditCard, Mail, Phone
} from 'lucide-react'
import { GUIDES } from './components/mobileNavData'
import MobileNavUserCard from './components/MobileNavUserCard'


interface Props {
  isLoggedIn: boolean
  nom?: string
}



export default function MobileNav({ isLoggedIn, nom }: Props) {
  const [open, setOpen] = useState(false)
  const [guidesOpen, setGuidesOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function close() {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setOpen(false)
  }

  // Fermeture automatique au clic en dehors ou appui sur Échap
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }

    function handlePointerDown(e: PointerEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        // Si le clic n'est pas sur le bouton toggle lui-même
        const target = e.target as HTMLElement | null
        if (!target?.closest('.mobile-nav-btn')) {
          close()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [open])

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
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div
          className="mobile-nav-overlay"
          onClick={close}
          onPointerDown={close}
          aria-hidden="true"
        />
      )}

      <div
        ref={drawerRef}
        className={`mobile-nav-drawer${open ? ' mobile-nav-drawer--open' : ''}`}
        aria-hidden={!open}
      >
        {/* Header Drawer */}
        <div className="mobile-nav-header">
          <a href="/" className="mobile-nav-logo" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/icons/logo-mark.svg" alt="" width={26} height={26} style={{ flexShrink: 0 }} priority />
            <span>Nopa<span style={{ color: 'var(--accent, #C75B00)' }}>lou</span></span>
          </a>
          <button className="mobile-nav-close" onClick={close} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <nav style={{ paddingBottom: 24 }}>
          {/* ── 1. UTILISATEUR CONNECTÉ : CARTE EN HAUT MODULARISÉE ── */}
          {isLoggedIn ? (
            <MobileNavUserCard displayName={displayName} initiale={initiale} onClose={close} />
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
                <span style={{ background: '#16A34A', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 900 }}>1m Offert</span>
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

          {/* ── 2. SERVICES PRINCIPAUX NOPALOU (Ordre strict aligné sur le menu Web) ── */}
          <div className="mobile-nav-section">Acheter &amp; Explorer</div>
          <a href="/" className="mobile-nav-link" onClick={close}>
            <ShoppingBag size={15} style={{ color: 'var(--accent)', marginRight: 8 }} />
            <span>Produits &amp; Comparatifs</span>
          </a>
          <a href="/boutiques" className="mobile-nav-link" onClick={close}>
            <Store size={15} style={{ color: 'var(--accent)', marginRight: 8 }} />
            <span>Boutiques Vérifiées</span>
            <span style={{ marginLeft: 'auto', background: 'var(--navy, #1C2B4A)', color: '#fff', fontSize: 9.5, padding: '1px 5px', borderRadius: 6, fontWeight: 800 }}>PRO</span>
          </a>
          <a href="/immo" className="mobile-nav-link" onClick={close}>
            <Home size={15} style={{ color: 'var(--navy)', marginRight: 8 }} />
            <span>Immobilier &amp; Terrains</span>
          </a>
          <a href="/agences" className="mobile-nav-link" onClick={close}>
            <Building2 size={15} style={{ color: 'var(--navy)', marginRight: 8 }} />
            <span>Agences Immobilières</span>
            <span style={{ marginLeft: 'auto', background: 'var(--navy, #1C2B4A)', color: '#fff', fontSize: 9.5, padding: '1px 5px', borderRadius: 6, fontWeight: 800 }}>PRO</span>
          </a>
          <a href="/telecom" className="mobile-nav-link" onClick={close}>
            <Radio size={15} style={{ color: '#2563EB', marginRight: 8 }} />
            <span>Forfaits Télécom</span>
          </a>
          <a href="/annonces" className="mobile-nav-link" onClick={close}>
            <FileText size={15} style={{ color: '#0A5C36', marginRight: 8 }} />
            <span>Petites Annonces</span>
          </a>
          <a href="/assistant-whatsapp" className="mobile-nav-link" onClick={close} style={{ background: '#f0fdf4' }}>
            <MessageCircle size={15} style={{ color: '#16a34a', marginRight: 8 }} />
            <span style={{ fontWeight: 750, color: '#166534' }}>Assistant WhatsApp &amp; Chatbot</span>
            <span style={{ marginLeft: 'auto', background: '#16a34a', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 900 }}>24/7</span>
          </a>

          {/* ── 2.5 SOLUTIONS MARCHANDS & FORFAITS ── */}
          <div className="mobile-nav-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Solutions Commerçants &amp; POS</span>
            <span style={{ fontSize: 10, background: '#16A34A', color: '#fff', padding: '1px 6px', borderRadius: 8, fontWeight: 800 }}>1m Offert</span>
          </div>
          <a href="/tarifs-boutique" className="mobile-nav-link" onClick={close}>
            <Zap size={15} style={{ color: 'var(--accent)', marginRight: 8 }} />
            <span>Forfaits &amp; Abonnements Vendeurs</span>
          </a>
          <a href="/pos" className="mobile-nav-link" onClick={close}>
            <ShoppingCart size={15} style={{ color: '#16A34A', marginRight: 8 }} />
            <span>Caisse Enregistreuse POS (Offline)</span>
          </a>
          <a href="/whatsapp" className="mobile-nav-link" onClick={close}>
            <MessageCircle size={15} style={{ color: '#25D366', marginRight: 8 }} />
            <span>Vendre sur WhatsApp (0% commission)</span>
          </a>
          <a href="/demo?role=marchand" className="mobile-nav-link" onClick={close}>
            <Sparkles size={15} style={{ color: 'var(--accent)', marginRight: 8 }} />
            <span>Tester la Démo Interactive</span>
          </a>

          {/* ── 2.6 SOLUTIONS AGENCES & GESTION LOCATIVE ── */}
          <div className="mobile-nav-section">Gestion Locative &amp; Baux</div>
          <a href="/agence" className="mobile-nav-link" onClick={close}>
            <Building2 size={15} style={{ color: 'var(--accent)', marginRight: 8 }} />
            <span>Espace Agence Pro &amp; Mandats</span>
          </a>
          <a href="/payer-loyer" className="mobile-nav-link" onClick={close}>
            <CreditCard size={15} style={{ color: '#16a34a', marginRight: 8 }} />
            <span>Payer mon Loyer (Wave / OM)</span>
          </a>


          {/* ── 3. ESPACE UTILISATEUR (Si connecté, regroupé & sans doublon) ── */}
          {isLoggedIn && (
            <>
              <div className="mobile-nav-section">Mon Espace</div>
              <a href="/agence" className="mobile-nav-link" onClick={close} style={{ background: '#FAF8F5' }}>
                <Building2 size={15} style={{ color: 'var(--accent)', marginRight: 8 }} />
                <span style={{ fontWeight: 750 }}>Mon Espace Agence Pro</span>
              </a>
              <a href="/compte?tab=suivi-commande" className="mobile-nav-link" onClick={close}>
                <Package size={15} style={{ color: 'var(--navy)', marginRight: 8 }} />
                <span>Suivre ma commande</span>
              </a>
              <a href="/compte?tab=mes-annonces" className="mobile-nav-link" onClick={close}>
                <FileText size={15} style={{ color: '#0A5C36', marginRight: 8 }} />
                <span>Mes annonces &amp; Biens</span>
              </a>
              <a href="/compte?tab=mes-locations" className="mobile-nav-link" onClick={close}>
                <Home size={15} style={{ color: 'var(--navy)', marginRight: 8 }} />
                <span>Mes locations &amp; Quittances</span>
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
          {/* ── 6. AIDE & CONTACT COMPACT DANS LE TIROIR MOBILE ── */}
          <div style={{ padding: '14px 16px 20px', borderTop: '1px solid var(--border, #E8DDD2)', marginTop: 10, background: '#FAF8F5' }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--accent, #C75B00)', marginBottom: 8 }}>
              Aide &amp; Contact
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
              <a href="/guide-emploi" onClick={close} style={{ color: 'var(--navy, #1C2B4A)', textDecoration: 'none', fontWeight: 600 }}>
                Comment ça marche ?
              </a>
              <a href="/assistant-whatsapp" onClick={close} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#16A34A', textDecoration: 'none', fontWeight: 700 }}>
                <MessageCircle size={13} style={{ color: '#25D366' }} /> Assistant WhatsApp
              </a>
              <a href="mailto:contact@nopalou.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--navy, #1C2B4A)', textDecoration: 'none' }}>
                <Mail size={13} style={{ color: 'var(--accent)' }} /> contact@nopalou.com
              </a>
              <a href="tel:+221708717942" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-subtle)', textDecoration: 'none' }}>
                <Phone size={13} style={{ color: 'var(--accent)' }} /> <span>+221 70 871 79 42 • Dakar</span>
              </a>
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}

