import { cookies } from 'next/headers'
import ForceDeVenteClient from './ForceDeVenteClient'
import { BACKEND, adminHeaders } from '@/app/actions/admin'

export const metadata = { title: 'Force de Vente & Déploiement Terrain — Admin Nopalou' }

export default async function AdminForceDeVentePage() {
  const jar = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''
  if (!token) return null

  let settings: Record<string, string> = {}
  try {
    const r = await fetch(`${BACKEND}/api/settings`, {
      headers: adminHeaders(token),
      cache: 'no-store',
    })
    if (r.ok) settings = await r.json()
  } catch (err) { console.warn('[Nopalou:page:L20]', err); }

  const prixDecouverte = parseInt(settings.tarif_decouverte || '2500') || 2500
  const prixPro = parseInt(settings.tarif_pro || '5000') || 5000
  const prixBusiness = parseInt(settings.tarif_business || '10000') || 10000
  const tauxApporteur = parseInt(settings.apporteur_taux_commission || '20') || 20

  return (
    <div className="admin-content">
      <ForceDeVenteClient
        secret={token}
        prixDecouverte={prixDecouverte}
        prixPro={prixPro}
        prixBusiness={prixBusiness}
        tauxApporteur={tauxApporteur}
      />
    </div>
  )
}
