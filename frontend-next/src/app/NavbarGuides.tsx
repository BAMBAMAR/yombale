'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen, Trophy, Radio, Home, TrendingDown,
  MessageCircle, Tag, Package, Users, Sparkles, ChevronDown, CheckCircle2
} from 'lucide-react'

export default function NavbarGuides() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="navbar-guides-wrap" ref={ref}>
      <button
        className="navbar-guides-btn"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="navbar-guides-dropdown"
        aria-label="Guides d'achat et assistants Nopalou"
        style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <BookOpen size={15} style={{ color: 'var(--accent)' }} />
        <span>Guides</span>
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text2)' }} />
      </button>

      {open && (
        <div id="navbar-guides-dropdown" className="navbar-guides-dropdown" role="menu" aria-label="Sous-menu des guides">
          <Link href="/guide-achat" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)}>
            <Trophy size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>Guide d&apos;achat intelligent</span>
              <span style={{ fontWeight: 400, fontSize: 11.5, color: 'var(--text2)' }}>Classement personnalisé de produits</span>
            </span>
          </Link>
          <Link href="/guide-forfait" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)}>
            <Radio size={18} style={{ color: '#2563EB', flexShrink: 0 }} />
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>Guide d&apos;achat forfait</span>
              <span style={{ fontWeight: 400, fontSize: 11.5, color: 'var(--text2)' }}>Trouver le meilleur forfait télécom</span>
            </span>
          </Link>
          <Link href="/guide-immo" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)}>
            <Home size={18} style={{ color: 'var(--navy)', flexShrink: 0 }} />
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>Guide immobilier</span>
              <span style={{ fontWeight: 400, fontSize: 11.5, color: 'var(--text2)' }}>Trouver mon logement idéal</span>
            </span>
          </Link>
          <Link href="/guide-prix" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)}>
            <TrendingDown size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>Guide des prix</span>
              <span style={{ fontWeight: 400, fontSize: 11.5, color: 'var(--text2)' }}>Comprendre le prix d&apos;un produit</span>
            </span>
          </Link>
          <Link href="/guide-emploi" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)}>
            <BookOpen size={18} style={{ color: 'var(--navy)', flexShrink: 0 }} />
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>Guide d&apos;emploi</span>
              <span style={{ fontWeight: 400, fontSize: 11.5, color: 'var(--text2)' }}>Comment utiliser Nopalou</span>
            </span>
          </Link>
          <Link href="/assistant-whatsapp" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)}>
            <MessageCircle size={18} style={{ color: '#0A5C36', flexShrink: 0 }} />
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>Assistant WhatsApp</span>
              <span style={{ fontWeight: 400, fontSize: 11.5, color: 'var(--text2)' }}>Comparez les prix depuis WhatsApp</span>
            </span>
          </Link>
          <Link href="/tarifs-boutique" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)} style={{ background: '#fff7ed', borderRadius: 8 }}>
            <Tag size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: 'var(--accent)' }}>
                Tarifs &amp; Forfaits Vendeurs <span style={{ background: '#C75B00', color: '#FFF', fontSize: 9.5, padding: '1px 6px', borderRadius: 10 }}>OFFRE</span>
              </span>
              <span style={{ fontWeight: 500, fontSize: 11.5, color: 'var(--text2)' }}>Créer ma boutique en ligne (1m offert)</span>
            </span>
          </Link>
          <Link href="/guide-creer-boutique" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)}>
            <Package size={18} style={{ color: 'var(--navy)', flexShrink: 0 }} />
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>Guide Vendeur &amp; Sourcing</span>
              <span style={{ fontWeight: 400, fontSize: 11.5, color: 'var(--text2)' }}>Alibaba, AliExpress &amp; Vente WhatsApp</span>
            </span>
          </Link>
          <Link href="/guide-utilisation" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)} style={{ background: '#f0fdf4', borderRadius: 8 }}>
            <CheckCircle2 size={18} style={{ color: '#0A5C36', flexShrink: 0 }} />
            <span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#0A5C36' }}>
                Guide d&apos;utilisation <span style={{ background: '#0A5C36', color: '#FFF', fontSize: 9.5, padding: '1px 6px', borderRadius: 10 }}>COMPLET</span>
              </span>
              <span style={{ fontWeight: 500, fontSize: 11.5, color: 'var(--text2)' }}>Compte, Caisse POS, Dettes &amp; Factures</span>
            </span>
          </Link>
          <Link href="/compte/apporteur" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)} style={{ background: '#fff7ed', borderRadius: 8 }}>
            <Users size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: 'var(--accent)' }}>
                Programme Apporteur <span style={{ background: '#C75B00', color: '#FFF', fontSize: 9.5, padding: '1px 6px', borderRadius: 10 }}>20% À VIE</span>
              </span>
              <span style={{ fontWeight: 500, fontSize: 11.5, color: 'var(--text2)' }}>Gagnez des commissions chaque mois</span>
            </span>
          </Link>
          <Link href="/demo" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)} style={{ background: '#FFF7ED', borderRadius: 8 }}>
            <Sparkles size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: 'var(--accent)' }}>
                Démo Commerciale <span style={{ background: 'var(--accent)', color: '#FFF', fontSize: 9.5, padding: '1px 6px', borderRadius: 10 }}>NOUVEAU</span>
              </span>
              <span style={{ fontWeight: 500, fontSize: 11.5, color: 'var(--text2)' }}>Parcours interactif &amp; Bac à sable</span>
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
