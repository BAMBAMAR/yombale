// frontend-next/src/app/api/surga/meteo/route.ts
// Route API Next.js autonome pour la météo Surga (Dakar, 14 régions et GPS direct)
// Résilience absolue : fonctionne en dev, SSR, Vercel, Render et hors-ligne

import { NextRequest, NextResponse } from 'next/server'
import {
  LOCALITES_SENEGAL_LIST,
  trouverLocaliteParNom,
  trouverLocalitePlusProche,
  interpreterCodeWMO,
  calculerMareeDakar,
  estimerQualiteAirDakar,
} from '@/lib/surga-meteo'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rawVille = searchParams.get('ville')
    const latParam = searchParams.get('lat')
    const lonParam = searchParams.get('lon')

    let lat = 14.6937
    let lon = -17.4441
    let nomAffiche = 'Dakar'
    let isMaritime = true
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
        isMaritime = plusProche.maritime
        zoneNom = plusProche.zone
      }
    } else if (rawVille) {
      const match = trouverLocaliteParNom(rawVille)
      lat = match.lat
      lon = match.lon
      nomAffiche = match.nom
      isMaritime = match.maritime
      zoneNom = match.zone
    }

    let payload: any = null

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=Africa%2FDakar`
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 4000)
      const res = await fetch(url, { signal: ctrl.signal, next: { revalidate: 600 } })
      clearTimeout(timer)

      if (res.ok) {
        const data = await res.json()
        const current = data.current || {}
        const daily = data.daily || {}

        const condition = interpreterCodeWMO(current.weather_code || 0)
        const maree = isMaritime ? calculerMareeDakar() : null
        const qualiteAir = estimerQualiteAirDakar()

        const previsions_3j = []
        const joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        const dailyTimes = daily.time || []
        for (let i = 0; i < Math.min(3, dailyTimes.length); i++) {
          const d = new Date(dailyTimes[i])
          const condJ = interpreterCodeWMO(daily.weather_code?.[i] ?? 0)
          previsions_3j.push({
            jour: i === 0 ? "Aujourd'hui" : joursSemaine[d.getDay()],
            date: dailyTimes[i],
            temp_min: Math.round(daily.temperature_2m_min?.[i] ?? 24),
            temp_max: Math.round(daily.temperature_2m_max?.[i] ?? 30),
            condition_code: condJ.code,
            condition_texte: condJ.texte,
          })
        }

        payload = {
          ville: nomAffiche,
          zone: zoneNom,
          region: zoneNom,
          est_gps: estPositionGps,
          is_gps: estPositionGps,
          coordonnees: { lat, lon },
          temperature: Math.round(current.temperature_2m ?? 28),
          ressenti: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 29),
          temp_min: Math.round(daily.temperature_2m_min?.[0] ?? (current.temperature_2m ? current.temperature_2m - 3 : 24)),
          temp_max: Math.round(daily.temperature_2m_max?.[0] ?? (current.temperature_2m ? current.temperature_2m + 4 : 31)),
          condition_code: condition.code,
          condition_texte: condition.texte,
          humidite: Math.round(current.relative_humidity_2m ?? 70),
          vent_vitesse_kmh: Math.round(current.wind_speed_10m ?? 18),
          vent_direction: current.wind_direction_10m > 300 || current.wind_direction_10m < 60 ? 'Nord / NNO' : 'Ouest',
          indice_uv: Math.round(daily.uv_index_max?.[0] ?? 7),
          qualite_air: qualiteAir,
          maree: maree,
          previsions_3j: previsions_3j,
          source: estPositionGps ? 'Open-Meteo GPS Live' : `Open-Meteo ${nomAffiche} Live`,
          updated_at: new Date().toISOString(),
        }
      }
    } catch (err) {
      console.warn('[SURGA METEO NEXT ROUTE API FETCH WARN]:', err)
    }

    if (!payload) {
      // Fallback déterministe hors-ligne calibré pour le Sénégal
      const fallbackCondition = { code: 'soleil', texte: 'Ensoleillé' }
      payload = {
        ville: nomAffiche,
        zone: zoneNom,
        region: zoneNom,
        est_gps: estPositionGps,
        is_gps: estPositionGps,
        coordonnees: { lat, lon },
        temperature: 28,
        ressenti: 31,
        temp_min: 24,
        temp_max: 30,
        condition_code: fallbackCondition.code,
        condition_texte: fallbackCondition.texte,
        humidite: 72,
        vent_vitesse_kmh: 18,
        vent_direction: 'Nord-Nord-Ouest (Alizé)',
        indice_uv: 8,
        qualite_air: estimerQualiteAirDakar(),
        maree: isMaritime ? calculerMareeDakar() : null,
        previsions_3j: [
          { jour: "Aujourd'hui", temp_min: 24, temp_max: 30, condition_code: 'soleil', condition_texte: 'Ensoleillé' },
          { jour: 'Demain', temp_min: 24, temp_max: 29, condition_code: 'soleil', condition_texte: 'Ensoleillé' },
          { jour: 'Après-demain', temp_min: 25, temp_max: 31, condition_code: 'partiellement_nuageux', condition_texte: 'Éclaircies' },
        ],
        source: 'Station locale (hors-ligne)',
        updated_at: new Date().toISOString(),
      }
    }

    return NextResponse.json(
      {
        success: true,
        meteo: payload,
        localites: LOCALITES_SENEGAL_LIST,
        villes_disponibles: LOCALITES_SENEGAL_LIST.map((l) => l.nom),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Erreur météo serveur' },
      { status: 500 }
    )
  }
}
