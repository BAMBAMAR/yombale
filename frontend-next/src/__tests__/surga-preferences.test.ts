// @vitest-environment node
// SRG-A2-011 : réglages de l'appareil et du compte
import { describe, it, expect } from 'vitest'
import { parametresBriefing, reconcilierPreferences } from '../lib/surga-preferences-sync'

const appareil = {
  modules_actifs: ['actualites', 'meteo', 'trafic'], heure_briefing: '06:30', langue: 'fr', quartiers: ['Rufisque'],
  equipes_suivies: ['Équipe Nationale du Sénégal'], audio_actif: false, onboarding_termine: true,
}
const compte = {
  modules_actifs: ['actualites', 'sport'], heure_briefing: '08:00', langue: 'fr', quartiers: ['Almadies / Ngor'],
  equipes_suivies: ['ASC Jaraaf'], audio_actif: true, onboarding_termine: true,
}

describe('paramètres du briefing', () => {
  it('joint la zone, les briques, l\'heure et les équipes de l\'appareil', () => {
    const p = new URLSearchParams(parametresBriefing(appareil))
    expect(p.get('quartier')).toBe('Rufisque')
    expect(p.get('modules')).toBe('actualites,meteo,trafic')
    expect(p.get('heure')).toBe('06:30')
    expect(p.get('equipes')).toBe('Équipe Nationale du Sénégal')
  })

  it('ne joint rien quand l\'appareil n\'a pas de réglages', () => {
    expect(parametresBriefing(null)).toBe('')
    expect(parametresBriefing({})).toBe('')
  })

  it('ne joint pas de zone quand la liste est vide', () => {
    expect(new URLSearchParams(parametresBriefing({ ...appareil, quartiers: [] })).has('quartier')).toBe(false)
  })
})

describe('qui l\'emporte, l\'appareil ou le compte', () => {
  it('ne touche à rien pour un invité', () => {
    expect(reconcilierPreferences(appareil, { onboarding_termine: false }, { connecte: false }).action).toBe('rien')
  })

  it('envoie les réglages de l\'appareil à un compte qui n\'en a pas', () => {
    const d = reconcilierPreferences(appareil, { onboarding_termine: false, modules_actifs: ['actualites'] }, { connecte: true })
    expect(d.action).toBe('envoyer')
    if (d.action === 'envoyer') expect(d.prefs.quartiers).toEqual(['Rufisque'])
  })

  it('un compte déjà configuré impose ses réglages à un appareil qui en a d\'autres', () => {
    const d = reconcilierPreferences(appareil, compte, { connecte: true })
    expect(d.action).toBe('adopter')
    if (d.action === 'adopter') {
      expect(d.prefs.quartiers).toEqual(['Almadies / Ngor'])
      expect(d.prefs.heure_briefing).toBe('08:00')
      expect(d.prefs.audio_actif).toBe(true)
    }
  })

  it('un appareil neuf reprend le compte', () => {
    expect(reconcilierPreferences(null, compte, { connecte: true }).action).toBe('adopter')
  })

  it('un appareil neuf et un compte sans réglages : rien', () => {
    expect(reconcilierPreferences(null, { onboarding_termine: false }, { connecte: true }).action).toBe('rien')
  })

  it('un changement du compte pas encore reçu par le serveur l\'emporte', () => {
    const d = reconcilierPreferences(appareil, compte, { connecte: true, enAttente: true })
    expect(d.action).toBe('envoyer')
    if (d.action === 'envoyer') expect(d.prefs.quartiers).toEqual(['Rufisque'])
  })

  it('ne fait rien quand les réglages sont identiques', () => {
    const memes = { ...compte, modules_actifs: appareil.modules_actifs, heure_briefing: '06:30', quartiers: ['Rufisque'], equipes_suivies: appareil.equipes_suivies, audio_actif: false }
    expect(reconcilierPreferences(appareil, memes, { connecte: true }).action).toBe('rien')
    expect(reconcilierPreferences(appareil, memes, { connecte: true, enAttente: true }).action).toBe('rien')
  })

  it('garde ce que l\'appareil porte et que le compte ne connaît pas', () => {
    const local = { ...appareil, sidebar_services: ['trafic'] }
    const d = reconcilierPreferences(local, compte, { connecte: true })
    expect(d.action).toBe('adopter')
    if (d.action === 'adopter') expect(d.prefs.sidebar_services).toEqual(['trafic'])
  })

  it('ne se fie à aucune date : une configuration faite en invité n\'écrase pas le compte', () => {
    const recent = { ...appareil, modifie_le: '2099-01-01T00:00:00.000Z' } as typeof appareil
    expect(reconcilierPreferences(recent, compte, { connecte: true }).action).toBe('adopter')
  })
})
