'use client'

import React, { useState, useEffect, useId } from 'react'
import {
  CreditCard,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Calendar,
  Percent,
} from 'lucide-react'
import { fcfa } from '@/lib/format'
import {
  type EchelonnementConfig,
  CONFIG_DEFAUT_ECHELONNEMENT,
  calculerEcheancier,
  genererFormulesRecommandees,
} from '@/lib/creditCalculator'

interface ParametresEchelonnementProps {
  boutique: {
    id: string
    nom: string
    echelonnement_actif?: boolean
    echelonnement_config?: EchelonnementConfig
  }
  onUpdate?: () => void
}

export default function ParametresEchelonnement({ boutique, onUpdate }: ParametresEchelonnementProps) {
  const [config, setConfig] = useState<EchelonnementConfig>(() => ({
    ...CONFIG_DEFAUT_ECHELONNEMENT,
    ...(boutique.echelonnement_config || {}),
    actif: boutique.echelonnement_actif === true || boutique.echelonnement_config?.actif === true,
  }))

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Simulation en direct
  const [simulMontant, setSimulMontant] = useState<number>(120000)

  // Identifiants uniques pour accessibilité des inputs
  const minVenteId = useId()
  const maxVenteId = useId()
  const apportPctId = useId()
  const apportFcfaId = useId()
  const minEchId = useId()
  const delaiJoursId = useId()
  const fraisFixesId = useId()
  const fraisPctId = useId()
  const simulMontantId = useId()

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/boutiques/${boutique.id}/credits-config`)
        if (res.ok) {
          const data = await res.json()
          if (data.config) {
            setConfig(data.config)
          }
        }
      } catch (err) {
        console.warn('[LOAD CREDIT CONFIG ERR]:', err)
      }
    }
    loadConfig()
  }, [boutique.id])

  const toggleNbEcheance = (n: number) => {
    const actuelles = config.nb_echeances_autorisees || [2, 3, 4, 6]
    let nouv: number[]
    if (actuelles.includes(n)) {
      if (actuelles.length === 1) return // Garder au moins une option
      nouv = actuelles.filter((x) => x !== n)
    } else {
      nouv = [...actuelles, n].sort((a, b) => a - b)
    }
    setConfig({ ...config, nb_echeances_autorisees: nouv })
  }

  const toggleFrequence = (f: 'mensuel' | 'bimensuel' | 'hebdomadaire') => {
    const actuelles = config.frequences_autorisees || ['mensuel']
    let nouv: Array<'mensuel' | 'bimensuel' | 'hebdomadaire'>
    if (actuelles.includes(f)) {
      if (actuelles.length === 1) return
      nouv = actuelles.filter((x) => x !== f)
    } else {
      nouv = [...actuelles, f]
    }
    setConfig({ ...config, frequences_autorisees: nouv })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    setSaveSuccess(false)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(config),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSaveSuccess(true)
        if (onUpdate) onUpdate()
        setTimeout(() => setSaveSuccess(false), 4000)
      } else {
        setErrorMsg(data.error || 'Erreur lors de la sauvegarde des paramètres.')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  // Calcul simulation en direct
  const formulesSimul = genererFormulesRecommandees(simulMontant, config)
  const calcExemple = calculerEcheancier({
    montantTotal: simulMontant,
    apport: Math.max(config.apport_min_fcfa, Math.round((simulMontant * config.apport_min_pct) / 100)),
    nbEcheances: config.nb_echeances_autorisees[0] || 3,
    frequence: config.frequences_autorisees[0] || 'mensuel',
    config,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960 }}>
      {/* En-tête */}
      <div
        style={{
          background: 'var(--card, #ffffff)',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 16,
          padding: '20px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--orange2, #FFF3E8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CreditCard size={20} color="var(--accent, #C75B00)" />
              </div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                Conditions de Paiement Échelonné & Crédit
              </h2>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text2, #5A4E42)' }}>
              Définissez votre cadre commercial : montants limites, apport obligatoire, formules autorisées et calendrier des échéances.
            </p>
          </div>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px',
              borderRadius: 30,
              background: config.actif ? '#F0FDF4' : '#F1F5F9',
              border: `1.5px solid ${config.actif ? '#86EFAC' : '#CBD5E1'}`,
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: 13,
              color: config.actif ? 'var(--price, #0A5C36)' : 'var(--text2, #5A4E42)',
            }}
          >
            <input
              type="checkbox"
              checked={config.actif}
              onChange={(e) => setConfig({ ...config, actif: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--price, #0A5C36)', cursor: 'pointer' }}
            />
            <span>{config.actif ? 'Paiement Échelonné Activé' : 'Paiement Échelonné Désactivé'}</span>
          </label>
        </div>
      </div>

      {saveSuccess && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: 12,
            padding: '12px 16px',
            color: '#166534',
            fontSize: 13,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={18} />
          <span>Paramètres de crédit enregistrés avec succès. Les nouvelles règles s&apos;appliquent à vos futures ventes.</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 12,
            padding: '12px 16px',
            color: '#B91C1C',
            fontSize: 13,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Grille des réglages */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {/* Bloc 1 : Montants & Apport */}
          <div
            style={{
              background: 'var(--card, #ffffff)',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 16,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border, #E8DDD2)', paddingBottom: 10 }}>
              <Percent size={16} color="var(--accent, #C75B00)" />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                Montants & Apport Initial
              </h3>
            </div>

            <div>
              <label htmlFor={minVenteId} style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                Montant minimum d&apos;un achat éligible (FCFA)
              </label>
              <input
                id={minVenteId}
                type="number"
                min="1000"
                step="1000"
                value={config.montant_min_vente}
                onChange={(e) => setConfig({ ...config, montant_min_vente: Number(e.target.value) })}
                className="input-npl"
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: 11, color: 'var(--text3, #8C7E74)' }}>
                Les paniers inférieurs ne pourront pas choisir l&apos;échelonnement.
              </span>
            </div>

            <div>
              <label htmlFor={maxVenteId} style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                Montant maximum éligible (FCFA, optionnel)
              </label>
              <input
                id={maxVenteId}
                type="number"
                min="10000"
                step="10000"
                value={config.montant_max_vente || 5000000}
                onChange={(e) => setConfig({ ...config, montant_max_vente: Number(e.target.value) })}
                className="input-npl"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label htmlFor={apportPctId} style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                  Apport min (%)
                </label>
                <input
                  id={apportPctId}
                  type="number"
                  min="0"
                  max="90"
                  value={config.apport_min_pct}
                  onChange={(e) => setConfig({ ...config, apport_min_pct: Number(e.target.value) })}
                  className="input-npl"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label htmlFor={apportFcfaId} style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                  Apport min (FCFA)
                </label>
                <input
                  id={apportFcfaId}
                  type="number"
                  min="0"
                  step="1000"
                  value={config.apport_min_fcfa}
                  onChange={(e) => setConfig({ ...config, apport_min_fcfa: Number(e.target.value) })}
                  className="input-npl"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor={minEchId} style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                Montant minimum par échéance (FCFA)
              </label>
              <input
                id={minEchId}
                type="number"
                min="1000"
                step="1000"
                value={config.echeance_min_fcfa}
                onChange={(e) => setConfig({ ...config, echeance_min_fcfa: Number(e.target.value) })}
                className="input-npl"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Bloc 2 : Formules & Fréquences */}
          <div
            style={{
              background: 'var(--card, #ffffff)',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 16,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border, #E8DDD2)', paddingBottom: 10 }}>
              <Calendar size={16} color="var(--accent, #C75B00)" />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                Formules & Calendrier
              </h3>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', marginBottom: 8 }}>
                Nombre d&apos;échéances autorisées
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[2, 3, 4, 6, 10, 12].map((n) => {
                  const isChecked = (config.nb_echeances_autorisees || []).includes(n)
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleNbEcheance(n)}
                      className={`btn-npl ${isChecked ? 'btn-npl-primary' : 'btn-npl-secondary'}`}
                      style={{
                        padding: '8px 14px',
                        fontSize: 12.5,
                        borderRadius: 8,
                        fontWeight: 800,
                      }}
                    >
                      {n} fois ({n}x)
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', marginBottom: 8 }}>
                Fréquences de prélèvement autorisées
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { id: 'mensuel', label: 'Mensuelle' },
                  { id: 'bimensuel', label: 'Toutes les 2 semaines' },
                  { id: 'hebdomadaire', label: 'Hebdomadaire' },
                ].map((f) => {
                  const isChecked = (config.frequences_autorisees || []).includes(f.id as any)
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFrequence(f.id as any)}
                      className={`btn-npl ${isChecked ? 'btn-npl-primary' : 'btn-npl-secondary'}`}
                      style={{
                        padding: '8px 14px',
                        fontSize: 12.5,
                        borderRadius: 8,
                        fontWeight: 800,
                      }}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label htmlFor={delaiJoursId} style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                Délai avant 1ère échéance (jours après l&apos;achat)
              </label>
              <input
                id={delaiJoursId}
                type="number"
                min="7"
                max="60"
                value={config.delai_premiere_echeance_jours || 30}
                onChange={(e) => setConfig({ ...config, delai_premiere_echeance_jours: Number(e.target.value) })}
                className="input-npl"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label htmlFor={fraisFixesId} style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                  Frais fixes dossier (FCFA)
                </label>
                <input
                  id={fraisFixesId}
                  type="number"
                  min="0"
                  step="500"
                  value={config.frais_dossier_fixes || 0}
                  onChange={(e) => setConfig({ ...config, frais_dossier_fixes: Number(e.target.value) })}
                  className="input-npl"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label htmlFor={fraisPctId} style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                  Frais / Majoration (%)
                </label>
                <input
                  id={fraisPctId}
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={config.frais_pourcentage || 0}
                  onChange={(e) => setConfig({ ...config, frais_pourcentage: Number(e.target.value) })}
                  className="input-npl"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Simulateur interactif en direct */}
        <div
          style={{
            background: 'var(--bg, #F8F5F0)',
            border: '1.5px solid var(--border, #E8DDD2)',
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--accent, #C75B00)" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                Aperçu Client en Direct (Simulation)
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor={simulMontantId} style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)' }}>
                Montant panier test :
              </label>
              <input
                id={simulMontantId}
                type="number"
                step="5000"
                min="10000"
                value={simulMontant}
                onChange={(e) => setSimulMontant(Number(e.target.value))}
                style={{
                  width: 130,
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13,
                  fontWeight: 900,
                  color: 'var(--navy, #1C2B4A)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {formulesSimul.map((f) => (
              <div
                key={f.id}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid var(--border, #E8DDD2)',
                  borderRadius: 14,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              >
                <span
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: 10.5,
                    fontWeight: 900,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: f.id === 'recommande' ? 'var(--orange2, #FFF3E8)' : '#F1F5F9',
                    color: f.id === 'recommande' ? 'var(--accent, #C75B00)' : 'var(--text2, #5A4E42)',
                  }}
                >
                  {f.badge}
                </span>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                  {f.titre}
                </p>
                <div style={{ fontSize: 12.5, color: 'var(--text1, #1A1612)', lineHeight: 1.4 }}>
                  <strong>Aujourd&apos;hui :</strong> {fcfa(f.apport)}
                  <br />
                  <strong>Puis :</strong> {f.nb_echeances} × {fcfa(f.montant_echeance)} ({f.label_frequence})
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3, #8C7E74)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} />
                  <span>Prochaine : {f.prochaine_date ? new Date(f.prochaine_date).toLocaleDateString('fr-FR') : 'J+30'}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={16} color="var(--price, #0A5C36)" />
            <span>
              Garantie Nopalou : Le total perçu sera exactement de <strong>{fcfa(simulMontant)}</strong> sans aucun franc d&apos;écart.
            </span>
          </div>
        </div>

        {/* Bouton Enregistrer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-npl btn-npl-primary"
            style={{
              padding: '12px 28px',
              fontSize: 14,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer les Conditions'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
