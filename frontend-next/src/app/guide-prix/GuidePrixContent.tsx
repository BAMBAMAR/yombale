'use client'

import { useState } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import ExternalImg from '@/components/ExternalImg'

interface Produit {
  id: string
  nom: string
  prix_min: number
  prix_max?: number
  nb_offres: number
  image_url?: string
  categorie?: string
}

interface Offre {
  marchand: string
  prix: number
  titre?: string
  url?: string
  stock?: boolean
}

interface Detail {
  produit: Produit
  offres: Offre[]
  historique?: { date: string; prix: number }[]
  prixMoyen?: number
}

const CATEGORIES = [
  { slug: 'smartphones',  label: 'Téléphones',     icon: '📱' },
  { slug: 'informatique', label: 'Informatique',    icon: '💻' },
  { slug: 'tv-electro',   label: 'TV & Électro',   icon: '📺' },
  { slug: 'mode',         label: 'Mode',            icon: '👗' },
  { slug: 'maison',       label: 'Maison',          icon: '🏠' },
  { slug: 'auto-moto',    label: 'Auto & Moto',     icon: '🛵' },
  { slug: 'jeux',         label: 'Jeux & Gaming',   icon: '🎮' },
  { slug: 'sport',        label: 'Sport & Fitness', icon: '⚽' },
  { slug: 'sante-beaute', label: 'Santé & Beauté',  icon: '💊' },
  { slug: 'alimentation', label: 'Alimentation',    icon: '🛒' },
]

