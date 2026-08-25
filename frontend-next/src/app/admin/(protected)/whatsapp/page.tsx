import { cookies } from 'next/headers'
import WhatsAppClient from './WhatsAppClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminWhatsAppPage() {
  const jar    = await cookies()
  const secret = jar.get('nopalou_admin')?.value ?? ''
  if (!secret) return null

  let status: Record<string, any> = {
    config: { phone_number_id: null, token_present: false, app_secret: false, verify_token: false, catalog_id: null, webhook_url: '' },
    api_status: 'non_configure',
    enabled: false,
    chatbot: false,
    stats: { sessions_total: 0, sessions_actives: 0, messages_24h: 0 },
  }
  let sessions: any[] = []
  let supportDemandes: any[] = []

  try {
    const [r1, r2, r3] = await Promise.all([
      fetch(`${BACKEND}/api/whatsapp/admin/status`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
      fetch(`${BACKEND}/api/whatsapp/admin/sessions`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
      fetch(`${BACKEND}/api/whatsapp/admin/support`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
    ])
    if (r1.ok) status = await r1.json()
    if (r2.ok) sessions = await r2.json()
    if (r3.ok) supportDemandes = await r3.json()
  } catch {}

  return (
    <div className="admin-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>WhatsApp Business</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
          Configuration, test de connexion Meta, sessions chatbot actives et demandes de support.
        </p>
      </div>
      <WhatsAppClient status={status as any} sessions={sessions} initialSupport={supportDemandes} secret={secret} />
    </div>
  )
}
