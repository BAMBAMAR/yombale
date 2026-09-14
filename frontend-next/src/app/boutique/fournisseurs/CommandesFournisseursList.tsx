'use client'

import React, { useState } from 'react'
import { Plus, Search, Eye, Edit2, Trash2, CheckCircle2, FileText, Clock } from 'lucide-react'
import { fcfa } from '@/lib/format'
import type { CommandeFournisseur, Fournisseur } from './types'

interface CommandesFournisseursListProps {
  commandes: CommandeFournisseur[]
  fournisseurs: Fournisseur[]
  loading: boolean
  onNouvelleCommande: () => void
  onEditerCommande: (cmd: CommandeFournisseur) => void
  onVoirDetailsCommande: (cmd: CommandeFournisseur) => void
  onOuvrirReception: (cmd: CommandeFournisseur) => void
  onSupprimerCommande: (cmdId: string, ref: string) => void
  t: (key: string) => string
}

export default function CommandesFournisseursList({
  commandes,
  fournisseurs,
  loading,
  onNouvelleCommande,
  onEditerCommande,
  onVoirDetailsCommande,
  onOuvrirReception,
  onSupprimerCommande,
  t,
}: CommandesFournisseursListProps) {
  const [rechercheCommande, setRechercheCommande] = useState<string>('')
  const [filtreStatutCmd, setFiltreStatutCmd] = useState<string>('tous')

  const qCmd = rechercheCommande.trim().toLowerCase()
  const commandesFiltrees = commandes.filter((cmd) => {
    const isRecue = cmd.statut === 'recu' || cmd.statut === 'recue'
    const matchStatut = filtreStatutCmd === 'tous' || (filtreStatutCmd === 'recue' ? isRecue : !isRecue)
    const fouNom = (fournisseurs.find((f) => f.id === cmd.fournisseur_id)?.nom || '').toLowerCase()
    const matchSearch = !qCmd || cmd.reference?.toLowerCase().includes(qCmd) || fouNom.includes(qCmd)
    return matchStatut && matchSearch
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Outils, Recherche & Filtres Bons de Commande */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={rechercheCommande}
              onChange={(e) => setRechercheCommande(e.target.value)}
              placeholder={t('shop.searchPurchaseOrderPlaceholder')}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
                background: '#ffffff',
              }}
            />
          </div>
          <select
            value={filtreStatutCmd}
            onChange={(e) => setFiltreStatutCmd(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#fff',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="tous">{t('shop.allPurchaseStatuses')}</option>
            <option value="attente">{t('shop.pendingStatusOption')}</option>
            <option value="recue">{t('shop.receivedStatusOption')}</option>
          </select>
        </div>
        <button
          onClick={onNouvelleCommande}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: 'var(--price, #0A5C36)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={15} />
          <span>{t('shop.newPurchaseOrderBtn')}</span>
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#6b7280', fontSize: 14 }}>{t('common.loading')}</p>
      ) : commandesFiltrees.length === 0 ? (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '40px 20px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <FileText size={32} style={{ margin: '0 auto 8px', color: '#94a3b8', display: 'block' }} />
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>{t('common.noData')}</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>{t('shop.colReferenceHeader')}</th>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>{t('shop.colSupplierHeader')}</th>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>{t('shop.colTotalAmountHeader')}</th>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>{t('shop.colDateHeader')}</th>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>{t('shop.orderStatusLabel')}</th>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {commandesFiltrees.map((cmd) => {
                const fou = fournisseurs.find((f) => f.id === cmd.fournisseur_id)
                const totalVal = Number(cmd.montant_total ?? cmd.total_achat ?? 0)
                const rawDate = cmd.created_at || cmd.date_commande || cmd.date_livraison
                const dateFmt = rawDate ? new Date(rawDate).toLocaleDateString('fr-FR') : '—'
                const isRecue = cmd.statut === 'recu' || cmd.statut === 'recue'

                return (
                  <tr key={cmd.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 12, fontWeight: 700 }}>{cmd.reference}</td>
                    <td style={{ padding: 12 }}>{fou ? fou.nom : '—'}</td>
                    <td style={{ padding: 12, fontWeight: 700 }}>{fcfa(totalVal)}</td>
                    <td style={{ padding: 12 }}>{dateFmt}</td>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          background: isRecue ? '#d1fae5' : '#fee2e2',
                          color: isRecue ? '#065f46' : '#9a3412',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isRecue ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        <span>{isRecue ? t('shop.statusReceivedBadge') : t('shop.statusPendingBadge')}</span>
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {!isRecue && (
                          <button
                            onClick={() => onOuvrirReception(cmd)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              background: 'var(--price, #0A5C36)',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <CheckCircle2 size={12} />
                            <span>{t('shop.receiveNowBtn')}</span>
                          </button>
                        )}
                        {!isRecue && (
                          <button
                            onClick={() => onEditerCommande(cmd)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Edit2 size={12} />
                            <span>{t('common.edit')}</span>
                          </button>
                        )}
                        <button
                          onClick={() => onVoirDetailsCommande(cmd)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            background: '#f0f9ff',
                            color: '#0284c7',
                            border: '1px solid #bae6fd',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Eye size={12} />
                          <span>{t('common.details')}</span>
                        </button>
                        <button
                          onClick={() => onSupprimerCommande(cmd.id, cmd.reference)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title="Supprimer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
