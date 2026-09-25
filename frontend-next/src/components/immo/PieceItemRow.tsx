'use client'

import React from 'react'
import { FileText, CheckCircle2, ShieldAlert, Clock, ExternalLink, Trash2 } from 'lucide-react'
import { PieceJointeItem } from './DossierPiecesModal'

interface Props {
  piece: PieceJointeItem
  isAgency?: boolean
  actionLoadingId: string | null
  onUpdateStatut: (docId: string, statut: 'valide' | 'rejete') => void
  onDelete: (docId: string) => void
}

export default function PieceItemRow({
  piece: p,
  isAgency = false,
  actionLoadingId,
  onUpdateStatut,
  onDelete,
}: Props) {
  const isValide = p.statut === 'valide'
  const isRejete = p.statut === 'rejete'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderRadius: 10,
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#F1F5F9',
            color: 'var(--navy, #1C2B4A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FileText size={16} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {p.label || p.type_piece}
          </div>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            {p.nom_fichier} &bull; Déposé le {new Date(p.uploaded_at).toLocaleDateString('fr-FR')}
          </div>
          {isRejete && p.motif_rejet && (
            <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, marginTop: 2 }}>
              Motif : {p.motif_rejet}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Statut badge */}
        <span
          style={{
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 10.5,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: isValide ? '#DCFCE7' : isRejete ? '#FEE2E2' : '#FEF3C7',
            color: isValide ? '#166534' : isRejete ? '#991B1B' : '#92400E',
          }}
        >
          {isValide ? <CheckCircle2 size={12} /> : isRejete ? <ShieldAlert size={12} /> : <Clock size={12} />}
          <span>{isValide ? 'Validé' : isRejete ? 'Rejeté' : 'En vérification'}</span>
        </span>

        {/* Lien Voir */}
        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            borderRadius: 6,
            background: '#F1F5F9',
            color: 'var(--navy, #1C2B4A)',
            border: '1px solid #CBD5E1',
            fontSize: 11.5,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={12} />
          <span>Ouvrir</span>
        </a>

        {/* Actions Agence */}
        {isAgency && (
          <div style={{ display: 'inline-flex', gap: 4 }}>
            {!isValide && (
              <button
                type="button"
                onClick={() => onUpdateStatut(p.id, 'valide')}
                disabled={actionLoadingId === p.id}
                style={{
                  padding: '5px 8px',
                  borderRadius: 6,
                  background: '#DCFCE7',
                  color: '#166534',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
                title="Valider ce document"
              >
                Valider
              </button>
            )}
            {!isRejete && (
              <button
                type="button"
                onClick={() => onUpdateStatut(p.id, 'rejete')}
                disabled={actionLoadingId === p.id}
                style={{
                  padding: '5px 8px',
                  borderRadius: 6,
                  background: '#FEE2E2',
                  color: '#991B1B',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
                title="Rejeter ce document"
              >
                Rejeter
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(p.id)}
              disabled={actionLoadingId === p.id}
              style={{
                padding: '5px 8px',
                borderRadius: 6,
                background: '#FFF1F2',
                color: '#E11D48',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Supprimer"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
