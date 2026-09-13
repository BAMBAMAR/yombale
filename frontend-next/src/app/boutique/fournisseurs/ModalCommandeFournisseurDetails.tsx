'use client'

import React from 'react'
import { X, CheckCircle2, Clock, ExternalLink } from 'lucide-react'
import { fcfa } from '@/lib/format'
import type { CommandeFournisseur, Fournisseur } from './types'

interface ModalCommandeFournisseurDetailsProps {
  cmd: CommandeFournisseur | null
  fournisseurs: Fournisseur[]
  produits: any[]
  onFermer: () => void
  onOuvrirReception: (cmd: CommandeFournisseur) => void
  t: (key: string) => string
}

export default function ModalCommandeFournisseurDetails({
  cmd,
  fournisseurs,
  produits,
  onFermer,
  onOuvrirReception,
  t,
}: ModalCommandeFournisseurDetailsProps) {
  if (!cmd) return null

  const fou = fournisseurs.find((f) => f.id === cmd.fournisseur_id)
  const isRecue = cmd.statut === 'recu' || cmd.statut === 'recue'
  const items: any[] =
    typeof cmd.items === 'string' ? JSON.parse(cmd.items || '[]') : cmd.items || []

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: 24,
          width: '100%',
          maxWidth: 650,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>
              {t('shop.purchaseOrderDetailsHeader')} {cmd.reference}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
              {t('shop.supplierColonLabel')} <strong>{fou?.nom || '—'}</strong>
            </p>
          </div>
          <button
            onClick={onFermer}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Informations synthétiques */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 16,
            background: '#f8fafc',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #e2e8f0',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t('shop.orderStatusLabel')}</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: isRecue ? '#065f46' : '#9a3412',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 2,
              }}
            >
              {isRecue ? <CheckCircle2 size={13} /> : <Clock size={13} />}
              <span>{isRecue ? t('shop.statusReceivedBadge') : t('shop.statusPendingBadge')}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t('shop.orderCreationDateLabel')}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
              {new Date(cmd.created_at || cmd.date_commande || Date.now()).toLocaleDateString('fr-FR')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t('shop.orderTotalAmountLabel')}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--price, #0A5C36)', marginTop: 2 }}>
              {fcfa(cmd.montant_total ?? cmd.total_achat ?? 0)}
            </div>
          </div>
          {cmd.justificatif_url && (
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t('shop.orderReceiptProofLabel')}</div>
              <a
                href={cmd.justificatif_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#0284c7',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 2,
                }}
              >
                <ExternalLink size={12} />
                <span>{t('shop.viewReceiptAttachmentLink')}</span>
              </a>
            </div>
          )}
        </div>

        {/* Tableau des articles commandés */}
        <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: '#1f2937' }}>
          {t('shop.orderedArticlesDetailHeader')}
        </h4>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: 10, color: '#374151', fontWeight: 700 }}>{t('shop.article')}</th>
                <th style={{ padding: 10, color: '#374151', fontWeight: 700, textAlign: 'right' }}>
                  {t('shop.quantityLabel')}
                </th>
                <th style={{ padding: 10, color: '#374151', fontWeight: 700, textAlign: 'right' }}>
                  {t('shop.unitPriceLabel')}
                </th>
                <th style={{ padding: 10, color: '#374151', fontWeight: 700, textAlign: 'right' }}>
                  {t('shop.lineTotalCmdLabel')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => {
                const pObj = produits.find((p) => p.id === item.id || p.id === item.produitId)
                const nomArt = item.nom || item.nomLibre || pObj?.nom || '—'
                const qteArt = Number(item.quantite || 1)
                const puArt = Number(item.prix_achat || item.prixAchat || item.prix || 0)
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{nomArt}</td>
                    <td style={{ padding: 10, textAlign: 'right', fontWeight: 700 }}>{qteArt}</td>
                    <td style={{ padding: 10, textAlign: 'right' }}>{fcfa(puArt)}</td>
                    <td style={{ padding: 10, textAlign: 'right', fontWeight: 700 }}>{fcfa(puArt * qteArt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {!isRecue && (
            <button
              onClick={() => {
                const target = cmd
                onFermer()
                onOuvrirReception(target)
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'var(--price, #0A5C36)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CheckCircle2 size={14} />
              <span>{t('shop.receiveNowBtn')}</span>
            </button>
          )}
          <button
            onClick={onFermer}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
