import { cookies } from 'next/headers'
import TarifsClient from './TarifsClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminTarifsPage() {
  const jar    = await cookies()
  const secret = jar.get('nopalou_admin')?.value ?? ''
  if (!secret) return null

  let settings: Record<string, string> = {}
  try {
    const r = await fetch(`${BACKEND}/api/settings`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (r.ok) settings = await r.json()
  } catch {}

  return (
    <div className="admin-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Tarifs &amp; Promotions</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
          Tous les prix sont appliqués en temps réel (cache 5 min). Les webhooks Wave/Orange utilisent ces valeurs.
        </p>
      </div>
      <TarifsClient initial={settings as any} secret={secret} />
    </div>
  )
}
