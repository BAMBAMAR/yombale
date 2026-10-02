// @vitest-environment node
// AUD-231 : la bulle d'assistant ne s'affiche pas sur les pages de formulaire et les espaces de travail
import { describe, it, expect } from 'vitest'
import { bulleAssistantMasquee } from '../chat-routes'

describe('bulleAssistantMasquee', () => {
  it.each([
    '/creer-boutique', '/creer-boutique/succes', '/deposer-annonce', '/deposer-immo', '/inscription', '/connexion',
    '/mot-de-passe-oublie', '/checkout-express', '/boutique', '/boutique/caisse', '/compte', '/compte/apporteur',
    '/agence', '/agence/mon-agence/biens', '/pos', '/payer-loyer', '/payer-annonce/abc', '/connexion/',
  ])('masquée sur %s', (p) => expect(bulleAssistantMasquee(p)).toBe(true))

  it.each([
    '/', '/boutiques', '/boutiques/dievo-style', '/agences', '/immo', '/immo/123', '/annonces', '/recherche',
    '/produit/9', '/telecom', '/suivi-commande', '/tarifs-boutique', '/aide',
  ])('affichée sur %s', (p) => expect(bulleAssistantMasquee(p)).toBe(false))

  it('ne plante pas sans chemin', () => {
    expect(bulleAssistantMasquee(null)).toBe(false)
    expect(bulleAssistantMasquee(undefined)).toBe(false)
  })
})
