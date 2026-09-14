'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  Store,
  Zap,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  Lock,
  Smartphone,
  Sparkles,
  Percent,
  Truck,
  TrendingUp,
  Check
} from 'lucide-react'

interface Props {
  initialMode?: 'acheteur' | 'marchand'
  activeTab?: 'acheteur' | 'marchand'
  onTabChange?: (tab: 'acheteur' | 'marchand') => void
  prixTafTaf?: number
  searchBarSlot: React.ReactNode
  categoriesSlot: React.ReactNode
}

export default function HeroDualTrack({
  initialMode = 'acheteur',
  activeTab: activeTabProp,
  onTabChange,
  prixTafTaf = 2500,
  searchBarSlot,
  categoriesSlot
}: Props) {
  const [internalTab, setInternalTab] = useState<'acheteur' | 'marchand'>(initialMode)
  const activeTab = activeTabProp !== undefined ? activeTabProp : internalTab
  const [activeBoutiqueNom, setActiveBoutiqueNom] = useState<string | null>(null)

  useEffect(() => {
    if (activeTabProp !== undefined) return // Géré par le parent
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const urlMode = urlParams.get('mode')
        const hasSearchOrCat = urlParams.has('q') || urlParams.has('cat') || urlParams.has('tri') || urlParams.has('prix_max')

        // 1. Si recherche ou catégorie -> Toujours Acheteur
        if (hasSearchOrCat) {
          setInternalTab('acheteur')
          return
        }

        // 2. Si URL explicite ?mode=marchand
        if (urlMode === 'marchand' || urlMode === 'commercant') {
          setInternalTab('marchand')
          return
        }

        // 3. Par défaut : Toujours Acheteur
        setInternalTab('acheteur')
      }
    } catch (err) { console.warn('[Nopalou:HeroDualTrack:L85]', err); }
  }, [activeTabProp])

  function switchTab(tab: 'acheteur' | 'marchand') {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalTab(tab)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* ── SÉLECTEUR D'INTENTION DUAL-TRACK (ACHETEUR / COMMERÇANT) ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <div
          role="tablist"
          aria-label="Mode d'utilisation Nopalou"
          style={{
            display: 'inline-flex',
            background: '#EDE8E1',
            padding: '4px',
            borderRadius: '9999px',
            border: '1px solid var(--border, #E8DDD2)',
            gap: 4,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'acheteur'}
            onClick={() => switchTab('acheteur')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: 13,
              fontWeight: activeTab === 'acheteur' ? 800 : 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'acheteur' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'acheteur' ? 'var(--navy, #1C2B4A)' : 'var(--text2, #5A4E42)',
              boxShadow: activeTab === 'acheteur' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <ShoppingBag size={16} color={activeTab === 'acheteur' ? 'var(--accent, #C75B00)' : 'currentColor'} />
            <span>Acheteur &amp; Comparateur</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'marchand'}
            onClick={() => switchTab('marchand')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: 13,
              fontWeight: activeTab === 'marchand' ? 800 : 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'marchand' ? 'var(--navy, #1C2B4A)' : 'transparent',
              color: activeTab === 'marchand' ? '#FFFFFF' : 'var(--text2, #5A4E42)',
              boxShadow: activeTab === 'marchand' ? '0 3px 10px rgba(28,43,74,0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Store size={16} color={activeTab === 'marchand' ? '#FED7AA' : 'currentColor'} />
            <span>Commerçant &amp; Caisse POS</span>
            <span className="badge-npl badge-npl-accent" style={{ fontSize: 10, padding: '2px 6px' }}>
              PRO
            </span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* VUE 1 : EXPÉRIENCE 100% ACHETEUR & COMPARATEUR DE PRIX        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'acheteur' ? (
        <div style={{ width: '100%' }}>
          <div className="hero-split-grid">
            {/* Colonne Gauche : Recherche et Catégories */}
            <div className="hero-split-left">
              <div>
                <div style={{ marginBottom: 8 }}>
                  <span className="badge-npl badge-npl-accent" style={{ fontSize: 11 }}>
                    Plateforme Officielle · Comparateur &amp; Boutiques Dakar
                  </span>
                </div>

                <h1 style={{
                  fontSize: 'clamp(20px, 2.3vw, 26px)',
                  fontWeight: 900,
                  color: 'var(--navy, #1C2B4A)',
                  margin: '0 0 6px',
                  lineHeight: 1.22,
                  letterSpacing: '-0.02em'
                }}>
                  Achetez au meilleur prix au Sénégal. Commandez sur <span style={{ color: 'var(--price, #0A5C36)' }}>WhatsApp</span>.
                </h1>

                <p style={{
                  fontSize: 13,
                  color: 'var(--text2, #5A4E42)',
                  margin: '0 0 12px',
                  maxWidth: 540,
                  lineHeight: 1.35
                }}>
                  Comparez des milliers d&apos;offres réelles de boutiques vérifiées à Dakar • Zéro commission acheteur • Livraison Tiak-Tiak rapide
                </p>
              </div>

              {/* Slot Barre de Recherche */}
              <div style={{ width: '100%', maxWidth: 540, marginBottom: 10 }}>
                {searchBarSlot}
              </div>

              {/* Slot Ruban de Catégories */}
              <div style={{ width: '100%', maxWidth: 540 }}>
                {categoriesSlot}
              </div>
            </div>

            {/* Colonne Droite : Carte de Réassurance & Avantages Acheteurs (Exit la pub commerçant !) */}
            <div className="hero-split-right">
              <div style={{
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
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent, #C75B00)', fontWeight: 900, fontSize: 13 }}>
                      <ShieldCheck size={18} />
                      <span>Garantie Shopping Nopalou</span>
                    </div>
                    <span style={{ fontSize: 10.5, background: '#DCFCE7', color: '#15803D', fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                      100% Gratuit
                    </span>
                  </div>

                  <p style={{ margin: '0 0 12px', fontSize: 11.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.4 }}>
                    Trouvez le vendeur le plus proche au tarif le plus bas, sans intermédiaires cachés.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <Check size={13} strokeWidth={3} />
                      </div>
                      <div style={{ fontSize: 12, lineHeight: 1.3 }}>
                        <strong style={{ color: 'var(--navy, #1C2B4A)' }}>Boutiques Vérifiées à Dakar</strong>
                        <div style={{ color: 'var(--text2, #5A4E42)', fontSize: 11 }}>Commerces réels avec adresses physiques (Sandaga, Médina, etc.).</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <MessageCircle size={13} strokeWidth={2.5} />
                      </div>
                      <div style={{ fontSize: 12, lineHeight: 1.3 }}>
                        <strong style={{ color: 'var(--navy, #1C2B4A)' }}>Contact Direct WhatsApp</strong>
                        <div style={{ color: 'var(--text2, #5A4E42)', fontSize: 11 }}>Négociez et commandez en direct avec le gérant de la boutique.</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <Lock size={13} strokeWidth={2.5} />
                      </div>
                      <div style={{ fontSize: 12, lineHeight: 1.3 }}>
                        <strong style={{ color: '#1E40AF' }}>Nopalou Pay Safe (Paiement Séquestre)</strong>
                        <div style={{ color: 'var(--text2, #5A4E42)', fontSize: 11 }}>Fonds bloqués jusqu&apos;à vérification physique du colis.</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: 8, borderTop: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                  <span style={{ color: 'var(--text2, #5A4E42)' }}>Vous cherchez un commerçant ?</span>
                  <Link href="/boutiques" style={{ color: 'var(--accent, #C75B00)', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <span>Explorer l&apos;annuaire</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ───────────────────────────────────────────────────────────── */
        /* VUE 2 : VÉRITABLE HUB COMMERÇANT & CAISSE POS (TRANSFORMATION) */
        /* ───────────────────────────────────────────────────────────── */
        <div style={{ width: '100%' }}>
          {/* En-tête Espace Commerçant */}
          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 16px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#1C2B4A', color: '#FED7AA', padding: '4px 12px', borderRadius: 20,
              fontSize: 11.5, fontWeight: 800, marginBottom: 8, boxShadow: '0 2px 6px rgba(28,43,74,0.2)'
            }}>
              <span>Écosystème Pro pour Boutiques &amp; Commerces Physiques</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(20px, 2.5vw, 28px)',
              fontWeight: 900,
              color: 'var(--navy, #1C2B4A)',
              margin: '0 0 6px',
              lineHeight: 1.25,
              letterSpacing: '-0.02em'
            }}>
              Gérez votre boutique, encaissez sans frais et vendez sur <span style={{ color: 'var(--accent, #C75B00)' }}>WhatsApp</span>
            </h2>

            <p style={{
              fontSize: 13,
              color: 'var(--text2, #5A4E42)',
              margin: '0 auto',
              maxWidth: 620,
              lineHeight: 1.4
            }}>
              Caisse tactile web &amp; hors-ligne sur votre téléphone, carnet de dettes client dématérialisé et vitrine e-commerce à 0% de commission Wave/OM.
            </p>

            {/* Bannière Commerçant Connecté si session active */}
            {activeBoutiqueNom && (
              <div style={{
                marginTop: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: '#ECFDF5',
                border: '1.5px solid #A7F3D0',
                padding: '6px 14px',
                borderRadius: 12,
                fontSize: 12,
                color: '#065F46'
              }}>
                <span><strong>Boutique active : {activeBoutiqueNom}</strong></span>
                <Link href="/boutique" style={{ color: '#047857', fontWeight: 800, textDecoration: 'underline' }}>
                  Accéder à mon tableau de bord →
                </Link>
              </div>
            )}
          </div>

          {/* Grille des 4 Grandes Dalles Marchandes Tactiles */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 12,
            marginBottom: 16
          }}>
            {/* Dalle 1 : Caisse POS Tactile (Mise en avant principale) */}
            <div style={{
              background: 'linear-gradient(135deg, #1C2B4A 0%, #152238 100%)',
              color: '#FFFFFF',
              borderRadius: 16,
              padding: '18px 16px',
              boxShadow: '0 6px 20px rgba(28,43,74,0.2)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent, #C75B00)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={20} fill="#fff" />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 900, background: '#16A34A', color: '#fff', padding: '2px 7px', borderRadius: 8 }}>
                    100% HORS-LIGNE
                  </span>
                </div>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: '#FED7AA' }}>
                  Caisse POS Tactile
                </h3>
                <p style={{ margin: 0, fontSize: 11.5, color: '#E2E8F0', lineHeight: 1.35 }}>
                  Encaissez au comptoir sur votre smartphone ou tablette. Scan code-barres par caméra, tickets WhatsApp et gestion multi-caissiers.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <Link
                  href="/boutique/caisse"
                  style={{
                    flex: 1.2,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--accent, #C75B00)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: 'none',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(199,91,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                  }}
                >
                  <Zap size={13} fill="#fff" />
                  <span>Ouvrir la Caisse</span>
                </Link>
                <Link
                  href="/pos"
                  style={{
                    flex: 0.8,
                    padding: '8px 8px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize: 11.5,
                    fontWeight: 700,
                    textDecoration: 'none',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  Démo 
                </Link>
              </div>
            </div>

            {/* Dalle 2 : Créer ma Boutique en Ligne */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '18px 16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              border: '1.5px solid var(--border, #E8DDD2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF3E8', color: 'var(--accent, #C75B00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Store size={20} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 900, background: 'var(--accent, #C75B00)', color: '#fff', padding: '2px 7px', borderRadius: 8 }}>
                    30J OFFERTS
                  </span>
                </div>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                  Créer ma Boutique
                </h3>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.35 }}>
                  Votre vitrine web personnalisée avec catalogue en ligne en 2 minutes. Référencez vos articles et recevez des commandes 24h/24.
                </p>
              </div>

              <Link
                href="/creer-boutique"
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--navy, #1C2B4A)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4
                }}
              >
                <span>Créer en 2 min</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Dalle 3 : Carnet de Dettes Client */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '18px 16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              border: '1.5px solid var(--border, #E8DDD2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={20} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 900, background: '#EFF6FF', color: '#1E40AF', padding: '2px 7px', borderRadius: 8 }}>
                    FINI LES CAHIERS
                  </span>
                </div>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                  Carnet de Dettes &amp; Crédits
                </h3>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.35 }}>
                  Enregistrez qui vous doit de l&apos;argent par client. Envoyez des relances WhatsApp avec lien de remboursement Wave en 1 clic.
                </p>
              </div>

              <Link
                href="/boutique?tab=carnet"
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  color: '#1E293B',
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4
                }}
              >
                <span>Gérer les crédits</span>
                <span>→</span>
              </Link>
            </div>

            {/* Dalle 4 : WhatsApp Commerce & 0% Commission */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '18px 16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              border: '1.5px solid var(--border, #E8DDD2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFDF5', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageCircle size={20} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 900, background: '#DCFCE7', color: '#15803D', padding: '2px 7px', borderRadius: 8 }}>
                    0% COMMISSION
                  </span>
                </div>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                  WhatsApp Commerce
                </h3>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.35 }}>
                  Vos clients parcourent votre catalogue et commandent sur WhatsApp. Zéro commission prélevée sur vos paiements Wave &amp; OM.
                </p>
              </div>

              <Link
                href="/tarifs-boutique"
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  color: '#1E293B',
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4
                }}
              >
                <span>Voir les formules</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Bandeau de Clôture & Preuve Économique Commerçant */}
          <div style={{
            background: 'var(--orange2, #FFF3E8)',
            border: '1px solid #FED7AA',
            borderRadius: 14,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            fontSize: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--navy, #1C2B4A)', fontWeight: 800 }}>
                Formule Taf-Taf Commerçant :
              </span>
              <span style={{ color: 'var(--text2, #5A4E42)' }}>
                Dès <strong style={{ color: 'var(--accent, #C75B00)' }}>{prixTafTaf.toLocaleString('fr-FR')} FCFA/mois</strong> après 30 jours d&apos;essai gratuit • Sans engagement • Aucun terminal bancaire à acheter
              </span>
            </div>

            <Link
              href="/tarifs-boutique"
              style={{
                color: 'var(--accent, #C75B00)',
                fontWeight: 900,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>Découvrir les offres</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
