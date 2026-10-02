'use client'

import React, { useState } from 'react'
import { MapPin, Pencil, Trash2, Check, X } from 'lucide-react'
import { fcfa } from '@/lib/format'
import type { Zone } from '../types'
import { inputStyle } from '../utils'

const iconBtn: React.CSSProperties = {
  background: 'none',
  borderRadius: 6,
  padding: '4px 8px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
}

interface Props {
  zone: Zone
  busy: boolean
  onSave: (zone: Zone, nom: string, prix: number) => Promise<boolean>
  onDelete: (zone: Zone) => void
}

export default function ZoneRow({ zone, busy, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [nom, setNom] = useState(zone.nom)
  const [prix, setPrix] = useState(String(zone.prix))

  function startEdit() {
    setNom(zone.nom)
    setPrix(String(zone.prix))
    setEditing(true)
  }

  async function save() {
    const prixNum = Number(prix)
    if (!nom.trim() || prix === '' || Number.isNaN(prixNum) || prixNum < 0) return
    const ok = await onSave(zone, nom.trim(), prixNum)
    if (ok) setEditing(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${editing ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
        borderRadius: 10,
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        flexWrap: editing ? 'wrap' : 'nowrap',
      }}
    >
      {editing ? (
        <>
          <input
            autoFocus
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={100}
            style={{ ...inputStyle, flex: '1 1 200px', minWidth: 0 }}
            aria-label="Nom de la zone"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <input
              type="number"
              min={0}
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              onKeyDown={onKeyDown}
              style={{ ...inputStyle, width: 120 }}
              aria-label="Frais de livraison (FCFA)"
            />
            <button
              type="button"
              onClick={save}
              disabled={busy}
              style={{ ...iconBtn, border: '1px solid var(--price, #0A5C36)', color: 'var(--price, #0A5C36)' }}
              title="Enregistrer"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={busy}
              style={{ ...iconBtn, border: '1px solid var(--border, #E8DDD2)', color: 'var(--navy, #1C2B4A)' }}
              title="Annuler"
            >
              <X size={14} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <MapPin size={14} color="#64748b" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>{zone.nom}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--price, #0A5C36)', whiteSpace: 'nowrap', marginRight: 4 }}>
              {fcfa(zone.prix)}
            </span>
            <button
              type="button"
              onClick={startEdit}
              disabled={busy}
              style={{ ...iconBtn, border: '1px solid var(--border, #E8DDD2)', color: 'var(--navy, #1C2B4A)' }}
              title="Modifier cette zone"
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(zone)}
              disabled={busy}
              style={{ ...iconBtn, border: '1px solid #fecaca', color: '#dc2626' }}
              title="Supprimer cette zone"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
