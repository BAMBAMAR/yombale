'use client'

import React from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  MessageCircle,
  MoreHorizontal,
  FileText,
  Edit,
  ShieldCheck,
  Ban,
  Trash2,
  Plus,
} from 'lucide-react'
import { fcfa, formatNomPropre, formatPhone } from '@/lib/format'
import type { ClientCredit } from '../types'

interface CarnetClientCardItemProps {
  client: ClientCredit
  isMobile: boolean
  isActif: boolean
  isMenuOpen: boolean
  t: (key: string) => string
  onToggleMenu: () => void
  onCloseMenu: () => void
  onOuvrirFicheClient: (c: ClientCredit) => void
  onOuvrirModalEditClient: (c: ClientCredit) => void
  onOuvrirModalTransaction: (type: 'vente_credit' | 'remboursement', c: ClientCredit) => void
  onRelancerWhatsApp: (c: ClientCredit) => void
  onChangerStatutClient: (c: ClientCredit, statut: 'actif' | 'bloque' | 'archive') => void
  onSupprimerClient: (c: ClientCredit) => void
}

export default function CarnetClientCardItem({
  client: c,
  isMobile,
  isActif,
  isMenuOpen,
  t,
  onToggleMenu,
  onCloseMenu,
  onOuvrirFicheClient,
  onOuvrirModalEditClient,
  onOuvrirModalTransaction,
  onRelancerWhatsApp,
  onChangerStatutClient,
  onSupprimerClient,
}: CarnetClientCardItemProps) {
  const soldeNum = Number(c.solde)
  const estDebiteur = soldeNum > 0
  const estAvance = soldeNum < 0

  return (
    <div
      className="npl-card"
      style={{
        boxShadow: isActif ? '0 0 0 1px var(--navy, #1C2B4A), var(--shadow2)' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        background: '#ffffff',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: isActif ? 'var(--navy, #1C2B4A)' : 'var(--border, #e2e8f0)',
      }}
    >
      {/* En-tête de la Carte Client */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
              {formatNomPropre(c.nom)}
            </span>
            {c.statut === 'bloque' && (
              <span className="npl-badge npl-badge-danger">
                <span className="npl-badge-dot" />
                <span>{t('shop.blacklistedBadge')}</span>
              </span>
            )}
            {Number(c.plafond_max) > 0 && Number(c.solde) > Number(c.plafond_max) && (
              <span className="npl-badge" style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 12, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
                <span>Plafond dépassé</span>
              </span>
            )}
            {c.adresse && (
              <span className="npl-badge npl-badge-neutral" style={{ fontSize: 11 }}>
                {c.adresse}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text2, #64748b)', marginTop: 3 }}>
            {formatPhone(c.telephone)}{' '}
            {c.plafond_max > 0 ? `• ${t('shop.creditLimitPrefix')}: ${fcfa(c.plafond_max)}` : ''}
          </div>
          {c.note_client && (
            <div style={{ fontSize: 11.5, color: 'var(--text3, #94a3b8)', fontStyle: 'italic', marginTop: 2 }}>
              {t('common.notes')}: {c.note_client}
            </div>
          )}
        </div>

        {/* Montant & Statut */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: estDebiteur ? '#dc2626' : estAvance ? '#16a34a' : 'var(--text2, #64748b)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {estDebiteur
              ? `Doit : ${fcfa(soldeNum)}`
              : estAvance
              ? `Avance : ${fcfa(Math.abs(soldeNum))}`
              : '0 FCFA (À jour)'}
          </div>
          <div style={{ marginTop: 4 }}>
            {estDebiteur ? (
              <span className="npl-badge npl-badge-danger">
                <span className="npl-badge-dot" />
                <span>{t('shop.owesShopBadge')}</span>
              </span>
            ) : estAvance ? (
              <span className="npl-badge npl-badge-success">
                <span className="npl-badge-dot" />
                <span>{t('shop.advanceBadge')}</span>
              </span>
            ) : (
              <span className="npl-badge npl-badge-neutral">
                <span className="npl-badge-dot" />
                <span>{t('shop.zeroBalanceBadge')}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Barre d'Actions */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          paddingTop: 10,
          borderTop: '1px solid var(--border, #f1f5f9)',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        {estDebiteur ? (
          <button
            type="button"
            onClick={() => onOuvrirModalTransaction('remboursement', c)}
            className="npl-btn npl-btn-success npl-btn-sm"
            style={{ flex: isMobile ? '1 1 auto' : 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <ArrowDownLeft size={14} />
            <span>{t('shop.collectRepayBtn')}</span>
          </button>
        ) : estAvance ? (
          <button
            type="button"
            onClick={() => onOuvrirModalTransaction('vente_credit', c)}
            className="npl-btn npl-btn-accent npl-btn-sm"
            style={{ flex: isMobile ? '1 1 auto' : 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <ArrowUpRight size={14} />
            <span>{t('shop.deductOnPurchaseBtn')}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOuvrirModalTransaction('vente_credit', c)}
            className="npl-btn npl-btn-primary npl-btn-sm"
            style={{ flex: isMobile ? '1 1 auto' : 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Plus size={14} />
            <span>{t('shop.giveCreditBtn')}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onRelancerWhatsApp(c)}
          className="npl-btn npl-btn-secondary npl-btn-sm"
          title="WhatsApp"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <MessageCircle size={14} color="#25D366" />
          <span>{t('shop.remindWhatsappBtn')}</span>
        </button>

        <div className="npl-dropdown" style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleMenu()
            }}
            className="npl-btn npl-btn-secondary npl-btn-sm npl-btn-icon"
            title={t('shop.moreActionsBtn')}
            aria-label={t('shop.moreActionsBtn')}
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <MoreHorizontal size={16} />
          </button>

          {isMenuOpen && (
            <div
              className="npl-dropdown-menu"
              role="menu"
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                zIndex: 50,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                padding: 6,
                minWidth: 180,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onCloseMenu()
                  onOuvrirFicheClient(c)
                }}
                className="npl-dropdown-item"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12.5 }}
              >
                <FileText size={14} />
                <span>{t('shop.viewCustomerFileMenu')}</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onCloseMenu()
                  onOuvrirModalEditClient(c)
                }}
                className="npl-dropdown-item"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12.5 }}
              >
                <Edit size={14} />
                <span>{t('shop.editProfileLimitMenu')}</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onCloseMenu()
                  onOuvrirModalTransaction('vente_credit', c)
                }}
                className="npl-dropdown-item"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12.5 }}
              >
                <ArrowUpRight size={14} />
                <span>{t('shop.grantCreditAction')}</span>
              </button>

              <div style={{ height: 1, background: 'var(--border, #f1f5f9)', margin: '4px 0' }} />

              {c.statut === 'bloque' ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onCloseMenu()
                    onChangerStatutClient(c, 'actif')
                  }}
                  className="npl-dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12.5 }}
                >
                  <ShieldCheck size={14} color="#16a34a" />
                  <span>{t('shop.reactivateCustomerMenu')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onCloseMenu()
                    onChangerStatutClient(c, 'bloque')
                  }}
                  className="npl-dropdown-item danger"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, color: '#dc2626' }}
                >
                  <Ban size={14} />
                  <span>{t('shop.blacklistCustomerMenu')}</span>
                </button>
              )}

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onCloseMenu()
                  onSupprimerClient(c)
                }}
                className="npl-dropdown-item danger"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, color: '#dc2626' }}
              >
                <Trash2 size={14} />
                <span>{t('shop.deleteCustomerMenu')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
