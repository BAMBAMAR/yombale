import { cookies } from 'next/headers'
import SignalementsClient from './SignalementsClient'
import { BACKEND, adminHeaders } from '@/app/actions/admin'

export const metadata = { title: 'Signalements d\'Abus — Admin Nopalou' }

export default async function AdminSignalementsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; type_cible?: string; page?: string }>
}) {
  const jar   = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''
  if (!token) return null

  const sp = await searchParams
  const statut = sp.statut ?? ''
  const type_cible = sp.type_cible ?? ''
  const page = sp.page ?? '1'

  let signalements: any[] = []
  let total = 0

  try {
    const params = new URLSearchParams()
    if (statut) params.set('statut', statut)
    if (type_cible) params.set('type_cible', type_cible)
    if (page) params.set('page', page)

    const res = await fetch(`${BACKEND}/api/admin/signalements?${params.toString()}`, {
      headers: adminHeaders(token),
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      signalements = data.signalements || []
      total = data.total || 0
    }
  } catch (err) {
    console.warn('[AdminSignalementsPage ERR]', err)
  }

  return (
    <div className="admin-content">
      <SignalementsClient initialSignalements={signalements} total={total} token={token} />
    </div>
  )
}
