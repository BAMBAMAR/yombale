'use client'

import React from 'react'
import {
  RotateCcw,
  Volume2,
  Radio,
  Navigation,
  Building,
  Crown,
  Briefcase,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

interface SurgaParametresTabProps {
  preferences: any
  statutPremium?: {
    estPremium: boolean
    plan?: string | null
    joursRestants?: number
  }
  onToggleAudio: () => void
  onOpenRadio: () => void
  onOpenTrafic: () => void
  onOpenImmo: () => void
  onOpenConcours: () => void
  onOpenPlaces?: () => void
  onOpenPremium?: () => void
  onOpenPro?: () => void
  onReinitialiser: () => void
}

export default function SurgaParametresTab({
  preferences,
  statutPremium,
  onToggleAudio,
  onOpenRadio,
  onOpenTrafic,
  onOpenImmo,
  onOpenConcours,
  onOpenPlaces,
  onOpenPremium,
  onOpenPro,
  onReinitialiser,
}: SurgaParametresTabProps) {
  const estPremium = Boolean(statutPremium?.estPremium)
  const joursRestants = statutPremium?.joursRestants || 0

  return (
    <div className="surga-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
        Paramètres &amp; Formule Surga
      </div>
      <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', margin: 0 }}>
        Heure du briefing : <strong>{preferences?.heure_briefing || '07:30'}</strong> &bull; Quartier :{' '}
        <strong>{preferences?.quartiers?.[0] || 'Dakar'}</strong>
      </p>

      {/* Carte Statut Abonnement */}
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 12,
          backgroundColor: estPremium ? 'rgba(10, 92, 54, 0.06)' : 'var(--bg, #F8F5F0)',
          border: estPremium ? '1.5px solid var(--price, #0A5C36)' : '1px solid var(--border, #E8DDD2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crown size={20} color={estPremium ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)'} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {estPremium ? 'Surga Premium Actif' : 'Formule Standard (Gratuite)'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                {estPremium
                  ? `Expiration dans ${joursRestants} jour(s) &bull; Vocal & alertes illimités`
                  : 'Plafond de 20 commandes/jour &bull; Alertes standards'}
              </div>
            </div>
          </div>
          {onOpenPremium && (
            <button
              type="button"
              onClick={onOpenPremium}
              className={estPremium ? 'surga-btn-secondary' : 'surga-btn-primary'}
              style={{ fontSize: 11, padding: '6px 12px', fontWeight: 700 }}
            >
              {estPremium ? 'Gérer' : 'Passer à Premium'}
            </button>
          )}
        </div>

        {/* Lien Professionnels B2B */}
        {onOpenPro && (
          <div
            style={{
              paddingTop: 8,
              borderTop: '1px dashed var(--border, #E8DDD2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Briefcase size={13} color="var(--navy, #1C2B4A)" />
              <span>Vous êtes restaurateur, agence immo ou centre de formation ?</span>
            </div>
            <button
              type="button"
              onClick={onOpenPro}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent, #C75B00)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Espaces Pro
            </button>
          </div>
        )}
      </div>

      {/* Option Audio */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Option Audio du briefing
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
            Synthèse vocale et flux podcast privé (0 Mo)
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleAudio}
          className={preferences?.audio_actif ? 'surga-btn-primary' : 'surga-btn-secondary'}
          style={{ fontSize: 11, padding: '5px 12px' }}
        >
          {preferences?.audio_actif ? 'Activée' : 'Désactivée'}
        </button>
      </div>

      {/* Radios locales */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Radios Locales du Sénégal
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
            Directs FM &amp; revues de presse matinales
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenRadio}
          className="surga-btn-secondary"
          style={{ fontSize: 11, padding: '5px 12px' }}
        >
          Écouter
        </button>
      </div>

      {/* Trafic Dakar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Trafic &amp; Corridors Dakar
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
            État A1, VDN, Corniche, TER &amp; BRT
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenTrafic}
          className="surga-btn-secondary"
          style={{ fontSize: 11, padding: '5px 12px' }}
        >
          Consulter
        </button>
      </div>

      {/* Immobilier Dakar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Immobilier &amp; Alertes Logement
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
            Recherche de biens et notifications d alertes
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenImmo}
          className="surga-btn-secondary"
          style={{ fontSize: 11, padding: '5px 12px' }}
        >
          Ouvrir
        </button>
      </div>

      {/* Concours & Examens du Sénégal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Concours &amp; Examens Nationaux
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
            Suivi des dossiers et rappels J-30 / J-7 / J-1
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenConcours}
          className="surga-btn-secondary"
          style={{ fontSize: 11, padding: '5px 12px' }}
        >
          Consulter
        </button>
      </div>

      {/* Bons Plans & Bonnes Adresses Dakar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Bons Plans &amp; Bonnes Adresses
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
            Restaurants, dibiteries, cafés coworking &amp; avis vérifiés
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenPlaces}
          className="surga-btn-secondary"
          style={{ fontSize: 11, padding: '5px 12px' }}
        >
          Explorer
        </button>
      </div>

      {/* Bouton de réinitialisation */}
      <button
        type="button"
        onClick={onReinitialiser}
        className="surga-btn-secondary"
        style={{ fontSize: 13, padding: '8px 14px', alignSelf: 'flex-start', marginTop: 4 }}
      >
        <RotateCcw size={14} />
        <span>Modifier mes préférences</span>
      </button>
    </div>
  )
}
