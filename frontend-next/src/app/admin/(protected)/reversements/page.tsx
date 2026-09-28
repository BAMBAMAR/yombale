import { cookies } from 'next/headers'
import ReversementsClient from './ReversementsClient'
import { BACKEND, extractAdminToken, adminHeaders } from '@/app/actions/admin'
import { ArrowDownLeft } from 'lucide-react'

export const metadata = { title: 'Reversements Marchands Wave 1-Clic — Admin Nopalou' }

export default async function AdminReversementsPage() {
  const jar   = await cookies()
  const token = extractAdminToken(jar) || ''

  let reversements: any[] = []
  try {
    const res = await fetch(`${BACKEND}/api/comptabilite/admin/reversements-dus`, {
      headers: adminHeaders(token),
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      reversements = data.reversements || []
    }
  } catch (err) {
    console.warn('[REVERSEMENTS_PAGE_ERR]', err)
  }

  return (
    <div className="admin-content" style={{ padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ArrowDownLeft size={24} color="#1d4ed8" />
          <span>Reversements Marchands Wave 1-Clic</span>
        </h1>
        <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
          Commandes de boutiques livrées ou payées via Wave. Transférez instantanément les fonds nets aux commerçants en 1 clic via l&apos;API Wave Payout.
        </p>
      </div>
      <ReversementsClient initialReversements={reversements} />
    </div>
  )
}

