'use client'

import React, { useState, useEffect, useMemo, useId } from 'react'
import {
  CreditCard,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react'
import { fcfa } from './types'
import {
  type EchelonnementConfig,
  type CalculEcheancierResult,
  CONFIG_DEFAUT_ECHELONNEMENT,
  calculerEcheancier,
  genererFormulesRecommandees,
} from '@/lib/creditCalculator'

interface EchelonnementConfiguratorProps {
  montantTotal: number
  boutiqueId: string
  config?: Partial<EchelonnementConfig> | null
  onFormuleChoisie: (formule: {
    apport: number
    nb_echeances: number
    frequence: string
    calcul: CalculEcheancierResult
  }) => void
}

export default function EchelonnementConfigurator({
  montantTotal,
  boutiqueId,
  config: propConfig,
  onFormuleChoisie,
}: EchelonnementConfiguratorProps) {
  const [config, setConfig] = useState<EchelonnementConfig>(() => ({
    ...CONFIG_DEFAUT_ECHELONNEMENT,
    ...(propConfig || {}),
  }))

  const [modeSelection, setModeSelection] = useState<'recommandees' | 'personnalisee'>('recommandees')
  const [selectedFormuleId, setSelectedFormuleId] = useState<string>('recommande')

  // Identifiant unique pour le champ montant personnalisé
  const customApportInputId = useId()

  // État personnalisé
  const minApport = useMemo(() => {
    return Math.max(
      config.apport_min_fcfa || 0,
      Math.round((montantTotal * (config.apport_min_pct || 20)) / 100)
    )
  }, [montantTotal, config])

  const [customApport, setCustomApport] = useState<number>(minApport)
  const [customNbEcheances, setCustomNbEcheances] = useState<number>(
    config.nb_echeances_autorisees[0] || 3
  )
  const [customFrequence, setCustomFrequence] = useState<string>(
    config.frequences_autorisees[0] || 'mensuel'
  )

  useEffect(() => {
    if (minApport > customApport) {
      setCustomApport(minApport)
    }
  }, [minApport, customApport])

  // Chargement de la config réelle de la boutique si non fournie en props
  useEffect(() => {
    if (!propConfig) {
      fetch(`/api/boutiques/${boutiqueId}/credits-config`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.config) {
            setConfig(data.config)
          }
        })
        .catch((err) => console.warn('[LOAD CREDIT CONFIG FRONT ERR]:', err))
    }
  }, [boutiqueId, propConfig])

  // Formules prédéfinies intelligentes
  const formulesIntelligentes = useMemo(() => {
    return genererFormulesRecommandees(montantTotal, config)
  }, [montantTotal, config])

  // Calcul pour la formule personnalisée
  const calculPersonnalise = useMemo(() => {
    return calculerEcheancier({
      montantTotal,
      apport: customApport,
      nbEcheances: customNbEcheances,
      frequence: customFrequence,
      config,
    })
  }, [montantTotal, customApport, customNbEcheances, customFrequence, config])

  // Formule actuellement active
  const formuleActive = useMemo(() => {
    if (modeSelection === 'recommandees') {
      const f = formulesIntelligentes.find((x) => x.id === selectedFormuleId) || formulesIntelligentes[0]
      if (f) {
        return {
          apport: f.apport,
          nb_echeances: f.nb_echeances,
          frequence: f.frequence,
          calcul: f.detail,
        }
      }
    }
    return {
      apport: customApport,
      nb_echeances: customNbEcheances,
      frequence: customFrequence,
      calcul: calculPersonnalise,
    }
  }, [modeSelection, selectedFormuleId, formulesIntelligentes, customApport, customNbEcheances, customFrequence, calculPersonnalise])

  // Transmission au parent
  useEffect(() => {
    if (formuleActive && formuleActive.calcul && formuleActive.calcul.valide) {
      onFormuleChoisie(formuleActive)
    }
  }, [formuleActive, onFormuleChoisie])

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid var(--border, #E8DDD2)',
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 4px 16px rgba(28,43,74,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--orange2, #FFF3E8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCard size={18} color="var(--accent, #C75B00)" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              Formule de Paiement Échelonné
            </h4>
            <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)' }}>
              Achat éligible de {fcfa(montantTotal)}
            </span>
          </div>
        </div>

        {/* Sélecteur Mode Recommandé vs Sur-Mesure */}
        <div style={{ display: 'flex', background: 'var(--bg, #F8F5F0)', padding: 3, borderRadius: 10, gap: 3 }}>
          <button
            type="button"
            onClick={() => setModeSelection('recommandees')}
            style={{
              padding: '5px 12px',
              borderRadius: 7,
              border: 'none',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: modeSelection === 'recommandees' ? '#ffffff' : 'transparent',
              color: modeSelection === 'recommandees' ? 'var(--navy, #1C2B4A)' : 'var(--text2, #5A4E42)',
              boxShadow: modeSelection === 'recommandees' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Formules Prêtes
          </button>
          <button
            type="button"
            onClick={() => setModeSelection('personnalisee')}
            style={{
              padding: '5px 12px',
              borderRadius: 7,
              border: 'none',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: modeSelection === 'personnalisee' ? '#ffffff' : 'transparent',
              color: modeSelection === 'personnalisee' ? 'var(--navy, #1C2B4A)' : 'var(--text2, #5A4E42)',
              boxShadow: modeSelection === 'personnalisee' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Personnaliser
          </button>
        </div>
      </div>

      {/* MODE 1 : Formules Recommandées */}
      {modeSelection === 'recommandees' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          {formulesIntelligentes.map((f) => {
            const isSelected = selectedFormuleId === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFormuleId(f.id)}
                style={{
                  background: isSelected ? 'var(--orange2, #FFF3E8)' : '#ffffff',
                  border: `2px solid ${isSelected ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
                  borderRadius: 12,
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(199,91,0,0.12)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: 5,
                      background: f.id === 'recommande' ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                      color: '#ffffff',
                    }}
                  >
                    {f.badge}
                  </span>
                  {isSelected && <CheckCircle2 size={16} color="var(--accent, #C75B00)" />}
                </div>

                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                  {f.titre}
                </div>

                <div style={{ fontSize: 12, color: 'var(--text1, #1A1612)', lineHeight: 1.35 }}>
                  <strong>Aujourd&apos;hui :</strong> {fcfa(f.apport)}
                  <br />
                  <strong>Puis :</strong> {f.nb_echeances} × {fcfa(f.montant_echeance)} ({f.label_frequence})
                </div>

                <div style={{ fontSize: 10.5, color: 'var(--text3, #8C7E74)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} />
                  <span>1ère échéance le {f.prochaine_date ? new Date(f.prochaine_date).toLocaleDateString('fr-FR') : 'J+30'}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* MODE 2 : Configurateur Personnalisé */}
      {modeSelection === 'personnalisee' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg, #F8F5F0)', padding: 14, borderRadius: 12, border: '1px solid var(--border, #E8DDD2)' }}>
          {/* Choix apport */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label htmlFor={customApportInputId} style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text2, #5A4E42)' }}>
                1. Choisissez votre apport initial
              </label>
              <span className="fcfa-num" style={{ fontSize: 12, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                {fcfa(customApport)} ({Math.round((customApport / montantTotal) * 100)}%)
              </span>
            </div>

            {/* Raccourcis % */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {[
                { pct: config.apport_min_pct || 20, label: `Min (${config.apport_min_pct || 20}%)` },
                { pct: 30, label: '30%' },
                { pct: 40, label: '40%' },
                { pct: 50, label: '50%' },
              ].map((b) => {
                const montantBouton = Math.max(minApport, Math.round((montantTotal * b.pct) / 100))
                const isSelected = customApport === montantBouton
                return (
                  <button
                    key={b.pct}
                    type="button"
                    onClick={() => setCustomApport(montantBouton)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
                      background: isSelected ? 'var(--orange2, #FFF3E8)' : '#ffffff',
                      color: isSelected ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {b.label}
                  </button>
                )
              })}
            </div>

            <input
              id={customApportInputId}
              type="range"
              min={minApport}
              max={montantTotal - (config.echeance_min_fcfa || 5000)}
              step="1000"
              value={customApport}
              onChange={(e) => setCustomApport(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent, #C75B00)', cursor: 'pointer' }}
            />
          </div>

          {/* Choix nombre d'échéances */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--text2, #5A4E42)', marginBottom: 6 }}>
              2. Nombre de mensualités
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(config.nb_echeances_autorisees || [2, 3, 4, 6]).map((n) => {
                const isSelected = customNbEcheances === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCustomNbEcheances(n)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: `1.5px solid ${isSelected ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)'}`,
                      background: isSelected ? 'var(--navy, #1C2B4A)' : '#ffffff',
                      color: isSelected ? '#ffffff' : 'var(--navy, #1C2B4A)',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {n} fois
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fréquence */}
          {config.frequences_autorisees.length > 1 && (
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--text2, #5A4E42)', marginBottom: 6 }}>
                3. Fréquence des règlements
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {config.frequences_autorisees.map((freq) => {
                  const isSelected = customFrequence === freq
                  const labelMap: Record<string, string> = {
                    mensuel: 'Chaque mois',
                    bimensuel: 'Toutes les 2 semaines',
                    hebdomadaire: 'Chaque semaine',
                  }
                  return (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setCustomFrequence(freq)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: `1px solid ${isSelected ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
                        background: isSelected ? 'var(--orange2, #FFF3E8)' : '#ffffff',
                        color: isSelected ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {labelMap[freq] || freq}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Récapitulatif Final Contractuel avec Arrondi Exact */}
      {formuleActive && formuleActive.calcul && (
        <div
          style={{
            background: 'var(--orange2, #FFF3E8)',
            border: '1.5px solid #FED7AA',
            borderRadius: 12,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #FED7AA', paddingBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 900, color: 'var(--accent, #C75B00)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              RÉSUMÉ DE VOTRE FORMULE
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>
              {formuleActive.nb_echeances} échéances ({formuleActive.frequence})
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'block' }}>Vous paierez aujourd&apos;hui :</span>
              <strong style={{ fontSize: 14, color: 'var(--navy, #1C2B4A)' }}>{fcfa(formuleActive.apport)}</strong>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'block' }}>Il restera financé :</span>
              <strong style={{ fontSize: 14, color: 'var(--accent, #C75B00)' }}>{fcfa(formuleActive.calcul.montant_finance)}</strong>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'block' }}>Chaque échéance :</span>
              <strong style={{ fontSize: 14, color: 'var(--price, #0A5C36)' }}>{fcfa(formuleActive.calcul.montant_base_echeance)}</strong>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'block' }}>1ère échéance :</span>
              <strong style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
                {formuleActive.calcul.prochaine_echeance
                  ? new Date(formuleActive.calcul.prochaine_echeance).toLocaleDateString('fr-FR')
                  : 'Dans 30 jours'}
              </strong>
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#9A3412', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={14} color="#C75B00" />
            <span>Total contractuel exact garanti : <strong>{fcfa(formuleActive.calcul.total_a_payer)}</strong></span>
          </div>
        </div>
      )}
    </div>
  )
}
