'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Percent,
  Check,
  Building2,
  Layers
} from 'lucide-react'

interface EchelonnementImmoConfig {
  caution_active: boolean
  caution_formules: number[]
  caution_apport_min_pct: number
  caution_frais_gestion_pct: number
  caution_conditions: string
  tranches_actives: boolean
  tranches_formules_mois: number[]
  tranches_apport_min_pct: number
  tranches_frequence: 'mensuel' | 'trimestriel'
  delai_grace_jours: number
  penalite_retard_pct: number
  tranches_conditions: string
}

const DEFAUT_CONFIG: EchelonnementImmoConfig = {
  caution_active: true,
  caution_formules: [2, 3],
  caution_apport_min_pct: 50,
  caution_frais_gestion_pct: 0,
  caution_conditions: 'Éligible pour tout bail d\'habitation validé par l\'agence.',
  tranches_actives: true,
  tranches_formules_mois: [6, 12, 24, 36],
  tranches_apport_min_pct: 30,
  tranches_frequence: 'mensuel',
  delai_grace_jours: 5,
  penalite_retard_pct: 2,
  tranches_conditions: 'Réservé aux parcelles titrées et programmes neufs éligibles.',
}

interface ParametresEchelonnementImmoProps {
  slug: string
}

export function ParametresEchelonnementImmo({ slug }: ParametresEchelonnementImmoProps) {
  const [config, setConfig] = useState<EchelonnementImmoConfig>(DEFAUT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Simulateur en direct
  const [simulType, setSimulType] = useState<'caution' | 'terrain'>('caution')
  const [simulMontant, setSimulMontant] = useState<number>(300000)
  const [simulNbEcheances, setSimulNbEcheances] = useState<number>(3)

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true)
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch(`/api/credits-immo/agence/${slug}/config`, { headers })
        const data = await res.json()
        if (data.success && data.config) {
          setConfig(data.config)
        }
      } catch (err) {
        console.error('[LOAD_CREDIT_CONFIG_ERR]', err)
      } finally {
        setLoading(false)
      }
    }
    if (slug) loadConfig()
  }, [slug])

  const toggleCautionFormule = (n: number) => {
    const list = [...config.caution_formules]
    const idx = list.indexOf(n)
    if (idx >= 0) {
      if (list.length > 1) list.splice(idx, 1)
    } else {
      list.push(n)
      list.sort((a, b) => a - b)
    }
    setConfig({ ...config, caution_formules: list })
  }

  const toggleTrancheMois = (m: number) => {
    const list = [...config.tranches_formules_mois]
    const idx = list.indexOf(m)
    if (idx >= 0) {
      if (list.length > 1) list.splice(idx, 1)
    } else {
      list.push(m)
      list.sort((a, b) => a - b)
    }
    setConfig({ ...config, tranches_formules_mois: list })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSaving(true)
      setErrorMsg(null)
      setSuccessMsg(null)

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`/api/credits-immo/agence/${slug}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(config),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessMsg('Politiques d\'échelonnement enregistrées avec succès !')
        setTimeout(() => setSuccessMsg(null), 4000)
      } else {
        setErrorMsg(data.error || 'Erreur lors de la sauvegarde.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de connexion.')
    } finally {
      setSaving(false)
    }
  }

  // Calcul du simulateur
  const apportPct = simulType === 'caution' ? config.caution_apport_min_pct : config.tranches_apport_min_pct
  const montantApport = Math.round((simulMontant * apportPct) / 100)
  const montantRestant = Math.max(0, simulMontant - montantApport)
  const montantParEcheance = simulNbEcheances > 0 ? Math.round(montantRestant / simulNbEcheances) : 0

  if (loading) {
    return <div style={{ padding: 30, color: '#64748b' }}>Chargement des politiques d&apos;échelonnement…</div>
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {successMsg && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#15803d', fontSize: 13, marginBottom: 16 }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Volet 1 : Caution Locative Échelonnée */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
                1. Caution Locative Échelonnée (2x, 3x, 4x)
              </h3>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: '3px 0 0' }}>
                Permettre aux locataires d&apos;étaler le paiement de leur caution pour faciliter la conclusion du bail.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.caution_active}
                onChange={e => setConfig({ ...config, caution_active: e.target.checked })}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: config.caution_active ? '#15803d' : '#64748b' }}>
                {config.caution_active ? 'Activée' : 'Désactivée'}
              </span>
            </label>
          </div>

          {config.caution_active && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                  Formules autorisées
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[2, 3, 4].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleCautionFormule(n)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        border: config.caution_formules.includes(n) ? '2px solid var(--accent, #C75B00)' : '1px solid #cbd5e1',
                        background: config.caution_formules.includes(n) ? '#fff7ed' : '#fff',
                        color: config.caution_formules.includes(n) ? 'var(--accent, #C75B00)' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      Paiement en {n}x
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                    Apport initial minimum à la signature (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    value={config.caution_apport_min_pct}
                    onChange={e => setConfig({ ...config, caution_apport_min_pct: Number(e.target.value) || 50 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                  <span style={{ fontSize: 11, color: '#64748b' }}>Ex: 50% à la remise des clés, solde réparti sur M+1 et M+2.</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                    Frais de dossier / gestion d&apos;échelonnement (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={config.caution_frais_gestion_pct}
                    onChange={e => setConfig({ ...config, caution_frais_gestion_pct: Number(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                  <span style={{ fontSize: 11, color: '#64748b' }}>0% pour offrir l&apos;échelonnement gratuit comme argument commercial.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Volet 2 : Vente de Terrains & VEFA par Tranches */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
                2. Vente de Terrains & VEFA par Tranches (6 à 36 mois)
              </h3>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: '3px 0 0' }}>
                Accompagner les acquéreurs de parcelles ou logements neufs avec des règlements échelonnés.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.tranches_actives}
                onChange={e => setConfig({ ...config, tranches_actives: e.target.checked })}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: config.tranches_actives ? '#15803d' : '#64748b' }}>
                {config.tranches_actives ? 'Activée' : 'Désactivée'}
              </span>
            </label>
          </div>

          {config.tranches_actives && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                  Durées autorisées (mois)
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[6, 12, 18, 24, 36].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleTrancheMois(m)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        border: config.tranches_formules_mois.includes(m) ? '2px solid var(--accent, #C75B00)' : '1px solid #cbd5e1',
                        background: config.tranches_formules_mois.includes(m) ? '#fff7ed' : '#fff',
                        color: config.tranches_formules_mois.includes(m) ? 'var(--accent, #C75B00)' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      {m} mois
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                    Acompte / Apport initial min (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="80"
                    value={config.tranches_apport_min_pct}
                    onChange={e => setConfig({ ...config, tranches_apport_min_pct: Number(e.target.value) || 30 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                  <span style={{ fontSize: 11, color: '#64748b' }}>Ex: 30% à la réservation ou signature du compromis.</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                    Fréquence des appels de fonds
                  </label>
                  <select
                    value={config.tranches_frequence}
                    onChange={e => setConfig({ ...config, tranches_frequence: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  >
                    <option value="mensuel">Mensuelle (chaque mois)</option>
                    <option value="trimestriel">Trimestrielle (tous les 3 mois)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Volet 3 : Simulateur Négociateur en Direct */}
        <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Sparkles size={18} color="var(--accent, #C75B00)" />
            <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
              Simulateur Négociateur en Direct
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Type d&apos;opération</label>
              <select
                value={simulType}
                onChange={e => {
                  const t = e.target.value as any
                  setSimulType(t)
                  if (t === 'caution') {
                    setSimulMontant(300000)
                    setSimulNbEcheances(config.caution_formules[0] || 2)
                  } else {
                    setSimulMontant(15000000)
                    setSimulNbEcheances(config.tranches_formules_mois[0] || 12)
                  }
                }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5 }}
              >
                <option value="caution">Caution Locative</option>
                <option value="terrain">Terrain / VEFA</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Montant Total (FCFA)</label>
              <input
                type="number"
                value={simulMontant}
                onChange={e => setSimulMontant(Number(e.target.value) || 0)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Nombre d&apos;échéances</label>
              <select
                value={simulNbEcheances}
                onChange={e => setSimulNbEcheances(Number(e.target.value) || 1)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5 }}
              >
                {simulType === 'caution' ? (
                  config.caution_formules.map(n => <option key={n} value={n}>{n} tranches</option>)
                ) : (
                  config.tranches_formules_mois.map(m => <option key={m} value={m}>{m} mensualités</option>)
                )}
              </select>
            </div>
          </div>

          <div style={{ background: '#fff', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Apport initial ({apportPct}%)</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                {montantApport.toLocaleString('fr-FR')} FCFA
              </div>
            </div>
            <div style={{ borderLeft: '1px solid #e2e8f0' }} />
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Échéance ({simulNbEcheances}x)</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--price, #0A5C36)', marginTop: 2 }}>
                {montantParEcheance.toLocaleString('fr-FR')} FCFA / mois
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--accent, #C75B00)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 22px',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Enregistrement…' : 'Enregistrer les Politiques d\'Échelonnement'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
