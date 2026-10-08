'use client'

import React from 'react'
import {
  Navigation, Newspaper, Home, ShoppingBag, MapPin, Radio, Award, FileCheck, Briefcase, Tv, Calculator, ChevronRight,
  type LucideIcon,
} from 'lucide-react'

// SRG-A2-015 : sur téléphone, aucun élément ne menait aux Démarches, à l'Emploi, aux Vidéos ni aux Radios ; le menu
// des services n'existait qu'à partir de 1 024 px. L'onglet « Services » en porte désormais la liste.
export type CleService =
  | 'trafic' | 'presse' | 'immo' | 'shopping' | 'places' | 'radios' | 'concours' | 'demarches' | 'emploi' | 'videos' | 'calculatrice'

const SERVICES: Array<{ cle: CleService; titre: string; description: string; icone: LucideIcon }> = [
  { cle: 'trafic', titre: 'Trafic', description: 'Axes de Dakar, signalements des usagers, trajet dans Google Maps', icone: Navigation },
  { cle: 'presse', titre: 'Kiosque et presse', description: 'Unes des journaux et revue de presse avec ses sources', icone: Newspaper },
  { cle: 'demarches', titre: 'Démarches', description: 'Fiches vérifiées et portail officiel de l’État', icone: FileCheck },
  { cle: 'emploi', titre: 'Emploi', description: 'CV, lettre de motivation, préparation d’entretien', icone: Briefcase },
  { cle: 'concours', titre: 'Concours', description: 'Calendrier des concours et pièces à fournir', icone: Award },
  { cle: 'immo', titre: 'Immobilier', description: 'Annonces de location et de vente', icone: Home },
  { cle: 'shopping', titre: 'Shopping Nopalou', description: 'Boutiques et produits de Nopalou', icone: ShoppingBag },
  { cle: 'places', titre: 'Bonnes adresses', description: 'Restaurants, cafés et sorties', icone: MapPin },
  { cle: 'radios', titre: 'Radios', description: 'Radios du Sénégal en direct', icone: Radio },
  { cle: 'videos', titre: 'Séries et vidéos', description: 'Dernières vidéos des chaînes sénégalaises', icone: Tv },
  { cle: 'calculatrice', titre: 'Calculatrice', description: 'Calculs exacts en FCFA', icone: Calculator },
]

export default function SurgaServicesListe({ onOuvrir }: { onOuvrir: (cle: CleService) => void }) {
  return (
    <nav aria-label="Services de Surga" style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      {SERVICES.map(({ cle, titre, description, icone: Icone }) => (
        <button
          key={cle}
          type="button"
          onClick={() => onOuvrir(cle)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 56, padding: '10px 12px', textAlign: 'left',
            borderRadius: 12, border: '1px solid var(--surga-border, #E2E8F0)', backgroundColor: 'var(--surga-surface, #FFFFFF)', cursor: 'pointer',
          }}
        >
          <span style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surga-bg, #F8FAFC)', color: 'var(--surga-primary, #0F172A)' }}>
            <Icone size={18} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: 'var(--surga-text1, #0F172A)' }}>{titre}</span>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--surga-text2, #475569)', lineHeight: 1.35 }}>{description}</span>
          </span>
          <ChevronRight size={18} style={{ flexShrink: 0, color: 'var(--surga-text3, #64748B)' }} />
        </button>
      ))}
    </nav>
  )
}
