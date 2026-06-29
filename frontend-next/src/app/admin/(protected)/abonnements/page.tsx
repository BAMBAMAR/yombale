import { cookies } from 'next/headers'
import ActiverPlanClient from './ActiverPlanClient'
import AbonnementRowActions from './AbonnementRowActions'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

interface Abonnement {
  id: string
  plan: 'pro' | 'business'
  statut: 'actif' | 'expire' | 'annule'
  prix_mensuel: string
  debut: string
  fin: string
  commande_ref: string | null
  created_at: string
  utilisateur_nom: string
  utilisateur_email: string
  telephone: string | null
}

interface Stats {
  actifs: string
  pro_actifs: string
  business_actifs: string
  mrr: string
  expires: string
  nouveaux_ce_mois: string
}

function fcfa(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v
  return (n || 0).toLocaleString('fr-SN') + ' FCFA'
}

function dateF(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

export default async function AdminAbonnementsPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  if (!secret) return null

  let stats: Stats | null = null
  let abonnements: Abonnement[] = []

  try {
    const [sRes, aRes] = await Promise.all([
      fetch(`${BACKEND}/api/abonnements/admin/stats`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
      fetch(`${BACKEND}/api/abonnements/admin`,       { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
    ])
    if (sRes.ok) stats = await sRes.json()
    if (aRes.ok) abonnements = (await aRes.json()).abonnements ?? []
  } catch {}

  const badge = (plan: string) => plan === 'business'
    ? <span style={{ background: '#1e3a5f', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>BUSINESS</span>
    : <span style={{ background: '#C75B00', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>PRO</span>

  const statutColor = (s: string) => s === 'actif' ? '#16a34a' : s === 'annule' ? '#dc2626' : '#94a3b8'

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Abonnements</h1>

      <ActiverPlanClient />

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Abonnés actifs',  value: stats.actifs,           emoji: '🟢' },
            { label: 'Plan Pro',         value: stats.pro_actifs,       emoji: '🟠' },
            { label: 'Plan Business',    value: stats.business_actifs,  emoji: '🔵' },
            { label: 'MRR (estimé)',     value: fcfa(stats.mrr),        emoji: '💰' },
            { label: 'Expirés',          value: stats.expires,          emoji: '⚫' },
            { label: 'Ce mois',          value: stats.nouveaux_ce_mois, emoji: '📅' },
          ].map(({ label, value, emoji }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 22 }}>{emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 2px' }}>{value}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Utilisateur', 'Plan', 'Statut', 'Prix', 'Début', 'Fin', 'Réf. paiement', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {abonnements.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Aucun abonnement pour le moment</td></tr>
            )}
            {abonnements.map((a, i) => (
              <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600 }}>{a.utilisateur_nom}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{a.utilisateur_email}</div>
                  {a.telephone && <div style={{ color: '#94a3b8', fontSize: 11 }}>{a.telephone}</div>}
                </td>
                <td style={{ padding: '10px 14px' }}>{badge(a.plan)}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ color: statutColor(a.statut), fontWeight: 600 }}>{a.statut}</span>
                </td>
                <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{fcfa(a.prix_mensuel)}</td>
                <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#64748b' }}>{dateF(a.debut)}</td>
                <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: a.statut === 'actif' ? '#16a34a' : '#94a3b8', fontWeight: a.statut === 'actif' ? 600 : 400 }}>{dateF(a.fin)}</td>
                <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.commande_ref ?? '—'}</td>
                <AbonnementRowActions id={a.id} statut={a.statut} plan={a.plan} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
