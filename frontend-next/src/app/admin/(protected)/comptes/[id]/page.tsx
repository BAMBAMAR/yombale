import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ActionsCompteClient from './ActionsCompteClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

interface DetailResponse {
  utilisateur: {
    id: string
    nom: string
    email: string
    telephone: string | null
    ville: string | null
    email_verifie: boolean
    suspendu: boolean
    supprime_le: string | null
    anonymise_le: string | null
    est_apporteur: boolean
    code_apporteur: string | null
    created_at: string
  }
  activite: {
    nb_annonces: number
    nb_immo: number
    a_boutique: boolean
    est_apporteur: boolean
  }
  abonnement: { plan: string; fin: string } | null
}

function dateF(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

export default async function AdminCompteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  if (!secret) return null

  const { id } = await params

  let data: DetailResponse | null = null
  try {
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) data = await res.json()
  } catch {}

  if (!data) return notFound()

  const { utilisateur: u, activite, abonnement } = data

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <a href="/admin/comptes" style={{ fontSize: 13, color: '#1d4ed8', textDecoration: 'none' }}>← Retour à la liste</a>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 4px' }}>{u.nom}</h1>
      <p style={{ color: '#64748b', marginBottom: 4 }}>{u.email}</p>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>{u.telephone ?? 'Pas de téléphone'} · {u.ville ?? 'Dakar'} · Inscrit le {dateF(u.created_at)}</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {u.email_verifie
          ? <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '4px 10px', borderRadius: 6 }}>✓ Email vérifié</span>
          : <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '4px 10px', borderRadius: 6 }}>Email non vérifié</span>}
        {u.suspendu && <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '4px 10px', borderRadius: 6 }}>🚫 Suspendu</span>}
        {u.supprime_le && !u.anonymise_le && <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '4px 10px', borderRadius: 6 }}>⏳ En suppression depuis le {dateF(u.supprime_le)}</span>}
        {u.anonymise_le && <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', background: '#f9fafb', padding: '4px 10px', borderRadius: 6 }}>Purgé le {dateF(u.anonymise_le)}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Résumé d&apos;activité</h2>
          <p style={{ fontSize: 13, color: '#374151', margin: '4px 0' }}>📋 {activite.nb_annonces} annonce(s) classifiée(s)</p>
          <p style={{ fontSize: 13, color: '#374151', margin: '4px 0' }}>🏠 {activite.nb_immo} bien(s) immo</p>
          <p style={{ fontSize: 13, color: '#374151', margin: '4px 0' }}>🏪 {activite.a_boutique ? 'A une boutique' : 'Pas de boutique'}</p>
          <p style={{ fontSize: 13, color: '#374151', margin: '4px 0' }}>💼 {activite.est_apporteur ? `Apporteur (${u.code_apporteur})` : 'Pas apporteur'}</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Abonnement</h2>
          {abonnement
            ? <p style={{ fontSize: 13, color: '#374151' }}>Plan <strong>{abonnement.plan.toUpperCase()}</strong> actif jusqu&apos;au {dateF(abonnement.fin)}</p>
            : <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun abonnement actif</p>}
        </div>
      </div>

      <ActionsCompteClient
        id={u.id}
        emailVerifie={u.email_verifie}
        suspendu={u.suspendu}
        supprimeLe={u.supprime_le}
        anonymiseLe={u.anonymise_le}
      />
    </div>
  )
}
