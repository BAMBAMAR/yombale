'use server'

import { revalidatePath } from 'next/cache'
import { backendFetch, type ActionState } from '@/lib/backend-fetch'

export async function getBoutiqueDocuments(boutiqueId: string, type?: string): Promise<any[]> {
  try {
    const url = type ? `/api/boutiques/${boutiqueId}/documents?type=${type}` : `/api/boutiques/${boutiqueId}/documents`
    const res = await backendFetch(url)
    if (!res.ok) return []
    const data = await res.json().catch(() => [])
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error('[GET_BOUTIQUE_DOCUMENTS_ERR]', err)
    return []
  }
}

export async function creerBoutiqueDocument(boutiqueId: string, body: any): Promise<any> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/documents`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de créer le document' }
    }
    return await res.json()
  } catch (err) {
    console.error('[CREER_BOUTIQUE_DOCUMENT_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function modifierBoutiqueDocument(boutiqueId: string, docId: string, body: any): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/documents/${docId}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de modifier le document' }
    }
    return { success: true }
  } catch (err) {
    console.error('[MODIFIER_BOUTIQUE_DOCUMENT_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function supprimerBoutiqueDocument(boutiqueId: string, docId: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/documents/${docId}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de supprimer le document' }
    }
    return { success: true }
  } catch (err) {
    console.error('[SUPPRIMER_BOUTIQUE_DOCUMENT_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function getFournisseurs(boutiqueId: string): Promise<any[]> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/fournisseurs`)
    if (!res.ok) return []
    const data = await res.json().catch(() => [])
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error('[GET_FOURNISSEURS_ERR]', err)
    return []
  }
}

export async function creerFournisseur(boutiqueId: string, body: any): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/fournisseurs`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de créer le fournisseur' }
    }
    return { success: true }
  } catch (err) {
    console.error('[CREER_FOURNISSEUR_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function modifierFournisseur(boutiqueId: string, fId: string, body: any): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/fournisseurs/${fId}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de modifier le fournisseur' }
    }
    return { success: true }
  } catch (err) {
    console.error('[MODIFIER_FOURNISSEUR_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function supprimerFournisseur(boutiqueId: string, fId: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/fournisseurs/${fId}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de supprimer le fournisseur' }
    }
    return { success: true }
  } catch (err) {
    console.error('[SUPPRIMER_FOURNISSEUR_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function getCommandesFournisseurs(boutiqueId: string): Promise<any[]> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/commandes-fournisseurs`)
    if (!res.ok) return []
    const data = await res.json().catch(() => [])
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error('[GET_COMMANDES_FOURNISSEURS_ERR]', err)
    return []
  }
}

export async function creerCommandeFournisseur(boutiqueId: string, body: any): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/commandes-fournisseurs`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de créer la commande fournisseur' }
    }
    return { success: true }
  } catch (err) {
    console.error('[CREER_COMMANDE_FOURNISSEUR_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function modifierCommandeFournisseur(boutiqueId: string, cmdId: string, body: any): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/commandes-fournisseurs/${cmdId}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de modifier la commande fournisseur' }
    }
    return { success: true }
  } catch (err) {
    console.error('[MODIFIER_COMMANDE_FOURNISSEUR_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function recevoirCommandeFournisseur(boutiqueId: string, cmdId: string, body: any): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/commandes-fournisseurs/${cmdId}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de mettre à jour la commande fournisseur' }
    }
    revalidatePath('/boutique')
    revalidatePath(`/boutiques/${boutiqueId}`)
    return { success: true }
  } catch (err) {
    console.error('[RECEVOIR_COMMANDE_FOURNISSEUR_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function supprimerCommandeFournisseur(boutiqueId: string, cmdId: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/commandes-fournisseurs/${cmdId}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de supprimer la commande fournisseur' }
    }
    return { success: true }
  } catch (err) {
    console.error('[SUPPRIMER_COMMANDE_FOURNISSEUR_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function uploadJustificatifAchat(boutiqueId: string, formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/upload-justificatif`, {
      method: 'POST',
      body: formData
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Erreur lors du téléchargement du fichier' }
    }
    return await res.json()
  } catch (err) {
    console.error('[UPLOAD_JUSTIFICATIF_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function verifierBonAchat(boutiqueId: string, code: string): Promise<any> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/bons-achat/${code}`)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Bon d’achat invalide ou expiré' }
    }
    return await res.json()
  } catch (err) {
    console.error('[VERIFIER_BON_ACHAT_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function getBoutiquePromotions(boutiqueId: string): Promise<{ promotions?: any[]; error?: string }> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/promotions`)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de charger les promotions' }
    }
    return await res.json()
  } catch (err) {
    console.error('[GET_BOUTIQUE_PROMOTIONS_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function createPromotion(
  boutiqueId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState & { promotion?: any }> {
  try {
    const rawData = {
      code: formData.get('code'),
      type_remise: formData.get('type_remise'),
      valeur: formData.get('valeur'),
      min_achat: formData.get('min_achat'),
      limite_utilisation: formData.get('limite_utilisation') || null,
      fin: formData.get('fin') || null,
    }
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/promotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rawData),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { error: data.error ?? 'Impossible de créer le code promo' }
    }
    revalidatePath('/boutique')
    return { success: true, promotion: data.promotion }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function deletePromotion(
  boutiqueId: string,
  promoId: string
): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/promotions/${promoId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible de supprimer le code promo' }
    }
    revalidatePath('/boutique')
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}
