import { cookies } from 'next/headers'
import ForceDeVenteClient from './ForceDeVenteClient'

export const metadata = { title: 'Force de Vente & Déploiement Terrain — Admin Nopalou' }

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminForceDeVentePage() {
  const jar = await cookies()
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

  const prixDecouverte = parseInt(settings.tarif_decouverte || '2500') || 2500
  const prixPro = parseInt(settings.tarif_pro || '5000') || 5000
  const prixBusiness = parseInt(settings.tarif_business || '10000') || 10000
  const tauxApporteur = parseInt(settings.apporteur_taux_commission || '20') || 20

  return (
    <div className="admin-content">
      <ForceDeVenteClient
        secret={secret}
        prixDecouverte={prixDecouverte}
        prixPro={prixPro}
        prixBusiness={prixBusiness}
        tauxApporteur={tauxApporteur}
      />
    </div>
  )
}
