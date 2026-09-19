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
  ChevronRight,
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

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (name.slice(0, 2) || 'CL').toUpperCase()
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

  if (isMobile) {
    return (
      <div
        onClick={() => onOuvrirFicheClient(c)}
        className="npl-card"
        style={{
          boxShadow: isActif ? '0 0 0 2px var(--navy, #1C2B4A), 0 4px 14px rgba(28, 43, 74, 0.08)' : '0 2px 8px rgba(28, 43, 74, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: '16px',
          borderRadius: 16,
          background: '#ffffff',
          border: '1.5px solid var(--border, #E8DDD2)',
          cursor: 'pointer',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        {/* Ligne Supérieure : Avatar + Nom + Bouton Rappel WhatsApp */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {/* Avatar Initiales */}
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: estDebiteur
                  ? 'linear-gradient(135deg, #1C2B4A 0%, #2A3E66 100%)'
                  : estAvance
                  ? 'linear-gradient(135deg, #0A5C36 0%, #15803D 100%)'
                  : 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            >
              {getInitials(c.nom)}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15.5,
                  fontWeight: 800,
                  color: 'var(--navy, #1C2B4A)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {formatNomPropre(c.nom)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2, #6B7280)', marginTop: 2 }}>
                {c.telephone ? formatPhone(c.telephone) : 'Client régulier'}
              </div>
            </div>
          </div>

          {/* Bouton Rappel WhatsApp Pill */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRelancerWhatsApp(c)
            }}
            style={{
              background: 'linear-gradient(135deg, var(--accent, #C75B00) 0%, #EA580C 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 999,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(199, 91, 0, 0.25)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <MessageCircle size={13} />
            <span>Rappel WhatsApp</span>
          </button>
        </div>

        {/* Ligne Inférieure : Montant & Statut avec Chevron */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 10,
            borderTop: '1px solid var(--border, #F1F5F9)',
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: estDebiteur ? 'var(--navy, #1C2B4A)' : estAvance ? 'var(--price, #0A5C36)' : 'var(--text2, #64748B)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {soldeNum !== 0 ? fcfa(Math.abs(soldeNum)) : '0 FCFA'}
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: estDebiteur ? '#FEF2F2' : estAvance ? '#F0FDF4' : '#F8FAFC',
              border: estDebiteur ? '1px solid #FECACA' : estAvance ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              color: estDebiteur ? '#DC2626' : estAvance ? 'var(--price, #0A5C36)' : '#64748B',
            }}
          >
            <span>{estDebiteur ? 'Dette Active' : estAvance ? 'Avance reçue' : 'À jour'}</span>
            <ChevronRight size={13} />
          </div>
        </div>
      </div>
    )
  }

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
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* En-tête de la Carte Client */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', width: '100%', minWidth: 0 }}>
        <div style={{ flex: '1 1 140px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy, #1C2B4A)', wordBreak: 'break-word' }}>
              {formatNomPropre(c.nom)}
            </span>
            {c.statut === 'bloque' && (
              <span className="npl-badge npl-badge-danger" style={{ whiteSpace: 'nowrap' }}>
                <span className="npl-badge-dot" />
                <span>{t('shop.blacklistedBadge')}</span>
              </span>
            )}
            {Number(c.plafond_max) > 0 && Number(c.solde) > Number(c.plafond_max) && (
              <span className="npl-badge" style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 12, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
                <span>Plafond dépassé</span>
              </span>
            )}
            {c.adresse && (
              <span className="npl-badge npl-badge-neutral" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                {c.adresse}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text2, #64748b)', marginTop: 3, wordBreak: 'break-word', minWidth: 0 }}>
            <span>{formatPhone(c.telephone)}</span>
            {c.plafond_max > 0 ? <span> • {t('shop.creditLimitPrefix')}: {fcfa(c.plafond_max)}</span> : null}
          </div>
          {c.note_client && (
            <div style={{ fontSize: 11.5, color: 'var(--text3, #94a3b8)', fontStyle: 'italic', marginTop: 2, wordBreak: 'break-word' }}>
              {t('common.notes')}: {c.note_client}
            </div>
          )}
        </div>

        {/* Montant & Statut */}
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: estDebiteur ? '#dc2626' : estAvance ? '#16a34a' : 'var(--text2, #64748b)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {estDebiteur
              ? `Doit : ${fcfa(soldeNum)}`
              : estAvance
              ? `Avance : ${fcfa(Math.abs(soldeNum))}`
              : '0 FCFA (À jour)'}
          </div>
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            {estDebiteur ? (
              <span className="npl-badge npl-badge-danger" style={{ whiteSpace: 'nowrap' }}>
                <span className="npl-badge-dot" />
                <span>{t('shop.owesShopBadge')}</span>
              </span>
            ) : estAvance ? (
              <span className="npl-badge npl-badge-success" style={{ whiteSpace: 'nowrap' }}>
                <span className="npl-badge-dot" />
                <span>{t('shop.advanceBadge')}</span>
              </span>
            ) : (
              <span className="npl-badge npl-badge-neutral" style={{ whiteSpace: 'nowrap' }}>
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
          gap: 6,
          paddingTop: 10,
          borderTop: '1px solid var(--border, #f1f5f9)',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          minWidth: 0,
          width: '100%',
        }}
      >
        {estDebiteur ? (
          <button
            type="button"
            onClick={() => onOuvrirModalTransaction('remboursement', c)}
            className="npl-btn npl-btn-success npl-btn-sm"
            style={{ flex: '1 1 120px', minWidth: 90, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0 8px', whiteSpace: 'nowrap' }}
          >
            <ArrowDownLeft size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.collectRepayBtn')}</span>
          </button>
        ) : estAvance ? (
          <button
            type="button"
            onClick={() => onOuvrirModalTransaction('vente_credit', c)}
            className="npl-btn npl-btn-accent npl-btn-sm"
            style={{ flex: '1 1 120px', minWidth: 90, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0 8px', whiteSpace: 'nowrap' }}
          >
            <ArrowUpRight size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.deductOnPurchaseBtn')}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOuvrirModalTransaction('vente_credit', c)}
            className="npl-btn npl-btn-primary npl-btn-sm"
            style={{ flex: '1 1 120px', minWidth: 90, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0 8px', whiteSpace: 'nowrap' }}
          >
            <Plus size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.giveCreditBtn')}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onRelancerWhatsApp(c)}
          className="npl-btn npl-btn-secondary npl-btn-sm"
          title="WhatsApp"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flex: '0 0 auto', padding: '0 10px', whiteSpace: 'nowrap' }}
        >
          <MessageCircle size={14} color="#25D366" />
          <span>{t('shop.remindWhatsappBtn')}</span>
        </button>

        <div className="npl-dropdown" style={{ position: 'relative', flexShrink: 0 }}>
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
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, padding: 0 }}
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
