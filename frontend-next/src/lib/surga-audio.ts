// frontend-next/src/lib/surga-audio.ts
// Moteur de synthèse vocale locale et gestion de lecture pour Surga (Tranche 9)
// Utilise la Web Speech Synthesis API : Zéro Mo de données réseau mobiles consommées

export type StatutLectureAudio = 'arrete' | 'lecture' | 'pause'

export interface AudioPlayerState {
  statut: StatutLectureAudio
  progression: number // 0 à 100
  tempsEcouleSec: number
  tempsTotalEstimeSec: number
  vitesse: number // 1, 1.25, 1.5
}

let activeUtterance: SpeechSynthesisUtterance | null = null
let intervalProgression: ReturnType<typeof setInterval> | null = null

export function estSyntheseDisponible(): boolean {
  if (typeof window === 'undefined') return false
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

/**
 * Trouve une voix française disponible dans le navigateur
 */
export function trouverVoixFrancaise(): SpeechSynthesisVoice | null {
  if (!estSyntheseDisponible()) return null
  const voices = window.speechSynthesis.getVoices()
  const voixFr = voices.find((v) => v.lang.startsWith('fr') || v.lang.startsWith('FR'))
  return voixFr || voices[0] || null
}

/**
 * Démarre la lecture par synthèse vocale locale
 */
export function demarrerLecture(
  texte: string,
  vitesse: number = 1.0,
  onEtatChange: (state: AudioPlayerState) => void,
  onFin?: () => void
): void {
  if (!estSyntheseDisponible() || !texte) return

  arreterLecture()

  // Estimation du temps de lecture : ~150 mots par minute à vitesse 1.0x
  const nbMots = texte.trim().split(/\s+/).length
  const tempsTotalEstimeSec = Math.max(5, Math.round((nbMots / (150 * vitesse)) * 60))
  let tempsEcouleSec = 0

  const utterance = new SpeechSynthesisUtterance(texte)
  utterance.lang = 'fr-FR'
  utterance.rate = vitesse
  utterance.pitch = 1.0

  const voix = trouverVoixFrancaise()
  if (voix) utterance.voice = voix

  activeUtterance = utterance

  utterance.onstart = () => {
    onEtatChange({
      statut: 'lecture',
      progression: 0,
      tempsEcouleSec: 0,
      tempsTotalEstimeSec,
      vitesse,
    })

    if (intervalProgression) clearInterval(intervalProgression)
    intervalProgression = setInterval(() => {
      tempsEcouleSec += 1
      const progression = Math.min(100, Math.round((tempsEcouleSec / tempsTotalEstimeSec) * 100))
      onEtatChange({
        statut: 'lecture',
        progression,
        tempsEcouleSec,
        tempsTotalEstimeSec,
        vitesse,
      })
    }, 1000)
  }

  utterance.onpause = () => {
    if (intervalProgression) clearInterval(intervalProgression)
    onEtatChange({
      statut: 'pause',
      progression: Math.min(100, Math.round((tempsEcouleSec / tempsTotalEstimeSec) * 100)),
      tempsEcouleSec,
      tempsTotalEstimeSec,
      vitesse,
    })
  }

  utterance.onresume = () => {
    onEtatChange({
      statut: 'lecture',
      progression: Math.min(100, Math.round((tempsEcouleSec / tempsTotalEstimeSec) * 100)),
      tempsEcouleSec,
      tempsTotalEstimeSec,
      vitesse,
    })

    if (intervalProgression) clearInterval(intervalProgression)
    intervalProgression = setInterval(() => {
      tempsEcouleSec += 1
      const progression = Math.min(100, Math.round((tempsEcouleSec / tempsTotalEstimeSec) * 100))
      onEtatChange({
        statut: 'lecture',
        progression,
        tempsEcouleSec,
        tempsTotalEstimeSec,
        vitesse,
      })
    }, 1000)
  }

  const terminer = () => {
    if (intervalProgression) {
      clearInterval(intervalProgression)
      intervalProgression = null
    }
    activeUtterance = null
    onEtatChange({
      statut: 'arrete',
      progression: 100,
      tempsEcouleSec: tempsTotalEstimeSec,
      tempsTotalEstimeSec,
      vitesse,
    })
    if (onFin) onFin()
  }

  utterance.onend = terminer
  utterance.onerror = terminer

  window.speechSynthesis.cancel() // Annuler toute lecture précédente
  window.speechSynthesis.speak(utterance)
}

/**
 * Met la lecture en pause
 */
export function pauseLecture(): void {
  if (!estSyntheseDisponible()) return
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause()
  }
}

/**
 * Reprend la lecture
 */
export function reprendreLecture(): void {
  if (!estSyntheseDisponible()) return
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume()
  }
}

/**
 * Arrête complètement la lecture
 */
export function arreterLecture(): void {
  if (intervalProgression) {
    clearInterval(intervalProgression)
    intervalProgression = null
  }
  if (estSyntheseDisponible()) {
    window.speechSynthesis.cancel()
  }
  activeUtterance = null
}
