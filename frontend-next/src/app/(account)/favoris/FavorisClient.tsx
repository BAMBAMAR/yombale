'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import ExternalImg from '@/components/ExternalImg'

type FavType = 'produit' | 'immo' | 'telecom' | 'annonce'

interface FavEntry { id: string; type: FavType }

interface FavItem {
  id: string
  type: FavType
  nom: string
  souscategorie: string | null
  prix: number | null
  image_url: string | null
  href: string
}

const ENDPOINTS: Record<FavType, (id: string) => string> = {
  produit: id => `/api/produits/${id}`,
  immo:    id => `/api/immo/${id}`,
  telecom: id => `/api/telecom/${id}`,
  annonce: id => `/api/annonces/${id}`,
}

const HREFS: Record<FavType, (id: string) => string> = {
  produit: id => `/produit/${id}`,
  immo:    id => `/immo/${id}`,
  telecom: id => `/telecom/${id}`,
  annonce: id => `/annonces/${id}`,
}

function normaliser(type: FavType, id: string, raw: Record<string, unknown>): FavItem {
  const photo = Array.isArray(raw.photos) ? (raw.photos[0] as string) : null
  switch (type) {
    case 'immo':
      return {
        id, type, nom: raw.titre as string,
        souscategorie: raw.type_bien as string | null,
        prix: raw.prix as number | null,
        image_url: photo,
        href: HREFS.immo(id),
      }
    case 'telecom':
      return {
        id, type, nom: raw.nom as string,
        souscategorie: raw.operateur as string | null,
        prix: raw.prix as number | null,
        image_url: raw.image_url as string | null,
        href: HREFS.telecom(id),
      }
    case 'annonce':
      return {
        id, type, nom: raw.titre as string,
        souscategorie: raw.categorie_slug as string | null,
        prix: raw.prix as number | null,
        image_url: photo,
        href: HREFS.annonce(id),
      }
    case 'produit':
    default:
      return {
        id, type, nom: raw.nom as string,
        souscategorie: raw.marque as string | null,
        prix: raw.prix_min as number | null,
        image_url: raw.image_url as string | null,
        href: HREFS.produit(id),
      }
  }
}

function lireFavs(): FavEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem('nopalou_favs') || '[]')
    return raw.map((f: string | FavEntry) => typeof f === 'string' ? { id: f, type: 'produit' as const } : f)
  } catch { return [] }
}

export default function FavorisClient() {
  const [entries, setEntries] = useState<FavEntry[]>([])
  const [items, setItems]     = useState<FavItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = lireFavs()
    setEntries(stored)
    if (stored.length === 0) { setLoading(false); return }

    Promise.all(
      stored.map(({ id, type }) =>
        fetch(ENDPOINTS[type](id))
          .then(r => r.ok ? r.json() : null)
          .then(raw => raw ? normaliser(type, id, raw) : null)
          .catch(() => null)
      )
    ).then(results => {
      setItems(results.filter((it): it is FavItem => it !== null))
      setLoading(false)
    })
  }, [])

  function removeFav(id: string, type: FavType) {
    try {
      const next = entries.filter(f => !(f.id === id && f.type === type))
      localStorage.setItem('nopalou_favs', JSON.stringify(next))
      setEntries(next)
      setItems(its => its.filter(it => !(it.id === id && it.type === type)))
      window.dispatchEvent(new CustomEvent('nopalou:fav', { detail: { adding: false, nom: '', count: next.length } }))
    } catch {}
  }

  if (loading) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: 36, opacity: .4 }}>♥</span>
        <p>Chargement…</p>
      </div>
    )
  }

  if (entries.length === 0 || items.length === 0) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: 48 }}>♥</span>
        <p>Vous n&apos;avez pas encore de favoris.</p>
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>
          Cliquez sur ♥ sur un produit, une annonce, un bien immo ou un forfait pour l&apos;ajouter ici.
        </p>
        <Link href="/" className="budget-pill active" style={{ marginTop: 12 }}>
          Parcourir les produits
        </Link>
      </div>
    )
  }

  return (
    <div className="favs-grid">
      {items.map(it => (
        <div key={`${it.type}-${it.id}`} className="fav-card">
          <div className="fav-card-img">
            <ExternalImg src={it.image_url} alt={it.nom} fallbackClassName="fav-img-placeholder" />
          </div>
          <div className="fav-card-body">
            {it.souscategorie && <span className="fav-marque">{it.souscategorie}</span>}
            <h3 className="fav-nom">{it.nom}</h3>
            <p className="fav-prix">
              {it.prix ? fcfa(it.prix) : 'Prix non disponible'}
            </p>
          </div>
          <div className="fav-card-actions">
            <Link href={it.href} className="fav-btn-voir">
              Voir →
            </Link>
            <button
              onClick={() => removeFav(it.id, it.type)}
              className="fav-btn-remove"
              title="Retirer des favoris"
            >
              ♥ Retirer
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
