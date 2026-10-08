// frontend-next/src/lib/surga-meteo.ts
// Module Météo & Marées Surga : Catalogue des localités du Sénégal (14 régions & quartiers),
// géolocalisation et interprétation WMO. Marées et qualité de l'air n'ont pas de source (D53).

export interface LocaliteItem {
  id: string
  nom: string
  lat: number
  lon: number
  maritime: boolean
  zone: string
}

export interface PrevisionItem {
  jour: string
  date?: string
  temp_min: number
  temp_max: number
  condition_code: string
  condition_texte: string
}

export interface MeteoData {
  ville: string
  zone?: string
  est_gps?: boolean
  coordonnees?: { lat: number; lon: number }
  temperature: number
  ressenti: number | null
  temp_min: number | null
  temp_max: number | null
  condition_code: string
  condition_texte: string
  humidite: number | null
  vent_vitesse_kmh: number | null
  vent_direction: string | null
  indice_uv: number | null
  // Sans source branchée, ces deux champs valent null et l'écran affiche « indisponible ».
  qualite_air?: {
    aqi: number
    niveau: string
    particules: string
    conseil: string
  } | null
  maree?: {
    etat: string
    prochaine_heure: string
    hauteur_m: string
    spot_reference: string
  } | null
  previsions_3j?: PrevisionItem[]
  source: string
  // Heure du relevé donnée par la source.
  updated_at: string
  // Vrai quand la source n'a pas répondu et que ce relevé est le dernier reçu (D43).
  non_actualise?: boolean
}

export const LOCALITES_SENEGAL: Record<string, { nom: string; lat: number; lon: number; maritime: boolean; zone: string }> = {
  // Dakar & Presqu'île
  dakar: { nom: 'Dakar', lat: 14.6937, lon: -17.4441, maritime: true, zone: 'Dakar' },
  'dakar-plateau': { nom: 'Dakar Plateau', lat: 14.6700, lon: -17.4300, maritime: true, zone: 'Dakar' },
  almadies: { nom: 'Almadies / Ngor', lat: 14.7450, lon: -17.5150, maritime: true, zone: 'Dakar' },
  ouakam: { nom: 'Ouakam / Mamelles', lat: 14.7200, lon: -17.4900, maritime: true, zone: 'Dakar' },
  yoff: { nom: 'Yoff / Ouest-Foire', lat: 14.7550, lon: -17.4650, maritime: true, zone: 'Dakar' },
  mermoz: { nom: 'Mermoz / Sacré-Cœur', lat: 14.7080, lon: -17.4700, maritime: true, zone: 'Dakar' },
  'parcelles-assainies': { nom: 'Parcelles Assainies', lat: 14.7600, lon: -17.4400, maritime: true, zone: 'Dakar' },
  'grand-dakar': { nom: 'Grand Dakar / Colobane', lat: 14.7050, lon: -17.4500, maritime: false, zone: 'Dakar' },
  // Banlieue dakaroise
  pikine: { nom: 'Pikine', lat: 14.7570, lon: -17.3950, maritime: true, zone: 'Banlieue' },
  guediawaye: { nom: 'Guédiawaye', lat: 14.7700, lon: -17.3850, maritime: true, zone: 'Banlieue' },
  rufisque: { nom: 'Rufisque', lat: 14.7167, lon: -17.2667, maritime: true, zone: 'Banlieue' },
  diamniadio: { nom: 'Diamniadio', lat: 14.7300, lon: -17.1800, maritime: false, zone: 'Banlieue' },
  // Régions et chefs-lieux du Sénégal (14 régions couvertes)
  thies: { nom: 'Thiès', lat: 14.7910, lon: -16.9359, maritime: false, zone: 'Régions' },
  mbour: { nom: 'Mbour / Saly', lat: 14.4220, lon: -16.9639, maritime: true, zone: 'Petite-Côte' },
  'saint-louis': { nom: 'Saint-Louis', lat: 16.0179, lon: -16.4896, maritime: true, zone: 'Régions' },
  touba: { nom: 'Touba / Mbacké', lat: 14.8647, lon: -15.8756, maritime: false, zone: 'Bassin Arachidier' },
  diourbel: { nom: 'Diourbel', lat: 14.6500, lon: -16.2333, maritime: false, zone: 'Bassin Arachidier' },
  kaolack: { nom: 'Kaolack', lat: 14.1500, lon: -16.0833, maritime: false, zone: 'Bassin Arachidier' },
  fatick: { nom: 'Fatick', lat: 14.3333, lon: -16.4167, maritime: false, zone: 'Bassin Arachidier' },
  kaffrine: { nom: 'Kaffrine', lat: 14.1059, lon: -15.5414, maritime: false, zone: 'Bassin Arachidier' },
  louga: { nom: 'Louga', lat: 15.6186, lon: -16.2244, maritime: false, zone: 'Régions' },
  ziguinchor: { nom: 'Ziguinchor', lat: 12.5833, lon: -16.2719, maritime: true, zone: 'Casamance' },
  'cap-skirring': { nom: 'Cap Skirring', lat: 12.3667, lon: -16.7500, maritime: true, zone: 'Casamance' },
  kolda: { nom: 'Kolda', lat: 12.8833, lon: -14.9500, maritime: false, zone: 'Casamance' },
  sedhiou: { nom: 'Sédhiou', lat: 12.7081, lon: -15.5569, maritime: false, zone: 'Casamance' },
  tambacounda: { nom: 'Tambacounda', lat: 13.7667, lon: -13.6667, maritime: false, zone: 'Sénégal Oriental' },
  kedougou: { nom: 'Kédougou', lat: 12.5564, lon: -12.1747, maritime: false, zone: 'Sénégal Oriental' },
  matam: { nom: 'Matam', lat: 15.6558, lon: -13.2553, maritime: false, zone: 'Fouta' },
}

