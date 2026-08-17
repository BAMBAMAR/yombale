import { describe, it, expect } from 'vitest'
import { nomParDefautPourCategorie } from '../boutiqueHelpers'

describe('nomParDefautPourCategorie', () => {
  it('génère un nom par défaut pour chaque catégorie connue', () => {
    expect(nomParDefautPourCategorie('smartphones')).toBe('Smartphone — à modifier')
    expect(nomParDefautPourCategorie('informatique')).toBe('Article informatique — à modifier')
    expect(nomParDefautPourCategorie('tv-electro')).toBe('TV / Électroménager — à modifier')
    expect(nomParDefautPourCategorie('mode')).toBe('Article mode — à modifier')
    expect(nomParDefautPourCategorie('maison')).toBe('Article maison — à modifier')
    expect(nomParDefautPourCategorie('auto-moto')).toBe('Véhicule — à modifier')
    expect(nomParDefautPourCategorie('jeux')).toBe('Jeu / Console — à modifier')
    expect(nomParDefautPourCategorie('alimentation')).toBe('Produit alimentaire — à modifier')
    expect(nomParDefautPourCategorie('beaute')).toBe('Produit beauté — à modifier')
    expect(nomParDefautPourCategorie('services')).toBe('Service — à modifier')
    expect(nomParDefautPourCategorie('autre')).toBe('Produit — à modifier')
  })

  it('retombe sur "Produit — à modifier" si la catégorie est vide ou inconnue', () => {
    expect(nomParDefautPourCategorie('')).toBe('Produit — à modifier')
    expect(nomParDefautPourCategorie('valeur-inconnue')).toBe('Produit — à modifier')
  })
})
