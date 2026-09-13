import React from 'react'
import Link from 'next/link'
import { ArrowLeftRight } from 'lucide-react'
import ExternalImg from '@/components/ExternalImg'
import SimilRow from '@/components/SimilRow'
import { fcfa } from '@/lib/format'
import { Produit, Offre, ProduitSimilaire, parseSpecsFromName } from './types'

interface ProduitSimilairesTableProps {
  produit: Produit
  prixMin: number | null
  valides: Offre[]
  best?: Offre
  proches: ProduitSimilaire[]
  existeMoinsCher: boolean
  idsComparaison: string
}

export default function ProduitSimilairesTable({
  produit,
  prixMin,
  valides,
  best,
  proches,
  existeMoinsCher,
  idsComparaison,
}: ProduitSimilairesTableProps) {
  if (!prixMin) return null

  // Ligne du produit courant (toujours incluse)
  const lignes = [
    {
      id: String(produit.id),
      nom: produit.nom,
      image_url: produit.image_url,
      px: prixMin,
      nb: valides.length,
      courant: true,
      specs: best?.specs || null,
    },
    ...proches.map(p => ({
      id: p.id,
      nom: p.nom,
      image_url: p.image_url,
      px: p.prix_min ? parseFloat(p.prix_min) : null,
      nb: p.nb_offres ? parseInt(p.nb_offres) : 0,
      courant: false,
      specs: null,
    })),
  ].sort((a, b) => (a.px ?? 999999) - (b.px ?? 999999))

  if (lignes.length <= 1) return null

  const meilleuxPrix = lignes[0]?.px ?? prixMin
  const courantEstMeilleur = !existeMoinsCher

  return (
    <section className="similaires-section">
      <h2 className="similaires-titre">Comparer les prix du marché</h2>
      <p className="similaires-sous-titre">
        {courantEstMeilleur
          ? 'Ce produit a le meilleur prix de sa catégorie parmi les références comparées.'
          : `Un produit similaire est disponible à partir de ${fcfa(meilleuxPrix!)} — voir ci-dessous.`}
      </p>
      <table className="similaires-table">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Caractéristiques</th>
            <th>Prix le plus bas</th>
            <th>Offres</th>
            <th>vs ce produit</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, idx) => {
            const ecartPct =
              !l.courant && l.px && prixMin ? Math.round(((l.px - prixMin) / prixMin) * 100) : null
            const isBest = idx === 0

            const parsedSpecs = l.specs || parseSpecsFromName(l.nom)
            const hasSpecs = !!(
              parsedSpecs.stockage_go ||
              parsedSpecs.ram_go ||
              parsedSpecs.ecran_pouces ||
              parsedSpecs.puissance_btu ||
              parsedSpecs.capacite_litres ||
              parsedSpecs.capacite_kg
            )

            return (
              <SimilRow key={l.id} id={l.id} basePath="/produit" courant={l.courant}>
                <td>
                  <div className="simil-produit-cell">
                    <div className="simil-img-wrap">
                      <ExternalImg
                        src={l.image_url}
                        alt={l.nom}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div>
                      <span className="simil-nom">{l.nom}</span>
                      {l.courant && <span className="simil-courant-badge">Ce produit</span>}
                    </div>
                  </div>
                </td>
                <td>
                  {hasSpecs ? (
                    <div className="offre-specs" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
                      {parsedSpecs.ecran_pouces && <span className="offre-spec-badge">{parsedSpecs.ecran_pouces}″</span>}
                      {parsedSpecs.ram_go && <span className="offre-spec-badge">{parsedSpecs.ram_go} Go RAM</span>}
                      {parsedSpecs.stockage_go && <span className="offre-spec-badge">{parsedSpecs.stockage_go} Go</span>}
                      {parsedSpecs.puissance_btu && (
                        <span className="offre-spec-badge">{parsedSpecs.puissance_btu.toLocaleString('fr-FR')} BTU</span>
                      )}
                      {parsedSpecs.capacite_litres && (
                        <span className="offre-spec-badge">{parsedSpecs.capacite_litres} L</span>
                      )}
                      {parsedSpecs.capacite_kg && <span className="offre-spec-badge">{parsedSpecs.capacite_kg} Kg</span>}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text3)' }}>—</span>
                  )}
                </td>
                <td>
                  <span className={`simil-prix-val${isBest ? ' simil-prix-val--best' : ''}`}>
                    {l.px ? fcfa(l.px) : '—'}
                  </span>
                </td>
                <td>
                  <span className="simil-offres-val">
                    {l.nb > 0 ? `${l.nb} offre${l.nb > 1 ? 's' : ''}` : '—'}
                  </span>
                </td>
                <td>
                  {l.courant ? (
                    <span className="simil-ecart simil-ecart--egale">référence</span>
                  ) : (
                    <span
                      className={`simil-ecart ${
                        ecartPct !== null && ecartPct < -2
                          ? 'simil-ecart--moins'
                          : ecartPct !== null && ecartPct > 2
                          ? 'simil-ecart--plus'
                          : 'simil-ecart--egale'
                      }`}
                    >
                      {ecartPct === null
                        ? '—'
                        : ecartPct < -2
                        ? `${ecartPct}% moins cher`
                        : ecartPct > 2
                        ? `+${ecartPct}% plus cher`
                        : '≈ même prix'}
                    </span>
                  )}
                </td>
                <td>
                  {l.courant ? (
                    <span className="simil-courant-lbl">Vous êtes ici</span>
                  ) : (
                    <span className="simil-voir-btn">Voir →</span>
                  )}
                </td>
              </SimilRow>
            )
          })}
        </tbody>
      </table>
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link
          href={`/comparaison?ids=${idsComparaison}`}
          className="comparaison-cta-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <ArrowLeftRight size={16} />
          <span>Comparaison détaillée côte à côte</span>
        </Link>
      </div>
    </section>
  )
}
