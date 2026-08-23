/**
 * Helper Centralisé Haute Performance pour les Scans EAN et Reconnaissance Texte (Nopalou)
 * - Géométrie synchronisée au pixel près (aucun décalage entre le viseur écran et le crop)
 * - Lookup automatique EAN mondial (OpenFoodFacts / Base universelle)
 * - Retour multisensoriel (Web Audio API + Vibration haptique)
 * - Détection matérielle accélérée GPU (BarcodeDetector API)
 */

export interface ProduitEanInfo {
  code: string
  nom?: string
  marque?: string
  categorie?: string
  photoUrl?: string
  quantite?: string
}

/**
 * Recherche instantanée d'un produit par son code-barres EAN dans la base mondiale OpenFoodFacts
 * Timeout court (1.8s max) pour ne jamais bloquer l'utilisateur.
 */
export async function rechercherInfosProduitEan(barcode: string): Promise<ProduitEanInfo | null> {
  const codeNettoye = barcode.trim().replace(/\D/g, '')
  if (codeNettoye.length < 8) return null

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 2000)

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${codeNettoye}.json?fields=product_name,product_name_fr,brands,categories_tags,image_front_url,quantity`
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NopalouApp/1.0 (contact@nopalou.com)'
      }
    })
    clearTimeout(timeoutId)

    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null

    const p = data.product
    const nom = (p.product_name_fr || p.product_name || '').trim()
    const marque = (p.brands || '').split(',')[0]?.trim()
    const photoUrl = p.image_front_url || undefined
    const quantite = p.quantity || undefined

    // Construire un libellé clair : "Marque - Nom Produit (Quantité)"
    let libelleComplet = nom
    if (marque && !nom.toLowerCase().includes(marque.toLowerCase())) {
      libelleComplet = `${marque} - ${nom}`
    }
    if (quantite && !libelleComplet.includes(quantite)) {
      libelleComplet = `${libelleComplet} ${quantite}`
    }

    // Catégorie simplifiée
    let categorie: string | undefined = undefined
    if (Array.isArray(p.categories_tags) && p.categories_tags.length > 0) {
      const catBrute = p.categories_tags[p.categories_tags.length - 1].replace(/^en:|^fr:/, '').replace(/-/g, ' ')
      categorie = catBrute.charAt(0).toUpperCase() + catBrute.slice(1)
    }

    return {
      code: codeNettoye,
      nom: libelleComplet || undefined,
      marque: marque || undefined,
      categorie,
      photoUrl,
      quantite
    }
  } catch (e) {
    clearTimeout(timeoutId)
    return null
  }
}

/**
 * Capture mathématiquement EXACTE de ce qui est visible dans le viseur à l'écran.
 * Prend en compte l'affichage CSS `objectFit: cover` et la boîte de visée pour garantir
 * que 100% de ce que voit l'utilisateur à l'intérieur du cadre bleu est découpé, sans décalage.
 */
export function capturerZoneViseurExacte(
  video: HTMLVideoElement,
  options: {
    boxTopRatio?: number     // Ratio top de la boîte dans le conteneur (ex: 0.15 = 15%)
    boxLeftRatio?: number    // Ratio left de la boîte dans le conteneur (ex: 0.05 = 5%)
    boxWidthRatio?: number   // Ratio largeur de la boîte (ex: 0.90 = 90%)
    boxHeightRatio?: number  // Ratio hauteur de la boîte (ex: 0.70 = 70%)
    ameliorerNettete?: boolean
  } = {}
): string | null {
  if (!video || video.readyState < 2) return null

  const vWidth = video.videoWidth || 1280
  const vHeight = video.videoHeight || 720
  const cWidth = video.clientWidth || vWidth
  const cHeight = video.clientHeight || vHeight

  const boxTop = options.boxTopRatio ?? 0.15
  const boxLeft = options.boxLeftRatio ?? 0.06
  const boxW = options.boxWidthRatio ?? 0.88
  const boxH = options.boxHeightRatio ?? 0.70

  const arVid = vWidth / vHeight
  const arCont = cWidth / cHeight

  let visibleW: number
  let visibleH: number
  let offsetX: number
  let offsetY: number

  if (arVid > arCont) {
    // La vidéo est plus large que le conteneur : les côtés gauche et droit sont rognés par object-fit: cover
    visibleH = vHeight
    visibleW = vHeight * arCont
    offsetX = (vWidth - visibleW) / 2
    offsetY = 0
  } else {
    // La vidéo est plus haute que le conteneur (cas standard sur smartphone portrait) : le haut et le bas sont rognés
    visibleW = vWidth
    visibleH = vWidth / arCont
    offsetX = 0
    offsetY = (vHeight - visibleH) / 2
  }

  // Calcul des coordonnées de découpage précises dans les pixels réels du capteur
  const cropX = Math.max(0, Math.round(offsetX + boxLeft * visibleW))
  const cropY = Math.max(0, Math.round(offsetY + boxTop * visibleH))
  const cropW = Math.min(vWidth - cropX, Math.round(boxW * visibleW))
  const cropH = Math.min(vHeight - cropY, Math.round(boxH * visibleH))

  if (cropW <= 10 || cropH <= 10) return null

  const canvas = document.createElement('canvas')
  // Taille de sortie optimale pour OCR ultra-rapide (largeur max 960px)
  const scale = Math.min(1, 960 / cropW)
  canvas.width = Math.round(cropW * scale)
  canvas.height = Math.round(cropH * scale)

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  // Dessin de la zone exacte
  ctx.drawImage(
    video,
    cropX, cropY, cropW, cropH,
    0, 0, canvas.width, canvas.height
  )

  // Amélioration de netteté douce sans brûler les contrastes
  if (options.ameliorerNettete !== false) {
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imgData.data
      const contrast = 1.18 // Contraste modéré
      const intercept = 128 * (1 - contrast)

      for (let i = 0; i < d.length; i += 4) {
        // Luminance pondérée
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        const val = Math.min(255, Math.max(0, gray * contrast + intercept))
        d[i] = val
        d[i + 1] = val
        d[i + 2] = val
      }
      ctx.putImageData(imgData, 0, 0)
    } catch (e) {}
  }

  return canvas.toDataURL('image/jpeg', 0.88)
}

/**
 * Émet un retour multisensoriel : Bip audio net + Vibration haptique (40ms)
 */
export function jouerBipEtVibrer(type: 'succes' | 'alerte' = 'succes') {
  if (typeof window === 'undefined') return

  // 1. Vibration haptique native sur smartphone
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'succes') {
        navigator.vibrate(45)
      } else {
        navigator.vibrate([30, 40, 30])
      }
    }
  } catch (e) {}

  // 2. Bip sonore immédiat via Web Audio API
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    if (type === 'succes') {
      osc.frequency.setValueAtTime(920, ctx.currentTime) // Note aiguë cristalline
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.07)
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.09)
    } else {
      osc.frequency.setValueAtTime(420, ctx.currentTime)
      osc.frequency.setValueAtTime(310, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.20, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    }
  } catch (e) {}
}

/**
 * Créateur de configuration Html5Qrcode aux meilleurs standards internationaux
 */
export function CONFIG_SCANNER_EAN_PRO(Html5QrcodeSupportedFormats: any, options: { fps?: number } = {}) {
  return {
    fps: options.fps ?? 24, // 24 images/seconde pour fluidité totale
    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
      const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
      return {
        width: Math.min(320, Math.floor(viewfinderWidth * 0.88)),
        height: Math.min(190, Math.floor(minEdge * 0.65))
      }
    },
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true // Accélération matérielle native GPU
    },
    formatsToSupport: [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.QR_CODE
    ]
  }
}

/**
 * Allume ou éteint la lampe torche / flash de la caméra
 */
export async function toggleTorcheCamera(stream: MediaStream | null, enable: boolean): Promise<boolean> {
  if (!stream) return false
  try {
    const track = stream.getVideoTracks()[0]
    if (!track) return false
    const capabilities: any = track.getCapabilities ? track.getCapabilities() : {}
    if (capabilities && capabilities.torch) {
      await (track as any).applyConstraints({
        advanced: [{ torch: enable }]
      })
      return true
    }
  } catch (e) {}
  return false
}
