import type { Metadata } from 'next'
import '@/styles/produit.css'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftRight } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'
import { getOptionalSession } from '@/lib/dal'
import TrackRecent from './TrackRecent'

import {
  Produit,
  Offre,
  HistoriquePoint,
  ProduitSimilaire,
  CAT_SLUGS,
  buildJsonLd,
} from './components/types'
import HistoriqueChart from './components/HistoriqueChart'
import ProduitHeroCard from './components/ProduitHeroCard'
import ProduitVerdictCard from './components/ProduitVerdictCard'
import ProduitOffresList from './components/ProduitOffresList'
import ProduitSidebar from './components/ProduitSidebar'
import ProduitSimilairesTable from './components/ProduitSimilairesTable'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const { id } = await params
    const p = await apiFetch<Produit>(`/produits/${id}`)
    const titre = `${p.nom}${p.marque ? ` ${p.marque}` : ''} — Prix Sénégal | Nopalou`
    const prixStr = p.prix_min ? ` à partir de ${fcfa(p.prix_min)}` : ''
    const description = p.description
      ? p.description.slice(0, 155)
      : `Comparez le prix de ${p.nom} chez tous les vendeurs au Sénégal${prixStr}. Meilleure offre à Dakar et partout au Sénégal.`
    const canonical = `${BASE}/produit/${id}`
    return {
      title: titre,
      description,
      alternates: { canonical },
      openGraph: {
        title: titre,
        description,
        type: 'website',
        url: canonical,
        ...(p.image_url ? { images: [{ url: p.image_url }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title: titre,
        description,
        ...(p.image_url ? { images: [p.image_url] } : {}),
      },
    }
  } catch {
    return { title: 'Produit introuvable', robots: 'noindex' }
  }
}

export default async function FicheProduitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) notFound()

  let produit: Produit
  let offres: Offre[] = []
  let historique: HistoriquePoint[] = []
  let similaires: ProduitSimilaire[] = []

  const session = await getOptionalSession()

  try {
    produit = await apiFetch<Produit>(`/produits/${id}`)
  } catch {
    // Redirection automatique si résolveur d'entités trouve une autre route canonique
    try {
      const resolved = await apiFetch<{ found: boolean; type: string; url: string }>(
        `/entites/resoudre/${encodeURIComponent(id)}`
      )
      if (resolved && resolved.found && resolved.url && resolved.url !== `/produit/${id}`) {
        redirect(resolved.url)
      }
    } catch (rErr) {
      if ((rErr as any)?.digest?.startsWith('NEXT_REDIRECT')) throw rErr
    }

    // Émettre un vrai statut HTTP 404 (supprime les soft-404s toxiques pour Google)
    notFound()
  }

  await Promise.all([
    apiFetch<Offre[] | { offres?: Offre[]; data?: Offre[] }>(`/produits/${id}/offres`)
      .then(raw => {
        const list = Array.isArray(raw) ? raw : raw.offres ?? raw.data ?? []
        offres = list.map(o => ({ ...o, prix: o.prix != null ? Number(o.prix) : null }))
      })
      .catch(() => {}),
    apiFetch<HistoriquePoint[]>(`/produits/${id}/historique`)
      .then(raw => {
        historique = Array.isArray(raw) ? raw : []
      })
      .catch(() => {}),
    apiFetch<{ produits: ProduitSimilaire[] }>(`/produits/${id}/similaires`)
      .then(raw => {
        similaires = raw?.produits ?? []
      })
      .catch(() => {}),
  ])

  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let settings: Record<string, string> = {}
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
    if (r.ok) settings = await r.json()
  } catch {
    // handled by defaults in SponsoringProduitBtn
  }

  // Filtrage des offres suspectes et outliers
  const sansSupects = offres.filter(o => !o._suspect && o.prix != null && o.prix > 0)
  const sorted = [...sansSupects].sort((a, b) => a.prix! - b.prix!)
  const mediane = sorted.length ? sorted[Math.floor(sorted.length / 2)].prix! : 0
  const valides =
    mediane > 0
      ? sansSupects.filter(o => o.prix! >= mediane * 0.4 && o.prix! <= mediane * 2.0)
      : sansSupects
  const nbExclues = offres.length - valides.length

  const prixMin = valides.length ? Math.min(...valides.map(o => o.prix!)) : null
  const prixMax = valides.length ? Math.max(...valides.map(o => o.prix!)) : null
  const best = valides.find(o => o.prix === prixMin)
  const economie = prixMin && prixMax && prixMax > prixMin ? prixMax - prixMin : null

  // Produits similaires
  const catProduit = produit.categorie_nom ?? produit.categorie
  const GENERIQUES = new Set([
    'smart', 'avec', 'pour', 'noir', 'gris', 'blanc',
    'android', 'google', 'slim', 'full', 'dual', 'inch',
    'pouces', 'serie', 'mode', 'type', 'sans', 'dans', 'vers', 'this', 'that',
  ])
  function motsCles(nom: string): string[] {
    return nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 4 && !GENERIQUES.has(w))
  }

  const VARIANTES = ['pro', 'max', 'ultra', 'plus', 'mini', 'lite', 'se', 'fe']
  function variantes(nom: string): string[] {
    const tokens = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[\s,\-/]+/)
    return VARIANTES.filter(v => tokens.includes(v))
  }

  const ACCESSOIRE_RE = /\b(chargeur|cable|câble|adaptateur|support|housse|etui|étui|coque|sacoche|powerbank|power\s*bank)\b/i
  const produitEstAccessoire = ACCESSOIRE_RE.test(produit.nom)
  const variantesProduit = variantes(produit.nom)
  const motsProduit = motsCles(produit.nom)
  const seuilMots = motsProduit.length >= 2 ? 2 : 1

  const proches = (prixMin ? similaires.filter(p => {
    const catP = p.categorie_nom
    if (catProduit && catP && catP !== catProduit) return false
    if (ACCESSOIRE_RE.test(p.nom) !== produitEstAccessoire) return false
    const variantesP = variantes(p.nom)
    if (
      variantesP.length !== variantesProduit.length ||
      !variantesProduit.every(v => variantesP.includes(v))
    )
      return false
    const motsP = motsCles(p.nom)
    const motsCommuns = motsProduit.filter(w => motsP.includes(w)).length
    if (motsCommuns < seuilMots) return false
    const px = p.prix_min ? parseFloat(p.prix_min) : null
    if (!px) return false
    const ratio = px / prixMin!
    return ratio >= 0.35 && ratio <= 2.5
  }) : []).slice(0, 7)

  const meilleurSimilaire = proches.reduce((bestAcc, p) => {
    const px = p.prix_min ? parseFloat(p.prix_min) : null
    if (px == null) return bestAcc
    return !bestAcc || px < bestAcc.px ? { px, nom: p.nom, id: p.id, image_url: p.image_url } : bestAcc
  }, null as { px: number; nom: string; id: string; image_url: string | null } | null)
  const existeMoinsCher = !!(meilleurSimilaire && prixMin && meilleurSimilaire.px < prixMin)

  const idsComparaison = [String(produit.id), ...proches.slice(0, 2).map(p => p.id)].join(',')

  return (
    <>
      <TrackRecent id={produit.id} nom={produit.nom} prix_min={prixMin} image_url={produit.image_url} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildJsonLd(produit, valides) }} />

      <div className="fiche">
        {/* Fil d'Ariane */}
        {(() => {
          const catNom = produit.categorie_nom ?? produit.categorie
          const catSlug = catNom ? CAT_SLUGS[catNom] : undefined
          return (
            <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
              <Link href="/" style={{ color: 'var(--text2)' }}>Accueil</Link>
              {catNom && (
                <>
                  {' › '}
                  {catSlug ? (
                    <Link href={`/categorie/${catSlug}`} style={{ color: 'var(--text2)' }}>{catNom}</Link>
                  ) : (
                    <span>{catNom}</span>
                  )}
                </>
              )}
              {' › '}
              <span style={{ color: 'var(--text1)' }}>{produit.nom}</span>
            </nav>
          )
        })()}

        <div className="fiche-grid">
          {/* Colonne principale */}
          <div className="fiche-main">
            {/* Header produit & Hero visual */}
            <ProduitHeroCard produit={produit} prixMin={prixMin} best={best} />

            {/* Verdict Nopalou */}
            <ProduitVerdictCard
              valides={valides}
              best={best}
              prixMin={prixMin}
              prixMax={prixMax}
              economie={economie}
              historique={historique}
              existeMoinsCher={existeMoinsCher}
              meilleurSimilaire={meilleurSimilaire}
            />

            {/* Description */}
            {produit.description && <p className="fiche-desc">{produit.description}</p>}

            {/* Liste des offres */}
            <ProduitOffresList valides={valides} prixMin={prixMin} nbExclues={nbExclues} />

            {/* CTA comparaison mobile */}
            {proches.length > 0 && (
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <Link
                  href={`/comparaison?ids=${idsComparaison}`}
                  className="comparaison-cta-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <ArrowLeftRight size={15} />
                  <span>Comparaison détaillée côte à côte</span>
                </Link>
              </div>
            )}

            {/* Historique des prix */}
            <HistoriqueChart data={historique} />
          </div>

          {/* Sidebar résumé */}
          <ProduitSidebar
            produit={produit}
            prixMin={prixMin}
            best={best}
            session={session}
            settings={settings}
            idsComparaison={idsComparaison}
            prochesCount={proches.length}
          />
        </div>

        {/* Comparaison produits similaires */}
        <ProduitSimilairesTable
          produit={produit}
          prixMin={prixMin}
          valides={valides}
          best={best}
          proches={proches}
          existeMoinsCher={existeMoinsCher}
          idsComparaison={idsComparaison}
        />
      </div>
    </>
  )
}
