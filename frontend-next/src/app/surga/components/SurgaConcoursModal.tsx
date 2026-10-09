'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  GraduationCap,
  Bell,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react'
import SurgaChargementEchoue from './SurgaChargementEchoue'
import SurgaConcoursCard, { ConcoursItem } from './SurgaConcoursCard'
import SurgaConcoursDetailModal from './SurgaConcoursDetailModal'

interface SurgaConcoursModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenAuth?: () => void
}

export default function SurgaConcoursModal({ isOpen, onClose, onOpenAuth }: SurgaConcoursModalProps) {
  const [onglet, setOnglet] = useState<'tous' | 'suivis'>('tous')
  const [concours, setConcours] = useState<ConcoursItem[]>([])
  const [suivisIds, setSuivisIds] = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([])
  const [categorieChoisie, setCategorieChoisie] = useState<string>('tous')
  const [recherche, setRecherche] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [echec, setEchec] = useState<boolean>(false)
  const [essai, setEssai] = useState<number>(0)
  const [concoursSelectionne, setConcoursSelectionne] = useState<ConcoursItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    async function chargerDonnees() {
      setLoading(true)
      setEchec(false)
      try {
        const [resConcours, resSuivis, resCategories] = await Promise.all([
          fetch('/api/surga/concours'),
          fetch('/api/surga/concours/suivis'),
          fetch('/api/surga/concours/categories'),
        ])

        const [dataConcours, dataSuivis, dataCategories] = await Promise.all([
          resConcours.json(),
          resSuivis.json(),
          resCategories.json(),
        ])
        if (!resConcours.ok || !dataConcours.success) throw new Error('concours non reçus')

        if (isMounted) {
          if (dataConcours.success && Array.isArray(dataConcours.concours)) {
            setConcours(dataConcours.concours)
          }
          if (dataSuivis.success && Array.isArray(dataSuivis.concours)) {
            const setIds = new Set<string>(dataSuivis.concours.map((c: any) => c.id || c.concours_id))
            setSuivisIds(setIds)
          }
          if (dataCategories.success && Array.isArray(dataCategories.categories)) {
            setCategories(dataCategories.categories)
          }
        }
      } catch (err) {
        console.error('Erreur chargement concours:', err)
        if (isMounted) setEchec(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    chargerDonnees()
    return () => {
      isMounted = false
    }
  }, [isOpen, essai])

  if (!isOpen) return null

  const handleToggleSuivi = async (item: ConcoursItem) => {
    const estActuellementSuivi = suivisIds.has(item.id)

    try {
      if (estActuellementSuivi) {
        await fetch(`/api/surga/concours/${item.id}/suivre`, { method: 'DELETE' })
        setSuivisIds((prev) => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      } else {
        const res = await fetch(`/api/surga/concours/${item.id}/suivre`, { method: 'POST' })
        const json = await res.json().catch(() => ({}))
        if (json.requireAuth && onOpenAuth) {
          onOpenAuth()
          return
        }
        if (res.ok && json.success) {
          setSuivisIds((prev) => {
            const next = new Set(prev)
            next.add(item.id)
            return next
          })
        }
      }
    } catch (err) {
      console.error('Erreur toggle suivi concours:', err)
    }
  }

  const handleOuvrirDetail = (item: ConcoursItem) => {
    setConcoursSelectionne(item)
    setIsDetailOpen(true)
  }

  const filtrerConcours = () => {
    return concours.filter((c) => {
      if (onglet === 'suivis' && !suivisIds.has(c.id)) return false
      if (categorieChoisie !== 'tous' && c.categorie !== categorieChoisie) return false
      if (recherche.trim()) {
        const q = recherche.trim().toLowerCase()
        const matchTitre = c.titre.toLowerCase().includes(q)
        const matchSigle = c.sigle && c.sigle.toLowerCase().includes(q)
        const matchOrga = c.organisme.toLowerCase().includes(q)
        if (!matchTitre && !matchSigle && !matchOrga) return false
      }
      return true
    })
  }

  const listeAffichee = filtrerConcours()

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid var(--border, #E8DDD2)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--bg, #F8F5F0)',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(28, 43, 74, 0.08)',
                color: 'var(--navy, #1C2B4A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GraduationCap size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                Concours &amp; Examens du Sénégal
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
                Dossiers, dates limites &amp; rappels J-30 / J-7 / J-1
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text3, #73675E)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Barre d'onglets */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
          <button
            type="button"
            onClick={() => setOnglet('tous')}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              borderBottom: onglet === 'tous' ? '2px solid var(--navy, #1C2B4A)' : '2px solid transparent',
              color: onglet === 'tous' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            Tous les concours ({concours.length})
          </button>
          <button
            type="button"
            onClick={() => setOnglet('suivis')}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              borderBottom: onglet === 'suivis' ? '2px solid var(--navy, #1C2B4A)' : '2px solid transparent',
              color: onglet === 'suivis' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Bell size={13} />
            <span>Mes concours suivis ({suivisIds.size})</span>
          </button>
        </div>

        {/* Corps principal */}
        <div className="surga-liste-fixe" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Recherche */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="ENA, Douanes, FASTEF…"
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text3, #73675E)',
              }}
            />
          </div>

          {/* Filtres par catégorie */}
          {categories.length > 0 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {categories.map((cat) => {
                const estActive = categorieChoisie === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategorieChoisie(cat.id)}
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '5px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: estActive ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
                      backgroundColor: estActive ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                      color: estActive ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                    }}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Liste des cartes */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3, #73675E)', fontSize: 13 }}>
              Chargement des concours officiels...
            </div>
          ) : echec ? (
            <SurgaChargementEchoue message="Les concours n’ont pas pu être chargés." onReessayer={() => setEssai((n) => n + 1)} />
          ) : listeAffichee.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 16px',
                backgroundColor: 'var(--bg, #F8F5F0)',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <GraduationCap size={32} style={{ color: 'var(--text3, #73675E)' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                {onglet === 'suivis' ? 'Aucun concours suivi pour le moment' : 'Aucun concours correspondant'}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', margin: 0, maxWidth: 360 }}>
                {onglet === 'suivis'
                  ? 'Activez le suivi d’un concours pour recevoir vos alertes J-30, J-7 et J-1 directement dans votre agenda Surga.'
                  : 'Essayez un autre mot-clé ou modifiez la catégorie sélectionnée.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {listeAffichee.map((item) => (
                <SurgaConcoursCard
                  key={item.id}
                  concours={item}
                  estSuivi={suivisIds.has(item.id)}
                  onConsulter={handleOuvrirDetail}
                  onToggleSuivi={handleToggleSuivi}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modale fille de détails */}
        <SurgaConcoursDetailModal
          concours={concoursSelectionne}
          isOpen={isDetailOpen}
          estSuivi={concoursSelectionne ? suivisIds.has(concoursSelectionne.id) : false}
          onClose={() => setIsDetailOpen(false)}
          onToggleSuivi={handleToggleSuivi}
        />
      </div>
    </div>
  )
}
