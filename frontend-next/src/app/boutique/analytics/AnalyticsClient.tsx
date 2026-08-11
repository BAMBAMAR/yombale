'use client'
import { useState, useEffect } from 'react'

interface Stats {
  vues_total: string
  vues_ce_mois: string
  vues_7j: string
  clics_tel_total: string
  clics_tel_mois: string
  vues_annonces_total: string
  vues_annonces_mois: string
  total_ventes?: number
  panier_moyen?: number
  nb_commandes?: number
  nb_promotions?: number
  utilisations_promo?: number
  mode_fonctionnement?: string
  meta_pixel_active?: boolean
  tiktok_pixel_active?: boolean
  ga4_active?: boolean
}

interface Historique {
  jour: string
  vues: string
  clics_tel: string
}

export default function AnalyticsClient({ boutiques }: { boutiques: { id: string; nom: string }[] }) {
  const [boutiqueId, setBoutiqueId] = useState(boutiques[0]?.id ?? '')
  const [stats, setStats]           = useState<Stats | null>(null)
  const [historique, setHistorique] = useState<Historique[]>([])
  const [loading, setLoading]       = useState(false)
  const [erreur, setErreur]         = useState<string | null>(null)

  useEffect(() => {
    if (!boutiqueId) return
    
    // 1. Charger depuis le cache immédiatement
    const cached = localStorage.getItem(`nopalou_offline_analytics_${boutiqueId}`)
    if (cached) {
      try {
        const data = JSON.parse(cached)
        if (data.stats) setStats(data.stats)
        if (data.historique) setHistorique(data.historique)
      } catch(e) {}
    }

    if (!cached) setLoading(true)
    setErreur(null)

    // 2. Fetch en arrière-plan
    fetch(`/api/analytics/boutique/${boutiqueId}`)
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error || r.status)).catch(() => Promise.reject(r.statusText)))
      .then(data => { 
        setStats(data.stats)
        setHistorique(data.historique ?? []) 
        localStorage.setItem(`nopalou_offline_analytics_${boutiqueId}`, JSON.stringify(data))
      })
      .catch((msg) => {
        // Ne pas afficher d'erreur si on a déjà des données en cache (mode hors-ligne)
        if (!cached) setErreur(typeof msg === 'string' ? msg : 'Impossible de charger les statistiques.')
      })
      .finally(() => setLoading(false))
  }, [boutiqueId])

  const n = (v: string | number) => Number(v || 0).toLocaleString('fr-FR')

  if (boutiques.length === 0) {
    return (
      <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 32 }}>📊</p>
        <p>Vous n&apos;avez pas encore de boutique.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '32px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Analytics boutique</h1>
      <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
        Suivez les performances de votre boutique en temps réel.
      </p>

      {/* Sélecteur boutique */}
      {boutiques.length > 1 && (
        <select
          value={boutiqueId}
          onChange={e => setBoutiqueId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, marginBottom: 24 }}
        >
          {boutiques.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
      )}

      {loading && <p style={{ color: '#94a3b8' }}>Chargement…</p>}

      {erreur && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 20px', color: '#dc2626' }}>
          {erreur}
        </div>
      )}

      {stats && !loading && (
        <>
          {/* Mode d'exploitation badge */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{stats.mode_fonctionnement === 'pure_player' ? '⚡' : '🏪'}</span>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>
                  Mode actif : {stats.mode_fonctionnement === 'pure_player' ? 'Pure Player E-Commerce (100% Web)' : 'Hybride POS (Commerce Physique + Web)'}
                </span>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                  {stats.mode_fonctionnement === 'pure_player' ? 'Interface optimisée pour la vente en ligne sans caisse physique' : 'Interface complète avec caisse enregistreuse POS'}
                </p>
              </div>
            </div>
          </div>

          {/* KPIs Trafic & Conversions */}
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: '#1f2937' }}>📊 Performances Trafic & Ventes Web</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Panier moyen (AOV)', value: `${n(stats.panier_moyen || 0)} FCFA`, sub: 'Panier boosté par le Cross-Sell', emoji: '🛒' },
              { label: 'Ventes enregistrées', value: `${n(stats.total_ventes || 0)} FCFA`, sub: `${n(stats.nb_commandes || 0)} commandes web 1-page`, emoji: '💰' },
              { label: 'Coupons réductions', value: n(stats.utilisations_promo || 0), sub: `${n(stats.nb_promotions || 0)} codes promo créés`, emoji: '🏷️' },
              { label: 'Vues boutique',  value: n(stats.vues_total),       sub: `${n(stats.vues_7j)} cette semaine`,    emoji: '👁️' },
            ].map(({ label, value, sub, emoji }) => (
              <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 22 }}>{emoji}</div>
                <div style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 2px', color: '#111827' }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Santé des Pixels Publicitaires */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#1f2937' }}>
              🎯 Santé des Pixels de Tracking Publicitaire (ROAS)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>🔵 Meta Facebook Pixel</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: stats.meta_pixel_active ? '#dcfce7' : '#f3f4f6', color: stats.meta_pixel_active ? '#166534' : '#6b7280' }}>
                  {stats.meta_pixel_active ? '✅ Actif' : '⚪ Non configuré'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>🎵 TikTok Pixel</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: stats.tiktok_pixel_active ? '#dcfce7' : '#f3f4f6', color: stats.tiktok_pixel_active ? '#166534' : '#6b7280' }}>
                  {stats.tiktok_pixel_active ? '✅ Actif' : '⚪ Non configuré'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>📈 Google Analytics GA4</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: stats.ga4_active ? '#dcfce7' : '#f3f4f6', color: stats.ga4_active ? '#166534' : '#6b7280' }}>
                  {stats.ga4_active ? '✅ Actif' : '⚪ Non configuré'}
                </span>
              </div>
            </div>
          </div>

          {/* Historique 30j */}
          {historique.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 14 }}>
                Activité des 30 derniers jours
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 400 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                      {['Date', 'Vues boutique', 'Clics tél.'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historique.map((h) => (
                      <tr key={h.jour} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '7px 14px', color: '#64748b' }}>{new Date(h.jour).toLocaleDateString('fr-FR')}</td>
                        <td style={{ padding: '7px 14px', fontWeight: Number(h.vues) > 0 ? 600 : 400 }}>{n(h.vues)}</td>
                        <td style={{ padding: '7px 14px', color: Number(h.clics_tel) > 0 ? '#C75B00' : '#94a3b8', fontWeight: Number(h.clics_tel) > 0 ? 600 : 400 }}>{n(h.clics_tel)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {historique.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14 }}>
              Pas encore d&apos;activité enregistrée. Les vues s&apos;afficheront dès que des visiteurs consulteront votre boutique.
            </div>
          )}
        </>
      )}
    </div>
  )
}
