import { cookies } from 'next/headers'
import ActiverPlanClient from './ActiverPlanClient'
import AbonnementsTableClient, { Abonnement } from './AbonnementsTableClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

interface Stats {
  actifs: string
  payants: string
  trials: string
  pro_actifs: string
  pro_payants: string
  business_actifs: string
  business_payants: string
  decouverte_actifs?: string
  mrr: string
  mrr_potentiel: string
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
  } catch (err) { console.warn('[Nopalou:page:L50]', err); }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Abonnements</h1>

      <ActiverPlanClient prixPro={prixPro} prixBusiness={prixBusiness} />

      {/* Stats */}
      {stats && (
        <div style={{ marginBottom: 32 }}>
          {/* Ligne 1 : MRR réel et pipeline */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div style={{ background: '#fff', border: '2px solid #16a34a', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 4 }}>MRR Réel</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{fcfa(stats.mrr)}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{stats.payants} payant(s)</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>MRR Potentiel</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#94a3b8' }}>{fcfa(stats.mrr_potentiel)}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>si tous les trials payaient</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Actifs total</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{stats.actifs}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{stats.payants} payants</span>
                <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 7px', borderRadius: 4, fontSize: 11 }}>{stats.trials} essais</span>
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Expirés</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>{stats.expires}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Nouveaux ce mois</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7' }}>{stats.nouveaux_ce_mois}</div>
            </div>
          </div>
          {/* Ligne 2 : détail par plan */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ background: '#f3e8ff', borderRadius: 10, padding: '12px 18px', flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase' }}>Business VIP</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#7e22ce', margin: '4px 0 2px' }}>
                {stats.business_payants}<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>/{stats.business_actifs}</span>
              </div>
              <div style={{ fontSize: 11, color: '#7e22ce', opacity: 0.7 }}>payants / total</div>
            </div>
            <div style={{ background: '#fef3c7', borderRadius: 10, padding: '12px 18px', flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Pro</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#b45309', margin: '4px 0 2px' }}>
                {stats.pro_payants}<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>/{stats.pro_actifs}</span>
              </div>
              <div style={{ fontSize: 11, color: '#b45309', opacity: 0.7 }}>payants / total</div>
            </div>
            {Number(stats.decouverte_actifs) > 0 && (
              <div style={{ background: '#dcfce7', borderRadius: 10, padding: '12px 18px', flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Taf Taf</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d', margin: '4px 0 2px' }}>
                  {stats.decouverte_actifs}
                </div>
                <div style={{ fontSize: 11, color: '#15803d', opacity: 0.7 }}>actifs (tous trials)</div>
              </div>
            )}
          </div>
        </div>
      )}

      <AbonnementsTableClient abonnements={abonnements} />
    </div>
  )
}

