'use client'

import React, { useState, useMemo } from 'react'
import { X, Search, MapPin, LocateFixed, Check, Compass } from 'lucide-react'

export interface LocaliteItem {
  id: string
  nom: string
  maritime: boolean
  zone: string
}

interface SurgaMeteoLocaliteModalProps {
  isOpen: boolean
  onClose: () => void
  localiteActuelle: string
  estGpsActif: boolean
  localites: LocaliteItem[]
  onSelectLocalite: (nom: string) => void
  onDetecterGps: () => void
  gpsEnCours: boolean
}

export default function SurgaMeteoLocaliteModal({
  isOpen,
  onClose,
  localiteActuelle,
  estGpsActif,
  localites,
  onSelectLocalite,
  onDetecterGps,
  gpsEnCours,
}: SurgaMeteoLocaliteModalProps) {
  const [recherche, setRecherche] = useState('')
  const [zoneFiltre, setZoneFiltre] = useState<string>('tous')

  const zonesDisponibles = useMemo(() => {
    const set = new Set<string>()
    localites.forEach((l) => set.add(l.zone))
    return ['tous', ...Array.from(set)]
  }, [localites])

  const localitesFiltrees = useMemo(() => {
    return localites.filter((l) => {
      const matchRecherche =
        !recherche ||
        l.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        l.zone.toLowerCase().includes(recherche.toLowerCase())
      const matchZone = zoneFiltre === 'tous' || l.zone === zoneFiltre
      return matchRecherche && matchZone
    })
  }, [localites, recherche, zoneFiltre])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choisir votre localité météo"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 25, 38, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '85vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header de la modale */}
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Compass size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Localité &amp; Position Météo</div>
              <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.75)' }}>
                Dakar, banlieue, régions ou géolocalisation GPS
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
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Bouton de Géolocalisation GPS direct */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border, #E8DDD2)', backgroundColor: 'var(--bg, #F8F5F0)' }}>
          <button
            type="button"
            onClick={onDetecterGps}
            disabled={gpsEnCours}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 8,
              border: estGpsActif ? '1.5px solid var(--price, #0A5C36)' : '1px solid var(--border, #E8DDD2)',
              backgroundColor: estGpsActif ? 'rgba(10, 92, 54, 0.08)' : '#FFFFFF',
              color: estGpsActif ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)',
              fontSize: 13,
              fontWeight: 700,
              cursor: gpsEnCours ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <LocateFixed size={16} color={estGpsActif ? 'var(--price, #0A5C36)' : 'var(--accent, #C75B00)'} className={gpsEnCours ? 'animate-spin' : ''} />
            <span>
              {gpsEnCours
                ? 'Détection GPS en direct...'
                : estGpsActif
                ? 'Position GPS active (En direct)'
                : 'Utiliser ma position GPS actuelle'}
            </span>
          </button>
        </div>

        {/* Barre de recherche */}
        <div style={{ padding: '10px 14px 6px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              backgroundColor: 'var(--bg, #F8F5F0)',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <Search size={15} color="var(--text3, #73675E)" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un quartier ou une ville..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: 13,
                outline: 'none',
                color: 'var(--navy, #1C2B4A)',
              }}
            />
            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche('')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text3, #73675E)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filtres par zone géographique */}
        <div
          style={{
            padding: '4px 14px 10px',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {zonesDisponibles.map((z) => {
            const estActif = zoneFiltre === z
            const label = z === 'tous' ? 'Toutes' : z
            return (
              <button
                key={z}
                type="button"
                onClick={() => setZoneFiltre(z)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: estActif ? 700 : 500,
                  border: estActif ? '1px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
                  backgroundColor: estActif ? 'var(--navy, #1C2B4A)' : 'transparent',
                  color: estActif ? '#FFFFFF' : 'var(--text2, #5A4E42)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Liste des localités */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 14px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {localitesFiltrees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3, #73675E)', fontSize: 13 }}>
              Aucune localité trouvée pour &laquo;&nbsp;{recherche}&nbsp;&raquo;.
            </div>
          ) : (
            localitesFiltrees.map((loc) => {
              const estSelectionnee =
                !estGpsActif &&
                (loc.nom.toLowerCase().trim() === localiteActuelle.toLowerCase().trim() ||
                  loc.id === localiteActuelle.toLowerCase().trim())

              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    onSelectLocalite(loc.nom)
                    onClose()
                  }}
                  aria-pressed={estSelectionnee}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: estSelectionnee ? 'rgba(199, 91, 0, 0.08)' : '#FFFFFF',
                    border: estSelectionnee ? '1.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <MapPin size={15} color={estSelectionnee ? 'var(--accent, #C75B00)' : 'var(--text3, #73675E)'} style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: estSelectionnee ? 800 : 600, color: 'var(--navy, #1C2B4A)' }}>
                        {loc.nom}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', marginTop: 1 }}>
                        {loc.zone} {loc.maritime ? '• Littoral océanique (Marées)' : ''}
                      </div>
                    </div>
                  </div>

                  {estSelectionnee && (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent, #C75B00)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginLeft: 8,
                      }}
                    >
                      <Check size={13} />
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
