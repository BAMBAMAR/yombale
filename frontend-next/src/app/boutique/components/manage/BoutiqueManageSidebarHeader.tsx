'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import type { Boutique, ManageTab } from '../../types'
import { ArrowLeft, X, ChevronDown, Eye, Palette } from 'lucide-react'
import { showToast } from '@/context/ToastContext'

interface BoutiqueManageSidebarHeaderProps {
  boutique: Boutique
  tab: ManageTab
  hasMultipleBoutiques?: boolean
  boutiques?: Boutique[]
  onBack: () => void
  onSelectBoutique?: (b: Boutique) => void
  onCreateBoutique?: () => void
  onNavigateTab: (t: ManageTab) => void
  isSwitcherOpen: boolean
  setIsSwitcherOpen: React.Dispatch<React.SetStateAction<boolean>>
  isTrialActive: boolean
  planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  onCloseSidebar: () => void
  t: (key: string) => string
}

export default function BoutiqueManageSidebarHeader({
  boutique,
  tab,
  hasMultipleBoutiques = false,
  boutiques = [],
  onBack,
  onSelectBoutique,
  onCreateBoutique,
  onNavigateTab,
  isSwitcherOpen,
  setIsSwitcherOpen,
  isTrialActive,
  planActif,
  onCloseSidebar,
  t,
}: BoutiqueManageSidebarHeaderProps) {
  const router = useRouter()

  return (
    <div
      className="bq-sidebar-header"
      style={{ paddingBottom: 16, borderBottom: '1px solid var(--pos-border, #E8DDD2)', marginBottom: 16 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (tab !== 'dashboard') {
              onNavigateTab('dashboard')
            } else if (hasMultipleBoutiques) {
              onBack()
            } else {
              router.push('/compte')
            }
          }}
          className="bq-back-btn"
          title={
            tab !== 'dashboard'
              ? 'Retourner à l\'accueil de la boutique'
              : hasMultipleBoutiques
              ? 'Retourner à la liste de mes boutiques'
              : 'Retourner à mon compte'
          }
          style={{
            background: '#ffffff',
            border: '1.5px solid #E2E8F0',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 12,
            color: '#1C2B4A',
            fontWeight: 800,
            padding: '7px 11px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            flex: '1 1 auto',
            minWidth: 0,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={13} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tab !== 'dashboard'
              ? t('shop.homeShopBack')
              : hasMultipleBoutiques
              ? t('shop.myShopsBack')
              : t('shop.myAccountBack')}
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseSidebar}
          className="bq-sidebar-close-btn"
          title={t('shop.closeMenu') || 'Fermer le menu latéral'}
          aria-label={t('shop.closeMenu') || 'Fermer le menu latéral'}
          style={{
            width: 32,
            height: 32,
            flexShrink: 0,
            background: '#ffffff',
            border: '1.5px solid #E2E8F0',
            borderRadius: 10,
            cursor: 'pointer',
            color: '#64748B',
            fontSize: 13,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
          }}
        >
          <X size={15} />
        </button>
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF8F0 100%)',
          border: '1px solid #E8DDD2',
          borderRadius: 14,
          padding: '12px 14px',
          boxShadow: '0 2px 8px rgba(28,43,74,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Ligne 1 : Logo + Nom + Badges de Statut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {boutique.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={boutique.logo_url}
              alt={boutique.nom}
              style={{
                width: 44,
                height: 44,
                objectFit: 'cover',
                borderRadius: 12,
                flexShrink: 0,
                boxShadow: '0 3px 10px rgba(28,43,74,0.12)',
                border: '1.5px solid #ffffff',
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, var(--accent, #C75B00) 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 900,
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(199, 91, 0, 0.25)',
                letterSpacing: '0.02em',
                border: '1.5px solid #ffffff',
              }}
            >
              {boutique.nom ? boutique.nom.slice(0, 2).toUpperCase() : 'NP'}
            </div>
          )}

          <div style={{ minWidth: 0, flex: 1, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              {boutiques && boutiques.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setIsSwitcherOpen((v) => !v)}
                  style={{
                    background: isSwitcherOpen ? '#fff' : 'transparent',
                    border: isSwitcherOpen ? '1px solid var(--accent, #C75B00)' : '1px solid transparent',
                    borderRadius: 8,
                    padding: '1px 5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    minWidth: 0,
                    maxWidth: '100%',
                    textAlign: 'left',
                    boxShadow: isSwitcherOpen ? '0 2px 6px rgba(199,91,0,0.15)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title="Changer de boutique"
                >
                  <h2
                    style={{
                      margin: 0,
                      fontWeight: 850,
                      fontSize: 15.5,
                      color: 'var(--navy, #1C2B4A)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {boutique.nom}
                  </h2>
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--accent, #C75B00)',
                      flexShrink: 0,
                      transform: isSwitcherOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                </button>
              ) : (
                <h2
                  style={{
                    margin: 0,
                    fontWeight: 850,
                    fontSize: 15.5,
                    color: 'var(--navy, #1C2B4A)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {boutique.nom}
                </h2>
              )}

              {planActif && (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    padding: '1.5px 6px',
                    borderRadius: 5,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    background: isTrialActive
                      ? '#EEF2FF'
                      : planActif === 'business'
                      ? '#FEF3C7'
                      : planActif === 'pro'
                      ? '#FFF3E8'
                      : '#F1F5F9',
                    color: isTrialActive
                      ? '#4338CA'
                      : planActif === 'business'
                      ? '#B45309'
                      : planActif === 'pro'
                      ? '#C75B00'
                      : '#475569',
                    border: isTrialActive
                      ? '1px solid #C7D2FE'
                      : planActif === 'business'
                      ? '1px solid #FCD34D'
                      : planActif === 'pro'
                      ? '1px solid #FED7AA'
                      : '1px solid #E2E8F0',
                    flexShrink: 0,
                  }}
                >
                  {isTrialActive ? 'ESSAI VIP' : planActif === 'business' ? 'VIP' : planActif.toUpperCase()}
                </span>
              )}
            </div>

            {/* Dropdown Menu Sélecteur de Boutique */}
            {isSwitcherOpen && boutiques && boutiques.length > 1 && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                  onClick={() => setIsSwitcherOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    zIndex: 1000,
                    background: '#ffffff',
                    border: '1.5px solid #E8DDD2',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(28,43,74,0.18)',
                    width: 250,
                    padding: '6px',
                  }}
                >
                  <div
                    style={{
                      padding: '6px 8px',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Mes Boutiques ({boutiques.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {boutiques.map((b) => {
                      const isCurrent = b.id === boutique.id
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setIsSwitcherOpen(false)
                            if (!isCurrent && onSelectBoutique) onSelectBoutique(b)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: isCurrent ? '1.5px solid #BBF7D0' : '1px solid transparent',
                            background: isCurrent ? '#F0FDF4' : 'transparent',
                            cursor: isCurrent ? 'default' : 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.12s ease',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontWeight: isCurrent ? 800 : 600,
                                fontSize: 13,
                                color: isCurrent ? '#166534' : '#1C2B4A',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {b.nom}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>{b.ville || 'Sénégal'}</div>
                          </div>
                          {isCurrent && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: '#16a34a',
                                background: '#DCFCE7',
                                padding: '2px 6px',
                                borderRadius: 6,
                              }}
                            >
                              Actif
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {boutiques.length < 3 && onCreateBoutique && (
                    <div style={{ borderTop: '1px solid #E8DDD2', marginTop: 6, paddingTop: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSwitcherOpen(false)
                          onCreateBoutique()
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 10px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#FFF3E8',
                          color: 'var(--accent, #C75B00)',
                          fontSize: 12,
                          fontWeight: 750,
                          cursor: 'pointer',
                        }}
                      >
                        <span>+</span>
                        <span>Créer une autre boutique</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={async () => {
                  const nouveauStatut = !boutique.actif
                  try {
                    const res = await fetch(`/api/boutiques/${boutique.id}/statut`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ actif: nouveauStatut }),
                    })
                    if (res.ok) {
                      showToast(
                        nouveauStatut ? 'Boutique activée et visible !' : 'Boutique mise en pause.',
                        'info',
                        'Statut Boutique'
                      )
                      router.refresh()
                    } else {
                      showToast('Erreur lors de la modification du statut.', 'error', 'Statut Boutique')
                    }
                  } catch {
                    showToast('Erreur réseau lors de la modification', 'error', 'Réseau')
                  }
                }}
                style={{
                  background: boutique.actif !== false ? '#F0FDF4' : '#F8FAFC',
                  border: boutique.actif !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                  color: boutique.actif !== false ? '#15803D' : '#64748B',
                  fontSize: 11,
                  fontWeight: 750,
                  padding: '2px 8px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease',
                }}
                title={
                  boutique.actif !== false
                    ? 'Boutique en ligne (cliquez pour masquer)'
                    : 'Boutique masquée (cliquez pour activer)'
                }
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: boutique.actif !== false ? '#16A34A' : '#94A3B8',
                    boxShadow: boutique.actif !== false ? '0 0 0 2px rgba(22, 163, 74, 0.2)' : 'none',
                    flexShrink: 0,
                  }}
                />
                <span>{boutique.actif !== false ? 'En ligne' : 'Masquée'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ligne 2 : Actions Rapides Ma Boutique (Vitrine + Personnaliser) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 6,
            paddingTop: 6,
            borderTop: '1px solid rgba(232,221,210,0.6)',
          }}
        >
          <a
            href={`/boutiques/${boutique.slug || boutique.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: boutique.couleur_theme || '#C75B00',
              border: 'none',
              borderRadius: 8,
              padding: '7px 8px',
              fontSize: 11.5,
              fontWeight: 800,
              color: '#ffffff',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              transition: 'all 0.15s ease',
            }}
            title="Voir la vitrine publique telle que la voient vos clients"
          >
            <Eye size={13} style={{ flexShrink: 0 }} />
            <span>Ma vitrine ↗</span>
          </a>

          <button
            type="button"
            onClick={() => onNavigateTab('personnaliser')}
            style={{
              background: tab === 'personnaliser' ? '#f0fdf4' : '#ffffff',
              border: tab === 'personnaliser' ? '1.5px solid #16a34a' : '1.5px solid #E2E8F0',
              borderRadius: 8,
              padding: '7px 8px',
              fontSize: 11.5,
              fontWeight: 750,
              color: tab === 'personnaliser' ? '#166534' : 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease',
            }}
            title="Personnaliser les couleurs, le style et la bannière"
          >
            <Palette size={13} style={{ color: boutique.couleur_theme || '#C75B00', flexShrink: 0 }} />
            <span>Design</span>
          </button>
        </div>
      </div>
    </div>
  )
}
