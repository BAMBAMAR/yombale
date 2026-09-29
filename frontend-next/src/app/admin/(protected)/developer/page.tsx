import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import DeveloperClient, { ApiKeyItem, WebhookItem } from './DeveloperClient'
import { buildAdminAuthHeaders } from '@/lib/admin-auth-headers'

export const metadata: Metadata = { title: 'Portail Développeur API — Admin Nopalou' }

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminDeveloperPage() {
  const jar = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''
  const headers = buildAdminAuthHeaders(token)

  let initialKeys: ApiKeyItem[] = []
  let initialWebhooks: WebhookItem[] = []

  try {
    const res = await fetch(`${BACKEND}/api/boutiques/admin/developer-portal`, {
      headers,
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      initialKeys = data.keys || []
      initialWebhooks = data.webhooks || []
    }
  } catch (err) {
    console.error('[ADMIN_DEV_PORTAL_SSR_ERR]', err)
  }

  return (
    <DeveloperClient
      secret={token}
      initialKeys={initialKeys}
      initialWebhooks={initialWebhooks}
    />
  )
}
