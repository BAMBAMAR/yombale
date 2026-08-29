import { cookies } from 'next/headers'
import AdminAuditLogsClient from './AdminAuditLogsClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Audit Logs — Admin Nopalou' }

export default async function AdminAuditLogsPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  let logs = []
  let total = 0

  try {
    const res = await fetch(`${BACKEND}/api/admin/audit-logs?page=1`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      logs = data.logs ?? []
      total = data.total ?? 0
    }
  } catch (err) {
    console.error('[AUDIT_LOGS_PAGE_ERR]', err)
  }

  return (
    <div className="admin-content">
      <AdminAuditLogsClient initialLogs={logs} initialTotal={total} secret={secret} />
    </div>
  )
}
