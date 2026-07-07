'use client'

import { useState } from 'react'
import { fcfa } from '@/lib/format'

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

interface Props {
  onClose: () => void
  operateurs: string[]
}

const PROFILS = [
  { val: 'internet', label: '📶 Internet', desc: 'Réseaux sociaux, streaming, navigation' },
  { val: 'appels',  label: '📞 Appels',   desc: 'Appels nationaux, familiaux' },
  { val: 'mixte',   label: '⚡ Mixte',    desc: 'Internet + appels équilibrés' },
]

const OP_COLORS: Record<string, string> = {
  Orange: '#FF7900', Free: '#CD1127', Expresso: '#00873F', Wave: '#00BCC9',
}

function formatData(mo: number | null): string {
  if (!mo) return '—'
  if (mo >= 1024) return `${(mo / 1024).toFixed(mo % 1024 === 0 ? 0 : 1)} Go`
  return `${mo} Mo`
}

function scoreForfait(f: Forfait, profil: string): number {
  if (!f.prix || f.prix === 0) return 0
  const data = f.data_mo ?? 0
  const mins = f.minutes === -1 ? 2000 : (f.minutes ?? 0)
  if (profil === 'internet') return (data / f.prix) * 1000
  if (profil === 'appels')   return (mins / f.prix) * 100
  return ((data / f.prix) * 600 + (mins / f.prix) * 70)
}

export default function WizardForfait({ onClose, operateurs }: Props) {
  const [step, setStep]       = useState<1 | 2>(1)
  const [budget, setBudget]   = useState(3000)
  const [profil, setProfil]   = useState('internet')
  const [validite, setValidite] = useState<string>('')
  const [operateur, setOperateur] = useState<string>('')
  const [results, setResults] = useState<Forfait[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSearch() {
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ limit: '100', prixMax: String(budget) })
      if (profil === 'internet') qs.set('type', 'internet')
      else if (profil === 'appels') qs.set('type', 'voix')
      if (operateur) qs.set('operateur', operateur)

      const r = await fetch(`/api/telecom?${qs}`)
      const data = await r.json()
      let forfaits: Forfait[] = data.forfaits ?? []

      // Filtre validité côté client
      if (validite === '1') forfaits = forfaits.filter(f => f.validite_jours != null && f.validite_jours <= 1)
      else if (validite === '7') forfaits = forfaits.filter(f => f.validite_jours != null && f.validite_jours >= 2 && f.validite_jours <= 7)
      else if (validite === '30') forfaits = forfaits.filter(f => f.validite_jours != null && f.validite_jours >= 8 && f.validite_jours <= 31)

      const sorted = [...forfaits].sort((a, b) => scoreForfait(b, profil) - scoreForfait(a, profil))
      setResults(sorted.slice(0, 8))
      setStep(2)
    } catch {
      setError('Impossible de charger les forfaits. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="wizard-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="wizard-panel">
        <button className="wizard-close" onClick={onClose} aria-label="Fermer">✕</button>

        {step === 1 ? (
          <>
            <h2 className="wizard-titre">🎯 Trouver mon forfait</h2>
            <p className="wizard-sous-titre">Répondez à 2 questions pour voir les meilleures offres pour vous.</p>

            {/* Budget */}
            <div className="wizard-section">
              <label className="wizard-label">Mon budget mensuel</label>
              <div className="wizard-budget-display">{fcfa(budget)}</div>
              <input
                type="range"
                min={200}
                max={30000}
                step={100}
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="wizard-slider"
              />
              <div className="wizard-budget-ticks">
                <span>200 FCFA</span>
                <span>15 000</span>
                <span>30 000 FCFA</span>
              </div>
            </div>

            {/* Profil */}
            <div className="wizard-section">
              <label className="wizard-label">Mon usage principal</label>
              <div className="wizard-profils">
                {PROFILS.map(p => (
                  <button
                    key={p.val}
                    className={`wizard-profil-btn${profil === p.val ? ' wizard-profil-btn--active' : ''}`}
                    onClick={() => setProfil(p.val)}
                  >
                    <span className="wizard-profil-icon">{p.label.split(' ')[0]}</span>
                    <span className="wizard-profil-name">{p.label.split(' ').slice(1).join(' ')}</span>
                    <span className="wizard-profil-desc">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Durée de validité */}
            <div className="wizard-section">
              <label className="wizard-label">Durée de validité</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { val: '',   label: '📆 Peu importe' },
                  { val: '1',  label: '1 jour' },
                  { val: '7',  label: '7 jours' },
                  { val: '30', label: '30 jours' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setValidite(opt.val)}
                    className={`budget-pill${validite === opt.val ? ' active' : ''}`}
                    style={{ fontSize: 13 }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opérateur */}
            <div className="wizard-section">
              <label className="wizard-label">Opérateur préféré</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setOperateur('')}
                  className={`budget-pill${operateur === '' ? ' active' : ''}`}
                  style={{ fontSize: 13 }}
                >
                  📡 Peu importe
                </button>
                {operateurs.map(op => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setOperateur(op)}
                    className={`budget-pill${operateur === op ? ' active' : ''}`}
                    style={{ fontSize: 13, ...(operateur === op ? { background: OP_COLORS[op] ?? 'var(--accent)', borderColor: OP_COLORS[op] ?? 'var(--accent)' } : {}) }}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="wizard-error">{error}</p>}

            <button
              className="wizard-cta"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? 'Recherche en cours…' : '→ Voir les meilleurs forfaits'}
            </button>
          </>
        ) : (
          <>
            <div className="wizard-results-header">
              <h2 className="wizard-titre">✨ Meilleurs forfaits pour vous</h2>
              <p className="wizard-sous-titre">
                Budget : <strong>{fcfa(budget)}</strong> · Profil : <strong>{PROFILS.find(p => p.val === profil)?.label}</strong>
                {operateur && <> · Opérateur : <strong>{operateur}</strong></>}
              </p>
              <button className="wizard-back" onClick={() => setStep(1)}>← Modifier</button>
            </div>

            {results.length === 0 ? (
              <div className="wizard-empty">
                <p>Aucun forfait trouvé pour ce budget.</p>
                <button className="wizard-back" onClick={() => setStep(1)}>← Ajuster</button>
              </div>
            ) : (
              <div className="wizard-results">
                {results.map((f, i) => {
                  const score = scoreForfait(f, profil)
                  const color = OP_COLORS[f.operateur] ?? '#1C2B4A'
                  const isTop = i === 0
                  return (
                    <div key={f.id} className={`wizard-result-card${isTop ? ' wizard-result-card--top' : ''}`}>
                      {isTop && <span className="wizard-recommande-badge">🏆 Meilleur rapport qualité/prix</span>}
                      <div className="wizard-result-header">
                        <span className="wizard-result-op" style={{ color }}>{f.operateur}</span>
                        <span className="wizard-result-nom">{f.nom}</span>
                      </div>
                      <div className="wizard-result-specs">
                        {f.data_mo != null && <span>📶 {formatData(f.data_mo)}</span>}
                        {f.minutes != null && <span>📞 {f.minutes === -1 ? '∞' : `${f.minutes} min`}</span>}
                        {f.validite_jours != null && <span>📅 {f.validite_jours}j</span>}
                      </div>
                      <div className="wizard-result-footer">
                        <span className="wizard-result-prix">{fcfa(f.prix)}</span>
                        <span className="wizard-result-score">Score : {score.toFixed(1)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
