'use client'

import React from 'react'
import {
  CheckCircle2,
  PackageCheck,
  Bike,
  CheckCheck,
  MessageCircle,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import type { Commande } from './types'

interface CommandeNextStepGuideProps {
  commande: Commande
  loading: boolean
  changeStatut: (statut: string) => void
  onDispatch?: (c: Commande) => void
  onRelancerWave?: () => void
  onApprouverCredit?: () => void
  onRejeterCredit?: () => void
  onFacture?: () => void
  onRetour?: (c: Commande) => void
  t: (key: string) => string
}

export default function CommandeNextStepGuide({
  commande,
  loading,
  changeStatut,
  onDispatch,
  onRelancerWave,
  onApprouverCredit,
  onRejeterCredit,
  t,
}: CommandeNextStepGuideProps) {
  const isCredit =
    commande.methode_paiement === 'credit' ||
    commande.note?.toLowerCase().includes('crédit')

  // Configurations adaptatives selon l'état actuel de la commande
  if (commande.statut === 'en_attente') {
    const isAConvenir = (!commande.frais_livraison || commande.frais_livraison === 0) && (
      Boolean(commande.note && (commande.note.includes('À convenir') || commande.note.includes('a convenir')))
    )
    const isRetrait = (!commande.frais_livraison || commande.frais_livraison === 0) && (
      Boolean(commande.note && commande.note.toLowerCase().includes('retrait')) ||
      Boolean(commande.client_adresse && commande.client_adresse.toLowerCase().includes('retrait'))
    )

    return (
      <div
        style={{
          background: '#fffbeb',
          border: '1.5px solid #fef3c7',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} color="#d97706" />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#92400e' }}>
            Étape conseillée : Validation de la commande
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: '#78350f', lineHeight: 1.4 }}>
          {isCredit
            ? "Le client sollicite un achat à crédit. Validez ou refusez l'inscription dans son carnet."
            : "Nouvelle commande reçue. Confirmez la commande pour engager sa préparation."}
        </p>

        {isAConvenir && (
          <div
            style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Truck size={15} color="#b45309" />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e' }}>
                Frais de livraison à convenir avec le client
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#78350f', lineHeight: 1.4 }}>
              Adresse client : <strong>{commande.client_adresse || 'Non précisée'}</strong>.
              Fixez le tarif du transport avec le client avant d&apos;expédier la marchandise.
            </p>
            {commande.client_telephone && (
              <button
                type="button"
                onClick={() => {
                  const cleanTel = commande.client_telephone.replace(/\D/g, '')
                  const telWa = cleanTel.length === 9 ? `221${cleanTel}` : cleanTel
                  const nomTxt = commande.client_nom && commande.client_nom !== 'Client WhatsApp' ? ` ${commande.client_nom}` : ''
                  const msg = `Bonjour${nomTxt} ! Pour votre commande ${commande.reference} (${commande.nom_produit}), nous préparons votre livraison pour ${commande.client_adresse || 'votre quartier'}. Le coût du tiak-tiak est de ... FCFA. Êtes-vous d'accord ?`
                  window.open(`https://wa.me/${telWa}?text=${encodeURIComponent(msg)}`, '_blank')
                }}
                style={{
                  padding: '7px 12px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  alignSelf: 'flex-start',
                }}
              >
                <MessageCircle size={14} />
                <span>Fixer le tarif sur WhatsApp</span>
              </button>
            )}
          </div>
        )}

        {isRetrait && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <PackageCheck size={16} color="#059669" />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#065f46' }}>
              Mode Retrait en boutique — Le client viendra récupérer sa commande sur place.
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
          {isCredit ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onApprouverCredit}
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: 160,
                  height: 42,
                  background: 'var(--navy, #1C2B4A)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <CheckCircle2 size={16} />
                <span>Approuver l&apos;Achat à Crédit</span>
              </button>
              <button
                type="button"
                onClick={onRejeterCredit}
                disabled={loading}
                style={{
                  height: 42,
                  padding: '0 16px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Rejeter
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => changeStatut('confirmee')}
                disabled={loading}
                style={{
                  width: '100%',
                  height: 42,
                  background: 'var(--navy, #1C2B4A)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 2px 4px rgba(28,43,74,0.15)',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{t('shop.statusConfirmed')}</span>
              </button>
              {onRelancerWave && (
                <button
                  type="button"
                  onClick={onRelancerWave}
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: 38,
                    background: '#ffffff',
                    color: '#15803d',
                    border: '1.5px solid #86efac',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <MessageCircle size={15} />
                  <span>Relancer le client avec lien Wave sur WhatsApp</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (commande.statut === 'confirmee') {
    return (
      <div
        style={{
          background: '#f0fdf4',
          border: '1.5px solid #bbf7d0',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} color="#15803d" />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>
            Étape conseillée : Préparation du colis
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: '#14532d', lineHeight: 1.4 }}>
          Commande confirmée ! Préparez le colis en boutique puis confiez-le à un livreur ou tenez-le prêt pour le retrait.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
          <button
            type="button"
            onClick={() => changeStatut('en_preparation')}
            disabled={loading}
            style={{
              width: '100%',
              height: 42,
              background: 'var(--navy, #1C2B4A)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 2px 4px rgba(28,43,74,0.15)',
            }}
          >
            <PackageCheck size={16} />
            <span>Passer en préparation</span>
          </button>

          {onDispatch && (
            <button
              type="button"
              onClick={() => onDispatch(commande)}
              disabled={loading}
              style={{
                width: '100%',
                height: 38,
                background: '#ffffff',
                color: 'var(--accent, #C75B00)',
                border: '1.5px solid #fed7aa',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Bike size={16} />
              <span>Assigner un livreur Tiak-Tiak directement</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  if (commande.statut === 'en_preparation') {
    return (
      <div
        style={{
          background: '#fffbf5',
          border: '1px solid #fed7aa',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} color="var(--accent, #C75B00)" />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#9a3412' }}>
            Étape conseillée : Expédition &amp; Livraison
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: '#7c2d12', lineHeight: 1.4 }}>
          Le colis est en préparation. Transmettez la course au coursier dès que le paquet est prêt.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
          {onDispatch && (
            <button
              type="button"
              onClick={() => onDispatch(commande)}
              disabled={loading}
              style={{
                width: '100%',
                height: 40,
                background: 'var(--accent, #C75B00)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 4px rgba(199,91,0,0.2)',
              }}
            >
              <Bike size={16} />
              <span>Dispatch Livreur Tiak-Tiak (WhatsApp)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => changeStatut('expediee')}
            disabled={loading}
            style={{
              width: '100%',
              height: 38,
              background: '#ffffff',
              color: 'var(--navy, #1C2B4A)',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Truck size={15} />
            <span>Marquer comme expédiée</span>
          </button>
        </div>
      </div>
    )
  }

  if (commande.statut === 'expediee') {
    return (
      <div
        style={{
          background: '#f0f9ff',
          border: '1.5px solid #bae6fd',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} color="#0284c7" />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0369a1' }}>
            Étape conseillée : Clôture de la livraison
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: '#075985', lineHeight: 1.4 }}>
          Colis pris en charge par le livreur. Dès confirmation de la remise au client, clôturez la commande.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
          <button
            type="button"
            onClick={() => changeStatut('livree')}
            disabled={loading}
            style={{
              width: '100%',
              height: 42,
              background: 'var(--price, #0A5C36)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 2px 4px rgba(10,92,54,0.2)',
            }}
          >
            <CheckCheck size={17} />
            <span>Confirmer la remise au client (Livrée)</span>
          </button>
        </div>
      </div>
    )
  }

  if (commande.statut === 'livree') {
    return (
      <div
        style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <CheckCircle2 size={16} color="#16a34a" />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#166534' }}>
          Commande clôturée et livrée avec succès.
        </span>
      </div>
    )
  }

  if (commande.statut === 'annulee') {
    return (
      <div
        style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <RotateCcw size={15} color="#dc2626" />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#991b1b' }}>
          Cette commande a été annulée.
        </span>
      </div>
    )
  }

  return null
}
