import type { Metadata } from 'next'
import Link from 'next/link'
import { cloudinaryHQ } from '@/lib/cloudinary'
import CardActions from '@/app/CardActions'
import PageHeader from '@/components/PageHeader'
import FiltresBar from '@/components/FiltresBar'
import SeoCard from '@/components/SeoCard'
import SearchWithAnchor from '@/app/SearchWithAnchor'

import { apiFetch } from '@/lib/api'

interface AnnoncesResponse {
  annonces: Annonce[]
  total: number
}

async function fetchAnnonces(
  categorie: string, page: number, tri: string,
  q: string, prixMax: string, ville: string, source: string
) {
  const params = new URLSearchParams({ limit: '24', page: String(page) })
  if (categorie) params.set('categorie', categorie)
  if (tri)       params.set('tri', tri)
  if (q)         params.set('q', q)
  if (prixMax)   params.set('prixMax', prixMax)
  if (ville)     params.set('ville', ville)
  if (source)    params.set('source', source)
  try {
    return await apiFetch<AnnoncesResponse>(`/annonces?${params}`)
  } catch { return { annonces: [], total: 0 } }
}

const CATEGORIES = [
  { slug: '',             label: 'Toutes',       emoji: '🗂' },
  { slug: 'smartphones',  label: 'Téléphones',   emoji: '📱' },
  { slug: 'informatique', label: 'Informatique', emoji: '💻' },
  { slug: 'tv-electro',   label: 'TV & Électro', emoji: '📺' },
  { slug: 'mode',         label: 'Mode',         emoji: '👗' },
  { slug: 'maison',       label: 'Maison',       emoji: '🏠' },
  { slug: 'auto-moto',    label: 'Auto & Moto',  emoji: '🚗' },
  { slug: 'immo',         label: 'Immobilier',   emoji: '🏡' },
  { slug: 'beaute',       label: 'Beauté',       emoji: '💄' },
  { slug: 'emploi',       label: 'Emploi',       emoji: '💼' },
  { slug: 'jeux',         label: 'Jeux',         emoji: '🎮' },
  { slug: 'services',     label: 'Services',     emoji: '🛠' },
  { slug: 'divers',       label: 'Divers',       emoji: '📦' },
]

const TRIS = [
  { val: '',          label: 'Récent' },
  { val: 'prix_asc',  label: 'Prix ↑' },
  { val: 'prix_desc', label: 'Prix ↓' },
]

const PRIX_MAX = [
  { label: '< 10k',  val: '10000'   },
  { label: '< 50k',  val: '50000'   },
  { label: '< 100k', val: '100000'  },
  { label: '< 500k', val: '500000'  },
]

const VILLES_SN = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Mbour', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Touba']

const SOURCES = [
  { val: '',         label: 'Toutes les sources' },
  { val: 'manuel',   label: 'Publiées sur Nopalou' },
  { val: 'facebook', label: 'Importées de Facebook' },
]

interface Annonce {
  id: string
  titre: string
  prix: number | null
  ville: string | null
  quartier: string | null
  categorie_slug: string
  photos: string[]
  contact_nom: string | null
  contact_tel: string
  created_at: string
}



function formatPrix(p: number | null) {
  if (!p) return 'Prix à négocier'
  return new Intl.NumberFormat('fr-SN').format(p) + ' FCFA'
}

function formatDate(s: string) {
  const d = new Date(s)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return d.toLocaleDateString('fr-SN', { day: '2-digit', month: 'short' })
}

function catLabel(slug: string) {
  return CATEGORIES.find(c => c.slug === slug)?.label ?? slug
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ categorie?: string }> }): Promise<Metadata> {
  const { categorie } = await searchParams
  const cat = CATEGORIES.find(c => c.slug === (categorie ?? ''))
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
  const titre = cat && cat.slug ? `Annonces ${cat.label} — Nopalou` : 'Annonces au Sénégal — Nopalou'
  const desc = cat && cat.slug
    ? `Petites annonces ${cat.label} entre particuliers au Sénégal — téléphones, voitures, électro, mode et plus.`
    : 'Achetez et vendez entre particuliers au Sénégal. Téléphones, informatique, mode, maison, auto, services.'
  return {
    title: titre,
    description: desc,
    alternates: { canonical: `${BASE}/annonces` },
    openGraph: {
      title: titre,
      description: desc,
      type: 'website',
      images: [{ url: '/api/og-image', width: 1200, height: 630, alt: titre }],
    },
  }
}

