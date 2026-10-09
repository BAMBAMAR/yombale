'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  Search,
  Sparkles,
  MapPin,
  Heart,
  RefreshCw,
  UtensilsCrossed,
  SlidersHorizontal,
} from 'lucide-react'
import SurgaChargementEchoue, { lireReponseSurga } from './SurgaChargementEchoue'
import SurgaPlaceCard, { type PlaceItem } from './SurgaPlaceCard'
import SurgaPlaceDetailModal from './SurgaPlaceDetailModal'

interface SurgaPlacesModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES_FILTRE = [
  { id: 'tous', label: 'Tout' },
  { id: 'restaurant', label: 'Restaurants' },
  { id: 'dibiterie', label: 'Dibiteries' },
  { id: 'cafe_coworking', label: 'Cafés & Cowork' },
  { id: 'bord_de_mer', label: 'Bord de mer' },
  { id: 'brunch_crepe', label: 'Brunchs' },
]

const QUARTIERS_POPULAIRES = [
  'Tous les quartiers',
  'Plateau',
  'Almadies',
  'Ngor',
  'Ouakam',
  'Point E',
  'Mermoz',
  'Fann',
  'Mamelles',
  'Yoff',
  'Médina',
  'Liberté',
  'Rufisque',
  'Pikine',
  'Guédiawaye',
  'Saly',
]

