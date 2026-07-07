import { cookies } from 'next/headers'
import PaiementsManuelsClient from './PaiementsManuelsClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminPaiementsManuelsPage() {
  const jar    = await cookies()
  const secret = jar.get('nopalou_admin')?.value ?? ''
  if (!secret) return null

  let paiements: any[] = []
  try {
    const res = await fetch(`${BACKEND}/api/paiement/manuel/liste?statut=en_attente`, {
      headers: { 'X-Admin-Secret': secret }, cache: 'no-store',
    })
    if (res.ok) paiements = (await res.json()).paiements
  } catch {}

  return (
    <div className="admin-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Paiements manuels</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
          Déclarations de dépôt Wave/Orange en attente de vérification.
        </p>
      </div>
      <PaiementsManuelsClient initialPaiements={paiements} secret={secret} />
    </div>
  )
}
