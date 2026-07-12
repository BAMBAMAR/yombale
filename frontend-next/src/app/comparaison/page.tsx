import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'
import ExternalImg from '@/components/ExternalImg'

export const metadata: Metadata = {
  title: 'Comparaison produits',
  description: 'Comparez côte à côte les prix et offres de plusieurs produits au Sénégal.',
}

interface Produit {
  id: string
  nom: string
  marque: string | null
  categorie: string | null
  prix_min: number | null
  prix_max: number | null
  image_url: string | null
  description: string | null
}

interface OffreSpecs {
  stockage_go?: number | null
  ram_go?: number | null
  couleur?: string | null
  etat?: 'neuf' | 'occasion' | 'reconditionne' | null
  puissance_btu?: number | null
  capacite_litres?: number | null
  capacite_kg?: number | null
  ecran_pouces?: number | null
}

interface Offre {
  id: number
  prix: number | null
  marchand_nom: string | null
  stock: boolean | null
  specs?: OffreSpecs | null
}

interface ProduitAvecOffres {
  produit: Produit
  offres: Offre[]
}

const SPECS = [
  { key: 'categorie',  label: 'Catégorie' },
  { key: 'marque',     label: 'Marque' },
]

export default async function ComparaisonPage({
  searchParams,
}: {
  searchParams: { ids?: string }
}) {
  const ids = (searchParams.ids ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 3)

  if (ids.length < 2) {
    return (
      <div className="page-container" style={{ paddingTop: '3rem' }}>
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>⚖</span>
          <p>Sélectionnez au moins 2 produits à comparer depuis la liste.</p>
          <Link href="/" className="budget-pill active" style={{ marginTop: 8 }}>
            Parcourir les produits
          </Link>
        </div>
      </div>
    )
  }

  const items: ProduitAvecOffres[] = (
    await Promise.all(
      ids.map(async id => {
        try {
          const [produit, offres] = await Promise.all([
            apiFetch<Produit>(`/produits/${id}`),
            apiFetch<Offre[]>(`/produits/${id}/offres`),
          ])
          return { produit, offres: Array.isArray(offres) ? offres : [] }
        } catch {
          return null
        }
      })
    )
  ).filter((x): x is ProduitAvecOffres => x !== null)

  if (items.length < 2) {
    return (
      <div className="page-container" style={{ paddingTop: '3rem' }}>
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>⚖</span>
          <p>Impossible de charger les produits demandés.</p>
          <Link href="/" className="budget-pill active" style={{ marginTop: 8 }}>Retour</Link>
        </div>
      </div>
    )
  }

  const meilleursIndex = (() => {
    let bestPrice = Infinity
    let bestIdx   = -1
    items.forEach(({ offres }, i) => {
      const min = Math.min(...offres.filter(o => o.prix).map(o => o.prix!))
      if (min < bestPrice) { bestPrice = min; bestIdx = i }
    })
    return bestIdx
  })()

  return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      <h1 className="comp-titre">Comparaison de produits</h1>
      <p className="comp-sous-titre">
        Comparez côte à côte les offres disponibles au Sénégal.
      </p>

      <div className="comp-table-wrap">
        <table className="comp-table">
          {/* En-têtes produits */}
          <thead>
            <tr>
              <th className="comp-th-label"></th>
              {items.map(({ produit }, i) => (
                <th key={produit.id} className={`comp-th${i === meilleursIndex ? ' comp-th--best' : ''}`}>
                  {i === meilleursIndex && (
                    <div className="comp-best-badge">Meilleur prix</div>
                  )}
                  <div className="comp-prod-img">
                    <ExternalImg src={produit.image_url} alt={produit.nom} fallbackClassName="comp-img-placeholder" />
                  </div>
                  <Link href={`/produit/${produit.id}`} className="comp-prod-nom">
                    {produit.nom}
                  </Link>
                  {produit.marque && (
                    <span className="comp-prod-marque">{produit.marque}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Prix minimum */}
            <tr className="comp-tr-section">
              <td className="comp-td-label">Prix le plus bas</td>
              {items.map(({ produit, offres }, i) => {
                const valides = offres.filter(o => o.prix && o.prix > 0)
                const min = valides.length
                  ? Math.min(...valides.map(o => o.prix!))
                  : null
                return (
                  <td key={produit.id} className={`comp-td${i === meilleursIndex ? ' comp-td--best' : ''}`}>
                    <span className={`comp-prix${i === meilleursIndex ? ' comp-prix--best' : ''}`}>
                      {min ? fcfa(min) : '—'}
                    </span>
                  </td>
                )
              })}
            </tr>

            {/* Nombre d'offres */}
            <tr>
              <td className="comp-td-label">Nb d&apos;offres</td>
              {items.map(({ produit, offres }) => (
                <td key={produit.id} className="comp-td">
                  {offres.filter(o => o.prix).length} vendeur{offres.filter(o => o.prix).length > 1 ? 's' : ''}
                </td>
              ))}
            </tr>

            {/* Caractéristiques de l'offre la moins chère */}
            <tr>
              <td className="comp-td-label">Caractéristiques</td>
              {items.map(({ produit, offres }) => {
                const valides = offres.filter(o => o.prix && o.prix > 0)
                const moinsChere = valides.length
                  ? valides.reduce((a, b) => (a.prix! <= b.prix! ? a : b))
                  : null
                const specs = moinsChere?.specs
                const aDesSpecs = specs && (specs.stockage_go || specs.ram_go || specs.couleur || specs.etat || specs.puissance_btu || specs.capacite_litres || specs.capacite_kg || specs.ecran_pouces)
                return (
                  <td key={produit.id} className="comp-td">
                    {aDesSpecs ? (
                      <div className="offre-specs" style={{ justifyContent: 'center' }}>
                        {specs!.ecran_pouces && <span className="offre-spec-badge">{specs!.ecran_pouces}″</span>}
                        {specs!.ram_go && <span className="offre-spec-badge">{specs!.ram_go} Go RAM</span>}
                        {specs!.stockage_go && <span className="offre-spec-badge">{specs!.stockage_go} Go</span>}
                        {specs!.puissance_btu && <span className="offre-spec-badge">{specs!.puissance_btu.toLocaleString('fr-FR')} BTU</span>}
                        {specs!.capacite_litres && <span className="offre-spec-badge">{specs!.capacite_litres} L</span>}
                        {specs!.capacite_kg && <span className="offre-spec-badge">{specs!.capacite_kg} Kg</span>}
                        {specs!.couleur && <span className="offre-spec-badge">{specs!.couleur}</span>}
                        {specs!.etat && (
                          <span className={`offre-spec-badge offre-spec-badge--${specs!.etat}`}>
                            {specs!.etat === 'neuf' ? 'Neuf' : specs!.etat === 'occasion' ? 'Occasion' : 'Reconditionné'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text3)' }}>—</span>
                    )}
                  </td>
                )
              })}
            </tr>

            {/* Specs communes */}
            {SPECS.map(spec => (
              <tr key={spec.key}>
                <td className="comp-td-label">{spec.label}</td>
                {items.map(({ produit }) => (
                  <td key={produit.id} className="comp-td">
                    {(produit as unknown as Record<string, string | null>)[spec.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}

            {/* Disponibilité */}
            <tr>
              <td className="comp-td-label">En stock</td>
              {items.map(({ produit, offres }) => {
                const enStock = offres.some(o => o.stock === true)
                return (
                  <td key={produit.id} className="comp-td">
                    {enStock ? '✅ Oui' : '❓ Non vérifié'}
                  </td>
                )
              })}
            </tr>

            {/* Offres détaillées */}
            <tr className="comp-tr-section">
              <td className="comp-td-label">Meilleures offres</td>
              {items.map(({ produit, offres }) => {
                const top3 = offres
                  .filter(o => o.prix && o.prix > 0)
                  .sort((a, b) => (a.prix ?? 0) - (b.prix ?? 0))
                  .slice(0, 3)
                return (
                  <td key={produit.id} className="comp-td comp-td-offres">
                    {top3.length === 0 ? (
                      <span style={{ color: 'var(--text3)' }}>Aucune offre</span>
                    ) : (
                      top3.map(o => (
                        <div key={o.id} className="comp-mini-offre">
                          <span className="comp-mini-marchand">{o.marchand_nom ?? 'Vendeur'}</span>
                          <span className="comp-mini-prix">{fcfa(o.prix)}</span>
                          <Link href={`/produit/${produit.id}`} className="comp-mini-btn">
                            Voir
                          </Link>
                        </div>
                      ))
                    )}
                  </td>
                )
              })}
            </tr>

            {/* CTA fiche */}
            <tr>
              <td className="comp-td-label"></td>
              {items.map(({ produit }) => (
                <td key={produit.id} className="comp-td">
                  <Link href={`/produit/${produit.id}`} className="comp-fiche-btn">
                    Voir la fiche →
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link href="/" className="budget-pill">← Retour aux produits</Link>
      </div>
    </div>
  )
}
