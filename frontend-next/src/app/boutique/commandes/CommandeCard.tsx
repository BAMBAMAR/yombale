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
    <div className="npl-commande-card">
      {/* En-tête de la carte */}
      <div
        onClick={() => setOpen(!open)}
        className={`npl-commande-header ${open ? 'is-open' : ''}`}
      >
        {/* Ligne 1 : Statut & badges à gauche | Montant, Date & Accordéon à droite */}
        <div className="npl-commande-header-top">
          <div className="npl-commande-badges">
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
          <div className="npl-commande-top-right">
            <div style={{ textAlign: 'right' }}>
              <p className="npl-commande-montant-header">
                {fcfa(commande.montant_total)}
              </p>
              <p className="npl-commande-date-header">
                {fmtDateHeure(commande.created_at)}
              </p>
            </div>
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </div>
        </div>

        {/* Ligne 2 : Titre produit & Client */}
        <div className="npl-commande-header-main">
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="npl-commande-titre-produit">
              {displayNomProduit}
            </p>
            <p className="npl-commande-subtitle-client">
              <span>{commande.client_nom}</span>
              {commande.client_telephone && (
                <>
                  <span>·</span>
                  <span>{commande.client_telephone}</span>
                </>
              )}
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
                color: 'var(--navy, #1C2B4A)',
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

      {/* Détails dépliés (Grille 2 Colonnes Web / Stack Mobile) */}
      {open && (
        <div className="npl-commande-body">
          <div className="npl-commande-grid">
            {/* Colonne Gauche : Étape conseillée + Articles & Règlement + Séquestre */}
            <div className="npl-commande-col-left">
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

              {/* 2. Section Articles & Règlement (Clarté absolue des montants) */}
              <div className="npl-commande-box">
                <div className="npl-commande-box-header">
                  <span className="npl-commande-box-label">
                    <Package size={13} />
                    <span>Articles &amp; Règlement</span>
                  </span>
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>
                    Réf : <strong style={{ color: 'var(--navy, #1C2B4A)' }}>{commande.reference}</strong>
                  </span>
                </div>

                <div className="npl-commande-item-row">
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
                    {displayNomProduit}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)', whiteSpace: 'nowrap' }}>
                    {fcfa(commande.quantite * (commande.prix_unitaire || 0))}
                  </span>
                </div>

                {commande.frais_livraison > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: '#64748b' }}>
                    <span>Frais de livraison :</span>
                    <span>{fcfa(commande.frais_livraison)}</span>
                  </div>
                )}

                <div className="npl-commande-item-total">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CreditCard size={14} color="#64748b" />
                    <span style={{ fontSize: 12, color: '#475569' }}>
                      {formatModePaiement(commande.methode_paiement)}
                    </span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--price, #0A5C36)' }}>
                    {fcfa(commande.montant_total)}
                  </span>
                </div>
              </div>

              {/* Note client si présente */}
              {commande.note && (
                <div className="npl-commande-note-box">
                  <span style={{ fontWeight: 700 }}>Note du client :</span> {commande.note}
                </div>
              )}

              {/* Nopalou Pay Safe — Séquestre Actif si applicable */}
              <CommandeSequestreBox commande={commande} onUpdate={onUpdate} />
            </div>

            {/* Colonne Droite : Destinataire & Contact + Actions rapides + Statut */}
            <div className="npl-commande-col-right">
              {/* Fiche Client & Contact Direct */}
              <div className="npl-commande-box">
                <div className="npl-commande-box-header">
                  <span className="npl-commande-box-label">
                    Client &amp; Contact
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                    {commande.client_nom}
                  </span>
                </div>

                {commande.client_telephone && (
                  <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 500 }}>
                    {commande.client_telephone}
                  </p>
                )}

                {commande.client_adresse && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#475569' }}>
                    <MapPin size={14} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{commande.client_adresse}</span>
                  </div>
                )}

                {/* Boutons d'action directe au pouce */}
                <div className="npl-commande-contact-grid">
                  <a
                    href={`tel:${commande.client_telephone}`}
                    className="npl-commande-btn-tel"
                    title={`Appeler ${commande.client_nom}`}
                  >
                    <Phone size={14} color="#0284c7" />
                    <span>Appeler</span>
                  </a>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="npl-commande-btn-wa"
                    title={`Contacter ${commande.client_nom} sur WhatsApp`}
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Barre d'outils secondaire compacte */}
              <CommandeActionsBar
                commande={commande}
                loading={actions.loading}
                onDispatch={onDispatch}
                onRetour={onRetour}
                onFacture={actions.genererFacture}
                onAnnuler={actions.annulerCommande}
                t={t}
              />

              {/* Modification manuelle de statut (discrète) */}
              <CommandeStatusSelector
                commande={commande}
                loading={actions.loading}
                changeStatut={changeStatut}
                t={t}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
