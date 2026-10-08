'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  X,
  Tv,
  Flame,
  Bell,
  Search,
  Check,
  RotateCw,
  Layers,
} from 'lucide-react'
import SurgaChargementEchoue from './SurgaChargementEchoue'
import {
  toggleRappelVideo,
  estVideoRappelee,
} from '@/lib/surga-cross-actions'
import SurgaVideoCard from './SurgaVideoCard'

export interface VideoSource {
  id: string
  nom: string
  chaine_nom?: string
  type: 'SERIE' | 'LUTTE' | 'AUTRE'
  plateforme: string
  identifiant_flux: string
  actif: boolean
  est_abonne?: boolean
}

export interface VideoItem {
  id: string
  source_id: string
  source_nom?: string
  source_type?: 'SERIE' | 'LUTTE' | 'AUTRE'
  chaine_nom?: string
  titre: string
  url: string
  publie_le: string
  miniature_url?: string | null
}

interface SurgaVideosModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SurgaVideosModal({ isOpen, onClose }: SurgaVideosModalProps) {
  const [onglet, setOnglet] = useState<'tous' | 'series' | 'lutte' | 'abonnements'>('tous')
  const [sources, setSources] = useState<VideoSource[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(false)
  const [echec, setEchec] = useState(false)
  const [syncEnCours, setSyncEnCours] = useState(false)
  const [abonnementsLocaux, setAbonnementsLocaux] = useState<string[]>([])
  const [versionRappels, setVersionRappels] = useState(0)

  // Charger les abonnements locaux depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stockes = JSON.parse(localStorage.getItem('surga_video_abonnements') || '[]')
        if (Array.isArray(stockes)) {
          setAbonnementsLocaux(stockes)
        }
      } catch {}
    }
  }, [isOpen])

  // Écouter les changements de données (passerelles transversales)
  useEffect(() => {
    const handler = () => setVersionRappels((v) => v + 1)
    if (typeof window !== 'undefined') {
      window.addEventListener('surga-data-change', handler)
      return () => window.removeEventListener('surga-data-change', handler)
    }
  }, [])

  const chargerDonnees = useCallback(async () => {
    if (!isOpen) return
    setChargement(true)
    setEchec(false)
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('nopalou_session') || localStorage.getItem('token'))
        : null
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const [resSources, resVideos] = await Promise.all([
        fetch('/api/surga/videos/sources', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/surga/videos/derniers?limit=50', { headers }).then((r) => r.json()).catch(() => ({ success: false })),
      ])

      if (resSources.success && Array.isArray(resSources.sources)) {
        setSources(resSources.sources)
        // Mettre à jour les abonnements locaux si connecté
        const abosServeur = resSources.sources.filter((s: VideoSource) => s.est_abonne).map((s: VideoSource) => s.id)
        if (abosServeur.length > 0) {
          setAbonnementsLocaux(abosServeur)
          try {
            localStorage.setItem('surga_video_abonnements', JSON.stringify(abosServeur))
          } catch {}
        }
      }

      if (resVideos.success && Array.isArray(resVideos.videos)) {
        setVideos(resVideos.videos)
      } else {
        setEchec(true)
      }
    } catch {
      setEchec(true)
    } finally {
      setChargement(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      chargerDonnees()
    }
  }, [isOpen, chargerDonnees])

  const handleToggleAbonnement = async (sourceId: string) => {
    // 1. Optimistic update local
    const existe = abonnementsLocaux.includes(sourceId)
    const nouveau = existe
      ? abonnementsLocaux.filter((id) => id !== sourceId)
      : [...abonnementsLocaux, sourceId]

    setAbonnementsLocaux(nouveau)
    try {
      localStorage.setItem('surga_video_abonnements', JSON.stringify(nouveau))
    } catch {}

    // 2. Appel serveur si connecté
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('nopalou_session') || localStorage.getItem('token'))
      : null

    if (token) {
      try {
        await fetch(`/api/surga/videos/abonnements/${sourceId}/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ canal: 'in_app' }),
        })
      } catch {}
    }
  }

  const handleToggleRappel = (video: VideoItem) => {
    toggleRappelVideo({
      id: video.id,
      titre: video.titre,
      url: video.url,
      publie_le: video.publie_le,
    })
    setVersionRappels((v) => v + 1)
  }

  const handleRafraichir = async () => {
    setSyncEnCours(true)
    await chargerDonnees()
    setTimeout(() => setSyncEnCours(false), 500)
  }

  const videosFiltrees = useMemo(() => {
    let liste = [...videos]
    if (onglet === 'series') {
      liste = liste.filter((v) => v.source_type === 'SERIE')
    } else if (onglet === 'lutte') {
      liste = liste.filter((v) => v.source_type === 'LUTTE')
    } else if (onglet === 'abonnements') {
      liste = liste.filter((v) => abonnementsLocaux.includes(v.source_id))
    }

    if (recherche.trim()) {
      const q = recherche.toLowerCase().trim()
      liste = liste.filter(
        (v) =>
          v.titre.toLowerCase().includes(q) ||
          (v.source_nom && v.source_nom.toLowerCase().includes(q))
      )
    }
    return liste
  }, [videos, onglet, abonnementsLocaux, recherche])

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--surga-border, #E2E8F0)' }}>
        {/* En-tête */}
        <div style={{ padding: '14px 18px', backgroundColor: 'var(--surga-bg, #F8FAFC)', borderBottom: '1px solid var(--surga-border, #E2E8F0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(15, 23, 42, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--surga-navy, #1C2B4A)' }}>
              <Tv size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--surga-navy, #1C2B4A)' }}>
                Séries TV &amp; Lutte du Sénégal
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                Alertes de sorties et vidéos officielles &bull; Mode Low-Data
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={handleRafraichir}
              disabled={syncEnCours}
              title="Rafraîchir"
              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center' }}
            >
              <RotateCw size={16} className={syncEnCours ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              backgroundColor: '#F8FAFC',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
            }}
          >
            <Search size={14} color="#94A3B8" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un épisode, une série ou un combat..."
              style={{
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                width: '100%',
                fontSize: 12,
                color: '#0F172A',
              }}
            />
            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche('')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Onglets navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderBottom: '1px solid #F1F5F9',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {[
            { key: 'tous', label: 'Toutes', icon: Layers },
            { key: 'series', label: 'Séries TV', icon: Tv },
            { key: 'lutte', label: 'Lutte', icon: Flame },
            { key: 'abonnements', label: `Mes suivis (${abonnementsLocaux.length})`, icon: Bell },
          ].map((t) => {
            const Icon = t.icon
            const estActif = onglet === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setOnglet(t.key as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: 'none',
                  backgroundColor: estActif ? 'var(--surga-navy, #1C2B4A)' : '#F1F5F9',
                  color: estActif ? '#FFFFFF' : '#475569',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  flexShrink: 0,
                }}
              >
                <Icon size={13} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* Corps défilable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Section 1 : Sources & Boutons Suivre */}
          <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Chaînes officielles à suivre pour vos alertes :
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sources.map((s) => {
                const estSuivi = abonnementsLocaux.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleToggleAbonnement(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 10px',
                      borderRadius: 16,
                      border: estSuivi ? '1px solid #059669' : '1px solid #CBD5E1',
                      backgroundColor: estSuivi ? '#ECFDF5' : '#FFFFFF',
                      color: estSuivi ? '#065F46' : '#334155',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {estSuivi ? <Check size={12} color="#059669" /> : <Bell size={12} color="#64748B" />}
                    <span>{s.nom.split('(')[0].trim()}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2 : Liste des sorties vidéos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Dernières parutions ({videosFiltrees.length})</span>
              <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>Lien direct YouTube</span>
            </div>

            {chargement ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: '#64748B' }}>
                Chargement des sorties récentes...
              </div>
            ) : echec ? (
              <SurgaChargementEchoue message="Les vidéos n’ont pas pu être chargées." onReessayer={chargerDonnees} />
            ) : videosFiltrees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', backgroundColor: '#F8FAFC', borderRadius: 8, fontSize: 12, color: '#64748B' }}>
                {onglet === 'abonnements'
                  ? 'Vous ne suivez aucune chaîne pour le moment. Cliquez sur "Suivre" ci-dessus pour recevoir vos alertes.'
                  : 'Aucune vidéo trouvée pour cette recherche.'}
              </div>
            ) : (
              videosFiltrees.map((v) => {
                const estRappele = estVideoRappelee({ id: v.id, titre: v.titre })
                return (
                  <SurgaVideoCard
                    key={v.id}
                    video={v}
                    estRappele={estRappele}
                    onToggleRappel={handleToggleRappel}
                  />
                )
              })
            )}
          </div>
        </div>

        {/* Pied de modale */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#64748B',
          }}
        >
          <span>Surga ne copie ni n héberge aucune vidéo.</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: '#E2E8F0',
              color: '#1E293B',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
