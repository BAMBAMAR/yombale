import type { Metadata } from 'next'
import { backendFetch } from '@/lib/backend-fetch'
import { verifySession } from '@/lib/dal'
import AbonnementClient from './AbonnementClient'

export const metadata: Metadata = { title: 'Abonnement Boutique — Nopalou' }

export default async function AbonnementPage() {
  const session = await verifySession()

  let planActif: { plan: string; fin: string } | null = null
  try {
    const res = await backendFetch('/api/abonnements/mon-plan')
    if (res.ok) {
      const data = await res.json()
      planActif = data.abonnement
    }
  } catch { /* afficher page normale si erreur */ }

  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let settings: Record<string, string> = {}
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
    if (r.ok) settings = await r.json()
  } catch {
    // valeurs par défaut gérées dans AbonnementClient
  }

  return <AbonnementClient planActif={planActif} userId={session.userId} settings={settings} />
}
