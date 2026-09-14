'use client'

import React from 'react'
import { CheckCircle2, FileText, X } from 'lucide-react'
import { Produit, PromoApplique, ClubVipData, fcfa } from './types'

interface CommanderSuccessViewProps {
  produit: Produit
  quantite: number
  paiement: string
  nomBoutique?: string | null
  tel: string
  promoApplique: PromoApplique | null
  reductionClubVip: number
  clubVip: ClubVipData | null
  fraisLivraison: number
  total: number
  onClose: () => void
}

export default function CommanderSuccessView({
  produit,
  quantite,
  paiement,
  nomBoutique,
  tel,
  promoApplique,
  reductionClubVip,
  clubVip,
  fraisLivraison,
  total,
  onClose,
}: CommanderSuccessViewProps) {
  const isCredit = paiement === 'credit'

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: isCredit ? '#e0f2fe' : '#ecfdf5',
          color: isCredit ? '#0284c7' : '#16a34a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isCredit ? '0 8px 20px rgba(2,132,199,0.2)' : '0 8px 20px rgba(22,163,74,0.2)',
        }}
      >
        {isCredit ? <FileText size={36} /> : <CheckCircle2 size={36} />}
      </div>

      <div>
        <h3
          style={{
            fontSize: 20,
            margin: '0 0 6px',
            color: isCredit ? '#0369a1' : '#15803d',
            fontWeight: 900,
          }}
        >
          {isCredit ? "Demande d'Achat à Crédit Transmise !" : 'Commande Confirmée avec Succès !'}
        </h3>
        <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.5, maxWidth: 380 }}>
          {isCredit ? (
            <>
              La boutique <strong>{nomBoutique || 'vendeur'}</strong> a reçu votre demande. Elle sera ajoutée à votre Carnet client dès confirmation.
            </>
          ) : (
            <>
              La boutique a bien reçu votre commande et vous contactera sur le <strong>{tel}</strong> pour la livraison.
            </>
          )}
        </p>
      </div>

      <div
        style={{
          width: '100%',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '14px 18px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
          <span>Article</span>
          <strong style={{ color: '#1e293b' }}>
            {produit.nom} (×{quantite})
          </strong>
        </div>

        {promoApplique && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', fontWeight: 700 }}>
            <span>Code promo ({promoApplique.code})</span>
            <span>-{fcfa(promoApplique.reduction)}</span>
          </div>
        )}

        {reductionClubVip > 0 && clubVip && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', fontWeight: 700 }}>
            <span>Avantage Club VIP ({clubVip.badge})</span>
            <span>-{fcfa(reductionClubVip)}</span>
          </div>
        )}

        {fraisLivraison > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
            <span>Livraison</span>
            <span>{fcfa(fraisLivraison)}</span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 16,
            fontWeight: 900,
            color: 'var(--accent, #C75B00)',
            borderTop: '1px solid #e2e8f0',
            paddingTop: 8,
            marginTop: 2,
          }}
        >
          <span>Total {isCredit ? 'à inscrire' : 'réglé'}</span>
          <span>{fcfa(total)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          width: '100%',
          background: 'var(--navy, #1C2B4A)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 14,
          padding: '14px 20px',
          fontWeight: 800,
          fontSize: 15,
          cursor: 'pointer',
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <X size={16} />
        <span>Fermer la fenêtre</span>
      </button>
    </div>
  )
}
