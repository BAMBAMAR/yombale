'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Download,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  PenTool,
  FileCheck,
} from 'lucide-react'
import { fcfa } from '@/lib/format'
import BailLocataireEcheanceItem from './BailLocataireEcheanceItem'
import BailLocataireFinanceSummary from './BailLocataireFinanceSummary'
import SignaturePadModal from '@/components/immo/SignaturePadModal'
import DossierPiecesModal, { PieceJointeItem } from '@/components/immo/DossierPiecesModal'

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
  pieces_jointes?: PieceJointeItem[]
  signature_locataire?: string | null
  date_signature_locataire?: string | null
  nom_signataire_locataire?: string | null
  signature_bailleur?: string | null
  date_signature_bailleur?: string | null
  statut_signature?: string
  locataire_nom?: string
  locataire_prenom?: string
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
  tenantPhone?: string
  onRefresh?: () => void
}

export default function BailLocataireCard({ bail, tenantPhone, onRefresh }: Props) {
  const [showAllEcheances, setShowAllEcheances] = useState(false)
  const [showSignModal, setShowSignModal] = useState(false)
  const [showPiecesModal, setShowPiecesModal] = useState(false)
  const [localSigne, setLocalSigne] = useState(Boolean(bail.signature_locataire))

  const echeancesEnAttente = bail.echeances.filter((e) => e.statut !== 'paye')
  const echeancesPayees = bail.echeances.filter((e) => e.statut === 'paye')
  const prochaineEcheance = echeancesEnAttente[0] || null

  const echeancesAffichees = showAllEcheances ? bail.echeances : bail.echeances.slice(0, 4)
  const pieces = bail.pieces_jointes || []
  const defaultNom = `${bail.locataire_prenom || ''} ${bail.locataire_nom || ''}`.trim()

  async function handleSaveSignature(signatureDataUrl: string, signerName: string) {
    if (!tenantPhone) {
      throw new Error('Numéro de téléphone introuvable pour valider la signature.')
    }
    const res = await fetch(`/api/locatif-immo/public/bail/${bail.id}/signer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tel: tenantPhone,
        signature: signatureDataUrl,
        nom_signataire: signerName,
      }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erreur lors de la signature du contrat.')
    }
    setLocalSigne(true)
    if (onRefresh) onRefresh()
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid var(--border, #E8DDD2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        padding: '20px',
        marginBottom: 20,
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
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--price, #0A5C36)',
                background: '#DCFCE7',
                padding: '3px 8px',
                borderRadius: 6,
              }}
            >
              BAIL ACTIF
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-subtle, #5A4E42)' }}>
              Échéance le {bail.jour_echeance || 5} du mois
            </span>

            {/* Statut de signature électronique */}
            {localSigne || bail.signature_locataire ? (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: '#DCFCE7',
                  color: '#166534',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <CheckCircle2 size={11} />
                <span>Bail signé électroniquement</span>
              </span>
            ) : (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: '#FEF3C7',
                  color: '#92400E',
                }}
              >
                Signature en attente
              </span>
            )}
          </div>

          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            {bail.bien_titre}
          </h3>

          <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
            {bail.bien_adresse ? `${bail.bien_adresse}, ` : ''}
            {bail.bien_quartier ? `${bail.bien_quartier} - ` : ''}
            {bail.bien_ville || 'Dakar'}
          </p>
        </div>

        {/* Boutons d'actions rapides (PDF, Signature, Dossier) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {!localSigne && !bail.signature_locataire && (
              <button
                type="button"
                onClick={() => setShowSignModal(true)}
                style={{
                  background: 'var(--accent, #C75B00)',
                  color: '#ffffff',
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  boxShadow: '0 2px 6px rgba(199,91,0,0.25)',
                }}
              >
                <PenTool size={13} />
                <span>Signer mon bail</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowPiecesModal(true)}
              style={{
                background: '#FAF8F5',
                color: 'var(--navy, #1C2B4A)',
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                border: '1px solid var(--border, #E8DDD2)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <FileCheck size={13} style={{ color: 'var(--accent, #C75B00)' }} />
              <span>Dossier ({pieces.length})</span>
            </button>

            <a
              href={bail.contrat_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              download={`contrat-bail-${bail.id.slice(0, 8)}.pdf`}
              style={{
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: '0 2px 8px rgba(28, 43, 74, 0.2)',
              }}
            >
              <FileText size={13} />
              <span>PDF</span>
              <Download size={12} />
            </a>
          </div>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            Conforme législation COCC Sénégal
          </span>
        </div>
      </div>

      {/* Conditions Financières & Agence (Composant extrait) */}
      <BailLocataireFinanceSummary bail={bail} echeancesEnAttenteCount={echeancesEnAttente.length} />

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
            flexWrap: 'wrap',
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
              Montant : <strong>{fcfa(prochaineEcheance.montant_du)}</strong> &bull; Échéance :{' '}
              {new Date(prochaineEcheance.date_echeance).toLocaleDateString('fr-FR')}
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
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
            }}
          >
            <CreditCard size={15} />
            <span>Payer par Wave</span>
          </Link>
        </div>
      )}

      {/* Liste des échéances */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Échéances de loyer ({bail.echeances.length})
          </span>
          <span style={{ fontSize: 11.5, color: '#64748b' }}>
            {echeancesPayees.length} acquittée(s)
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {echeancesAffichees.map((ech) => (
            <BailLocataireEcheanceItem key={ech.id} ech={ech} />
          ))}
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
              gap: 4,
            }}
          >
            <span>{showAllEcheances ? 'Réduire la liste' : `Voir les ${bail.echeances.length - 4} autres échéances`}</span>
            {showAllEcheances ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Modale Signature Numérique (tactile ou souris) */}
      <SignaturePadModal
        isOpen={showSignModal}
        signerRole="locataire"
        defaultSignerName={defaultNom}
        onClose={() => setShowSignModal(false)}
        onSaveSignature={handleSaveSignature}
      />

      {/* Modale Dossier & Pièces Justificatives */}
      <DossierPiecesModal
        isOpen={showPiecesModal}
        bailId={bail.id}
        pieces={pieces}
        tenantPhone={tenantPhone}
        onClose={() => setShowPiecesModal(false)}
        onRefresh={() => {
          if (onRefresh) onRefresh()
        }}
      />
    </div>
  )
}
