import { cookies } from 'next/headers'
import ApporteursClient from './ApporteursClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminApporteursPage() {
  const jar    = await cookies()
  const secret = jar.get('nopalou_admin')?.value ?? ''
  if (!secret) return null

  let settings: Record<string, string> = {}
  let apporteurs: any[] = []
  let commissions: any[] = []

  try {
    const [settingsRes, apporteursRes, commissionsRes] = await Promise.all([
      fetch(`${BACKEND}/api/settings`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
      fetch(`${BACKEND}/api/apporteurs/admin`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
      fetch(`${BACKEND}/api/apporteurs/admin/commissions`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
    ])
    if (settingsRes.ok) settings = await settingsRes.json()
    if (apporteursRes.ok) apporteurs = (await apporteursRes.json()).apporteurs
    if (commissionsRes.ok) commissions = (await commissionsRes.json()).commissions
  } catch {}

  return (
    <div className="admin-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Programme apporteur d&apos;affaires</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
          Configuration, suivi des recrutements et règlement des commissions.
        </p>
      </div>
      <ApporteursClient
        initialSettings={settings as any}
        initialApporteurs={apporteurs}
        initialCommissions={commissions}
        secret={secret}
      />
    </div>
  )
}
