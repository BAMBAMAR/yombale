import { cookies } from 'next/headers'
import AdminIntegrationsClient from './AdminIntegrationsClient'
import { extractAdminToken, adminHeaders } from '@/app/actions/admin/admin-common'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export const metadata = {
  title: 'Supervision des Intégrations & Réseaux Sociaux — Admin Nopalou',
  description: 'Contrôle des connecteurs Instagram, TikTok, Facebook, WhatsApp, Pixels et passerelles.',
}

export default async function AdminIntegrationsPage() {
  const jar = await cookies()
  const secret = extractAdminToken(jar) ?? ''

  let initialStats = null
  let initialAccounts = []

  try {
    const [statsRes, accountsRes] = await Promise.all([
      fetch(`${BACKEND}/api/admin/integrations/stats`, {
        headers: adminHeaders(secret),
        cache: 'no-store',
      }),
      fetch(`${BACKEND}/api/admin/integrations/accounts?limit=50`, {
        headers: adminHeaders(secret),
        cache: 'no-store',
      }),
    ])

    if (statsRes.ok) initialStats = await statsRes.json()
    if (accountsRes.ok) {
      const data = await accountsRes.json()
      initialAccounts = data.accounts || []
    }
  } catch (err) {
    console.error('[ADMIN_INTEGRATIONS_PAGE_ERR]', err)
  }

  return (
    <div className="admin-content">
      <AdminIntegrationsClient
        initialStats={initialStats}
        initialAccounts={initialAccounts}
        secret={secret}
      />
    </div>
  )
}
