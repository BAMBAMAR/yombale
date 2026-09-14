'use client'

import React from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import PosHeaderBoutiqueSelector from './PosHeaderBoutiqueSelector'
import PosHeaderRightActions from './PosHeaderRightActions'
import type { PosModalsState } from '../hooks/usePosModalsState'

interface PosHeaderBarProps {
  initialToken?: string | null
  boutiqueActiveId: string
  boutiques: any[]
  activeBoutiqueObj?: any
  roleActif: 'caissier' | 'superviseur'
  caissierNom: string
  session: any | null
  offlineModeActive: boolean
  ventesHorsLigneCount: number
  dettesHorsLigneCount: number
  totalHorsLigneCount: number
  syncingOffline: boolean
  isDarkMode: boolean
  layoutColCentrale: boolean
  clientsCreditsCount: number
  historiqueVentesCount: number
  t: (key: string) => string
  onQuitterVersDashboard: () => void
  onDeclencherSyncOffline: () => void
  onDemanderChangementBoutique: (newId: string) => void
  onToggleDarkMode: () => void
  onToggleLayoutColCentrale: () => void
  onVerrouillerCaisseManuellement: () => void
  onSeDeconnecterCompte: () => void
  modals?: PosModalsState
  menuOutilsOuvert?: boolean
  onDemanderValidationSuperviseur?: (motif: string, cb: () => void) => void
  onOpenModalChangerCaissier?: () => void
  onToggleMenuOutils?: () => void
  onOpenModalTiroirCaisse?: () => void
  onOpenModalClotureZ?: () => void
  onOpenModalSessionOuverture?: () => void
  onOpenModalBilanSession?: () => void
  onOpenModalImportBatch?: () => void
  onOpenConfigPin?: () => void
  onOpenModalHistorique?: () => void
  onOpenModalCarnet?: () => void
}

