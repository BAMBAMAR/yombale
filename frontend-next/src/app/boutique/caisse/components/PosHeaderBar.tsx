'use client'

import React from 'react'
import {
  ArrowLeft,
  ChevronDown,
  Shield,
  User,
  Sun,
  Moon,
  Columns3,
  Settings,
  Banknote,
  Lock,
  Unlock,
  BarChart3,
  Download,
  History,
  Book,
  LogOut,
  RefreshCw,
} from 'lucide-react'

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
  menuOutilsOuvert: boolean
  clientsCreditsCount: number
  historiqueVentesCount: number
  t: (key: string) => string
  onQuitterVersDashboard: () => void
  onDemanderValidationSuperviseur: (motif: string, cb: () => void) => void
  onDeclencherSyncOffline: () => void
  onDemanderChangementBoutique: (newId: string) => void
  onOpenModalChangerCaissier: () => void
  onToggleDarkMode: () => void
  onToggleLayoutColCentrale: () => void
  onToggleMenuOutils: () => void
  onOpenModalTiroirCaisse: () => void
  onOpenModalClotureZ: () => void
  onOpenModalSessionOuverture: () => void
  onOpenModalBilanSession: () => void
  onOpenModalImportBatch: () => void
  onOpenConfigPin: () => void
  onOpenModalHistorique: () => void
  onOpenModalCarnet: () => void
  onVerrouillerCaisseManuellement: () => void
  onSeDeconnecterCompte: () => void
}

