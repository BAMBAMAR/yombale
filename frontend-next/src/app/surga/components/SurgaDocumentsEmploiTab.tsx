'use client'

// frontend-next/src/app/surga/components/SurgaDocumentsEmploiTab.tsx
// Onglet d'historique et téléchargement des documents générés (CV & Lettres)
// Modularité stricte < 450 lignes, zéro émoji, tokens CSS officiels

import React from 'react'
import { FileText, Mail, Download, Trash2, FolderArchive } from 'lucide-react'

export interface DocumentEmploi {
  id: string
  type_document: 'cv' | 'lettre_motivation'
  titre: string
  modele_design?: string
  nom_fichier: string
  created_at: string
}

interface SurgaDocumentsEmploiTabProps {
  documents: DocumentEmploi[]
  onTelecharger: (id: string, nomFichier: string) => Promise<void>
  onSupprimer: (id: string) => Promise<void>
}

export default function SurgaDocumentsEmploiTab({
  documents,
  onTelecharger,
  onSupprimer,
}: SurgaDocumentsEmploiTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {documents.map((doc) => (
        <div
          key={doc.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 12,
            borderRadius: 8,
            backgroundColor: 'var(--bg, #F8F5F0)',
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                backgroundColor: 'rgba(28, 43, 74, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--navy, #1C2B4A)',
              }}
            >
              {doc.type_document === 'cv' ? <FileText size={16} /> : <Mail size={16} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                {doc.titre || doc.nom_fichier}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
                {doc.type_document === 'cv' ? 'Curriculum Vitae' : 'Lettre de motivation'} &bull;{' '}
                {new Date(doc.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => onTelecharger(doc.id, doc.nom_fichier)}
              className="surga-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', fontSize: 12 }}
            >
              <Download size={13} />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={() => onSupprimer(doc.id)}
              className="surga-btn-secondary"
              style={{ padding: '6px 8px', color: '#DC2626', border: 'none', background: 'none' }}
              aria-label="Supprimer ce document"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}

      {documents.length === 0 && (
        <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text3, #73675E)' }}>
          <FolderArchive size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <p style={{ fontSize: 13, margin: 0 }}>Aucun document généré pour le moment.</p>
        </div>
      )}
    </div>
  )
}
