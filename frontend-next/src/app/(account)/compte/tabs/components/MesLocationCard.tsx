'use client'

import React from 'react'
import Link from 'next/link'
import {
  FileText,
  Download,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  MessageCircle,
} from 'lucide-react'
import { getImmoAuthToken } from '@/lib/immo-auth'

export interface Echeance {
  id: string
  periode: string
  date_echeance: string
  montant_du: number
  montant_paye: number
  date_paiement: string | null
  statut: 'paye' | 'en_attente' | 'retard' | 'impaye'
  mode_paiement: string | null
  quittance_url: string | null
}

export interface LocationItem {
  bail_id: string
  role_vue?: 'bailleur' | 'locataire'
  date_debut: string
  date_fin: string | null
  duree_mois?: number | null
  loyer_mensuel: number
  charges: number
  depot_garantie: number
  statut_bail: string
  contrat_url?: string | null
  document_url?: string | null
  bien: {
    id: string
    titre: string
    adresse: string | null
    quartier: string | null
    ville: string | null
    type_bien: string | null
    photos: string[] | null
  }
  agence: {
    id: string
    nom: string
    slug: string
    telephone: string | null
    whatsapp: string | null
    email: string | null
  }
  locataire?: {
    nom: string
    prenom?: string | null
    telephone?: string | null
    email?: string | null
  }
  proprietaire?: {
    nom: string
    prenom?: string | null
    telephone?: string | null
  }
  echeances: Echeance[]
}

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR')

function getAuthPdfUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return ''
  const token = getImmoAuthToken()
  if (!token) return rawUrl
  const sep = rawUrl.includes('?') ? '&' : '?'
  return `${rawUrl}${sep}token=${encodeURIComponent(token)}`
}

interface MesLocationCardProps {
  location: LocationItem
  payingId: string | null
  onPayLoyer: (echeanceId: string) => void
}

