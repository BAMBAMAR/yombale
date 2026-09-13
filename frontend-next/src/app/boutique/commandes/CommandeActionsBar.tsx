'use client'

import React from 'react'
import {
  Bike,
  RotateCcw,
  MessageCircle,
  FileText,
} from 'lucide-react'
import { creerBoutiqueDocument } from '../actions'
import { fcfa } from '@/lib/format'
import type { Commande } from './types'

interface CommandeActionsBarProps {
  commande: Commande
  boutiqueId: string
  loading: boolean
  setLoading: (l: boolean) => void
  changeStatut: (statut: string) => void
  onUpdate: () => void
  onDispatch?: (c: Commande) => void
  onRetour?: (c: Commande) => void
  t: (key: string) => string
}

export default function CommandeActionsBar({
  commande,
  boutiqueId,
  loading,
  setLoading,
  changeStatut,
  onUpdate,
  onDispatch,
  onRetour,
  t,
}: CommandeActionsBarProps) {
  return (
    <div
      style={{
        background: '#f8fafc',
        padding: 10,
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#334155' }}>
        {t('shop.quickActions')} :
      </span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {commande.statut === 'en_attente' && (
          <>
            <button
              onClick={() => changeStatut('confirmee')}
              disabled={loading}
              style={{
                padding: '6px 12px',
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t('shop.statusConfirmed')}
            </button>

            <button
              type="button"
              onClick={() => {
                let cleanTel = commande.client_telephone.replace(/\D/g, '')
                if (
                  cleanTel.length === 9 &&
                  (cleanTel.startsWith('77') ||
                    cleanTel.startsWith('78') ||
                    cleanTel.startsWith('76') ||
                    cleanTel.startsWith('75') ||
                    cleanTel.startsWith('70'))
                ) {
                  cleanTel = `221${cleanTel}`
                }
                const SITE = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com'
                const payUrl = `${SITE}/checkout-express?produit=${(commande as any).produit_id || ''}&boutique=${boutiqueId}&phone=${cleanTel}&pay=wave&ref=${commande.reference}&auto=1`
                const cleanNom = commande.client_nom?.trim()
                const salutation =
                  cleanNom && cleanNom.toLowerCase() !== 'client whatsapp'
                    ? `Bonjour ${cleanNom} !`
                    : `Bonjour !`
                const msg =
                  `${salutation}\n\n` +
                  `Voici le rappel pour votre commande Nopalou :\n` +
                  `*Produit :* ${commande.nom_produit} × ${commande.quantite}\n` +
                  `*TOTAL :* ${fcfa(commande.montant_total)}\n` +
                  `*Référence :* ${commande.reference}\n\n` +
                  `*Pour régler directement en 1 clic par Wave sécurisé :*\n` +
                  `${payUrl}\n\n` +
                  `Merci pour votre confiance !`
                window.open(`https://wa.me/${cleanTel}?text=${encodeURIComponent(msg)}`, '_blank')
              }}
              style={{
                padding: '6px 12px',
                background: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Renvoyer le lien de paiement Wave au client sur WhatsApp"
            >
              <MessageCircle size={13} /> Relancer Wave
            </button>

            {(commande.methode_paiement === 'credit' ||
              commande.note?.toLowerCase().includes('crédit')) && (
              <>
                <button
                  onClick={async () => {
                    try {
                      setLoading(true)
                      const res = await fetch(
                        `/api/boutiques/${boutiqueId}/credits-clients/approuver-commande`,
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            commande_id: commande.id,
                            client_nom: commande.client_nom,
                            client_telephone: commande.client_telephone,
                            montant: commande.montant_total,
                            nom_produit: commande.nom_produit,
                            quantite: commande.quantite,
                            reference: commande.reference,
                          }),
                        }
                      )
                      const data = await res.json()
                      if (!res.ok) {
                        alert(data.error || "Erreur lors de l'approbation de la demande à crédit.")
                        return
                      }
                      if (typeof onUpdate === 'function') onUpdate()
                      window.dispatchEvent(new Event('carnet_updated'))

                      const cleanTel = commande.client_telephone.replace(/\D/g, '')
                      const msgWa = encodeURIComponent(
                        `Bonjour ${commande.client_nom}, votre demande d'achat à crédit de ${fcfa(
                          commande.montant_total
                        )} (${commande.nom_produit}) a été approuvée par la boutique et ajoutée à votre Carnet !`
                      )

                      if (
                        confirm(
                          `Demande d'achat à crédit de ${commande.client_nom} approuvée et ajoutée au Carnet client avec succès !\n\nSouhaitez-vous ouvrir WhatsApp pour envoyer la confirmation au client ?`
                        )
                      ) {
                        window.open(`https://wa.me/${cleanTel}?text=${msgWa}`, '_blank')
                      }
                    } catch {
                      alert('Erreur lors du traitement de la demande.')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {t('shop.debts')}
                </button>

                <button
                  onClick={async () => {
                    if (
                      !confirm(
                        `Souhaitez-vous vraiment rejeter la demande d'achat à crédit de ${commande.client_nom} ?`
                      )
                    )
                      return
                    changeStatut('annulee')
                  }}
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {t('shop.cancelOrder')}
                </button>
              </>
            )}
          </>
        )}

        <button
          onClick={async () => {
            try {
              setLoading(true)
              const res = await creerBoutiqueDocument(boutiqueId, {
                type: 'facture',
                statut: 'valide',
                notes: `Facture issue de la commande Réf: ${commande.reference}`,
                items: [
                  {
                    nom: commande.nom_produit,
                    quantite: commande.quantite,
                    prix: commande.prix_unitaire,
                  },
                ],
              })
              if (res?.error) alert(res.error)
              else alert(`Facture ${res?.reference || ''} générée avec succès !`)
            } catch {
              alert('Erreur lors de la création de la facture.')
            } finally {
              setLoading(false)
            }
          }}
          disabled={loading}
          style={{
            padding: '6px 12px',
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <FileText size={13} />
          <span>{t('shop.createInvoiceAction')}</span>
        </button>

        <a
          href={`https://wa.me/${(commande.client_telephone || '').replace(
            /\D/g,
            ''
          )}?text=${encodeURIComponent(
            `Bonjour ${commande.client_nom}, votre commande Réf: ${commande.reference} (${commande.quantite}x ${commande.nom_produit} - ${fcfa(
              commande.montant_total
            )}) a été bien validée par notre boutique. Merci pour votre confiance !`
          )}`}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: '6px 12px',
            background: '#25D366',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <MessageCircle size={13} />
          <span>WhatsApp</span>
        </a>

        <button
          type="button"
          onClick={() => onDispatch?.(commande)}
          style={{
            padding: '6px 12px',
            background: '#FFF7ED',
            color: 'var(--accent, #C75B00)',
            border: '1.5px solid #FED7AA',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
          title="Générer et envoyer la fiche de livraison (20 transporteurs disponibles)"
        >
          <Bike size={13} />
          <span>Dispatch Livreur</span>
        </button>

        {['livree', 'expediee', 'confirmee'].includes(commande.statut) && (
          <button
            type="button"
            onClick={() => onRetour?.(commande)}
            style={{
              padding: '6px 12px',
              background: '#f8fafc',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
            title="Enregistrer un retour client et émettre un bon d'avoir déductible"
          >
            <RotateCcw size={13} />
            <span>Retour &amp; Avoir</span>
          </button>
        )}
      </div>
    </div>
  )
}
