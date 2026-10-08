// frontend-next/src/app/api/surga/meteo/route.ts
// Route API Next.js pour la météo Surga (localités du Sénégal et position GPS).
// D43 / D53 : seule la donnée reçue de la source est servie. Source muette : dernier relevé réel, daté et marqué
// « non actualisé » ; sinon rien. Marées et qualité de l'air n'ont pas de source : champs à null.

import { NextRequest, NextResponse } from 'next/server'
import {
  LOCALITES_SENEGAL_LIST,
  trouverLocaliteParNom,
  trouverLocalitePlusProche,
  interpreterCodeWMO,
  directionVent,
} from '@/lib/surga-meteo'
import type { MeteoData, PrevisionItem } from '@/lib/surga-meteo'

export const dynamic = 'force-dynamic'

// Dernier relevé reçu par localité, gardé par l'instance du serveur.
const derniersReleves = new Map<string, MeteoData>()

// Au-delà de ce délai, un relevé n'est plus présenté comme à jour, même si l'appel a réussi (réponse gardée en cache).
const DELAI_FRAICHEUR_MS = 90 * 60 * 1000

const arrondi = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rawVille = searchParams.get('ville')
    const latParam = searchParams.get('lat')
    const lonParam = searchParams.get('lon')

    let lat = 14.6937
    let lon = -17.4441
    let nomAffiche = 'Dakar'
    let zoneNom = 'Dakar'
    let estPositionGps = false

    if (latParam && lonParam) {
      const parsedLat = parseFloat(latParam)
      const parsedLon = parseFloat(lonParam)
      if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
        lat = parsedLat
        lon = parsedLon
        estPositionGps = true
        const plusProche = trouverLocalitePlusProche(lat, lon)
        nomAffiche = plusProche.nom
        zoneNom = plusProche.zone
      }
    } else if (rawVille) {
      const match = trouverLocaliteParNom(rawVille)
      lat = match.lat
      lon = match.lon
      nomAffiche = match.nom
      zoneNom = match.zone
    }

    const cle = estPositionGps ? `gps_${lat.toFixed(2)}_${lon.toFixed(2)}` : nomAffiche.toLowerCase()
    let payload: MeteoData | null = null

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=Africa%2FDakar`
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 4000)
      const res = await fetch(url, { signal: ctrl.signal, next: { revalidate: 600 } })
      clearTimeout(timer)

      const data = res.ok ? await res.json() : null
      const current = data?.current
      const daily = data?.daily || {}

      if (current && typeof current.temperature_2m === 'number') {
        const condition = interpreterCodeWMO(current.weather_code ?? 0)
        const previsions_3j: PrevisionItem[] = []
        const joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        const dailyTimes: string[] = daily.time || []
        for (let i = 0; i < Math.min(3, dailyTimes.length); i++) {
          const tMin = arrondi(daily.temperature_2m_min?.[i])
          const tMax = arrondi(daily.temperature_2m_max?.[i])
          if (tMin === null || tMax === null) continue
          const condJ = interpreterCodeWMO(daily.weather_code?.[i] ?? 0)
          previsions_3j.push({
            jour: i === 0 ? "Aujourd'hui" : joursSemaine[new Date(dailyTimes[i]).getDay()],
            date: dailyTimes[i],
            temp_min: tMin,
            temp_max: tMax,
            condition_code: condJ.code,
            condition_texte: condJ.texte,
          })
        }

        // Heure du relevé donnée par la source (heure de Dakar, égale à l'heure universelle), pas l'heure de l'appel.
        const releveLe = current.time ? new Date(`${current.time}:00Z`) : null
        const releveValide = releveLe !== null && !isNaN(releveLe.getTime())

        payload = {
          ville: nomAffiche,
          zone: zoneNom,
          est_gps: estPositionGps,
          coordonnees: { lat, lon },
          temperature: Math.round(current.temperature_2m),
          ressenti: arrondi(current.apparent_temperature),
          temp_min: arrondi(daily.temperature_2m_min?.[0]),
          temp_max: arrondi(daily.temperature_2m_max?.[0]),
          condition_code: condition.code,
          condition_texte: condition.texte,
          humidite: arrondi(current.relative_humidity_2m),
          vent_vitesse_kmh: arrondi(current.wind_speed_10m),
          vent_direction: directionVent(current.wind_direction_10m),
          indice_uv: arrondi(daily.uv_index_max?.[0]),
          qualite_air: null,
          maree: null,
          previsions_3j,
          source: 'Open-Meteo',
          updated_at: releveValide ? releveLe!.toISOString() : new Date().toISOString(),
          non_actualise: releveValide ? Date.now() - releveLe!.getTime() > DELAI_FRAICHEUR_MS : false,
        }
        derniersReleves.set(cle, payload)
      }
    } catch (err) {
      console.warn('[SURGA METEO] Source indisponible :', err)
    }

    if (!payload) {
      const dernier = derniersReleves.get(cle)
      payload = dernier ? { ...dernier, non_actualise: true } : null
    }

    return NextResponse.json(
      {
        success: true,
        meteo: payload,
        indisponible: !payload,
        localites: LOCALITES_SENEGAL_LIST,
        villes_disponibles: LOCALITES_SENEGAL_LIST.map((l) => l.nom),
      },
      {
        // Une réponse « indisponible » n'est pas gardée en cache : la source peut répondre à l'appel suivant.
        headers: { 'Cache-Control': payload && !payload.non_actualise ? 'public, s-maxage=300, stale-while-revalidate=600' : 'no-store' },
      }
    )
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Météo indisponible pour le moment.' }, { status: 500 })
  }
}