export default function PosHeaderBar({
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
  menuOutilsOuvert,
  clientsCreditsCount,
  historiqueVentesCount,
  t,
  onQuitterVersDashboard,
  onDemanderValidationSuperviseur,
  onDeclencherSyncOffline,
  onDemanderChangementBoutique,
  onOpenModalChangerCaissier,
  onToggleDarkMode,
  onToggleLayoutColCentrale,
  onToggleMenuOutils,
  onOpenModalTiroirCaisse,
  onOpenModalClotureZ,
  onOpenModalSessionOuverture,
  onOpenModalBilanSession,
  onOpenModalImportBatch,
  onOpenConfigPin,
  onOpenModalHistorique,
  onOpenModalCarnet,
  onVerrouillerCaisseManuellement,
  onSeDeconnecterCompte,
}: PosHeaderBarProps) {
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
        {boutiques.length > 0 && (
          <div
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: isDarkMode ? '#1e293b' : 'var(--pos-primary-bg)',
              border: isDarkMode ? '1px solid #334155' : '1px solid var(--pos-border)',
              borderRadius: 8,
              padding: '3px 8px 3px 4px',
              height: 34,
              flexShrink: 1,
              minWidth: 0,
            }}
            title={boutiques.length > 1 ? 'Boutique active (cliquez pour changer de boutique)' : 'Boutique active'}
          >
            {activeBoutiqueObj?.logo ? (
              <img
                src={activeBoutiqueObj.logo}
                alt={activeBoutiqueObj.nom}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: isDarkMode ? '1px solid #475569' : '1px solid var(--pos-border)',
                }}
              />
            ) : (
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, var(--pos-primary, #C75B00) 0%, #ea580c 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12.5,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {activeBoutiqueObj?.nom ? activeBoutiqueObj.nom.charAt(0).toUpperCase() : ''}
              </span>
            )}

            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: isDarkMode ? '#f8fafc' : '#1e3a5f',
                maxWidth: 110,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeBoutiqueObj?.nom || boutiques[0]?.nom}
            </span>

            {boutiques.length > 1 && !initialToken && (
              <>
                <ChevronDown size={12} style={{ color: isDarkMode ? '#94a3b8' : '#64748b', flexShrink: 0 }} />
                <select
                  value={boutiqueActiveId}
                  onChange={(e) => onDemanderChangementBoutique(e.target.value)}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                  title="Changer de boutique (sécurisé par PIN Superviseur)"
                >
                  {boutiques.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nom}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        )}
      </div>

      {/* Côté Droit : Caissier Pro + Thème + Layout + Outils + Session */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        {/* Espace Caissier Pro */}
        <button
          type="button"
          onClick={onOpenModalChangerCaissier}
          title={`Caissier actif : ${caissierNom} — Cliquer pour changer de caissier ou verrouiller`}
          style={{
            height: 34,
            padding: '0 10px',
            borderRadius: 20,
            background: isDarkMode ? '#1e293b' : 'var(--pos-primary-bg)',
            border: isDarkMode ? '1px solid #334155' : '1px solid var(--pos-border)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: 13, lineHeight: 1 }}>
            {roleActif === 'superviseur' ? <Shield size={13} color="var(--pos-primary)" /> : <User size={13} color="var(--pos-primary)" />}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--pos-text)',
              maxWidth: 75,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {caissierNom?.split(' ')[0] || caissierNom}
          </span>
          <ChevronDown size={12} color={isDarkMode ? '#94a3b8' : '#64748b'} />
          <span
            style={{
              width: 6.5,
              height: 6.5,
              borderRadius: '50%',
              backgroundColor: session ? '#16a34a' : '#94a3b8',
              boxShadow: session ? '0 0 0 2px rgba(22, 163, 74, 0.25)' : 'none',
              flexShrink: 0,
            }}
            title={session ? 'Session caisse active' : 'Session caisse fermée'}
          />
        </button>

        {/* Bouton Bascule Mode Nuit / Jour */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          title={isDarkMode ? 'Passer en mode jour' : 'Passer en mode nuit (sombre)'}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: isDarkMode ? '1px solid #334155' : '1.5px solid var(--pos-border)',
            background: isDarkMode ? '#1e293b' : 'var(--pos-surface)',
            color: isDarkMode ? '#f59e0b' : 'var(--pos-text)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: 'var(--pos-shadow)',
            transition: 'all 0.15s ease',
          }}
        >
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Bouton Bascule 3 Colonnes — Desktop */}
        <button
          type="button"
          onClick={onToggleLayoutColCentrale}
          title="Afficher ou masquer la colonne centrale (pupitre tactile express)"
          className="caisse-desktop-only"
          style={{
            height: 34,
            padding: '0 8px',
            borderRadius: 8,
            border: isDarkMode ? '1px solid #334155' : '1.5px solid var(--pos-border)',
            background: layoutColCentrale ? 'var(--pos-primary-bg)' : isDarkMode ? '#1e293b' : 'var(--pos-surface)',
            color: layoutColCentrale ? 'var(--pos-primary)' : 'var(--pos-text)',
            fontWeight: 800,
            fontSize: 11.5,
            cursor: 'pointer',
            alignItems: 'center',
            gap: 5,
            boxShadow: 'var(--pos-shadow)',
            flexShrink: 0,
          }}
        >
          <Columns3 size={14} />
          <span className="caisse-label-desktop">{layoutColCentrale ? '3 Col' : '2 Col'}</span>
        </button>

        {/* Menu Dropdown Outils & Actions */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={onToggleMenuOutils}
            className="pos-btn pos-btn-sm pos-btn-secondary"
            style={{
              height: 34,
              padding: '0 8px',
              borderRadius: 8,
              border: isDarkMode ? '1px solid #334155' : '1.5px solid var(--pos-border)',
              background: menuOutilsOuvert ? 'var(--pos-primary-bg)' : isDarkMode ? '#1e293b' : 'var(--pos-surface)',
              color: menuOutilsOuvert ? 'var(--pos-primary)' : 'var(--pos-text)',
              gap: 5,
              flexShrink: 0,
              fontWeight: 800,
              fontSize: 11.5,
              display: 'inline-flex',
              alignItems: 'center',
            }}
            title={t('caisse.tools') || 'Outils et clôture'}
          >
            <Settings size={14} />
            <span className="caisse-label-desktop">{t('caisse.tools')}</span>
          </button>

          {menuOutilsOuvert && (
            <>
              <div onClick={onToggleMenuOutils} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
              <div
                style={{
                  position: 'fixed',
                  top: 56,
                  right: 12,
                  background: isDarkMode ? '#1e293b' : 'var(--pos-surface, #ffffff)',
                  border: isDarkMode ? '1px solid #334155' : '1px solid var(--pos-border, #e2e8f0)',
                  borderRadius: 12,
                  padding: 8,
                  zIndex: 9999,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  minWidth: 220,
                }}
              >
                <div
                  style={{
                    padding: '4px 10px 6px',
                    borderBottom: isDarkMode ? '1px solid #334155' : '1px solid var(--pos-border, #f1f5f9)',
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: isDarkMode ? '#94a3b8' : 'var(--pos-text2, #94a3b8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {t('caisse.toolsTitle')}
                  </span>
                </div>

                {/* Changer de Caissier */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenModalChangerCaissier()
                    onToggleMenuOutils()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 12px',
                    width: '100%',
                    background: isDarkMode ? '#1e293b' : 'var(--pos-primary-bg, #fff7ed)',
                    border: isDarkMode ? '1px solid #334155' : '1px solid var(--pos-border, #fed7aa)',
                    color: 'var(--pos-primary, #ea580c)',
                    fontSize: 12.5,
                    fontWeight: 800,
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 8,
                    marginBottom: 4,
                  }}
                >
                  <User size={14} />
                  <span>Changer de caissier</span>
                </button>

                {/* Tiroir-Caisse & Clôture Z / Ouverture */}
                {session ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenModalTiroirCaisse()
                        onToggleMenuOutils()
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 12px',
                        width: '100%',
                        background: isDarkMode ? 'rgba(199, 91, 0, 0.15)' : '#fff7ed',
                        border: isDarkMode ? '1px solid rgba(199, 91, 0, 0.3)' : '1px solid #fed7aa',
                        color: 'var(--pos-primary, #ea580c)',
                        fontSize: 12.5,
                        fontWeight: 800,
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: 8,
                        marginBottom: 4,
                      }}
                    >
                      <Banknote size={14} />
                      <span>Tiroir-Caisse (Entrées / Sorties)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenModalClotureZ()
                        onToggleMenuOutils()
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 12px',
                        width: '100%',
                        background: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2',
                        border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #FECACA',
                        color: isDarkMode ? '#F87171' : '#DC2626',
                        fontSize: 12.5,
                        fontWeight: 800,
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: 8,
                        marginBottom: 4,
                      }}
                    >
                      <Lock size={14} />
                      <span>{t('caisse.closeZ') || 'Clôture Z (Fin de journée)'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenModalSessionOuverture()
                      onToggleMenuOutils()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 12px',
                      width: '100%',
                      background: isDarkMode ? 'rgba(22, 163, 74, 0.15)' : '#F0FDF4',
                      border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #BBF7D0',
                      color: isDarkMode ? '#4ADE80' : '#15803D',
                      fontSize: 12.5,
                      fontWeight: 800,
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: 8,
                      marginBottom: 4,
                    }}
                  >
                    <Unlock size={14} />
                    <span>{t('caisse.session') || 'Ouvrir une session de caisse'}</span>
                  </button>
                )}

                {roleActif === 'superviseur' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenModalBilanSession()
                        onToggleMenuOutils()
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        width: '100%',
                        background: isDarkMode ? '#0f172a' : 'var(--pos-primary-bg)',
                        border: isDarkMode ? '1px solid #334155' : '1px solid var(--pos-border)',
                        color: 'var(--pos-primary)',
                        fontSize: 12.5,
                        fontWeight: 800,
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: 8,
                        marginBottom: 2,
                      }}
                    >
                      <BarChart3 size={14} color="var(--pos-primary)" />
                      <span>{t('caisse.reportX')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenModalImportBatch()
                        onToggleMenuOutils()
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: isDarkMode ? '#ffffff' : 'var(--pos-text)',
                        fontSize: 12.5,
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: 8,
                      }}
                    >
                      <Download size={14} />
                      <span>{t('caisse.importBatch')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenConfigPin()
                        onToggleMenuOutils()
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: isDarkMode ? '#ffffff' : 'var(--pos-text)',
                        fontSize: 12.5,
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: 8,
                      }}
                    >
                      <Lock size={14} />
                      <span>{t('caisse.configPins')}</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onOpenModalHistorique()
                    onToggleMenuOutils()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: isDarkMode ? '#ffffff' : 'var(--pos-text)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 8,
                  }}
                >
                  <History size={14} />
                  <span>
                    {roleActif === 'superviseur' ? `${t('caisse.history')} (${historiqueVentesCount})` : 'Mes ventes récentes'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenModalCarnet()
                    onToggleMenuOutils()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: isDarkMode ? '#ffffff' : 'var(--pos-text)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 8,
                  }}
                >
                  <Book size={14} />
                  <span>{t('caisse.debts')} ({clientsCreditsCount})</span>
                </button>

                <div
                  style={{
                    borderTop: isDarkMode ? '1px solid #334155' : '1px solid var(--pos-border, #f1f5f9)',
                    margin: '4px 0',
                  }}
                />

                {/* Actions de Session POS : Fermer session et Déconnexion compte */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleMenuOutils()
                    onVerrouillerCaisseManuellement()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: isDarkMode ? '#f97316' : '#ea580c',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 8,
                    marginBottom: 2,
                  }}
                >
                  <Lock size={14} />
                  <span>Fermer session caissier (Qui encaisse ?)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleMenuOutils()
                    onSeDeconnecterCompte()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    width: '100%',
                    background: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2',
                    border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #FECACA',
                    color: isDarkMode ? '#F87171' : '#DC2626',
                    fontSize: 12.5,
                    fontWeight: 800,
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 8,
                  }}
                >
                  <LogOut size={14} />
                  <span>Déconnexion du compte Nopalou (Quitter)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Bouton Session Direct Desktop (Clôture Z / Ouvrir Session) */}
        {session ? (
          <button
            type="button"
            onClick={onOpenModalClotureZ}
            className="caisse-desktop-only"
            style={{
              height: 34,
              padding: '0 10px',
              borderRadius: 8,
              background: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#FEF2F2',
              border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.4)' : '1px solid #FECACA',
              color: isDarkMode ? '#F87171' : '#DC2626',
              fontWeight: 800,
              fontSize: 11.5,
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Clôturer la session de caisse (Rapport Z)"
          >
            <Lock size={12} />
            <span className="caisse-label-desktop">{t('caisse.closeZ')}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenModalSessionOuverture}
            style={{
              height: 34,
              padding: '0 10px',
              borderRadius: 8,
              background: isDarkMode ? 'rgba(220, 38, 38, 0.25)' : '#F0FDF4',
              border: isDarkMode ? '1px solid rgba(22, 163, 74, 0.5)' : '1px solid #BBF7D0',
              color: isDarkMode ? '#4ADE80' : '#15803D',
              fontWeight: 800,
              fontSize: 11.5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Ouvrir une nouvelle session de caisse"
          >
            <Unlock size={12} />
            <span className="caisse-label-desktop">{t('caisse.session')}</span>
          </button>
        )}

        {/* Bouton Fermer Session Caissier / Verrouiller */}
        <button
          type="button"
          onClick={onVerrouillerCaisseManuellement}
          title={`Fermer la session de ${caissierNom} et verrouiller (Retour à l'écran Qui encaisse)`}
          style={{
            height: 34,
            padding: '0 9px',
            borderRadius: 8,
            border: isDarkMode ? '1px solid #334155' : '1.5px solid var(--pos-border)',
            background: isDarkMode ? '#1e293b' : 'var(--pos-surface)',
            color: 'var(--pos-text)',
            fontWeight: 800,
            fontSize: 11.5,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: 'var(--pos-shadow)',
            transition: 'all 0.15s ease',
          }}
        >
          <Lock size={13} color="#ea580c" />
          <span className="caisse-label-desktop">Fermer session</span>
        </button>

        {/* Bouton Déconnexion du Compte Nopalou */}
        <button
          type="button"
          onClick={onSeDeconnecterCompte}
          title="Se déconnecter du compte Nopalou (Fermer l'accès et quitter)"
          style={{
            height: 34,
            padding: '0 10px',
            borderRadius: 8,
            background: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#FEF2F2',
            border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.4)' : '1px solid #FECACA',
            color: isDarkMode ? '#F87171' : '#DC2626',
            fontWeight: 800,
            fontSize: 11.5,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(220, 38, 38, 0.1)',
            transition: 'all 0.15s ease',
          }}
        >
          <LogOut size={13} />
          <span className="caisse-label-desktop">Déconnexion compte</span>
        </button>
      </div>
    </header>
  )
}
