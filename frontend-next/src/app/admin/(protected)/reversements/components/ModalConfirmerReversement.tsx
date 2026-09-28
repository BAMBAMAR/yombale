import React from 'react'
import { Send, CheckCircle2 } from 'lucide-react'

export interface ReversementItem {
  id: string
  reference: string
  montant_total: number
  montant_commission: number
  methode_paiement: string
  statut: string
  created_at: string
  boutique_nom: string
  boutique_telephone: string
  boutique_whatsapp: string
  boutique_id: string
  marchant_nom?: string
  marchant_telephone?: string
}

interface ModalConfirmerReversementProps {
  itemToPay: {
    item: ReversementItem
    mode: 'wave_api' | 'manuel'
  }
  onClose: () => void
  onConfirm: (item: ReversementItem, mode: 'wave_api' | 'manuel') => void
}

export function ModalConfirmerReversement({
  itemToPay,
  onClose,
  onConfirm,
}: ModalConfirmerReversementProps) {
  const { item, mode } = itemToPay
  const frais = Math.round(Number(item.montant_total) * 0.02)
  const netAmount = Math.max(0, Number(item.montant_total) - (Number(item.montant_commission) || 0) - frais)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 24,
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: mode === 'wave_api' ? '#eff6ff' : '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mode === 'wave_api' ? (
              <Send size={20} color="#1d4ed8" />
            ) : (
              <CheckCircle2 size={20} color="#16a34a" />
            )}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1e293b' }}>
              {mode === 'wave_api' ? 'Confirmer le Payout Wave 1-Clic' : 'Confirmer le Reversement Manuel'}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              Commande {item.reference}
            </p>
          </div>
        </div>

        <div
          style={{
            background: '#F8F5F0',
            border: '1px solid #E8DDD2',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>Boutique destinataire :</span>
            <span style={{ fontWeight: 800, color: '#1C2B4A' }}>{item.boutique_nom}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>Numéro Wave :</span>
            <span style={{ fontWeight: 800, color: '#1d4ed8' }}>
              {item.boutique_whatsapp || item.boutique_telephone || 'Inconnu'}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid #E8DDD2',
              paddingTop: 8,
              marginTop: 8,
              fontSize: 15,
            }}
          >
            <span style={{ fontWeight: 800, color: '#1C2B4A' }}>Montant Net Vendeur :</span>
            <span style={{ fontWeight: 900, color: '#0A5C36', fontSize: 16 }}>
              {netAmount.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
          {mode === 'wave_api'
            ? 'Ce montant sera immédiatement débité du compte Wave Business Nopalou et crédité sur le compte Wave du commerçant. Une confirmation WhatsApp lui sera transmise automatiquement.'
            : 'La commande sera marquée comme reversée sans appel API. Utilisez ce mode si vous avez déjà transféré les fonds manuellement depuis votre téléphone.'}
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#475569',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() => onConfirm(item, mode)}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              border: 'none',
              background: mode === 'wave_api' ? '#1d4ed8' : '#16a34a',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {mode === 'wave_api' ? <Send size={14} /> : <CheckCircle2 size={14} />}
            <span>{mode === 'wave_api' ? 'Exécuter le Virement Wave' : 'Valider le Versement'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
