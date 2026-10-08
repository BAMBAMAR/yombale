'use client'

import React from 'react'
import {
  Calculator,
  Wallet,
  Calendar,
  FileText,
  GraduationCap,
  Car,
  FileCheck,
  Radio,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import type { ActionVocaleDetectee } from '@/lib/surga-voice'

interface ServiceItemProps {
  icon: LucideIcon
  badge: string
  title?: string
  desc: string
  actionLabel: string
  onClick?: () => void
}

function ServiceItem({ icon: Icon, badge, title, desc, actionLabel, onClick }: ServiceItemProps) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--navy)', marginBottom: '6px' }}>
        <Icon size={16} color="var(--accent)" />
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{badge}</span>
      </div>
      {title && (
        <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}>
          {title}
        </div>
      )}
      <div style={{ fontSize: '0.82rem', color: '#6A7282', marginBottom: '10px' }}>
        {desc}
      </div>
      {onClick && (
        <button
          type="button"
          onClick={onClick}
          className="btn-npl"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span>{actionLabel}</span>
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
}

interface SurgaVoiceServiceCardProps {
  actionDetectee: ActionVocaleDetectee
  onOpenConcours?: (query?: string) => void
  onOpenPlaces?: (query?: string) => void
  onOpenTrafic?: (axe?: string) => void
  onOpenDemarches?: (query?: string) => void
  onOpenImmo?: (query?: string) => void
  onOpenMeteo?: () => void
  onOpenSport?: () => void
  onOpenPresse?: () => void
  onOpenRadio?: (station?: string) => void
  onOpenEmploi?: () => void
  onOpenVideos?: () => void
  onOpenCalc?: () => void
  onOpenCompte?: () => void
  onOpenPremium?: () => void
  onOpenPro?: () => void
  onNavigateTab?: (tab: 'notes' | 'depenses' | 'agenda' | 'aujourdhui' | 'services') => void
}

export default function SurgaVoiceServiceCard({
  actionDetectee,
  onOpenConcours,
  onOpenPlaces,
  onOpenTrafic,
  onOpenDemarches,
  onOpenImmo,
  onOpenMeteo,
  onOpenSport,
  onOpenPresse,
  onOpenRadio,
  onOpenEmploi,
  onOpenVideos,
  onOpenCalc,
  onOpenCompte,
  onOpenPremium,
  onOpenPro,
  onNavigateTab,
}: SurgaVoiceServiceCardProps) {
  const { intention } = actionDetectee

  return (
    <>
      {intention === 'OPEN_CALCULATOR' && (
        <ServiceItem
          icon={Calculator}
          badge="Calculatrice Déterministe"
          desc="Effectuez des calculs financiers et arithmétiques exacts en FCFA."
          actionLabel="Ouvrir la calculatrice"
          onClick={onOpenCalc}
        />
      )}

      {intention === 'SEARCH_CONCOURS' && (
        <ServiceItem
          icon={GraduationCap}
          badge="Concours & Examens du Sénégal"
          title={actionDetectee.concoursData?.query ? `Recherche : « ${actionDetectee.concoursData.query.toUpperCase()} »` : 'Calendrier officiel des concours'}
          desc="Accédez aux 22 fiches officielles certifiées (dates limites, pièces, quittance Trésor)."
          actionLabel={actionDetectee.concoursData?.query ? 'Consulter la fiche du concours' : 'Voir tous les concours'}
          onClick={() => onOpenConcours && onOpenConcours(actionDetectee.concoursData?.query)}
        />
      )}

      {intention === 'SEARCH_PLACES' && (
        <ServiceItem
          icon={Car}
          badge="Bonnes Adresses & Bons Plans à Dakar"
          title={actionDetectee.placesData?.query ? `Recherche : « ${actionDetectee.placesData.query.toUpperCase()} »` : 'Restaurants, dibiteries & sorties dakariliennes'}
          desc="Découvrez les meilleures tables, dibiteries, cafés calmes et adresses vérifiées."
          actionLabel="Explorer les bonnes adresses"
          onClick={() => onOpenPlaces && onOpenPlaces(actionDetectee.placesData?.query)}
        />
      )}

      {intention === 'CHECK_TRAFFIC' && (
        <ServiceItem
          icon={Car}
          badge="Trafic à Dakar"
          title={`Axe : ${(actionDetectee.traficData?.axe || 'global').toUpperCase()}`}
          desc="Suivi en temps réel des ralentissements sur la presqu’île de Dakar."
          actionLabel="Voir le trafic en direct"
          onClick={() => onOpenTrafic && onOpenTrafic(actionDetectee.traficData?.axe)}
        />
      )}

      {intention === 'SEARCH_DEMARCHES' && (
        <ServiceItem
          icon={FileCheck}
          badge="Démarche Administrative Officielle"
          title={`Procédure : « ${actionDetectee.demarcheData?.query || 'Démarches citoyennes'} »`}
          desc="Liste des pièces requises, timbres fiscaux et délais légaux."
          actionLabel="Voir les pièces et la procédure"
          onClick={() => onOpenDemarches && onOpenDemarches(actionDetectee.demarcheData?.query)}
        />
      )}

      {intention === 'SEARCH_IMMO' && (
        <ServiceItem
          icon={FileText}
          badge="Pôle Immobilier & Logement Dakar"
          title={`Recherche : « ${(actionDetectee.immoData?.query || 'Dakar').toUpperCase()} »`}
          desc="Appartements, villas, studios et terrains certifiés par agences partenaires."
          actionLabel="Explorer les offres immobilières"
          onClick={() => onOpenImmo && onOpenImmo(actionDetectee.immoData?.query)}
        />
      )}

      {intention === 'CHECK_METEO' && (
        <ServiceItem
          icon={Calendar}
          badge="Météo Dakar Live & Marées"
          desc="Prévisions heure par heure, températures et horaires des marées océaniques."
          actionLabel="Consulter la météo en direct"
          onClick={onOpenMeteo}
        />
      )}

      {intention === 'CHECK_SPORT' && (
        <ServiceItem
          icon={GraduationCap}
          badge="Sport & Lutte Sénégalaise (Lamb)"
          desc="Scores de Ligue 1 sénégalaise, Lions de la Téranga et combats d’arène."
          actionLabel="Voir le sport et la lutte"
          onClick={onOpenSport}
        />
      )}

      {intention === 'OPEN_PRESSE' && (
        <ServiceItem
          icon={FileText}
          badge="Kiosque des Unes & Revue de Presse"
          desc="Consultez les Unes des quotidiens nationaux et les résumés sourcés."
          actionLabel="Ouvrir la revue de presse"
          onClick={onOpenPresse}
        />
      )}

      {intention === 'SEARCH_EMPLOI' && (
        <ServiceItem
          icon={FileCheck}
          badge="Espace Emploi, CV & Carrière"
          desc="Génération de CV PDF officiel, lettres de motivation et coaching entretien."
          actionLabel="Accéder à l’espace Emploi & CV"
          onClick={onOpenEmploi}
        />
      )}

      {intention === 'OPEN_VIDEOS' && (
        <ServiceItem
          icon={Radio}
          badge="Séries TV & Vidéos Sénégalaises"
          desc="Derniers épisodes des séries nationales et résumés de combats en direct."
          actionLabel="Voir les vidéos"
          onClick={onOpenVideos}
        />
      )}

      {intention === 'BRIEFING' && (
        <ServiceItem
          icon={Calendar}
          badge="Briefing Matinal Surga"
          desc="Votre condensé matinal sourcé et sans publicité."
          actionLabel="Consulter mon briefing"
          onClick={() => onNavigateTab && onNavigateTab('aujourdhui')}
        />
      )}

      {intention === 'OPEN_NOTES' && (
        <ServiceItem
          icon={FileText}
          badge="Mes Notes & Mémos"
          desc="Retrouvez et classez vos notes et mémos personnels."
          actionLabel="Ouvrir mes notes"
          onClick={() => onNavigateTab && onNavigateTab('notes')}
        />
      )}

      {intention === 'OPEN_DEPENSES' && (
        <ServiceItem
          icon={Wallet}
          badge="Mes Dépenses & Budget (Kalpé)"
          desc="Suivez vos dépenses FCFA et consultez votre solde disponible."
          actionLabel="Ouvrir mes dépenses"
          onClick={() => onNavigateTab && onNavigateTab('depenses')}
        />
      )}

      {intention === 'OPEN_AGENDA' && (
        <ServiceItem
          icon={Calendar}
          badge="Mon Agenda & Rappels"
          desc="Consultez votre calendrier et vos rappels programmés."
          actionLabel="Ouvrir mon agenda"
          onClick={() => onNavigateTab && onNavigateTab('agenda')}
        />
      )}

      {intention === 'OPEN_COMPTE' && (
        <ServiceItem
          icon={FileText}
          badge="Mon Compte & Paramètres"
          desc="Gérez votre profil, vos préférences et la synchronisation."
          actionLabel="Ouvrir mon compte"
          onClick={onOpenCompte}
        />
      )}

      {intention === 'OPEN_PREMIUM' && (
        <ServiceItem
          icon={FileCheck}
          badge="Abonnement Surga Premium"
          desc="Débloquez les fonctionnalités avancées et l’assistance prioritaire."
          actionLabel="Découvrir Surga Premium"
          onClick={onOpenPremium}
        />
      )}

      {intention === 'OPEN_PRO' && (
        <ServiceItem
          icon={FileCheck}
          badge="Espaces Professionnels B2B"
          desc="Solutions pour commerçants, marchands et partenaires dakarois."
          actionLabel="Ouvrir l’espace Pro"
          onClick={onOpenPro}
        />
      )}

      {intention === 'PLAY_RADIO' && actionDetectee.radioData && (
        <ServiceItem
          icon={Radio}
          badge="Radios Locales Sénégalaises Direct"
          title={
            actionDetectee.radioData.action === 'STOP'
              ? 'Arrêter la radio en cours'
              : actionDetectee.radioData.station
                ? `Station : ${actionDetectee.radioData.station.toUpperCase()}`
                : 'Bouquet des radios nationales'
          }
          desc="Écoutez vos stations FM en direct et en haute fidélité."
          actionLabel="Ouvrir les radios FM"
          onClick={() => onOpenRadio && onOpenRadio(actionDetectee.radioData?.station)}
        />
      )}
    </>
  )
}
