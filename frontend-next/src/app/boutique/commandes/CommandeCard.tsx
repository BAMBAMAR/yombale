'use client'

import React, { useState, useTransition } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
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
  boutiqueSlug?: string
  onUpdate: () => void
  onDispatch?: (c: Commande) => void
  onRetour?: (c: Commande) => void
}

export default function CommandeCard({
  commande,
  boutiqueId,
  boutiqueSlug,
  onUpdate,
  onDispatch,
  onRetour,
}: CommandeCardProps) {
  const { t } = useTranslation() as { t: any }
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()

  const cleanNom = (commande.nom_produit || '').trim()
  const alreadyHasQty = /^\d+\s*x\s+/i.test(cleanNom) || /\s*×\s*\d+$/i.test(cleanNom)
  const displayNomProduit = cleanNom
    ? alreadyHasQty
      ? cleanNom
      : commande.quantite > 1
        ? `${cleanNom} × ${commande.quantite}`
        : cleanNom
    : 'Article'

  const cleanProductName = cleanNom.replace(/^\d+\s*x\s+/i, '').replace(/\s*×\s*\d+$/i, '').trim()

  const targetSlug = boutiqueSlug || boutiqueId
  const produitFicheUrl = commande.produit_id
    ? `/boutiques/${targetSlug}/produits/${commande.produit_id}`
    : cleanProductName
      ? `/boutique?tab=produits&q=${encodeURIComponent(cleanProductName)}`
      : null

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
          flexDirection: 'column',
          gap: 10,
          cursor: 'pointer',
        }}
      >
        {/* Ligne 1 : Statuts & Badges à gauche | Montant, Date & Chevron à droite */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={statutStyle(commande.statut)}>{getStatutLabel(commande.statut, t)}</span>
            {commande.source === 'whatsapp' && (
              <span
                style={{
                  background: '#dcfce7',
                  color: '#16a34a',
                  borderRadius: 10,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                WhatsApp
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'var(--accent, #C75B00)', whiteSpace: 'nowrap' }}>
                {fcfa(commande.montant_total)}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{fmtDateHeure(commande.created_at)}</p>
            </div>
            <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
              {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </div>
        </div>

        {/* Ligne 2 : Nom du produit complet (zéro troncature sauvage) + Lien Fiche Produit */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, width: '100%' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: 14,
                color: '#111827',
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              {displayNomProduit}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
              {commande.client_nom} · {commande.client_telephone}
            </p>
          </div>
          {produitFicheUrl && (
            <a
              href={produitFicheUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Voir la fiche du produit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                flexShrink: 0,
                padding: '5px 9px',
                borderRadius: 7,
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: 11,
                fontWeight: 700,
                textDecoration: 'none',
                marginTop: 2,
              }}
            >
              <ExternalLink size={12} color="#0284c7" />
              <span>Fiche</span>
            </a>
          )}
        </div>
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
              <p style={{ margin: '4px 0 2px', fontSize: 13, fontWeight: 700, color: '#111827', wordBreak: 'break-word' }}>
                {displayNomProduit}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#4b5563' }}>
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
              {produitFicheUrl && (
                <div style={{ marginTop: 8 }}>
                  <a
                    href={produitFicheUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1d4ed8',
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={13} />
                    Voir la fiche du produit
                  </a>
                </div>
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
