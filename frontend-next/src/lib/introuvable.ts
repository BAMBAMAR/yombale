// AUD-153 : une fiche inconnue doit répondre 404. `notFound()` appelé seulement dans le composant arrive trop tard
// (le flux a déjà commencé, le statut reste 200 : « soft 404 »). On l'appelle donc dès `generateMetadata`.
// Un identifiant qui est en fait un alias (autre type d'entité) est redirigé vers sa vraie page, comme avant.
import 'server-only'
import { notFound, redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'

/** À appeler hors de tout try/catch : lève la redirection ou le 404 (jamais ne retourne). */
export async function introuvableOuRedirection(id: string, cheminCourant: string): Promise<never> {
  let cible: string | null = null
  try {
    const r = await apiFetch<{ found: boolean; url: string }>(`/entites/resoudre/${encodeURIComponent(id)}`)
    if (r?.found && r.url && r.url !== cheminCourant) cible = r.url
  } catch {
    // résolution indisponible : 404
  }
  if (cible) redirect(cible)
  notFound()
}
