'use server'

// AUD-214 : création de boutique par l'assistant « Taf Taf », appelée côté serveur pour que la session de l'utilisateur
// (cookie httpOnly, invisible du navigateur) accompagne la requête. Connecté, la boutique va sur son compte ;
// visiteur, le parcours par numéro vérifié reste inchangé.
import { backendFetch } from '@/lib/backend-fetch'

export interface CreationBoutiquePayload {
  nom: string
  telephone: string
  couleur: string
  plan: string
  categorie: string
  code_apporteur: string
  preuve_telephone: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  landing_page?: string
}

export interface CreationBoutiqueResultat {
  ok: boolean
  status?: number
  error?: string
  data?: {
    boutiqueId: string
    slug?: string | null
    token?: string
    compte_connecte?: boolean
    deja_existante?: boolean
  }
}

export async function creerBoutiqueTafTafAction(payload: CreationBoutiquePayload): Promise<CreationBoutiqueResultat> {
  try {
    const res = await backendFetch('/api/boutiques/taf-taf', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, status: res.status, error: data?.error || 'Erreur lors de la création de la boutique.' }
    }
    return { ok: true, status: res.status, data }
  } catch (err) {
    console.error('[creerBoutiqueTafTafAction]', err instanceof Error ? err.message : err)
    return { ok: false, error: 'Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.' }
  }
}
