'use client'
import { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n/context'
import { BarChart3, DollarSign, ShoppingCart, Eye, Tag, Activity, CheckCircle2, HelpCircle, TrendingUp, Zap, Store } from 'lucide-react'

interface Stats {
  vues_total: string
  vues_ce_mois: string
  vues_7j: string
  clics_tel_total: string
  clics_tel_mois: string
  vues_annonces_total: string
  vues_annonces_mois: string
  total_ventes?: number
  total_ventes_web?: number
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
  const { t, isRtl } = useTranslation()
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
        <BarChart3 size={40} style={{ color: 'var(--navy)', margin: '0 auto 12px' }} />
        <p>Vous n&apos;avez pas encore de boutique.</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}>
      {/* Sélecteur boutique (si plusieurs boutiques) */}
      {boutiques.length > 1 && (
        <select
          value={boutiqueId}
          onChange={e => setBoutiqueId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, marginBottom: 16, maxWidth: 280 }}
        >
          {boutiques.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
      )}

      {loading && <p style={{ color: '#94a3b8' }}>{t('common.loading')}</p>}

      {erreur && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '14px 18px', color: '#dc2626', marginBottom: 16 }}>
          {erreur}
        </div>
      )}

      {stats && !loading && (
        <>
          {/* Mode d'exploitation badge */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stats.mode_fonctionnement === 'pure_player' ? <Zap size={18} style={{ color: '#C75B00' }} /> : <Store size={18} style={{ color: '#1e3a5f' }} />}
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 750, color: '#1f2937' }}>
                  Mode actif : {stats.mode_fonctionnement === 'pure_player' ? 'Pure Player E-Commerce (100% Web)' : 'Hybride POS (Commerce Physique + Web)'}
                </span>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748b' }}>
                  {stats.mode_fonctionnement === 'pure_player' ? 'Interface optimisée pour la vente en ligne sans caisse physique' : 'Interface complète avec caisse enregistreuse POS'}
                </p>
              </div>
            </div>
          </div>

          {/* KPIs Trafic & Conversions — Grille 4 colonnes Desktop / 2 colonnes Mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent, #C75B00)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: '#1f2937' }}>Performances Trafic & Ventes</h3>
          </div>
          
          <div className="bq-kpi-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Chiffre d\'Affaires Total', value: `${n(stats.total_ventes || 0)} FCFA`, sub: `Comptabilité globale (POS + Web)`, icon: <DollarSign size={18} style={{ color: '#16a34a' }} />, iconBg: '#f0fdf4' },
              { label: 'Ventes Web 1-Page', value: `${n(stats.total_ventes_web ?? stats.total_ventes ?? 0)} FCFA`, sub: `${n(stats.nb_commandes || 0)} commandes web actives`, icon: <ShoppingCart size={18} style={{ color: '#2563eb' }} />, iconBg: '#eff6ff' },
              { label: 'Vues Boutique', value: n(stats.vues_total), sub: `${n(stats.vues_7j)} cette semaine · ${n(stats.clics_tel_total || 0)} clics contact`, icon: <Eye size={18} style={{ color: '#C75B00' }} />, iconBg: '#fff7ed' },
              { label: 'Coupons Réductions', value: n(stats.utilisations_promo || 0), sub: `${n(stats.nb_promotions || 0)} codes promo créés`, icon: <Tag size={18} style={{ color: '#9333ea' }} />, iconBg: '#faf5ff' },
            ].map(({ label, value, sub, icon, iconBg }) => (
              <div key={label} className="bq-kpi-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(15,23,42,0.03)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {icon}
                    </div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', wordBreak: 'break-word', letterSpacing: '-0.02em' }}>{value}</div>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, fontWeight: 500 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Santé des Pixels Publicitaires */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', marginBottom: 24, boxShadow: '0 2px 8px rgba(15,23,42,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
              <Activity size={16} style={{ color: 'var(--accent, #C75B00)' }} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 750, color: '#1f2937' }}>
                Santé des Pixels de Tracking Publicitaire (ROAS)
              </h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, fontWeight: 650, color: '#1f2937' }}>Meta Facebook Pixel</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4, background: stats.meta_pixel_active ? '#dcfce7' : '#f3f4f6', color: stats.meta_pixel_active ? '#166534' : '#6b7280' }}>
                  {stats.meta_pixel_active ? <><CheckCircle2 size={12} /> Actif</> : <><HelpCircle size={12} /> Inactif</>}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, fontWeight: 650, color: '#1f2937' }}>TikTok Pixel</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4, background: stats.tiktok_pixel_active ? '#dcfce7' : '#f3f4f6', color: stats.tiktok_pixel_active ? '#166534' : '#6b7280' }}>
                  {stats.tiktok_pixel_active ? <><CheckCircle2 size={12} /> Actif</> : <><HelpCircle size={12} /> Inactif</>}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, fontWeight: 650, color: '#1f2937' }}>Google Analytics GA4</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4, background: stats.ga4_active ? '#dcfce7' : '#f3f4f6', color: stats.ga4_active ? '#166534' : '#6b7280' }}>
                  {stats.ga4_active ? <><CheckCircle2 size={12} /> Actif</> : <><HelpCircle size={12} /> Inactif</>}
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
