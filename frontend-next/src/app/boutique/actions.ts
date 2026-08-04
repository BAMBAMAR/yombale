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

export async function duplicateProduit(
  boutiqueId: string,
  produitId: string,
  data?: { nom?: string; prix?: number; stock_quantite?: number }
): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/produits/${produitId}/dupliquer`, {
      method: 'POST',
      body: JSON.stringify(data || {})
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible de dupliquer le produit' }
    }
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function publierProduitAnnonce(boutiqueId: string, produitId: string): Promise<ActionState & { besoin_paiement?: boolean, message?: string }> {
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

export async function getBoutiquesMine(): Promise<any[]> {
  try {
    const res = await backendFetch('/api/boutiques/mine')
    if (!res.ok) return []
    const data = await res.json()
    return data.boutiques ?? []
  } catch (err) {
    console.error('[GET_BOUTIQUES_MINE_ERR]', err)
    return []
  }
}

export async function getPosHistorique(boutiqueId: string): Promise<any[]> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/pos-historique`)
    if (!res.ok) return []
    const data = await res.json().catch(() => [])
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error('[GET_POS_HISTORIQUE_ERR]', err)
    return []
  }
}

export async function creerPosVente(boutiqueId: string, body: any): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/pos-vente`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible d\'enregistrer la vente' }
    }
    return { success: true }
  } catch (err) {
    console.error('[CREER_POS_VENTE_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function declarerIncident(boutiqueId: string, body: any): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/pos-incident`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      return { error: d.error ?? 'Impossible de déclarer l\'incident' }
    }
    return { success: true }
  } catch (err) {
    console.error('[DECLARER_INCIDENT_ERR]', err)
    return { error: 'Erreur de connexion au serveur' }
  }
}

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


