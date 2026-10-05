// frontend-next/src/lib/surga-meteo.ts
// Module Météo & Marées Surga : Catalogue des localités du Sénégal (14 régions & quartiers),
// géolocalisation, calculs de marée et interprétation WMO.

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
  est_gps?: boolean
  coordonnees?: { lat: number; lon: number }
  temperature: number
  ressenti: number
  temp_min: number
  temp_max: number
  condition_code: string
  condition_texte: string
  humidite: number
  vent_vitesse_kmh: number
  vent_direction: string
  indice_uv: number
  qualite_air?: {
    aqi: number
    niveau: string
    particules: string
    conseil: string
  }
  maree?: {
    etat: string
    prochaine_heure: string
    hauteur_m: string
    spot_reference: string
  } | null
  previsions_3j?: PrevisionItem[]
  source: string
  updated_at: string
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

export function normaliserTexte(str: string): string {
  return (str || '')
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

export function calculerMareeDakar(date = new Date()) {
  const h = date.getHours()
  const isBasse = (h >= 4 && h < 10) || (h >= 16 && h < 22)
  const prochaineHeure = isBasse ? '11h30' : '17h45'
  return {
    etat: isBasse ? 'Marée basse' : 'Marée haute',
    prochaine_heure: prochaineHeure,
    hauteur_m: isBasse ? '0.6 m' : '1.8 m',
    spot_reference: 'Almadies & Yoff',
  }
}

export function estimerQualiteAirDakar(mois = new Date().getMonth()) {
  const isSaisonSeche = mois >= 10 || mois <= 4
  if (isSaisonSeche) {
    return {
      aqi: 95,
      niveau: 'Moyenne à dégradée',
      particules: 'Poussière saharienne en suspension',
      conseil: 'Personnes sensibles : limiter les efforts physiques prolongés en extérieur.',
    }
  }
  return {
    aqi: 45,
    niveau: 'Bonne',
    particules: 'Air océanique purifié',
    conseil: 'Qualité de l’air idéale pour les activités extérieures.',
  }
}
