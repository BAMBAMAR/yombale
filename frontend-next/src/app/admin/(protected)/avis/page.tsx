import { cookies } from 'next/headers'
import AvisClient from './AvisClient'
import { BACKEND, adminHeaders } from '@/app/actions/admin'

export const metadata = { title: 'Modération des Avis Boutiques — Admin Nopalou' }

export default async function AdminAvisPage({
  searchParams,
}: {
  searchParams: Promise<{ note?: string; q?: string; page?: string }>
}) {
  const jar   = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''
  if (!token) return null

  const sp = await searchParams
  const note = sp.note ?? ''
  const q = sp.q ?? ''
  const page = sp.page ?? '1'

  let avis: any[] = []
  let total = 0

  try {
    const params = new URLSearchParams()
    if (note) params.set('note', note)
    if (q) params.set('q', q)
    if (page) params.set('page', page)

    const res = await fetch(`${BACKEND}/api/admin/avis?${params.toString()}`, {
      headers: adminHeaders(token),
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      avis = data.avis || []
      total = data.total || 0
    }
  } catch (err) {
    console.warn('[AdminAvisPage ERR]', err)
  }

  return (
    <div className="admin-content">
      <AvisClient initialAvis={avis} total={total} token={token} />
    </div>
  )
}
