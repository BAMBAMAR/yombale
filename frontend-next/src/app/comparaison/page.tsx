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
  categorie_nom?: string | null
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
  { key: 'categorie_nom',  label: 'Catégorie' },
  { key: 'marque',         label: 'Marque' },
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

  // Calculs pour le Verdict Dynamique Nopalou
  const infos = items.map(({ produit, offres }) => {
    const valides = offres.filter(o => o.prix && o.prix > 0)
    const minPrice = valides.length ? Math.min(...valides.map(o => o.prix!)) : null
    const moinsChere = valides.length ? valides.reduce((a, b) => (a.prix! <= b.prix! ? a : b)) : null
    return {
      produit,
      offres,
      minPrice,
      moinsChere,
      specs: moinsChere?.specs || null
    }
  })

  const avecPrix = infos.filter((inf): inf is typeof inf & { minPrice: number } => inf.minPrice !== null)
  let budgetVerdictText: React.ReactNode = null
  if (avecPrix.length >= 2) {
    const sortedByPrice = [...avecPrix].sort((a, b) => a.minPrice - b.minPrice)
    const moinsCher = sortedByPrice[0]
    const plusCher = sortedByPrice[sortedByPrice.length - 1]
    const diffPrix = plusCher.minPrice - moinsCher.minPrice
    if (diffPrix > 0) {
      const pctEconomie = Math.round((diffPrix / plusCher.minPrice) * 100)
      budgetVerdictText = (
        <>
          <span className="comp-verdict-winner">{moinsCher.produit.nom}</span> est le choix le moins cher à <strong>{fcfa(moinsCher.minPrice)}</strong>. Vous économisez <strong>{fcfa(diffPrix)}</strong> (soit <strong>-{pctEconomie}%</strong>) par rapport à {plusCher.produit.nom}.
        </>
      )
    } else {
      budgetVerdictText = (
        <>
          Les produits comparés ont un prix de départ identique de <strong>{fcfa(moinsCher.minPrice)}</strong>.
        </>
      )
    }
  }

  interface VerdictBullet {
    icon: string
    text: React.ReactNode
  }

  const techBullets: VerdictBullet[] = []
  if (infos.length >= 2) {
    infos.forEach((infA) => {
      infos.forEach((infB) => {
        if (infA.produit.id === infB.produit.id) return
        if (infA.specs?.ram_go && infB.specs?.ram_go && infA.specs.ram_go > infB.specs.ram_go) {
          techBullets.push({
            icon: '⚡',
            text: <><strong>{infA.produit.nom}</strong> possède plus de mémoire vive ({infA.specs.ram_go} Go RAM contre {infB.specs.ram_go} Go).</>
          })
        }
        if (infA.specs?.stockage_go && infB.specs?.stockage_go && infA.specs.stockage_go > infB.specs.stockage_go) {
          techBullets.push({
            icon: '💾',
            text: <><strong>{infA.produit.nom}</strong> offre plus d'espace de stockage ({infA.specs.stockage_go} Go contre {infB.specs.stockage_go} Go).</>
          })
        }
        if (infA.specs?.ecran_pouces && infB.specs?.ecran_pouces && infA.specs.ecran_pouces > infB.specs.ecran_pouces) {
          techBullets.push({
            icon: '🖥️',
            text: <><strong>{infA.produit.nom}</strong> a un écran plus grand ({infA.specs.ecran_pouces}″ contre {infB.specs.ecran_pouces}″).</>
          })
        }
        if (infA.specs?.puissance_btu && infB.specs?.puissance_btu && infA.specs.puissance_btu > infB.specs.puissance_btu) {
          techBullets.push({
            icon: '❄️',
            text: <><strong>{infA.produit.nom}</strong> est plus puissant ({infA.specs.puissance_btu.toLocaleString('fr-FR')} BTU contre {infB.specs.puissance_btu.toLocaleString('fr-FR')} BTU).</>
          })
        }
        if (infA.specs?.capacite_kg && infB.specs?.capacite_kg && infA.specs.capacite_kg > infB.specs.capacite_kg) {
          techBullets.push({
            icon: '🧺',
            text: <><strong>{infA.produit.nom}</strong> a une plus grande capacité de lavage ({infA.specs.capacite_kg} kg contre {infB.specs.capacite_kg} kg).</>
          })
        }
        if (infA.specs?.capacite_litres && infB.specs?.capacite_litres && infA.specs.capacite_litres > infB.specs.capacite_litres) {
          techBullets.push({
            icon: '🥛',
            text: <><strong>{infA.produit.nom}</strong> a un plus grand volume ({infA.specs.capacite_litres} L contre {infB.specs.capacite_litres} L).</>
          })
        }
        if (infA.specs?.etat === 'neuf' && infB.specs?.etat && infB.specs.etat !== 'neuf') {
          const etatLabel = infB.specs.etat === 'occasion' ? 'd\'occasion' : 'reconditionné'
          techBullets.push({
            icon: '✨',
            text: <><strong>{infA.produit.nom}</strong> est disponible en état neuf, alors que le meilleur prix de <strong>{infB.produit.nom}</strong> est en état {etatLabel}.</>
          })
        }
      })
    })

    const sortedByOffres = [...infos].sort((a, b) => b.offres.length - a.offres.length)
    if (sortedByOffres[0].offres.length > sortedByOffres[1].offres.length + 1) {
      techBullets.push({
        icon: '🏪',
        text: <><strong>{sortedByOffres[0].produit.nom}</strong> offre plus de choix de marchands ({sortedByOffres[0].offres.length} vendeurs contre {sortedByOffres[1].offres.length}).</>
      })
    }
  }

  return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      <h1 className="comp-titre">Comparaison de produits</h1>
      <p className="comp-sous-titre">
        Comparez côte à côte les offres disponibles au Sénégal.
      </p>

      {avecPrix.length >= 2 && (
        <div className="comp-verdict-card">
          <div className="comp-verdict-header">
            <span>⚖️</span> Verdict Nopalou
          </div>
          <div className="comp-verdict-grid">
            {budgetVerdictText && (
              <div className="comp-verdict-col">
                <div className="comp-verdict-subtitle">💰 Budget</div>
                <ul className="comp-verdict-list">
                  <li className="comp-verdict-item">
                    <span className="comp-verdict-bullet">🏷️</span>
                    <span>{budgetVerdictText}</span>
                  </li>
                </ul>
              </div>
            )}
            {techBullets.length > 0 && (
              <div className="comp-verdict-col">
                <div className="comp-verdict-subtitle">⚡ Avantages techniques & Offre</div>
                <ul className="comp-verdict-list">
                  {techBullets.slice(0, 3).map((bullet, idx) => (
                    <li key={idx} className="comp-verdict-item">
                      <span className="comp-verdict-bullet">{bullet.icon}</span>
                      <span>{bullet.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

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
                  <Link href={(produit as any).is_boutique ? `/boutiques/${(produit as any).boutique_slug || (produit as any).boutique_id}/produits/${produit.id}` : `/produit/${produit.id}`} className="comp-prod-nom">
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
                          <Link href={(produit as any).is_boutique ? `/boutiques/${(produit as any).boutique_slug || (produit as any).boutique_id}/produits/${produit.id}` : `/produit/${produit.id}`} className="comp-mini-btn">
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
                  <Link href={(produit as any).is_boutique ? `/boutiques/${(produit as any).boutique_slug || (produit as any).boutique_id}/produits/${produit.id}` : `/produit/${produit.id}`} className="comp-fiche-btn">
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
