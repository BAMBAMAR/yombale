'use client'

import React, { useState } from 'react'
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Newspaper,
  Trophy,
  Navigation,
  Building,
  GraduationCap,
  MapPin,
  Clock,
  Sparkles,
  CloudSun,
} from 'lucide-react'

export interface SurgaPreferencesData {
  modules_actifs: string[]
  heure_briefing: string
  langue: string
  quartiers: string[]
  equipes_suivies: string[]
  audio_actif?: boolean
  onboarding_termine?: boolean
  sidebar_services?: string[]
  rail_widgets?: string[]
}

interface SurgaOnboardingProps {
  onComplete: (data: SurgaPreferencesData) => void
  initialData?: Partial<SurgaPreferencesData>
}

const BRIQUES_DISPONIBLES = [
  { id: 'actualites', nom: 'Actualités & Presse', desc: 'Revue de presse sénégalaise sourcée', icon: Newspaper },
  { id: 'meteo', nom: 'Météo & Marées', desc: 'Température, vent et horaires des marées à Dakar', icon: CloudSun },
  { id: 'sport', nom: 'Sport & Résultats', desc: 'Équipe nationale et scores du week-end', icon: Trophy },
  { id: 'trafic', nom: 'Trafic à Dakar', desc: 'État de la circulation et alertes trajets', icon: Navigation },
  { id: 'immobilier', nom: 'Immobilier & Loyers', desc: 'Alertes annonces vérifiées et démarches', icon: Building },
  { id: 'concours', nom: 'Concours & Examens', desc: 'Calendrier des concours et rappels d’échéances', icon: GraduationCap },
  { id: 'bons_plans', nom: 'Bons Plans & Adresses', desc: 'Recommandations géolocalisées et budgets', icon: MapPin },
]

const HEURES_BRIEFING = ['06:30', '07:00', '07:30', '08:00', '08:30']

const QUARTIERS_POPULAIRES = [
  'Dakar Plateau',
  'Almadies / Ngor',
  'Mermoz / Sacré-Cœur',
  'Yoff / Ouest-Foire',
  'Parcelles Assainies',
  'Guédiawaye / Pikine',
  'Rufisque',
]

