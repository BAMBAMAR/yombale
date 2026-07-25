'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import ExternalImg from '@/components/ExternalImg'
import PageHeader from '@/components/PageHeader'
import FiltresBar from '@/components/FiltresBar'
import SeoCard from '@/components/SeoCard'

const API = ''  // utilise le proxy Next.js /api/* → backend

const CATEGORIES = [
  { slug: 'smartphones',  label: 'Téléphones',       icon: '📱' },
  { slug: 'informatique', label: 'Informatique',      icon: '💻' },
  { slug: 'tv-electro',   label: 'TV & Électro',      icon: '📺' },
  { slug: 'mode',         label: 'Mode',              icon: '👗' },
  { slug: 'maison',       label: 'Maison',            icon: '🏠' },
  { slug: 'auto-moto',    label: 'Auto & Moto',       icon: '🛵' },
  { slug: 'jeux',         label: 'Jeux',              icon: '🎮' },
]

const PROFILS = [
  { id: 'prix',    label: '💰 Meilleur prix',   desc: 'Priorité au prix le plus bas',        poids: { prix:5, specs:1, dispo:2 } },
  { id: 'rapport', label: '⭐ Rapport Q/P',      desc: 'Équilibre prix et caractéristiques',  poids: { prix:3, specs:4, dispo:2 } },
  { id: 'haut',    label: '🚀 Haut de gamme',   desc: 'Priorité aux meilleures specs',       poids: { prix:1, specs:5, dispo:2 } },
  { id: 'dispo',   label: '🏪 Bien distribué',  desc: 'Disponible chez plusieurs marchands', poids: { prix:2, specs:3, dispo:5 } },
]

const POIDS_LABELS = ['', 'Peu important', 'Secondaire', 'Équilibré', 'Important', 'Prioritaire']

interface Produit {
  id: string; nom: string; prix_min: number; nb_offres: number; image_url?: string; categorie?: string
  etats?: string[]
  _score?: number; _sPrix?: number; _sDispo?: number
}

function extraireNombre(nom: string, patterns: RegExp[]): number | null {
  for (const re of patterns) {
    const m = nom.match(re)
    if (m) return parseFloat(m[1])
  }
  return null
}

