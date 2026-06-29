'use server'
import { revalidatePath } from 'next/cache'
import { backendFetch, type ActionState } from '@/lib/backend-fetch'

function extractError(data: Record<string, unknown>, fallback: string): string {
  if (data.error && typeof data.error === 'string') return data.error
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0]
    return typeof first?.msg === 'string' ? first.msg : fallback
  }
  return fallback
}

export async function createBoutique(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const res = await backendFetch('/api/boutiques', { method: 'POST', body: formData })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: extractError(data, 'Impossible de créer la boutique') }
    }
    revalidatePath('/boutique')
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function updateBoutique(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${id}`, { method: 'PUT', body: formData })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: extractError(data, 'Impossible de modifier la boutique') }
    }
    revalidatePath('/boutique')
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function deleteBoutique(id: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible de supprimer la boutique' }
    }
    revalidatePath('/boutique')
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

// ── Produits catalogue boutique ──

export async function createProduit(
  boutiqueId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/produits`, { method: 'POST', body: formData })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible d\'ajouter le produit' }
    }
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function updateProduit(
  boutiqueId: string,
  produitId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/produits/${produitId}`, { method: 'PUT', body: formData })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible de modifier le produit' }
    }
    return { success: true }
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
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}
