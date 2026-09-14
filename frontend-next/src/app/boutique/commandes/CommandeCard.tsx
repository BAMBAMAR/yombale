'use client'

import React, { useState, useTransition } from 'react'
import {
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { updateStatutCommande } from '../actions'
import { fmtDateHeure, fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'
import type { Commande } from './types'
import { getStatutLabel, statutStyle } from './types'
import CommandeSequestreBox from './CommandeSequestreBox'
import CommandeActionsBar from './CommandeActionsBar'
import CommandeStatusSelector from './CommandeStatusSelector'

interface CommandeCardProps {
  commande: Commande
  boutiqueId: string
  onUpdate: () => void
  onDispatch?: (c: Commande) => void
  onRetour?: (c: Commande) => void
}

export default function CommandeCard({
  commande,
  boutiqueId,
  onUpdate,
  onDispatch,
  onRetour,
}: CommandeCardProps) {
  const { t } = useTranslation() as { t: any }
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()

  function changeStatut(statut: string) {
    setLoading(true)
    startTransition(() => {
      updateStatutCommande(boutiqueId, commande.id, statut)
        .then(() => {
          setLoading(false)
          onUpdate()
          if (
            commande.methode_paiement === 'credit' ||
            commande.note?.toLowerCase().includes('crédit')
          ) {
            window.dispatchEvent(new Event('carnet_updated'))
          }
        })
        .catch(() => setLoading(false))
    })
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header commande */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <span style={statutStyle(commande.statut)}>{getStatutLabel(commande.statut, t)}</span>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: 14,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {commande.nom_produit} × {commande.quantite}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
              {commande.client_nom} · {commande.client_telephone}
              {commande.source === 'whatsapp' && (
                <span
                  style={{
                    marginLeft: 6,
                    background: '#dcfce7',
                    color: '#16a34a',
                    borderRadius: 10,
                    padding: '1px 6px',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  WhatsApp
                </span>
              )}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'var(--accent, #C75B00)' }}>
            {fcfa(commande.montant_total)}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{fmtDateHeure(commande.created_at)}</p>
        </div>
        <span style={{ color: '#9ca3af', flexShrink: 0, fontSize: 12 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>

      {/* Détails */}
      {open && (
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 18px', background: '#fafafa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                {t('shop.orderClient').toUpperCase()}
              </p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{commande.client_nom}</p>
              <a href={`tel:${commande.client_telephone}`} style={{ fontSize: 13, color: '#1d4ed8' }}>
                {commande.client_telephone}
              </a>
              <br />
              <a
                href={`https://wa.me/${commande.client_telephone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}
              >
                WhatsApp
              </a>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                {t('shop.orders').toUpperCase()}
              </p>
              <p style={{ margin: 0, fontSize: 13 }}>
                {t('shop.orderReference')} : <strong>{commande.reference}</strong>
              </p>
              <p style={{ margin: 0, fontSize: 13 }}>
                {commande.quantite} × {fcfa(commande.prix_unitaire)}
              </p>
              {commande.frais_livraison > 0 && (
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                  {t('shop.deliveryZoneLabel')} : {fcfa(commande.frais_livraison)}
                </p>
              )}
              {commande.methode_paiement && (
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 12,
                    color: commande.methode_paiement === 'credit' ? '#0369a1' : '#6b7280',
                    fontWeight: commande.methode_paiement === 'credit' ? 800 : 400,
                  }}
                >
                  {({
                    wave: 'Wave',
                    orange_money: 'Orange Money',
                    cash: 'Espèces',
                    virement: 'Virement',
                    credit: t('shop.transactionCreditSale'),
                  } as Record<string, string>)[commande.methode_paiement] ?? commande.methode_paiement}
                </p>
              )}
              {commande.client_adresse && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                  {commande.client_adresse}
                </p>
              )}
            </div>
          </div>
          {commande.note && (
            <div
              style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 12,
                fontSize: 13,
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontWeight: 700 }}>Note :</span> {commande.note}
            </div>
          )}

          {/* Nopalou Pay Safe — Séquestre Actif */}
          <CommandeSequestreBox commande={commande} onUpdate={onUpdate} />

          {/* Actions de statut & Validation Marchand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <CommandeActionsBar
              commande={commande}
              boutiqueId={boutiqueId}
              loading={loading}
              setLoading={setLoading}
              changeStatut={changeStatut}
              onUpdate={onUpdate}
              onDispatch={onDispatch}
              onRetour={onRetour}
              t={t}
            />

            {/* Avancement ou Correction de statut */}
            <CommandeStatusSelector
              commande={commande}
              loading={loading}
              changeStatut={changeStatut}
              t={t}
            />
          </div>
        </div>
      )}
    </div>
  )
}
