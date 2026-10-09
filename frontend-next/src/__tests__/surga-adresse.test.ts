// @vitest-environment node
// D77 : le sous-domaine de Surga renvoie vers l'adresse où l'application est servie
import { describe, it, expect } from 'vitest'
import { adresseDepuisSousDomaineSurga } from '../lib/surga-adresse'

process.env.SESSION_SECRET = 'test-secret-surga-adresse'

describe('adresse de Surga (D77)', () => {
  it('la racine du sous-domaine mène à /surga du domaine principal, en gardant la requête', () => {
    expect(adresseDepuisSousDomaineSurga('surga.nopalou.com', '/', '', 'https')).toBe('https://nopalou.com/surga')
    expect(adresseDepuisSousDomaineSurga('surga.nopalou.com', '/', '?tab=agenda', 'https:')).toBe('https://nopalou.com/surga?tab=agenda')
    expect(adresseDepuisSousDomaineSurga('surga.exemple.test:3001', '/', '?utm_source=whatsapp_share', 'http:')).toBe('http://exemple.test:3001/surga?utm_source=whatsapp_share')
  })

  it('un autre chemin garde son chemin sur le domaine principal', () => {
    expect(adresseDepuisSousDomaineSurga('surga.nopalou.com', '/surga', '?tab=notes', 'https')).toBe('https://nopalou.com/surga?tab=notes')
    expect(adresseDepuisSousDomaineSurga('surga.nopalou.com', '/boutiques/dievo-style', '', 'https')).toBe('https://nopalou.com/boutiques/dievo-style')
  })

  it('un hôte qui n\'est pas le sous-domaine n\'est pas renvoyé', () => {
    expect(adresseDepuisSousDomaineSurga('nopalou.com', '/surga', '', 'https')).toBeNull()
    expect(adresseDepuisSousDomaineSurga('www.nopalou.com', '/', '', 'https')).toBeNull()
    expect(adresseDepuisSousDomaineSurga('surgafoo.com', '/', '', 'https')).toBeNull()
    // En développement, « surga.localhost » viserait l'adresse d'écoute du serveur : Next rendrait le renvoi relatif.
    expect(adresseDepuisSousDomaineSurga('surga.localhost:3001', '/', '', 'http')).toBeNull()
  })

  it('le middleware renvoie le sous-domaine en 307 et sert le domaine principal sans renvoi', async () => {
    const { NextRequest } = await import('next/server')
    const { middleware } = await import('../middleware')
    const sousDomaine = await middleware(new NextRequest('http://surga.exemple.test/?tab=agenda', { headers: { host: 'surga.exemple.test', 'x-forwarded-proto': 'https' } }))
    expect(sousDomaine.status).toBe(307)
    expect(sousDomaine.headers.get('location')).toBe('https://exemple.test/surga?tab=agenda')
    const principal = await middleware(new NextRequest('http://localhost:3001/surga?tab=agenda', { headers: { host: 'localhost:3001' } }))
    expect(principal.status).toBe(200)
    expect(principal.headers.get('location')).toBeNull()
  })
})