export const LOCALITES_SENEGAL_LIST: LocaliteItem[] = Object.entries(LOCALITES_SENEGAL).map(([id, item]) => ({
  id,
  nom: item.nom,
  lat: item.lat,
  lon: item.lon,
  maritime: item.maritime,
  zone: item.zone,
}))

export function normaliserTexte(str: unknown): string {
  return (typeof str === 'string' ? str : '')
    .replace(/[œŒ]/g, 'oe')
    .replace(/[æÆ]/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\/\-_,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function trouverLocaliteParNom(nomCible: string): LocaliteItem {
  const normCible = normaliserTexte(nomCible)
  if (!normCible) return LOCALITES_SENEGAL_LIST[0]

  // Passe 1 : correspondance exacte directe sur clé, id ou nom normalisé
  for (const item of LOCALITES_SENEGAL_LIST) {
    if (
      item.id === normCible ||
      normaliserTexte(item.nom) === normCible ||
      item.nom.toLowerCase().trim() === nomCible.toLowerCase().trim()
    ) {
      return item
    }
  }

  // Passe 2 : correspondance par sous-partie (ex: 'ngor' dans 'almadies / ngor', 'saly' dans 'mbour / saly')
  for (const item of LOCALITES_SENEGAL_LIST) {
    const parts = item.nom.split('/').map((p) => normaliserTexte(p))
    if (parts.some((p) => p === normCible)) {
      return item
    }
  }

  // Passe 3 : correspondance par inclusion
  for (const item of LOCALITES_SENEGAL_LIST) {
    const normItem = normaliserTexte(item.nom)
    if (normItem.includes(normCible) || normCible.includes(normItem) || item.id.includes(normCible)) {
      return item
    }
  }

  return LOCALITES_SENEGAL_LIST[0]
}

export function trouverLocalitePlusProche(lat: number, lon: number): LocaliteItem {
  let minDistance = Infinity
  let plusProche = LOCALITES_SENEGAL_LIST[0]
  for (const loc of LOCALITES_SENEGAL_LIST) {
    const dLat = loc.lat - lat
    const dLon = loc.lon - lon
    const dist = dLat * dLat + dLon * dLon
    if (dist < minDistance) {
      minDistance = dist
      plusProche = loc
    }
  }
  return plusProche
}

export function interpreterCodeWMO(code: number): { code: string; texte: string } {
  if (code === 0) return { code: 'soleil', texte: 'Ensoleillé' }
  if (code === 1 || code === 2) return { code: 'partiellement_nuageux', texte: 'Éclaircies' }
  if (code === 3) return { code: 'nuageux', texte: 'Couvert' }
  if (code >= 45 && code <= 48) return { code: 'poussiere', texte: 'Brume de poussière (Harmattan)' }
  if (code >= 51 && code <= 67) return { code: 'pluie', texte: 'Pluie légère' }
  if (code >= 80 && code <= 82) return { code: 'averse', texte: 'Averses' }
  if (code >= 95) return { code: 'orage', texte: 'Orages isolés' }
  return { code: 'soleil', texte: 'Ensoleillé' }
}

// Localité de référence d'un profil : toujours un texte. Une préférence illisible vaut « Dakar ».
export function quartierDe(preferences?: { quartiers?: unknown } | null): string {
  const premier = Array.isArray(preferences?.quartiers) ? preferences.quartiers[0] : null
  return typeof premier === 'string' && premier.trim() ? premier : 'Dakar'
}

const ROSE_DES_VENTS = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Sud-Ouest', 'Ouest', 'Nord-Ouest']

export function directionVent(degres: unknown): string | null {
  if (typeof degres !== 'number' || !Number.isFinite(degres)) return null
  return ROSE_DES_VENTS[Math.round((((degres % 360) + 360) % 360) / 45) % 8]
}

// « Open-Meteo, relevé de 14 h 15 », ou « non actualisé depuis le 8 octobre à 14 h 15 » quand la source est muette.
export function libelleReleveMeteo(meteo: Pick<MeteoData, 'source' | 'updated_at' | 'non_actualise'>): string {
  const d = new Date(meteo.updated_at)
  if (Number.isNaN(d.getTime())) return meteo.source
  const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dakar' })
    .format(d)
    .replace(':', '\u00A0h\u00A0')
  if (!meteo.non_actualise) return `${meteo.source}, relevé de ${heure}`
  const jour = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Africa/Dakar' }).format(d)
  return `${meteo.source}, non actualisé depuis le ${jour} à ${heure}`
}

export { estLocaliteMaritime, estZoneCouverteParTrafic, LOCALITES_COTIERES_SENEGAL } from './coastal-locations'
