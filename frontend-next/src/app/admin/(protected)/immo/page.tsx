import { cookies } from 'next/headers'
import AdminImmoClient from './AdminImmoClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Immo à valider — Admin Nopalou' }

export default async function AdminImmoPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)!.value
  const headers = { 'X-Admin-Secret': secret }
  const opts = { headers, cache: 'no-store' as RequestCache }

  const [enAttenteRes, sponsoringRes] = await Promise.allSettled([
    fetch(`${BACKEND}/api/immo/admin/en-attente`, opts),
    fetch(`${BACKEND}/api/immo/admin/demandes-sponsorisation`, opts),
  ])

  let annonces: object[] = []
  let demandesSponsoring: object[] = []

  if (enAttenteRes.status === 'fulfilled' && enAttenteRes.value.ok) {
    const data = await enAttenteRes.value.json()
    annonces = data.annonces ?? data ?? []
  }
  if (sponsoringRes.status === 'fulfilled' && sponsoringRes.value.ok) {
    const data = await sponsoringRes.value.json()
    demandesSponsoring = data.annonces ?? data ?? []
  }

  return (
    <div className="admin-content">
      <h1 className="admin-page-titre">
        Immobilier — Annonces à valider
        <span className="admin-page-count">{annonces.length}</span>
      </h1>
      <AdminImmoClient
        annonces={annonces as Parameters<typeof AdminImmoClient>[0]['annonces']}
        demandesSponsoring={demandesSponsoring as Parameters<typeof AdminImmoClient>[0]['demandesSponsoring']}
      />
    </div>
  )
}
