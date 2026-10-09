import { describe, it, expect } from 'vitest'
import { detecterPlateforme, GUIDES, type Plateforme } from '../surga-pwa-plateforme'

const UA = {
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.88 Mobile/15E148 Safari/604.1',
  iphoneFacebook: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0]',
  iphoneWebview: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  ipadCommeMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  androidChrome: 'Mozilla/5.0 (Linux; Android 13; TECNO KG5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  androidSamsung: 'Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36',
  androidFirefox: 'Mozilla/5.0 (Android 13; Mobile; rv:125.0) Gecko/125.0 Firefox/125.0',
  androidInstagram: 'Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 Instagram 330.0.0.0',
  androidWebview: 'Mozilla/5.0 (Linux; Android 12; SM-G991B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36',
  windowsChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  windowsEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  windowsFirefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
}

describe('detecterPlateforme', () => {
  const cas: Array<[string, string, Plateforme, number?]> = [
    ['iPhone Safari', UA.iphoneSafari, 'ios-safari'],
    ['iPhone Chrome', UA.iphoneChrome, 'ios-autre'],
    ['iPhone dans Facebook', UA.iphoneFacebook, 'navigateur-integre'],
    ['iPhone sans Safari (vue intégrée)', UA.iphoneWebview, 'navigateur-integre'],
    ['iPad récent (se présente comme un Mac, tactile)', UA.ipadCommeMac, 'ios-safari', 5],
    ['Android Chrome', UA.androidChrome, 'android-chrome'],
    ['Samsung Internet', UA.androidSamsung, 'android-samsung'],
    ['Android Firefox', UA.androidFirefox, 'android-firefox'],
    ['Android dans Instagram', UA.androidInstagram, 'navigateur-integre'],
    ['Android WebView', UA.androidWebview, 'navigateur-integre'],
    ['Windows Chrome', UA.windowsChrome, 'bureau-chrome'],
    ['Windows Edge', UA.windowsEdge, 'bureau-edge'],
    ['Windows Firefox', UA.windowsFirefox, 'bureau-firefox'],
    ['Mac Safari (sans écran tactile)', UA.macSafari, 'bureau-safari', 0],
    ['agent vide', '', 'inconnu'],
  ]
  it.each(cas)('%s', (_nom, ua, attendu, touches) => {
    expect(detecterPlateforme(ua, { maxTouchPoints: touches })).toBe(attendu)
  })

  it('chaque plateforme a un guide complet, sans émoji ni tutoiement', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
    for (const [id, g] of Object.entries(GUIDES)) {
      expect(g.etapes.length, id).toBeGreaterThanOrEqual(2)
      const texte = [g.sousTitre, g.intro ?? '', ...g.etapes, g.fin, g.astuce ?? ''].join(' ')
      expect(emoji.test(texte), id).toBe(false)
      expect(/(?<![\p{L}])(tu|ton|ta|tes|toi)(?![\p{L}])/iu.test(texte), id).toBe(false)
    }
  })

  it('le guide Safari ne s’affiche plus sur Android ni sur ordinateur', () => {
    for (const ua of [UA.androidChrome, UA.androidSamsung, UA.androidFirefox, UA.windowsChrome, UA.windowsEdge]) {
      const p = detecterPlateforme(ua)
      expect(GUIDES[p].etapes.join(' ')).not.toMatch(/Safari/)
    }
  })
})
