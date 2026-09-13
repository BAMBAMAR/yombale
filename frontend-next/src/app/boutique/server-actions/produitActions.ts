'use server'

import { revalidatePath } from 'next/cache'
import { backendFetch, type ActionState } from '@/lib/backend-fetch'

export async function createProduit(
  boutiqueId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState & { produit?: any }> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/produits`, { method: 'POST', body: formData })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { error: data.error ?? 'Impossible d\'ajouter le produit' }
    }
    revalidatePath('/boutique')
    revalidatePath(`/boutiques/${boutiqueId}`)
    return { success: true, produit: data.produit }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function updateProduit(
  boutiqueId: string,
  produitId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState & { produit?: any }> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/produits/${produitId}`, { method: 'PUT', body: formData })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { error: data.error ?? 'Impossible de modifier le produit' }
    }
    revalidatePath('/boutique')
    revalidatePath(`/boutiques/${boutiqueId}`)
    revalidatePath(`/boutiques/${boutiqueId}/produits/${produitId}`)
    return { success: true, produit: data.produit }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function deleteProduit(boutiqueId: string, produitId: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/produits/${produitId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible de supprimer le produit' }
    }
    revalidatePath('/boutique')
    revalidatePath(`/boutiques/${boutiqueId}`)
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function duplicateProduit(
  boutiqueId: string,
  produitId: string,
  data?: { nom?: string; prix?: number; stock_quantite?: number }
): Promise<ActionState & { produit?: any }> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/produits/${produitId}/dupliquer`, {
      method: 'POST',
      body: JSON.stringify(data || {})
    })
    const resData = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { error: resData.error ?? 'Impossible de dupliquer le produit' }
    }
    return { success: true, produit: resData.produit }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function publierProduitAnnonce(
  boutiqueId: string,
  produitId: string
): Promise<ActionState & { besoin_paiement?: boolean; message?: string }> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/produits/${produitId}/publier-annonce`, { method: 'POST' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? "Impossible de publier l'annonce" }
    }
    const data = await res.json()
    return { success: true, besoin_paiement: data.besoin_paiement, message: data.message }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function marquerProduitPartage(boutiqueId: string, produitId: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/produits/${produitId}/partage`, { method: 'PATCH' })
    if (!res.ok) return { error: 'Impossible de marquer le produit comme partagé' }
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function updateStock(boutiqueId: string, produitId: string, stock_quantite: number): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/stock/${produitId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stock_quantite }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de mettre à jour le stock' }
    }
    revalidatePath('/boutique')
    revalidatePath(`/boutiques/${boutiqueId}`)
    revalidatePath(`/boutiques/${boutiqueId}/produits/${produitId}`)
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function getBoutiqueProduits(boutiqueId: string): Promise<any[]> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/produits`)
    if (!res.ok) return []
    const data = await res.json()
    return data.produits ?? []
  } catch (err) {
    console.error('[GET_BOUTIQUE_PRODUITS_ERR]', err)
    return []
  }
}