function extraireSpecs(nom: string): Record<string, number> {
  const n = nom.toLowerCase()
  const specs: Record<string, number> = {}
  const ram = extraireNombre(n, [/(\d+)\s*go\s+ram/i, /ram\s+(\d+)\s*go/i, /(\d+)go\s+(?:\d+go|ssd|hdd)/i])
  if (ram) specs.ram = ram
  const stockage = extraireNombre(n, [/(\d+)\s*(to|tb)\b/i, /(\d+)\s*(go|gb)\s*(?:ssd|hdd|emc|flash|stockage|disque)/i])
  if (stockage) specs.stockage = stockage
  const ecran = extraireNombre(n, [/"(\d+(?:\.\d+)?)\s*(?:pouces|")?/i, /(\d+(?:\.\d+)?)\s*(?:pouces|")\s/i])
  if (ecran) specs.ecran = ecran
  const ghz = extraireNombre(n, [/(\d+(?:\.\d+)?)\s*ghz/i])
  if (ghz) specs.ghz = ghz
  const mah = extraireNombre(n, [/(\d+)\s*mah/i])
  if (mah) specs.mah = mah
  const mp = extraireNombre(n, [/(\d+)\s*mp\b/i])
  if (mp) specs.mp = mp
  return specs
}

export default function GuideAchatPage({ categoriesActives }: { categoriesActives?: string[] | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ]               = useState(searchParams.get('q') ?? '')
  const [cat, setCat]           = useState(searchParams.get('cat') ?? '')
  const [budgetMin, setBudgetMin] = useState(searchParams.get('bMin') ?? '')
  const [budgetMax, setBudgetMax] = useState(searchParams.get('bMax') ?? '')
  const [poidsPrix, setPoidsPrix]   = useState(Number(searchParams.get('pp')) || 3)
  const [poidsSpecs, setPoidsSpecs] = useState(Number(searchParams.get('ps')) || 3)
  const [poidsDispo, setPoidsDispo] = useState(Number(searchParams.get('pd')) || 2)
  const [profilActif, setProfilActif] = useState<string | null>(searchParams.get('profil'))
  const [results, setResults]   = useState<Produit[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [total, setTotal]       = useState(0)
  const [triPar, setTriPar]     = useState<'score' | 'prix' | 'dispo'>('score')
  const [triSimple, setTriSimple] = useState<'pertinence' | 'prix_asc' | 'prix_desc' | 'nom_asc'>('pertinence')
  const [etatFiltre, setEtatFiltre] = useState(searchParams.get('etat') ?? '')
  const [dispoMin, setDispoMin] = useState(searchParams.get('dispoMin') ?? '')

  function appliquerProfil(id: string) {
    const p = PROFILS.find(p => p.id === id)
    if (!p) return
    setProfilActif(id)
    setPoidsPrix(p.poids.prix)
    setPoidsSpecs(p.poids.specs)
    setPoidsDispo(p.poids.dispo)
  }

  const lancer = useCallback(async () => {
    // Sync state to URL so browser Back restores filters
    const urlParams = new URLSearchParams()
    if (q)         urlParams.set('q', q)
    if (cat)       urlParams.set('cat', cat)
    if (budgetMin) urlParams.set('bMin', budgetMin)
    if (budgetMax) urlParams.set('bMax', budgetMax)
    if (etatFiltre) urlParams.set('etat', etatFiltre)
    if (dispoMin) urlParams.set('dispoMin', dispoMin)
    if (profilActif) urlParams.set('profil', profilActif)
    urlParams.set('pp', String(poidsPrix))
    urlParams.set('ps', String(poidsSpecs))
    urlParams.set('pd', String(poidsDispo))
    router.push(`/guide-achat?${urlParams.toString()}`, { scroll: false })

    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({
        q: q || '', categorie: cat, limit: '48', page: '1',
        prixMin: budgetMin || '', prixMax: budgetMax || '', tri: 'pertinence',
      })
      if (etatFiltre) params.set('etat', etatFiltre)
      const res  = await fetch(`${API}/api/produits?${params}`)
      const data = await res.json()
      const liste: Produit[] = ((data.produits as Produit[]) || []).filter(p => +p.prix_min > 0)

      if (!liste.length) { setResults([]); setTotal(0); setLoading(false); return }

      const prixMinRef      = Math.min(...liste.map(p => +p.prix_min))
      const nbOffresMaxRef  = Math.max(...liste.map(p => +(p.nb_offres) || 0)) || 1
      const specsListe      = liste.map(p => extraireSpecs(p.nom))
      const specKeys        = Array.from(new Set(specsListe.flatMap(s => Object.keys(s))))
      const specMaxes: Record<string, number> = {}
      for (const k of specKeys) {
        const vals = specsListe.map(s => s[k]).filter((v): v is number => v != null)
        specMaxes[k] = vals.length ? Math.max(...vals) : 0
      }

      const totalPoids = poidsPrix + poidsSpecs + poidsDispo

      const scored = liste.map((p, i) => {
        const sPrix  = prixMinRef / +p.prix_min
        const sp     = specsListe[i]
        const specWins = specKeys.filter(k => sp[k] != null && specMaxes[k] > 0 && sp[k] >= specMaxes[k] * 0.9).length
        const sSpecs = specKeys.length > 0 ? specWins / specKeys.length : 0.5
        const sDispo = (+(p.nb_offres) || 0) / nbOffresMaxRef
        const score  = Math.round(((poidsPrix * sPrix + poidsSpecs * sSpecs + poidsDispo * sDispo) / totalPoids) * 100) / 10
        return { ...p, _score: score, _sPrix: Math.round(sPrix * 100), _sDispo: Math.round(sDispo * 100) }
      })

      const dispoMinNum = Number(dispoMin) || 0
      const filtered = dispoMinNum > 0 ? scored.filter(p => (+p.nb_offres || 0) >= dispoMinNum) : scored

      setResults(filtered)
      setTotal(dispoMinNum > 0 ? filtered.length : (data.total || scored.length))
    } catch (e) {
      setError('Erreur lors de la recherche. Vérifiez votre connexion.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [q, cat, budgetMin, budgetMax, etatFiltre, dispoMin, poidsPrix, poidsSpecs, poidsDispo, profilActif, router])

  // Auto-lance la recherche si des params sont dans l'URL (navigation retour)
  useEffect(() => {
    if (searchParams.get('q') || searchParams.get('cat') || searchParams.get('bMax') || searchParams.get('etat') || searchParams.get('dispoMin')) {
      lancer()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sorted = [...results].sort((a, b) => {
    if (triSimple === 'prix_asc')  return +a.prix_min - +b.prix_min
    if (triSimple === 'prix_desc') return +b.prix_min - +a.prix_min
    if (triSimple === 'nom_asc')   return a.nom.localeCompare(b.nom)
    if (triPar === 'prix')  return +a.prix_min - +b.prix_min
    if (triPar === 'dispo') return (b._sDispo ?? 0) - (a._sDispo ?? 0)
    return (b._score ?? 0) - (a._score ?? 0)
  })

  const topProduit = sorted[0] ?? null

  return (
    <div className="guide-page">

      <PageHeader
        breadcrumb={[
          { label: 'Accueil', href: '/' },
          { label: 'Guide d\'achat' },
        ]}
        emoji="🏆"
        titre="Guide d'achat intelligent"
        compteur="Scoring personnalisé · 4 profils d'achat"
      />

      <Link href="/" className="guide-back-btn" style={{ marginBottom: 16 }}>← Retour</Link>

      <div className="guide-wrap">

        {/* ── Panneau gauche ── */}
        <div className="guide-left guide-left--navy">

          <div className="guide-section-label">Profil d&apos;achat</div>
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
            <label className="guide-label">Que recherchez-vous ?</label>
            <input
              className="guide-input"
              type="text"
              placeholder="ex: Samsung Galaxy A55, TV 55 pouces…"
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lancer()}
            />
          </div>

          <div className="guide-field">
            <label className="guide-label">Catégorie</label>
            <FiltresBar
              essentiels={[
                { key: 'cat-toutes', label: 'Toutes les catégories', active: cat === '', onClick: () => setCat('') },
                ...CATEGORIES.filter(c => !categoriesActives || categoriesActives.includes(c.slug)).map(c => ({ key: `cat-${c.slug}`, label: `${c.icon} ${c.label}`, active: cat === c.slug, onClick: () => setCat(c.slug) })),
              ]}
            />
          </div>

          <div className="guide-field">
            <label className="guide-label">État</label>
            <FiltresBar
              essentiels={[
                { key: 'etat-tous', label: 'Tous', active: etatFiltre === '', onClick: () => setEtatFiltre('') },
                { key: 'etat-neuf', label: 'Neuf', active: etatFiltre === 'neuf', onClick: () => setEtatFiltre('neuf') },
                { key: 'etat-occasion', label: 'Occasion', active: etatFiltre === 'occasion', onClick: () => setEtatFiltre('occasion') },
                { key: 'etat-reconditionne', label: 'Reconditionné', active: etatFiltre === 'reconditionne', onClick: () => setEtatFiltre('reconditionne') },
              ]}
            />
          </div>

          <div className="guide-field">
            <label className="guide-label">Disponible chez au moins</label>
            <input
              className="guide-input" type="number" min={0}
              placeholder="ex: 2 marchands"
              value={dispoMin} onChange={e => setDispoMin(e.target.value)}
            />
          </div>

          <div className="guide-budget-row">
            <div className="guide-field" style={{ flex: 1 }}>
              <label className="guide-label">Budget min (FCFA)</label>
              <input className="guide-input" type="number" placeholder="5 000" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} />
            </div>
            <div className="guide-field" style={{ flex: 1 }}>
              <label className="guide-label">Budget max (FCFA)</label>
              <input className="guide-input" type="number" placeholder="200 000" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} />
            </div>
          </div>

          <div className="guide-divider" />

          {[
            { id: 'prix',  label: '💰 Importance du prix',              val: poidsPrix,  set: setPoidsPrix  },
            { id: 'specs', label: '📊 Importance des caractéristiques', val: poidsSpecs, set: setPoidsSpecs },
            { id: 'dispo', label: '🏪 Importance de la disponibilité',  val: poidsDispo, set: setPoidsDispo },
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
            {loading ? '⏳ Analyse en cours…' : '🔍 Trouver les meilleurs produits'}
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
              <div style={{ fontSize: 52, opacity: .2, marginBottom: 16 }}>🏆</div>
              <div className="guide-empty-titre">Configurez vos critères</div>
              <div className="guide-empty-sub">Choisissez un profil ou ajustez les paramètres,<br />puis cliquez <strong>Trouver</strong>.</div>
            </div>
          )}

          {!loading && error && (
            <div className="guide-empty" style={{ color: 'var(--red)' }}>{error}</div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="guide-results-header">
                <span className="guide-results-count">{total} produit{total > 1 ? 's' : ''} · classés par scoring</span>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 6 }}>Scoring :</span>
                    <div className="guide-tri-btns" style={{ display: 'inline-flex' }}>
                      {(['score', 'prix', 'dispo'] as const).map(t => (
                        <button key={t} className={`guide-tri-btn${triPar === t ? ' active' : ''}`} onClick={() => setTriPar(t)}>
                          {t === 'score' ? '🏆 Score' : t === 'prix' ? '💰 Prix' : '🏪 Dispo'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 6 }}>Trier :</span>
                    <div className="guide-tri-btns" style={{ display: 'inline-flex' }}>
                      {([
                        ['pertinence', 'Pertinence'],
                        ['prix_asc', 'Prix ↑'],
                        ['prix_desc', 'Prix ↓'],
                        ['nom_asc', 'Nom A-Z'],
                      ] as const).map(([val, label]) => (
                        <button key={val} className={`guide-tri-btn${triSimple === val ? ' active' : ''}`} onClick={() => setTriSimple(val)}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="guide-results-grid">
                {sorted.map((p, idx) => (
                  <Link href={`/produit/${p.id}`} key={p.id} className="guide-result-card">
                    {idx === 0 && <div className="guide-result-badge">🥇 Meilleur score</div>}
                    <ExternalImg src={p.image_url} alt={p.nom} className="guide-result-img" />
                    <div className="guide-result-body">
                      <p className="guide-result-nom">{p.nom}</p>
                      <p className="guide-result-prix">{fcfa(p.prix_min)}</p>

                      <div className="guide-score-big">
                        <span className="guide-score-num">{p._score?.toFixed(1)}</span>
                        <span className="guide-score-denom">/10</span>
                      </div>

                      <div className="guide-bars">
                        <div className="guide-bar-row">
                          <span>💰 Prix</span>
                          <div className="guide-bar-track">
                            <div className="guide-bar-fill" style={{ width: `${p._sPrix}%`, background: '#2563eb' }} />
                          </div>
                          <span>{p._sPrix}%</span>
                        </div>
                        <div className="guide-bar-row">
                          <span>🏪 Dispo</span>
                          <div className="guide-bar-track">
                            <div className="guide-bar-fill" style={{ width: `${p._sDispo}%`, background: '#10b981' }} />
                          </div>
                          <span>{p._sDispo}%</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* CTA bas — meilleur produit */}
              {topProduit && (
                <div className="guide-cta-bas">
                  <div className="guide-cta-bas-info">
                    <span className="guide-cta-bas-label">🥇 Meilleur score</span>
                    <span className="guide-cta-bas-nom">{topProduit.nom}</span>
                    <span className="guide-cta-bas-prix">{fcfa(topProduit.prix_min)}</span>
                  </div>
                  <Link href={`/produit/${topProduit.id}`} className="guide-cta-bas-btn">
                    Voir la fiche →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <SeoCard
        titre="Pourquoi utiliser le guide d'achat intelligent Nopalou ?"
        blurbs={[
          { emoji: '🏆', text: 'Choisissez un profil (meilleur prix, rapport qualité/prix, haut de gamme, bien distribué…) et pondérez librement le prix, les caractéristiques et la disponibilité selon vos priorités.' },
          { emoji: '📊', text: 'Le score de chaque produit est recalculé en direct à partir des offres réelles des marchands du comparateur — jamais de classement sponsorisé.' },
        ]}
        chipRows={[
          {
            label: 'Catégories de produits',
            chips: CATEGORIES.map(c => ({ href: `/categorie/${c.slug}`, emoji: c.icon, label: c.label })),
          },
        ]}
        foot="Scoring recalculé à chaque recherche selon vos critères"
      />
    </div>
  )
}
