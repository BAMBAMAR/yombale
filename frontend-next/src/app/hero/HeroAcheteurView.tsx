'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Check,
  MessageCircle,
  Lock,
  Building2,
  ArrowRight,
  Store,
  CreditCard
} from 'lucide-react'

interface HeroAcheteurViewProps {
  searchBarSlot: React.ReactNode
  categoriesSlot: React.ReactNode
  tabSelectorSlot?: React.ReactNode
}

export default function HeroAcheteurView({
  searchBarSlot,
  categoriesSlot,
  tabSelectorSlot
}: HeroAcheteurViewProps) {
  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div className="hero-split-grid">

        {/* ── Colonne Gauche : Recherche, Catégories et Passerelles Pro ── */}
        <div className="hero-split-left">

          {/* En-tête & Accroche */}
          <div style={{ width: '100%' }}>
            <div style={{ marginBottom: 8 }}>
              <span className="badge-npl badge-npl-accent" style={{ fontSize: 11 }}>
                Plateforme Officielle · Comparateur &amp; Boutiques Dakar
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(18px, 4.5vw, 26px)',
                fontWeight: 900,
                color: 'var(--navy, #1C2B4A)',
                margin: '0 0 6px',
                lineHeight: 1.22,
                letterSpacing: '-0.02em'
              }}
            >
              Achetez au meilleur prix au Sénégal. Commandez sur{' '}
              <span style={{ color: 'var(--price, #0A5C36)' }}>WhatsApp</span>.
            </h1>

            <p
              style={{
                fontSize: 13,
                color: 'var(--text2, #5A4E42)',
                margin: '0 0 4px',
                lineHeight: 1.35,
                maxWidth: '100%'
              }}
            >
              Comparez des milliers d&apos;offres réelles de boutiques vérifiées à Dakar
              • Zéro commission acheteur • Livraison Tiak-Tiak rapide
            </p>
          </div>

          {/* Slot Sélecteur de Mode — juste au-dessus de la recherche */}
          {tabSelectorSlot && (
            <div style={{ width: '100%', maxWidth: 540, marginBottom: 8 }}>
              {tabSelectorSlot}
            </div>
          )}

          {/* Slot Barre de Recherche */}
          <div style={{ width: '100%', maxWidth: 540 }}>
            {searchBarSlot}
          </div>

          {/* Slot Ruban de Catégories */}
          <div style={{ width: '100%', maxWidth: 540 }}>
            {categoriesSlot}
          </div>

          {/* ── PASSERELLES D'ACCÈS RAPIDE AUX SOLUTIONS PRO ── */}
          <div className="hero-passerelles-wrap">

            {/* Passerelle 1 : Commerçants & Caisse POS Tactile Offline */}
            <div className="hero-passerelle-card commercant">
              <div className="hero-passerelle-main">
                <div className="hero-passerelle-icon commercant">
                  <Store size={17} />
                </div>
                <div className="hero-passerelle-body">
                  <div className="hero-passerelle-title-row">
                    <span className="hero-passerelle-title">
                      Vous tenez un commerce ?
                    </span>
                    <span className="hero-passerelle-badge badge-green">
                      Caisse Offline
                    </span>
                  </div>
                  <span className="hero-passerelle-sub">
                    Caisse tactile sur téléphone, carnet de dettes &amp; commandes WhatsApp
                  </span>
                </div>
              </div>
              <div className="hero-passerelle-actions">
                <Link
                  href="/?mode=marchand#resultats"
                  className="hero-passerelle-btn btn-accent"
                >
                  <span>Espace Caisse</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Passerelle 2 : Immobilier, Logements & Paiement de Loyer Wave */}
            <div className="hero-passerelle-card immo">
              <div className="hero-passerelle-main">
                <div className="hero-passerelle-icon immo">
                  <Building2 size={17} />
                </div>
                <div className="hero-passerelle-body">
                  <div className="hero-passerelle-title-row">
                    <span className="hero-passerelle-title">
                      Immobilier &amp; Baux
                    </span>
                    <span className="hero-passerelle-badge badge-navy">
                      Dakar &amp; Régions
                    </span>
                  </div>
                  <span className="hero-passerelle-sub">
                    Locations, villas vérifiées &amp; quittances officielles OHADA
                  </span>
                </div>
              </div>
              <div className="hero-passerelle-actions">
                <Link
                  href="/payer-loyer"
                  className="hero-passerelle-btn btn-loyer"
                >
                  <CreditCard size={11} />
                  <span>Loyer</span>
                </Link>
                <Link
                  href="/immo"
                  className="hero-passerelle-btn btn-navy"
                >
                  <span>Explorer</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* ── Colonne Droite : Carte de Réassurance (Desktop uniquement) ── */}
        <div className="hero-split-right">
          {/* VERSION DESKTOP : carte complète avec bullet points */}
          <div className="hero-guarantee-desktop">
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--accent, #C75B00)',
                    fontWeight: 900,
                    fontSize: 13
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>Garantie Shopping Nopalou</span>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    background: '#DCFCE7',
                    color: '#15803D',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 10
                  }}
                >
                  100% Gratuit
                </span>
              </div>

              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: 11.5,
                  color: 'var(--text2, #5A4E42)',
                  lineHeight: 1.4
                }}
              >
                Trouvez le vendeur le plus proche au tarif le plus bas, sans intermédiaires cachés.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#DCFCE7', color: '#16A34A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1
                    }}
                  >
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.3 }}>
                    <strong style={{ color: 'var(--navy, #1C2B4A)' }}>
                      Boutiques &amp; Agences Vérifiées
                    </strong>
                    <div style={{ color: 'var(--text2, #5A4E42)', fontSize: 11 }}>
                      Commerces réels avec adresses physiques à Dakar (Sandaga, Médina, Almadies).
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#DCFCE7', color: '#16A34A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1
                    }}
                  >
                    <MessageCircle size={13} strokeWidth={2.5} />
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.3 }}>
                    <strong style={{ color: 'var(--navy, #1C2B4A)' }}>
                      Contact Direct WhatsApp
                    </strong>
                    <div style={{ color: 'var(--text2, #5A4E42)', fontSize: 11 }}>
                      Négociez et commandez en direct avec le commerçant ou l&apos;agence.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#DBEAFE', color: '#2563EB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1
                    }}
                  >
                    <Lock size={13} strokeWidth={2.5} />
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.3 }}>
                    <strong style={{ color: '#1E40AF' }}>
                      Nopalou Pay Safe (Paiement Séquestre)
                    </strong>
                    <div style={{ color: 'var(--text2, #5A4E42)', fontSize: 11 }}>
                      Fonds bloqués jusqu&apos;à vérification physique du colis ou remise des clés.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                paddingTop: 8,
                borderTop: '1px solid #FED7AA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11.5,
                flexWrap: 'wrap',
                gap: 6
              }}
            >
              <Link
                href="/boutiques"
                style={{
                  color: 'var(--accent, #C75B00)',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <span>Annuaire Boutiques</span>
                <span>→</span>
              </Link>
              <Link
                href="/agences"
                style={{
                  color: 'var(--navy, #1C2B4A)',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <span>Agences Immobilières</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* VERSION MOBILE : bannière de réassurance compacte en chips scrollables */}
          <div className="hero-guarantee-mobile">
            <div className="hero-guarantee-mobile-head">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  color: 'var(--accent, #C75B00)',
                  fontWeight: 900,
                  fontSize: 12
                }}
              >
                <ShieldCheck size={15} />
                <span>Garantie Nopalou</span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  background: '#DCFCE7',
                  color: '#15803D',
                  fontWeight: 800,
                  padding: '1px 7px',
                  borderRadius: 8
                }}
              >
                100% Gratuit
              </span>
            </div>
            <div className="hero-guarantee-mobile-chips">
              <span className="hero-guarantee-chip">
                <Check size={11} strokeWidth={3} style={{ color: '#16A34A' }} />
                Boutiques Vérifiées
              </span>
              <span className="hero-guarantee-chip">
                <MessageCircle size={11} strokeWidth={2.5} style={{ color: '#16A34A' }} />
                WhatsApp Direct
              </span>
              <span className="hero-guarantee-chip chip-safe">
                <Lock size={11} strokeWidth={2.5} />
                Pay Safe Séquestre
              </span>
            </div>
            <div className="hero-guarantee-mobile-links">
              <Link
                href="/boutiques"
                style={{
                  color: 'var(--accent, #C75B00)',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <span>Boutiques</span>
                <span>→</span>
              </Link>
              <Link
                href="/agences"
                style={{
                  color: 'var(--navy, #1C2B4A)',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <span>Agences Immo</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
