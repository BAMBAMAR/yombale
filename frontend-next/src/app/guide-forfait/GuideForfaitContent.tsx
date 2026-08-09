'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import PageHeader from '@/components/PageHeader'
import FiltresBar from '@/components/FiltresBar'
import SeoCard from '@/components/SeoCard'

const API = ''

const PROFILS = [
  { id: 'internet',    label: '📶 Grande data',     desc: 'Priorité à la quantité de data mobile',         poids: { data:5, appel:1, prix:2, duree:1 } },
  { id: 'appel',       label: '📞 Grands appelants', desc: 'Priorité aux minutes (illimitées si possible)',  poids: { data:1, appel:5, prix:2, duree:1 } },
  { id: 'mixte',       label: '🔀 Usage mixte',      desc: 'Équilibre data, appels et SMS',                 poids: { data:3, appel:3, prix:2, duree:1 } },
  { id: 'econome',     label: '💰 Économique',        desc: 'Meilleur rapport qualité/prix avant tout',     poids: { data:3, appel:2, prix:5, duree:1 } },
  { id: 'longue',      label: '📅 Longue durée',     desc: 'Forfaits valables plusieurs semaines/mois',    poids: { data:2, appel:2, prix:3, duree:5 } },
]

const OPERATEURS = ['Orange', 'Free', 'Expresso', 'Wave', 'Sonatel']
const TYPES_FORFAIT = [
  { val: '', label: 'Tous types' },
  { val: 'internet', label: 'Internet / Data' },
  { val: 'appel',    label: 'Appels & SMS' },
  { val: 'mixte',    label: 'Mixte' },
]
const BUDGETS_RAPIDES = [1000, 2000, 3000, 5000, 10000]
const POIDS_LABELS = ['', 'Peu important', 'Secondaire', 'Équilibré', 'Important', 'Prioritaire']

interface Forfait {
  id: string; nom: string; operateur: string; type: string; prix: number
  data_mo?: number | null; minutes?: number | null; sms?: number | null; validite_jours?: number | null
  description?: string; _score?: number; _sData?: number; _sAppel?: number; _sPrix?: number; _sDuree?: number
}

const OP_COLORS: Record<string, string> = {
  Orange: '#FF7900', Free: '#CD1127', Expresso: '#00873F', Wave: '#00BCC9',
}

function formatData(mo: number | null | undefined): string {
  if (!mo) return '—'
  if (mo >= 1024) return `${(mo / 1024).toFixed(mo % 1024 === 0 ? 0 : 1)} Go`
  return `${mo} Mo`
}

