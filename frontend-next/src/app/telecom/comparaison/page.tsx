import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Comparaison forfaits télécom',
}

interface Forfait {
  id: string
  operateur: string
  nom: string
  type: string
  data_mo: number | null
  minutes: number | null
  sms: number | null
  validite_jours: number | null
  prix: number
  description: string | null
}

const OP_COLORS: Record<string, string> = {
  Orange: '#FF7900', Free: '#CD1127', Expresso: '#00873F', Wave: '#00BCC9',
}

function formatData(mo: number | null): string {
  if (!mo) return '—'
  if (mo >= 1024) return `${(mo / 1024).toFixed(mo % 1024 === 0 ? 0 : 1)} Go`
  return `${mo} Mo`
}

function prixParGo(f: Forfait): string {
  if (!f.data_mo || f.data_mo === 0) return '—'
  const goPrice = (f.prix / f.data_mo) * 1024
  return fcfa(Math.round(goPrice)) + '/Go'
}

function prixParMin(f: Forfait): string {
  if (!f.minutes || f.minutes === 0 || f.minutes === -1) return f.minutes === -1 ? 'Illimité' : '—'
  return fcfa(Math.round(f.prix / f.minutes)) + '/min'
}

function prixParJour(f: Forfait): string {
  if (!f.validite_jours) return '—'
  return fcfa(Math.round(f.prix / f.validite_jours)) + '/j'
}

function scoreMixte(f: Forfait): number {
  if (!f.prix) return 0
  const data = f.data_mo ?? 0
  const mins = f.minutes === -1 ? 2000 : (f.minutes ?? 0)
  return ((data / f.prix) * 600 + (mins / f.prix) * 70)
}

export default async function TelecomComparaisonPage({
  searchParams,
}: {
  searchParams: { ids?: string }
}) {
  const ids = (searchParams.ids ?? '')
    .split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)

  if (ids.length < 2) {
    return (
      <div className="page-container" style={{ paddingTop: '3rem' }}>
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📡</span>
          <p>Sélectionnez au moins 2 forfaits à comparer depuis la liste.</p>
          <Link href="/telecom" className="budget-pill active" style={{ marginTop: 8 }}>
            Parcourir les forfaits
          </Link>
        </div>
      </div>
    )
  }

  const items = (
    await Promise.all(
      ids.map(async id => {
        try { return await apiFetch<Forfait>(`/telecom/${id}`) }
        catch { return null }
      })
    )
  ).filter((x): x is Forfait => x !== null)

  if (items.length < 2) {
    return (
      <div className="page-container" style={{ paddingTop: '3rem' }}>
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📡</span>
          <p>Impossible de charger les forfaits demandés.</p>
          <Link href="/telecom" className="budget-pill active" style={{ marginTop: 8 }}>Retour</Link>
        </div>
      </div>
    )
  }

  const bestIdx = items.reduce((best, f, i) =>
    scoreMixte(f) > scoreMixte(items[best]) ? i : best, 0)

  const rows = [
    { label: 'Prix',          render: (f: Forfait) => <strong>{fcfa(f.prix)}</strong> },
    { label: 'Data',          render: (f: Forfait) => formatData(f.data_mo) },
    { label: 'Appels',        render: (f: Forfait) => f.minutes === -1 ? '∞ Illimité' : f.minutes ? `${f.minutes} min` : '—' },
    { label: 'SMS',           render: (f: Forfait) => f.sms === -1 ? '∞ Illimité' : f.sms ? String(f.sms) : '—' },
    { label: 'Validité',      render: (f: Forfait) => f.validite_jours ? `${f.validite_jours} jours` : '—' },
    { label: 'Prix / Go',     render: (f: Forfait) => prixParGo(f) },
    { label: 'Prix / min',    render: (f: Forfait) => prixParMin(f) },
    { label: 'Prix / jour',   render: (f: Forfait) => prixParJour(f) },
    { label: 'Type',          render: (f: Forfait) => f.type },
  ]

  const verdicts = [
    { label: 'Meilleur rapport', idx: bestIdx },
    { label: 'Moins cher', idx: items.reduce((b, f, i) => f.prix < items[b].prix ? i : b, 0) },
    { label: 'Plus de data', idx: items.reduce((b, f, i) => (f.data_mo ?? 0) > (items[b].data_mo ?? 0) ? i : b, 0) },
  ]

  return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      <h1 className="comp-titre">Comparaison forfaits télécom</h1>
      <p className="comp-sous-titre">Comparez data, appels et prix au Sénégal.</p>

      <div className="comp-table-wrap">
        <table className="comp-table">
          <thead>
            <tr>
              <th className="comp-th-label"></th>
              {items.map((f, i) => {
                const color = OP_COLORS[f.operateur] ?? '#1C2B4A'
                return (
                  <th key={f.id} className={`comp-th${i === bestIdx ? ' comp-th--best' : ''}`}>
                    {i === bestIdx && <div className="comp-best-badge">🏆 Meilleur rapport</div>}
                    <div className="comp-prod-img">
                      <span style={{ fontSize: 36 }}>📡</span>
                    </div>
                    <Link href={`/telecom/${f.id}`} className="comp-prod-nom">{f.nom}</Link>
                    <span className="comp-prod-marque" style={{ color }}>{f.operateur}</span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri === 0 ? 'comp-tr-section' : ''}>
                <td className="comp-td-label">{row.label}</td>
                {items.map((f, i) => (
                  <td key={f.id} className={`comp-td${i === bestIdx && ri === 0 ? ' comp-td--best' : ''}`}>
                    {ri === 0 && i === bestIdx
                      ? <span className="comp-prix comp-prix--best">{row.render(f)}</span>
                      : row.render(f)
                    }
                  </td>
                ))}
              </tr>
            ))}

            {/* Verdicts */}
            <tr className="comp-tr-section">
              <td className="comp-td-label">Verdicts</td>
              {items.map((f, i) => {
                const wins = verdicts.filter(v => v.idx === i)
                return (
                  <td key={f.id} className="comp-td">
                    {wins.length > 0
                      ? wins.map(v => <div key={v.label} className="comp-verdict-badge">{v.label}</div>)
                      : '—'
                    }
                  </td>
                )
              })}
            </tr>

            <tr>
              <td className="comp-td-label"></td>
              {items.map(f => (
                <td key={f.id} className="comp-td">
                  <Link href={`/telecom/${f.id}`} className="comp-fiche-btn">Voir le forfait →</Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link href="/telecom" className="budget-pill">← Retour aux forfaits</Link>
      </div>
    </div>
  )
}