export default function GuidePrixPage() {
  const [q, setQ]               = useState('')
  const [categorie, setCategorie] = useState('')
  const [results, setResults]   = useState<Produit[]>([])
  const [selected, setSelected] = useState<Detail | null>(null)
  const [loading, setLoading]   = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [searched, setSearched] = useState(false)

  async function search(e?: React.FormEvent) {
    e?.preventDefault()
    if (!q.trim() && !categorie) return
    setLoading(true)
    setSelected(null)
    setSearched(true)
    try {
      const qs = new URLSearchParams({ limit: '20' })
      if (q.trim()) qs.set('q', q.trim())
      if (categorie) qs.set('categorie', categorie)
      const r = await fetch(`/api/produits?${qs}`)
      const data = await r.json()
      setResults(data.produits ?? [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  async function voirDetail(produit: Produit) {
    setLoadingDetail(true)
    setSelected(null)
    try {
      const [offresRes, histoRes] = await Promise.allSettled([
        fetch(`/api/produits/${produit.id}/offres`),
        fetch(`/api/produits/${produit.id}/historique`),
      ])
      const offresRaw: unknown[] = offresRes.status === 'fulfilled' && offresRes.value.ok
        ? await offresRes.value.json() : []
      const histoData = histoRes.status === 'fulfilled' && histoRes.value.ok
        ? await histoRes.value.json() : []

      const rawList = Array.isArray(offresRaw) ? offresRaw : (offresRaw as Record<string, unknown[]>).offres ?? []
      const offresAll: Offre[] = (rawList as Record<string, unknown>[]).map(o => ({
        marchand: (o.marchand_nom ?? o.marchand) as string,
        prix: Number(o.prix),
        titre: (o.titre_affiche ?? o.titre_marchand ?? '') as string,
        url: (o.url_achat ?? o.url) as string | undefined,
        stock: o.stock as boolean | undefined,
      })).filter(o => o.prix > 0)

      // Filtrer les outliers : exclure les prix qui s'écartent de plus de 80% de la médiane
      const sorted = [...offresAll].sort((a, b) => a.prix - b.prix)
      const mediane = sorted.length ? sorted[Math.floor(sorted.length / 2)].prix : 0
      const offres = mediane > 0
        ? offresAll.filter(o => o.prix >= mediane * 0.3 && o.prix <= mediane * 2.5)
        : offresAll

      const prixList = offres.map(o => o.prix)
      const prixMin = prixList.length ? Math.min(...prixList) : produit.prix_min
      const prixMax = prixList.length ? Math.max(...prixList) : produit.prix_max
      const prixMoyen = prixList.length
        ? Math.round(prixList.reduce((s, p) => s + p, 0) / prixList.length)
        : undefined

      // Historique : l'API retourne { jour, prix_min, prix_max } — on utilise prix_min
      const histoRaw = Array.isArray(histoData) ? histoData : (histoData.historique ?? [])
      const historique = histoRaw.slice(-30).map((h: Record<string, unknown>) => ({
        date: h.jour as string,
        prix: Number(h.prix_min ?? h.prix ?? 0),
      })).filter((h: { prix: number }) => h.prix > 0)

      setSelected({
        produit: { ...produit, prix_min: prixMin, prix_max: prixMax, nb_offres: offres.length },
        offres,
        historique,
        prixMoyen,
      })
    } catch { /* show error gracefully */ }
    finally { setLoadingDetail(false) }
  }

  const _v = selected?.historique && selected.historique.length >= 2
    ? ((selected.historique.at(-1)!.prix - selected.historique[0].prix) / selected.historique[0].prix * 100)
    : null
  const variation = (_v !== null && isFinite(_v)) ? _v : null

  return (
    <div className="guide-prix-page">
      <div className="guide-prix-hero">
        <h1 className="guide-prix-titre">💡 Guide des prix</h1>
        <p className="guide-prix-desc">
          Recherchez un produit pour connaître son prix actuel au Sénégal,
          comparer les marchands et voir l&apos;évolution du prix dans le temps.
        </p>

        <form onSubmit={search} className="guide-prix-form">
          <div className="guide-prix-search-wrap">
            <input
              type="search"
              placeholder="Nom du produit, marque… ex: iPhone 14, Samsung A14"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="guide-prix-input"
            />
            <button type="submit" className="guide-prix-btn" disabled={loading}>
              {loading ? '…' : '🔍 Rechercher'}
            </button>
          </div>
          <div className="guide-prix-cats">
            <button type="button" onClick={() => { setCategorie(''); search() }}
              className={`budget-pill${categorie === '' ? ' active' : ''}`}>Tous</button>
            {CATEGORIES.map(c => (
              <button key={c.slug} type="button"
                onClick={() => { setCategorie(c.slug); }}
                className={`budget-pill${categorie === c.slug ? ' active' : ''}`}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      <div className="guide-prix-body">
        {/* Liste résultats */}
        <div className="guide-prix-liste">
          {!searched && !loading && (
            <div className="guide-prix-empty">
              <p style={{ fontSize: 36 }}>🔍</p>
              <p>Entrez le nom d&apos;un produit pour voir ses prix</p>
            </div>
          )}
          {loading && <p className="guide-prix-loading">Recherche en cours…</p>}
          {searched && !loading && results.length === 0 && (
            <div className="guide-prix-empty">
              <p>Aucun produit trouvé. Essayez un autre mot-clé.</p>
            </div>
          )}
          {results.map(p => (
            <button
              key={p.id}
              className={`guide-prix-item${selected?.produit.id === p.id ? ' guide-prix-item--active' : ''}`}
              onClick={() => voirDetail(p)}
            >
              <div className="guide-prix-item-img">
                <ExternalImg src={p.image_url} alt={p.nom} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div className="guide-prix-item-info">
                <p className="guide-prix-item-nom">{p.nom}</p>
                <p className="guide-prix-item-prix">
                  {p.prix_max && p.prix_max !== p.prix_min
                    ? <><span className="guide-prix-item-range">{fcfa(p.prix_min)} – {fcfa(p.prix_max)}</span></>
                    : <span>à partir de {fcfa(p.prix_min)}</span>
                  }
                  <span className="guide-prix-item-nb"> · {p.nb_offres} offre{p.nb_offres > 1 ? 's' : ''}</span>
                </p>
              </div>
              <span className="guide-prix-item-arrow">›</span>
            </button>
          ))}
        </div>

        {/* Détail */}
        <div className="guide-prix-detail">
          {loadingDetail && (
            <div className="guide-prix-empty"><p>Chargement du prix…</p></div>
          )}

          {!loadingDetail && !selected && searched && results.length > 0 && (
            <div className="guide-prix-empty">
              <p>👆 Cliquez sur un produit pour voir le détail des prix</p>
            </div>
          )}

          {!loadingDetail && selected && (() => {
            const { produit, offres, historique, prixMoyen } = selected
            const prixList = offres.map(o => o.prix).filter(p => p > 0)
            const prixMin = prixList.length ? Math.min(...prixList) : produit.prix_min
            const prixMax = prixList.length ? Math.max(...prixList) : produit.prix_max
            const ecart = prixMax && prixMax !== prixMin ? Math.round((prixMax - prixMin) / prixMin * 100) : 0
            const nbMarchands = offres.length
            const nbExclus = produit.nb_offres - offres.length

            return (
              <div className="guide-prix-fiche">
                <h2 className="guide-prix-fiche-titre">{produit.nom}</h2>
                <p className="guide-prix-fiche-meta">
                  Analyse basée sur <strong>{nbMarchands} marchand{nbMarchands > 1 ? 's' : ''}</strong> au Sénégal
                  {nbExclus > 0 && <span style={{ color: 'var(--text3)', marginLeft: 6 }}>· {nbExclus} offre{nbExclus > 1 ? 's' : ''} hors fourchette exclue{nbExclus > 1 ? 's' : ''}</span>}
                </p>

                {/* Résumé prix — 3 stats équilibrées */}
                <div className="guide-prix-resume">
                  <div className="guide-prix-stat guide-prix-stat--low">
                    <span className="guide-prix-stat-lbl">Prix le plus bas</span>
                    <span className="guide-prix-stat-val">{fcfa(prixMin)}</span>
                  </div>
                  {prixMoyen && (
                    <div className="guide-prix-stat guide-prix-stat--avg">
                      <span className="guide-prix-stat-lbl">Prix moyen</span>
                      <span className="guide-prix-stat-val">{fcfa(prixMoyen)}</span>
                    </div>
                  )}
                  {prixMax && prixMax !== prixMin && (
                    <div className="guide-prix-stat guide-prix-stat--high">
                      <span className="guide-prix-stat-lbl">Prix le plus élevé</span>
                      <span className="guide-prix-stat-val">{fcfa(prixMax)}</span>
                    </div>
                  )}
                  {ecart > 0 && (
                    <div className="guide-prix-stat guide-prix-stat--warning">
                      <span className="guide-prix-stat-lbl">Écart entre marchands</span>
                      <span className="guide-prix-stat-val">−{ecart}%</span>
                    </div>
                  )}
                  {variation !== null && (
                    <div className={`guide-prix-stat${variation < 0 ? ' guide-prix-stat--good' : variation > 0 ? ' guide-prix-stat--bad' : ''}`}>
                      <span className="guide-prix-stat-lbl">Évolution 30 jours</span>
                      <span className="guide-prix-stat-val">{variation > 0 ? '+' : ''}{variation.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                {/* Conseil */}
                <div className="guide-prix-conseil">
                  {variation !== null && variation < -5
                    ? '✅ Le prix baisse — bon moment pour acheter !'
                    : variation !== null && variation > 5
                    ? '⚠️ Le prix monte — comparez bien avant d\'acheter.'
                    : ecart >= 15
                    ? `💡 Écart de ${ecart}% entre les marchands — choisissez soigneusement.`
                    : '📊 Prix stable. Comparez les marchands ci-dessous pour le meilleur deal.'}
                </div>

                {/* Tableau marchands */}
                {offres.length > 0 && (
                  <div className="guide-prix-marchands">
                    <h3 className="guide-prix-section-titre">Prix par marchand</h3>
                    <div className="guide-prix-marchands-list">
                      {[...offres].sort((a, b) => a.prix - b.prix).map((o, i) => (
                        <div key={i} className={`guide-prix-marchand-row${i === 0 ? ' guide-prix-marchand-row--best' : ''}`}>
                          <div className="guide-prix-marchand-info">
                            {i === 0 && <span className="guide-prix-best-badge">🏷 Moins cher</span>}
                            <span className="guide-prix-marchand-nom">{o.marchand}</span>
                            {o.titre && <span className="guide-prix-marchand-desc">{o.titre}</span>}
                            {o.stock === false && <span className="guide-prix-stock-badge">Rupture</span>}
                          </div>
                          <span className="guide-prix-marchand-prix">{fcfa(o.prix)}</span>
                          {o.url && (
                            <a href={o.url} target="_blank" rel="noopener noreferrer" className="guide-prix-marchand-lien">
                              Voir →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historique graphique — uniquement si données valides */}
                {historique && historique.length > 1 && variation !== null && (
                  <div className="guide-prix-historique">
                    <h3 className="guide-prix-section-titre">Évolution du prix (30 derniers jours)</h3>
                    <HistoMini data={historique} />
                  </div>
                )}

                <Link href={`/produit/${produit.id}`} className="guide-prix-voir-fiche">
                  Voir la fiche complète →
                </Link>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

function HistoMini({ data }: { data: { date: string; prix: number }[] }) {
  const W = 340, H = 80, PAD = 8
  const prix = data.map(d => d.prix)
  const min = Math.min(...prix), max = Math.max(...prix)
  const range = max - min || 1
  const xs = data.map((_, i) => PAD + (i / (data.length - 1)) * (W - PAD * 2))
  const ys = prix.map(p => H - PAD - ((p - min) / range) * (H - PAD * 2))
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const area = `${path} L${xs.at(-1)!.toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
      <defs>
        <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#gp)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={xs.at(-1)!} cy={ys.at(-1)!} r="3.5" fill="var(--accent)" />
    </svg>
  )
}
