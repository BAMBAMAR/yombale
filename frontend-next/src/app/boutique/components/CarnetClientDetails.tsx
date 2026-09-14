'use client'

import { fcfa, fmtDate, fmtDateHeure } from '@/lib/format'
import { useTranslation } from '@/i18n/context'
import { Plus, ArrowDownLeft, Printer, MessageCircle, Edit3, X, ArrowLeft } from 'lucide-react'
import CarnetPlansEchelonnes from '../carnet/components/CarnetPlansEchelonnes'

export interface ClientCredit {
  id: string
  boutique_id: string
  nom: string
  telephone: string
  adresse?: string | null
  solde: number
  plafond_max: number
  statut?: 'actif' | 'bloque' | 'archive'
  note_client?: string | null
  created_at?: string
  historique?: TransactionCredit[]
}

export interface TransactionCredit {
  id: string
  client_id: string
  boutique_id: string
  type: 'vente_credit' | 'remboursement' | 'depot_avance'
  montant: number
  mode_paiement: string
  note?: string | null
  produits?: any[]
  date_echeance?: string | null
  relance_auto_whatsapp?: boolean
  derniere_relance_whatsapp?: string | null
  created_at: string
}

interface CarnetClientDetailsProps {
  client: ClientCredit
  historique: TransactionCredit[]
  loadingHist: boolean
  isMobile: boolean
  onClose: () => void
  onEditClient: (client: ClientCredit) => void
  onOpenTransaction: (type: 'vente_credit' | 'remboursement') => void
  onExportRelevePDF: () => void
  onRelanceWhatsApp: (client: ClientCredit) => void
}

