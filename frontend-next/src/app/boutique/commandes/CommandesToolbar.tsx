'use client'

import React, { useState } from 'react'
import { Zap, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react'

interface CommandesToolbarProps {
  subTab: 'commandes' | 'zones'
  setSubTab: (tab: 'commandes' | 'zones') => void
  onNouvelleCommande: () => void
  pendingCount: number
  filtre: string
  setFiltre: (f: string) => void
  filtreCanal: 'tous' | 'web' | 'caisse'
  setFiltreCanal: (f: 'tous' | 'web' | 'caisse') => void
  totalOrdersCount: number
  filtreStatuts: { key: string; label: string }[]
  onExportCSV: () => void
  onExportPDF: () => void
  scrollRef: any
  scrollToCenter: any
  t: any
  formatNumber: (n: number) => string
}

export default function CommandesToolbar({
  subTab,
  setSubTab,
  onNouvelleCommande,
  pendingCount,
  filtre,
  setFiltre,
  filtreCanal,
  setFiltreCanal,
  totalOrdersCount,
  filtreStatuts,
  onExportCSV,
  onExportPDF,
  scrollRef,
  scrollToCenter,
  t,
  formatNumber,
}: CommandesToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Sub Tabs & Action Nouvelle Commande */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          gap: 12,
          paddingBottom: 6,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setSubTab('commandes')}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              fontSize: 14,
              fontWeight: subTab === 'commandes' ? 700 : 500,
              color: subTab === 'commandes' ? 'var(--accent, #C75B00)' : '#475569',
              borderBottom: subTab === 'commandes' ? '2px solid var(--accent, #C75B00)' : 'none',
              cursor: 'pointer',
            }}
          >
            {t('shop.ordersTitle')}
          </button>
          <button
            onClick={() => setSubTab('zones')}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              fontSize: 14,
              fontWeight: subTab === 'zones' ? 700 : 500,
              color: subTab === 'zones' ? 'var(--accent, #C75B00)' : '#475569',
              borderBottom: subTab === 'zones' ? '2px solid var(--accent, #C75B00)' : 'none',
              cursor: 'pointer',
            }}
          >
            {t('shop.deliveryZonesTitle')}
          </button>
        </div>

        {subTab === 'commandes' && (
          <button
            type="button"
            onClick={onNouvelleCommande}
            style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 3px 10px rgba(22, 163, 74, 0.25)',
            }}
          >
            <Zap size={15} />
            <span>Nouvelle commande / Lien Wave</span>
          </button>
        )}
      </div>

      {subTab === 'commandes' && (
        <>
          {/* Stats rapides */}
          {pendingCount > 0 && filtre !== 'abandonne' && (
            <div
              style={{
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: 10,
                padding: '10px 16px',
                fontSize: 13,
                color: '#92400e',
                fontWeight: 600,
              }}
            >
              {formatNumber(pendingCount)} {t('shop.pendingOrdersCount')}
            </div>
          )}

          {/* Sélecteur de canal & Exports */}
          {filtre !== 'abandonne' && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
                padding: '8px 12px',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginRight: 2 }}>
                  {t('shop.orderSource')} :
                </span>
                <button
                  onClick={() => setFiltreCanal('tous')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    border: '1px solid',
                    borderColor: filtreCanal === 'tous' ? '#1e293b' : '#cbd5e1',
                    background: filtreCanal === 'tous' ? '#1e293b' : '#fff',
                    color: filtreCanal === 'tous' ? '#fff' : '#475569',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t('common.all')} ({formatNumber(totalOrdersCount)})
                </button>
                <button
                  onClick={() => setFiltreCanal('web')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    border: '1px solid',
                    borderColor: filtreCanal === 'web' ? '#2563eb' : '#cbd5e1',
                    background: filtreCanal === 'web' ? '#eff6ff' : '#fff',
                    color: filtreCanal === 'web' ? '#1d4ed8' : '#475569',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Web
                </button>
                <button
                  onClick={() => setFiltreCanal('caisse')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    border: '1px solid',
                    borderColor: filtreCanal === 'caisse' ? '#ea580c' : '#cbd5e1',
                    background: filtreCanal === 'caisse' ? '#fff7ed' : '#fff',
                    color: filtreCanal === 'caisse' ? '#c75b00' : '#475569',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t('shop.pos')}
                </button>
              </div>

              {/* Menu compact d'export */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  style={{
                    fontSize: 12,
                    color: 'var(--navy, #1C2B4A)',
                    background: showExportMenu ? '#e2e8f0' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '5px 10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Download size={13} />
                  <span>Exporter</span>
                  <ChevronDown size={11} />
                </button>

                {showExportMenu && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                      onClick={() => setShowExportMenu(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: 4,
                        width: 200,
                        background: '#ffffff',
                        borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                        border: '1px solid #e2e8f0',
                        padding: '6px',
                        zIndex: 50,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <button
                        onClick={() => {
                          setShowExportMenu(false)
                          onExportCSV()
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#166534',
                          background: '#f0fdf4',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <FileSpreadsheet size={14} />
                        <span>{t('common.exportCsv')} (Excel)</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowExportMenu(false)
                          onExportPDF()
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#1d4ed8',
                          background: '#eff6ff',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <FileText size={14} />
                        <span>{t('common.exportPdf')} (Registre)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Filtres statut + Onglet Paniers Abandonnés */}
          <div
            ref={scrollRef}
            className="commandes-status-scroll"
            style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
          >
            {filtreStatuts.map((f) => (
              <button
                key={f.key}
                onClick={(e) => {
                  setFiltre(f.key)
                  scrollToCenter(e.currentTarget)
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: filtre === f.key ? 'var(--accent, #C75B00)' : '#e5e7eb',
                  background: filtre === f.key ? '#fff7f0' : '#fff',
                  color: filtre === f.key ? 'var(--accent, #C75B00)' : '#374151',
                  fontWeight: filtre === f.key ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            ))}

            <button
              onClick={(e) => {
                setFiltre('abandonne')
                scrollToCenter(e.currentTarget)
              }}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: filtre === 'abandonne' ? '#dc2626' : '#fecaca',
                background: filtre === 'abandonne' ? '#fef2f2' : '#fff',
                color: filtre === 'abandonne' ? '#dc2626' : '#991b1b',
                fontWeight: filtre === 'abandonne' ? 800 : 600,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t('shop.cartTitle')} (Abandonnés)
            </button>
          </div>
        </>
      )}
    </div>
  )
}
