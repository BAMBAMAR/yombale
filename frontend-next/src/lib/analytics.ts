// frontend-next/src/lib/analytics.ts — Module central de tracking analytique & attribution UTM Nopalou

export interface UtmData {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  social_post_id?: string
}

export type AnalyticsEventType =
  | 'vue_boutique'
  | 'clic_telephone'
  | 'vue_annonce'
  | 'vue_produit'
  | 'ajout_panier'
  | 'checkout_initie'
  | 'commande_confirmee'

const UTM_STORAGE_KEY = 'nopalou_utm'

/**
 * Capture et persiste les UTMs dans le localStorage dès leur apparition dans l'URL.
 */
export function captureAndPersistUtm(searchParams?: URLSearchParams | null): UtmData {
  if (typeof window === 'undefined') return {}

  let sp = searchParams
  if (!sp) {
    try {
      sp = new URLSearchParams(window.location.search)
    } catch {
      return getSavedUtm()
    }
  }

  const src = sp.get('utm_source')?.trim() || undefined
  const med = sp.get('utm_medium')?.trim() || undefined
  const cam = sp.get('utm_campaign')?.trim() || undefined
  const post = sp.get('social_post_id')?.trim() || undefined

  if (src || med || cam || post) {
    const existing = getSavedUtm()
    const updated: UtmData = {
      utm_source: src || existing.utm_source,
      utm_medium: med || existing.utm_medium,
      utm_campaign: cam || existing.utm_campaign,
      social_post_id: post || existing.social_post_id,
    }
    try {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.warn('[Analytics:UTM] Erreur sauvegarde localStorage:', e)
    }
    return updated
  }

  return getSavedUtm()
}

/**
 * Récupère les paramètres UTM persistés en local.
 */
export function getSavedUtm(): UtmData {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        return {
          utm_source: parsed.utm_source || undefined,
          utm_medium: parsed.utm_medium || undefined,
          utm_campaign: parsed.utm_campaign || undefined,
          social_post_id: parsed.social_post_id || undefined,
        }
      }
    }
  } catch {
    /* ignoré */
  }
  return {}
}

/**
 * Envoie un événement analytique au backend Nopalou et déclenche les pixels tiers (Meta, TikTok).
 */
export function trackAnalyticsEvent(
  type: AnalyticsEventType,
  boutiqueId: string,
  options?: {
    produitId?: string | null
    annonceId?: string | null
    valeur?: number
    monnaie?: string
  }
): void {
  if (typeof window === 'undefined' || !boutiqueId) return

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

  // 1. Envoi au backend Nopalou (non bloquant)
  fetch(`${backendUrl}/api/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      boutique_id: boutiqueId,
      annonce_id: options?.annonceId || undefined,
    }),
  }).catch((err) => {
    // Mode silencieux pour ne jamais perturber l'expérience utilisateur
    console.debug('[Analytics:Event]', type, err?.message)
  })

  // 2. Pont pixels publicitaires (Meta & TikTok) si installés dans la page
  try {
    const val = options?.valeur || 0
    const curr = options?.monnaie || 'XOF'

    if (type === 'vue_produit') {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'ViewContent', {
          content_ids: options?.produitId ? [options.produitId] : [],
          content_type: 'product',
          value: val,
          currency: curr,
        })
      }
      if (window.ttq?.track) {
        window.ttq.track('ViewContent', {
          content_id: options?.produitId || undefined,
          content_type: 'product',
          value: val,
          currency: curr,
        })
      }
    } else if (type === 'ajout_panier') {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'AddToCart', {
          content_ids: options?.produitId ? [options.produitId] : [],
          content_type: 'product',
          value: val,
          currency: curr,
        })
      }
      if (window.ttq?.track) {
        window.ttq.track('AddToCart', {
          content_id: options?.produitId || undefined,
          content_type: 'product',
          value: val,
          currency: curr,
        })
      }
    } else if (type === 'checkout_initie') {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'InitiateCheckout', { value: val, currency: curr })
      }
      if (window.ttq?.track) {
        window.ttq.track('InitiateCheckout', { value: val, currency: curr })
      }
    } else if (type === 'commande_confirmee') {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Purchase', { value: val, currency: curr })
      }
      if (window.ttq?.track) {
        window.ttq.track('CompletePayment', { value: val, currency: curr })
      }
    }
  } catch {
    /* ignoré */
  }
}
