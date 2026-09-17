'use client'

import React from 'react'
import { Globe, Copy, Archive, Trash2 } from 'lucide-react'

interface BienCardMenuProps {
  bienId: string
  isPublie: boolean
  isPublishing: boolean
  onPublish: (id: string) => void
  onDuplicate: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export default function BienCardMenu({
  bienId,
  isPublie,
  isPublishing,
  onPublish,
  onDuplicate,
  onArchive,
  onDelete,
  onClose,
}: BienCardMenuProps) {
  return (
    <div
      style={{
        marginTop: 10,
        padding: '8px 10px',
        background: '#FAF8F5',
        borderRadius: 8,
        border: '1px solid var(--border, #E8DDD2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <button
        type="button"
        disabled={isPublishing}
        onClick={() => {
          onClose()
          onPublish(bienId)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          fontSize: 12,
          fontWeight: 700,
          color: isPublie ? '#92400E' : 'var(--accent, #C75B00)',
          cursor: 'pointer',
          textAlign: 'left',
          padding: '4px 0',
        }}
      >
        <Globe size={14} />
        <span>{isPublie ? 'Retirer de la marketplace' : 'Publier sur la marketplace'}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onClose()
          onDuplicate(bienId)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--navy, #1C2B4A)',
          cursor: 'pointer',
          textAlign: 'left',
          padding: '4px 0',
        }}
      >
        <Copy size={14} />
        <span>Dupliquer ce bien</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onClose()
          onArchive(bienId)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          fontSize: 12,
          fontWeight: 600,
          color: '#64748B',
          cursor: 'pointer',
          textAlign: 'left',
          padding: '4px 0',
        }}
      >
        <Archive size={14} />
        <span>Archiver</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onClose()
          onDelete(bienId)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          fontSize: 12,
          fontWeight: 700,
          color: '#DC2626',
          cursor: 'pointer',
          textAlign: 'left',
          padding: '4px 0',
        }}
      >
        <Trash2 size={14} />
        <span>Supprimer définitivement</span>
      </button>
    </div>
  )
}
