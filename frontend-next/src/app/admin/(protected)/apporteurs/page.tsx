import { cookies } from 'next/headers'
import ApporteursClient from './ApporteursClient'
import { BACKEND, adminHeaders } from '@/app/actions/admin'

export default async function AdminApporteursPage() {
  const jar   = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''
  if (!token) return null

  let settings: Record<string, string> = {}
  let apporteurs: any[] = []
  let commissions: any[] = []

  try {
    const headers = adminHeaders(token)
    const [settingsRes, apporteursRes, commissionsRes] = await Promise.all([
      fetch(`${BACKEND}/api/settings`, { headers, cache: 'no-store' }),
      fetch(`${BACKEND}/api/apporteurs/admin`, { headers, cache: 'no-store' }),
      fetch(`${BACKEND}/api/apporteurs/admin/commissions`, { headers, cache: 'no-store' }),
    ])
    if (settingsRes.ok) settings = await settingsRes.json()
    if (apporteursRes.ok) apporteurs = (await apporteursRes.json()).apporteurs
    if (commissionsRes.ok) commissions = (await commissionsRes.json()).commissions
  } catch (err) { console.warn('[Nopalou:page:L24]', err); }

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
