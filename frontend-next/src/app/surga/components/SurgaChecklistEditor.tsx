'use client'

import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { type SurgaChecklistItem, genererId } from '@/lib/surga-offline-sync'

interface SurgaChecklistEditorProps {
  checklist: SurgaChecklistItem[]
  onChange: (items: SurgaChecklistItem[]) => void
}

export default function SurgaChecklistEditor({ checklist, onChange }: SurgaChecklistEditorProps) {
  const [nouvelItem, setNouvelItem] = useState<string>('')

  const handleAjouter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!nouvelItem.trim()) return
    const item: SurgaChecklistItem = {
      id: genererId(),
      texte: nouvelItem.trim(),
      fait: false,
    }
    onChange([...checklist, item])
    setNouvelItem('')
  }

  const handleToggle = (id: string) => {
    onChange(checklist.map((i) => (i.id === id ? { ...i, fait: !i.fait } : i)))
  }

  const handleSupprimer = (id: string) => {
    onChange(checklist.filter((i) => i.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>
        Éléments de la liste ({checklist.length})
      </label>

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          placeholder="Ajouter un article ou une tâche (ex : 2kg de riz)..."
          value={nouvelItem}
          onChange={(e) => setNouvelItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAjouter()
            }
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--border, #E8DDD2)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => handleAjouter()}
          disabled={!nouvelItem.trim()}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: nouvelItem.trim() ? 'var(--navy, #1C2B4A)' : '#E2E8F0',
            color: '#FFFFFF',
            cursor: nouvelItem.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <Plus size={14} />
          <span>Ajouter</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
        {checklist.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', fontStyle: 'italic', padding: '6px 0' }}>
            Aucun élément dans la liste pour le moment.
          </div>
        ) : (
          checklist.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                backgroundColor: '#F8F5F0',
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              <div
                onClick={() => handleToggle(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  flex: 1,
                  textDecoration: item.fait ? 'line-through' : 'none',
                  color: item.fait ? 'var(--text3, #73675E)' : 'var(--navy, #1C2B4A)',
                }}
              >
                <input type="checkbox" checked={item.fait} onChange={() => {}} style={{ cursor: 'pointer' }} />
                <span>{item.texte}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSupprimer(item.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, color: '#DC2626' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
