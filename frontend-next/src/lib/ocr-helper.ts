/**
 * Helper d'optimisation pour la capture OCR (Scan Nom) et les retours sonores de scan
 */

/**
 * Capture la zone centrale d'une vidéo avec recadrage (ROI) et amélioration de contraste
 * pour maximiser le taux de reconnaissance Tesseract et réduire la latence réseau.
 */
export function capturerEtOptimiserImageOCR(
  video: HTMLVideoElement,
  options: {
    cropRatioWidth?: number
    cropRatioHeight?: number
    rehausserContraste?: boolean
  } = {}
): string | null {
  if (!video || video.readyState < 2) return null

  const vWidth = video.videoWidth || 640
  const vHeight = video.videoHeight || 480

  const cropRatioW = options.cropRatioWidth ?? 0.85
  const cropRatioH = options.cropRatioHeight ?? 0.60
  const rehausser = options.rehausserContraste !== false

  // Calcul de la zone de cadrage centrale
  const targetW = Math.round(vWidth * cropRatioW)
  const targetH = Math.round(vHeight * cropRatioH)
  const startX = Math.round((vWidth - targetW) / 2)
  const startY = Math.round((vHeight - targetH) / 2)

  const canvas = document.createElement('canvas')
  // Limiter la taille max pour un traitement OCR ultra-rapide (max 900px)
  const scale = Math.min(1, 900 / targetW)
  canvas.width = Math.round(targetW * scale)
  canvas.height = Math.round(targetH * scale)

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  // Dessin de la zone recadrée
  ctx.drawImage(
    video,
    startX, startY, targetW, targetH,
    0, 0, canvas.width, canvas.height
  )

  // Amélioration de contraste & niveaux de gris pour l'OCR
  if (rehausser) {
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imgData.data
      const contrast = 1.35 // Boost de contraste
      const intercept = 128 * (1 - contrast)

      for (let i = 0; i < d.length; i += 4) {
        // Conversion en luminance (grayscale)
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        // Application du contraste
        const enhanced = Math.min(255, Math.max(0, gray * contrast + intercept))
        d[i] = enhanced     // R
        d[i + 1] = enhanced // G
        d[i + 2] = enhanced // B
      }
      ctx.putImageData(imgData, 0, 0)
    } catch (e) {
      // Ignorer si échec d'accès aux pixels
    }
  }

  return canvas.toDataURL('image/jpeg', 0.82)
}

/**
 * Joue un bip sonore court et agréable lors d'un scan réussi (Web Audio API natif, 0 dépendance)
 */
export function jouerBipScan(type: 'succes' | 'alerte' = 'succes') {
  if (typeof window === 'undefined') return
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    if (type === 'succes') {
      osc.frequency.setValueAtTime(880, ctx.currentTime) // Note La5 claire
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08)
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.08)
    }

    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.12)
  } catch (e) {
    // Silencieux si l'audio context est restreint par le navigateur
  }
}
