import { cookies } from 'next/headers'
import WhatsAppClient from './WhatsAppClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminWhatsAppPage() {
  const jar    = await cookies()
  const secret = jar.get('nopalou_admin')?.value ?? ''
  if (!secret) return null

  let status: Record<string, any> = {}
  let sessions: any[] = []

  try {
    const [r1, r2] = await Promise.all([
      fetch(`${BACKEND}/api/whatsapp/admin/status`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
      fetch(`${BACKEND}/api/whatsapp/admin/sessions`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
    ])
    if (r1.ok) status = await r1.json()
    if (r2.ok) sessions = await r2.json()
  } catch {}

  return (
    <div className="admin-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>WhatsApp Business</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
          Configuration, test de connexion Meta, sessions chatbot actives.
        </p>
      </div>
      <WhatsAppClient status={status as any} sessions={sessions} secret={secret} />
    </div>
  )
}
