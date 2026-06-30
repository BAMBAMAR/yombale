'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { fcfa } from '@/lib/format'

const API = ''

const PROFILS = [
  { id: 'locataire',    label: '🏠 Je cherche à louer',  desc: 'Location — prix mensuel, confort, localisation', transaction: 'location', poids: { prix:3, surface:3, localisation:3 } },
  { id: 'acheteur',     label: '🔑 Premier achat',        desc: 'Acquisition résidence principale — budget maîtrisé', transaction: 'vente', poids: { prix:4, surface:2, localisation:3 } },
  { id: 'investisseur', label: '💼 Investisseur',          desc: 'Achat locatif — rentabilité et emplacement',   transaction: 'vente',    poids: { prix:2, surface:4, localisation:5 } },
  { id: 'expatrie',     label: '✈️ Expatrié / Diaspora',  desc: 'Logement moderne, bien situé, meublé si possible', transaction: 'location', poids: { prix:2, surface:3, localisation:4 } },
  { id: 'decouverte',   label: '🔍 Je cherche des idées', desc: 'Exploration large — toutes options', transaction: '',          poids: { prix:3, surface:3, localisation:3 } },
]

const TYPES_BIEN = ['Appartement', 'Villa', 'Studio', 'Chambre', 'Bureau', 'Terrain', 'Duplex']
const VILLES     = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Mbour', 'Saint-Louis', 'Ziguinchor', 'Kaolack']
const PIECES_OPTIONS = [
  { val: '', label: 'Peu importe' },
  { val: '1', label: '1 pièce' },
  { val: '2', label: '2 pièces' },
  { val: '3', label: '3 pièces' },
  { val: '4', label: '4 pièces' },
  { val: '5', label: '5+ pièces' },
]
const POIDS_LABELS = ['', 'Peu important', 'Secondaire', 'Équilibré', 'Important', 'Prioritaire']

interface AnnonceImmo {
  id: string; titre: string; prix: number; transaction: string; type_bien: string
  ville?: string; surface?: number; image_url?: string; description?: string
  nb_pieces?: number; meuble?: boolean
  _score?: number; _sPrix?: number; _sSurface?: number
}