export default async function AnnoncesPage({
  searchParams,
}: {
  searchParams: Promise<{
    categorie?: string; page?: string; tri?: string
    q?: string; prixMax?: string; ville?: string; source?: string
  }>
}) {
  const {
    categorie = '', page: pageStr = '1', tri = '',
    q = '', prixMax = '', ville = '', source = '',
  } = await searchParams
  const page = Math.max(1, parseInt(pageStr))

  let categoriesActives: string[] | null = null
  try {
    const res = await fetch(`${BACKEND}/api/annonces/categories-actives`, { cache: 'no-store', headers: SSR_HEADERS })
    if (res.ok) {
      categoriesActives = await res.json()
    }
  } catch (e) {}

  const filteredCategories = CATEGORIES.filter(cat => !cat.slug || categoriesActives === null || categoriesActives.includes(cat.slug))

  const { annonces, total } = await fetchAnnonces(categorie, page, tri, q, prixMax, ville, source)

  const totalPages = Math.ceil(total / 24)
  const catActuelle = CATEGORIES.find(c => c.slug === categorie) ?? CATEGORIES[0]

  function buildLink(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    if (categorie) params.set('categorie', categorie)
    if (tri)       params.set('tri', tri)
    if (q)         params.set('q', q)
    if (prixMax)   params.set('prixMax', prixMax)
    if (ville)     params.set('ville', ville)
    if (source)    params.set('source', source)
    Object.entries(overrides).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)))
    const qs = params.toString()
    return `/annonces${qs ? `?${qs}` : ''}`
  }

  function pageUrl(p: number) {
    return buildLink({ page: p > 1 ? String(p) : '' })
  }

  return (
    <div className="annonces-page">
      {/* Header */}
      <PageHeader
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Annonces' }]}
        titre="Petites annonces — Sénégal"
        compteur={
          (total > 0 ? `${total.toLocaleString('fr-SN')} annonce${total > 1 ? 's' : ''}` : 'Aucune annonce')
          + (catActuelle.slug ? ` en ${catActuelle.label}` : '')
        }
        cta={{ label: '+ Publier une annonce', href: '/deposer-annonce' }}
      />

      {/* Recherche texte */}
      <SearchWithAnchor 
        action="/annonces" 
        defaultValue={q} 
        placeholder="Rechercher une annonce (ex: iphone, canapé, voiture…)"
        hiddenParams={{ categorie, tri, prixMax, ville, source }}
        clearLink={buildLink({ q: '' })}
      />

      {/* Filtres */}
      <FiltresBar
        essentiels={[
          ...filteredCategories.map(cat => ({
            key: `cat-${cat.slug || 'toutes'}`,
            label: `${cat.emoji} ${cat.label}`,
            href: buildLink({ categorie: cat.slug, page: '' }),
            active: cat.slug === categorie,
          })),
          ...PRIX_MAX.map(p => ({
            key: `prix-${p.val}`,
            label: p.label,
            href: buildLink({ prixMax: prixMax === p.val ? '' : p.val, page: '' }),
            active: prixMax === p.val,
          })),
          ...(prixMax ? [{
            key: 'reset-budget',
            label: '✕ Budget',
            href: buildLink({ prixMax: '', page: '' }),
            active: false,
            reset: true,
          }] : []),
        ]}
        secondaires={[
          ...VILLES_SN.map(v => ({
            key: `ville-${v}`,
            label: v,
            href: buildLink({ ville: ville === v ? '' : v, page: '' }),
            active: ville === v,
          })),
          ...SOURCES.map(s => ({
            key: `source-${s.val || 'toutes'}`,
            label: s.label,
            href: buildLink({ source: s.val, page: '' }),
            active: source === s.val,
          })),
        ]}
        tri={TRIS.map(t => ({
          key: `tri-${t.val || 'defaut'}`,
          label: t.label,
          href: buildLink({ tri: t.val, page: '' }),
          active: tri === t.val,
        }))}
      />

      {/* Grille */}
      {annonces.length === 0 ? (
        <div className="annonces-empty">
          <p>Aucune annonce{catActuelle.slug ? ` en ${catActuelle.label}` : ''} pour le moment.</p>
          <Link href="/deposer-annonce" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
            Soyez le premier à publier
          </Link>
        </div>
      ) : (
        <div id="resultats" className="annonces-grid">
          {(annonces as Annonce[]).map(a => {
            const photo = Array.isArray(a.photos) ? a.photos[0] : null
            return (
              <Link href={`/annonces/${a.id}`} key={a.id} className="annonce-pub-card" style={{ position: 'relative' }}>
                <CardActions id={a.id} nom={a.titre} type="annonce" />
                <div className="annonce-pub-img-wrap">
                  {photo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={cloudinaryHQ(photo, { width: 400 })} alt={a.titre} className="annonce-pub-img" />
                    : <div className="annonce-pub-img annonce-pub-img--vide">
                        <span>{CATEGORIES.find(c => c.slug === a.categorie_slug)?.emoji ?? '📦'}</span>
                      </div>
                  }
                  <span className="annonce-pub-cat">{catLabel(a.categorie_slug)}</span>
                </div>
                <div className="annonce-pub-body">
                  <p className="annonce-pub-titre">{a.titre}</p>
                  <p className="annonce-pub-prix">{formatPrix(a.prix)}</p>
                  <div className="annonce-pub-meta">
                    <span>{a.quartier ? `${a.quartier}, ` : ''}{a.ville ?? 'Dakar'}</span>
                    <span>{formatDate(a.created_at)}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="annonces-pagination">
          {page > 1 && (
            <Link href={pageUrl(page - 1)} className="pag-btn">← Précédent</Link>
          )}
          <span className="pag-info">Page {page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={pageUrl(page + 1)} className="pag-btn">Suivant →</Link>
          )}
        </div>
      )}

      <SeoCard
        titre="Pourquoi publier ou chercher une annonce sur Nopalou ?"
        blurbs={[
          {
            emoji: '🤝',
            text: (
              <>
                Nopalou regroupe les petites annonces entre particuliers au Sénégal — téléphones, informatique, mode,
                maison, auto et services — publiées directement sur le site ou importées de Facebook pour élargir le choix.
              </>
            ),
          },
          {
            emoji: '📢',
            text: (
              <>
                Publier une annonce est gratuit et rapide. Filtrez par catégorie, budget ou ville pour trouver
                exactement ce que vous cherchez, partout à <strong>Dakar</strong> et dans les grandes villes du Sénégal.
              </>
            ),
          },
        ]}
        chipRows={[
          {
            label: 'Catégories populaires',
            chips: filteredCategories.filter(c => c.slug).map(c => ({ href: buildLink({ categorie: c.slug, page: '' }), emoji: c.emoji, label: c.label, small: true })),
          },
        ]}
        foot="Nouvelles annonces publiées chaque jour par des particuliers au Sénégal"
      />
    </div>
  )
}
