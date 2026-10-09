// Lecture du briefing : le texte part phrase par phrase (un bloc unique était coupé par le navigateur),
// la pause retient la phrase en cours, une erreur du moteur ne met pas fin à la lecture, et la voix retenue
// est la plus naturelle de l'appareil.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  decouperEnPhrases,
  choisirVoixFrancaise,
  demarrerLecture,
  pauseLecture,
  reprendreLecture,
  changerVitesseLecture,
  arreterLecture,
  type AudioPlayerState,
} from '@/lib/surga-audio'

const BRIEFING =
  "Bonjour. Nous sommes le vendredi 9 octobre. Voici l'essentiel du jour pour Rufisque. Dans l'actualité. " +
  "À la une, Leral.net rapporte : M. Sall annonce un cadencement renforcé du TER, avec des départs toutes les dix minutes aux heures de pointe, " +
  "des rames supplémentaires le samedi, une tarification revue pour les abonnés et une extension des horaires jusqu'à 23 heures en semaine. " +
  "APS écrit : Le prix du riz recule de 2.5 pour cent. Côté sport. Sénégal 2, Burkina Faso 0. C'est tout pour le moment. Bonne journée."

describe('decouperEnPhrases', () => {
  it('aucune phrase au-dessus de la longueur maximale, aucun mot perdu', () => {
    const phrases = decouperEnPhrases(BRIEFING)
    expect(phrases.length).toBeGreaterThan(8)
    for (const p of phrases) expect(p.length).toBeLessThanOrEqual(160)
    expect(phrases.join(' ')).toBe(BRIEFING)
  })

  it('un point ne coupe ni un nom de site, ni une abréviation, ni un nombre', () => {
    const phrases = decouperEnPhrases('Leral.net rapporte : M. Sall arrive. Le riz recule de 2.5 pour cent. Fin.')
    expect(phrases).toEqual(['Leral.net rapporte : M. Sall arrive.', 'Le riz recule de 2.5 pour cent.', 'Fin.'])
  })

  it('un score suivi d\'un point termine bien la phrase', () => {
    expect(decouperEnPhrases('Sénégal 2, Burkina Faso 0. Bonne journée.')).toEqual(['Sénégal 2, Burkina Faso 0.', 'Bonne journée.'])
  })

  it('texte vide : aucune phrase', () => {
    expect(decouperEnPhrases('   ')).toEqual([])
  })
})

describe('choisirVoixFrancaise', () => {
  const v = (name: string, lang: string, localService = true) => ({ name, lang, localService })

  it('Chrome sur Windows : la voix Google plutôt que la voix métallique du système, sauf hors connexion', () => {
    const voix = [v('Microsoft Hortense - French (France)', 'fr-FR'), v('Google Deutsch', 'de-DE', false), v('Google français', 'fr-FR', false)]
    expect(choisirVoixFrancaise(voix, true)?.name).toBe('Google français')
    expect(choisirVoixFrancaise(voix, false)?.name).toBe('Microsoft Hortense - French (France)')
  })

  it('Edge : la voix « Natural » passe devant', () => {
    const voix = [v('Microsoft Paul - French (France)', 'fr-FR'), v('Microsoft Denise Online (Natural) - French (France)', 'fr-FR', false)]
    expect(choisirVoixFrancaise(voix)?.name).toContain('Denise')
  })

  it('iPhone : ni l\'accent canadien en premier de liste, ni une voix de fantaisie', () => {
    const voix = [v('Amélie', 'fr-CA'), v('Eddy (français (France))', 'fr-FR'), v('Thomas', 'fr-FR')]
    expect(choisirVoixFrancaise(voix)?.name).toBe('Thomas')
  })

  it('sans voix française : aucune voix étrangère n\'est imposée', () => {
    expect(choisirVoixFrancaise([v('Google US English', 'en-US', false), v('Anna', 'de_DE')])).toBeNull()
  })

  it('langue écrite avec un tiret bas (Android)', () => {
    expect(choisirVoixFrancaise([v('français France', 'fr_FR')])?.lang).toBe('fr_FR')
  })
})

