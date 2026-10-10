// frontend-next/src/app/admin/(protected)/seo/page.tsx
// Cockpit d'Administration et de Pilotage SEO Nopalou

import { cookies } from 'next/headers'
import { Search } from 'lucide-react'
import SeoCockpitClient from './components/SeoCockpitClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = {
  title: 'SEO Center & Cockpit de Pilotage Organique — Console Admin Nopalou',
}

async function fetchSeoStats(secret: string) {
  const headers = { 'X-Admin-Secret': secret }
  const opts    = { headers, cache: 'no-store' as RequestCache }

  const [produitsRes, immoRes, annoncesRes] = await Promise.allSettled([
    fetch(`${BACKEND}/api/produits?limit=1`, opts),
    fetch(`${BACKEND}/api/immo?limit=1`, opts),
    fetch(`${BACKEND}/api/annonces?limit=1`, opts),
  ])

  let produits = 0, immo = 0, annonces = 0
  if (produitsRes.status === 'fulfilled' && produitsRes.value.ok) {
    const d = await produitsRes.value.json()
    produits = d.total ?? 0
  }
  if (immoRes.status === 'fulfilled' && immoRes.value.ok) {
    const d = await immoRes.value.json()
    immo = d.total ?? (d.annonces?.length ?? 0)
  }
  if (annoncesRes.status === 'fulfilled' && annoncesRes.value.ok) {
    const d = await annoncesRes.value.json()
    annonces = d.total ?? (d.annonces?.length ?? 0)
  }

  return { produits, immo, annonces }
}

export default async function AdminSeoPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  if (!secret) return null

  const stats = await fetchSeoStats(secret)

  return (
    <div className="admin-content">
      {/* En-tête officiel de la page */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="admin-page-titre" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={22} style={{ color: 'var(--navy, #1C2B4A)' }} />
            SEO Center & Cockpit de Pilotage Organique
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Supervision du positionnement organique Nopalou : 1 000 Groupes de Requêtes, Silos B2B, Villes du Sénégal et Conversions SaaS.
          </p>
        </div>
      </div>

      {/* Cockpit interactif modulaire */}
      <SeoCockpitClient stats={stats} />
    </div>
  )
}
