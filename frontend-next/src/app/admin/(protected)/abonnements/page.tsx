import { cookies } from 'next/headers'
import ActiverPlanClient from './ActiverPlanClient'
import AbonnementsTableClient, { Abonnement } from './AbonnementsTableClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

interface Stats {
  actifs: string
  pro_actifs: string
  business_actifs: string
  decouverte_actifs?: string
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
  let prixPro = 5000
  let prixBusiness = 10000

  try {
    const [sRes, aRes, settingsRes] = await Promise.all([
      fetch(`${BACKEND}/api/abonnements/admin/stats`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
      fetch(`${BACKEND}/api/abonnements/admin`,       { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
      fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' }),
    ])
    if (sRes.ok) stats = await sRes.json()
    if (aRes.ok) abonnements = (await aRes.json()).abonnements ?? []
    if (settingsRes.ok) {
      const s = await settingsRes.json()
      prixPro = Number(s.plan_pro_prix) || 5000
      prixBusiness = Number(s.plan_business_prix) || 10000
    }
  } catch {}

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Abonnements</h1>

      <ActiverPlanClient prixPro={prixPro} prixBusiness={prixBusiness} />

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Abonnés actifs',  value: stats.actifs,           emoji: '🟢' },
            { label: 'Plan Pro',         value: stats.pro_actifs,       emoji: '🟠' },
            { label: 'Plan Business',    value: stats.business_actifs,  emoji: '👑' },
            ...(Number(stats.decouverte_actifs) > 0 ? [{ label: 'Plan Taf Taf', value: stats.decouverte_actifs!, emoji: '⚡' }] : []),
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

      <AbonnementsTableClient abonnements={abonnements} />
    </div>
  )
}

