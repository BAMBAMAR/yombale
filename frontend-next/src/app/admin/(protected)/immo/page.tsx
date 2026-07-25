import { cookies } from 'next/headers'
import AdminImmoClient from './AdminImmoClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Immo — Admin Nopalou' }

async function fetchJson(url: string, headers: Record<string, string>) {
  try {
    const r = await fetch(url, { headers, cache: 'no-store' })
    if (!r.ok) return []
    const data = await r.json()
    return data.annonces ?? data ?? []
  } catch {
    return []
  }
}

export default async function AdminImmoPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  const headers = { 'X-Admin-Secret': secret }

  const [annonces, demandesSponsoring] = await Promise.all([
    fetchJson(`${BACKEND}/api/immo/admin/en-attente`, headers),
    fetchJson(`${BACKEND}/api/immo/admin/demandes-sponsorisation`, headers),
  ])

  return (
    <div className="admin-content">
      <h1 className="admin-page-titre">Immobilier — Annonces</h1>
      <AdminImmoClient
        annonces={annonces}
        demandesSponsoring={demandesSponsoring}
      />
    </div>
  )
}
