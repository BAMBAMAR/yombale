'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/i18n/context'
import {
  BarChart3, DollarSign, ShoppingCart, Eye, Tag, Activity,
  CheckCircle2, HelpCircle, TrendingUp, Zap, Store, Share2
} from 'lucide-react'
import AnalyticsActivityChart from '../components/AnalyticsActivityChart'
import AnalyticsFilterBar from '../components/AnalyticsFilterBar'
import AnalyticsTopProduitsTable, { TopProduitItem } from '../components/AnalyticsTopProduitsTable'

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

interface AttributionSociale {
  canal: string
  nb_commandes: number
  montant_total: number
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function AnalyticsClient({ boutiques }: { boutiques: { id: string; nom: string }[] }) {
  const { t } = useTranslation()
  const [boutiqueId, setBoutiqueId] = useState(boutiques[0]?.id ?? '')
  const [stats, setStats] = useState<Stats | null>(null)
  const [historique, setHistorique] = useState<Historique[]>([])
  const [attribution, setAttribution] = useState<AttributionSociale[]>([])
  const [topProduits, setTopProduits] = useState<TopProduitItem[]>([])
  const [produits, setProduits] = useState<Array<{ id: string; nom: string }>>([])
  
  // Filtres temporels ad-hoc
  const [activePreset, setActivePreset] = useState<'7j' | '30j' | 'mois' | 'libre'>('30j')
  const [dateDebut, setDateDebut] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return formatDateISO(d)
  })
  const [dateFin, setDateFin] = useState<string>(() => formatDateISO(new Date()))
  const [selectedProduitId, setSelectedProduitId] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // 1. Charger le catalogue des produits pour le filtre
  useEffect(() => {
    if (!boutiqueId) return
    fetch(`/api/boutiques/${boutiqueId}/produits`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const prods = Array.isArray(data) ? data : data?.produits || []
        setProduits(prods.map((p: any) => ({ id: p.id, nom: p.nom || 'Sans nom' })))
      })
      .catch(err => console.warn('[AnalyticsClient:produits]', err))
  }, [boutiqueId])

  // 2. Charger les statistiques avec filtres ad-hoc
  const chargerDonnees = useCallback((customStart?: string, customEnd?: string, customProd?: string) => {
    if (!boutiqueId) return

    const start = customStart !== undefined ? customStart : dateDebut
    const end = customEnd !== undefined ? customEnd : dateFin
    const prod = customProd !== undefined ? customProd : selectedProduitId

    const params = new URLSearchParams()
    if (start) params.set('date_debut', start)
    if (end) params.set('date_fin', end)
    if (prod) params.set('produit_id', prod)

    const cacheKey = `nopalou_analytics_${boutiqueId}_${start}_${end}_${prod}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const data = JSON.parse(cached)
        if (data.stats) setStats(data.stats)
        if (data.historique) setHistorique(data.historique)
        if (data.attribution_sociale) setAttribution(data.attribution_sociale)
        if (data.top_produits) setTopProduits(data.top_produits)
      } catch (e) { console.warn('[AnalyticsClient:cache]', e) }
    }

    if (!cached) setLoading(true)
    setErreur(null)

    fetch(`/api/analytics/boutique/${boutiqueId}?${params.toString()}`)
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error || r.status)).catch(() => Promise.reject(r.statusText)))
      .then(data => {
        setStats(data.stats)
        setHistorique(data.historique ?? [])
        setAttribution(data.attribution_sociale ?? [])
        setTopProduits(data.top_produits ?? [])
        localStorage.setItem(cacheKey, JSON.stringify(data))
      })
      .catch((msg) => {
        if (!cached) setErreur(typeof msg === 'string' ? msg : 'Impossible de charger les statistiques.')
      })
      .finally(() => setLoading(false))
  }, [boutiqueId, dateDebut, dateFin, selectedProduitId])

  useEffect(() => {
    chargerDonnees()
  }, [chargerDonnees])

  // Gestion des Presets rapides
  const handlePresetSelect = (preset: '7j' | '30j' | 'mois' | 'libre') => {
    setActivePreset(preset)
    const now = new Date()
    let newStart = ''
    const newEnd = formatDateISO(now)

    if (preset === '7j') {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      newStart = formatDateISO(d)
    } else if (preset === '30j') {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      newStart = formatDateISO(d)
    } else if (preset === 'mois') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      newStart = formatDateISO(d)
    } else {
      return
    }

    setDateDebut(newStart)
    setDateFin(newEnd)
    chargerDonnees(newStart, newEnd)
  }

  const handleResetFiltres = () => {
    setActivePreset('30j')
    const now = new Date()
    const d = new Date()
    d.setDate(d.getDate() - 30)
    const s = formatDateISO(d)
    const e = formatDateISO(now)
    setDateDebut(s)
    setDateFin(e)
    setSelectedProduitId('')
    chargerDonnees(s, e, '')
  }

  // Export CSV immédiat
  const handleExportCSV = () => {
    if (!historique || historique.length === 0) return

    let csvContent = 'Date;Vues Boutique;Clics Telephone\n'
    historique.forEach(h => {
      csvContent += `${h.jour};${h.vues};${h.clics_tel}\n`
    })

    if (topProduits.length > 0) {
      csvContent += '\n\nTop Ventes Produit;Quantite Vendue;Chiffre d Affaires (FCFA)\n'
      topProduits.forEach(p => {
        csvContent += `"${p.nom_produit.replace(/"/g, '""')}";${p.quantite_vendue};${p.ca_total}\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `analytics-nopalou-${dateDebut}-au-${dateFin}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const n = (v: string | number) => Number(v || 0).toLocaleString('fr-FR')

  if (boutiques.length === 0) {
    return (
      <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <BarChart3 size={40} style={{ color: 'var(--navy, #1C2B4A)', margin: '0 auto 12px' }} />
        <p>Vous n&apos;avez pas encore de boutique.</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}>
      {/* Sélecteur boutique (si multi-boutiques) */}
      {boutiques.length > 1 && (
        <select
          value={boutiqueId}
          onChange={e => setBoutiqueId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, marginBottom: 16, maxWidth: 280 }}
        >
          {boutiques.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
      )}

      {/* Barre de filtrage temporel & ad-hoc */}
      <AnalyticsFilterBar
        dateDebut={dateDebut}
        dateFin={dateFin}
        onDateDebutChange={d => { setDateDebut(d); setActivePreset('libre'); chargerDonnees(d, dateFin); }}
        onDateFinChange={d => { setDateFin(d); setActivePreset('libre'); chargerDonnees(dateDebut, d); }}
        selectedProduitId={selectedProduitId}
        onProduitChange={pId => { setSelectedProduitId(pId); chargerDonnees(dateDebut, dateFin, pId); }}
        produits={produits}
        activePreset={activePreset}
        onPresetSelect={handlePresetSelect}
        onReset={handleResetFiltres}
        onExportCSV={handleExportCSV}
      />

      {loading && <p style={{ color: '#94a3b8' }}>{t('common.loading')}</p>}

      {erreur && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '14px 18px', color: '#dc2626', marginBottom: 16 }}>
          {erreur}
        </div>
      )}

      {stats && !loading && (
        <>
          {/* Mode d'exploitation badge */}
          <div style={{ background: 'var(--card, #FFFFFF)', border: '1px solid var(--border, #E8DDD2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg, #F8F5F0)', border: '1px solid var(--border, #E8DDD2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stats.mode_fonctionnement === 'pure_player' ? <Zap size={18} style={{ color: 'var(--accent, #C75B00)' }} /> : <Store size={18} style={{ color: 'var(--navy, #1C2B4A)' }} />}
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>
                  Mode actif : {stats.mode_fonctionnement === 'pure_player' ? 'Pure Player E-Commerce (100% Web)' : 'Hybride POS (Commerce Physique + Web)'}
                </span>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text2, #6B5E52)' }}>
                  {stats.mode_fonctionnement === 'pure_player' ? 'Interface optimisée pour la vente en ligne sans caisse physique' : 'Interface complète avec caisse enregistreuse POS'}
                </p>
              </div>
            </div>
          </div>

          {/* KPIs Trafic & Conversions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent, #C75B00)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--navy, #1C2B4A)' }}>Performances Trafic &amp; Ventes</h3>
          </div>
          
          <div className="bq-kpi-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Chiffre d\'Affaires Total', value: `${n(stats.total_ventes || 0)} FCFA`, sub: `Comptabilité globale (POS + Web)`, icon: <DollarSign size={18} style={{ color: '#0A5C36' }} />, iconBg: '#E6F4EC' },
              { label: 'Ventes Web 1-Page', value: `${n(stats.total_ventes_web ?? stats.total_ventes ?? 0)} FCFA`, sub: `${n(stats.nb_commandes || 0)} commandes web actives`, icon: <ShoppingCart size={18} style={{ color: '#2563eb' }} />, iconBg: '#eff6ff' },
              { label: 'Vues Boutique', value: n(stats.vues_total), sub: `${n(stats.vues_7j)} cette semaine · ${n(stats.clics_tel_total || 0)} clics contact`, icon: <Eye size={18} style={{ color: 'var(--accent, #C75B00)' }} />, iconBg: '#FFF3E8' },
              { label: 'Coupons Réductions', value: n(stats.utilisations_promo || 0), sub: `${n(stats.nb_promotions || 0)} codes promo créés`, icon: <Tag size={18} style={{ color: '#9333ea' }} />, iconBg: '#faf5ff' },
            ].map(({ label, value, sub, icon, iconBg }) => (
              <div key={label} className="bq-kpi-card" style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-xs)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #6B5E52)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {icon}
                    </div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy, #1C2B4A)', wordBreak: 'break-word', letterSpacing: '-0.02em' }}>{value}</div>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text3, #9C8E84)', marginTop: 8, fontWeight: 500 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Top 10 des Ventes sur la période sélectionnée */}
          {topProduits.length > 0 && (
            <AnalyticsTopProduitsTable topProduits={topProduits} formatMontant={n} />
          )}

          {/* Graphique d'Activité SVG */}
          {historique.length > 0 && <AnalyticsActivityChart historique={historique} />}

          {/* Santé des Pixels Publicitaires */}
          <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
              <Activity size={16} style={{ color: 'var(--accent, #C75B00)' }} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>
                Santé des Pixels de Tracking Publicitaire (ROAS)
              </h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--bg, #F8F5F0)', borderRadius: 10, border: '1px solid var(--border, #E8DDD2)' }}>
                <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--navy, #1C2B4A)' }}>Meta Facebook Pixel</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4, background: stats.meta_pixel_active ? '#dcfce7' : '#f3f4f6', color: stats.meta_pixel_active ? '#166534' : '#6b7280' }}>
                  {stats.meta_pixel_active ? <><CheckCircle2 size={12} /> Actif</> : <><HelpCircle size={12} /> Inactif</>}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--bg, #F8F5F0)', borderRadius: 10, border: '1px solid var(--border, #E8DDD2)' }}>
                <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--navy, #1C2B4A)' }}>TikTok Pixel</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4, background: stats.tiktok_pixel_active ? '#dcfce7' : '#f3f4f6', color: stats.tiktok_pixel_active ? '#166534' : '#6b7280' }}>
                  {stats.tiktok_pixel_active ? <><CheckCircle2 size={12} /> Actif</> : <><HelpCircle size={12} /> Inactif</>}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--bg, #F8F5F0)', borderRadius: 10, border: '1px solid var(--border, #E8DDD2)' }}>
                <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--navy, #1C2B4A)' }}>Google Analytics GA4</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4, background: stats.ga4_active ? '#dcfce7' : '#f3f4f6', color: stats.ga4_active ? '#166534' : '#6b7280' }}>
                  {stats.ga4_active ? <><CheckCircle2 size={12} /> Actif</> : <><HelpCircle size={12} /> Inactif</>}
                </span>
              </div>
            </div>
          </div>

          {/* Attribution Social Commerce */}
          {attribution.length > 0 && (
            <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Share2 size={16} style={{ color: 'var(--accent, #C75B00)' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Attribution Sociale — D&apos;où viennent vos commandes ?</h3>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text2, #6B5E52)' }}>
                Commandes 90 derniers jours par canal d&apos;acquisition (partage produit avec UTM)
              </p>
              {(() => {
                const CANAL_META: Record<string, { label: string; color: string; bg: string }> = {
                  instagram:  { label: 'Instagram',  color: '#db2777', bg: '#fdf2f8' },
                  tiktok:     { label: 'TikTok',     color: '#0f172a', bg: '#f8f8f8' },
                  facebook:   { label: 'Facebook',   color: '#1d4ed8', bg: '#eff6ff' },
                  twitter:    { label: 'X / Twitter', color: '#0f172a', bg: '#f9f9f9' },
                  telegram:   { label: 'Telegram',   color: '#0284c7', bg: '#f0f9ff' },
                  whatsapp:   { label: 'WhatsApp',   color: '#16a34a', bg: '#f0fdf4' },
                  social:     { label: 'Social',     color: '#7c3aed', bg: '#f5f3ff' },
                  direct:     { label: 'Direct',     color: '#64748b', bg: '#f8fafc' },
                };
                const total = attribution.reduce((s, a) => s + a.nb_commandes, 0) || 1;
                return attribution.map(a => {
                  const meta = CANAL_META[a.canal] || { label: a.canal, color: '#64748b', bg: '#f8fafc' };
                  const pct = Math.round((a.nb_commandes / total) * 100);
                  return (
                    <div key={a.canal} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{meta.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>{a.nb_commandes} cmd{a.nb_commandes > 1 ? 's' : ''}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{Number(a.montant_total).toLocaleString('fr-FR')} F</span>
                        </div>
                      </div>
                      <div style={{ background: '#f1f5f9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: meta.color, borderRadius: 6, transition: 'width 0.5s ease', minWidth: pct > 0 ? 4 : 0 }} />
                      </div>
                      <span style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2, display: 'block' }}>{pct}% du total</span>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* Historique du tableau */}
          {historique.length > 0 && (
            <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border, #E8DDD2)', fontWeight: 700, fontSize: 14, color: 'var(--navy, #1C2B4A)' }}>
                Détail de l&apos;activité ({dateDebut} au {dateFin})
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 400 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg, #F8F5F0)', position: 'sticky', top: 0 }}>
                      {['Date', 'Vues boutique', 'Clics tél.'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text2, #6B5E52)', fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historique.map((h) => (
                      <tr key={h.jour} style={{ borderTop: '1px solid var(--border, #E8DDD2)' }}>
                        <td style={{ padding: '8px 14px', color: 'var(--text2, #6B5E52)' }}>{new Date(h.jour).toLocaleDateString('fr-FR')}</td>
                        <td style={{ padding: '8px 14px', fontWeight: Number(h.vues) > 0 ? 700 : 400, color: 'var(--navy, #1C2B4A)' }}>{n(h.vues)}</td>
                        <td style={{ padding: '8px 14px', color: Number(h.clics_tel) > 0 ? 'var(--accent, #C75B00)' : 'var(--text3, #9C8E84)', fontWeight: Number(h.clics_tel) > 0 ? 700 : 400 }}>{n(h.clics_tel)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {historique.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3, #9C8E84)', fontSize: 14 }}>
              Aucune activité enregistrée sur cette période.
            </div>
          )}
        </>
      )}
    </div>
  )
}