export default function MesLocationCard({
  location: loc,
  payingId,
  onPayLoyer,
}: MesLocationCardProps) {
  const isBailleur = loc.role_vue === 'bailleur'
  const agenceWa = loc.agence.whatsapp || loc.agence.telephone
  const contratPdfUrl = getAuthPdfUrl(loc.contrat_url)

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid var(--border, #E8DDD2)',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(28,43,74,0.05)',
      }}
    >
      {/* Header Bail */}
      <div
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)',
          borderBottom: '1px solid var(--border, #E8DDD2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                color: isBailleur ? 'var(--navy, #1C2B4A)' : 'var(--accent, #C75B00)',
              }}
            >
              {isBailleur ? 'Mandat de Gestion Bailleur' : 'Bail Locatif Conforme COCC'}
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 10,
                background: isBailleur ? '#E0E7FF' : '#DCFCE7',
                color: isBailleur ? '#3730A3' : '#166534',
              }}
            >
              {isBailleur ? 'Espace Propriétaire' : (loc.statut_bail === 'actif' ? 'Bail en cours' : loc.statut_bail)}
            </span>
          </div>

          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            {loc.bien.titre}
          </h4>

          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748B' }}>
            {[loc.bien.adresse, loc.bien.quartier, loc.bien.ville].filter(Boolean).join(', ')}
          </p>

          <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#64748B' }}>
            Prise d&apos;effet : {new Date(loc.date_debut).toLocaleDateString('fr-FR')}
            {loc.date_fin ? ` au ${new Date(loc.date_fin).toLocaleDateString('fr-FR')}` : ' (Durée tacite reconduction)'}
            {loc.duree_mois ? ` • ${loc.duree_mois} mois` : ''}
          </p>

          {isBailleur && loc.locataire && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--price, #0A5C36)', fontWeight: 700 }}>
              Locataire occupant : {loc.locataire.prenom ? `${loc.locataire.prenom} ` : ''}{loc.locataire.nom}
              {loc.locataire.telephone ? ` (${loc.locataire.telephone})` : ''}
            </p>
          )}
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Loyer Mensuel</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--price, #0A5C36)' }}>
              {fmt(loc.loyer_mensuel)} FCFA
            </div>
            {loc.charges > 0 && (
              <div style={{ fontSize: 11, color: '#64748B' }}>
                + {fmt(loc.charges)} FCFA charges
              </div>
            )}
          </div>

          {/* Bouton Téléchargement Contrat de Bail PDF */}
          {contratPdfUrl && (
            <a
              href={contratPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={`contrat_bail_${loc.bail_id.slice(0, 8)}.pdf`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                marginTop: 4,
              }}
            >
              <FileText size={14} style={{ color: 'var(--accent, #C75B00)' }} />
              <span>Contrat de bail (PDF)</span>
              <Download size={13} />
            </a>
          )}
        </div>
      </div>

      {/* Agence Info & Contact */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border, #E8DDD2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          fontSize: 12.5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={15} style={{ color: 'var(--navy, #1C2B4A)' }} />
          <span style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Gestionnaire : {loc.agence.nom}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {agenceWa && (
            <a
              href={`https://wa.me/${agenceWa.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Bonjour ${loc.agence.nom}, je vous contacte au sujet de ${
                  isBailleur ? 'mon bien en gestion' : 'mon contrat de bail'
                } (${loc.bien.titre}).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 6,
                background: '#25D366',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 11.5,
                textDecoration: 'none',
              }}
            >
              <MessageCircle size={13} />
              <span>Contacter l&apos;agence</span>
            </a>
          )}
        </div>
      </div>

      {/* Tableau des Quittances & Échéances */}
      <div style={{ padding: '16px 20px' }}>
        <h5
          style={{
            margin: '0 0 12px',
            fontSize: 13.5,
            fontWeight: 800,
            color: 'var(--navy, #1C2B4A)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <FileText size={15} style={{ color: 'var(--accent, #C75B00)' }} />
          <span>
            {isBailleur
              ? 'Suivi des Encaissements & Quittances'
              : 'Historique des Loyers & Quittances Officielles'}
          </span>
        </h5>

        {loc.echeances.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', fontStyle: 'italic' }}>
            Aucune échéance enregistrée pour ce bail.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loc.echeances.map((ech) => {
              const isPaye = ech.statut === 'paye'
              const isEnRetard = ech.statut === 'retard' || ech.statut === 'impaye'
              const quittancePdfUrl = getAuthPdfUrl(ech.quittance_url)

              return (
                <div
                  key={ech.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: isPaye ? '#F8FAFC' : isEnRetard ? '#FEF2F2' : '#FFFBEB',
                    border: `1px solid ${isPaye ? '#E2E8F0' : isEnRetard ? '#FECACA' : '#FDE68A'}`,
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: isPaye ? '#DCFCE7' : isEnRetard ? '#FEE2E2' : '#FEF3C7',
                        color: isPaye ? '#166534' : isEnRetard ? '#991B1B' : '#92400E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isPaye ? <CheckCircle2 size={16} /> : isEnRetard ? <AlertCircle size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                        Période : {ech.periode}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        Échéance : {new Date(ech.date_echeance).toLocaleDateString('fr-FR')} &bull; Montant :{' '}
                        {fmt(ech.montant_du)} FCFA
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isPaye && quittancePdfUrl ? (
                      <a
                        href={quittancePdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`quittance_${ech.periode}.pdf`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: 'var(--navy, #1C2B4A)',
                          color: '#ffffff',
                          fontSize: 11.5,
                          fontWeight: 800,
                          textDecoration: 'none',
                        }}
                      >
                        <Download size={13} />
                        <span>Quittance PDF</span>
                      </a>
                    ) : isBailleur ? (
                      <span
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          background: isEnRetard ? '#FEE2E2' : '#FEF3C7',
                          color: isEnRetard ? '#991B1B' : '#92400E',
                        }}
                      >
                        {isEnRetard ? 'Loyer Impayé' : "En attente d'encaissement"}
                      </span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => onPayLoyer(ech.id)}
                          disabled={payingId === ech.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: '#1D4ED8',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          <CreditCard size={13} />
                          <span>{payingId === ech.id ? 'Redirection Wave...' : 'Payer par Wave'}</span>
                        </button>
                        <Link
                          href={`/payer-loyer/${ech.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 10px',
                            borderRadius: 8,
                            background: '#F1F5F9',
                            color: 'var(--navy, #1C2B4A)',
                            border: '1px solid #CBD5E1',
                            fontSize: 11.5,
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                          title="Plus d'options de paiement (Orange Money, virement...)"
                        >
                          <span>Options</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
