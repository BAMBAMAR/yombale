'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Check,
  MessageCircle,
  Lock,
  Building2,
  ArrowRight
} from 'lucide-react'

interface HeroAcheteurViewProps {
  searchBarSlot: React.ReactNode
  categoriesSlot: React.ReactNode
}

export default function HeroAcheteurView({
  searchBarSlot,
  categoriesSlot
}: HeroAcheteurViewProps) {
  return (
    <div style={{ width: '100%' }}>
      <div className="hero-split-grid">
        {/* Colonne Gauche : Recherche, Catégories et Raccourci Immo */}
        <div className="hero-split-left">
          <div>
            <div style={{ marginBottom: 8 }}>
              <span className="badge-npl badge-npl-accent" style={{ fontSize: 11 }}>
                Plateforme Officielle · Comparateur &amp; Boutiques Dakar
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(20px, 2.3vw, 26px)',
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
                margin: '0 0 12px',
                maxWidth: 540,
                lineHeight: 1.35
              }}
            >
              Comparez des milliers d&apos;offres réelles de boutiques vérifiées à Dakar • Zéro
              commission acheteur • Livraison Tiak-Tiak rapide
            </p>
          </div>

          {/* Slot Barre de Recherche */}
          <div style={{ width: '100%', maxWidth: 540, marginBottom: 10 }}>
            {searchBarSlot}
          </div>

          {/* Slot Ruban de Catégories */}
          <div style={{ width: '100%', maxWidth: 540, marginBottom: 14 }}>
            {categoriesSlot}
          </div>

          {/* Passerelle Immobilier : Logements & Terrains vérifiés */}
          <div
            style={{
              maxWidth: 540,
              background: 'linear-gradient(135deg, #F8F5F0 0%, #FFFDF9 100%)',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(28, 43, 74, 0.08)',
                  color: 'var(--navy, #1C2B4A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Building2 size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                    Recherche Immobilière
                  </span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      background: 'rgba(199, 91, 0, 0.12)',
                      color: 'var(--accent, #C75B00)',
                      padding: '1px 6px',
                      borderRadius: 6
                    }}
                  >
                    Dakar &amp; Régions
                  </span>
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--text2, #5A4E42)' }}>
                  Appartements, villas, terrains et baux vérifiés
                </span>
              </div>
            </div>

            <Link
              href="/immo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                fontSize: 11.5,
                fontWeight: 800,
                textDecoration: 'none',
                flexShrink: 0
              }}
            >
              <span>Explorer</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Colonne Droite : Carte de Réassurance & Avantages Acheteurs */}
        <div className="hero-split-right">
          <div
            style={{
              background: 'linear-gradient(145deg, #FFFDF9 0%, #FFF7ED 100%)',
              borderRadius: 18,
              border: '1.5px solid #FED7AA',
              padding: '16px 18px',
              boxShadow: '0 8px 24px rgba(199,91,0,0.07)',
              color: 'var(--navy, #1C2B4A)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              height: '100%',
              boxSizing: 'border-box'
            }}
          >
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
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#DCFCE7',
                      color: '#16A34A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1
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
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#DCFCE7',
                      color: '#16A34A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1
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
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#DBEAFE',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1
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
        </div>
      </div>
    </div>
  )
}
