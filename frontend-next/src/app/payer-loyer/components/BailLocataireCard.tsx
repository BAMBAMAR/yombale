'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  FileText,
  Download,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ExternalLink
} from 'lucide-react'
import { fcfa } from '@/lib/format'

export interface EcheanceLocataireItem {
  id: string
  periode: string
  date_echeance: string
  montant_du: number
  montant_paye: number
  montant_restant: number
  statut: string
  quittance_url: string | null
  lien_paiement: string
}

export interface BailLocataireItem {
  id: string
  bien_titre: string
  bien_adresse?: string
  bien_quartier?: string
  bien_ville?: string
  bien_photos?: string[]
  bien_ref?: string
  loyer_mensuel: number
  charges: number
  depot_garantie: number
  jour_echeance: number
  date_debut: string
  date_fin?: string
  statut: string
  conditions?: string
  contrat_pdf_url: string
  agence: {
    nom: string
    telephone?: string
    whatsapp?: string
    slug?: string
    logo_url?: string
  }
  echeances: EcheanceLocataireItem[]
}

interface Props {
  bail: BailLocataireItem
}

export default function BailLocataireCard({ bail }: Props) {
  const [showAllEcheances, setShowAllEcheances] = useState(false)

  const echeancesEnAttente = bail.echeances.filter(e => e.statut !== 'paye')
  const echeancesPayees = bail.echeances.filter(e => e.statut === 'paye')
  const prochaineEcheance = echeancesEnAttente[0] || null

  const echeancesAffichees = showAllEcheances 
    ? bail.echeances 
    : bail.echeances.slice(0, 4)

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid var(--border, #E8DDD2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        padding: '20px',
        marginBottom: 20
      }}
    >
      {/* En-tête du bail */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          borderBottom: '1px solid var(--border, #E8DDD2)',
          paddingBottom: 14,
          marginBottom: 14,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--price, #0A5C36)',
                background: '#DCFCE7',
                padding: '3px 8px',
                borderRadius: 6
              }}
            >
              BAIL ACTIF
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-subtle, #5A4E42)' }}>
              Échéance le {bail.jour_echeance || 5} du mois
            </span>
          </div>

          <h3
            style={{
              margin: '0 0 4px',
              fontSize: 16,
              fontWeight: 900,
              color: 'var(--navy, #1C2B4A)'
            }}
          >
            {bail.bien_titre}
          </h3>

          <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
            {bail.bien_adresse ? `${bail.bien_adresse}, ` : ''}
            {bail.bien_quartier ? `${bail.bien_quartier} - ` : ''}
            {bail.bien_ville || 'Dakar'}
          </p>
        </div>

        {/* Bouton Téléchargement Contrat de bail PDF */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <a
            href={bail.contrat_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            download={`contrat-bail-${bail.id.slice(0, 8)}.pdf`}
            style={{
              background: 'var(--navy, #1C2B4A)',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(28, 43, 74, 0.2)'
            }}
          >
            <FileText size={15} />
            <span>Contrat de bail (PDF)</span>
            <Download size={13} />
          </a>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            Conforme législation COCC
          </span>
        </div>
      </div>

      {/* Conditions Financières & Agence */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: 10,
          background: 'var(--bg, #F8F5F0)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 16
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Loyer Mensuel
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            {fcfa(bail.loyer_mensuel)}
            {bail.charges > 0 && (
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b' }}>
                {' '}+ {fcfa(bail.charges)} ch.
              </span>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Agence Mandataire
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Building2 size={14} color="var(--accent, #C75B00)" />
            <span>{bail.agence.nom}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
            {bail.agence.telephone && (
              <a
                href={`tel:${bail.agence.telephone}`}
                style={{ fontSize: 11.5, color: '#2563EB', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700 }}
              >
                <Phone size={12} />
                <span>{bail.agence.telephone}</span>
              </a>
            )}
            {bail.agence.whatsapp && (
              <a
                href={`https://wa.me/${bail.agence.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11.5, color: '#16a34a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700 }}
              >
                <MessageCircle size={12} />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Statut Global
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: echeancesEnAttente.length > 0 ? 'var(--accent, #C75B00)' : 'var(--price, #0A5C36)', marginTop: 2 }}>
            {echeancesEnAttente.length > 0 
              ? `${echeancesEnAttente.length} loyer(s) en attente`
              : 'À jour de paiement'}
          </div>
        </div>
      </div>

      {/* Prochaine Échéance Urgente (si en attente) */}
      {prochaineEcheance && (
        <div
          style={{
            background: '#FFFBEB',
            border: '1.5px solid #FCD34D',
            borderRadius: 12,
            padding: '14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <AlertCircle size={15} color="#D97706" />
              <strong style={{ fontSize: 13, color: '#92400E' }}>
                Loyer à régler : {prochaineEcheance.periode}
              </strong>
            </div>
            <div style={{ fontSize: 12, color: '#78350F' }}>
              Montant : <strong>{fcfa(prochaineEcheance.montant_du)}</strong> • Échéance : {new Date(prochaineEcheance.date_echeance).toLocaleDateString('fr-FR')}
            </div>
          </div>

          <Link
            href={prochaineEcheance.lien_paiement}
            style={{
              background: '#0284C7',
              color: '#ffffff',
              padding: '9px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
            }}
          >
            <CreditCard size={15} />
            <span>Payer par Wave</span>
          </Link>
        </div>
      )}

      {/* Liste des échéances */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Échéances de loyer ({bail.echeances.length})
          </span>
          <span style={{ fontSize: 11.5, color: '#64748b' }}>
            {echeancesPayees.length} acquittée(s)
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {echeancesAffichees.map(ech => {
            const isPaye = ech.statut === 'paye'
            return (
              <div
                key={ech.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 10,
                  background: isPaye ? '#F0FDF4' : '#ffffff',
                  border: isPaye ? '1px solid #BBF7D0' : '1px solid var(--border, #E8DDD2)',
                  fontSize: 13
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isPaye ? (
                    <CheckCircle2 size={16} color="#16a34a" />
                  ) : (
                    <Calendar size={16} color="#64748b" />
                  )}
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                      Période {ech.periode}
                    </span>
                    <span style={{ fontSize: 11.5, color: '#64748b', marginLeft: 8 }}>
                      {fcfa(ech.montant_du)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isPaye ? (
                    <a
                      href={ech.quittance_url || `/api/locatif-immo/public/quittance/${ech.id}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`quittance-${ech.periode}.pdf`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 800,
                        color: 'var(--price, #0A5C36)',
                        background: '#DCFCE7',
                        padding: '4px 10px',
                        borderRadius: 6,
                        textDecoration: 'none',
                        border: '1px solid #86EFAC'
                      }}
                    >
                      <Download size={13} />
                      <span>Quittance PDF</span>
                    </a>
                  ) : (
                    <Link
                      href={ech.lien_paiement}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#0284C7',
                        background: '#EFF6FF',
                        padding: '4px 10px',
                        borderRadius: 6,
                        textDecoration: 'none',
                        border: '1px solid #BFDBFE'
                      }}
                    >
                      <CreditCard size={13} />
                      <span>Régler</span>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {bail.echeances.length > 4 && (
          <button
            type="button"
            onClick={() => setShowAllEcheances(!showAllEcheances)}
            style={{
              marginTop: 10,
              width: '100%',
              background: 'none',
              border: '1px dashed var(--border, #E8DDD2)',
              borderRadius: 8,
              padding: '7px',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <span>{showAllEcheances ? 'Réduire la liste' : `Voir les ${bail.echeances.length - 4} autres échéances`}</span>
            {showAllEcheances ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>
    </div>
  )
}
