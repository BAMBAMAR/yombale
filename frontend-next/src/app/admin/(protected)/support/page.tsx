import { cookies } from 'next/headers'
import SupportClient from './SupportClient'
import { BACKEND, adminHeaders } from '@/app/actions/admin'

export const metadata = { title: 'Helpdesk & Support Client — Admin Nopalou' }

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; priorite?: string; q?: string; page?: string }>
}) {
  const jar   = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''
  if (!token) return null

  const sp = await searchParams
  const statut = sp.statut ?? ''
  const priorite = sp.priorite ?? ''
  const q = sp.q ?? ''
  const page = sp.page ?? '1'

  let tickets: any[] = []
  let total = 0

  try {
    const params = new URLSearchParams({ statut, priorite, q, page })
    const res = await fetch(`${BACKEND}/api/admin/support/tickets?${params}`, {
      headers: adminHeaders(token),
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      tickets = data.tickets || []
      total = data.total || 0
    }
  } catch (err) {
    console.warn('[AdminSupportPage ERR]', err)
  }

  return (
    <div className="admin-content">
      <SupportClient initialTickets={tickets} total={total} token={token} />
    </div>
  )
}
