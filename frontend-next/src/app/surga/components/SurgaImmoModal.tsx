'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Building,
  Bell,
  Search,
  Mic,
  SlidersHorizontal,
  Plus,
  Trash2,
  RefreshCw,
  MapPin,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import SurgaImmoCard, { BienImmoItem } from './SurgaImmoCard'
import SurgaImmoAlerteModal from './SurgaImmoAlerteModal'

interface AlerteImmoItem {
  id: string
  titre: string
  type_bien?: string
  transaction?: string
  quartier?: string
  prix_max_xof?: number
  meuble?: boolean | null
  actif: boolean
  nb_matches?: number
  created_at: string
}

interface SurgaImmoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SurgaImmoModal({ isOpen, onClose }: SurgaImmoModalProps) {
  const [onglet, setOnglet] = useState<'biens' | 'alertes'>('biens')
  const [biens, setBiens] = useState<BienImmoItem[]>([])
  const [alertes, setAlertes] = useState<AlerteImmoItem[]>([])
  const [quartiers, setQuartiers] = useState<string[]>([])
  const [queryVocale, setQueryVocale] = useState<string>('')
  const [rechercheEnCours, setRechercheEnCours] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [filtreType, setFiltreType] = useState<string>('tous')
  const [filtreTransaction, setFiltreTransaction] = useState<string>('tous')
  const [filtreQuartier, setFiltreQuartier] = useState<string>('')
  const [isAlerteModalOpen, setIsAlerteModalOpen] = useState<boolean>(false)
  const [criteresParsed, setCriteresParsed] = useState<any>(null)

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    async function initialiser() {
      setLoading(true)
      try {
        const [resBiens, resAlertes, resQuartiers] = await Promise.all([
          fetch('/api/surga/immo/biens'),
          fetch('/api/surga/immo/alertes'),
          fetch('/api/surga/immo/quartiers'),
        ])

        const [dataBiens, dataAlertes, dataQuartiers] = await Promise.all([
          resBiens.json(),
          resAlertes.json(),
          resQuartiers.json(),
        ])

        if (isMounted) {
          if (dataBiens.success && Array.isArray(dataBiens.biens)) {
            setBiens(dataBiens.biens)
          }
          if (dataAlertes.success && Array.isArray(dataAlertes.alertes)) {
            setAlertes(dataAlertes.alertes)
          }
          if (dataQuartiers.success && Array.isArray(dataQuartiers.quartiers)) {
            setQuartiers(dataQuartiers.quartiers)
          }
        }
      } catch (err) {
        console.error('Erreur initialisation immo:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initialiser()
    return () => {
      isMounted = false
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleRechercheNaturelle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!queryVocale.trim()) return

    setRechercheEnCours(true)
    try {
      const res = await fetch('/api/surga/immo/recherche-vocale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryVocale }),
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.biens)) {
        setBiens(data.biens)
        setCriteresParsed(data.criteres)
      }
    } catch (err) {
      console.error('Erreur recherche vocale immo:', err)
    } finally {
      setRechercheEnCours(false)
    }
  }

  const handleToggleAlerte = async (id: string) => {
    try {
      const res = await fetch(`/api/surga/immo/alertes/${id}/toggle`, { method: 'PATCH' })
      const data = await res.json()
      if (data.success && data.alerte) {
        setAlertes((prev) =>
          prev.map((alt) => (alt.id === id ? { ...alt, actif: data.alerte.actif } : alt))
        )
      }
    } catch (err) {
      console.error('Erreur toggle alerte:', err)
    }
  }

  const handleSupprimerAlerte = async (id: string) => {
    try {
      const res = await fetch(`/api/surga/immo/alertes/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setAlertes((prev) => prev.filter((alt) => alt.id !== id))
      }
    } catch (err) {
      console.error('Erreur suppression alerte:', err)
    }
  }

  const handleNouvelleAlerte = (nouvelle: AlerteImmoItem) => {
    setAlertes((prev) => [nouvelle, ...prev])
    setOnglet('alertes')
  }

  const biensFiltres = biens.filter((b) => {
    if (filtreType !== 'tous' && b.type_bien !== filtreType) return false
    if (filtreTransaction !== 'tous' && b.transaction !== filtreTransaction) return false
    if (filtreQuartier && !b.quartier.toLowerCase().includes(filtreQuartier.toLowerCase())) return false
    return true
  })

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
              <Building size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                Immobilier &amp; Alertes Dakar
              </h2>
              <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                Catalogue certifié Nopalou • Veille &lt; 2 minutes
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
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <button
            type="button"
            onClick={() => setOnglet('biens')}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              borderBottom: onglet === 'biens' ? '2px solid var(--navy, #1C2B4A)' : '2px solid transparent',
              color: onglet === 'biens' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            Biens disponibles ({biensFiltres.length})
          </button>
          <button
            type="button"
            onClick={() => setOnglet('alertes')}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              borderBottom: onglet === 'alertes' ? '2px solid var(--navy, #1C2B4A)' : '2px solid transparent',
              color: onglet === 'alertes' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Bell size={14} />
            <span>Mes alertes ({alertes.length})</span>
          </button>
        </div>

        {/* Corps principal */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {onglet === 'biens' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Moteur de recherche en langage naturel */}
              <form onSubmit={handleRechercheNaturelle} style={{ display: 'flex', gap: 6 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    value={queryVocale}
                    onChange={(e) => setQueryVocale(e.target.value)}
                    placeholder="Ex: Studio meublé à Mermoz budget 300 000 FCFA"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 34px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text3, #73675E)',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={rechercheEnCours}
                  style={{
                    backgroundColor: 'var(--navy, #1C2B4A)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {rechercheEnCours ? 'Recherche...' : 'Filtrer'}
                </button>
              </form>

              {/* Filtres rapides */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                <select
                  value={filtreTransaction}
                  onChange={(e) => setFiltreTransaction(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 12,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="tous">Toutes transactions</option>
                  <option value="location">Location</option>
                  <option value="vente">Vente</option>
                </select>

                <select
                  value={filtreType}
                  onChange={(e) => setFiltreType(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 12,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="tous">Tous les types</option>
                  <option value="appartement">Appartements</option>
                  <option value="studio">Studios</option>
                  <option value="villa">Villas</option>
                  <option value="terrain">Terrains</option>
                  <option value="bureau">Bureaux</option>
                </select>

                <select
                  value={filtreQuartier}
                  onChange={(e) => setFiltreQuartier(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 12,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="">Tous les quartiers</option>
                  {quartiers.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grille des biens */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3, #73675E)', fontSize: 13 }}>
                  Chargement des biens immobiliers...
                </div>
              ) : biensFiltres.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '30px 16px',
                    backgroundColor: 'var(--bg, #F8F5F0)',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Building size={32} style={{ color: 'var(--text3, #73675E)' }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                    Aucun bien ne correspond à ces critères
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', margin: 0, maxWidth: 360 }}>
                    Créez une alerte personnalisée pour être prévenu dès qu un propriétaire ou une agence publie un bien conforme.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAlerteModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: 'var(--accent, #C75B00)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: 4,
                    }}
                  >
                    <Bell size={14} />
                    <span>Créer une alerte pour ces critères</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  {biensFiltres.map((bien) => (
                    <SurgaImmoCard key={bien.id} bien={bien} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Onglet Mes Alertes */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                  Veilles actives ({alertes.filter((a) => a.actif).length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsAlerteModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: 'var(--accent, #C75B00)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={13} />
                  <span>Nouvelle alerte</span>
                </button>
              </div>

              {alertes.length === 0 ? (
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
                  <Bell size={32} style={{ color: 'var(--accent, #C75B00)' }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                    Aucune alerte programmée
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', margin: 0, maxWidth: 340 }}>
                    Activez une veille pour recevoir des notifications en moins de 2 minutes dès la mise en ligne d un bien à Dakar.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAlerteModalOpen(true)}
                    style={{
                      marginTop: 8,
                      backgroundColor: 'var(--navy, #1C2B4A)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Programmer une alerte
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {alertes.map((alt) => (
                    <div
                      key={alt.id}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border, #E8DDD2)',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                            {alt.titre}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: alt.actif ? 'rgba(10, 92, 54, 0.1)' : '#F3F4F6',
                              color: alt.actif ? 'var(--price, #0A5C36)' : 'var(--text3, #73675E)',
                            }}
                          >
                            {alt.actif ? 'Active' : 'En pause'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', marginTop: 2 }}>
                          {alt.type_bien || 'Tous types'} • {alt.transaction || 'Location'} •{' '}
                          {alt.quartier || 'Tout Dakar'}{' '}
                          {alt.prix_max_xof ? `• Max ${new Intl.NumberFormat('fr-FR').format(alt.prix_max_xof)} F` : ''}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleToggleAlerte(alt.id)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: 6,
                            border: '1px solid var(--border, #E8DDD2)',
                            backgroundColor: 'var(--bg, #F8F5F0)',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: 'var(--navy, #1C2B4A)',
                          }}
                        >
                          {alt.actif ? 'Mettre en pause' : 'Réactiver'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSupprimerAlerte(alt.id)}
                          aria-label="Supprimer l alerte"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#B91C1C',
                            cursor: 'pointer',
                            padding: 4,
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modale fille de création d'alerte */}
        <SurgaImmoAlerteModal
          isOpen={isAlerteModalOpen}
          onClose={() => setIsAlerteModalOpen(false)}
          onAlerteCreee={handleNouvelleAlerte}
          quartiers={quartiers}
          criteresInitiaux={criteresParsed}
        />
      </div>
    </div>
  )
}