export default function SurgaOnboarding({ onComplete, initialData }: SurgaOnboardingProps) {
  const [step, setStep] = useState<number>(1)
  const [selectedBriques, setSelectedBriques] = useState<string[]>(
    initialData?.modules_actifs || ['actualites', 'meteo', 'sport', 'trafic']
  )
  const [heureBriefing, setHeureBriefing] = useState<string>(
    initialData?.heure_briefing || '07:30'
  )
  const [langue, setLangue] = useState<string>(initialData?.langue || 'fr')
  const [quartiers, setQuartiers] = useState<string[]>(
    initialData?.quartiers?.length ? initialData.quartiers : ['Dakar Plateau']
  )
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const toggleBrique = (id: string) => {
    setSelectedBriques((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleQuartier = (q: string) => {
    setQuartiers((prev) =>
      prev.includes(q) ? (prev.length > 1 ? prev.filter((item) => item !== q) : prev) : [...prev, q]
    )
  }

  const handleFinish = async () => {
    setIsSubmitting(true)
    const preferences: SurgaPreferencesData = {
      modules_actifs: selectedBriques,
      heure_briefing: heureBriefing,
      langue,
      quartiers,
      equipes_suivies: ['Équipe Nationale du Sénégal'],
      audio_actif: false,
      onboarding_termine: true,
    }

    try {
      // Sauvegarde dans le localStorage pour usage offline immédiat
      localStorage.setItem('surga_preferences', JSON.stringify(preferences))
      localStorage.setItem('surga_onboarding_done', 'true')

      // Tentative de synchronisation vers l'API si l'utilisateur possède un token
      const token = localStorage.getItem('nopalou_session') || localStorage.getItem('token')
      if (token) {
        await fetch('/api/surga/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(preferences),
        }).catch(() => {})
      }
    } catch (e) {
      console.warn('[SURGA ONBOARDING WARN]', e)
    } finally {
      setIsSubmitting(false)
      onComplete(preferences)
    }
  }

  return (
    <div className="surga-container">
      {/* Barre de progression 3 étapes */}
      <div className="surga-onboarding-progress" aria-label="Progression configuration">
        <div className={`surga-progress-bar ${step >= 1 ? 'active' : ''}`} />
        <div className={`surga-progress-bar ${step >= 2 ? 'active' : ''}`} />
        <div className={`surga-progress-bar ${step >= 3 ? 'active' : ''}`} />
      </div>

      {/* Étape 1 : Choix des briques */}
      {step === 1 && (
        <section aria-labelledby="step1-title">
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent, #C75B00)', textTransform: 'uppercase' }}>
              Étape 1 sur 3
            </span>
            <h2 id="step1-title" style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '4px 0 6px 0' }}>
              Personnalisez vos centres d’intérêt
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text2, #5A4E42)', margin: 0 }}>
              Sélectionnez les sujets que vous souhaitez intégrer à votre assistant quotidien. Les briques non choisies ne s’afficheront pas.
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            {BRIQUES_DISPONIBLES.map((b) => {
              const Icon = b.icon
              const isSelected = selectedBriques.includes(b.id)
              return (
                <div
                  key={b.id}
                  onClick={() => toggleBrique(b.id)}
                  className={`surga-brick-option ${isSelected ? 'selected' : ''}`}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      toggleBrique(b.id)
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: isSelected ? 'rgba(199,91,0,0.1)' : 'var(--bg, #F8F5F0)',
                        color: isSelected ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text1, #1A1612)' }}>{b.nom}</div>
                      <div style={{ fontSize: 13, color: 'var(--text2, #5A4E42)' }}>{b.desc}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: `2px solid ${isSelected ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
                      backgroundColor: isSelected ? 'var(--accent, #C75B00)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                    }}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            className="surga-btn-primary"
            onClick={() => setStep(2)}
          >
            <span>Continuer</span>
            <ArrowRight size={18} />
          </button>
        </section>
      )}

      {/* Étape 2 : Heure & Quartier */}
      {step === 2 && (
        <section aria-labelledby="step2-title">
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent, #C75B00)', textTransform: 'uppercase' }}>
              Étape 2 sur 3
            </span>
            <h2 id="step2-title" style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '4px 0 6px 0' }}>
              Votre rythme au quotidien
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text2, #5A4E42)', margin: 0 }}>
              À quelle heure souhaitez-vous recevoir votre récapitulatif chaque matin ?
            </p>
          </div>

          {/* Sélecteur d'heure */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
              <Clock size={16} color="var(--accent, #C75B00)" />
              Heure du briefing du matin
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {HEURES_BRIEFING.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHeureBriefing(h)}
                  style={{
                    padding: '10px 0',
                    textAlign: 'center',
                    borderRadius: 8,
                    border: `1.5px solid ${heureBriefing === h ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
                    backgroundColor: heureBriefing === h ? 'rgba(199,91,0,0.06)' : '#FFFFFF',
                    color: heureBriefing === h ? 'var(--accent, #C75B00)' : 'var(--text1, #1A1612)',
                    fontWeight: heureBriefing === h ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: 15,
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Quartier de référence */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
              <MapPin size={16} color="var(--accent, #C75B00)" />
              Votre zone de déplacement principale
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {QUARTIERS_POPULAIRES.map((q) => {
                const isSelected = quartiers.includes(q)
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => toggleQuartier(q)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 20,
                      border: `1px solid ${isSelected ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
                      backgroundColor: isSelected ? 'rgba(199,91,0,0.08)' : '#FFFFFF',
                      color: isSelected ? 'var(--accent, #C75B00)' : 'var(--text2, #5A4E42)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {q}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="surga-btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setStep(1)}
            >
              <ArrowLeft size={16} />
              <span>Retour</span>
            </button>
            <button
              type="button"
              className="surga-btn-primary"
              style={{ flex: 2 }}
              onClick={() => setStep(3)}
            >
              <span>Continuer</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* Étape 3 : Confirmation & Finalisation */}
      {step === 3 && (
        <section aria-labelledby="step3-title">
          <div style={{ textAlign: 'center', padding: '16px 0 24px 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'rgba(199,91,0,0.1)',
                color: 'var(--accent, #C75B00)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Sparkles size={32} />
            </div>
            <h2 id="step3-title" style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 8px 0' }}>
              Votre Surga est prêt
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text2, #5A4E42)', margin: 0, lineHeight: 1.5 }}>
              Bonjour. Vos préférences sont enregistrées. Votre briefing sera prêt chaque jour à <strong>{heureBriefing}</strong> dans l’application, pour la zone <strong>{quartiers[0] || 'Dakar'}</strong>.
            </p>
          </div>

          <div className="surga-card" style={{ marginBottom: 24 }}>
            <div className="surga-card-header">
              <span className="surga-card-title">Récapitulatif</span>
              <span className="surga-header-badge">Actif</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text2, #5A4E42)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div><strong>Briques actives :</strong> {selectedBriques.join(', ')}</div>
              <div><strong>Heure briefing :</strong> {heureBriefing}</div>
              <div><strong>Zone principale :</strong> {quartiers.join(', ')}</div>
              <div><strong>Noyau inclus :</strong> Notes, Dépenses FCFA, Calculatrice, Agenda</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="surga-btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setStep(2)}
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} />
              <span>Modifier</span>
            </button>
            <button
              type="button"
              className="surga-btn-primary"
              style={{ flex: 2 }}
              onClick={handleFinish}
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Finalisation...' : 'Ouvrir mon Surga'}</span>
              <Check size={18} strokeWidth={2.5} />
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
