'use client'

import React from 'react'
import {
  Shield,
  User,
  Sun,
  Moon,
  Columns3,
  Settings,
  Lock,
  Unlock,
  LogOut,
} from 'lucide-react'
import PosHeaderDropdownMenu from './PosHeaderDropdownMenu'

interface PosHeaderRightActionsProps {
  roleActif: 'caissier' | 'superviseur'
  caissierNom: string
  session: any | null
  isDarkMode: boolean
  layoutColCentrale: boolean
  menuOutilsOuvert: boolean
  clientsCreditsCount: number
  historiqueVentesCount: number
  initialToken?: string | null
  t: (key: string) => string
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
  onOpenModalMaterielGuide?: () => void
  onVerrouillerCaisseManuellement: () => void
  onSeDeconnecterCompte: () => void
}

export default function PosHeaderRightActions({
  roleActif,
  caissierNom,
  session,
  isDarkMode,
  layoutColCentrale,
  menuOutilsOuvert,
  clientsCreditsCount,
  historiqueVentesCount,
  initialToken,
  t,
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
  onOpenModalMaterielGuide,
  onVerrouillerCaisseManuellement,
  onSeDeconnecterCompte,
}: PosHeaderRightActionsProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
      {/* Espace Caissier Pro */}
      <button
        type="button"
        onClick={onOpenModalChangerCaissier}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: isDarkMode
            ? roleActif === 'superviseur'
              ? '#fff7ed'
              : '#1e293b'
            : roleActif === 'superviseur'
            ? '#fff7ed'
            : '#f8fafc',
          border: isDarkMode
            ? roleActif === 'superviseur'
              ? '1.5px solid #fed7aa'
              : '1.5px solid #334155'
            : roleActif === 'superviseur'
            ? '1.5px solid #fed7aa'
            : '1.5px solid #cbd5e1',
          borderRadius: 8,
          padding: '2px 8px 2px 4px',
          height: 34,
          cursor: 'pointer',
          flexShrink: 0,
        }}
        title="Cliquez pour changer de caissier ou verrouiller la session"
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background:
              roleActif === 'superviseur'
                ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          {roleActif === 'superviseur' ? (
            <Shield size={13} />
          ) : (
            <User size={13} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0 }}>
          <span
            title={caissierNom}
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: roleActif === 'superviseur' ? '#c2410c' : isDarkMode ? '#f8fafc' : '#0f172a',
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.1,
            }}
          >
            {caissierNom.split(' ')[0]}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: roleActif === 'superviseur' ? '#ea580c' : isDarkMode ? '#94a3b8' : '#64748b',
              lineHeight: 1,
            }}
          >
            {roleActif === 'superviseur' ? 'Superviseur' : 'Caissier'}
          </span>
        </div>
      </button>

      {/* Bouton Mode Nuit */}
      <button
        type="button"
        onClick={onToggleDarkMode}
        title={isDarkMode ? 'Passer en thème clair (jour)' : 'Passer en thème sombre (nuit)'}
        style={{
          height: 34,
          width: 34,
          padding: 0,
          borderRadius: 8,
          border: isDarkMode ? '1px solid #334155' : '1.5px solid var(--pos-border)',
          background: isDarkMode ? '#1e293b' : 'var(--pos-surface)',
          color: isDarkMode ? '#fbbf24' : 'var(--pos-text)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--pos-shadow)',
          flexShrink: 0,
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

        <PosHeaderDropdownMenu
          isOpen={menuOutilsOuvert}
          onClose={onToggleMenuOutils}
          isDarkMode={isDarkMode}
          session={session}
          roleActif={roleActif}
          historiqueVentesCount={historiqueVentesCount}
          clientsCreditsCount={clientsCreditsCount}
          t={t}
          onOpenModalChangerCaissier={onOpenModalChangerCaissier}
          onOpenModalTiroirCaisse={onOpenModalTiroirCaisse}
          onOpenModalClotureZ={onOpenModalClotureZ}
          onOpenModalSessionOuverture={onOpenModalSessionOuverture}
          onOpenModalBilanSession={onOpenModalBilanSession}
          onOpenModalImportBatch={onOpenModalImportBatch}
          onOpenConfigPin={onOpenConfigPin}
          onOpenModalHistorique={onOpenModalHistorique}
          onOpenModalCarnet={onOpenModalCarnet}
          onOpenModalMaterielGuide={onOpenModalMaterielGuide}
          onVerrouillerCaisseManuellement={onVerrouillerCaisseManuellement}
          onSeDeconnecterCompte={onSeDeconnecterCompte}
        />
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
  )
}
