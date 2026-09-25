'use client'

import React, { useState } from 'react'
import { FileText, Building2, MessageCircle } from 'lucide-react'
import { getImmoAuthToken, getImmoAuthHeaders } from '@/lib/immo-auth'
import MesLocationEcheanceItem from './MesLocationEcheanceItem'
import MesLocationHeader from './MesLocationHeader'
import SignaturePadModal from '@/components/immo/SignaturePadModal'
import DossierPiecesModal, { PieceJointeItem } from '@/components/immo/DossierPiecesModal'

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
  pieces_jointes?: PieceJointeItem[]
  signature_locataire?: string | null
  date_signature_locataire?: string | null
  nom_signataire_locataire?: string | null
  signature_bailleur?: string | null
  date_signature_bailleur?: string | null
  nom_signataire_bailleur?: string | null
  statut_signature?: string
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
  onRefresh?: () => void
}

export default function MesLocationCard({
  location: loc,
  payingId,
  onPayLoyer,
  onRefresh,
}: MesLocationCardProps) {
  const [showSignModal, setShowSignModal] = useState(false)
  const [showPiecesModal, setShowPiecesModal] = useState(false)
  const [localSigne, setLocalSigne] = useState(Boolean(loc.signature_locataire))

  const isBailleur = loc.role_vue === 'bailleur'
  const agenceWa = loc.agence.whatsapp || loc.agence.telephone
  const contratPdfUrl = getAuthPdfUrl(loc.contrat_url)
  const pieces = loc.pieces_jointes || []

  const defaultNom = isBailleur
    ? `${loc.proprietaire?.prenom || ''} ${loc.proprietaire?.nom || ''}`.trim()
    : `${loc.locataire?.prenom || ''} ${loc.locataire?.nom || ''}`.trim()

  async function handleSaveSignature(signatureDataUrl: string, signerName: string) {
    const res = await fetch(`/api/locatif-immo/mes-locations/bail/${loc.bail_id}/signer`, {
      method: 'POST',
      headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
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
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(28,43,74,0.05)',
      }}
    >
      {/* Header Extrait */}
      <MesLocationHeader
        loc={loc}
        isBailleur={isBailleur}
        localSigne={localSigne}
        contratPdfUrl={contratPdfUrl}
        piecesCount={pieces.length}
        onOpenSignModal={() => setShowSignModal(true)}
        onOpenPiecesModal={() => setShowPiecesModal(true)}
      />

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
            {loc.echeances.map((ech) => (
              <MesLocationEcheanceItem
                key={ech.id}
                ech={ech}
                isBailleur={isBailleur}
                payingId={payingId}
                contratPdfUrl={contratPdfUrl}
                getAuthPdfUrl={getAuthPdfUrl}
                onPayLoyer={onPayLoyer}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modale Signature Numérique (Canvas au doigt / souris) */}
      <SignaturePadModal
        isOpen={showSignModal}
        signerRole={isBailleur ? 'bailleur' : 'locataire'}
        defaultSignerName={defaultNom}
        onClose={() => setShowSignModal(false)}
        onSaveSignature={handleSaveSignature}
      />

      {/* Modale Dossier & Pièces Justificatives */}
      <DossierPiecesModal
        isOpen={showPiecesModal}
        bailId={loc.bail_id}
        pieces={pieces}
        onClose={() => setShowPiecesModal(false)}
        onRefresh={() => {
          if (onRefresh) onRefresh()
        }}
      />
    </div>
  )
}
