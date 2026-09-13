'use client'

import React from 'react'
import {
  BookOpen,
  RefreshCw,
  Plus,
  UserPlus,
  Mic,
  QrCode,
  FileSpreadsheet,
  BellRing,
  FileDown,
} from 'lucide-react'
import { fcfa } from '@/lib/format'

interface CarnetHeaderBarProps {
  isMobile: boolean
  clientsCount: number
  nbClientsDebiteurs: number
  totalDettesAEncaisser: number
  totalOfflineCount: number
  syncingCarnet: boolean
  isListeningVoice: boolean
  showMenuOptionsDettes: boolean
  relancantEcheances: boolean
  t: (key: string) => string
  onDeclencherSync: () => void
  onOuvrirModalTransaction: () => void
  onOuvrirModalNouveauClient: () => void
  onToggleEcouteVocale: () => void
  onToggleMenuOptions: () => void
  onOuvrirQrModal: () => void
  onOuvrirImportClients: () => void
  onRelancerEcheances: () => void
  onExportCSV: () => void
  onExportPDF: () => void
}

export default function CarnetHeaderBar({
  isMobile,
  clientsCount,
  nbClientsDebiteurs,
  totalDettesAEncaisser,
  totalOfflineCount,
  syncingCarnet,
  isListeningVoice,
  showMenuOptionsDettes,
  relancantEcheances,
  t,
  onDeclencherSync,
  onOuvrirModalTransaction,
  onOuvrirModalNouveauClient,
  onToggleEcouteVocale,
  onToggleMenuOptions,
  onOuvrirQrModal,
  onOuvrirImportClients,
  onRelancerEcheances,
  onExportCSV,
  onExportPDF,
}: CarnetHeaderBarProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        padding: isMobile ? '16px 16px' : '22px 24px',
        color: '#0f172a',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #FFF3E8 0%, #FED7AA 100%)',
                border: '1px solid #FDBA74',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--accent, #C75B00)',
              }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? 18 : 21,
                  fontWeight: 800,
                  color: 'var(--navy, #1C2B4A)',
                  letterSpacing: '-0.02em',
                }}
              >
                Carnet de dettes &amp; Crédits
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text2, #6B7280)', fontWeight: 600 }}>
                {clientsCount} client{clientsCount > 1 ? 's' : ''} · {nbClientsDebiteurs} endetté
                {nbClientsDebiteurs > 1 ? 's' : ''} ({fcfa(totalDettesAEncaisser)})
              </p>
            </div>
          </div>
        </div>

        {/* Barre d'outils responsive */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: 8,
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {/* Ligne 1 : Boutons d'action principaux */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: isMobile ? '100%' : 'auto',
              flex: isMobile ? '1 1 auto' : 'initial',
            }}
          >
            {totalOfflineCount > 0 && (
              <button
                type="button"
                onClick={onDeclencherSync}
                title="Synchroniser immédiatement les dettes ou ventes enregistrées hors-ligne"
                style={{
                  minHeight: 42,
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 800,
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
                  flexShrink: 0,
                }}
              >
                <RefreshCw size={14} className={syncingCarnet ? 'animate-spin' : ''} />
                <span>{syncingCarnet ? 'Sync...' : `Sync (${totalOfflineCount})`}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOuvrirModalTransaction}
              style={{
                flex: isMobile ? 1 : 'initial',
                minHeight: 42,
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, var(--accent, #C75B00) 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 2px 8px rgba(199, 91, 0, 0.25)',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              <span>+ Vente crédit</span>
            </button>

            <button
              type="button"
              onClick={onOuvrirModalNouveauClient}
              style={{
                flex: isMobile ? 1 : 'initial',
                minHeight: 42,
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <UserPlus size={16} />
              <span>+ Client</span>
            </button>
          </div>

          {/* Ligne 2 : Assistant Vocal & Menu Plus */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: isMobile ? '100%' : 'auto',
              flex: isMobile ? '1 1 auto' : 'initial',
            }}
          >
            <button
              type="button"
              onClick={onToggleEcouteVocale}
              title={
                isListeningVoice
                  ? "Arrêter l'écoute"
                  : 'Dicter une dette ou rechercher un client en Wolof ou Français'
              }
              style={{
                minHeight: 42,
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                background: isListeningVoice ? '#ea580c' : '#fff7ed',
                color: isListeningVoice ? '#ffffff' : '#c2410c',
                border: isListeningVoice ? '2px solid #9a3412' : '1.5px solid #fdba74',
                boxShadow: isListeningVoice
                  ? '0 0 0 4px rgba(234, 88, 12, 0.25)'
                  : '0 2px 6px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flex: isMobile ? 1 : 'initial',
              }}
            >
              <Mic size={16} />
              <span>{isListeningVoice ? 'Écoute…' : 'Parler (Dette / Client)'}</span>
            </button>

            <div className="npl-dettes-options-dropdown" style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={onToggleMenuOptions}
                style={{
                  minHeight: 42,
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  border: '1.5px solid var(--border, #E5E7EB)',
                  background: '#ffffff',
                  color: 'var(--navy, #1C2B4A)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span>⋯ Plus ▾</span>
              </button>

              {showMenuOptionsDettes && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 6,
                    background: '#ffffff',
                    borderRadius: 12,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    border: '1px solid #e2e8f0',
                    padding: 8,
                    zIndex: 100,
                    minWidth: 220,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <button
                    type="button"
                    onClick={onOuvrirQrModal}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#1e293b',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <QrCode size={16} />
                    <span>QR Client Comptoir</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOuvrirImportClients}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#1d4ed8',
                      background: '#eff6ff',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <FileSpreadsheet size={16} />
                    <span>Importer CSV / Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={onRelancerEcheances}
                    disabled={relancantEcheances}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#b45309',
                      background: '#fefce8',
                      border: 'none',
                      cursor: relancantEcheances ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      opacity: relancantEcheances ? 0.6 : 1,
                    }}
                  >
                    <BellRing size={16} />
                    <span>
                      {relancantEcheances ? 'Relances en cours...' : 'Relancer créances échues'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onExportCSV}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#166534',
                      background: '#f0fdf4',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <FileDown size={16} />
                    <span>{t('common.exportCsv')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onExportPDF}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#475569',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <FileDown size={16} />
                    <span>{t('common.exportPdf')} (Registre)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
