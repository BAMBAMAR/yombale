import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'
import JsonLd from '@/components/JsonLd'
import { breadcrumbSchema } from '@/lib/schema-org'
import { TELECOM_LANDINGS } from './landing-data'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export function telecomLandingMetadata(slug: string): Metadata {
  const cfg = TELECOM_LANDINGS[slug]
  const canonical = `${BASE}/telecom/${slug}`
  return {
    title: cfg.titre,
    description: cfg.description,
    keywords: cfg.keywords,
    alternates: { canonical },
    openGraph: { title: `${cfg.h1} — Nopalou`, description: cfg.description, type: 'website', url: canonical },
  }
}

interface Forfait {
  id: string
  operateur: string
  nom: string
  type: string | null
  data_mo: number | null
  minutes: number | null
  sms: number | null
  validite_jours: number | null
  prix: number
}

function dataLabel(mo: number | null) {
  if (!mo) return '—'
  return mo >= 1000 ? `${(mo / 1000).toLocaleString('fr-FR')} Go` : `${mo} Mo`
}

export default async function OperateurLanding({ slug }: { slug: string }) {
  const cfg = TELECOM_LANDINGS[slug]

  let forfaits: Forfait[] = []
  try {
    const data = await apiFetch<{ forfaits?: Forfait[] }>(`/telecom?operateur=${cfg.operateur}&limit=60`)
    forfaits = (data.forfaits ?? []).sort((a, b) => Number(a.prix) - Number(b.prix))
  } catch { /* état vide */ }

  return (
    <>
      <JsonLd schema={breadcrumbSchema([
        { name: 'Accueil', url: '/' },
        { name: 'Télécom', url: '/telecom' },
        { name: cfg.label, url: `/telecom/${slug}` },
      ])} />

      <div className="page-container" style={{ paddingTop: '1.5rem' }}>
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          <Link href="/" style={{ color: 'var(--text2)' }}>Accueil</Link>
          {' › '}
          <Link href="/telecom" style={{ color: 'var(--text2)' }}>Télécom</Link>
          {' › '}
          <span style={{ color: 'var(--text1)' }}>{cfg.label}</span>
        </nav>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2, marginBottom: 10 }}>
            📡 {cfg.h1}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 720 }}>{cfg.intro}</p>
          {forfaits.length > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
              <strong style={{ color: 'var(--accent)' }}>{forfaits.length} forfaits</strong> comparés · source catalogue ARTP
            </p>
          )}
        </div>

        {forfaits.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 48 }}>📡</span>
            <p>Aucun forfait disponible pour l&apos;instant.</p>
            <Link href="/telecom" className="budget-pill active" style={{ marginTop: 8 }}>Voir tous les forfaits</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-forfaits" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '10px 8px' }}>Forfait</th>
                  <th style={{ padding: '10px 8px' }}>Data</th>
                  <th style={{ padding: '10px 8px' }}>Minutes</th>
                  <th style={{ padding: '10px 8px' }}>Validité</th>
                  <th style={{ padding: '10px 8px' }}>Prix</th>
                </tr>
              </thead>
              <tbody>
                {forfaits.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 8px' }}>
                      <Link href={`/telecom/${f.id}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>{f.nom}</Link>
                    </td>
                    <td style={{ padding: '10px 8px' }}>{dataLabel(f.data_mo)}</td>
                    <td style={{ padding: '10px 8px' }}>{f.minutes ?? '—'}</td>
                    <td style={{ padding: '10px 8px' }}>{f.validite_jours ? `${f.validite_jours} j` : '—'}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 700 }}>{fcfa(Number(f.prix))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/telecom" className="budget-pill">Comparer tous les opérateurs →</Link>
          {Object.entries(TELECOM_LANDINGS).filter(([s]) => s !== slug).map(([s, c]) => (
            <Link key={s} href={`/telecom/${s}`} className="budget-pill">{c.label}</Link>
          ))}
        </div>
      </div>
    </>
  )
}