export default function GuideImmoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [profilActif, setProfilActif]   = useState<string | null>(searchParams.get('profil'))
  const [transaction, setTransaction]   = useState(searchParams.get('tr') ?? 'location')
  const [typeBien, setTypeBien]         = useState(searchParams.get('type') ?? '')
  const [budget, setBudget]             = useState(searchParams.get('budget') ?? '')
  const [ville, setVille]               = useState(searchParams.get('ville') ?? '')
  const [surfaceMin, setSurfaceMin]     = useState(searchParams.get('sMin') ?? '')
  const [nbPieces, setNbPieces]         = useState(searchParams.get('pieces') ?? '')
  const [meuble, setMeuble]             = useState(searchParams.get('meuble') ?? '')
  const [poidsPrix, setPoidsPrix]       = useState(Number(searchParams.get('pp')) || 3)
  const [poidsSurface, setPoidsSurface] = useState(Number(searchParams.get('ps')) || 3)
  const [results, setResults]           = useState<AnnonceImmo[]>([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [triPar, setTriPar]             = useState<'score' | 'prix' | 'surface'>('score')

  function appliquerProfil(id: string) {
    const p = PROFILS.find(p => p.id === id)
    if (!p) return
    setProfilActif(id)
    if (p.transaction) setTransaction(p.transaction)
    setPoidsPrix(p.poids.prix)
    setPoidsSurface(p.poids.surface)
  }

  const lancer = useCallback(async () => {
    const urlParams = new URLSearchParams()
    if (profilActif) urlParams.set('profil', profilActif)
    urlParams.set('tr', transaction)
    if (typeBien) urlParams.set('type', typeBien)
    if (budget) urlParams.set('budget', budget)
    if (ville) urlParams.set('ville', ville)
    if (surfaceMin) urlParams.set('sMin', surfaceMin)
    if (nbPieces) urlParams.set('pieces', nbPieces)
    if (meuble) urlParams.set('meuble', meuble)
    urlParams.set('pp', String(poidsPrix))
    urlParams.set('ps', String(poidsSurface))
    router.push(`/guide-immo?${urlParams.toString()}`, { scroll: false })

    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ limit: '48' })
      if (transaction) params.set('transaction', transaction)
      if (typeBien)    params.set('type_bien', typeBien)
      if (budget)      params.set('prixMax', budget)
      if (ville)       params.set('ville', ville)
      if (surfaceMin)  params.set('surfaceMin', surfaceMin)
      if (nbPieces)    params.set('nb_pieces', nbPieces)
      const res  = await fetch(`${API}/api/immo?${params}`)
      const data = await res.json()
      let liste: AnnonceImmo[] = (data.annonces ?? data) as AnnonceImmo[]

      // Filtre meublé côté client (si le backend ne le supporte pas)
      if (meuble === 'oui')  liste = liste.filter(a => a.meuble === true || a.description?.toLowerCase().includes('meublé'))
      if (meuble === 'non')  liste = liste.filter(a => !a.meuble && !a.description?.toLowerCase().includes('meublé'))

      if (!liste.length) { setResults([]); setLoading(false); return }

      const minPrix    = Math.min(...liste.map(a => +a.prix).filter(Boolean)) || 1
      const maxSurface = Math.max(...liste.map(a => a.surface ?? 0)) || 1
      const totalPoids = poidsPrix + poidsSurface

      const scored = liste.map(a => {
        const sPrix    = minPrix / (+a.prix || 1)
        const sSurface = (a.surface ?? 0) / maxSurface
        const score    = Math.round(((poidsPrix * sPrix + poidsSurface * sSurface) / totalPoids) * 100) / 10
        return { ...a, _score: score, _sPrix: Math.round(sPrix * 100), _sSurface: Math.round(sSurface * 100) }
      })

      setResults(scored)
    } catch (e) {
      setError('Erreur réseau. Vérifiez votre connexion.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [profilActif, transaction, typeBien, budget, ville, surfaceMin, nbPieces, meuble, poidsPrix, poidsSurface, router])

  useEffect(() => {
    if (searchParams.get('profil') || searchParams.get('ville') || searchParams.get('budget')) {
      lancer()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sorted = [...results].sort((a, b) => {
    if (triPar === 'prix')    return +a.prix - +b.prix
    if (triPar === 'surface') return (b.surface ?? 0) - (a.surface ?? 0)
    return (b._score ?? 0) - (a._score ?? 0)
  })

  const topAnnonce = sorted[0] ?? null

  return (
    <div className="guide-page">

      <div className="guide-topbar">
        <Link href="/immo" className="guide-back-btn">← Annonces</Link>
        <div>
          <div className="guide-topbar-titre">🏡 Guide immobilier intelligent</div>
          <div className="guide-topbar-sub">Scoring personnalisé · 5 profils d&apos;acheteur</div>
        </div>
      </div>

      <div className="guide-wrap">

        {/* ── Panneau gauche ── */}
        <div className="guide-left guide-left--navy">

          <div className="guide-section-label">Mon profil</div>
          <div className="guide-profils-grid">
            {PROFILS.map(p => (
              <button
                key={p.id}
                className={`guide-profil-btn${profilActif === p.id ? ' active' : ''}`}
                onClick={() => appliquerProfil(p.id)}
              >
                <span className="guide-profil-label">{p.label}</span>
                <span className="guide-profil-desc">{p.desc}</span>
              </button>
            ))}
          </div>

          <div className="guide-divider" />

          <div className="guide-section-label">Type de projet</div>
          <div className="guide-profil-row" style={{ marginBottom: 16 }}>
            {[{ val: 'location', label: '🏠 Location' }, { val: 'vente', label: '🔑 Achat' }, { val: '', label: '🔍 Tous' }].map(t => (
              <button
                key={t.val}
                className={`guide-profil-btn guide-profil-btn--sm${transaction === t.val ? ' active' : ''}`}
                onClick={() => setTransaction(t.val)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="guide-field">
            <label className="guide-label">💰 Budget max (FCFA{transaction === 'location' ? '/mois' : ''})</label>
            <input
              className="guide-input" type="number"
              placeholder={transaction === 'location' ? 'ex: 300 000' : 'ex: 50 000 000'}
              value={budget} onChange={e => setBudget(e.target.value)}
            />
          </div>

          <div className="guide-budget-row">
            <div className="guide-field" style={{ flex: 1 }}>
              <label className="guide-label">Type de bien</label>
              <select className="guide-select" value={typeBien} onChange={e => setTypeBien(e.target.value)}>
                <option value="">Tous</option>
                {TYPES_BIEN.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="guide-field" style={{ flex: 1 }}>
              <label className="guide-label">Ville</label>
              <select className="guide-select" value={ville} onChange={e => setVille(e.target.value)}>
                <option value="">Toutes</option>
                {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="guide-budget-row">
            <div className="guide-field" style={{ flex: 1 }}>
              <label className="guide-label">Nb pièces min</label>
              <select className="guide-select" value={nbPieces} onChange={e => setNbPieces(e.target.value)}>
                {PIECES_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
              </select>
            </div>
            <div className="guide-field" style={{ flex: 1 }}>
              <label className="guide-label">Surface min (m²)</label>
              <input className="guide-input" type="number" placeholder="ex: 40" value={surfaceMin} onChange={e => setSurfaceMin(e.target.value)} />
            </div>
          </div>

          <div className="guide-field">
            <label className="guide-label">Meublé</label>
            <div className="guide-profil-row">
              {[{ val: '', label: '🔍 Tous' }, { val: 'oui', label: '✅ Meublé' }, { val: 'non', label: '❌ Non meublé' }].map(m => (
                <button
                  key={m.val}
                  className={`guide-profil-btn guide-profil-btn--sm${meuble === m.val ? ' active' : ''}`}
                  onClick={() => setMeuble(m.val)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="guide-divider" />

          {[
            { id: 'prix',    label: '💰 Importance du prix',    val: poidsPrix,    set: setPoidsPrix    },
            { id: 'surface', label: '📐 Importance de la surface', val: poidsSurface, set: setPoidsSurface },
          ].map(s => (
            <div key={s.id} className="guide-slider-wrap">
              <div className="guide-slider-header">
                <span className="guide-label">{s.label}</span>
                <span className="guide-slider-val">{POIDS_LABELS[s.val]}</span>
              </div>
              <input
                type="range" min={1} max={5} value={s.val}
                onChange={e => s.set(Number(e.target.value))}
                className="guide-range"
              />
            </div>
          ))}

          <div style={{ flex: 1, minHeight: 16 }} />

          <button className="guide-lancer-btn" onClick={lancer} disabled={loading}>
            {loading ? '⏳ Analyse en cours…' : '🏡 Trouver mon logement idéal'}
          </button>
        </div>

        {/* ── Panneau droit ── */}
        <div className="guide-right">
          {loading && (
            <div className="guide-empty">
              <div className="guide-spinner" />
              <p>Calcul du scoring en cours…</p>
            </div>
          )}

          {!loading && !results.length && !error && (
            <div className="guide-empty">
              <div style={{ fontSize: 52, opacity: .2, marginBottom: 16 }}>🏡</div>
              <div className="guide-empty-titre">Configurez votre recherche</div>
              <div className="guide-empty-sub">Choisissez votre profil, votre budget et votre ville,<br />puis cliquez <strong>Trouver</strong>.</div>
            </div>
          )}

          {!loading && error && (
            <div className="guide-empty" style={{ color: 'var(--red)' }}>{error}</div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="guide-results-header">
                <span className="guide-results-count">{results.length} annonce{results.length > 1 ? 's' : ''} · classées par scoring</span>
                <div className="guide-tri-btns">
                  {(['score', 'prix', 'surface'] as const).map(t => (
                    <button key={t} className={`guide-tri-btn${triPar === t ? ' active' : ''}`} onClick={() => setTriPar(t)}>
                      {t === 'score' ? '🏆 Score' : t === 'prix' ? '💰 Prix' : '📐 Surface'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="guide-results-grid">
                {sorted.map((a, idx) => (
                  <Link href={`/immo/${a.id}`} key={a.id} className="guide-result-card">
                    {idx === 0 && <div className="guide-result-badge">🥇 Meilleur score</div>}
                    {a.image_url && (
                      <img src={a.image_url} alt={a.titre} className="guide-result-img" loading="lazy" />
                    )}
                    <div className="guide-result-body">
                      <p className="guide-result-nom">{a.titre}</p>
                      <p className="guide-result-prix">
                        {fcfa(a.prix)}{a.transaction === 'location' ? '/mois' : ''}
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
                        {a.ville    && <span>📍 {a.ville}</span>}
                        {a.surface  && <span>📐 {a.surface} m²</span>}
                        {a.nb_pieces && <span>🚪 {a.nb_pieces} pièce{a.nb_pieces > 1 ? 's' : ''}</span>}
                        {a.type_bien && <span>🏷 {a.type_bien}</span>}
                      </div>

                      <div className="guide-score-big">
                        <span className="guide-score-num">{a._score?.toFixed(1)}</span>
                        <span className="guide-score-denom">/10</span>
                      </div>

                      <div className="guide-bars">
                        <div className="guide-bar-row">
                          <span>💰 Prix</span>
                          <div className="guide-bar-track">
                            <div className="guide-bar-fill" style={{ width: `${a._sPrix}%`, background: '#2563eb' }} />
                          </div>
                          <span>{a._sPrix}%</span>
                        </div>
                        {a._sSurface != null && a._sSurface > 0 && (
                          <div className="guide-bar-row">
                            <span>📐 Surface</span>
                            <div className="guide-bar-track">
                              <div className="guide-bar-fill" style={{ width: `${a._sSurface}%`, background: '#10b981' }} />
                            </div>
                            <span>{a._sSurface}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {topAnnonce && (
                <div className="guide-cta-bas">
                  <div className="guide-cta-bas-info">
                    <span className="guide-cta-bas-label">🥇 Meilleur score</span>
                    <span className="guide-cta-bas-nom">{topAnnonce.titre}</span>
                    <span className="guide-cta-bas-prix">{fcfa(topAnnonce.prix)}{topAnnonce.transaction === 'location' ? '/mois' : ''}</span>
                  </div>
                  <Link href={`/immo/${topAnnonce.id}`} className="guide-cta-bas-btn">
                    Voir l&apos;annonce →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
