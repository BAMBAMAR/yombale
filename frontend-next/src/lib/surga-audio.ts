// frontend-next/src/lib/surga-audio.ts
// Lecture du briefing par la voix de l'appareil (Web Speech Synthesis API).
// Le texte est lu phrase par phrase : remis en un seul bloc, il était coupé par le navigateur (Chrome s'arrête
// vers quinze secondes) et la moindre erreur mettait fin à toute la lecture. La pause du navigateur vaut un arrêt
// sur Android : la pause retient donc la phrase en cours et la reprise la relit.

export type StatutLectureAudio = 'arrete' | 'lecture' | 'pause'

export interface AudioPlayerState {
  statut: StatutLectureAudio
  progression: number // 0 à 100
  tempsEcouleSec: number
  tempsTotalEstimeSec: number
  vitesse: number // 1, 1.25, 1.5
}

export interface VoixDecrite {
  name: string
  lang: string
  localService: boolean
  default?: boolean
}

// Une phrase de 160 caractères dure une dizaine de secondes à vitesse normale : sous le seuil de coupure de Chrome.
const LONGUEUR_MAX = 160
const CARACTERES_PAR_SECONDE = 15
const RELANCES_MAX = 2
const ABREVIATIONS = new Set(['mm', 'mme', 'mlle', 'dr', 'pr', 'me', 'st', 'ste', 'cf'])

