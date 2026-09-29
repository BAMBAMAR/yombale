'use client'

import React, { useState, useTransition } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Phone,
  MessageCircle,
  MapPin,
  CreditCard,
  Package,
} from 'lucide-react'
import { updateStatutCommande } from '../actions'
import { fmtDateHeure, fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'
import type { Commande } from './types'
import { getStatutLabel, statutStyle } from './types'
import CommandeSequestreBox from './CommandeSequestreBox'
import CommandeActionsBar from './CommandeActionsBar'
import CommandeStatusSelector from './CommandeStatusSelector'
import CommandeNextStepGuide from './CommandeNextStepGuide'
import { useCommandeActions } from './useCommandeActions'

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
    actions.setLoading(true)
    startTransition(() => {
      updateStatutCommande(boutiqueId, commande.id, statut)
        .then(() => {
          actions.setLoading(false)
          onUpdate()
          if (
            commande.methode_paiement === 'credit' ||
            commande.note?.toLowerCase().includes('crédit')
          ) {
            window.dispatchEvent(new Event('carnet_updated'))
          }
        })
        .catch(() => actions.setLoading(false))
    })
  }

  const actions = useCommandeActions(boutiqueId, commande, onUpdate, changeStatut)

  const cleanPhone = (commande.client_telephone || '').replace(/\D/g, '')
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Bonjour ${commande.client_nom}, concernant votre commande Réf: ${commande.reference} (${commande.quantite}x ${commande.nom_produit}) sur notre boutique Nopalou :`
  )}`

  const formatModePaiement = (mode: string | null) => {
    if (!mode) return 'Paiement à la livraison / Espèces'
    const dict: Record<string, string> = {
      wave: 'Wave Mobile Money',
      orange_money: 'Orange Money',
      cash: 'Espèces à la livraison',
      virement: 'Virement bancaire',
      credit: t('shop.transactionCreditSale') || 'Achat à Crédit (Carnet)',
    }
    return dict[mode] || mode
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* En-tête de la carte */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          cursor: 'pointer',
          background: open ? '#fafafa' : '#ffffff',
          transition: 'background 0.15s ease',
        }}
      >
        {/* Ligne 1 : Statut & badges à gauche | Montant, Date & Accordéon à droite */}
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
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {fmtDateHeure(commande.created_at)}
              </p>
            </div>
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </div>
        </div>

        {/* Ligne 2 : Titre produit & Client */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, width: '100%' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: 14,
                color: '#0f172a',
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              {displayNomProduit}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
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
                gap: 4,
                flexShrink: 0,
                padding: '4px 8px',
                borderRadius: 6,
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: 11,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={12} color="#0284c7" />
              <span>Fiche</span>
            </a>
          )}
        </div>
      </div>

      {/* Détails dépliés (Vue Mobile & Desktop unifiée) */}
      {open && (
        <div
          style={{
            borderTop: '1px solid #f1f5f9',
            padding: '14px 16px',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* 1. Étape suivante conseillée pour orienter immédiatement le marchand */}
          <CommandeNextStepGuide
            commande={commande}
            loading={actions.loading}
            changeStatut={changeStatut}
            onDispatch={onDispatch}
            onRelancerWave={actions.relancerWave}
            onApprouverCredit={actions.approuverCredit}
            onRejeterCredit={actions.rejeterCredit}
            t={t}
          />

          {/* 2. Section Client & Contact Direct (Actionable Mobile) */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Client &amp; Livraison
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                {commande.client_nom}
              </span>
            </div>

            {commande.client_adresse && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12.5, color: '#334155' }}>
                <MapPin size={15} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{commande.client_adresse}</span>
              </div>
            )}

            {/* Boutons d'action directe au pouce */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
              <a
                href={`tel:${commande.client_telephone}`}
                style={{
                  height: 40,
                  background: '#ffffff',
                  color: 'var(--navy, #1C2B4A)',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <Phone size={15} color="#0284c7" />
                <span>Appeler</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  height: 40,
                  background: '#25D366',
                  color: '#ffffff',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 1px 2px rgba(37,211,102,0.2)',
                }}
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* 3. Section Articles & Règlement (Clarté absolue des montants) */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Articles &amp; Règlement
              </span>
              <span style={{ fontSize: 11.5, color: '#64748b' }}>
                Réf : <strong style={{ color: '#0f172a' }}>{commande.reference}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <Package size={14} color="#64748b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                  {displayNomProduit}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
                {fcfa(commande.quantite * (commande.prix_unitaire || 0))}
              </span>
            </div>

            {commande.frais_livraison > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: '#64748b' }}>
                <span>Frais de livraison :</span>
                <span>{fcfa(commande.frais_livraison)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px dashed #cbd5e1',
                paddingTop: 8,
                marginTop: 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CreditCard size={14} color="#64748b" />
                <span style={{ fontSize: 12, color: '#475569' }}>
                  {formatModePaiement(commande.methode_paiement)}
                </span>
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent, #C75B00)' }}>
                {fcfa(commande.montant_total)}
              </span>
            </div>
          </div>

          {/* Note client si présente */}
          {commande.note && (
            <div
              style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12.5,
                color: '#92400e',
              }}
            >
              <span style={{ fontWeight: 700 }}>Note du client :</span> {commande.note}
            </div>
          )}

          {/* Nopalou Pay Safe — Séquestre Actif si applicable */}
          <CommandeSequestreBox commande={commande} onUpdate={onUpdate} />

          {/* 4. Barre d'outils secondaire compacte */}
          <CommandeActionsBar
            commande={commande}
            loading={actions.loading}
            onDispatch={onDispatch}
            onRetour={onRetour}
            onFacture={actions.genererFacture}
            onAnnuler={actions.annulerCommande}
            t={t}
          />

          {/* 5. Modification manuelle de statut (discrète) */}
          <CommandeStatusSelector
            commande={commande}
            loading={actions.loading}
            changeStatut={changeStatut}
            t={t}
          />
        </div>
      )}
    </div>
  )
}
