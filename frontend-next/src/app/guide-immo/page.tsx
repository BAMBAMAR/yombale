'use client'

import { useState } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'

const API = ''  // proxy Next.js

const TYPES_BIEN = ['Appartement', 'Villa', 'Studio', 'Chambre', 'Bureau', 'Terrain']
const VILLES     = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Mbour', 'Saint-Louis', 'Ziguinchor', 'Kaolack']

interface AnnonceImmo {
  id: string; titre: string; prix: number; transaction: string; type_bien: string
  ville?: string; surface?: number; image_url?: string; description?: string
}

export default function GuideImmoPage() {
  const [transaction, setTransaction] = useState('location')
  const [typeBien, setTypeBien]       = useState('')
  const [budget, setBudget]           = useState('')
  const [ville, setVille]             = useState('')
  const [surfaceMin, setSurfaceMin]   = useState('')
  const [results, setResults]         = useState<AnnonceImmo[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  async function lancer() {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ limit: '24' })
      params.set('transaction', transaction)
      if (typeBien) params.set('type_bien', typeBien)
      if (budget)   params.set('prixMax', budget)
      if (ville)    params.set('ville', ville)
      if (surfaceMin) params.set('surfaceMin', surfaceMin)
      const res  = await fetch(`${API}/api/immo?${params}`)
      const data = await res.json()
      setResults((data.annonces ?? data) as AnnonceImmo[])
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
        <Link href="/immo" className="guide-back-btn">← Annonces</Link>
        <div>
          <div className="guide-topbar-titre" style={{ color: '#064e3b' }}>🏡 Guide immobilier</div>
          <div className="guide-topbar-sub">Trouvez votre logement idéal</div>
        </div>
      </div>

      <div className="guide-wrap">
        <div className="guide-left guide-left--navy">

          <div className="guide-section-label">Type de projet</div>
          <div className="guide-profil-row" style={{ marginBottom: 22 }}>
            {[{ val: 'location', label: '🏠 Location' }, { val: 'vente', label: '🔑 Achat / Vente' }].map(t => (
              <button
                key={t.val}
                className={`guide-profil-btn guide-profil-btn--sm${transaction === t.val ? ' active' : ''}`}
                style={transaction === t.val ? { borderColor: 'var(--accent)', background: 'var(--accent)' } : {}}
                onClick={() => setTransaction(t.val)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="guide-divider" />

          <div className="guide-field">
            <label className="guide-label">💰 Budget max (FCFA)</label>
            <input className="guide-input" type="number" placeholder="ex: 300 000" value={budget} onChange={e => setBudget(e.target.value)} />
          </div>

          <div className="guide-field">
            <label className="guide-label">Type de bien</label>
            <select className="guide-select" value={typeBien} onChange={e => setTypeBien(e.target.value)}>
              <option value="">Tous les types</option>
              {TYPES_BIEN.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="guide-field">
            <label className="guide-label">Ville</label>
            <select className="guide-select" value={ville} onChange={e => setVille(e.target.value)}>
              <option value="">Toutes les villes</option>
              {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="guide-field">
            <label className="guide-label">Surface min (m²) — optionnel</label>
            <input className="guide-input" type="number" placeholder="ex: 40" value={surfaceMin} onChange={e => setSurfaceMin(e.target.value)} />
          </div>

          <div style={{ flex: 1, minHeight: 16 }} />

          <button className="guide-lancer-btn" onClick={lancer} disabled={loading}>
            {loading ? '⏳ Recherche…' : '🔍 Trouver mon logement'}
          </button>
        </div>

        <div className="guide-right">
          {loading && <div className="guide-empty"><div className="guide-spinner" /><p>Recherche en cours…</p></div>}

          {!loading && !results.length && !error && (
            <div className="guide-empty">
              <div style={{ fontSize: 52, opacity: .2, marginBottom: 16 }}>🏡</div>
              <div className="guide-empty-titre">Configurez votre recherche</div>
              <div className="guide-empty-sub">Choisissez votre projet (location/achat),<br />budget et ville, puis cliquez <strong>Trouver</strong>.</div>
            </div>
          )}

          {!loading && error && <div className="guide-empty" style={{ color: 'var(--red)' }}>{error}</div>}

          {!loading && results.length > 0 && (
            <>
              <div className="guide-results-header">
                <span className="guide-results-count">{results.length} annonce{results.length > 1 ? 's' : ''} trouvée{results.length > 1 ? 's' : ''}</span>
              </div>
              <div className="guide-immo-grid">
                {results.map(a => (
                  <Link href={`/immo/${a.id}`} key={a.id} className="guide-immo-card">
                    {a.image_url && (
                      <img src={a.image_url} alt={a.titre} className="guide-immo-img" loading="lazy" />
                    )}
                    <div className="guide-immo-body">
                      <p className="guide-immo-titre">{a.titre}</p>
                      {a.ville && <p className="guide-immo-ville">📍 {a.ville}</p>}
                      {a.surface && <p className="guide-immo-surface">📐 {a.surface} m²</p>}
                      <p className="guide-immo-prix">{fcfa(a.prix)}{a.transaction === 'location' ? '/mois' : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
