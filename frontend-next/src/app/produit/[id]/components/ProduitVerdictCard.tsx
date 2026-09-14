import React from 'react'
import Link from 'next/link'
import { Tag, Sparkles, TrendingDown, TrendingUp, Award, AlertCircle } from 'lucide-react'
import ExternalImg from '@/components/ExternalImg'
import { fcfa } from '@/lib/format'
import { Offre, HistoriquePoint } from './types'

interface ProduitVerdictCardProps {
  valides: Offre[]
  best?: Offre
  prixMin: number | null
  prixMax: number | null
  economie: number | null
  historique: HistoriquePoint[]
  existeMoinsCher: boolean
  meilleurSimilaire: { px: number; nom: string; id: string; image_url: string | null } | null
}

export default function ProduitVerdictCard({
  valides,
  best,
  prixMin,
  prixMax,
  economie,
  historique,
  existeMoinsCher,
  meilleurSimilaire,
}: ProduitVerdictCardProps) {
  if (valides.length === 0) return null

  // Calculate variation from history
  const chartPts = historique
    .map(d => ({
      jour: d.jour,
      min: parseFloat(d.prix_min),
    }))
    .filter(p => p.min > 0)

  const priceVariation =
    chartPts.length >= 2 && chartPts[0].min > 0
      ? ((chartPts[chartPts.length - 1].min - chartPts[0].min) / chartPts[0].min) * 100
      : 0

  // Collect unique specs across active offers
  const uniqueRams = Array.from(new Set(valides.map(o => o.specs?.ram_go).filter((x): x is number => typeof x === 'number')))
  const uniqueStockages = Array.from(new Set(valides.map(o => o.specs?.stockage_go).filter((x): x is number => typeof x === 'number')))
  const uniqueEtats = Array.from(new Set(valides.map(o => o.specs?.etat).filter(Boolean))) as string[]
  const uniqueBtus = Array.from(new Set(valides.map(o => o.specs?.puissance_btu).filter((x): x is number => typeof x === 'number')))
  const uniqueLitres = Array.from(new Set(valides.map(o => o.specs?.capacite_litres).filter((x): x is number => typeof x === 'number')))
  const uniqueKgs = Array.from(new Set(valides.map(o => o.specs?.capacite_kg).filter((x): x is number => typeof x === 'number')))
  const uniquePouces = Array.from(new Set(valides.map(o => o.specs?.ecran_pouces).filter((x): x is number => typeof x === 'number')))

  const bestSpecs = best?.specs
  const configBestParts: string[] = []
  if (bestSpecs) {
    if (bestSpecs.etat) configBestParts.push(bestSpecs.etat === 'neuf' ? 'Neuf' : bestSpecs.etat === 'occasion' ? 'Occasion' : 'Reconditionné')
    if (bestSpecs.ram_go) configBestParts.push(`${bestSpecs.ram_go} Go RAM`)
    if (bestSpecs.stockage_go) configBestParts.push(`${bestSpecs.stockage_go} Go`)
    if (bestSpecs.puissance_btu) configBestParts.push(`${bestSpecs.puissance_btu.toLocaleString('fr-FR')} BTU`)
    if (bestSpecs.capacite_litres) configBestParts.push(`${bestSpecs.capacite_litres} L`)
    if (bestSpecs.capacite_kg) configBestParts.push(`${bestSpecs.capacite_kg} Kg`)
    if (bestSpecs.ecran_pouces) configBestParts.push(`${bestSpecs.ecran_pouces}″`)
  }
  const configBestText = configBestParts.length > 0 ? ` (${configBestParts.join(', ')})` : ''

  const budgetBullets: React.ReactNode[] = []
  const techBullets: React.ReactNode[] = []

  // Best offer detail
  if (prixMin && best) {
    budgetBullets.push(
      <li key="best-price" className="comp-verdict-item" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Tag size={16} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
        <span>
          Meilleur prix de <strong>{fcfa(prixMin)}</strong> chez <strong>{best.marchand_nom ?? 'Vendeur'}</strong>
          {configBestText}.
        </span>
      </li>
    )
  }

  // Potential savings
  if (economie && prixMax && prixMin !== null && prixMax > prixMin) {
    const pct = Math.round((economie / prixMax) * 100)
    budgetBullets.push(
      <li key="savings" className="comp-verdict-item" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Sparkles size={16} style={{ color: 'var(--price)', marginTop: 2, flexShrink: 0 }} />
        <span>
          Jusqu&apos;à <strong>{fcfa(economie)} d&apos;économie</strong> (-{pct}%) possibles en choisissant le meilleur vendeur.
        </span>
      </li>
    )
  }

  // Price trend
  if (priceVariation !== 0) {
    const direction = priceVariation < 0 ? 'baissé' : 'augmenté'
    const trendIcon =
      priceVariation < 0 ? (
        <TrendingDown size={16} style={{ color: 'var(--price)', marginTop: 2, flexShrink: 0 }} />
      ) : (
        <TrendingUp size={16} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
      )
    const color = priceVariation < 0 ? 'var(--price)' : 'inherit'
    budgetBullets.push(
      <li key="trend" className="comp-verdict-item" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {trendIcon}
        <span>
          Tendance : Le prix le plus bas a <strong style={{ color }}>{direction} de {Math.abs(priceVariation).toFixed(1)}%</strong> sur les {chartPts.length} derniers jours.
        </span>
      </li>
    )
  }

  // Specs & Variants synthesis
  if (
    uniqueStockages.length > 0 ||
    uniqueRams.length > 0 ||
    uniqueEtats.length > 0 ||
    uniqueBtus.length > 0 ||
    uniqueLitres.length > 0 ||
    uniqueKgs.length > 0 ||
    uniquePouces.length > 0
  ) {
    const variantDetails: string[] = []
    if (uniqueStockages.length > 0) variantDetails.push(`${uniqueStockages.sort((a, b) => a - b).join(' Go / ')} Go`)
    if (uniqueRams.length > 0) variantDetails.push(`${uniqueRams.sort((a, b) => a - b).join(' Go / ')} Go RAM`)
    if (uniqueBtus.length > 0) variantDetails.push(`${uniqueBtus.sort((a, b) => a - b).map(b => b.toLocaleString('fr-FR')).join(' / ')} BTU`)
    if (uniqueLitres.length > 0) variantDetails.push(`${uniqueLitres.sort((a, b) => a - b).join(' / ')} L`)
    if (uniqueKgs.length > 0) variantDetails.push(`${uniqueKgs.sort((a, b) => a - b).join(' / ')} Kg`)
    if (uniquePouces.length > 0) variantDetails.push(`${uniquePouces.sort((a, b) => a - b).join(' / ')}″`)

    const etatsLabel = uniqueEtats.map(e => (e === 'neuf' ? 'Neuf' : e === 'occasion' ? 'Occasion' : 'Reconditionné')).join(', ')
    if (etatsLabel) variantDetails.push(etatsLabel)

    techBullets.push(
      <li key="variants" className="comp-verdict-item" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Award size={16} style={{ color: 'var(--navy)', marginTop: 2, flexShrink: 0 }} />
        <span>
          Variantes disponibles : <strong>{variantDetails.join(' · ')}</strong>.
        </span>
      </li>
    )
  }

  if (budgetBullets.length === 0 && techBullets.length === 0) return null

  return (
    <div className="comp-verdict-card" style={{ marginTop: 20, borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div
        className="comp-verdict-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#fcfaf7',
          borderBottom: '1px solid var(--border)',
          padding: '12px 16px',
          fontWeight: 700,
          color: 'var(--navy)',
        }}
      >
        <AlertCircle size={18} style={{ color: 'var(--navy)', marginRight: 8 }} />
        <span>Verdict & Conseils d&apos;Achat Nopalou</span>
      </div>
      <div className="comp-verdict-grid">
        {budgetBullets.length > 0 && (
          <div className="comp-verdict-col">
            <div className="comp-verdict-subtitle">Budget & Évolution</div>
            <ul className="comp-verdict-list">{budgetBullets}</ul>
          </div>
        )}
        {techBullets.length > 0 && (
          <div className="comp-verdict-col">
            <div className="comp-verdict-subtitle">Caractéristiques & Choix</div>
            <ul className="comp-verdict-list">{techBullets}</ul>
          </div>
        )}
      </div>

      {/* Alternative moins chère conseillée */}
      {existeMoinsCher && meilleurSimilaire && (
        <div className="comp-verdict-alternative-box">
          <div className="comp-verdict-alternative-img">
            <ExternalImg src={meilleurSimilaire.image_url} alt={meilleurSimilaire.nom} />
          </div>
          <div className="comp-verdict-alternative-info">
            <span className="comp-verdict-alternative-title">Alternative moins chère conseillée</span>
            Le modèle similaire <strong>{meilleurSimilaire.nom}</strong> est disponible à partir de <strong>{fcfa(meilleurSimilaire.px)}</strong>
            {prixMin && (
              <span> (soit <strong>-{Math.round(((prixMin - meilleurSimilaire.px) / prixMin) * 100)}%</strong> d&apos;économie).</span>
            )}
          </div>
          <Link href={`/produit/${meilleurSimilaire.id}`} className="comp-verdict-alternative-cta">
            Voir l&apos;alternative →
          </Link>
        </div>
      )}
    </div>
  )
}
