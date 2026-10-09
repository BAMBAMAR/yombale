'use client'

import React from 'react'
import { Check } from 'lucide-react'

// Avantages d'une formule : la liste vient de la console d'administration (champ « avantages » de la formule).
// Aucune ligne n'est écrite ici : une promesse que le produit ne tient pas ne peut plus s'afficher par inadvertance.

export default function SurgaPremiumAvantages({ avantages }: { avantages: string[] }) {
  if (avantages.length === 0) return null
  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0, padding: 0, listStyle: 'none' }}>
      {avantages.map((texte, idx) => (
        <li key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span
            aria-hidden="true"
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              backgroundColor: 'rgba(10, 92, 54, 0.08)',
              color: 'var(--price, #0A5C36)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            <Check size={14} strokeWidth={3} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy, #1C2B4A)', lineHeight: 1.4 }}>{texte}</span>
        </li>
      ))}
    </ul>
  )
}
