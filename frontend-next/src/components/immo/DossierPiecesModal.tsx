'use client'

import React, { useState } from 'react'
import { CheckCircle2, AlertCircle, X, FileCheck } from 'lucide-react'
import PieceUploadForm from './PieceUploadForm'
import PieceItemRow from './PieceItemRow'

export interface PieceJointeItem {
  id: string
  type_piece: string
  label?: string
  nom_fichier: string
  url: string
  taille?: number
  uploaded_at: string
  uploaded_by?: string
  statut?: 'en_attente' | 'valide' | 'rejete'
  motif_rejet?: string | null
}

interface DossierPiecesModalProps {
  isOpen: boolean
  bailId: string
  pieces: PieceJointeItem[]
  isAgency?: boolean
  agencySlug?: string
  tenantPhone?: string // Pour dépôt sans compte locataire
  onClose: () => void
  onRefresh: () => void
}

export default function DossierPiecesModal({
  isOpen,
  bailId,
  pieces,
  isAgency = false,
  agencySlug,
  tenantPhone,
  onClose,
  onRefresh,
}: DossierPiecesModalProps) {
  const [uploading, setUploading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleUploadFile(file: File, typePiece: string, label: string) {
    try {
      setUploading(true)
      setErrorMsg(null)
      setSuccessMsg(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type_piece', typePiece)
      formData.append('label', label)

      let endpoint = ''
      const headers: Record<string, string> = {}

      if (isAgency && agencySlug) {
        endpoint = `/api/locatif-immo/agence/${agencySlug}/baux/${bailId}/documents`
        const token = localStorage.getItem('token_immo') || localStorage.getItem('token')
        if (token) headers['Authorization'] = `Bearer ${token}`
      } else if (tenantPhone) {
        endpoint = `/api/locatif-immo/public/bail/${bailId}/documents`
        formData.append('tel', tenantPhone)
      } else {
        endpoint = `/api/locatif-immo/mes-locations/bail/${bailId}/documents`
        const token = localStorage.getItem('token_immo') || localStorage.getItem('token')
        if (token) headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors du versement du document.')
      }

      setSuccessMsg('Document ajouté avec succès au dossier locatif.')
      onRefresh()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setUploading(false)
    }
  }

  async function handleUpdateStatut(docId: string, statut: 'valide' | 'rejete') {
    if (!isAgency || !agencySlug) return
    let motif: string | null = null
    if (statut === 'rejete') {
      motif = prompt('Motif du rejet (ex: document illisible, expiré...) :')
      if (motif === null) return
    }

    try {
      setActionLoadingId(docId)
      const token = localStorage.getItem('token_immo') || localStorage.getItem('token')
      const res = await fetch(
        `/api/locatif-immo/agence/${agencySlug}/baux/${bailId}/documents/${docId}/statut`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ statut, motif_rejet: motif }),
        }
      )
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur de mise à jour')
      onRefresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleDelete(docId: string) {
    if (!isAgency || !agencySlug) return
    if (!confirm('Voulez-vous supprimer ce document du dossier ?')) return
    try {
      setActionLoadingId(docId)
      const token = localStorage.getItem('token_immo') || localStorage.getItem('token')
      const res = await fetch(
        `/api/locatif-immo/agence/${agencySlug}/baux/${bailId}/documents/${docId}`,
        {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur de suppression')
      onRefresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose()
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 600,
          boxShadow: '0 20px 50px rgba(28, 43, 74, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileCheck size={18} style={{ color: 'var(--accent, #C75B00)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                Dossier & Pièces Justificatives
              </h3>
              <p style={{ margin: 0, fontSize: 11.5, color: '#64748B' }}>
                Pièces d&apos;identité (CNI/Passeport), justificatifs de revenus et garanties
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: '20px 22px', overflowY: 'auto' }}>
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: 12.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#166534',
                fontSize: 12.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Formulaire de versement */}
          <PieceUploadForm uploading={uploading} onSubmitFile={handleUploadFile} />

          {/* Liste des documents existants */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
              Documents déposés ({pieces.length})
            </div>

            {pieces.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', fontStyle: 'italic', textAlign: 'center', padding: '16px' }}>
                Aucune pièce justificative déposée pour le moment.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pieces.map((p) => (
                  <PieceItemRow
                    key={p.id}
                    piece={p}
                    isAgency={isAgency}
                    actionLoadingId={actionLoadingId}
                    onUpdateStatut={handleUpdateStatut}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            background: '#ffffff',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              background: '#ffffff',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
