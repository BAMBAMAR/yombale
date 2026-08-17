import { test, expect } from '@playwright/test'

const PAGES = [
  '/',
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
  '/assistant-whatsapp',
  '/connexion',
  '/inscription',
  '/creer-boutique',
]

test.use({ viewport: { width: 360, height: 740 } })

test.describe('Audit Débordement Horizontal Mobile (360px)', () => {
  test.setTimeout(90000)
  for (const path of PAGES) {
    test(`Page ${path} s'ajuste parfaitement sans débordement horizontal`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1000)

      // Vérifier si la largeur totale du document dépasse la largeur de la fenêtre
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
