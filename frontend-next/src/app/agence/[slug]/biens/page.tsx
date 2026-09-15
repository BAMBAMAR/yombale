'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Home,
  Plus,
  Search,
  MapPin,
  Eye,
  Send,
  CheckCircle2,
  AlertCircle,
  Share2
} from 'lucide-react'

interface BienItem {
  id: string
  reference: string
  titre: string
  type_bien: string
  ville: string
  quartier?: string
  surface_m2?: number
  nb_pieces?: number
  nb_chambres?: number
  statut_occupation: string
  prix_location?: number
  prix_vente?: number
  meuble: boolean
  annonce_publiee_id?: string
  annonce_publiee_actif?: boolean
  nb_visites: number
  nb_baux_actifs: number
}

export default function BiensListPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [biens, setBiens] = useState<BienItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('tous')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [searchTerm, setSearchTerm] = useState('')
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  async function chargerBiens() {
    try {
      setLoading(true)
      let url = `/api/biens/agence/${slug}?statut=actif`
      if (filterType !== 'tous') url += `&type_bien=${filterType}`
      if (filterStatut !== 'tous') url += `&statut_occupation=${filterStatut}`
      if (searchTerm) url += `&recherche=${encodeURIComponent(searchTerm)}`

      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setBiens(data.biens || [])
      }
    } catch (err) {
      console.error('[LOAD_BIENS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerBiens()
  }, [slug, filterType, filterStatut])

  async function handlePublierAnnonce(bienId: string) {
    try {
      setPublishingId(bienId)
      const res = await fetch(`/api/biens/agence/${slug}/${bienId}/publier`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg('Annonce publiée avec succès sur Nopalou Immobilier !')
        chargerBiens()
        setTimeout(() => setToastMsg(null), 4000)
      }
    } catch (err) {
      console.error('[PUBLISH_ERR]', err)
    } finally {
      setPublishingId(null)
    }
  }

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Portefeuille de Biens</h1>
          <p className="agence-subtitle">Gérez vos propriétés, suivez leur occupation et publiez sur la marketplace.</p>
        </div>

        <Link
          href={`/agence/${slug}/biens/nouveau`}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <Plus size={18} />
          Ajouter un bien
        </Link>
      </div>

      {toastMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#DCFCE7',
            color: '#166534',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {/* ── Filtres & Recherche ── */}
      <div
        className="agence-card"
        style={{
          padding: 16,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Rechercher par titre, quartier, référence..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && chargerBiens()}
            className="form-input"
            style={{ padding: '8px 12px' }}
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="form-select"
          style={{ width: 'auto', padding: '8px 12px' }}
        >
          <option value="tous">Tous les types</option>
          <option value="appartement">Appartement</option>
          <option value="villa">Villa</option>
          <option value="studio">Studio</option>
          <option value="terrain">Terrain</option>
          <option value="bureau">Bureau / Commerce</option>
        </select>

        <select
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          className="form-select"
          style={{ width: 'auto', padding: '8px 12px' }}
        >
          <option value="tous">Tous les statuts</option>
          <option value="disponible">Disponible</option>
          <option value="loue">Loué</option>
          <option value="vendu">Vendu</option>
        </select>
      </div>

      {/* ── Tableau des Biens ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des biens...</p>
        </div>
      ) : biens.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <Home size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun bien trouvé</p>
          <p style={{ fontSize: 13.5 }}>Ajoutez votre premier bien immobilier pour commencer à gérer votre agence.</p>
        </div>
      ) : (
        <div className="agence-table-wrapper">
          <table className="agence-table">
            <thead>
              <tr>
                <th>Bien & Référence</th>
                <th>Type & Localisation</th>
                <th>Prix</th>
                <th>Occupation</th>
                <th>Marketplace</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {biens.map(bien => (
                <tr key={bien.id}>
                  <td>
                    <div style={{ fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>{bien.titre}</div>
                    <div style={{ fontSize: 11.5, color: '#64748B' }}>{bien.reference}</div>
                  </td>
                  <td>
                    <div style={{ textTransform: 'capitalize', fontWeight: 600 }}>{bien.type_bien}</div>
                    <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} />
                      {bien.quartier ? `${bien.quartier}, ${bien.ville}` : bien.ville}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                      {bien.prix_location
                        ? `${Number(bien.prix_location).toLocaleString('fr-FR')} FCFA/mois`
                        : bien.prix_vente
                        ? `${Number(bien.prix_vente).toLocaleString('fr-FR')} FCFA`
                        : 'Sur demande'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${bien.statut_occupation}`}>
                      {bien.statut_occupation}
                    </span>
                  </td>
                  <td>
                    {bien.annonce_publiee_id ? (
                      <span className="status-badge actif">
                        <CheckCircle2 size={12} />
                        En ligne
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={publishingId === bien.id}
                        onClick={() => handlePublierAnnonce(bien.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: 'rgba(199, 91, 0, 0.08)',
                          color: 'var(--accent, #C75B00)',
                          border: '1px solid rgba(199, 91, 0, 0.2)',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Send size={12} />
                        {publishingId === bien.id ? 'Publication...' : 'Publier'}
                      </button>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <Link
                        href={`/immo/${bien.annonce_publiee_id || bien.id}`}
                        target="_blank"
                        style={{
                          padding: '6px',
                          borderRadius: 6,
                          background: '#FAF8F5',
                          border: '1px solid var(--border, #E8DDD2)',
                          color: 'var(--navy, #1C2B4A)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Voir la fiche"
                      >
                        <Eye size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
