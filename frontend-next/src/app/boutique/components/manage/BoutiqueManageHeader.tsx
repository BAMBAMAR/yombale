'use client'

import React from 'react'
import { Sparkles, X, Menu, LucideIcon } from 'lucide-react'

interface BoutiqueManageHeaderProps {
  toast: string | null
  onToastClick: () => void
  onCloseToast: () => void
  isSidebarOpen: boolean
  onOpenSidebar: () => void
  boutiqueNom: string
  isTrialActive: boolean
  joursRestantsEssai: number
  currentTabInfo: { title: string; icon: LucideIcon; desc: string }
}

export default function BoutiqueManageHeader({
  toast,
  onToastClick,
  onCloseToast,
  isSidebarOpen,
  onOpenSidebar,
  boutiqueNom,
  isTrialActive,
  joursRestantsEssai,
  currentTabInfo,
}: BoutiqueManageHeaderProps) {
  const TabHeaderIcon = currentTabInfo.icon

  return (
    <>
      {/* Toast nouvelle commande */}
      {toast && (
        <div
          onClick={onToastClick}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: '#1e3a5f',
            color: '#fff',
            borderRadius: 14,
            padding: '14px 20px',
            fontSize: 14,
            fontWeight: 700,
            boxShadow: '0 8px 32px rgba(0,0,0,.25)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: 320,
            animation: 'slideUp .3s ease',
          }}
        >
          <Sparkles size={20} />
          <div>
            <p style={{ margin: 0 }}>{toast}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.75 }}>Cliquer pour voir</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCloseToast()
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 18,
              padding: 0,
              marginLeft: 4,
              opacity: 0.7,
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>

      {!isSidebarOpen && (
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={onOpenSidebar}
            className="bq-sidebar-open-btn"
            title="Réafficher le menu de la boutique"
            style={{
              background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #2D3E6B 100%)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 3px 10px rgba(28,43,74,0.18)',
              transition: 'all 0.15s ease',
            }}
          >
            <Menu size={16} />
            <span>Afficher le menu ({boutiqueNom})</span>
          </button>
        </div>
      )}

      {/* BANDEAU 1ER MOIS GRATUIT — ACCÈS TOTAL VIP */}
      {isTrialActive && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #312e81 100%)',
            color: '#ffffff',
            borderRadius: 14,
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 4px 16px rgba(30,58,95,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 900,
                  fontSize: 14,
                  letterSpacing: '0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span>1er Mois 100% Offert — Accès Total VIP Actif</span>
                <span
                  style={{
                    background: '#22c55e',
                    color: '#064e3b',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {joursRestantsEssai} jour{joursRestantsEssai > 1 ? 's' : ''} restant
                  {joursRestantsEssai > 1 ? 's' : ''}
                </span>
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#e0e7ff', lineHeight: 1.4 }}>
                Toutes les fonctionnalités Nopalou sont débloquées (Caisse POS tactile, Saisie Express, Compta, Factures
                PDF, Équipe, API). Profitez-en pour digitaliser 100% de votre boutique !
              </p>
            </div>
          </div>
          <a
            href="/boutique/abonnement"
            style={{
              background: '#ffffff',
              color: '#1e3a5f',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            }}
          >
            Voir les formules →
          </a>
        </div>
      )}

      {/* Titre de section Desktop */}
      <div
        className="bq-main-tab-header"
        style={{
          marginBottom: 20,
          paddingBottom: 14,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
              fontSize: 20,
              margin: 0,
              color: 'var(--navy)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <TabHeaderIcon size={20} style={{ color: 'var(--accent, #C75B00)' }} />
            <span>{currentTabInfo.title}</span>
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-subtle)' }}>{currentTabInfo.desc}</p>
        </div>
      </div>
    </>
  )
}