export function estSyntheseDisponible(): boolean {
  if (typeof window === 'undefined') return false
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

function couperPhraseLongue(phrase: string, max: number): string[] {
  if (phrase.length <= max) return [phrase]
  // Coupe aux virgules, points-virgules et deux-points suivis d'un espace, puis aux espaces si un segment reste trop long.
  const segments = (phrase.match(/[^,;:]+(?:[,;:](?!\s)[^,;:]*)*[,;:]*\s*/g) || [phrase]).flatMap((s) =>
    s.length <= max ? [s] : s.match(/\S+\s*/g) || [s],
  )
  const morceaux: string[] = []
  let courant = ''
  for (const s of segments) {
    if (courant && (courant + s).trim().length > max) {
      morceaux.push(courant.trim())
      courant = ''
    }
    courant += s
  }
  if (courant.trim()) morceaux.push(courant.trim())
  return morceaux
}

/**
 * Découpe un texte en phrases courtes, sans perdre un mot. Un point ne termine pas la phrase dans « Leral.net »,
 * « M. Sall » ou « 2.5 ».
 */
export function decouperEnPhrases(texte: string, longueurMax: number = LONGUEUR_MAX): string[] {
  const propre = (texte || '').replace(/\s+/g, ' ').trim()
  if (!propre) return []
  const phrases: string[] = []
  const fin = /[.!?…]+["»)]*\s+/g
  let debut = 0
  let m: RegExpExecArray | null
  while ((m = fin.exec(propre))) {
    const suite = propre.charAt(m.index + m[0].length)
    const motAvant = (propre.slice(debut, m.index).split(' ').pop() || '').toLowerCase()
    const abreviation = m[0].trim() === '.' && (/^[a-zà-ÿ]$/.test(motAvant) || ABREVIATIONS.has(motAvant))
    if (abreviation || !/[A-ZÀ-ÖØ-Þ0-9«"]/.test(suite)) continue
    phrases.push(propre.slice(debut, m.index + m[0].length).trim())
    debut = m.index + m[0].length
  }
  if (debut < propre.length) phrases.push(propre.slice(debut).trim())
  return phrases.flatMap((p) => couperPhraseLongue(p, longueurMax))
}

function noteVoix(v: VoixDecrite): number {
  const lang = v.lang.toLowerCase().replace('_', '-')
  let note = lang === 'fr-fr' ? 30 : lang === 'fr-ca' ? 10 : 20
  if (/natural|neural/i.test(v.name)) note += 60
  else if (/premium|enhanced|améliorée/i.test(v.name)) note += 50
  else if (/siri/i.test(v.name)) note += 45
  else if (/^google/i.test(v.name)) note += 40
  if (/^(thomas|audrey|aur[ée]lie|marie|daniel)\b/i.test(v.name)) note += 10
  // Voix de synthèse anciennes ou de fantaisie : les plus métalliques.
  if (/hortense|julie|paul|desktop|compact/i.test(v.name)) note -= 10
  if (/^(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|jacques)\b/i.test(v.name)) note -= 30
  if (/espeak/i.test(v.name)) note -= 40
  if (v.default) note += 5
  if (v.localService) note += 3
  return note
}

/**
 * Choisit la voix française la plus naturelle de l'appareil. Hors connexion, seules les voix installées comptent.
 * Sans voix française, rend null : le moteur choisit d'après la langue, plutôt qu'une voix étrangère lisant du français.
 */
export function choisirVoixFrancaise<V extends VoixDecrite>(voix: V[], enLigne: boolean = true): V | null {
  const candidates = voix.filter((v) => /^fr\b/i.test(v.lang.replace('_', '-')) && (enLigne || v.localService))
  if (candidates.length === 0) return null
  return candidates.reduce((meilleure, v) => (noteVoix(v) > noteVoix(meilleure) ? v : meilleure))
}

let voixConnues: SpeechSynthesisVoice[] = []

/**
 * Charge la liste des voix. À appeler à l'affichage du lecteur : la liste arrive après coup dans Chrome, et la
 * lecture doit partir dans le geste de l'utilisateur, sans attente.
 */
export function prechargerVoix(surChangement?: () => void): () => void {
  if (!estSyntheseDisponible()) return () => {}
  const synth = window.speechSynthesis
  const lire = () => {
    voixConnues = synth.getVoices()
    if (surChangement) surChangement()
  }
  lire()
  synth.addEventListener?.('voiceschanged', lire)
  return () => synth.removeEventListener?.('voiceschanged', lire)
}

function voixRetenue(): SpeechSynthesisVoice | null {
  if (voixConnues.length === 0 && estSyntheseDisponible()) voixConnues = window.speechSynthesis.getVoices()
  const enLigne = typeof navigator === 'undefined' || navigator.onLine !== false
  return choisirVoixFrancaise(voixConnues, enLigne)
}

/** Vrai quand la voix retenue est diffusée par le réseau : la lecture consomme alors des données. */
export function voixRetenueEstEnLigne(): boolean {
  const v = voixRetenue()
  return Boolean(v && !v.localService)
}

interface Lecture {
  phrases: string[]
  index: number
  vitesse: number
  statut: StatutLectureAudio
  passe: number
  relances: number
  silences: number
  debutPhraseMs: number
  caracteresTotal: number
  tempsTotalEstimeSec: number
  voix: SpeechSynthesisVoice | null
  onEtatChange: (state: AudioPlayerState) => void
  onFin?: () => void
}

let lecture: Lecture | null = null
let minuterie: ReturnType<typeof setInterval> | null = null
// Référence gardée : sans elle, Chrome peut libérer l'énoncé en cours et ne jamais signaler sa fin.
let enonceEnCours: SpeechSynthesisUtterance | null = null

function etatDe(l: Lecture): AudioPlayerState {
  const avant = l.phrases.slice(0, l.index).reduce((n, p) => n + p.length, 0)
  const courante = l.phrases[l.index]?.length || 0
  const dureeMs = (courante / (CARACTERES_PAR_SECONDE * l.vitesse)) * 1000
  const part = l.statut === 'lecture' && dureeMs > 0 ? Math.min(1, (Date.now() - l.debutPhraseMs) / dureeMs) : 0
  const ratio = l.caracteresTotal > 0 ? Math.min(1, (avant + courante * part) / l.caracteresTotal) : 0
  return {
    statut: l.statut,
    progression: Math.round(ratio * 100),
    tempsEcouleSec: Math.round(ratio * l.tempsTotalEstimeSec),
    tempsTotalEstimeSec: l.tempsTotalEstimeSec,
    vitesse: l.vitesse,
  }
}

function arreterMinuterie(): void {
  if (minuterie) clearInterval(minuterie)
  minuterie = null
}

function terminer(l: Lecture): void {
  arreterMinuterie()
  lecture = null
  enonceEnCours = null
  l.onEtatChange({ statut: 'arrete', progression: 100, tempsEcouleSec: l.tempsTotalEstimeSec, tempsTotalEstimeSec: l.tempsTotalEstimeSec, vitesse: l.vitesse })
  if (l.onFin) l.onFin()
}

function direPhraseCourante(l: Lecture): void {
  if (l.index >= l.phrases.length) return terminer(l)
  const passe = ++l.passe
  const enonce = new SpeechSynthesisUtterance(l.phrases[l.index])
  enonce.lang = l.voix?.lang || 'fr-FR'
  enonce.rate = l.vitesse
  enonce.pitch = 1.0
  if (l.voix) enonce.voice = l.voix

  const suivante = () => {
    // Fin signalée par un énoncé annulé (pause, arrêt, changement de vitesse) : rien à enchaîner.
    if (lecture !== l || l.passe !== passe || l.statut !== 'lecture') return
    l.index += 1
    l.relances = 0
    direPhraseCourante(l)
  }
  enonce.onend = suivante
  // Une phrase que le moteur refuse ne met plus fin au briefing : on passe à la suivante.
  enonce.onerror = (e) => {
    if (e.error === 'interrupted' || e.error === 'canceled') return
    suivante()
  }

  enonceEnCours = enonce
  l.debutPhraseMs = Date.now()
  l.silences = 0
  window.speechSynthesis.speak(enonce)
  l.onEtatChange(etatDe(l))
}

function battre(): void {
  const l = lecture
  if (!l || l.statut !== 'lecture') return
  const synth = window.speechSynthesis
  // Le moteur s'est tu sans prévenir (retour d'arrière-plan, énoncé avalé après une annulation) : la phrase est
  // relancée, puis passée si elle échoue encore.
  l.silences = synth.speaking || synth.pending ? 0 : l.silences + 1
  if (l.silences >= 2) {
    if (l.relances >= RELANCES_MAX) {
      l.index += 1
      l.relances = 0
    } else {
      l.relances += 1
    }
    synth.cancel()
    return direPhraseCourante(l)
  }
  l.onEtatChange(etatDe(l))
}

/**
 * Démarre la lecture. À appeler dans le geste de l'utilisateur (exigence d'iOS).
 */
export function demarrerLecture(
  texte: string,
  vitesse: number = 1.0,
  onEtatChange: (state: AudioPlayerState) => void,
  onFin?: () => void
): void {
  if (!estSyntheseDisponible() || !texte) return
  arreterLecture()

  const phrases = decouperEnPhrases(texte)
  if (phrases.length === 0) return
  const nbMots = texte.trim().split(/\s+/).length
  const l: Lecture = {
    phrases,
    index: 0,
    vitesse,
    statut: 'lecture',
    passe: 0,
    relances: 0,
    silences: 0,
    debutPhraseMs: Date.now(),
    caracteresTotal: phrases.reduce((n, p) => n + p.length, 0),
    // ~150 mots par minute à vitesse normale
    tempsTotalEstimeSec: Math.max(5, Math.round((nbMots / (150 * vitesse)) * 60)),
    voix: voixRetenue(),
    onEtatChange,
    onFin,
  }
  lecture = l
  minuterie = setInterval(battre, 1000)
  direPhraseCourante(l)
}

/** Met en pause : la phrase en cours est retenue et sera relue à la reprise. */
export function pauseLecture(): void {
  const l = lecture
  if (!l || l.statut !== 'lecture') return
  l.statut = 'pause'
  l.passe += 1
  window.speechSynthesis.cancel()
  l.onEtatChange(etatDe(l))
}

export function reprendreLecture(): void {
  const l = lecture
  if (!l || l.statut !== 'pause') return
  l.statut = 'lecture'
  direPhraseCourante(l)
}

/** Change la vitesse sans revenir au début : la phrase en cours est relue à la nouvelle vitesse. */
export function changerVitesseLecture(vitesse: number): void {
  const l = lecture
  if (!l) return
  l.tempsTotalEstimeSec = Math.max(5, Math.round((l.tempsTotalEstimeSec * l.vitesse) / vitesse))
  l.vitesse = vitesse
  if (l.statut !== 'lecture') return l.onEtatChange(etatDe(l))
  l.passe += 1
  window.speechSynthesis.cancel()
  direPhraseCourante(l)
}

export function arreterLecture(): void {
  arreterMinuterie()
  lecture = null
  enonceEnCours = null
  if (estSyntheseDisponible()) window.speechSynthesis.cancel()
}
