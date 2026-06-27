'use client'

import { useState } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'

const API = ''  // proxy Next.js

const BUDGETS_RAPIDES = [1000, 2000, 3000, 5000, 10000]

interface Forfait {
  id: string; nom: string; operateur: string; type: string; prix: number
  data_mo?: number | null; minutes?: number | null; sms?: number | null; validite_jours?: number | null
  description?: string
  _score?: number
}

const OP_COLORS: Record<string, string> = {
  Orange: '#FF7900', Free: '#CD1127', Expresso: '#00873F', Wave: '#00BCC9',
}

function formatData(mo: number | null | undefined): string {
  if (!mo) return '—'
  if (mo >= 1024) return `${(mo / 1024).toFixed(mo % 1024 === 0 ? 0 : 1)} Go`
  return `${mo} Mo`
}

function score(f: Forfait, profil: string): number {
  if (!f.prix || f.prix === 0) return 0
  if (profil === 'internet') return ((f.data_mo ?? 0) / f.prix) * 1000
  if (profil === 'appel')    return ((f.minutes === -1 ? 9999 : (f.minutes ?? 0)) / f.prix) * 100
  return (((f.data_mo ?? 0) / f.prix) * 600 + ((f.minutes === -1 ? 9999 : (f.minutes ?? 0)) / f.prix) * 40)
}

export default function GuideForfaitPage() {
  const [budget, setBudget]   = useState('')
  const [profil, setProfil]   = useState('internet')
  const [dataMin, setDataMin] = useState('')
  const [minMin, setMinMin]   = useState('')
  const [results, setResults] = useState<Forfait[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function lancer() {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (budget) params.set('prixMax', budget)
      const res  = await fetch(`${API}/api/telecom?${params}`)
      const data = await res.json()
      const liste: Forfait[] = (data.forfaits ?? data) as Forfait[]

      let filtre = liste
      if (dataMin) filtre = filtre.filter(f => (f.data_mo ?? 0) >= Number(dataMin) * 1024 / 1000)
      if (minMin)  filtre = filtre.filter(f => f.minutes === -1 || (f.minutes ?? 0) >= Number(minMin))

      const scored = filtre
        .map(f => ({ ...f, _score: score(f, profil) }))
        .sort((a, b) => (b._score ?? 0) - (a._score ?? 0))

      setResults(scored)
    } catch (e) {
      setError('Erreur réseau. Vérifiez que le serveur est démarré.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="guide-page">
      <div className="guide-topbar">
        <Link href="/telecom" className="guide-back-btn">← Forfaits</Link>
        <div>
          <div className="guide-topbar-titre" style={{ color: '#4c1d95' }}>🎯 Guide forfait télécom</div>
          <div className="guide-topbar-sub">Scoring personnalisé selon votre usage</div>
        </div>
      </div>

      <div className="guide-wrap">
        <div className="guide-left guide-left--navy">

          <div className="guide-section-label">💰 Budget mensuel max</div>
          <input
            className="guide-input"
            type="number" min={100} placeholder="ex: 3 000"
            value={budget} onChange={e => setBudget(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <div className="guide-pills-row">
            {BUDGETS_RAPIDES.map(v => (
              <button key={v} className="guide-quick-pill" onClick={() => setBudget(String(v))}>
                {v.toLocaleString('fr-FR')} F
              </button>
            ))}
          </div>

          <div className="guide-divider" />

          <div className="guide-section-label">Mon profil d&apos;usage</div>
          <div className="guide-profil-row">
            {[{ id: 'internet', label: '📶 Internet' }, { id: 'appel', label: '📞 Appels' }, { id: 'mixte', label: '🔀 Mixte' }].map(p => (
              <button
                key={p.id}
                className={`guide-profil-btn guide-profil-btn--sm${profil === p.id ? ' active' : ''}`}
                style={profil === p.id ? { borderColor: 'var(--accent)', background: 'var(--accent)' } : {}}
                onClick={() => setProfil(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="guide-divider" />

          <div className="guide-field">
            <label className="guide-label">Data minimum (Go) — optionnel</label>
            <input className="guide-input" type="number" min={0} placeholder="ex: 2" value={dataMin} onChange={e => setDataMin(e.target.value)} />
          </div>
          <div className="guide-field">
            <label className="guide-label">Minutes minimum — optionnel</label>
            <input className="guide-input" type="number" min={0} placeholder="ex: 60" value={minMin} onChange={e => setMinMin(e.target.value)} />
          </div>

          <div style={{ flex: 1, minHeight: 16 }} />

          <button className="guide-lancer-btn" onClick={lancer} disabled={loading}>
            {loading ? '⏳ Analyse…' : '🎯 Trouver le meilleur forfait'}
          </button>
        </div>

        <div className="guide-right">
          {loading && <div className="guide-empty"><div className="guide-spinner" /><p>Calcul du scoring…</p></div>}

          {!loading && !results.length && !error && (
            <div className="guide-empty">
              <div style={{ fontSize: 52, opacity: .2, marginBottom: 16 }}>📡</div>
              <div className="guide-empty-titre">Configurez votre profil</div>
              <div className="guide-empty-sub">Renseignez votre budget et votre profil d&apos;usage,<br />puis cliquez <strong>Trouver</strong>.</div>
            </div>
          )}

          {!loading && error && <div className="guide-empty" style={{ color: 'var(--red)' }}>{error}</div>}

          {!loading && results.length > 0 && (
            <>
              <div className="guide-results-header">
                <span className="guide-results-count">{results.length} forfait{results.length > 1 ? 's' : ''} · classés par score {profil}</span>
              </div>
              <div className="guide-forfaits-grid">
                {results.map((f, idx) => {
                  const color = OP_COLORS[f.operateur] ?? '#1C2B4A'
                  return (
                    <Link href={`/telecom/${f.id}`} key={f.id} className="guide-forfait-card">
                      {idx === 0 && <div className="guide-result-badge">🏆 Meilleur rapport qualité/prix</div>}
                      <div className="guide-forfait-header" style={{ borderLeft: `4px solid ${color}` }}>
                        <span style={{ fontWeight: 700, color }}>{f.operateur}</span>
                        <span className="guide-forfait-prix">{fcfa(f.prix)}</span>
                      </div>
                      <p className="guide-forfait-nom">{f.nom}</p>
                      <div className="guide-forfait-specs">
                        {f.data_mo != null && <span>📶 {formatData(f.data_mo)}</span>}
                        {f.minutes != null && <span>📞 {f.minutes === -1 ? '∞ min' : `${f.minutes} min`}</span>}
                        {f.validite_jours != null && <span>📅 {f.validite_jours}j</span>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
