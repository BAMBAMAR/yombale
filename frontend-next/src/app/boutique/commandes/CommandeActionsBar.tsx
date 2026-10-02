'use client'

import React from 'react'
import {
  Bike,
  RotateCcw,
  FileText,
  XCircle,
} from 'lucide-react'
import type { Commande } from './types'

interface CommandeActionsBarProps {
  commande: Commande
  loading: boolean
  onDispatch?: (c: Commande) => void
  onRetour?: (c: Commande) => void
  onFacture: () => void
  onAnnuler: () => void
  t: (key: string) => string
}

export default function CommandeActionsBar({
  commande,
  loading,
  onDispatch,
  onRetour,
  onFacture,
  onAnnuler,
  t,
}: CommandeActionsBarProps) {
  const canReturn = ['livree', 'expediee', 'confirmee'].includes(commande.statut)
  const canCancel = !['annulee', 'livree'].includes(commande.statut)

  return (
    <div
      style={{
        background: '#f8fafc',
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {t('shop.quickActions') || 'Actions secondaires & Documents'}
      </span>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Facture PDF */}
        <button
          type="button"
          onClick={onFacture}
          disabled={loading}
          style={{
            padding: '6px 12px',
            background: '#ffffff',
            color: 'var(--navy, #1C2B4A)',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
          title="Générer une facture PDF pour cette commande"
        >
          <FileText size={13} color="#0284c7" />
          <span>{t('shop.createInvoiceAction') || 'Facture PDF'}</span>
        </button>

        {/* Dispatch Livreur moto (affiché uniquement si non présent dans l'étape active) */}
        {!['confirmee', 'en_preparation'].includes(commande.statut) && onDispatch && (
          <button
            type="button"
            onClick={() => onDispatch(commande)}
            disabled={loading}
            style={{
              padding: '6px 12px',
              background: '#ffffff',
              color: 'var(--accent, #C75B00)',
              border: '1px solid #fed7aa',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
            title="Générer et envoyer la fiche de livraison aux livreurs"
          >
            <Bike size={13} />
            <span>Dispatch Livreur</span>
          </button>
        )}

        {/* Retour & Avoir */}
        {canReturn && onRetour && (
          <button
            type="button"
            onClick={() => onRetour(commande)}
            disabled={loading}
            style={{
              padding: '6px 12px',
              background: '#ffffff',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
            title="Enregistrer un retour client et émettre un bon d'avoir déductible"
          >
            <RotateCcw size={13} />
            <span>Retour &amp; Avoir</span>
          </button>
        )}

        {/* Annuler la commande */}
        {canCancel && (
          <button
            type="button"
            onClick={onAnnuler}
            disabled={loading}
            style={{
              padding: '6px 12px',
              background: '#ffffff',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
            title="Annuler cette commande"
          >
            <XCircle size={13} />
            <span>Annuler</span>
          </button>
        )}
      </div>
    </div>
  )
}
