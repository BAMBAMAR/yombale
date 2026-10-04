'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  GraduationCap,
  X,
  RefreshCw,
  FileText,
  Building,
} from 'lucide-react'

import AdminConcoursModal from './AdminConcoursModal'

export interface AdminConcoursItem {
  id: string
  slug: string
  titre: string
  sigle?: string
  organisme: string
  categorie: string
  niveau_requis: string
  age_max?: number | null
  frais_dossier_xof: number
  statut: 'ouvert' | 'a_venir' | 'cloture' | 'epreuves_en_cours' | 'resultats'
  date_ouverture?: string
  date_cloture: string
  date_epreuves?: string
  pieces_a_fournir?: string[]
  centres_prepa?: Array<{ nom: string; quartier: string; tel?: string }>
  description?: string
  lien_officiel?: string
}

export default function AdminConcoursTab() {
  const [concours, setConcours] = useState<AdminConcoursItem[]>([])
  const [chargement, setChargement] = useState<boolean>(true)
  const [filtreRecherche, setFiltreRecherche] = useState<string>('')
  const [filtreStatut, setFiltreStatut] = useState<string>('tous')
  const [modalOuverte, setModalOuverte] = useState<boolean>(false)
  const [concoursEnEdition, setConcoursEnEdition] = useState<AdminConcoursItem | null>(null)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const chargerConcours = useCallback(async () => {
    setChargement(true)
    try {
      const res = await fetch('/api/admin/surga/concours')
      const data = await res.json()
      if (data.success && Array.isArray(data.concours)) {
        setConcours(data.concours)
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Impossible de charger les concours' })
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    chargerConcours()
  }, [chargerConcours])

  const ouvrirCreation = () => {
    setConcoursEnEdition(null)
    setModalOuverte(true)
  }

  const ouvrirEdition = (c: AdminConcoursItem) => {
    setConcoursEnEdition(c)
    setModalOuverte(true)
  }

  const handleSupprimer = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce concours ?')) return
    try {
      const res = await fetch(`/api/admin/surga/concours/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        chargerConcours()
        setMessage({ type: 'succes', texte: 'Concours supprimé' })
      }
    } catch {}
  }

  const concoursFiltres = concours.filter((c) => {
    if (filtreStatut !== 'tous' && c.statut !== filtreStatut) return false
    if (filtreRecherche) {
      const s = filtreRecherche.toLowerCase()
      return c.titre.toLowerCase().includes(s) || (c.sigle && c.sigle.toLowerCase().includes(s)) || c.organisme.toLowerCase().includes(s)
    }
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Barre de recherche et filtres */}
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
              placeholder="Rechercher par sigle, titre ou ministère..."
              value={filtreRecherche}
              onChange={(e) => setFiltreRecherche(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: '100%' }}
            />
          </div>

          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 12,
              backgroundColor: '#FFFFFF',
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            <option value="tous">Tous les statuts</option>
            <option value="ouvert">Ouvert</option>
            <option value="a_venir">À venir</option>
            <option value="cloture">Clôturé</option>
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
            backgroundColor: 'var(--navy, #1C2B4A)',
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
          <span>Publier un concours</span>
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

      {/* Tableau des concours */}
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
            Chargement des concours...
          </div>
        ) : concoursFiltres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3, #73675E)', fontSize: 13 }}>
            Aucun concours trouvé.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg, #F8F5F0)', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Sigle &amp; Intitulé</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Organisme / Ministère</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Niveau Requis</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Date Clôture</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Statut</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {concoursFiltres.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border, #E8DDD2)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {c.sigle && (
                          <span
                            style={{
                              backgroundColor: 'var(--navy, #1C2B4A)',
                              color: '#FFFFFF',
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {c.sigle}
                          </span>
                        )}
                        <strong style={{ color: 'var(--navy, #1C2B4A)' }}>{c.titre}</strong>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', marginTop: 2 }}>
                        Frais : {new Intl.NumberFormat('fr-SN').format(c.frais_dossier_xof)} FCFA
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text2, #5A4E42)' }}>{c.organisme}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
                        {c.niveau_requis}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--accent, #C75B00)' }}>
                        <Clock size={13} />
                        <span>{new Date(c.date_cloture).toLocaleDateString('fr-SN')}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 6,
                          backgroundColor:
                            c.statut === 'ouvert'
                              ? 'rgba(10, 92, 54, 0.1)'
                              : c.statut === 'a_venir'
                              ? 'rgba(199, 91, 0, 0.1)'
                              : '#F3F4F6',
                          color:
                            c.statut === 'ouvert'
                              ? 'var(--price, #0A5C36)'
                              : c.statut === 'a_venir'
                              ? 'var(--accent, #C75B00)'
                              : 'var(--text3, #73675E)',
                        }}
                      >
                        {c.statut.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => ouvrirEdition(c)}
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
                          onClick={() => handleSupprimer(c.id)}
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
      <AdminConcoursModal
        isOpen={modalOuverte}
        onClose={() => setModalOuverte(false)}
        concoursEnEdition={concoursEnEdition}
        onSucces={(msg) => {
          chargerConcours()
          setMessage({ type: 'succes', texte: msg })
        }}
      />
    </div>
  )
}

