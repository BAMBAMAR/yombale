// @vitest-environment node
// D83 : Surga à sa propre origine. Renvois entre les deux adresses, passage de la session, reprise des données de l'appareil.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SignJWT } from 'jose'
import { renvoiOrigineSurga, domaineCommun } from '../lib/surga-adresse'
import { donneesAReprendre, pageDeReprise, CLE_REPRISE } from '../lib/surga-reprise'

const SURGA = 'https://surga.nopalou.com'
const NOPALOU = 'https://nopalou.com'
const renvoi = (hote: string, chemin: string, requete = '') => renvoiOrigineSurga(hote, chemin, requete, SURGA, NOPALOU)

describe('renvois entre Nopalou et l’origine de Surga', () => {
  it('à l’ancienne adresse, seule la page de l’application est renvoyée, requête gardée', () => {
    expect(renvoi('nopalou.com', '/surga')).toBe('https://surga.nopalou.com/surga')
    expect(renvoi('nopalou.com', '/surga', '?paiement=succes')).toBe('https://surga.nopalou.com/surga?paiement=succes')
    expect(renvoi('www.nopalou.com', '/surga', '?tab=agenda')).toBe('https://surga.nopalou.com/surga?tab=agenda')
  })

  it('à l’ancienne adresse, les fichiers de Surga et la page de reprise restent servis', () => {
    for (const chemin of ['/surga/manifest.json', '/surga/sw.js', '/surga/icons/icon-192.png', '/surga/reprise', '/surga/admin']) {
      expect(renvoi('nopalou.com', chemin)).toBeNull()
    }
    expect(renvoi('nopalou.com', '/')).toBeNull()
    expect(renvoi('nopalou.com', '/boutiques/dievo-style')).toBeNull()
  })

  it('à l’origine de Surga, la racine mène à l’application et l’application est servie', () => {
    expect(renvoi('surga.nopalou.com', '/', '?utm_source=whatsapp')).toBe('https://surga.nopalou.com/surga?utm_source=whatsapp')
    for (const chemin of ['/surga', '/surga/manifest.json', '/surga/sw.js', '/_next/data/x.json', '/icons/logo-n.svg', '/favicon.ico', '/icon']) {
      expect(renvoi('surga.nopalou.com', chemin)).toBeNull()
    }
  })

  it('à l’origine de Surga, une page de Nopalou repart vers Nopalou', () => {
    expect(renvoi('surga.nopalou.com', '/boutiques/dievo-style')).toBe('https://nopalou.com/boutiques/dievo-style')
    expect(renvoi('surga.nopalou.com', '/connexion', '?redirect=/compte')).toBe('https://nopalou.com/connexion?redirect=/compte')
  })

  it('sans origine propre réglée, aucun renvoi de cette règle', () => {
    expect(renvoiOrigineSurga('nopalou.com', '/surga', '', '', NOPALOU)).toBeNull()
  })

  it('domaine commun aux deux origines, pour le cookie de passage', () => {
    expect(domaineCommun(SURGA, NOPALOU)).toBe('.nopalou.com')
    expect(domaineCommun(SURGA, 'https://www.nopalou.com')).toBe('.nopalou.com')
    expect(domaineCommun('https://surga.autre.com', NOPALOU)).toBe('')
    expect(domaineCommun('', NOPALOU)).toBe('')
  })
})

describe('reprise des données de l’appareil', () => {
  const ancien = { surga_onboarding_done: 'true', surga_preferences: '{"quartiers":["Rufisque"]}', surga_kalpe_operations: '[{"montant":5000}]', autre_cle: 'x', [CLE_REPRISE]: 'faite' }

  const appareil = (cles: Record<string, string>) => (cle: string) => (cle in cles ? cles[cle] : null)

  it('appareil neuf à la nouvelle adresse : les clés « surga_ » sont reprises, pas les autres', () => {
    expect(donneesAReprendre(ancien, appareil({}))).toEqual({ surga_onboarding_done: 'true', surga_preferences: '{"quartiers":["Rufisque"]}', surga_kalpe_operations: '[{"montant":5000}]' })
  })

  it('compte connecté dont les réglages sont déjà arrivés du serveur : ils restent, le portefeuille de l’appareil est repris', () => {
    const ici = { surga_onboarding_done: 'true', surga_preferences: '{"quartiers":["Dakar"]}' }
    expect(donneesAReprendre(ancien, appareil(ici))).toEqual({ surga_kalpe_operations: '[{"montant":5000}]' })
  })

  it('tout est déjà là : rien à écrire', () => {
    expect(donneesAReprendre(ancien, appareil({ surga_onboarding_done: 'true', surga_preferences: '{"quartiers":["Dakar"]}', surga_kalpe_operations: '[{"montant":1}]' }))).toBeNull()
  })

  it('une clé créée vide par un écran à la première ouverture ne bloque pas la reprise', () => {
    const ici = { surga_onboarding_done: 'true', surga_preferences: '{"quartiers":["Dakar"]}', surga_kalpe_operations: '[]' }
    expect(donneesAReprendre(ancien, appareil(ici))).toEqual({ surga_kalpe_operations: '[{"montant":5000}]' })
    // À l'inverse, une valeur vide à l'ancienne adresse n'est pas une donnée à reprendre.
    expect(donneesAReprendre({ surga_offline_notes: '[]' }, appareil({}))).toBeNull()
  })

  it('données de deux comptes différents aux deux adresses : rien n’est repris', () => {
    const laBas = { ...ancien, surga_offline_proprietaire: 'compte-A', surga_offline_notes: '[{"titre":"Note de A"}]' }
    expect(donneesAReprendre(laBas, appareil({ surga_offline_proprietaire: 'compte-B' }))).toBeNull()
    expect(donneesAReprendre(laBas, appareil({ surga_offline_proprietaire: 'compte-A' }))).toMatchObject({ surga_offline_notes: '[{"titre":"Note de A"}]' })
  })

  it('rien à reprendre, message mal formé ou valeur qui n’est pas un texte', () => {
    expect(donneesAReprendre({}, appareil({}))).toBeNull()
    expect(donneesAReprendre(null, appareil({}))).toBeNull()
    expect(donneesAReprendre('texte', appareil({}))).toBeNull()
    expect(donneesAReprendre({ surga_x: { a: 1 }, surga_y: 3 }, appareil({}))).toBeNull()
  })

  it('avis de nouvelle adresse : seulement pour qui utilisait déjà Surga à l’ancienne', async () => {
    const { utilisaitAncienneAdresse } = await import('../lib/surga-reprise')
    expect(utilisaitAncienneAdresse(ancien)).toBe(true)
    expect(utilisaitAncienneAdresse({ surga_meteo_ville: 'Dakar' })).toBe(false)
    expect(utilisaitAncienneAdresse({})).toBe(false)
    expect(utilisaitAncienneAdresse(null)).toBe(false)
    // La page de reprise dit si les rappels étaient autorisés à l'ancienne adresse.
    expect(pageDeReprise(SURGA)).toContain("Notification.permission === 'granted'")
  })

  it('la page de reprise n’adresse ses données qu’à l’origine de Surga', () => {
    const page = pageDeReprise(SURGA)
    expect(page).toContain('"https://surga.nopalou.com");')
    expect(page).not.toContain("'*'")
    expect(page).toContain("cle.indexOf('surga_') === 0")
  })
})

