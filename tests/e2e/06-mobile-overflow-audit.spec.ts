import { test, expect } from '@playwright/test'
import crypto from 'node:crypto'

const PAGES = [
  '/',
  '/?mode=marchand',
  '/immo',
  '/telecom',
  '/annonces',
  '/boutiques',
  '/categorie/smartphones',
  '/categorie/informatique',
  '/categorie/tv-electro',
  '/guide-achat',
  '/guide-forfait',
  '/guide-immo',
  '/guide-prix',
  '/pourquoi-nopalou',
  '/assistant-whatsapp',
  '/connexion',
  '/inscription',
  '/creer-boutique',
]

const AUTH_PAGES = [
  '/compte',
  '/compte?tab=mes-annonces',
  '/compte?tab=suivi-commande',
  '/compte?tab=profil',
  '/compte?tab=apporteur',
  '/compte?tab=fonctionnalites',
]

const SESSION_SECRET = process.env.SESSION_SECRET || '6WW9lNRRSvAtYuwQvx5HzSSQsOy6Syv10jpVHrrsk8g'

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

function getMockSessionCookie() {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = base64url(
    JSON.stringify({
      userId: '1',
      nom: 'BAMBA',
      email: 'dieteltouba@gmail.com',
      iat: now,
      exp: now + 7 * 86400,
    })
  )
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(`${header}.${payload}`).digest('base64url')
  const token = `${header}.${payload}.${signature}`

  return {
    name: 'nopalou_session',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax' as const,
  }
}

test.use({ viewport: { width: 360, height: 740 } })

test.describe('Audit Débordement Horizontal Mobile (360px) — Pages Publiques & Vitrines', () => {
  test.setTimeout(90000)
  for (const path of PAGES) {
    test(`Page ${path} s'ajuste parfaitement sans débordement horizontal`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1000)

      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth
        const winWidth = window.innerWidth
        const badElements: any[] = []
        document.querySelectorAll('*').forEach((el) => {
          const rect = el.getBoundingClientRect()
          if (rect.right > winWidth + 2) {
            badElements.push({
              tag: el.tagName,
              cls: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
              id: el.id,
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            })
          }
        })
        return {
          hasOverflow: docWidth > winWidth + 1,
          docWidth,
          winWidth,
          badElements: badElements.slice(0, 10),
        }
      })

      if (overflow.hasOverflow) {
        console.log(`[OVERFLOW] ${path}: docWidth=${overflow.docWidth}, winWidth=${overflow.winWidth}`, overflow.badElements)
      }

      expect(overflow.hasOverflow).toBe(false)
    })
  }
})

test.describe('Audit Débordement Horizontal Mobile (360px) — Espace Compte Authentifié', () => {
  test.setTimeout(90000)

  test.beforeEach(async ({ context }) => {
    const cookie = getMockSessionCookie()
    await context.addCookies([cookie])
  })

  for (const path of AUTH_PAGES) {
    test(`Espace connecté ${path} s'ajuste parfaitement sans débordement ni écrasement`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1200)

      // 1. Vérifier qu'on est bien sur /compte et pas redirigé vers /connexion
      expect(page.url()).not.toContain('/connexion')

      // 2. Vérifier l'absence de débordement horizontal
      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth
        const winWidth = window.innerWidth
        const badElements: any[] = []
        document.querySelectorAll('*').forEach((el) => {
          const rect = el.getBoundingClientRect()
          if (rect.right > winWidth + 2) {
            badElements.push({
              tag: el.tagName,
              cls: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
              id: el.id,
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            })
          }
        })
        return {
          hasOverflow: docWidth > winWidth + 1,
          docWidth,
          winWidth,
          badElements: badElements.slice(0, 10),
        }
      })

      if (overflow.hasOverflow) {
        console.log(`[OVERFLOW COMPTE] ${path}: docWidth=${overflow.docWidth}, winWidth=${overflow.winWidth}`, overflow.badElements)
      }

      expect(overflow.hasOverflow).toBe(false)

      // 3. Sur /compte (dashboard), vérifier que le contenu principal est pleine largeur (> 300px) et non écrasé
      if (path === '/compte') {
        const mainEl = page.locator('.account-main')
        await expect(mainEl).toBeVisible({ timeout: 8000 })
        const box = await mainEl.boundingBox()
        expect(box?.width).toBeGreaterThan(300)
      }
    })
  }
})