export default function SurgaPlacesModal({ isOpen, onClose }: SurgaPlacesModalProps) {
  const [places, setPlaces] = useState<PlaceItem[]>([])
  const [favorisIds, setFavorisIds] = useState<string[]>([])
  const [chargement, setChargement] = useState<boolean>(false)
  const [echec, setEchec] = useState<boolean>(false)
  const [onglets, setOnglets] = useState<'tous' | 'favoris'>('tous')
  const [rechercheTexte, setRechercheTexte] = useState<string>('')
  const [categorieChoisie, setCategorieChoisie] = useState<string>('tous')
  const [quartierChoisi, setQuartierChoisi] = useState<string>('Tous les quartiers')
  const [placeSelectionnee, setPlaceSelectionnee] = useState<PlaceItem | null>(null)

  // Charger les favoris depuis le backend
  const chargerFavoris = useCallback(async () => {
    try {
      const res = await fetch('/api/surga/places/favoris')
      const data = await res.json()
      if (data.success && Array.isArray(data.favoris)) {
        setFavorisIds(data.favoris.map((f: any) => f.place_id || f.id))
      }
    } catch {}
  }, [])

  // Charger ou filtrer les adresses
  const chargerPlaces = useCallback(async () => {
    setChargement(true)
    setEchec(false)
    try {
      let url = '/api/surga/places'
      const params = new URLSearchParams()
      params.append('limit', '100')
      if (categorieChoisie !== 'tous') params.append('categorie', categorieChoisie)
      if (quartierChoisi !== 'Tous les quartiers') params.append('quartier', quartierChoisi)
      if (rechercheTexte.trim()) params.append('q', rechercheTexte.trim())

      const queryStr = params.toString()
      if (queryStr) url += `?${queryStr}`

      const data = await lireReponseSurga(await fetch(url))
      setPlaces(Array.isArray(data.places) ? data.places : [])
    } catch {
      // Une liste gardée sans le dire passerait pour le résultat de la recherche en cours.
      setPlaces([])
      setEchec(true)
    } finally {
      setChargement(false)
    }
  }, [categorieChoisie, quartierChoisi, rechercheTexte])

  useEffect(() => {
    if (isOpen) {
      chargerPlaces()
      chargerFavoris()
    }
  }, [isOpen, chargerPlaces, chargerFavoris])

  // Basculer un favori
  const handleToggleFavori = async (place: PlaceItem) => {
    const estFavoriActuel = favorisIds.includes(place.id)
    const nouveauStatut = !estFavoriActuel

    // Mise à jour optimiste
    if (nouveauStatut) {
      setFavorisIds((prev) => [...prev, place.id])
    } else {
      setFavorisIds((prev) => prev.filter((id) => id !== place.id))
    }

    try {
      await fetch(`/api/surga/places/${place.id}/favori`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch {
      // Annulation si échec
      setFavorisIds((prev) => (nouveauStatut ? prev.filter((id) => id !== place.id) : [...prev, place.id]))
    }
  }

  if (!isOpen) return null

  // Filtrer les adresses selon l'onglet courant
  const placesAffichees = places
    .map((p) => ({ ...p, est_favori: favorisIds.includes(p.id) }))
    .filter((p) => {
      if (onglets === 'favoris') return p.est_favori
      return true
    })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UtensilsCrossed size={18} color="var(--accent, #C75B00)" />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Bons Plans &amp; Bonnes Adresses à Dakar
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: 'var(--text3, #73675E)',
            }}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barre de recherche d'envie en langage naturel */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border, #E8DDD2)', backgroundColor: 'var(--bg, #F8F5F0)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 10,
              border: '1px solid var(--border, #E8DDD2)',
              padding: '8px 12px',
              gap: 8,
            }}
          >
            <Search size={16} color="var(--text3, #73675E)" />
            <input
              type="text"
              placeholder="Ex : un dibi aux Almadies"
              value={rechercheTexte}
              onChange={(e) => setRechercheTexte(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: 13,
                color: 'var(--navy, #1C2B4A)',
                backgroundColor: 'transparent',
              }}
            />
            {rechercheTexte && (
              <button
                type="button"
                onClick={() => setRechercheTexte('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                aria-label="Effacer la recherche"
              >
                <X size={14} color="var(--text3, #73675E)" />
              </button>
            )}
          </div>

          {/* Onglets Tout / Favoris */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setOnglets('tous')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: onglets === 'tous' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                color: onglets === 'tous' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Toutes les adresses ({places.length})
            </button>
            <button
              type="button"
              onClick={() => setOnglets('favoris')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: onglets === 'favoris' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                color: onglets === 'favoris' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <Heart size={13} fill={onglets === 'favoris' ? '#FFFFFF' : 'var(--accent, #C75B00)'} />
              <span>Coups de cœur ({favorisIds.length})</span>
            </button>
          </div>

          {/* Filtres de catégories */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 10, paddingBottom: 2 }}>
            {CATEGORIES_FILTRE.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategorieChoisie(cat.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 14,
                  border: '1px solid',
                  borderColor: categorieChoisie === cat.id ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
                  backgroundColor: categorieChoisie === cat.id ? 'var(--accent, #C75B00)' : '#FFFFFF',
                  color: categorieChoisie === cat.id ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Filtre Quartier */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <MapPin size={13} color="var(--accent, #C75B00)" />
            <select
              value={quartierChoisi}
              onChange={(e) => setQuartierChoisi(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid var(--border, #E8DDD2)',
                backgroundColor: '#FFFFFF',
                fontSize: 12,
                color: 'var(--navy, #1C2B4A)',
                outline: 'none',
              }}
            >
              {QUARTIERS_POPULAIRES.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste des adresses */}
        <div className="surga-liste-fixe" style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chargement ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3, #73675E)', fontSize: 13 }}>
              <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 8px auto', display: 'block' }} />
              Recherche des meilleures adresses en cours...
            </div>
          ) : echec ? (
            <SurgaChargementEchoue message="Les adresses n’ont pas pu être chargées." onReessayer={chargerPlaces} />
          ) : placesAffichees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text2, #5A4E42)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px 0' }}>
                Aucune adresse trouvée pour cette recherche
              </p>
              <p style={{ fontSize: 12, color: 'var(--text3, #73675E)', margin: '0 0 14px 0' }}>
                Essayez d élargir vos critères de quartier ou de catégorie.
              </p>
              <button
                type="button"
                onClick={() => {
                  setRechercheTexte('')
                  setCategorieChoisie('tous')
                  setQuartierChoisi('Tous les quartiers')
                }}
                className="surga-btn-secondary"
                style={{ fontSize: 12, padding: '6px 14px' }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            placesAffichees.map((p) => (
              <SurgaPlaceCard
                key={p.id}
                place={p}
                onConsulter={(sel) => setPlaceSelectionnee(sel)}
                onToggleFavori={handleToggleFavori}
              />
            ))
          )}
        </div>
      </div>

      {/* Modale de détail */}
      <SurgaPlaceDetailModal
        place={placeSelectionnee ? { ...placeSelectionnee, est_favori: favorisIds.includes(placeSelectionnee.id) } : null}
        isOpen={Boolean(placeSelectionnee)}
        onClose={() => setPlaceSelectionnee(null)}
        onToggleFavori={handleToggleFavori}
      />
    </div>
  )
}
