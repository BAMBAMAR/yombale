// Texte du briefing audio : une demande qui échoue est refaite ; avant, un seul échec muet faisait disparaître
// le lecteur, audio activé.
import { describe, it, expect, vi } from 'vitest'
import { obtenirScriptAudio, ATTENTES_MS } from '@/lib/useSurgaAudioScript'

const sansAttente = { attendre: async () => {} }

describe('obtenirScriptAudio', () => {
  it('le serveur échoue deux fois puis répond : le texte est obtenu au troisième essai', async () => {
    const lire = vi.fn()
      .mockRejectedValueOnce(new Error('502'))
      .mockRejectedValueOnce(new Error('réseau'))
      .mockResolvedValueOnce('Bonjour. Voici l’essentiel.')
    expect(await obtenirScriptAudio(lire, sansAttente)).toBe('Bonjour. Voici l’essentiel.')
    expect(lire).toHaveBeenCalledTimes(3)
  })

  it('premier essai réussi : une seule demande', async () => {
    const lire = vi.fn().mockResolvedValue('Bonjour.')
    expect(await obtenirScriptAudio(lire, sansAttente)).toBe('Bonjour.')
    expect(lire).toHaveBeenCalledTimes(1)
  })

  it('tous les essais échouent, ou le texte est vide : null, pour que l’écran le dise', async () => {
    expect(await obtenirScriptAudio(vi.fn().mockRejectedValue(new Error('503')), sansAttente)).toBeNull()
    const vide = vi.fn().mockResolvedValue('')
    expect(await obtenirScriptAudio(vide, sansAttente)).toBeNull()
    expect(vide).toHaveBeenCalledTimes(ATTENTES_MS.length)
  })

  it('les essais sont espacés, le premier part sans attendre', async () => {
    const delais: number[] = []
    await obtenirScriptAudio(vi.fn().mockRejectedValue(new Error('503')), { attendre: async (ms) => { delais.push(ms) } })
    expect(delais).toEqual(ATTENTES_MS.filter((ms) => ms > 0))
  })

  it('demande remplacée par une plus récente : aucun nouvel essai', async () => {
    const lire = vi.fn().mockRejectedValue(new Error('503'))
    let abandon = false
    const attendre = async () => { abandon = true }
    expect(await obtenirScriptAudio(lire, { attendre, abandonne: () => abandon })).toBeNull()
    expect(lire).toHaveBeenCalledTimes(1)
  })
})
