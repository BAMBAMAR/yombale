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

// ── Comptabilité : zones de livraison + ventes ──

export async function listZones(boutiqueId: string) {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/zones`)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function createZone(boutiqueId: string, nom: string, prix: number): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/zones`, {
      method: 'POST', body: JSON.stringify({ nom, prix }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible de créer la zone' }
    }
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function deleteZone(boutiqueId: string, zoneId: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/zones/${zoneId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible de supprimer la zone' }
    }
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function listVentes(boutiqueId: string) {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/ventes`)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function declarerVente(
  boutiqueId: string,
  data: {
    produit_id?: string
    nom_produit?: string
    quantite: number
    prix_unitaire: number
    zone_livraison_id?: string
    client_nom?: string
    client_telephone?: string
    methode_paiement?: string
  }
): Promise<ActionState & { id?: string }> {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/ventes`, {
      method: 'POST', body: JSON.stringify(data),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return { error: errData.error ?? 'Impossible d\'enregistrer la vente' }
    }
    const created = await res.json().catch(() => ({}))
    return { success: true, id: created.id }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function getDashboard(boutiqueId: string) {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/dashboard`)
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function listDepenses(boutiqueId: string) {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/depenses`)
    if (!res.ok) return []
    return await res.json()
  } catch { return [] }
}

export async function addDepense(
  boutiqueId: string,
  data: { montant: number; categorie: string; description?: string; date_depense?: string }
): Promise<ActionState & { id?: string }> {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/depenses`, {
      method: 'POST', body: JSON.stringify(data),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible d\'enregistrer la dépense' }
    }
    const created = await res.json().catch(() => ({}))
    return { success: true, id: created.id }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function deleteDepense(boutiqueId: string, depenseId: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/depenses/${depenseId}`, { method: 'DELETE' })
    if (!res.ok) return { error: 'Impossible de supprimer' }
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function updateVente(
  boutiqueId: string,
  venteId: string,
  data: {
    nom_produit?: string; quantite?: number; prix_unitaire?: number; frais_livraison?: number
    client_nom?: string; client_telephone?: string; methode_paiement?: string
  }
): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/ventes/${venteId}`, {
      method: 'PUT', body: JSON.stringify(data),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de modifier la vente' }
    }
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function updateDepense(
  boutiqueId: string,
  depenseId: string,
  data: { montant?: number; categorie?: string; description?: string; date_depense?: string }
): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/depenses/${depenseId}`, {
      method: 'PUT', body: JSON.stringify(data),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de modifier la dépense' }
    }
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function deleteVente(boutiqueId: string, venteId: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/ventes/${venteId}`, { method: 'DELETE' })
    if (!res.ok) return { error: 'Impossible de supprimer' }
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function listCommandes(boutiqueId: string, statut?: string) {
  try {
    const qs = statut ? `?statut=${statut}` : ''
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/commandes${qs}`)
    if (!res.ok) return []
    return await res.json()
  } catch { return [] }
}

export async function updateStatutCommande(boutiqueId: string, commandeId: string, statut: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/commandes/${commandeId}`, {
      method: 'PATCH', body: JSON.stringify({ statut }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de mettre à jour le statut' }
    }
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function updateStock(boutiqueId: string, produitId: string, stock_quantite: number): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/comptabilite/${boutiqueId}/stock/${produitId}`, {
      method: 'PATCH', body: JSON.stringify({ stock_quantite }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de mettre à jour le stock' }
    }
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}
