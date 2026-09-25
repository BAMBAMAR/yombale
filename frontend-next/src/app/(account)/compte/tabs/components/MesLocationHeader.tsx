'use client'

import React from 'react'
import { FileText, Download, PenTool, CheckCircle2, FileCheck } from 'lucide-react'
import { LocationItem } from './MesLocationCard'

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR')

interface Props {
  loc: LocationItem
  isBailleur: boolean
  localSigne: boolean
  contratPdfUrl: string
  piecesCount: number
  onOpenSignModal: () => void
  onOpenPiecesModal: () => void
}

export default function MesLocationHeader({
  loc,
  isBailleur,
  localSigne,
  contratPdfUrl,
  piecesCount,
  onOpenSignModal,
  onOpenPiecesModal,
}: Props) {
  return (
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
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
            {isBailleur ? 'Espace Propriétaire' : loc.statut_bail === 'actif' ? 'Bail en cours' : loc.statut_bail}
          </span>

          {localSigne || loc.signature_locataire ? (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 10,
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
                borderRadius: 10,
                background: '#FEF3C7',
                color: '#92400E',
              }}
            >
              Signature en attente
            </span>
          )}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 4 }}>
          {!localSigne && !loc.signature_locataire && (
            <button
              type="button"
              onClick={onOpenSignModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(199,91,0,0.25)',
              }}
            >
              <PenTool size={13} />
              <span>Signer le bail</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenPiecesModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 8,
              background: '#FAF8F5',
              color: 'var(--navy, #1C2B4A)',
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <FileCheck size={13} style={{ color: 'var(--accent, #C75B00)' }} />
            <span>Dossier ({piecesCount})</span>
          </button>

          {contratPdfUrl && (
            <a
              href={contratPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={`contrat_bail_${loc.bail_id.slice(0, 8)}.pdf`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <FileText size={13} style={{ color: 'var(--accent, #C75B00)' }} />
              <span>PDF</span>
              <Download size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
