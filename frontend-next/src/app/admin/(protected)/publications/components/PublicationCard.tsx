'use client'

import React from 'react'
import { Send, RotateCcw, Trash2 } from 'lucide-react'

export interface FbPost {
  id: string
  message: string
  lien: string | null
  image_url: string | null
  publier_instagram: boolean
  statut: 'brouillon' | 'approuve' | 'publie' | 'erreur'
  date_publication: string | null
  date_publie: string | null
  post_fb_id: string | null
  post_ig_id: string | null
  erreur: string | null
  created_at: string
}

const STATUT_LABEL: Record<string, { label: string; color: string }> = {
  brouillon: { label: 'Brouillon', color: '#64748b' },
  approuve: { label: 'Approuvé', color: '#d97706' },
  publie: { label: 'Publié', color: '#16a34a' },
  erreur: { label: 'Erreur', color: '#dc2626' },
}

interface PublicationCardProps {
  post: FbPost
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onStartEdit: (p: FbPost) => void
  onApprouver: (id: string) => void
  onPublierMaintenant: (id: string) => void
  onRemettreEnBrouillon: (id: string) => void
  onSupprimer: (id: string) => void
}

export function PublicationCard({
  post: p,
  isSelected: isSel,
  onToggleSelect,
  onStartEdit,
  onApprouver,
  onPublierMaintenant,
  onRemettreEnBrouillon,
  onSupprimer,
}: PublicationCardProps) {
  const st = STATUT_LABEL[p.statut] || { label: p.statut, color: '#64748b' }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        padding: 16,
        border: isSel ? '2px solid #0284c7' : '1px solid #e2e8f0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={isSel}
            onChange={() => onToggleSelect(p.id)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: st.color + '20', color: st.color }}>
            {st.label}
          </span>
          <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
            Facebook
          </span>
          {p.publier_instagram && (
            <span style={{ fontSize: 11, background: '#fdf2f8', color: '#9d174d', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
              Instagram
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>
          {new Date(p.created_at).toLocaleDateString('fr-FR')}
        </span>
      </div>

      {p.image_url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={p.image_url}
          alt="visuel publication"
          style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }}
        />
      )}

      <div style={{ fontSize: 13.5, color: '#1e293b', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #f1f5f9', marginBottom: 8, lineHeight: 1.5 }}>
        {p.message}
      </div>

      {p.date_publication && (
        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>
          Programmé pour le {new Date(p.date_publication).toLocaleString('fr-FR')}
        </p>
      )}
      {p.date_publie && (
        <p style={{ fontSize: 12, color: '#15803d', margin: '0 0 6px' }}>
          Publié le {new Date(p.date_publie).toLocaleString('fr-FR')}
          {p.post_fb_id && <span> &bull; FB Ref: {p.post_fb_id}</span>}
          {p.post_ig_id && <span> &bull; IG Ref: {p.post_ig_id}</span>}
        </p>
      )}
      {p.erreur && (
        <p style={{ fontSize: 12, color: '#dc2626', margin: '0 0 6px' }}>{p.erreur}</p>
      )}

      {p.statut !== 'publie' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {p.statut === 'brouillon' && (
            <>
              <button
                type="button"
                onClick={() => onStartEdit(p)}
                style={{ padding: '6px 12px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => onApprouver(p.id)}
                style={{ padding: '6px 12px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Approuver
              </button>
            </>
          )}
          {(p.statut === 'approuve' || p.statut === 'erreur') && (
            <>
              <button
                type="button"
                onClick={() => onPublierMaintenant(p.id)}
                style={{ padding: '6px 14px', background: '#1877f2', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Send size={13} /> Publier maintenant
              </button>
              <button
                type="button"
                onClick={() => onRemettreEnBrouillon(p.id)}
                style={{ padding: '6px 12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <RotateCcw size={13} /> Brouillon
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onSupprimer(p.id)}
            style={{ padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Trash2 size={13} /> Supprimer
          </button>
        </div>
      )}
    </div>
  )
}