export default function GuideForfaitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [budget, setBudget]         = useState(searchParams.get('budget') ?? '')
  const [profilActif, setProfilActif] = useState<string | null>(searchParams.get('profil'))
  const [operateur, setOperateur]   = useState(searchParams.get('op') ?? '')
  const [typeForfait, setTypeForfait] = useState(searchParams.get('type') ?? '')
  const [dataMin, setDataMin]       = useState(searchParams.get('dMin') ?? '')
  const [minMin, setMinMin]         = useState(searchParams.get('mMin') ?? '')
  const [validiteMin, setValiditeMin] = useState(Number(searchParams.get('vMin')) || 0)
  const [poidsData, setPoidsData]   = useState(Number(searchParams.get('pd')) || 3)
  const [poidsAppel, setPoidsAppel] = useState(Number(searchParams.get('pa')) || 3)
  const [poidsPrix, setPoidsPrix]   = useState(Number(searchParams.get('pp')) || 3)
  const [poidsDuree, setPoidsDuree] = useState(Number(searchParams.get('pu')) || 2)
  const [results, setResults]       = useState<Forfait[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [triPar, setTriPar]         = useState<'score' | 'prix' | 'data'>('score')

  function appliquerProfil(id: string) {
    const p = PROFILS.find(p => p.id === id)
    if (!p) return
    setProfilActif(id)
    setPoidsData(p.poids.data)
    setPoidsAppel(p.poids.appel)
    setPoidsPrix(p.poids.prix)
    setPoidsDuree(p.poids.duree)
  }

  const lancer = useCallback(async () => {
    const urlParams = new URLSearchParams()
    if (budget) urlParams.set('budget', budget)
    if (profilActif) urlParams.set('profil', profilActif)
    if (operateur) urlParams.set('op', operateur)
    if (typeForfait) urlParams.set('type', typeForfait)
    if (dataMin) urlParams.set('dMin', dataMin)
    if (minMin) urlParams.set('mMin', minMin)
    if (validiteMin > 0) urlParams.set('vMin', String(validiteMin))
    urlParams.set('pd', String(poidsData))
    urlParams.set('pa', String(poidsAppel))
    urlParams.set('pp', String(poidsPrix))
    urlParams.set('pu', String(poidsDuree))
    router.push(`/guide-forfait?${urlParams.toString()}`, { scroll: false })

    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (budget) params.set('prixMax', budget)
      if (operateur) params.set('operateur', operateur)
      if (typeForfait) params.set('type', typeForfait)
      const res  = await fetch(`${API}/api/telecom?${params}`)
      const data = await res.json()
      let liste: Forfait[] = (data.forfaits ?? data) as Forfait[]

      // Filtres client
      if (dataMin)    liste = liste.filter(f => (f.data_mo ?? 0) >= Number(dataMin) * 1024)
      if (minMin)     liste = liste.filter(f => f.minutes === -1 || (f.minutes ?? 0) >= Number(minMin))
      if (validiteMin > 0) liste = liste.filter(f => (f.validite_jours ?? 0) >= validiteMin)

      if (!liste.length) { setResults([]); setLoading(false); return }

      const maxData  = Math.max(...liste.map(f => f.data_mo ?? 0)) || 1
      const maxMin   = Math.max(...liste.map(f => f.minutes === -1 ? 9999 : (f.minutes ?? 0))) || 1
      const minPrix  = Math.min(...liste.map(f => f.prix)) || 1
      const maxDuree = Math.max(...liste.map(f => f.validite_jours ?? 0)) || 1
      const totalPoids = poidsData + poidsAppel + poidsPrix + poidsDuree

      const scored = liste.map(f => {
        const sData  = (f.data_mo ?? 0) / maxData
        const sAppel = f.minutes === -1 ? 1 : (f.minutes ?? 0) / maxMin
        const sPrix  = minPrix / (f.prix || 1)
        const sDuree = (f.validite_jours ?? 0) / maxDuree
        const score  = Math.round(((poidsData * sData + poidsAppel * sAppel + poidsPrix * sPrix + poidsDuree * sDuree) / totalPoids) * 100) / 10
        return {
          ...f,
          _score: score,
          _sData:  Math.round(sData  * 100),
          _sAppel: Math.round(sAppel * 100),
          _sPrix:  Math.round(sPrix  * 100),
          _sDuree: Math.round(sDuree * 100),
        }
      })

      setResults(scored)
    } catch (e) {
      setError('Erreur réseau. Vérifiez votre connexion.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [budget, profilActif, operateur, typeForfait, dataMin, minMin, validiteMin, poidsData, poidsAppel, poidsPrix, poidsDuree, router])

  useEffect(() => {
    if (searchParams.get('profil') || searchParams.get('budget') || searchParams.get('op')) {
      lancer()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sorted = [...results].sort((a, b) => {
    if (triPar === 'prix') return (a.prix || 0) - (b.prix || 0)
    if (triPar === 'data') return (b.data_mo ?? 0) - (a.data_mo ?? 0)
    return (b._score ?? 0) - (a._score ?? 0)
  })

  const topForfait = sorted[0] ?? null

  return (
    <div className="guide-page">

      <PageHeader
        breadcrumb={[
          { label: 'Accueil', href: '/' },
          { label: 'Télécom', href: '/telecom' },
          { label: 'Guide forfait' },
        ]}
        emoji="🎯"
        titre="Guide forfait télécom"
        compteur="Scoring personnalisé · 5 profils d'usage"
      />

      <Link href="/telecom" className="guide-back-btn">← Forfaits</Link>

      <div className="guide-wrap">

        {/* ── Panneau gauche ── */}
        <div className="guide-left guide-left--navy">

          <div className="guide-section-label">Profil d&apos;usage</div>
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

          <div className="guide-field">
            <label className="guide-label">💰 Budget max (FCFA/mois)</label>
            <input
              className="guide-input"
              type="number" min={100} placeholder="ex: 3 000"
              value={budget} onChange={e => setBudget(e.target.value)}
            />
            <div className="guide-pills-row" style={{ marginTop: 6 }}>
              {BUDGETS_RAPIDES.map(v => (
                <button key={v} className="guide-quick-pill" onClick={() => setBudget(String(v))}>
                  {v.toLocaleString('fr-FR')} F
                </button>
              ))}
            </div>
          </div>

          <div className="guide-budget-row">
            <div className="guide-field" style={{ flex: 1 }}>
              <label className="guide-label">Opérateur</label>
              <FiltresBar
                essentiels={[
                  { key: 'op-tous', label: 'Tous', active: operateur === '', onClick: () => setOperateur('') },
                  ...OPERATEURS.map(op => ({ key: `op-${op}`, label: op, active: operateur === op, onClick: () => setOperateur(op) })),
                ]}
              />
            </div>
            <div className="guide-field" style={{ flex: 1 }}>
              <label className="guide-label">Type de forfait</label>
              <FiltresBar
                essentiels={TYPES_FORFAIT.map(t => ({
                  key: `type-${t.val || 'tous'}`,
                  label: t.label,
                  active: typeForfait === t.val,
                  onClick: () => setTypeForfait(t.val),
                }))}
              />
            </div>
          </div>

          <div className="guide-budget-row">
            <div className="guide-field" style={{ flex: 1 }}>
              <label className="guide-label">Data min (Go)</label>
              <input className="guide-input" type="number" min={0} placeholder="ex: 2" value={dataMin} onChange={e => setDataMin(e.target.value)} />
            </div>
            <div className="guide-field" style={{ flex: 1 }}>
              <label className="guide-label">Minutes min</label>
              <input className="guide-input" type="number" min={0} placeholder="ex: 60" value={minMin} onChange={e => setMinMin(e.target.value)} />
            </div>
          </div>

          <div className="guide-field">
            <label className="guide-label">Validité minimum : {validiteMin > 0 ? `${validiteMin} jours` : 'Tous'}</label>
            <input
              type="range" min={0} max={30} step={1} value={validiteMin}
              onChange={e => setValiditeMin(Number(e.target.value))}
              className="guide-range"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              <span>Tous</span><span>7j</span><span>15j</span><span>30j</span>
            </div>
          </div>

          <div className="guide-divider" />

          {[
            { id: 'data',  label: '📶 Importance de la data',     val: poidsData,  set: setPoidsData  },
            { id: 'appel', label: '📞 Importance des appels',      val: poidsAppel, set: setPoidsAppel },
            { id: 'prix',  label: '💰 Importance du prix',         val: poidsPrix,  set: setPoidsPrix  },
            { id: 'duree', label: '📅 Importance de la durée',     val: poidsDuree, set: setPoidsDuree },
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
            {loading ? '⏳ Analyse en cours…' : '🎯 Trouver le meilleur forfait'}
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
              <div style={{ fontSize: 52, opacity: .2, marginBottom: 16 }}>📡</div>
              <div className="guide-empty-titre">Configurez votre profil</div>
              <div className="guide-empty-sub">Choisissez un profil ou ajustez les paramètres,<br />puis cliquez <strong>Trouver</strong>.</div>
            </div>
          )}

          {!loading && error && (
            <div className="guide-empty" style={{ color: 'var(--red)' }}>{error}</div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="guide-results-header">
                <span className="guide-results-count">{results.length} forfait{results.length > 1 ? 's' : ''} · classés par scoring</span>
                <div className="guide-tri-btns">
                  {(['score', 'prix', 'data'] as const).map(t => (
                    <button key={t} className={`guide-tri-btn${triPar === t ? ' active' : ''}`} onClick={() => setTriPar(t)}>
                      {t === 'score' ? '🏆 Score' : t === 'prix' ? '💰 Prix' : '📶 Data'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="guide-forfaits-grid">
                {sorted.map((f, idx) => {
                  const color = OP_COLORS[f.operateur] ?? '#1C2B4A'
                  return (
                    <Link href={`/telecom/${f.id}`} key={f.id} className="guide-forfait-card">
                      {idx === 0 && <div className="guide-result-badge">🏆 Meilleur score</div>}
                      <div className="guide-forfait-header" style={{ borderLeft: `4px solid ${color}` }}>
                        <span style={{ fontWeight: 700, color }}>{f.operateur}</span>
                        <span className="guide-forfait-prix">{fcfa(f.prix)}</span>
                      </div>
                      <p className="guide-forfait-nom">{f.nom}</p>
                      <div className="guide-forfait-specs">
                        {f.data_mo != null && <span>📶 {formatData(f.data_mo)}</span>}
                        {f.minutes != null && <span>📞 {f.minutes === -1 ? '∞ min' : `${f.minutes} min`}</span>}
                        {f.sms != null && f.sms > 0 && <span>✉️ {f.sms === -1 ? '∞ SMS' : `${f.sms} SMS`}</span>}
                        {f.validite_jours != null && <span>📅 {f.validite_jours}j</span>}
                      </div>

                      <div className="guide-score-big" style={{ marginTop: 8 }}>
                        <span className="guide-score-num">{f._score?.toFixed(1)}</span>
                        <span className="guide-score-denom">/10</span>
                      </div>

                      <div className="guide-bars">
                        {poidsData > 1 && (
                          <div className="guide-bar-row">
                            <span>📶 Data</span>
                            <div className="guide-bar-track">
                              <div className="guide-bar-fill" style={{ width: `${f._sData}%`, background: '#2563eb' }} />
                            </div>
                            <span>{f._sData}%</span>
                          </div>
                        )}
                        {poidsAppel > 1 && (
                          <div className="guide-bar-row">
                            <span>📞 Appels</span>
                            <div className="guide-bar-track">
                              <div className="guide-bar-fill" style={{ width: `${f._sAppel}%`, background: '#7c3aed' }} />
                            </div>
                            <span>{f._sAppel}%</span>
                          </div>
                        )}
                        <div className="guide-bar-row">
                          <span>💰 Prix</span>
                          <div className="guide-bar-track">
                            <div className="guide-bar-fill" style={{ width: `${f._sPrix}%`, background: '#10b981' }} />
                          </div>
                          <span>{f._sPrix}%</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {topForfait && (
                <div className="guide-cta-bas">
                  <div className="guide-cta-bas-info">
                    <span className="guide-cta-bas-label">🏆 Meilleur score</span>
                    <span className="guide-cta-bas-nom">{topForfait.operateur} — {topForfait.nom}</span>
                    <span className="guide-cta-bas-prix">{fcfa(topForfait.prix)}/mois</span>
                  </div>
                  <Link href={`/telecom/${topForfait.id}`} className="guide-cta-bas-btn">
                    Voir le forfait →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <SeoCard
        titre="Pourquoi utiliser le guide forfait télécom Nopalou ?"
        blurbs={[
          { emoji: '🎯', text: 'Choisissez un profil (grande data, grands appelants, usage mixte, économique, longue durée…) et le guide pondère automatiquement le score de chaque forfait selon vos priorités réelles.' },
          { emoji: '📡', text: 'Les résultats comparent en direct les forfaits des 4 opérateurs sénégalais, filtrés selon votre budget, votre type de forfait et vos besoins en data et en appels.' },
        ]}
        chipRows={[
          {
            label: 'Comparer par opérateur',
            chips: [
              { href: '/telecom/orange', emoji: '🟠', label: 'Orange' },
              { href: '/telecom/yas', emoji: '🟣', label: 'Yas' },
              { href: '/telecom/expresso', emoji: '🟢', label: 'Expresso' },
              { href: '/telecom/promobile', emoji: '🔵', label: 'Promobile' },
            ],
          },
        ]}
        foot="Comparaison recalculée à chaque recherche selon vos critères"
      />
    </div>
  )
}