describe('middleware, origine propre réglée', () => {
  const SECRET = 'secret-de-test-origine-surga'
  const jeton = () => new SignJWT({ userId: 'u1' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('5m').sign(new TextEncoder().encode(SECRET))

  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_SURGA_ORIGINE = SURGA
    process.env.NEXT_PUBLIC_SITE_URL = NOPALOU
    process.env.JWT_SECRET = SECRET
    process.env.SESSION_SECRET = SECRET
  })
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SURGA_ORIGINE
    delete process.env.NEXT_PUBLIC_SITE_URL
    // Les modules chargés avec le réglage ne doivent pas servir aux autres fichiers de tests.
    vi.resetModules()
  })

  async function appeler(adresse: string, hote: string, cookie?: string) {
    const { NextRequest } = await import('next/server')
    const { middleware } = await import('../middleware')
    return middleware(new NextRequest(adresse, { headers: { host: hote, ...(cookie ? { cookie } : {}) } }))
  }

  it('« nopalou.com/surga » renvoie à l’origine de Surga et joint la session en cookie de passage', async () => {
    const t = await jeton()
    const r = await appeler('https://nopalou.com/surga?tab=notes', 'nopalou.com', `nopalou_session=${t}`)
    expect(r.status).toBe(307)
    expect(r.headers.get('location')).toBe('https://surga.nopalou.com/surga?tab=notes')
    const pose = r.headers.get('set-cookie') || ''
    expect(pose).toContain(`nopalou_session_passage=${t}`)
    expect(pose).toMatch(/Domain=\.nopalou\.com/i)
    expect(pose).toMatch(/HttpOnly/i)
    expect(pose).toMatch(/Max-Age=120/i)
  })

  it('sans session, le renvoi ne pose aucun cookie', async () => {
    const r = await appeler('https://nopalou.com/surga', 'nopalou.com')
    expect(r.status).toBe(307)
    expect(r.headers.get('set-cookie')).toBeNull()
  })

  it('à l’arrivée, le cookie de passage devient la session de l’origine de Surga, puis il est retiré', async () => {
    const t = await jeton()
    const r = await appeler('https://surga.nopalou.com/surga?tab=notes', 'surga.nopalou.com', `nopalou_session_passage=${t}`)
    expect(r.status).toBe(307)
    expect(r.headers.get('location')).toBe('https://surga.nopalou.com/surga?tab=notes')
    const pose = r.headers.get('set-cookie') || ''
    expect(pose).toContain(`nopalou_session=${t}`)
    expect(pose).toMatch(/nopalou_session_passage=;[^,]*Max-Age=0/i)
  })

  it('un cookie de passage invalide n’ouvre aucune session : il est seulement retiré', async () => {
    const r = await appeler('https://surga.nopalou.com/surga', 'surga.nopalou.com', 'nopalou_session_passage=faux.jeton.ici')
    expect(r.status).toBe(200)
    const pose = r.headers.get('set-cookie') || ''
    expect(pose).not.toContain('nopalou_session=')
    expect(pose).toMatch(/nopalou_session_passage=;/)
  })

  it('la page de reprise peut être mise en cadre par l’origine de Surga seulement ; les autres pages par personne', async () => {
    const reprise = await appeler('https://nopalou.com/surga/reprise', 'nopalou.com')
    expect(reprise.headers.get('content-security-policy')).toContain('frame-ancestors https://surga.nopalou.com')
    expect(reprise.headers.get('x-frame-options')).toBeNull()
    const accueil = await appeler('https://nopalou.com/', 'nopalou.com')
    expect(accueil.headers.get('content-security-policy')).toContain("frame-ancestors 'none'")
    expect(accueil.headers.get('x-frame-options')).toBe('DENY')
  })
})
