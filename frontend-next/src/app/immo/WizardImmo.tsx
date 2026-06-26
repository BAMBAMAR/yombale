'use client'

import { useState } from 'react'
import { fcfa } from '@/lib/format'

interface AnnonceImmo {
  id: string
  titre: string
  prix: number | null
  ville: string | null
  quartier: string | null
  type_bien: string | null
  transaction: string | null
  surface_m2: number | null
  nb_pieces: number | null
  image_url: string | null
  images: string[] | null
}

interface Props { onClose: () => void }

const TYPE_BIENS = [
  { val: 'appartement', label: '🏢 Appartement' },
  { val: 'villa',       label: '🏡 Villa' },
  { val: 'maison',      label: '🏠 Maison' },
  { val: 'studio',      label: '🛏 Studio' },
  { val: 'terrain',     label: '🌿 Terrain' },
  { val: '',            label: '🔍 Peu importe' },
]

const VILLES = ['Dakar', 'Pikine', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Touba', 'Autre']

export default function WizardImmo({ onClose }: Props) {
  const [step, setStep]       = useState<1 | 2>(1)
  const [transaction, setTr]  = useState<'location' | 'vente'>('location')
  const [typeBien, setType]   = useState('')
  const [budget, setBudget]   = useState(200000)
  const [ville, setVille]     = useState('')
  const [quartier, setQuartier] = useState('')
  const [results, setResults] = useState<AnnonceImmo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const maxBudget = transaction === 'vente' ? 200000000 : 1000000
  const stepBudget = transaction === 'vente' ? 1000000 : 10000

  async function handleSearch() {
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ limit: '12', transaction })
      if (typeBien) qs.set('type_bien', typeBien)
      if (ville && ville !== 'Autre') qs.set('ville', ville)
      if (quartier.trim()) qs.set('quartier', quartier.trim())
      if (budget > 0) qs.set('prixMax', String(budget))

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      const r = await fetch(`${backendUrl}/api/immo?${qs}`)
      const data = await r.json()
      setResults(data.annonces ?? [])
      setStep(2)
    } catch {
      setError('Impossible de charger les annonces. Réessayez.')
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
            <h2 className="wizard-titre">🏘 Trouver mon bien</h2>
            <p className="wizard-sous-titre">Précisez vos critères pour voir les meilleures annonces.</p>

            {/* Transaction */}
            <div className="wizard-section">
              <label className="wizard-label">Je cherche à</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['location', 'vente'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTr(t); setBudget(t === 'vente' ? 20000000 : 200000) }}
                    className={`wizard-profil-btn${transaction === t ? ' wizard-profil-btn--active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <span className="wizard-profil-icon">{t === 'location' ? '🔑' : '🤝'}</span>
                    <span className="wizard-profil-name">{t === 'location' ? 'Louer' : 'Acheter'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Type de bien */}
            <div className="wizard-section">
              <label className="wizard-label">Type de bien</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TYPE_BIENS.map(t => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => setType(t.val)}
                    className={`wizard-profil-btn${typeBien === t.val ? ' wizard-profil-btn--active' : ''}`}
                  >
                    <span className="wizard-profil-icon">{t.label.split(' ')[0]}</span>
                    <span className="wizard-profil-name" style={{ fontSize: 13 }}>{t.label.split(' ').slice(1).join(' ')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="wizard-section">
              <label className="wizard-label">
                Budget maximum {transaction === 'location' ? '/ mois' : ''}
              </label>
              <div className="wizard-budget-display">{fcfa(budget)}</div>
              <input
                type="range"
                min={0}
                max={maxBudget}
                step={stepBudget}
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="wizard-slider"
              />
              <div className="wizard-budget-ticks">
                <span>0</span>
                <span>{fcfa(maxBudget / 2)}</span>
                <span>{fcfa(maxBudget)}</span>
              </div>
            </div>

            {/* Ville */}
            <div className="wizard-section">
              <label className="wizard-label">Ville (optionnel)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setVille('')}
                  className={`budget-pill${ville === '' ? ' active' : ''}`}
                  style={{ fontSize: 13 }}
                >
                  Toutes
                </button>
                {VILLES.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVille(v)}
                    className={`budget-pill${ville === v ? ' active' : ''}`}
                    style={{ fontSize: 13 }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Quartier */}
            <div className="wizard-section">
              <label className="wizard-label">Quartier (optionnel)</label>
              <input
                type="text"
                placeholder="Ex : Plateau, Almadies, Sacré-Cœur…"
                value={quartier}
                onChange={e => setQuartier(e.target.value)}
                className="wizard-input"
              />
            </div>

            {error && <p className="wizard-error">{error}</p>}

            <button className="wizard-cta" onClick={handleSearch} disabled={loading}>
              {loading ? 'Recherche…' : '→ Voir les annonces correspondantes'}
            </button>
          </>
        ) : (
          <>
            <div className="wizard-results-header">
              <h2 className="wizard-titre">
                {results.length > 0 ? `✨ ${results.length} bien${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}` : '😕 Aucun résultat'}
              </h2>
              <p className="wizard-sous-titre">
                {transaction === 'location' ? 'Location' : 'Vente'} · Budget : <strong>{fcfa(budget)}</strong>
                {ville ? ` · ${ville}` : ''}
                {quartier ? ` · ${quartier}` : ''}
              </p>
              <button className="wizard-back" onClick={() => setStep(1)}>← Modifier mes critères</button>
            </div>

            {results.length === 0 ? (
              <div className="wizard-empty">
                <p>Essayez d&apos;augmenter le budget ou de changer de ville.</p>
                <button className="wizard-back" style={{ marginTop: 12 }} onClick={() => setStep(1)}>
                  ← Ajuster les critères
                </button>
              </div>
            ) : (
              <div className="wizard-immo-results">
                {results.map(a => {
                  const img = a.image_url ?? (a.images?.[0] ?? null)
                  const loc = [a.quartier, a.ville].filter(Boolean).join(', ')
                  return (
                    <a key={a.id} href={`/immo/${a.id}`} className="wizard-immo-card" target="_blank" rel="noopener">
                      <div className="wizard-immo-img">
                        {img
                          ? <img src={img} alt={a.titre} loading="lazy" />
                          : <span style={{ fontSize: 28 }}>🏠</span>
                        }
                      </div>
                      <div className="wizard-immo-info">
                        <p className="wizard-immo-titre">{a.titre}</p>
                        {loc && <p className="wizard-immo-loc">📍 {loc}</p>}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          {a.surface_m2 && <span className="wizard-immo-tag">{a.surface_m2} m²</span>}
                          {a.nb_pieces && <span className="wizard-immo-tag">{a.nb_pieces} pièces</span>}
                        </div>
                        {a.prix && (
                          <p className="wizard-immo-prix">{fcfa(a.prix)}{a.transaction === 'location' ? '/mois' : ''}</p>
                        )}
                      </div>
                    </a>
                  )
                })}
                <a href={`/immo?transaction=${transaction}${ville ? `&ville=${encodeURIComponent(ville)}` : ''}${typeBien ? `&type_bien=${typeBien}` : ''}${budget ? `&prixMax=${budget}` : ''}`}
                   className="wizard-cta" style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}>
                  Voir toutes les annonces →
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
