// Modération du trafic : un signalement sans type ou sans date ne fait pas planter la liste.
// L'écran lisait un champ absent de la table (type_incident) et appelait toUpperCase() dessus : la page tombait
// dès qu'un signalement existait.
import { describe, it, expect } from 'vitest'
import { libelleType, dateSignalement } from '@/app/admin/surga/components/AdminTraficTab'

describe('modération du trafic : libellés', () => {
  it('type absent ou vide : un libellé, pas une erreur', () => {
    expect(libelleType(undefined)).toBe('Non précisé')
    expect(libelleType(null)).toBe('Non précisé')
    expect(libelleType('')).toBe('Non précisé')
  })

  it('types de la table, et type inconnu affiché tel quel avec une majuscule', () => {
    expect(libelleType('accident')).toBe('Accident')
    expect(libelleType('dense')).toBe('Trafic dense')
    expect(libelleType('inondation')).toBe('Inondation')
  })

  it('date et heure du signalement à l’heure de Dakar ; date illisible signalée', () => {
    expect(dateSignalement('2026-10-09T13:02:58.815Z')).toMatch(/09\/10.*13:02/)
    expect(dateSignalement(undefined)).toBe('Date inconnue')
    expect(dateSignalement('pas une date')).toBe('Date inconnue')
  })
})
