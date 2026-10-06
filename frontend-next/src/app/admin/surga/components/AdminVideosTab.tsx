'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Tv,
  Flame,
  Plus,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  RotateCw,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import AdminVideoSourceModal from './AdminVideoSourceModal'

export interface AdminVideoSource {
  id: string
  nom: string
  chaine_nom?: string
  type: 'SERIE' | 'LUTTE' | 'AUTRE'
  plateforme: string
  identifiant_flux: string
  actif: boolean
}

export default function AdminVideosTab() {
  const [sources, setSources] = useState<AdminVideoSource[]>([])
  const [chargement, setChargement] = useState(true)
  const [syncEnCours, setSyncEnCours] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  // Modale création / édition
  const [modalOuverte, setModalOuverte] = useState(false)
  const [editionId, setEditionId] = useState<string | null>(null)
  const [formNom, setFormNom] = useState('')
  const [formChaine, setFormChaine] = useState('')
  const [formType, setFormType] = useState<'SERIE' | 'LUTTE'>('SERIE')
  const [formFlux, setFormFlux] = useState('')
  const [formActif, setFormActif] = useState(true)
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false)

  const chargerSources = useCallback(async () => {
    setChargement(true)
    try {
      const res = await fetch('/api/admin/surga/videos/sources')
      const data = await res.json()
      if (data.success && Array.isArray(data.sources)) {
        setSources(data.sources)
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Impossible de charger les sources de vidéos.' })
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    chargerSources()
  }, [chargerSources])

  const handleSyncFlux = async () => {
    setSyncEnCours(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/surga/videos/sync', { method: 'POST' })
      const data = await res.json()
      if (data.succes) {
        setMessage({
          type: 'succes',
          texte: `Synchronisation réussie : ${data.nouvelles_videos_inserees} nouvelle(s) vidéo(s) insérée(s) sur ${data.sources_traitees} flux.`,
        })
        chargerSources()
      } else {
        setMessage({ type: 'erreur', texte: data.error || 'Erreur lors de la synchronisation des flux.' })
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Erreur réseau lors de la synchronisation.' })
    } finally {
      setSyncEnCours(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const ouvrirCreation = () => {
    setEditionId(null)
    setFormNom('')
    setFormChaine('')
    setFormType('SERIE')
    setFormFlux('')
    setFormActif(true)
    setModalOuverte(true)
  }

  const ouvrirEdition = (s: AdminVideoSource) => {
    setEditionId(s.id)
    setFormNom(s.nom)
    setFormChaine(s.chaine_nom || '')
    setFormType(s.type === 'LUTTE' ? 'LUTTE' : 'SERIE')
    setFormFlux(s.identifiant_flux)
    setFormActif(s.actif)
    setModalOuverte(true)
  }

  const handleEnregistrerSource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNom.trim() || !formFlux.trim()) {
      setMessage({ type: 'erreur', texte: 'Le nom et l identifiant de flux sont obligatoires.' })
      return
    }

    setSauvegardeEnCours(true)
    try {
      const url = editionId
        ? `/api/admin/surga/videos/sources/${editionId}`
        : '/api/admin/surga/videos/sources'
      const methode = editionId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method: methode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: formNom.trim(),
          chaine_nom: formChaine.trim(),
          type: formType,
          identifiant_flux: formFlux.trim(),
          plateforme: 'youtube',
          actif: formActif,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'succes', texte: data.message || 'Source enregistrée avec succès.' })
        setModalOuverte(false)
        chargerSources()
      } else {
        setMessage({ type: 'erreur', texte: data.error || 'Erreur lors de l enregistrement.' })
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Erreur réseau lors de l enregistrement.' })
    } finally {
      setSauvegardeEnCours(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  const handleSupprimerSource = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette source vidéo ?')) return

    try {
      const res = await fetch(`/api/admin/surga/videos/sources/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'succes', texte: 'Source supprimée avec succès.' })
        chargerSources()
      } else {
        setMessage({ type: 'erreur', texte: data.error || 'Erreur lors de la suppression.' })
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Erreur réseau lors de la suppression.' })
    } finally {
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const sourcesFiltrees = sources.filter((s) => {
    if (!recherche.trim()) return true
    const q = recherche.toLowerCase().trim()
    return s.nom.toLowerCase().includes(q) || (s.chaine_nom && s.chaine_nom.toLowerCase().includes(q))
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            backgroundColor: message.type === 'succes' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'succes' ? '#10B981' : '#EF4444',
            border: `1px solid ${message.type === 'succes' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {message.type === 'succes' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{message.texte}</span>
        </div>
      )}

      {/* En-tête actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '16px 20px',
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              backgroundColor: '#F8FAFC',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              width: 260,
            }}
          >
            <Search size={14} color="#94A3B8" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Filtrer une chaîne ou série..."
              style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: 13, width: '100%' }}
            />
          </div>
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
            {sourcesFiltrees.length} source(s) configurée(s)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleSyncFlux}
            disabled={syncEnCours}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RotateCw size={14} className={syncEnCours ? 'animate-spin' : ''} />
            <span>{syncEnCours ? 'Collecte...' : 'Lancer Collecte 30m'}</span>
          </button>

          <button
            type="button"
            onClick={ouvrirCreation}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#F59E0B',
              color: '#0F172A',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} />
            <span>Ajouter une chaîne / série</span>
          </button>
        </div>
      </div>

      {/* Tableau des sources */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 12, fontWeight: 700 }}>
              <th style={{ padding: '12px 16px' }}>Type</th>
              <th style={{ padding: '12px 16px' }}>Nom &amp; Titre</th>
              <th style={{ padding: '12px 16px' }}>Chaîne officielle</th>
              <th style={{ padding: '12px 16px' }}>Identifiant Flux YouTube</th>
              <th style={{ padding: '12px 16px' }}>Statut</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {chargement ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B' }}>
                  Chargement des sources vidéo...
                </td>
              </tr>
            ) : sourcesFiltrees.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B' }}>
                  Aucune source vidéo configurée.
                </td>
              </tr>
            ) : (
              sourcesFiltrees.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: s.type === 'LUTTE' ? '#FEF2F2' : '#EFF6FF',
                        color: s.type === 'LUTTE' ? '#DC2626' : '#2563EB',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {s.type === 'LUTTE' ? <Flame size={12} /> : <Tv size={12} />}
                      <span>{s.type}</span>
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>{s.nom}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{s.chaine_nom || '-'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>
                    {s.identifiant_flux}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 12,
                        backgroundColor: s.actif ? '#ECFDF5' : '#F1F5F9',
                        color: s.actif ? '#059669' : '#64748B',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {s.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => ouvrirEdition(s)}
                        title="Modifier"
                        style={{ padding: 6, borderRadius: 6, border: '1px solid #E2E8F0', background: '#FFFFFF', cursor: 'pointer' }}
                      >
                        <Edit2 size={13} color="#475569" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSupprimerSource(s.id)}
                        title="Supprimer"
                        style={{ padding: 6, borderRadius: 6, border: '1px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} color="#DC2626" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modale d'ajout / modification */}
      <AdminVideoSourceModal
        isOpen={modalOuverte}
        editionId={editionId}
        formNom={formNom}
        formChaine={formChaine}
        formType={formType}
        formFlux={formFlux}
        formActif={formActif}
        sauvegardeEnCours={sauvegardeEnCours}
        onClose={() => setModalOuverte(false)}
        onChangeNom={setFormNom}
        onChangeChaine={setFormChaine}
        onChangeType={setFormType}
        onChangeFlux={setFormFlux}
        onChangeActif={setFormActif}
        onSubmit={handleEnregistrerSource}
      />
    </div>
  )
}
