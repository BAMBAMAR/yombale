'use client'

import { useState } from 'react'
import { fcfa } from '@/lib/format'
import ExternalImg from '@/components/ExternalImg'
import {
  Home,
  Building2,
  Building,
  Bed,
  MapPin,
  Layers,
  Key,
  CheckCircle2,
  X,
  ArrowLeft,
  ArrowRight,
  Search,
  Loader2,
} from 'lucide-react'

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

interface Props {
  onClose: () => void
}

const TYPE_BIENS = [
  { val: 'appartement', label: 'Appartement', icon: Building },
  { val: 'villa',       label: 'Villa',       icon: Home },
  { val: 'maison',      label: 'Maison',      icon: Building2 },
  { val: 'studio',      label: 'Studio',      icon: Bed },
  { val: 'terrain',     label: 'Terrain',     icon: MapPin },
  { val: '',            label: 'Tous types',  icon: Layers },
]

const VILLES = ['Dakar', 'Pikine', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Touba', 'Autre']

export default function WizardImmo({ onClose }: Props) {
  const [step, setStep]         = useState<1 | 2>(1)
  const [transaction, setTr]    = useState<'location' | 'vente'>('location')
  const [typeBien, setType]     = useState('')
  const [budget, setBudget]     = useState(200000)
  const [ville, setVille]       = useState('')
  const [quartier, setQuartier] = useState('')
  const [results, setResults]   = useState<AnnonceImmo[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

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
    <div className="wizard-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="wizard-panel">
        <button className="wizard-close" onClick={onClose} aria-label="Fermer">
          <X size={16} />
        </button>

        {step === 1 ? (
          <>
            <h2 className="wizard-titre">
              <Home size={22} style={{ color: 'var(--accent, #C75B00)' }} />
              <span>Trouver mon bien</span>
            </h2>
            <p className="wizard-sous-titre">Précisez vos critères pour voir les meilleures annonces.</p>

            {/* Transaction */}
            <div className="wizard-section">
              <label className="wizard-label">Je cherche à</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { setTr('location'); setBudget(200000) }}
                  className={`wizard-profil-btn${transaction === 'location' ? ' wizard-profil-btn--active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Key size={16} style={{ color: transaction === 'location' ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)' }} />
                  <span className="wizard-profil-name">Louer</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setTr('vente'); setBudget(20000000) }}
                  className={`wizard-profil-btn${transaction === 'vente' ? ' wizard-profil-btn--active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <CheckCircle2 size={16} style={{ color: transaction === 'vente' ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)' }} />
                  <span className="wizard-profil-name">Acheter</span>
                </button>
              </div>
            </div>

            {/* Type de bien */}
            <div className="wizard-section">
              <label className="wizard-label">Type de bien</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TYPE_BIENS.map((t) => {
                  const IconComp = t.icon
                  const isActive = typeBien === t.val
                  return (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setType(t.val)}
                      className={`wizard-profil-btn${isActive ? ' wizard-profil-btn--active' : ''}`}
                    >
                      <span className="wizard-profil-icon">
                        <IconComp size={16} style={{ color: isActive ? 'var(--accent, #C75B00)' : 'var(--text-subtle, #5A4E42)' }} />
                      </span>
                      <span className="wizard-profil-name">{t.label}</span>
                    </button>
                  )
                })}
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
                onChange={(e) => setBudget(Number(e.target.value))}
                className="wizard-slider"
              />
              <div className="wizard-budget-ticks">
                <span>0 FCFA</span>
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
                >
                  Toutes
                </button>
                {VILLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVille(v)}
                    className={`budget-pill${ville === v ? ' active' : ''}`}
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
                onChange={(e) => setQuartier(e.target.value)}
                className="wizard-input"
              />
            </div>

            {error && <p className="wizard-error">{error}</p>}

            <button className="wizard-cta" onClick={handleSearch} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Recherche en cours…</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Voir les annonces correspondantes</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <div className="wizard-results-header">
              <h2 className="wizard-titre">
                {results.length > 0
                  ? `${results.length} bien${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`
                  : 'Aucun résultat trouvé'}
              </h2>
              <p className="wizard-sous-titre">
                {transaction === 'location' ? 'Location' : 'Vente'} · Budget : <strong>{fcfa(budget)}</strong>
                {ville ? ` · ${ville}` : ''}
                {quartier ? ` · ${quartier}` : ''}
              </p>
              <button className="wizard-back" onClick={() => setStep(1)}>
                <ArrowLeft size={14} />
                <span>Modifier mes critères</span>
              </button>
            </div>

            {results.length === 0 ? (
              <div className="wizard-empty">
                <p>Essayez d&apos;augmenter le budget ou de choisir une autre ville.</p>
                <button className="wizard-cta" style={{ marginTop: 14 }} onClick={() => setStep(1)}>
                  <ArrowLeft size={16} />
                  <span>Ajuster les critères</span>
                </button>
              </div>
            ) : (
              <div className="wizard-immo-results">
                {results.map((a) => {
                  const img = a.image_url ?? (a.images?.[0] ?? null)
                  const loc = [a.quartier, a.ville].filter(Boolean).join(', ')
                  return (
                    <a key={a.id} href={`/immo/${a.id}`} className="wizard-immo-card" target="_blank" rel="noopener">
                      <div className="wizard-immo-img">
                        <ExternalImg
                          src={img}
                          alt={a.titre}
                          fallback=""
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div className="wizard-immo-info">
                        <p className="wizard-immo-titre">{a.titre}</p>
                        {loc && <p className="wizard-immo-loc">{loc}</p>}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          {a.surface_m2 && <span className="wizard-immo-tag">{a.surface_m2} m²</span>}
                          {a.nb_pieces && <span className="wizard-immo-tag">{a.nb_pieces} pièces</span>}
                        </div>
                        {a.prix && (
                          <p className="wizard-immo-prix">
                            {fcfa(a.prix)}{a.transaction === 'location' ? ' / mois' : ''}
                          </p>
                        )}
                      </div>
                    </a>
                  )
                })}
                <a
                  href={`/immo?transaction=${transaction}${ville ? `&ville=${encodeURIComponent(ville)}` : ''}${typeBien ? `&type_bien=${typeBien}` : ''}${budget ? `&prixMax=${budget}` : ''}`}
                  className="wizard-cta"
                  style={{ textDecoration: 'none', textAlign: 'center', display: 'flex' }}
                >
                  <span>Voir toutes les annonces sur la carte</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
