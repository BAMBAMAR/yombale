import { cookies } from 'next/headers'
import AdminTelecomClient from './AdminTelecomClient'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Télécom — Admin Nopalou' }

export interface Forfait {
  id: string
  operateur: string
  nom: string
  type: string
  data_mo: number | null
  minutes: number | null
  sms: number | null
  validite_jours: number | null
  prix: number
  description: string | null
  actif: boolean
}

export default async function AdminTelecomPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)!.value

  const r = await fetch(`${BACKEND}/api/telecom?limit=200`, {
    headers: { 'X-Admin-Secret': secret },
    cache: 'no-store',
  })

  const data = r.ok ? await r.json() : { forfaits: [] }

  return (
    <div className="admin-content">
      <h1 className="admin-page-titre">
        Forfaits télécom
        <span className="admin-page-count">{data.forfaits?.length ?? 0}</span>
      </h1>
      <AdminTelecomClient forfaits={data.forfaits ?? []} adminSecret={secret} />
    </div>
  )
}