export default function PosHeaderBar(props: PosHeaderBarProps) {
  const {
    initialToken,
    boutiqueActiveId,
    boutiques,
    activeBoutiqueObj,
    roleActif,
    caissierNom,
    session,
    offlineModeActive,
    ventesHorsLigneCount,
    dettesHorsLigneCount,
    totalHorsLigneCount,
    syncingOffline,
    isDarkMode,
    layoutColCentrale,
    clientsCreditsCount,
    historiqueVentesCount,
    t,
    onQuitterVersDashboard,
    onDeclencherSyncOffline,
    onDemanderChangementBoutique,
    onToggleDarkMode,
    onToggleLayoutColCentrale,
    onVerrouillerCaisseManuellement,
    onSeDeconnecterCompte,
    modals,
  } = props

  const menuOutilsOuvert = modals ? modals.menuOutilsOuvert : Boolean(props.menuOutilsOuvert)
  const onDemanderValidationSuperviseur = modals
    ? modals.demanderValidationSuperviseur
    : (props.onDemanderValidationSuperviseur || (() => {}))
  const onOpenModalChangerCaissier = modals
    ? () => modals.setModalChangerCaissier(true)
    : (props.onOpenModalChangerCaissier || (() => {}))
  const onToggleMenuOutils = modals
    ? () => modals.setMenuOutilsOuvert((p) => !p)
    : (props.onToggleMenuOutils || (() => {}))
  const onOpenModalTiroirCaisse = modals
    ? () => modals.setModalTiroirCaisse(true)
    : (props.onOpenModalTiroirCaisse || (() => {}))
  const onOpenModalClotureZ = modals
    ? () => modals.setModalClotureZ(true)
    : (props.onOpenModalClotureZ || (() => {}))
  const onOpenModalSessionOuverture = modals
    ? () => modals.setModalSessionOuverture(true)
    : (props.onOpenModalSessionOuverture || (() => {}))
  const onOpenModalBilanSession = modals
    ? () => modals.setModalBilanSession(true)
    : (props.onOpenModalBilanSession || (() => {}))
  const onOpenModalImportBatch = modals
    ? () => modals.setModalImportBatch(true)
    : (props.onOpenModalImportBatch || (() => {}))
  const onOpenConfigPin = modals
    ? () => modals.setModalConfigPin(true)
    : (props.onOpenConfigPin || (() => {}))
  const onOpenModalHistorique = modals
    ? () => modals.setModalHistorique(true)
    : (props.onOpenModalHistorique || (() => {}))
  const onOpenModalCarnet = modals
    ? () => modals.setModalCarnet(true)
    : (props.onOpenModalCarnet || (() => {}))
  return (
    <header
      className="caisse-header no-print"
      style={{
        background: 'var(--pos-surface)',
        borderBottom: '2px solid var(--pos-primary)',
        padding: '0 10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--pos-shadow)',
        gap: 6,
        height: 52,
        minHeight: 52,
        flexShrink: 0,
        flexWrap: 'nowrap',
      }}
    >
      {/* Côté Gauche : Retour + Identité Boutique & Sélecteur */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexShrink: 1 }}>
        {initialToken ? (
          <div
            style={{
              height: 34,
              padding: '0 10px',
              fontSize: 12,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
              background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
              color: '#ffffff',
              borderRadius: 8,
              boxShadow: '0 2px 6px rgba(29,78,216,0.3)',
            }}
          >
            <span className="caisse-label-desktop">{t('caisse.terminalCashier')}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              const targetUrl = boutiqueActiveId ? `/boutique?manage=${boutiqueActiveId}` : '/boutique'
              if (roleActif === 'superviseur') {
                onQuitterVersDashboard()
                window.location.href = targetUrl
              } else {
                onDemanderValidationSuperviseur('Accès au Dashboard Gestion Boutique (Gérant)', () => {
                  onQuitterVersDashboard()
                  window.location.href = targetUrl
                })
              }
            }}
            className="caisse-btn-retour"
            style={{
              height: 34,
              padding: '0 10px',
              fontSize: 12,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              flexShrink: 0,
              background: isDarkMode ? '#1e293b' : '#1e3a5f',
              color: '#ffffff',
              border: isDarkMode ? '1px solid #334155' : '1px solid #1e3a5f',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(28,43,74,0.2)',
              transition: 'all 0.15s ease',
            }}
            title="Retourner au tableau de bord de la boutique"
          >
            <ArrowLeft size={14} />
            <span className="caisse-label-desktop">{t('caisse.shop') || 'Boutique'}</span>
          </button>
        )}

        {/* Badge Hors-Ligne & Sync */}
        {offlineModeActive ? (
          <div
            className="caisse-status-badge"
            title={`${ventesHorsLigneCount} vente(s) et ${dettesHorsLigneCount} dette(s) locale(s) en attente de synchronisation`}
            style={{
              background: '#dc2626',
              color: '#fff',
              padding: '3px 8px',
              borderRadius: 6,
              fontWeight: 800,
              fontSize: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              animation: 'pulse 1.5s infinite',
            }}
          >
            <span className="caisse-label-desktop">Hors-Ligne</span>
            {totalHorsLigneCount > 0 && (
              <span style={{ background: '#991b1b', padding: '1px 5px', borderRadius: 4, fontSize: 9.5, fontWeight: 900 }}>
                {totalHorsLigneCount}
              </span>
            )}
          </div>
        ) : totalHorsLigneCount > 0 ? (
          <button
            type="button"
            onClick={onDeclencherSyncOffline}
            title="Cliquez pour synchroniser immédiatement les opérations locales en attente"
            style={{
              background: '#ea580c',
              color: '#fff',
              border: 'none',
              padding: '3px 8px',
              borderRadius: 6,
              fontWeight: 800,
              fontSize: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <RefreshCw size={11} className={syncingOffline ? 'spin-anim' : ''} />
            <span>{syncingOffline ? 'Sync...' : `Sync (${totalHorsLigneCount})`}</span>
          </button>
        ) : null}

        {/* Badge & Sélecteur Boutique Pro */}
        <PosHeaderBoutiqueSelector
          boutiques={boutiques}
          boutiqueActiveId={boutiqueActiveId}
          activeBoutiqueObj={activeBoutiqueObj}
          initialToken={initialToken}
          isDarkMode={isDarkMode}
          onDemanderChangementBoutique={onDemanderChangementBoutique}
        />
      </div>

      {/* Côté Droit : Caissier Pro + Thème + Layout + Outils + Session */}
      <PosHeaderRightActions
        roleActif={roleActif}
        caissierNom={caissierNom}
        session={session}
        isDarkMode={isDarkMode}
        layoutColCentrale={layoutColCentrale}
        menuOutilsOuvert={menuOutilsOuvert}
        clientsCreditsCount={clientsCreditsCount}
        historiqueVentesCount={historiqueVentesCount}
        initialToken={initialToken}
        t={t}
        onOpenModalChangerCaissier={onOpenModalChangerCaissier}
        onToggleDarkMode={onToggleDarkMode}
        onToggleLayoutColCentrale={onToggleLayoutColCentrale}
        onToggleMenuOutils={onToggleMenuOutils}
        onOpenModalTiroirCaisse={onOpenModalTiroirCaisse}
        onOpenModalClotureZ={onOpenModalClotureZ}
        onOpenModalSessionOuverture={onOpenModalSessionOuverture}
        onOpenModalBilanSession={onOpenModalBilanSession}
        onOpenModalImportBatch={onOpenModalImportBatch}
        onOpenConfigPin={onOpenConfigPin}
        onOpenModalHistorique={onOpenModalHistorique}
        onOpenModalCarnet={onOpenModalCarnet}
        onVerrouillerCaisseManuellement={onVerrouillerCaisseManuellement}
        onSeDeconnecterCompte={onSeDeconnecterCompte}
      />
    </header>
  )
}
