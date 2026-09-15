'use client'

import React from 'react'
import { X, FileText, Download, Check, Building2, User } from 'lucide-react'

interface FactureItem {
  id: string
  numero_facture: string
  type_facture: string
  client_nom: string
  client_tel?: string
  client_email?: string
  bien_titre?: string
  montant_ht: number
  taux_tva: number
  montant_tva: number
  timbre_fiscal: number
  montant_ttc: number
  statut: string
  date_emission: string
  date_echeance?: string
  mode_paiement?: string
  notes?: string
}

interface ModalApercuFactureImmoProps {
  slug: string
  facture: FactureItem
  onClose: () => void
  onEncaisser: (id: string) => void
}

export default function ModalApercuFactureImmo({
  slug,
  facture,
  onClose,
  onEncaisser,
}: ModalApercuFactureImmoProps) {
  const isPayee = facture.statut === 'payee'

  const typeLabels: Record<string, string> = {
    honoraires_vente: 'Honoraires de Transaction & Vente',
    gestion_locative: 'Honoraires de Gestion Locative Mensuelle',
    honoraires_location: 'Frais de Rédaction de Bail & Entrée Preneur',
    debours_travaux: 'Refacturation Débours / Travaux Artisans',
    expertise: 'Honoraires d\'Expertise & Avis de Valeur',
  }

  const libellePrestation = typeLabels[facture.type_facture] || facture.type_facture.replace(/_/g, ' ')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 43, 74, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          maxWidth: 580,
          width: '100%',
          padding: 26,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* En-tête modale */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border, #E8DDD2)', paddingBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={20} color="var(--accent, #C75B00)" />
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                Facture d'Honoraires #{facture.numero_facture}
              </h2>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
              Émise le {new Date(facture.date_emission).toLocaleDateString('fr-FR')} • Échéance : {facture.date_echeance ? new Date(facture.date_echeance).toLocaleDateString('fr-FR') : 'À réception'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Détails Client et Bien */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div style={{ padding: 12, background: 'var(--bg, #F8F5F0)', borderRadius: 10, border: '1px solid var(--border, #E8DDD2)' }}>
            <div style={{ fontSize: 11, fontWeight: 750, color: 'var(--navy, #1C2B4A)', textTransform: 'uppercase', marginBottom: 4 }}>
              Client / Mandant
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>{facture.client_nom}</div>
            {facture.client_tel && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Tél : {facture.client_tel}</div>}
            {facture.client_email && <div style={{ fontSize: 12, color: '#64748B' }}>Email : {facture.client_email}</div>}
          </div>

          <div style={{ padding: 12, background: 'var(--bg, #F8F5F0)', borderRadius: 10, border: '1px solid var(--border, #E8DDD2)' }}>
            <div style={{ fontSize: 11, fontWeight: 750, color: 'var(--navy, #1C2B4A)', textTransform: 'uppercase', marginBottom: 4 }}>
              Dossier Immobilier
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
              {facture.bien_titre || 'Conseil & Intermédiation générale'}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Prestation : {libellePrestation}
            </div>
          </div>
        </div>

        {/* Récapitulatif comptable */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border, #E8DDD2)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
            <span style={{ color: '#4B5563' }}>Honoraires Hors Taxes (HT) :</span>
            <span style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
              {Number(facture.montant_ht).toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          {facture.montant_tva > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#64748B' }}>
              <span>TVA ({facture.taux_tva}%) :</span>
              <span>{Number(facture.montant_tva).toLocaleString('fr-FR')} FCFA</span>
            </div>
          )}

          {facture.timbre_fiscal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#64748B' }}>
              <span>Droit de timbre fiscal :</span>
              <span>{Number(facture.timbre_fiscal).toLocaleString('fr-FR')} FCFA</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)', borderTop: '2px solid var(--border, #E8DDD2)', paddingTop: 10, marginTop: 8 }}>
            <span>Total Net TTC :</span>
            <span style={{ color: 'var(--accent, #C75B00)' }}>
              {Number(facture.montant_ttc).toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </div>

        {/* Notes */}
        {facture.notes && (
          <div style={{ fontSize: 12.5, color: '#64748B', fontStyle: 'italic', marginBottom: 20 }}>
            "{facture.notes}"
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <span className={`status-badge ${isPayee ? 'actif' : 'en_attente'}`}>
              {isPayee ? 'Facture Acquittée' : 'En attente de paiement'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {!isPayee && (
              <button
                type="button"
                onClick={() => {
                  onEncaisser(facture.id)
                  onClose()
                }}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: '#0A5C36',
                  color: '#FFFFFF',
                  fontWeight: 750,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Check size={14} />
                <span>Marquer comme Payée</span>
              </button>
            )}

            <a
              href={`/api/agences/agence/${slug}/documents/facture/${facture.id}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                borderRadius: 8,
                background: 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
                fontWeight: 750,
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              <Download size={14} />
              <span>Télécharger Facture PDF</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
