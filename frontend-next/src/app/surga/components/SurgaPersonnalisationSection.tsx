'use client'

import React, { useState } from 'react'
import {
  SlidersHorizontal,
  Navigation,
  Newspaper,
  Home,
  ShoppingBag,
  MapPin,
  Radio,
  Award,
  FileCheck,
  Briefcase,
  Tv,
  Calendar,
  Wallet,
  Sun,
  Bookmark,
  Check,
  RotateCcw,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export const DEFAUT_SIDEBAR_SERVICES = ['trafic', 'presse', 'immo', 'shopping', 'places']
export const DEFAUT_RAIL_WIDGETS = ['agenda', 'depenses', 'trafic', 'meteo', 'notes', 'radios']

interface ServiceConfigItem {
  id: string
  label: string
  desc: string
  icon: LucideIcon
  color: string
}

const CATALOGUE_SERVICES: ServiceConfigItem[] = [
  { id: 'trafic', label: 'Trafic Dakar', desc: 'Mesures et signalements des usagers', icon: Navigation, color: 'var(--surga-emerald-ink, #047857)' },
  { id: 'presse', label: 'Kiosque des Unes', desc: 'Revues de presse & premières pages', icon: Newspaper, color: '#1C2B4A' },
  { id: 'immo', label: 'Pôle Immobilier', desc: 'Maisons, appartements & terrains vérifiés', icon: Home, color: '#2563EB' },
  { id: 'shopping', label: 'Shopping Nopalou', desc: 'Boutiques locales, produits & prix', icon: ShoppingBag, color: '#C75B00' },
  { id: 'places', label: 'Bonnes Adresses', desc: 'Restaurants, cafés & sorties à Dakar', icon: MapPin, color: 'var(--surga-accent-ink, #A64B08)' },
  { id: 'radios', label: 'Radios FM direct', desc: 'Bouquet des radios sénégalaises en continu', icon: Radio, color: '#7C3AED' },
  { id: 'concours', label: 'Concours nationaux', desc: 'Échéances officielles J-30/J-7/J-1 & dossiers', icon: Award, color: '#DC2626' },
  { id: 'demarches', label: 'Démarches administratives', desc: 'Fiches officielles & pièces certifiées', icon: FileCheck, color: '#0D9488' },
  { id: 'emploi', label: 'Emploi & Stages', desc: 'Offres, fiches de révision & CV pro', icon: Briefcase, color: '#475569' },
  { id: 'videos', label: 'Séries & Émissions', desc: 'Séries, débats politiques & lutte sénégalaise', icon: Tv, color: '#EA580C' },
]

interface WidgetConfigItem {
  id: string
  label: string
  desc: string
  icon: LucideIcon
  color: string
}

const CATALOGUE_WIDGETS: WidgetConfigItem[] = [
  { id: 'agenda', label: 'Votre journée (Agenda)', desc: 'Rappels et rendez-vous du planning', icon: Calendar, color: '#2563EB' },
  { id: 'depenses', label: 'Sama Xaalis (Finances)', desc: 'Dépenses du mois & solde Kalpé en FCFA', icon: Wallet, color: '#0A5C36' },
  { id: 'trafic', label: 'Trafic', desc: 'Mesures et signalements des usagers', icon: Navigation, color: 'var(--surga-emerald-ink, #047857)' },
  { id: 'meteo', label: 'Météo et marées', desc: 'Température, ciel et vent', icon: Sun, color: 'var(--surga-accent-ink, #A64B08)' },
  { id: 'notes', label: 'Mémo épinglé', desc: 'Aperçu instantané de votre note prioritaire', icon: Bookmark, color: '#7C3AED' },
  { id: 'radios', label: 'Radios FM direct', desc: 'Lecteur direct et contrôle de la station', icon: Radio, color: '#C75B00' },
]

interface SurgaPersonnalisationSectionProps {
  preferences: any
  onSavePreferences: (nouveauxParametres: { sidebar_services?: string[]; rail_widgets?: string[] }) => void
}

export default function SurgaPersonnalisationSection({
  preferences,
  onSavePreferences,
}: SurgaPersonnalisationSectionProps) {
  const [ongletActif, setOngletActif] = useState<'sidebar' | 'rail'>('sidebar')
  const [messageSucces, setMessageSucces] = useState<string | null>(null)

  const sidebarActifs: string[] = Array.isArray(preferences?.sidebar_services) && preferences.sidebar_services.length > 0
    ? preferences.sidebar_services
    : DEFAUT_SIDEBAR_SERVICES

  const railActifs: string[] = Array.isArray(preferences?.rail_widgets) && preferences.rail_widgets.length > 0
    ? preferences.rail_widgets
    : DEFAUT_RAIL_WIDGETS

  const notifierSauvegarde = (msg: string) => {
    setMessageSucces(msg)
    setTimeout(() => setMessageSucces(null), 2500)
  }

  // Bascule d'un service dans le menu gauche
  const toggleService = (id: string) => {
    let nvListe: string[]
    if (sidebarActifs.includes(id)) {
      if (sidebarActifs.length <= 1) return // Garder au moins 1 élément
      nvListe = sidebarActifs.filter((s) => s !== id)
    } else {
      nvListe = [...sidebarActifs, id]
    }
    onSavePreferences({ sidebar_services: nvListe })
    notifierSauvegarde('Menu latéral mis à jour')
  }

  // Bascule d'un widget dans le rail droit
  const toggleWidget = (id: string) => {
    let nvListe: string[]
    if (railActifs.includes(id)) {
      if (railActifs.length <= 1) return // Garder au moins 1 élément
      nvListe = railActifs.filter((w) => w !== id)
    } else {
      nvListe = [...railActifs, id]
    }
    onSavePreferences({ rail_widgets: nvListe })
    notifierSauvegarde('Bande latérale mise à jour')
  }

  // Rétablir la configuration par défaut
  const reinitialiserDisposition = () => {
    onSavePreferences({
      sidebar_services: [...DEFAUT_SIDEBAR_SERVICES],
      rail_widgets: [...DEFAUT_RAIL_WIDGETS],
    })
    notifierSauvegarde('Disposition par défaut restaurée')
  }

  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 12,
        backgroundColor: 'var(--bg, #F8F5F0)',
        border: '1px solid var(--border, #E8DDD2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* En-tête de la section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <SlidersHorizontal size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Personnalisation de l&apos;affichage (Desktop)
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
              Adaptez le menu gauche et les widgets de droite selon vos besoins
            </div>
          </div>
        </div>

        {messageSucces && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--price, #0A5C36)',
              backgroundColor: 'rgba(10, 92, 54, 0.1)',
              padding: '3px 8px',
              borderRadius: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Sparkles size={11} />
            <span>{messageSucces}</span>
          </span>
        )}
      </div>

      {/* Onglets de sélection (Menu gauche vs Bande droite) */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          backgroundColor: '#EDE5DB',
          padding: 3,
          borderRadius: 8,
        }}
      >
        <button
          type="button"
          onClick={() => setOngletActif('sidebar')}
          style={{
            flex: 1,
            padding: '7px 10px',
            borderRadius: 6,
            border: 'none',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: ongletActif === 'sidebar' ? '#FFFFFF' : 'transparent',
            color: ongletActif === 'sidebar' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
            boxShadow: ongletActif === 'sidebar' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          Menu gauche ({sidebarActifs.length})
        </button>

        <button
          type="button"
          onClick={() => setOngletActif('rail')}
          style={{
            flex: 1,
            padding: '7px 10px',
            borderRadius: 6,
            border: 'none',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: ongletActif === 'rail' ? '#FFFFFF' : 'transparent',
            color: ongletActif === 'rail' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
            boxShadow: ongletActif === 'rail' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          Bande droite ({railActifs.length})
        </button>
      </div>

      {/* Contenu : Onglet Menu Gauche */}
      {ongletActif === 'sidebar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', marginBottom: 2 }}>
            Cochez les services visibles directement dans la barre latérale gauche :
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 6 }}>
            {CATALOGUE_SERVICES.map((s) => {
              const Icon = s.icon
              const estSelectionne = sidebarActifs.includes(s.id)
              return (
                <div
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    backgroundColor: estSelectionne ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)',
                    border: estSelectionne ? '1px solid #D9CFC4' : '1px dashed #E2D7CC',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        backgroundColor: `${s.color}14`,
                        color: s.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={14} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.desc}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      backgroundColor: estSelectionne ? 'var(--navy, #1C2B4A)' : 'transparent',
                      border: estSelectionne ? 'none' : '1.5px solid #A89F91',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginLeft: 8,
                    }}
                  >
                    {estSelectionne && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Contenu : Onglet Bande Droite */}
      {ongletActif === 'rail' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', marginBottom: 2 }}>
            Cochez les widgets de contexte affichés dans la colonne latérale droite :
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 6 }}>
            {CATALOGUE_WIDGETS.map((w) => {
              const Icon = w.icon
              const estSelectionne = railActifs.includes(w.id)
              return (
                <div
                  key={w.id}
                  onClick={() => toggleWidget(w.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    backgroundColor: estSelectionne ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)',
                    border: estSelectionne ? '1px solid #D9CFC4' : '1px dashed #E2D7CC',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        backgroundColor: `${w.color}14`,
                        color: w.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={14} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {w.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {w.desc}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      backgroundColor: estSelectionne ? 'var(--navy, #1C2B4A)' : 'transparent',
                      border: estSelectionne ? 'none' : '1.5px solid #A89F91',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginLeft: 8,
                    }}
                  >
                    {estSelectionne && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pied de section : Rétablir par défaut */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px dashed var(--border, #E8DDD2)' }}>
        <button
          type="button"
          onClick={reinitialiserDisposition}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text3, #73675E)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
          title="Rétablir les éléments par défaut"
        >
          <RotateCcw size={11} />
          <span>Rétablir l&apos;affichage par défaut</span>
        </button>
      </div>
    </div>
  )
}
