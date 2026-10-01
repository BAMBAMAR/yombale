// AUD-133 : protection des générateurs d'images `/assets/*` (visuels aux couleurs de Nopalou).
// 1. Les textes libres (nom, prix, boutique, téléphone, code…) ne sont pris en compte que pour un utilisateur
//    connecté (admin, apporteur, marchand). Un anonyme obtient le visuel neutre : il ne peut plus fabriquer
//    une carte « officielle » avec le texte de son choix.
// 2. L'image distante ne peut venir que d'un hôte de confiance (pas d'adresse IP, pas de port, https seulement) :
//    le serveur ne contacte plus d'URL choisie par un tiers (SSRF).
import { jwtVerify } from 'jose'

const COOKIE_SESSION = 'nopalou_session'
const LONGUEUR_MAX = 120
const PARAMS_PUBLICS = new Set(['type']) // choix d'un visuel fixe de la plateforme : sans texte libre

function cleSession(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET
  return secret ? new TextEncoder().encode(secret) : null
}

function lireCookie(request: Request, nom: string): string | null {
  const brut = request.headers.get('cookie') || ''
  const m = brut.match(new RegExp(`(?:^|;\\s*)${nom}=([^;]+)`))
  return m ? decodeURIComponent(m[1]) : null
}

export async function estConnecte(request: Request): Promise<boolean> {
  const token = lireCookie(request, COOKIE_SESSION)
  const cle = cleSession()
  if (!token || !cle) return false
  try {
    await jwtVerify(token, cle, { algorithms: ['HS256'] })
    return true
  } catch {
    return false
  }
}

/**
 * Paramètres de requête exploitables par un générateur : tous (tronqués) pour un utilisateur connecté,
 * seulement les choix de visuels fixes pour un anonyme.
 */
export async function paramsLibres(request: Request): Promise<URLSearchParams> {
  const source = new URL(request.url).searchParams
  const connecte = await estConnecte(request)
  const sortie = new URLSearchParams()
  source.forEach((valeur, cle) => {
    if (connecte || PARAMS_PUBLICS.has(cle)) sortie.set(cle, valeur.slice(0, LONGUEUR_MAX))
  })
  return sortie
}

const HOTES_IMAGES_AUTORISES = ['res.cloudinary.com', 'nopalou.com', 'www.nopalou.com']

/** Retourne l'URL de l'image si son hôte est autorisé, sinon null (le visuel est alors rendu sans image). */
export function urlImageAutorisee(brut: string | null): string | null {
  if (!brut) return null
  try {
    const u = new URL(brut)
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null
    if (!HOTES_IMAGES_AUTORISES.includes(u.hostname.toLowerCase())) return null
    return u.toString()
  } catch {
    return null
  }
}