describe('lecture phrase par phrase', () => {
  type Enonce = { text: string; rate: number; onend?: () => void; onerror?: (e: { error: string }) => void }
  let dits: Enonce[]
  let annulations: number
  let etats: AudioPlayerState[]
  const dernier = () => dits[dits.length - 1]

  beforeEach(() => {
    vi.useFakeTimers()
    dits = []
    annulations = 0
    etats = []
    ;(globalThis as any).SpeechSynthesisUtterance = function (this: Enonce, text: string) {
      this.text = text
      this.rate = 1
    }
    ;(window as any).SpeechSynthesisUtterance = (globalThis as any).SpeechSynthesisUtterance
    ;(window as any).speechSynthesis = {
      speaking: true,
      pending: false,
      getVoices: () => [],
      speak: (u: Enonce) => dits.push(u),
      cancel: () => { annulations += 1 },
    }
  })

  afterEach(() => {
    arreterLecture()
    vi.useRealTimers()
  })

  it('le briefing est remis au moteur en plusieurs énoncés courts, enchaînés jusqu\'à la fin', () => {
    const fin = vi.fn()
    demarrerLecture(BRIEFING, 1, (e) => etats.push(e), fin)
    const attendues = decouperEnPhrases(BRIEFING)
    expect(dits).toHaveLength(1)
    expect(dits[0].text).toBe(attendues[0])
    for (let i = 0; i < attendues.length - 1; i++) dernier().onend?.()
    expect(dits.map((d) => d.text)).toEqual(attendues)
    expect(fin).not.toHaveBeenCalled()
    dernier().onend?.()
    expect(fin).toHaveBeenCalledTimes(1)
    expect(etats[etats.length - 1]).toMatchObject({ statut: 'arrete', progression: 100 })
  })

  it('une erreur du moteur sur une phrase ne met pas fin à la lecture', () => {
    const fin = vi.fn()
    demarrerLecture(BRIEFING, 1, (e) => etats.push(e), fin)
    dernier().onerror?.({ error: 'synthesis-failed' })
    expect(dits).toHaveLength(2)
    expect(dits[1].text).toBe(decouperEnPhrases(BRIEFING)[1])
    expect(fin).not.toHaveBeenCalled()
  })

  it('pause puis reprise : la phrase en cours est relue, sans saut ni retour au début', () => {
    demarrerLecture(BRIEFING, 1, (e) => etats.push(e))
    dernier().onend?.()
    const enCours = dernier()
    pauseLecture()
    expect(annulations).toBeGreaterThan(0)
    expect(etats[etats.length - 1].statut).toBe('pause')
    // Le moteur signale la fin de l'énoncé annulé : rien ne doit s'enchaîner pendant la pause.
    enCours.onerror?.({ error: 'interrupted' })
    enCours.onend?.()
    expect(dits).toHaveLength(2)
    reprendreLecture()
    expect(dits).toHaveLength(3)
    expect(dits[2].text).toBe(enCours.text)
    expect(etats[etats.length - 1].statut).toBe('lecture')
  })

  it('changement de vitesse : la lecture continue à la phrase en cours', () => {
    demarrerLecture(BRIEFING, 1, (e) => etats.push(e))
    dernier().onend?.()
    const enCours = dernier()
    changerVitesseLecture(1.5)
    expect(dernier().text).toBe(enCours.text)
    expect(dernier().rate).toBe(1.5)
    enCours.onend?.()
    expect(dits).toHaveLength(3)
  })

  it('moteur muet sans signal : la phrase est relancée, puis passée', () => {
    demarrerLecture(BRIEFING, 1, (e) => etats.push(e))
    const premiere = dits[0].text
    ;(window as any).speechSynthesis.speaking = false
    vi.advanceTimersByTime(2000)
    expect(dits).toHaveLength(2)
    expect(dits[1].text).toBe(premiere)
    vi.advanceTimersByTime(2000)
    expect(dits[2].text).toBe(premiere)
    vi.advanceTimersByTime(2000)
    expect(dits[3].text).toBe(decouperEnPhrases(BRIEFING)[1])
  })
})
