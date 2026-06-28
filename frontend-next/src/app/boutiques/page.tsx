import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import BoutiquesSearch from './BoutiquesSearch'

export const metadata: Metadata = {
  title: 'Boutiques partenaires — Nopalou',
  description: 'Découvrez les boutiques des vendeurs et particuliers sur Nopalou au Sénégal.',
}

interface Boutique {
  id: string
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  sponsorise: boolean
  sponsor_jusqu_au: string | null
  plan_actif: 'pro' | 'business' | null
  created_at: string
}

const CAT_ICONS: Record<string, string> = {
  smartphones: '📱', informatique: '💻', 'tv-electro': '📺',
  mode: '👗', maison: '🏠', 'auto-moto': '🚗', jeux: '🎮',
  services: '🛠', alimentation: '🥗', beaute: '💄', autre: '🏪',
}

const VILLES = ['Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Mbour']

export default async function BoutiquesPage({
  searchParams,
}: {
  searchParams: { ville?: string; q?: string; page?: string }
}) {
  const ville = searchParams.ville ?? ''
  const q     = searchParams.q     ?? ''
  const page  = searchParams.page  ?? '1'

  const qs = new URLSearchParams({ limit: '24', page })
  if (ville) qs.set('ville', ville)
  if (q)     qs.set('q', q)

  let boutiques: Boutique[] = []
  let total = 0
  try {
    const data = await apiFetch<{ boutiques: Boutique[]; total: number }>(`/boutiques?${qs}`)
    boutiques = data.boutiques
    total     = data.total
  } catch {}

  const totalPages  = Math.ceil(total / 24)
  const currentPage = Number(page)

  function buildLink(params: Record<string, string>) {
    const p = new URLSearchParams()
    if (ville) p.set('ville', ville)
    if (q)     p.set('q', q)
    Object.entries(params).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
    const s = p.toString()
    return `/boutiques${s ? `?${s}` : ''}`
  }

  return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      <div className="boutiques-header">
        <div>
          <h1 className="boutiques-titre">Boutiques <span style={{ color: 'var(--accent)' }}>partenaires</span></h1>
          <p className="boutiques-sous-titre">
            {total > 0 ? `${total} boutique${total > 1 ? 's' : ''} référencée${total > 1 ? 's' : ''}` : 'Découvrez nos vendeurs'}
          </p>
        </div>
        <Link href="/boutique" className="boutiques-creer-btn">🏪 Créer ma boutique</Link>
      </div>

      {/* Filtres */}
      <div className="boutiques-filtres">
        <BoutiquesSearch currentQ={q} currentVille={ville} />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {VILLES.map(v => (
            <Link key={v} href={buildLink({ ville: ville === v ? '' : v, page: '1' })} className={`budget-pill${ville === v ? ' active' : ''}`}>
              📍 {v}
            </Link>
          ))}
          {ville && <Link href={buildLink({ ville: '', page: '1' })} className="budget-pill budget-pill--reset">✕ Ville</Link>}
        </div>
      </div>

      {/* Grille */}
      {boutiques.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🏪</span>
          <p>Aucune boutique trouvée.</p>
          <Link href="/boutiques" className="budget-pill active" style={{ marginTop: 8 }}>Voir toutes</Link>
        </div>
      ) : (
        <div className="boutiques-grid">
          {boutiques.map(b => {
            const sponsorActif = b.sponsorise && (!b.sponsor_jusqu_au || new Date(b.sponsor_jusqu_au) > new Date())
            const estPro      = b.plan_actif === 'pro'
            const estBusiness = b.plan_actif === 'business'
            return (
              <Link href={`/boutiques/${b.id}`} key={b.id} className={`boutique-card${(sponsorActif || estPro || estBusiness) ? ' boutique-card--sponsor' : ''}`}>
                {estBusiness && (
                  <div className="boutique-sponsor-badge" style={{ background: '#1e3a5f' }}>💼 Business</div>
                )}
                {estPro && !estBusiness && (
                  <div className="boutique-sponsor-badge">⭐ Vendeur Pro</div>
                )}
                {sponsorActif && !estPro && !estBusiness && (
                  <div className="boutique-sponsor-badge">⭐ Partenaire</div>
                )}
                <div className="boutique-card-logo">
                  {b.logo_url
                    ? <img src={b.logo_url} alt={b.nom} loading="lazy" />
                    : <span>{CAT_ICONS[b.categorie ?? ''] ?? '🏪'}</span>
                  }
                </div>
                <div className="boutique-card-body">
                  <h3 className="boutique-card-nom">{b.nom}</h3>
                  {b.description && <p className="boutique-card-desc">{b.description.slice(0, 80)}{b.description.length > 80 ? '…' : ''}</p>}
                  <div className="boutique-card-meta">
                    {b.ville && <span>📍 {b.ville}</span>}
                    {b.categorie && <span>{CAT_ICONS[b.categorie] ?? ''} {b.categorie}</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          {currentPage > 1 && <Link href={buildLink({ page: String(currentPage - 1) })} className="page-btn">← Précédent</Link>}
          <span className="page-info">Page {currentPage} / {totalPages}</span>
          {currentPage < totalPages && <Link href={buildLink({ page: String(currentPage + 1) })} className="page-btn">Suivant →</Link>}
        </div>
      )}
    </div>
  )
}
