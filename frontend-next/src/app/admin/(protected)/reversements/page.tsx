import { cookies } from 'next/headers'
import ReversementsClient from './ReversementsClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminReversementsPage() {
  const jar    = await cookies()
  const secret = jar.get('nopalou_admin')?.value ?? ''
  if (!secret) return null

  let reversements: any[] = []
  try {
    const res = await fetch(`${BACKEND}/api/comptabilite/admin/reversements-dus`, {
      headers: { 'X-Admin-Secret': secret }, cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      reversements = data.reversements || []
    }
  } catch {}

  return (
    <div className="admin-content" style={{ padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💸</span> Reversements Marchands Wave 1-Clic
        </h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
          Commandes de boutiques livrées payées par Wave. Cliquez sur un bouton pour transférer les fonds au marchand en 1 clic via Wave Payout API.
        </p>
      </div>
      <ReversementsClient initialReversements={reversements} />
    </div>
  )
}
