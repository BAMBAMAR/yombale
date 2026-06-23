'use server'
import { revalidatePath } from 'next/cache'
import { backendFetch, type ActionState } from '@/lib/backend-fetch'

export async function deleteAnnonce(id: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/annonces/mine/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible de supprimer cette annonce' }
    }
    revalidatePath('/mes-annonces')
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}
