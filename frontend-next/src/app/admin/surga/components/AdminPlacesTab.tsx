'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  MapPin,
  Star,
  MessageCircle,
  X,
  RefreshCw,
  UtensilsCrossed,
} from 'lucide-react'

import AdminPlaceModal from './AdminPlaceModal'

export interface AdminPlaceItem {
  id: string
  nom: string
  categorie: string
  quartier: string
  ville?: string
  adresse: string
  budget_moyen_xof: number
  fourchette_prix: string
  tags_ambiance: string[]
  specialite: string
  note_moyenne: number
  nb_avis: number
  resume_honnete: string
  contact_tel?: string
  contact_whatsapp?: string
  horaires?: string
  photos?: string[]
  verifie: boolean
  actif: boolean
}

const CATEGORIES = [
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'dibiterie', label: 'Dibiterie' },
  { id: 'cafe_coworking', label: 'Café & Coworking' },
  { id: 'bord_de_mer', label: 'Bord de Mer' },
  { id: 'brunch_crepe', label: 'Brunch & Pâtisserie' },
]

export default function AdminPlacesTab() {
  const [places, setPlaces] = useState<AdminPlaceItem[]>([])
  const [chargement, setChargement] = useState<boolean>(true)
  const [filtreRecherche, setFiltreRecherche] = useState<string>('')
  const [filtreCategorie, setFiltreCategorie] = useState<string>('tous')
  const [modalOuverte, setModalOuverte] = useState<boolean>(false)
  const [placeEnEdition, setPlaceEnEdition] = useState<AdminPlaceItem | null>(null)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const chargerPlaces = useCallback(async () => {
    setChargement(true)
    try {
      const res = await fetch('/api/admin/surga/places?limit=100')
      const data = await res.json()
      if (data.success && Array.isArray(data.places)) {
        setPlaces(data.places)
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Impossible de charger les adresses' })
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    chargerPlaces()
  }, [chargerPlaces])

  const ouvrirCreation = () => {
    setPlaceEnEdition(null)
    setModalOuverte(true)
  }

  const ouvrirEdition = (place: AdminPlaceItem) => {
    setPlaceEnEdition(place)
    setModalOuverte(true)
  }

  const handleToggleActif = async (place: AdminPlaceItem) => {
    try {
      const res = await fetch(`/api/admin/surga/places/${place.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !place.actif }),
      })
      const data = await res.json()
      if (data.success) {
        chargerPlaces()
      }
    } catch {}
  }

  const handleSupprimer = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer définitivement cette adresse ?')) return
    try {
      const res = await fetch(`/api/admin/surga/places/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        chargerPlaces()
        setMessage({ type: 'succes', texte: 'Adresse supprimée' })
      }
    } catch {}
  }

  const placesFiltrees = places.filter((p) => {
    if (filtreCategorie !== 'tous' && p.categorie !== filtreCategorie) return false
    if (filtreRecherche) {
      const s = filtreRecherche.toLowerCase()
      return p.nom.toLowerCase().includes(s) || p.quartier.toLowerCase().includes(s) || p.specialite.toLowerCase().includes(s)
    }
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Barre de contrôle et recherche */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          backgroundColor: '#FFFFFF',
          padding: '14px 16px',
          borderRadius: 12,
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg, #F8F5F0)',
              borderRadius: 8,
              padding: '6px 10px',
              border: '1px solid var(--border, #E8DDD2)',
              width: '100%',
              maxWidth: 320,
              gap: 8,
            }}
          >
            <Search size={15} color="var(--text3, #73675E)" />
            <input
              type="text"
              placeholder="Rechercher une adresse, un quartier..."
              value={filtreRecherche}
              onChange={(e) => setFiltreRecherche(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: '100%' }}
            />
          </div>

          <select
            value={filtreCategorie}
            onChange={(e) => setFiltreCategorie(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 12,
              backgroundColor: '#FFFFFF',
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            <option value="tous">Toutes les catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={ouvrirCreation}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>Ajouter une adresse</span>
        </button>
      </div>

      {/* Message notification */}
      {message && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            backgroundColor: message.type === 'succes' ? 'rgba(10, 92, 54, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'succes' ? 'var(--price, #0A5C36)' : '#DC2626',
            border: `1px solid ${message.type === 'succes' ? 'rgba(10, 92, 54, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          }}
        >
          {message.texte}
        </div>
      )}

      {/* Tableau des adresses */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid var(--border, #E8DDD2)',
          overflow: 'hidden',
        }}
      >
        {chargement ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3, #73675E)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', display: 'block' }} />
            Chargement des adresses...
          </div>
        ) : placesFiltrees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3, #73675E)', fontSize: 13 }}>
            Aucune adresse trouvée. Cliquez sur &quot;Ajouter une adresse&quot; pour enrichir le catalogue.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg, #F8F5F0)', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Établissement</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Quartier &amp; Catégorie</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Budget &amp; Spécialité</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Contact WhatsApp</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Statut</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {placesFiltrees.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid var(--border, #E8DDD2)',
                      opacity: p.actif ? 1 : 0.6,
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{p.nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                        <Star size={11} fill="var(--accent, #C75B00)" color="var(--accent, #C75B00)" style={{ display: 'inline', marginRight: 3 }} />
                        {p.note_moyenne} ({p.nb_avis} avis)
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color="var(--accent, #C75B00)" />
                        <strong>{p.quartier}</strong>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>{p.categorie}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--price, #0A5C36)' }}>
                        ~{new Intl.NumberFormat('fr-SN').format(p.budget_moyen_xof)} FCFA
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.specialite}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {p.contact_whatsapp ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--price, #0A5C36)', fontSize: 12 }}>
                          <MessageCircle size={13} />
                          {p.contact_whatsapp}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text3, #73675E)', fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActif(p)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 700,
                          color: p.actif ? 'var(--price, #0A5C36)' : '#DC2626',
                        }}
                      >
                        {p.actif ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        <span>{p.actif ? 'Actif' : 'Inactif'}</span>
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => ouvrirEdition(p)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border, #E8DDD2)',
                            borderRadius: 6,
                            padding: '4px 8px',
                            cursor: 'pointer',
                            color: 'var(--navy, #1C2B4A)',
                          }}
                          title="Modifier"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSupprimer(p.id)}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: 6,
                            padding: '4px 8px',
                            cursor: 'pointer',
                            color: '#DC2626',
                          }}
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modale d'ajout / édition modulaire */}
      <AdminPlaceModal
        isOpen={modalOuverte}
        onClose={() => setModalOuverte(false)}
        placeEnEdition={placeEnEdition}
        categories={CATEGORIES}
        onSucces={(msg) => {
          chargerPlaces()
          setMessage({ type: 'succes', texte: msg })
        }}
      />
    </div>
  )
}

