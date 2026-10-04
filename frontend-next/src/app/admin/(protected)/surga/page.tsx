import { cookies } from 'next/headers'
import { Sparkles, UtensilsCrossed, GraduationCap, Newspaper, Navigation } from 'lucide-react'
import AdminSurgaClient from './AdminSurgaClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export const metadata = {
  title: 'Surga Control Center | Nopalou Admin',
  description: 'Administration centralisée des contenus, concours, adresses et trafic Surga.',
}

async function fetchJson(url: string, headers: Record<string, string>) {
  try {
    const r = await fetch(url, { headers, cache: 'no-store', signal: AbortSignal.timeout(3000) })
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}

export default async function AdminSurgaPage() {
  const jar = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${token}`
    headers['Cookie'] = `nopalou_admin_jwt=${token}`
  } else {
    headers['X-Admin-Secret'] = token
  }

  const statsData = await fetchJson(`${BACKEND}/api/admin/surga/stats`, headers)

  return (
    <div className="admin-content" style={{ padding: '24px 30px', maxWidth: 1200, margin: '0 auto' }}>
      {/* En-tête Métier au standard Nopalou */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(199, 91, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent, #C75B00)',
            }}
          >
            <Sparkles size={18} />
          </div>
          <h1 className="admin-page-titre" style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Surga Control Center &amp; Contenus Dynamiques
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', margin: 0 }}>
          Pilotage centralisé et modération en direct : bonnes adresses dakaroises, concours nationaux, Kiosque des Unes et signalements trafic citoyens.
        </p>
      </div>

      {/* Interface client interactive et modulaire */}
      <AdminSurgaClient initialStats={statsData?.stats} />
    </div>
  )
}
