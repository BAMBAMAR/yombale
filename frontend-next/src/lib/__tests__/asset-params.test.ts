// @vitest-environment node
// AUD-133 : générateurs d'images — textes libres réservés aux connectés, hôtes d'image de confiance
import { describe, it, expect, beforeAll } from 'vitest'
import { SignJWT } from 'jose'
import { paramsLibres, urlImageAutorisee, estConnecte } from '../asset-params'

const SECRET = 'test-secret-asset-params'

async function jeton(secret = SECRET) {
  return new SignJWT({ userId: 'u1' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('5m').sign(new TextEncoder().encode(secret))
}
const requete = (qs: string, cookie?: string) =>
  new Request(`http://localhost/assets/produit-promo?${qs}`, { headers: cookie ? { cookie } : {} })

describe('asset-params (AUD-133)', () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = SECRET
  })

  it('anonyme : seul le choix du visuel fixe est conservé, les textes libres sont ignorés', async () => {
    const p = await paramsLibres(requete('type=produit&nom=Offre%20OFFICIELLE&prix=1000&boutique=Nopalou%20Officiel&image=http://127.0.0.1'))
    expect(p.get('type')).toBe('produit')
    expect(p.get('nom')).toBeNull()
    expect(p.get('prix')).toBeNull()
    expect(p.get('boutique')).toBeNull()
    expect(p.get('image')).toBeNull()
  })

  it('connecté (jeton valide) : les paramètres sont conservés et tronqués à 120 caractères', async () => {
    const t = await jeton()
    const p = await paramsLibres(requete(`nom=${'A'.repeat(500)}&prix=1000`, `nopalou_session=${t}`))
    expect(p.get('prix')).toBe('1000')
    expect(p.get('nom')).toHaveLength(120)
  })

  it('jeton falsifié ou signé avec un autre secret : traité comme anonyme', async () => {
    const autre = await jeton('autre-secret')
    expect(await estConnecte(requete('nom=x', `nopalou_session=${autre}`))).toBe(false)
    expect(await estConnecte(requete('nom=x', 'nopalou_session=abc.def.ghi'))).toBe(false)
    expect(await estConnecte(requete('nom=x'))).toBe(false)
  })

  it('urlImageAutorisee : https + hôte de confiance seulement (pas d\'IP, de port, d\'identifiants, de http)', () => {
    expect(urlImageAutorisee('https://res.cloudinary.com/demo/image/upload/a.jpg')).toContain('res.cloudinary.com')
    expect(urlImageAutorisee('https://www.nopalou.com/x.png')).not.toBeNull()
    for (const mauvais of [
      'http://res.cloudinary.com/a.jpg',
      'http://127.0.0.1:4100/api/health',
      'https://127.0.0.1/a.png',
      'https://169.254.169.254/latest/meta-data',
      'https://res.cloudinary.com:8443/a.jpg',
      'https://user:pw@res.cloudinary.com/a.jpg',
      'https://res.cloudinary.com.evil.example/a.jpg',
      'https://evil.example/res.cloudinary.com/a.jpg',
      'file:///etc/passwd',
      'pas une url',
      '',
    ]) {
      expect(urlImageAutorisee(mauvais), mauvais).toBeNull()
    }
    expect(urlImageAutorisee(null)).toBeNull()
  })
})
