// @vitest-environment node
// AUD-217 : le message WhatsApp reflète le mode de livraison réellement choisi
import { describe, it, expect } from 'vitest'
import { construireMessageCommande, modeLivraisonDepuisZone, phraseFinale } from '../messageCommande'

const base = {
  boutiqueNom: 'DIEVO STYLE',
  items: [{ nom: 'Lacoste', quantite: 2, prix: 6000 }],
  sousTotal: 12000,
  fraisLivraison: 0,
  reduction: 0,
  total: 12000,
  reference: 'C-TEST1',
}

describe('modeLivraisonDepuisZone', () => {
  it('reconnaît retrait, à convenir et livraison chiffrée', () => {
    expect(modeLivraisonDepuisZone({ id: 'retrait-boutique', nom: 'x' })).toBe('retrait')
    expect(modeLivraisonDepuisZone({ id: 'a-convenir', nom: 'x' })).toBe('a_convenir')
    expect(modeLivraisonDepuisZone({ id: 'uuid', nom: 'Dakar centre' })).toBe('livraison')
    expect(modeLivraisonDepuisZone(null)).toBe('livraison')
  })
})

describe('construireMessageCommande', () => {
  it('retrait : ne demande jamais d’organiser une livraison', () => {
    const m = construireMessageCommande({ ...base, mode: 'retrait' })
    expect(m).toMatch(/Retrait en boutique/)
    expect(m).toMatch(/retirer ma commande en boutique/)
    expect(m).not.toMatch(/livraison \?/i)
    expect(m).not.toMatch(/organiser la livraison/i)
  })
  it('à convenir : total d’articles seulement, question sur les frais', () => {
    const m = construireMessageCommande({ ...base, mode: 'a_convenir' })
    expect(m).toMatch(/TOTAL ARTICLES: 12\s?000 FCFA \(livraison non comprise\)/)
    expect(m).toMatch(/frais de livraison pour mon quartier \?/)
  })
  it('livraison chiffrée : total complet et confirmation de livraison', () => {
    const m = construireMessageCommande({ ...base, mode: 'livraison', fraisLivraison: 1500, total: 13500, zoneNom: 'Dakar' })
    expect(m).toMatch(/Livraison \(Dakar\): 1\s?500 FCFA/)
    expect(m).toMatch(/TOTAL: 13\s?500 FCFA/)
    expect(m).toMatch(/confirmer la livraison \?/)
  })
  it('chaque mode a sa propre phrase finale', () => {
    expect(new Set([phraseFinale('retrait'), phraseFinale('a_convenir'), phraseFinale('livraison')]).size).toBe(3)
  })
})
