'use client'

import React from 'react'
import { CheckCircle2, Copy, MessageCircle, Check } from 'lucide-react'
import { fcfa } from '@/lib/format'

interface ModalNouvelleCommandeSuccessProps {
  createdOrder: any
  wavePaymentUrl: string
  copied: boolean
  copierLien: () => void
  ouvrirWhatsApp: (cmd: any, payUrl: string, tel: string) => void
  clientTelephone: string
  onClose: () => void
}

export default function ModalNouvelleCommandeSuccess({
  createdOrder,
  wavePaymentUrl,
  copied,
  copierLien,
  ouvrirWhatsApp,
  clientTelephone,
  onClose,
}: ModalNouvelleCommandeSuccessProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', padding: '12px 0' }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#dcfce7',
          color: '#16a34a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckCircle2 size={36} />
      </div>

      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
          Commande enregistrée avec succès !
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
          Réf: <strong style={{ color: '#C75B00' }}>{createdOrder.reference}</strong> · Montant : <strong style={{ color: '#0f172a' }}>{fcfa(Number(createdOrder.montant_total))}</strong>
        </p>
      </div>

      {/* Boîte du lien Wave */}
      <div
        style={{
          width: '100%',
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: 12,
          padding: '14px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Lien de paiement Wave direct
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            readOnly
            value={wavePaymentUrl}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0284c7',
              fontSize: 12.5,
              fontWeight: 700,
            }}
          />
          <button
            type="button"
            onClick={copierLien}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: 'none',
              background: copied ? '#16a34a' : '#0f172a',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'background 0.15s',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>
      </div>

      {/* Bouton WhatsApp */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          type="button"
          onClick={() => ouvrirWhatsApp(createdOrder, wavePaymentUrl, clientTelephone)}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 12,
            border: 'none',
            background: '#25D366',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
          }}
        >
          <MessageCircle size={18} />
          Ouvrir WhatsApp et envoyer le message au client
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#475569',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
