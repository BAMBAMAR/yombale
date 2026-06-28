import { cookies } from 'next/headers'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

interface StatsMarchand {
  marchand: string
  clics: string
  clics_ce_mois: string
  clics_7j: string
}

interface StatsJour {
  jour: string
  clics: string
}

interface Total {
  total: string
  ce_mois: string
  cette_semaine: string
}

export default async function AdminAffiliationPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  if (!secret) return null

  let total: Total | null = null
  let parMarchand: StatsMarchand[] = []
  let parJour: StatsJour[] = []

  try {
    const res = await fetch(`${BACKEND}/api/click/stats/admin`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      total       = data.total
      parMarchand = data.par_marchand ?? []
      parJour     = data.par_jour ?? []
    }
  } catch {}

  const n = (v: string | number) => Number(v).toLocaleString('fr-FR')

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Affiliation & Clics marchands</h1>

      {/* Stats globales */}
      {total && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Clics total',       value: n(total.total),         emoji: '🖱' },
            { label: 'Ce mois-ci',        value: n(total.ce_mois),       emoji: '📅' },
            { label: 'Cette semaine',     value: n(total.cette_semaine), emoji: '📈' },
          ].map(({ label, value, emoji }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 24 }}>{emoji}</div>
              <div style={{ fontSize: 28, fontWeight: 700, margin: '4px 0 2px' }}>{value}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Par marchand */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>Clics par marchand</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Marchand', 'Total', '30j', '7j'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: '#374151', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parMarchand.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Pas encore de clics trackés</td></tr>
              )}
              {parMarchand.map((m, i) => (
                <tr key={m.marchand} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '8px 14px', fontWeight: 600 }}>{m.marchand}</td>
                  <td style={{ padding: '8px 14px' }}>{n(m.clics)}</td>
                  <td style={{ padding: '8px 14px', color: '#C75B00' }}>{n(m.clics_ce_mois)}</td>
                  <td style={{ padding: '8px 14px', color: '#64748b' }}>{n(m.clics_7j)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Par jour (30 derniers) */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>Clics par jour (30 derniers)</div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                  {['Date', 'Clics'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: '#374151', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parJour.length === 0 && (
                  <tr><td colSpan={2} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Aucune donnée</td></tr>
                )}
                {parJour.map((j) => (
                  <tr key={j.jour} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 14px', color: '#64748b' }}>{new Date(j.jour).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding: '7px 14px', fontWeight: 600 }}>{n(j.clics)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 13, color: '#94a3b8' }}>
        Chaque clic sur &quot;Voir l&apos;offre&quot; ou &quot;Acheter&quot; depuis une page produit est tracké ici. Utilisez ces données pour négocier des commissions avec Jumia, Expat-Dakar et CoinAfrique.
      </p>
    </div>
  )
}
