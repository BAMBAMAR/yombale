'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  infererGroupe, lireCompare, CAT_NOM_SLUG, MAX_COMPARE, GROUPE_LABELS,
  type CompareEntry,
} from '@/lib/comparaison'

interface Props {
  id: string | number
  nom: string
  type?: 'produit' | 'immo' | 'telecom' | 'annonce' | 'boutique_produit'
  categorie?: string | null   // nom DB ('Telephones') — cartes de l'accueil
  categorieSlug?: string      // slug direct — pages /categorie/[slug]
  boutiqueId?: string
}

interface FavEntry { id: string; type: string; boutiqueId?: string }

// nopalou_favs a historiquement stocké un tableau d'IDs bruts (produits uniquement).
// On accepte les deux formats en lecture et on réécrit toujours au nouveau format.
function lireFavs(): FavEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem('nopalou_favs') || '[]')
    return raw.map((f: string | FavEntry) => typeof f === 'string' ? { id: f, type: 'produit' } : f)
  } catch { return [] }
}

export default function CardActions({ id, nom, type = 'produit', categorie, categorieSlug, boutiqueId }: Props) {
  const sid = String(id)
  const [fav, setFav]         = useState(false)
  const [favAnim, setFavAnim] = useState(false)
  const [cmp, setCmp]         = useState(false)

  const router       = useRouter()
  const pathname     = usePathname()
  const [blocage, setBlocage] = useState<string | null>(null) // null = cliquable

  const monGroupe  = (type === 'produit' || type === 'boutique_produit') ? infererGroupe(nom) : ''
  const monCatSlug = categorieSlug || (categorie ? CAT_NOM_SLUG[categorie] : '') || ''

  function syncFav() {
    const favs = lireFavs()
    setFav(favs.some(f => f.id === sid && f.type === type))
  }

  function syncCmp() {
    const list = lireCompare()
    setCmp(list.some(i => i.id === sid))
    // Désactivation « zéro rejet » : uniquement quand une comparaison PRODUIT ou BOUTIQUE_PRODUIT est active.
    const estProduitType = type === 'produit' || type === 'boutique_produit'
    const premierType = list[0]?.type
    const estPremierProduitType = premierType === 'produit' || premierType === 'boutique_produit'
    
    if (list.length === 0 || !estPremierProduitType || list.some(i => i.id === sid)) {
      setBlocage(null)
      return
    }
    if (!estProduitType) {
      setBlocage('Comparaison produits en cours — videz-la pour comparer autre chose')
      return
    }
    const actif    = list[0].groupe || list[0].catSlug || ''
    const mien     = monGroupe || monCatSlug
    if (actif && mien && actif !== mien) {
      const label = GROUPE_LABELS[actif] || actif
      setBlocage(`Comparaison en cours limitée aux ${label}`)
    } else {
      setBlocage(null)
    }
  }

  useEffect(() => {
    syncFav(); syncCmp()
    window.addEventListener('nopalou:fav', syncFav)
    window.addEventListener('nopalou:compare', syncCmp)
    return () => {
      window.removeEventListener('nopalou:fav', syncFav)
      window.removeEventListener('nopalou:compare', syncCmp)
    }
  }, [sid])

  function toggleFav(e: React.MouseEvent) {
    e.preventDefault()
    try {
      const favs = lireFavs()
      const adding = !fav
      const next = adding
        ? [...favs, { id: sid, type, boutiqueId }]
        : favs.filter(f => !(f.id === sid && f.type === type))
      localStorage.setItem('nopalou_favs', JSON.stringify(next))
      setFav(adding)
      setFavAnim(true)
      setTimeout(() => setFavAnim(false), 600)
      window.dispatchEvent(new CustomEvent('nopalou:fav', { detail: { adding, nom, count: next.length } }))
    } catch {}
  }

  function toggleCompare(e: React.MouseEvent) {
    e.preventDefault()
    if (blocage) return // bouton rendu disabled — garde-fou
    try {
      const list = lireCompare()
      const already = list.some(i => i.id === sid)
      let next: CompareEntry[]
      if (already) {
        next = list.filter(i => i.id !== sid)
      } else {
        if (list.length >= MAX_COMPARE) return // silently ignore si déjà 3
        next = [...list, { id: sid, nom, type, groupe: monGroupe || undefined, catSlug: monCatSlug || undefined, boutiqueId } as any]
      }
      localStorage.setItem('nopalou_compare', JSON.stringify(next))
      setCmp(!already)
      window.dispatchEvent(new CustomEvent('nopalou:compare'))

      // Premier ajout d'un produit : pousser le filtre dans l'URL des pages liste.
      const estListe = pathname === '/' || /^\/categorie\/[^/]+$/.test(pathname)
      if (!already && list.length === 0 && type === 'produit' && estListe) {
        const params = new URLSearchParams(window.location.search)
        params.delete('page')
        if (monGroupe) {
          params.set('sousType', monGroupe)
          router.push(`${pathname}?${params.toString()}`)
        } else if (monCatSlug && pathname === '/') {
          params.set('categorie', monCatSlug)
          router.push(`${pathname}?${params.toString()}`)
        }
      }
    } catch {}
  }

  return (
    <div className="card-actions" onClick={e => e.preventDefault()}>
      <button
        onClick={toggleCompare}
        disabled={!!blocage}
        className={`card-action-btn${cmp ? ' active' : ''}`}
        title={blocage ?? (cmp ? 'Retirer de la comparaison' : 'Comparer')}
        aria-label={cmp ? `Retirer ${nom} de la comparaison` : `Ajouter ${nom} à la comparaison`}
        aria-disabled={!!blocage}
        style={blocage ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
      >
        ⚖
      </button>
      <button
        onClick={toggleFav}
        className={`card-action-btn card-action-btn--fav${fav ? ' active' : ''}${favAnim ? ' card-action-btn--pop' : ''}`}
        title={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        aria-label={fav ? `Retirer ${nom} des favoris` : `Ajouter ${nom} aux favoris`}
      >
        ♥
      </button>
    </div>
  )
}
