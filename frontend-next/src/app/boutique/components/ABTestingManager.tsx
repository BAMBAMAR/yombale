'use client'

import React, { useState, useEffect } from 'react'
import {
  Split, Play, Pause, Save, CheckCircle2, AlertCircle,
  TrendingUp, Users, ShoppingBag, Award, BarChart3, RefreshCw
} from 'lucide-react'

interface ABTestConfig {
  id?: string
  titre: string
  actif: boolean
  repartition: number
  variante_a: {
    nom: string
    titre_vitrine: string
    bouton_cta_texte: string
    bouton_cta_couleur: string
  }
  variante_b: {
    nom: string
    titre_vitrine: string
    bouton_cta_texte: string
    bouton_cta_couleur: string
  }
}

interface ABResults {
  variante_a: { visites: number; conversions: number; taux_conversion: number }
  variante_b: { visites: number; conversions: number; taux_conversion: number }
  gagnant: 'A' | 'B' | 'en_cours'
  statistiquement_significatif: boolean
}

export default function ABTestingManager({ boutiqueId }: { boutiqueId: string }) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [test, setTest] = useState<ABTestConfig>({
    titre: 'Optimisation de l\'Accroche & du Call-to-Action Vitrine',
    actif: true,
    repartition: 50,
    variante_a: {
      nom: 'Variante A (Contrôle Original)',
      titre_vitrine: 'Bienvenue dans notre boutique officielle',
      bouton_cta_texte: 'Commander',
      bouton_cta_couleur: '#C75B00',
    },
    variante_b: {
      nom: 'Variante B (Challenger Promo & 1-Clic)',
      titre_vitrine: 'Profitez de nos offres exclusives avant rupture de stock !',
      bouton_cta_texte: 'Commander en 1-Clic',
      bouton_cta_couleur: '#16A34A',
    },
  })

  const [results, setResults] = useState<ABResults | null>(null)

  useEffect(() => {
    chargerDonnees()
  }, [boutiqueId])

  async function chargerDonnees() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || ''
      const [resConfig, resResults] = await Promise.all([
        fetch(`${backendUrl}/api/boutiques/${boutiqueId}/ab-test`),
        fetch(`${backendUrl}/api/boutiques/${boutiqueId}/ab-test/results`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (resConfig.ok) {
        const dConfig = await resConfig.json()
        if (dConfig.success && dConfig.test) {
          const t = dConfig.test
          setTest({
            id: t.id,
            titre: t.titre,
            actif: t.actif,
            repartition: t.repartition || 50,
            variante_a: typeof t.variante_a === 'string' ? JSON.parse(t.variante_a) : t.variante_a,
            variante_b: typeof t.variante_b === 'string' ? JSON.parse(t.variante_b) : t.variante_b,
          })
        }
      }

      if (resResults.ok) {
        const dRes = await resResults.json()
        if (dRes.success && dRes.resultats) {
          setResults(dRes.resultats)
        }
      }
    } catch {
      // Tolérance offline / fallback local
    } finally {
      setLoading(false)
    }
  }

  async function sauvegarderTest() {
    setSaving(true)
    setToast(null)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/ab-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(test),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setToast({ type: 'success', message: 'Configuration du test A/B enregistrée avec succès !' })
      } else {
        setToast({ type: 'error', message: data.error || 'Erreur lors de l\'enregistrement' })
      }
    } catch {
      setToast({ type: 'error', message: 'Impossible de joindre le serveur' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p style={{ margin: 0, fontWeight: 700 }}>Chargement du moteur A/B testing...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 980, margin: '0 auto' }}>
      {/* Header & Toggle Global */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '24px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Split size={22} color="#C75B00" />
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
              Moteur d&apos;A/B Testing Vitrine (Split-Testing 50/50)
            </h2>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Comparez scientifiquement deux variantes de votre vitrine pour maximiser votre taux de conversion.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setTest({ ...test, actif: !test.actif })}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: test.actif ? '#DCFCE7' : '#F1F5F9',
              color: test.actif ? '#166534' : '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            {test.actif ? <Play size={16} /> : <Pause size={16} />}
            <span>{test.actif ? 'Test A/B Actif (50/50)' : 'Test A/B en Pause'}</span>
          </button>

          <button
            type="button"
            onClick={sauvegarderTest}
            disabled={saving}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: '#C75B00',
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      {toast && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: toast.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${toast.type === 'success' ? '#86EFAC' : '#FECACA'}`,
          color: toast.type === 'success' ? '#166534' : '#991B1B',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Tableau de Bord des Résultats en Direct */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '24px',
        border: '1px solid #E2E8F0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color="#1C2B4A" />
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
              Performances &amp; Taux de Conversion en Temps Réel
            </h3>
          </div>
          {results?.gagnant && results.gagnant !== 'en_cours' && (
            <span style={{
              background: '#DCFCE7',
              color: '#166534',
              fontWeight: 800,
              fontSize: 12,
              padding: '4px 12px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <Award size={14} />
              <span>Gagnant Détecté : Variante {results.gagnant}</span>
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* Carte Variante A */}
          <div style={{
            border: '1.5px solid #E2E8F0',
            borderRadius: 12,
            padding: 16,
            background: '#F8FAFC',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 14, color: '#1C2B4A' }}>Variante A (Contrôle)</strong>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', background: '#E2E8F0', padding: '2px 8px', borderRadius: 6 }}>
                50% du trafic
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B', marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} /> Visites uniques</span>
              <strong style={{ color: '#1E293B' }}>{results?.variante_a.visites || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B', marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShoppingBag size={14} /> Commandes initiées</span>
              <strong style={{ color: '#1E293B' }}>{results?.variante_a.conversions || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: '#1C2B4A', borderTop: '1px solid #E2E8F0', paddingTop: 8, marginTop: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={15} color="#C75B00" /> Taux de conversion</span>
              <span style={{ color: '#C75B00', fontSize: 16 }}>{results?.variante_a.taux_conversion || 0}%</span>
            </div>
          </div>

          {/* Carte Variante B */}
          <div style={{
            border: results?.gagnant === 'B' ? '2px solid #16A34A' : '1.5px solid #E2E8F0',
            borderRadius: 12,
            padding: 16,
            background: results?.gagnant === 'B' ? '#F0FDF4' : '#F8FAFC',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 14, color: '#1C2B4A' }}>Variante B (Challenger)</strong>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', background: '#E2E8F0', padding: '2px 8px', borderRadius: 6 }}>
                50% du trafic
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B', marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} /> Visites uniques</span>
              <strong style={{ color: '#1E293B' }}>{results?.variante_b.visites || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B', marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShoppingBag size={14} /> Commandes initiées</span>
              <strong style={{ color: '#1E293B' }}>{results?.variante_b.conversions || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: '#1C2B4A', borderTop: '1px solid #E2E8F0', paddingTop: 8, marginTop: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={15} color="#16A34A" /> Taux de conversion</span>
              <span style={{ color: '#16A34A', fontSize: 16 }}>{results?.variante_b.taux_conversion || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Édition des Variantes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Éditeur Variante A */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1C2B4A' }}>Configuration Variante A (Contrôle)</h4>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>Titre d&apos;accroche vitrine</label>
            <input
              type="text"
              value={test.variante_a.titre_vitrine}
              onChange={e => setTest({
                ...test,
                variante_a: { ...test.variante_a, titre_vitrine: e.target.value },
              })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>Texte du bouton CTA</label>
            <input
              type="text"
              value={test.variante_a.bouton_cta_texte}
              onChange={e => setTest({
                ...test,
                variante_a: { ...test.variante_a, bouton_cta_texte: e.target.value },
              })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>
        </div>

        {/* Éditeur Variante B */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1C2B4A' }}>Configuration Variante B (Challenger)</h4>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>Titre d&apos;accroche challenger</label>
            <input
              type="text"
              value={test.variante_b.titre_vitrine}
              onChange={e => setTest({
                ...test,
                variante_b: { ...test.variante_b, titre_vitrine: e.target.value },
              })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>Texte du bouton CTA</label>
            <input
              type="text"
              value={test.variante_b.bouton_cta_texte}
              onChange={e => setTest({
                ...test,
                variante_b: { ...test.variante_b, bouton_cta_texte: e.target.value },
              })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
