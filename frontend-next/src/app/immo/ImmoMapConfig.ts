// frontend-next/src/app/immo/ImmoMapConfig.ts
// Configuration géographique et utilitaires pour la carte interactive PropTech

import type { AnnonceImmo } from './ImmoCard'

export interface ZoneCoord {
  id: string
  label: string
  x: number // 0 - 100% relative coordinates on Dakar Map
  y: number
  aliases: string[]
}

export const DAKAR_ZONES: ZoneCoord[] = [
  { id: 'almadies', label: 'Almadies', x: 18, y: 22, aliases: ['almadie', 'almadies'] },
  { id: 'ngor', label: 'Ngor', x: 22, y: 16, aliases: ['ngor'] },
  { id: 'yoff', label: 'Yoff', x: 38, y: 18, aliases: ['yoff', 'virage'] },
  { id: 'ouakam', label: 'Ouakam', x: 28, y: 38, aliases: ['ouakam', 'mamelles'] },
  { id: 'mermoz', label: 'Mermoz', x: 40, y: 46, aliases: ['mermoz'] },
  { id: 'fann', label: 'Fann / Point E', x: 48, y: 56, aliases: ['fann', 'point e', 'residence'] },
  { id: 'sacred_coeur', label: 'Sacré-Cœur', x: 44, y: 38, aliases: ['sacre coeur', 'liberte', 'dieuppeul'] },
  { id: 'plateau', label: 'Plateau (Centre)', x: 62, y: 78, aliases: ['plateau', 'dakar plateau', 'centre ville'] },
  { id: 'maristes', label: 'Maristes / Hann', x: 60, y: 40, aliases: ['mariste', 'maristes', 'hann'] },
  { id: 'parcelles', label: 'Parcelles Assainies', x: 55, y: 22, aliases: ['parcelles', 'parcelle', 'grand medine'] },
  { id: 'vdn', label: 'VDN', x: 42, y: 32, aliases: ['vdn', 'foire', 'nord foire', 'sud foire'] },
  { id: 'rufisque', label: 'Rufisque / Diamniadio', x: 88, y: 44, aliases: ['rufisque', 'diamniadio', 'bargny'] },
  { id: 'saly', label: 'Petite-Côte / Saly', x: 85, y: 85, aliases: ['saly', 'mbour', 'somone', 'ngaparou'] },
]

export function formatPrixCompact(prix: number | null): string {
  if (!prix) return 'N/C'
  if (prix >= 1_000_000_000) return `${(prix / 1_000_000_000).toFixed(1)} Mrd`
  if (prix >= 1_000_000) return `${Math.round(prix / 1_000_000)} M`
  if (prix >= 1_000) return `${Math.round(prix / 1_000)} k`
  return `${prix}`
}

export function resolveCoordinates(annonce: AnnonceImmo): { x: number; y: number; zoneName: string } {
  const q = (annonce.quartier || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const v = (annonce.ville || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const t = (annonce.titre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const numId = parseInt(String(annonce.id).replace(/\D/g, '').slice(-5), 10) || 42

  for (const zone of DAKAR_ZONES) {
    if (zone.aliases.some(alias => q.includes(alias) || v.includes(alias) || t.includes(alias))) {
      const hash = (numId * 9301 + 49297) % 233280
      const jitterX = ((hash % 10) - 5) * 1.4
      const jitterY = (((hash >> 4) % 10) - 5) * 1.4
      return {
        x: Math.max(8, Math.min(92, zone.x + jitterX)),
        y: Math.max(8, Math.min(92, zone.y + jitterY)),
        zoneName: zone.label,
      }
    }
  }

  const hash = (numId * 7919) % 100
  return {
    x: 42 + ((hash % 16) - 8),
    y: 44 + (((hash >> 2) % 16) - 8),
    zoneName: annonce.quartier || annonce.ville || 'Dakar',
  }
}
