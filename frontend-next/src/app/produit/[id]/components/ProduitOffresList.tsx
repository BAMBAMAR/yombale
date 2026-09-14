import React from 'react'
import { AlertTriangle, Store } from 'lucide-react'
import { fcfa, tempsRelatif } from '@/lib/format'
import { Offre } from './types'

interface ProduitOffresListProps {
  valides: Offre[]
  prixMin: number | null
  nbExclues: number
}

export default function ProduitOffresList({
  valides,
  prixMin,
  nbExclues,
}: ProduitOffresListProps) {
  if (valides.length === 0) return null

  return (
    <div className="offres-section">
      <h2 className="offres-titre">
        Comparer les prix <span>{valides.length} offre{valides.length > 1 ? 's' : ''}</span>
        {nbExclues > 0 && (
          <span
            className="offres-exclues"
            title="Prix trop éloignés de la fourchette principale, probablement d'autres modèles"
          >
            · {nbExclues} hors fourchette
          </span>
        )}
      </h2>
      <div className="offres-list">
        {valides.map(o => {
          const isBest = o.prix === prixMin
          const ecart = !isBest && o.prix && prixMin ? o.prix - prixMin : 0
          const bgClass = isBest ? 'offre-row--best' : ''

          return (
            <div key={o.id} className={`offre-row-fiche ${bgClass}`}>
              <div className="offre-icon">
                <Store size={22} style={{ color: 'var(--navy)' }} />
              </div>
              <div className="offre-info">
                {isBest && <span className="offre-badge-best">Meilleur prix</span>}
                {o._suspect && (
                  <span className="offre-badge-suspect" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={12} />
                    <span>Prix suspect</span>
                  </span>
                )}
                <p className="offre-marchand">
                  {o.site_url ? (
                    <a href={o.site_url} target="_blank" rel="noopener noreferrer">
                      {o.marchand_nom ?? 'Marchand'}
                    </a>
                  ) : (
                    o.marchand_nom ?? 'Marchand'
                  )}
                </p>
                {o.titre_affiche && (
                  <p className="offre-ref" title={o.titre_affiche}>
                    {o.titre_affiche.slice(0, 60)}
                    {o.titre_affiche.length > 60 ? '…' : ''}
                  </p>
                )}
                {o.specs &&
                  (o.specs.stockage_go ||
                    o.specs.ram_go ||
                    o.specs.couleur ||
                    o.specs.etat ||
                    o.specs.puissance_btu ||
                    o.specs.capacite_litres ||
                    o.specs.capacite_kg ||
                    o.specs.ecran_pouces) && (
                    <div className="offre-specs">
                      {o.specs.ecran_pouces && <span className="offre-spec-badge">{o.specs.ecran_pouces}″</span>}
                      {o.specs.ram_go && <span className="offre-spec-badge">{o.specs.ram_go} Go RAM</span>}
                      {o.specs.stockage_go && <span className="offre-spec-badge">{o.specs.stockage_go} Go</span>}
                      {o.specs.puissance_btu && (
                        <span className="offre-spec-badge">{o.specs.puissance_btu.toLocaleString('fr-FR')} BTU</span>
                      )}
                      {o.specs.capacite_litres && <span className="offre-spec-badge">{o.specs.capacite_litres} L</span>}
                      {o.specs.capacite_kg && <span className="offre-spec-badge">{o.specs.capacite_kg} Kg</span>}
                      {o.specs.couleur && <span className="offre-spec-badge">{o.specs.couleur}</span>}
                      {o.specs.etat && (
                        <span className={`offre-spec-badge offre-spec-badge--${o.specs.etat}`}>
                          {o.specs.etat === 'neuf' ? 'Neuf' : o.specs.etat === 'occasion' ? 'Occasion' : 'Reconditionné'}
                        </span>
                      )}
                    </div>
                  )}
                {tempsRelatif(o.scraped_at) && (
                  <p className="offre-fraicheur">Mis à jour {tempsRelatif(o.scraped_at)}</p>
                )}
                {ecart > 0 && <p className="offre-ecart">+{fcfa(ecart)} de plus que le moins cher</p>}
              </div>
              <div className="offre-prix-col">
                <p className={`offre-prix${isBest ? ' offre-prix--best' : ''}`}>{fcfa(o.prix)}</p>
                {o.url_achat && (
                  <a
                    href={`/api/click/${o.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`offre-btn${isBest ? ' offre-btn--best' : ''}`}
                  >
                    Voir l&apos;offre →
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
