import { cookies } from 'next/headers'
import Link from 'next/link'
import { Building2, Home, FileSpreadsheet, AlertTriangle, ArrowRight } from 'lucide-react'
import { fcfa } from '@/lib/format'
import AdminImmoClient from './AdminImmoClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export const metadata = { title: 'Immobilier Control Center | Nopalou Admin' }

async function fetchJson(url: string, headers: Record<string, string>) {
  try {
    const r = await fetch(url, { headers, cache: 'no-store', signal: AbortSignal.timeout(3000) })
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}

export default async function AdminImmoPage() {
  const jar = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${token}`
    headers['Cookie'] = `nopalou_admin_jwt=${token}`
  } else {
    headers['X-Admin-Secret'] = token
  }

  const [statsData, annoncesData, sponsoringData] = await Promise.all([
    fetchJson(`${BACKEND}/api/admin/immo-global/stats`, headers),
    fetchJson(`${BACKEND}/api/immo/admin/en-attente`, headers),
    fetchJson(`${BACKEND}/api/immo/admin/demandes-sponsorisation`, headers),
  ])

  const stats = statsData?.stats || {}
  const agencesStats = stats.agences || {}
  const biensStats = stats.biens || {}
  const bauxStats = stats.baux || {}
  const loyersStats = stats.loyers || {}

  const annonces = annoncesData?.annonces ?? annoncesData ?? []
  const demandesSponsoring = sponsoringData?.annonces ?? sponsoringData ?? []

  return (
    <div className="admin-content">
      {/* En-tête Métier */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-page-titre" style={{ marginBottom: 6 }}>
          Pôle Immobilier & Gestion Locative
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
          Supervision consolidée du réseau d&apos;agences, du patrimoine immobilier, des baux et des annonces.
        </p>
      </div>

      {/* Cartes KPI Globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' }}>Agences Partenaires</span>
            <Building2 size={16} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '8px 0 4px' }}>
            {agencesStats.total_agences || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            {agencesStats.agences_actives || 0} actives et vérifiées
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' }}>Biens Référencés</span>
            <Home size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '8px 0 4px' }}>
            {biensStats.total_biens || 0}
          </div>
          <div style={{ fontSize: 12, color: '#10b981' }}>
            {biensStats.biens_disponibles || 0} disponibles sur le marché
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' }}>Loyers Sous Gestion</span>
            <FileSpreadsheet size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '8px 0 4px' }}>
            {fcfa(bauxStats.volume_loyers_mensuels || 0)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            {bauxStats.baux_actifs || 0} baux locatifs actifs
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' }}>Loyers en Souffrance</span>
            <AlertTriangle size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: loyersStats.impayes_count > 0 ? '#ef4444' : 'var(--navy)', margin: '8px 0 4px' }}>
            {loyersStats.impayes_count || 0}
          </div>
          <div style={{ fontSize: 12, color: '#ef4444' }}>
            Montant : {fcfa(loyersStats.impayes_montant || 0)}
          </div>
        </div>
      </div>

      {/* Raccourcis Modules Métier */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
        <Link
          href="/admin/immo/agences"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderRadius: 10,
            background: '#ffffff',
            border: '1px solid var(--border)',
            textDecoration: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Agences Immobilières</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Annuaire des pros, mandats & conformité</div>
            </div>
          </div>
          <ArrowRight size={16} color="var(--text3)" />
        </Link>

        <Link
          href="/admin/immo/biens"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderRadius: 10,
            background: '#ffffff',
            border: '1px solid var(--border)',
            textDecoration: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Home size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Parc Biens & Baux</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Inventaire des logements, loyers & ventes</div>
            </div>
          </div>
          <ArrowRight size={16} color="var(--text3)" />
        </Link>
      </div>

      {/* Modération des Annonces Immo */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
        Modération des Annonces Publiques en Attente
      </h2>
      <AdminImmoClient
        annonces={annonces}
        demandesSponsoring={demandesSponsoring}
      />
    </div>
  )
}
