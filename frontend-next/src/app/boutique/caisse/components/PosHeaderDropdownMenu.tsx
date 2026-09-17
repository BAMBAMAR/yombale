'use client'

import React from 'react'
import {
  User,
  Banknote,
  Lock,
  Unlock,
  BarChart3,
  Download,
  History,
  Book,
  Printer,
  LogOut,
} from 'lucide-react'

interface PosHeaderDropdownMenuProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode: boolean
  session: any | null
  roleActif: 'caissier' | 'superviseur'
  historiqueVentesCount: number
  clientsCreditsCount: number
  t: (key: string) => string
  onOpenModalChangerCaissier: () => void
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

export default function PosHeaderDropdownMenu({
  isOpen,
  onClose,
  isDarkMode,
  session,
  roleActif,
  historiqueVentesCount,
  clientsCreditsCount,
  t,
  onOpenModalChangerCaissier,
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
}: PosHeaderDropdownMenuProps) {
  if (!isOpen) return null

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
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
            onClose()
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
                onClose()
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
                onClose()
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
              onClose()
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
                onClose()
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
                onClose()
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
                onClose()
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
            onClose()
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
            onClose()
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

        {onOpenModalMaterielGuide && (
          <button
            type="button"
            onClick={() => {
              onOpenModalMaterielGuide()
              onClose()
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
            <Printer size={14} />
            <span>Matériel & Imprimante POS</span>
          </button>
        )}

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
            onClose()
            onVerrouillerCaisseManuellement()
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 12px',
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
            onClose()
            onSeDeconnecterCompte()
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
          }}
        >
          <LogOut size={14} />
          <span>Déconnexion du compte Nopalou (Quitter)</span>
        </button>
      </div>
    </>
  )
}