export default function CarnetClientDetails({
  client,
  historique,
  loadingHist,
  isMobile,
  onClose,
  onEditClient,
  onOpenTransaction,
  onExportRelevePDF,
  onRelanceWhatsApp,
}: CarnetClientDetailsProps) {
  const { t } = useTranslation()
  const soldeNum = Number(client.solde)

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 18,
      padding: isMobile ? '16px' : '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      boxShadow: '0 4px 16px rgba(15,23,42,0.06)'
    }}>
      {/* Bouton Retour Liste sur Mobile */}
      {isMobile && (
        <button
          type="button"
          onClick={() => {
            onClose()
            if (typeof window !== 'undefined' && window.history.state?.clientDetail) {
              window.history.back()
            }
          }}
          style={{
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            color: '#0f172a',
            padding: '8px 14px',
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            alignSelf: 'flex-start',
            minHeight: 38
          }}
        >
          <ArrowLeft size={16} />
          <span>{t('shop.backToCustomerListBtn')}</span>
        </button>
      )}

      {/* En-tête Fiche Client */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{client.nom}</h2>
            <button
              type="button"
              onClick={() => onEditClient(client)}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#475569',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Edit3 size={12} />
              <span>{t('common.edit')}</span>
            </button>
            {!isMobile && (
              <button
                type="button"
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2, display: 'inline-flex', alignItems: 'center' }}
                title={t('common.close')}
              >
                <X size={18} />
              </button>
            )}
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
            {client.telephone} {client.adresse ? `• ${client.adresse}` : ''}
          </p>
          {client.note_client && (
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>
              {t('common.notes')}: {client.note_client}
            </p>
          )}
        </div>

        <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t('shop.currentBalanceLabel')}</span>
          <div style={{
            fontSize: 19,
            fontWeight: 900,
            color: soldeNum > 0 ? '#dc2626' : soldeNum < 0 ? '#16a34a' : '#0f172a'
          }}>
            {soldeNum > 0 ? `Doit : ${fcfa(client.solde)}` : soldeNum < 0 ? `Avance : ${fcfa(Math.abs(soldeNum))}` : '0 FCFA (À jour)'}
          </div>
        </div>
      </div>

      {/* Actions Rapides */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onOpenTransaction('vente_credit')}
          style={{
            flex: 1,
            minWidth: 120,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 12px',
            fontWeight: 800,
            fontSize: 12.5,
            cursor: 'pointer',
            minHeight: 42,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <Plus size={14} />
          <span>{t('shop.transactionCreditSale')}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenTransaction('remboursement')}
          style={{
            flex: 1,
            minWidth: 120,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 12px',
            fontWeight: 800,
            fontSize: 12.5,
            cursor: 'pointer',
            minHeight: 42,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <ArrowDownLeft size={14} />
          <span>{t('shop.transactionRepayment')}</span>
        </button>

        <button
          type="button"
          onClick={onExportRelevePDF}
          style={{
            flex: 1,
            minWidth: 140,
            background: '#7c3aed',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 12px',
            fontWeight: 800,
            fontSize: 12.5,
            cursor: 'pointer',
            minHeight: 42,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
          title={t('shop.printPdfStatementBtn')}
        >
          <Printer size={14} />
          <span>{t('shop.printPdfStatementBtn')}</span>
        </button>

        {soldeNum > 0 && (
          <button
            type="button"
            onClick={() => onRelanceWhatsApp(client)}
            style={{
              flex: isMobile ? 1 : 'none',
              minWidth: isMobile ? 120 : 'auto',
              background: '#25D366',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 14px',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minHeight: 42
            }}
          >
            <MessageCircle size={15} />
            <span>{t('shop.remindWhatsappBtn')}</span>
          </button>
        )}
      </div>

      {/* Plans d'échelonnement et échéances du client */}
      <CarnetPlansEchelonnes
        boutiqueId={client.boutique_id}
        clientId={client.id}
        clientNom={client.nom}
        clientTelephone={client.telephone}
        onPlanUpdated={() => {
          // Recharger les données si nécessaire
        }}
      />

      {/* Historique des opérations */}
      <div>
        <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
          {t('shop.operationsHistoryTitle')}
        </h3>

        {loadingHist ? (
          <div style={{ fontSize: 13, color: '#64748b' }}>{t('common.loading')}</div>
        ) : historique.length === 0 ? (
          <div style={{ fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
            {t('shop.noTransactionsForCustomer')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
            {historique.map(h => {
              const estVente = h.type === 'vente_credit'
              const dateEch = h.date_echeance ? new Date(h.date_echeance) : null
              const estEnRetard = dateEch && dateEch < new Date() && estVente

              return (
                <div
                  key={h.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 6,
                        background: estVente ? '#fef2f2' : '#f0fdf4',
                        color: estVente ? '#991b1b' : '#166534',
                        border: estVente ? '1px solid #fecaca' : '1px solid #bbf7d0'
                      }}>
                        {estVente ? `${t('shop.transactionCreditSale')}` : `${t('shop.transactionRepayment')}`}
                      </span>
                      <span style={{ fontSize: 11.5, color: '#64748b' }}>
                        {fmtDateHeure(h.created_at)}
                      </span>
                    </div>

                    {h.note && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginTop: 3 }}>
                        {h.note}
                      </div>
                    )}

                    {Array.isArray(h.produits) && h.produits.length > 0 && (
                      <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {h.produits.map((item: any, idx: number) => (
                          <span key={idx} style={{ fontSize: 10, background: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: 4 }}>
                            {item.nom} (x{item.quantite})
                          </span>
                        ))}
                      </div>
                    )}

                    {h.date_echeance && (
                      <div style={{ fontSize: 11, marginTop: 4, color: estEnRetard ? '#dc2626' : '#0284c7', fontWeight: 700 }}>
                        {t('shop.dueDateLabel')} : {fmtDate(h.date_echeance)} {estEnRetard ? ` (${t('shop.overdueBadge')})` : ''}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: estVente ? '#dc2626' : '#16a34a'
                    }}>
                      {estVente ? `+ ${fcfa(h.montant)}` : `- ${fcfa(h.montant)}`}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                      {h.mode_paiement || 'Espèces'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
