import { cookies } from 'next/headers'
import AdminImmoClient from './AdminImmoClient'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Immo à valider — Admin Nopalou' }

export default async function AdminImmoPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)!.value

  const r = await fetch(`${BACKEND}/api/immo/admin/en-attente`, {
    headers: { 'X-Admin-Secret': secret },
    cache: 'no-store',
  })

  let annonces: object[] = []
  if (r.ok) {
    const data = await r.json()
    annonces = data.annonces ?? data ?? []
  }

  return (
    <div className="admin-content">
      <h1 className="admin-page-titre">
        Immobilier — Annonces à valider
        <span className="admin-page-count">{annonces.length}</span>
      </h1>
      <AdminImmoClient annonces={annonces as Parameters<typeof AdminImmoClient>[0]['annonces']} />
    </div>
  )
}
